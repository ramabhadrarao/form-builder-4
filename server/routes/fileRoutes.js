import express from 'express';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import { mongoConnection } from '../config/database.js';
import {
  uploadFile,
  getFile,
  deleteFile,
  getFileList
} from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'
    ];
    
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not allowed`), false);
    }
  }
});

// File upload routes
router.post('/upload', 
  authenticate, 
  upload.single('file'), 
  uploadFile
);

router.post('/upload-multiple', 
  authenticate, 
  upload.array('files', 10), 
  uploadFile
);

router.get('/', authenticate, getFileList);

router.get('/:id', getFile);

router.delete('/:id', authenticate, deleteFile);

export default router;