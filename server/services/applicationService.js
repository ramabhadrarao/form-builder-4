import { Application as MongoApplication } from '../models/mongodb/index.js';
import { Application as MySQLApplication } from '../models/mysql/index.js';
import { Form as MongoForm } from '../models/mongodb/index.js';
import { Form as MySQLForm } from '../models/mysql/index.js';
import { FormSubmission as MongoFormSubmission } from '../models/mongodb/index.js';
import { FormSubmission as MySQLFormSubmission } from '../models/mysql/index.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getApplicationModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLApplication : MongoApplication;
};

const getFormModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLForm : MongoForm;
};

const getFormSubmissionModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLFormSubmission : MongoFormSubmission;
};

// Create application
export const createApplication = async (applicationData) => {
  try {
    const ApplicationModel = getApplicationModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ApplicationModel.create(applicationData);
    } else {
      const application = new ApplicationModel(applicationData);
      return await application.save();
    }
  } catch (error) {
    logger.error('Error creating application:', error);
    throw error;
  }
};

// Get applications with pagination and filters
export const getApplications = async (filters = {}, options = {}) => {
  try {
    const ApplicationModel = getApplicationModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.search) {
        const { Op } = await import('sequelize');
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await ApplicationModel.findAndCountAll({
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
        applications: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } else {
      const query = {};
      
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const total = await ApplicationModel.countDocuments(query);
      const applications = await ApplicationModel.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        applications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting applications:', error);
    throw error;
  }
};

// Get application by ID
export const getApplicationById = async (id) => {
  try {
    const ApplicationModel = getApplicationModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ApplicationModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await ApplicationModel.findById(id)
        .populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error getting application by ID:', error);
    throw error;
  }
};

// Update application
export const updateApplication = async (id, updateData) => {
  try {
    const ApplicationModel = getApplicationModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await ApplicationModel.update(updateData, { where: { id } });
      return await ApplicationModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await ApplicationModel.findByIdAndUpdate(id, updateData, { 
        new: true 
      }).populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating application:', error);
    throw error;
  }
};

// Delete application
export const deleteApplication = async (id) => {
  try {
    const ApplicationModel = getApplicationModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await ApplicationModel.destroy({ where: { id } });
    } else {
      return await ApplicationModel.findByIdAndDelete(id);
    }
  } catch (error) {
    logger.error('Error deleting application:', error);
    throw error;
  }
};

// Get application statistics
export const getApplicationStats = async (applicationId) => {
  try {
    const FormModel = getFormModel();
    const FormSubmissionModel = getFormSubmissionModel();

    let formsCount, submissionsCount, activeFormsCount;

    if (process.env.DB_TYPE === 'mysql') {
      formsCount = await FormModel.count({
        where: { applicationId }
      });

      submissionsCount = await FormSubmissionModel.count({
        where: { applicationId }
      });

      activeFormsCount = await FormModel.count({
        where: { 
          applicationId,
          status: 'active'
        }
      });
    } else {
      formsCount = await FormModel.countDocuments({ applicationId });
      submissionsCount = await FormSubmissionModel.countDocuments({ applicationId });
      activeFormsCount = await FormModel.countDocuments({ 
        applicationId, 
        status: 'active' 
      });
    }

    // Get recent submissions
    let recentSubmissions;
    if (process.env.DB_TYPE === 'mysql') {
      recentSubmissions = await FormSubmissionModel.findAll({
        where: { applicationId },
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{
          association: 'submitter',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      recentSubmissions = await FormSubmissionModel.find({ applicationId })
        .populate('submittedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5);
    }

    return {
      formsCount,
      submissionsCount,
      activeFormsCount,
      recentSubmissions
    };
  } catch (error) {
    logger.error('Error getting application stats:', error);
    throw error;
  }
};