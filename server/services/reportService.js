import { v4 as uuidv4 } from 'uuid';
import { Report as MongoReport } from '../models/mongodb/index.js';
import { Report as MySQLReport } from '../models/mysql/index.js';
import { FormSubmission as MongoFormSubmission } from '../models/mongodb/index.js';
import { FormSubmission as MySQLFormSubmission } from '../models/mysql/index.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getReportModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLReport : MongoReport;
};

const getFormSubmissionModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLFormSubmission : MongoFormSubmission;
};

// Create report
export const createReport = async (reportData) => {
  try {
    const ReportModel = getReportModel();
    
    const reportWithId = {
      ...reportData,
      reportId: reportData.reportId || uuidv4()
    };
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ReportModel.create(reportWithId);
    } else {
      const report = new ReportModel(reportWithId);
      return await report.save();
    }
  } catch (error) {
    logger.error('Error creating report:', error);
    throw error;
  }
};

// Get reports with pagination and filters
export const getReports = async (filters = {}, options = {}) => {
  try {
    const ReportModel = getReportModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (filters.applicationId) {
        whereClause.applicationId = filters.applicationId;
      }
      
      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }
      
      if (filters.type) {
        whereClause.type = filters.type;
      }
      
      if (filters.search) {
        const { Op } = await import('sequelize');
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await ReportModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      return {
        reports: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } else {
      const query = {};
      
      if (filters.applicationId) {
        query.applicationId = filters.applicationId;
      }
      
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const total = await ReportModel.countDocuments(query);
      const reports = await ReportModel.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        reports,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting reports:', error);
    throw error;
  }
};

// Get report by ID
export const getReportById = async (id) => {
  try {
    const ReportModel = getReportModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ReportModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await ReportModel.findById(id)
        .populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error getting report by ID:', error);
    throw error;
  }
};

// Update report
export const updateReport = async (id, updateData) => {
  try {
    const ReportModel = getReportModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await ReportModel.update(updateData, { where: { id } });
      return await ReportModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await ReportModel.findByIdAndUpdate(id, updateData, { 
        new: true 
      }).populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating report:', error);
    throw error;
  }
};

// Delete report
export const deleteReport = async (id) => {
  try {
    const ReportModel = getReportModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ReportModel.destroy({ where: { id } });
    } else {
      return await ReportModel.findByIdAndDelete(id);
    }
  } catch (error) {
    logger.error('Error deleting report:', error);
    throw error;
  }
};

// Generate report data
export const generateReportData = async (report, filters = {}) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    
    // Build query based on report configuration and filters
    let query = {
      formId: report.sourceForm,
      applicationId: report.applicationId
    };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (process.env.DB_TYPE === 'mysql') {
        const { Op } = await import('sequelize');
        query.createdAt = {
          [Op.between]: [new Date(start), new Date(end)]
        };
      } else {
        query.createdAt = {
          $gte: new Date(start),
          $lte: new Date(end)
        };
      }
    }

    // Get submissions
    let submissions;
    if (process.env.DB_TYPE === 'mysql') {
      submissions = await FormSubmissionModel.findAll({
        where: query,
        include: [{
          association: 'submitter',
          attributes: ['firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']]
      });
    } else {
      submissions = await FormSubmissionModel.find(query)
        .populate('submittedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    // Process data based on report configuration
    const { columns, aggregations, grouping } = report.configuration;
    
    let processedData = submissions.map(submission => {
      const data = submission.data || {};
      const result = {};
      
      // Include specified columns
      if (columns && columns.length > 0) {
        columns.forEach(column => {
          result[column.field] = data[column.field] || '';
        });
      } else {
        // Include all data if no columns specified
        Object.assign(result, data);
      }
      
      // Add metadata
      result._id = submission.id || submission._id;
      result._status = submission.status;
      result._createdAt = submission.createdAt;
      result._submittedBy = submission.submittedBy || submission.submitter;
      
      return result;
    });

    // Apply grouping if specified
    if (grouping && grouping.field) {
      const grouped = {};
      processedData.forEach(item => {
        const groupKey = item[grouping.field] || 'Unknown';
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(item);
      });
      processedData = grouped;
    }

    // Apply aggregations if specified
    if (aggregations && aggregations.length > 0) {
      const aggregatedData = {};
      
      aggregations.forEach(agg => {
        const { field, operation } = agg;
        const values = processedData
          .map(item => parseFloat(item[field]) || 0)
          .filter(val => !isNaN(val));
        
        switch (operation) {
          case 'sum':
            aggregatedData[`${field}_sum`] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregatedData[`${field}_avg`] = values.length > 0 ? 
              values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            aggregatedData[`${field}_count`] = values.length;
            break;
          case 'min':
            aggregatedData[`${field}_min`] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            aggregatedData[`${field}_max`] = values.length > 0 ? Math.max(...values) : 0;
            break;
        }
      });
      
      return {
        data: processedData,
        aggregations: aggregatedData,
        total: submissions.length
      };
    }

    return {
      data: processedData,
      total: submissions.length
    };
  } catch (error) {
    logger.error('Error generating report data:', error);
    throw error;
  }
};