import { v4 as uuidv4 } from 'uuid';
import { Workflow as MongoWorkflow } from '../models/mongodb/index.js';
import { Workflow as MySQLWorkflow } from '../models/mysql/index.js';
import { updateFormSubmission } from './formService.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getWorkflowModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLWorkflow : MongoWorkflow;
};

// Create workflow
export const createWorkflow = async (workflowData) => {
  try {
    const WorkflowModel = getWorkflowModel();
    
    const workflowWithId = {
      ...workflowData,
      workflowId: workflowData.workflowId || uuidv4()
    };
    
    if (process.env.DB_TYPE === 'mysql') {
      return await WorkflowModel.create(workflowWithId);
    } else {
      const workflow = new WorkflowModel(workflowWithId);
      return await workflow.save();
    }
  } catch (error) {
    logger.error('Error creating workflow:', error);
    throw error;
  }
};

// Get workflows with pagination and filters
export const getWorkflows = async (filters = {}, options = {}) => {
  try {
    const WorkflowModel = getWorkflowModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (filters.applicationId) {
        whereClause.applicationId = filters.applicationId;
      }
      
      if (filters.formId) {
        whereClause.formId = filters.formId;
      }
      
      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }
      
      if (filters.search) {
        const { Op } = await import('sequelize');
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await WorkflowModel.findAndCountAll({
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
        workflows: rows,
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
      
      if (filters.formId) {
        query.formId = filters.formId;
      }
      
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const total = await WorkflowModel.countDocuments(query);
      const workflows = await WorkflowModel.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        workflows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting workflows:', error);
    throw error;
  }
};

// Get workflow by ID
export const getWorkflowById = async (id) => {
  try {
    const WorkflowModel = getWorkflowModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await WorkflowModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await WorkflowModel.findById(id)
        .populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error getting workflow by ID:', error);
    throw error;
  }
};

// Update workflow
export const updateWorkflow = async (id, updateData) => {
  try {
    const WorkflowModel = getWorkflowModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await WorkflowModel.update(updateData, { where: { id } });
      return await WorkflowModel.findByPk(id, {
        include: [{
          association: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await WorkflowModel.findByIdAndUpdate(id, updateData, { 
        new: true 
      }).populate('createdBy', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating workflow:', error);
    throw error;
  }
};

// Delete workflow
export const deleteWorkflow = async (id) => {
  try {
    const WorkflowModel = getWorkflowModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await WorkflowModel.destroy({ where: { id } });
    } else {
      return await WorkflowModel.findByIdAndDelete(id);
    }
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    throw error;
  }
};

// Execute workflow action
export const executeWorkflowAction = async (workflow, submissionId, action, userId, comments = '') => {
  try {
    const { getFormSubmissionById } = await import('./formService.js');
    const submission = await getFormSubmissionById(submissionId);

    if (!submission) {
      throw new Error('Submission not found');
    }

    const currentStage = submission.workflowState?.currentStage || workflow.stages[0]?.id;
    const currentStageConfig = workflow.stages.find(stage => stage.id === currentStage);

    if (!currentStageConfig) {
      throw new Error('Invalid workflow stage');
    }

    // Check if user has permission to perform this action
    const canPerformAction = checkWorkflowPermission(currentStageConfig, userId, action);
    if (!canPerformAction) {
      throw new Error('User does not have permission to perform this action');
    }

    // Find next stage based on action and transitions
    const nextStage = findNextStage(workflow, currentStage, action);
    
    // Update workflow state
    const workflowState = submission.workflowState || {
      currentStage: workflow.stages[0]?.id,
      history: []
    };

    // Add to history
    workflowState.history.push({
      stage: currentStage,
      action,
      user: userId,
      timestamp: new Date(),
      comments
    });

    // Update current stage if there's a transition
    if (nextStage) {
      workflowState.currentStage = nextStage;
    }

    // Update submission status based on workflow stage
    let newStatus = submission.status;
    if (action === 'approve') {
      newStatus = nextStage ? 'in_review' : 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'submit') {
      newStatus = 'submitted';
    }

    // Update the form submission
    await updateFormSubmission(submissionId, {
      workflowState,
      status: newStatus
    });

    return {
      currentStage: workflowState.currentStage,
      status: newStatus,
      history: workflowState.history
    };
  } catch (error) {
    logger.error('Error executing workflow action:', error);
    throw error;
  }
};

// Helper function to check workflow permissions
function checkWorkflowPermission(stageConfig, userId, action) {
  // Check if action is allowed in this stage
  if (!stageConfig.actions.includes(action)) {
    return false;
  }

  // Check if user has the required role
  if (stageConfig.role && !checkUserRole(userId, stageConfig.role)) {
    return false;
  }

  // Check if user is in the allowed users list
  if (stageConfig.users && stageConfig.users.length > 0) {
    return stageConfig.users.includes(userId.toString());
  }

  return true;
}

// Helper function to find next stage
function findNextStage(workflow, currentStage, action) {
  const transition = workflow.transitions.find(t => 
    t.from === currentStage && 
    (t.action === action || !t.action)
  );

  if (transition) {
    // Check transition conditions if any
    if (transition.condition) {
      // For now, we'll assume conditions are met
      // In a real implementation, you'd evaluate the condition
      return transition.to;
    }
    return transition.to;
  }

  return null;
}

// Helper function to check user role (simplified)
function checkUserRole(userId, requiredRole) {
  // In a real implementation, you'd fetch the user and check their role
  // For now, we'll assume the check passes
  return true;
}