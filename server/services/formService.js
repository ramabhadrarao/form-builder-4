import { v4 as uuidv4 } from 'uuid';
import { Form as MongoForm } from '../models/mongodb/index.js';
import { Form as MySQLForm } from '../models/mysql/index.js';
import { FormSubmission as MongoFormSubmission } from '../models/mongodb/index.js';
import { FormSubmission as MySQLFormSubmission } from '../models/mysql/index.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getFormModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLForm : MongoForm;
};

const getFormSubmissionModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLFormSubmission : MongoFormSubmission;
};

// Create form
export const createForm = async (formData) => {
  try {
    const FormModel = getFormModel();
    
    const formWithId = {
      ...formData,
      formId: formData.formId || uuidv4()
    };
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormModel.create(formWithId);
    } else {
      const form = new FormModel(formWithId);
      return await form.save();
    }
  } catch (error) {
    logger.error('Error creating form:', error);
    throw error;
  }
};

// Get forms with pagination and filters
export const getForms = async (filters = {}, options = {}) => {
  try {
    const FormModel = getFormModel();
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

      const { count, rows } = await FormModel.findAndCountAll({
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
        forms: rows,
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
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const total = await FormModel.countDocuments(query);
      const forms = await FormModel.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        forms,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting forms:', error);
    throw error;
  }
};

// Get form by ID
export const getFormById = async (id) => {
  try {
    const FormModel = getFormModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await FormModel.findById(id)
        .populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error getting form by ID:', error);
    throw error;
  }
};

// Update form
export const updateForm = async (id, updateData) => {
  try {
    const FormModel = getFormModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await FormModel.update(updateData, { where: { id } });
      return await FormModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await FormModel.findByIdAndUpdate(id, updateData, { 
        new: true 
      }).populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating form:', error);
    throw error;
  }
};

// Delete form
export const deleteForm = async (id) => {
  try {
    const FormModel = getFormModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormModel.destroy({ where: { id } });
    } else {
      return await FormModel.findByIdAndDelete(id);
    }
  } catch (error) {
    logger.error('Error deleting form:', error);
    throw error;
  }
};

// Submit form data
export const submitForm = async (submissionData) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    
    const submissionWithId = {
      ...submissionData,
      submissionId: submissionData.submissionId || uuidv4()
    };
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormSubmissionModel.create(submissionWithId);
    } else {
      const submission = new FormSubmissionModel(submissionWithId);
      return await submission.save();
    }
  } catch (error) {
    logger.error('Error submitting form:', error);
    throw error;
  }
};

// Get form submissions
export const getFormSubmissions = async (formId, filters = {}, options = {}) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = { formId };
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.submittedBy) {
        whereClause.submittedBy = filters.submittedBy;
      }

      const { count, rows } = await FormSubmissionModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          association: 'submitter',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      return {
        submissions: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } else {
      const query = { formId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.submittedBy) {
        query.submittedBy = filters.submittedBy;
      }

      const total = await FormSubmissionModel.countDocuments(query);
      const submissions = await FormSubmissionModel.find(query)
        .populate('submittedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        submissions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting form submissions:', error);
    throw error;
  }
};

// Get form submission by ID
export const getFormSubmissionById = async (submissionId) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormSubmissionModel.findOne({
        where: { submissionId },
        include: [{
          association: 'submitter',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await FormSubmissionModel.findOne({ submissionId })
        .populate('submittedBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error getting form submission by ID:', error);
    throw error;
  }
};

// Update form submission
export const updateFormSubmission = async (submissionId, updateData) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await FormSubmissionModel.update(updateData, { 
        where: { submissionId } 
      });
      return await FormSubmissionModel.findOne({
        where: { submissionId },
        include: [{
          association: 'submitter',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await FormSubmissionModel.findOneAndUpdate(
        { submissionId }, 
        updateData, 
        { new: true }
      ).populate('submittedBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating form submission:', error);
    throw error;
  }
};

// Delete form submission
export const deleteFormSubmission = async (submissionId) => {
  try {
    const FormSubmissionModel = getFormSubmissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await FormSubmissionModel.destroy({ 
        where: { submissionId } 
      });
    } else {
      return await FormSubmissionModel.findOneAndDelete({ submissionId });
    }
  } catch (error) {
    logger.error('Error deleting form submission:', error);
    throw error;
  }
};

// Duplicate form
export const duplicateForm = async (formId, userId) => {
  try {
    const form = await getFormById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const duplicatedForm = {
      ...form.toObject ? form.toObject() : form.dataValues,
      formId: uuidv4(),
      name: `${form.name} (Copy)`,
      createdBy: userId,
      status: 'draft'
    };

    // Remove ID fields
    delete duplicatedForm.id;
    delete duplicatedForm._id;
    delete duplicatedForm.createdAt;
    delete duplicatedForm.updatedAt;

    return await createForm(duplicatedForm);
  } catch (error) {
    logger.error('Error duplicating form:', error);
    throw error;
  }
};