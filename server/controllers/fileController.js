import { GridFSBucket } from 'mongodb';
import { mongoConnection } from '../config/database.js';
import { File as MongoFile } from '../models/mongodb/index.js';
import { File as MySQLFile } from '../models/mysql/index.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Determine which model to use based on DB_TYPE
const getFileModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLFile : MongoFile;
};

// Upload file
export const uploadFile = asyncHandler(async (req, res) => {
  const files = req.files || [req.file];
  const { applicationId, formId, fieldId } = req.body;
  const userId = req.user.id || req.user._id;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const uploadedFiles = [];

  for (const file of files) {
    try {
      let fileData;
      
      if (process.env.DB_TYPE === 'mongodb' && mongoConnection) {
        // Use GridFS for MongoDB
        const bucket = new GridFSBucket(mongoConnection.db, { bucketName: 'uploads' });
        
        // Process image if it's an image file
        let processedBuffer = file.buffer;
        if (file.mimetype.startsWith('image/')) {
          // Create thumbnail
          processedBuffer = await sharp(file.buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
        }

        const uploadStream = bucket.openUploadStream(file.originalname, {
          metadata: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: userId,
            applicationId,
            formId,
            fieldId
          }
        });

        const gridFSFile = await new Promise((resolve, reject) => {
          uploadStream.end(processedBuffer);
          uploadStream.on('finish', () => resolve(uploadStream));
          uploadStream.on('error', reject);
        });

        fileData = {
          filename: gridFSFile.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `gridfs://${gridFSFile.id}`,
          uploadedBy: userId,
          applicationId,
          formId,
          fieldId,
          metadata: {
            gridfsId: gridFSFile.id
          }
        };
      } else {
        // Use file system for MySQL or fallback
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `${Date.now()}-${file.originalname}`;
        const filepath = path.join(uploadDir, filename);

        // Process image if it's an image file
        if (file.mimetype.startsWith('image/')) {
          await sharp(file.buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(filepath);
        } else {
          fs.writeFileSync(filepath, file.buffer);
        }

        fileData = {
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: filepath,
          uploadedBy: userId,
          applicationId,
          formId,
          fieldId
        };
      }

      // Save file metadata to database
      const FileModel = getFileModel();
      let savedFile;
      
      if (process.env.DB_TYPE === 'mysql') {
        savedFile = await FileModel.create(fileData);
      } else {
        const fileDoc = new FileModel(fileData);
        savedFile = await fileDoc.save();
      }

      uploadedFiles.push(savedFile);
      
      logger.info(`File uploaded: ${file.originalname} by user ${req.user.email}`);
    } catch (error) {
      logger.error(`Error uploading file ${file.originalname}:`, error);
      // Continue with other files
    }
  }

  if (uploadedFiles.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload any files'
    });
  }

  res.status(201).json({
    success: true,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
    data: { files: uploadedFiles }
  });
});

// Get file
export const getFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const FileModel = getFileModel();
  let file;
  
  if (process.env.DB_TYPE === 'mysql') {
    file = await FileModel.findByPk(id);
  } else {
    file = await FileModel.findById(id);
  }

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  try {
    if (file.path.startsWith('gridfs://') && mongoConnection) {
      // Serve from GridFS
      const bucket = new GridFSBucket(mongoConnection.db, { bucketName: 'uploads' });
      const gridfsId = file.metadata?.gridfsId;
      
      if (!gridfsId) {
        return res.status(404).json({
          success: false,
          message: 'File data not found'
        });
      }

      const downloadStream = bucket.openDownloadStream(gridfsId);
      
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`
      });

      downloadStream.pipe(res);
      
      downloadStream.on('error', (error) => {
        logger.error('Error streaming file from GridFS:', error);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: 'File not found'
          });
        }
      });
    } else {
      // Serve from file system
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on disk'
        });
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`
      });

      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        logger.error('Error streaming file from disk:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading file'
          });
        }
      });
    }
  } catch (error) {
    logger.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file'
    });
  }
});

// Delete file
export const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const FileModel = getFileModel();
  let file;
  
  if (process.env.DB_TYPE === 'mysql') {
    file = await FileModel.findByPk(id);
  } else {
    file = await FileModel.findById(id);
  }

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Check permission to delete
  if (userRole !== 'super_admin' && 
      (file.uploadedBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    // Delete from storage
    if (file.path.startsWith('gridfs://') && mongoConnection) {
      // Delete from GridFS
      const bucket = new GridFSBucket(mongoConnection.db, { bucketName: 'uploads' });
      const gridfsId = file.metadata?.gridfsId;
      
      if (gridfsId) {
        await bucket.delete(gridfsId);
      }
    } else {
      // Delete from file system
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    // Delete from database
    if (process.env.DB_TYPE === 'mysql') {
      await FileModel.destroy({ where: { id } });
    } else {
      await FileModel.findByIdAndDelete(id);
    }

    logger.info(`File deleted: ${file.originalName} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
});

// Get file list
export const getFileList = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, applicationId, formId, fieldId } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const FileModel = getFileModel();
  const offset = (page - 1) * limit;

  try {
    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (applicationId) {
        whereClause.applicationId = applicationId;
      }
      
      if (formId) {
        whereClause.formId = formId;
      }
      
      if (fieldId) {
        whereClause.fieldId = fieldId;
      }
      
      // If not admin, only show user's files
      if (!['super_admin', 'admin'].includes(userRole)) {
        whereClause.uploadedBy = userId;
      }

      const { count, rows } = await FileModel.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          association: 'uploader',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      res.json({
        success: true,
        data: {
          files: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } else {
      const query = {};
      
      if (applicationId) {
        query.applicationId = applicationId;
      }
      
      if (formId) {
        query.formId = formId;
      }
      
      if (fieldId) {
        query.fieldId = fieldId;
      }
      
      // If not admin, only show user's files
      if (!['super_admin', 'admin'].includes(userRole)) {
        query.uploadedBy = userId;
      }

      const total = await FileModel.countDocuments(query);
      const files = await FileModel.find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error getting file list:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files'
    });
  }
});