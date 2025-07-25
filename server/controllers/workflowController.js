import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflowAction
} from '../services/workflowService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Create new workflow
export const createWorkflowHandler = asyncHandler(async (req, res) => {
  const { name, description, applicationId, formId, stages, transitions, settings } = req.body;
  const userId = req.user.id || req.user._id;

  const workflowData = {
    name,
    description,
    applicationId,
    formId,
    stages,
    transitions: transitions || [],
    settings: {
      autoProgress: false,
      enableEscalation: false,
      escalationTime: 24,
      ...settings
    },
    createdBy: userId
  };

  const workflow = await createWorkflow(workflowData);

  logger.info(`Workflow created: ${name} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: { workflow }
  });
});

// Get all workflows
export const getWorkflowsHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, applicationId, formId } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const filters = {};
  
  if (applicationId) {
    filters.applicationId = applicationId;
  }
  
  if (formId) {
    filters.formId = formId;
  }
  
  // If not super admin, only show user's workflows
  if (userRole !== 'super_admin') {
    filters.createdBy = userId;
  }

  if (search) {
    filters.search = search;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getWorkflows(filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Get single workflow
export const getWorkflowHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const workflow = await getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Check permission to view
  if (userRole !== 'super_admin' && 
      (workflow.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { workflow }
  });
});

// Update workflow
export const updateWorkflowHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, stages, transitions, settings } = req.body;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const workflow = await getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Check permission to update
  if (userRole !== 'super_admin' && 
      (workflow.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (stages) updateData.stages = stages;
  if (transitions) updateData.transitions = transitions;
  if (settings) updateData.settings = { ...workflow.settings, ...settings };

  const updatedWorkflow = await updateWorkflow(id, updateData);

  logger.info(`Workflow updated: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Workflow updated successfully',
    data: { workflow: updatedWorkflow }
  });
});

// Delete workflow
export const deleteWorkflowHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const workflow = await getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Check permission to delete
  if (userRole !== 'super_admin' && 
      (workflow.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await deleteWorkflow(id);

  logger.info(`Workflow deleted: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Workflow deleted successfully'
  });
});

// Execute workflow action
export const executeWorkflowHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { submissionId, action, comments } = req.body;
  const userId = req.user.id || req.user._id;

  const workflow = await getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  const result = await executeWorkflowAction(workflow, submissionId, action, userId, comments);

  logger.info(`Workflow action executed: ${action} on ${submissionId} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Workflow action executed successfully',
    data: result
  });
});

// Get workflow history
export const getWorkflowHistoryHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { submissionId } = req.query;

  const workflow = await getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Get form submission to check workflow history
  const { getFormSubmissionById } = await import('../services/formService.js');
  const submission = await getFormSubmissionById(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found'
    });
  }

  const history = submission.workflowState?.history || [];

  res.json({
    success: true,
    data: { history }
  });
});

export {
  createWorkflowHandler as createWorkflow,
  getWorkflowsHandler as getWorkflows,
  getWorkflowHandler as getWorkflow,
  updateWorkflowHandler as updateWorkflow,
  deleteWorkflowHandler as deleteWorkflow,
  executeWorkflowHandler as executeWorkflow,
  getWorkflowHistoryHandler as getWorkflowHistory
};