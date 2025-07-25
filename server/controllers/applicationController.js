import { v4 as uuidv4 } from 'uuid';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getApplicationStats
} from '../services/applicationService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Create new application
export const createApplicationHandler = asyncHandler(async (req, res) => {
  const { name, description, settings } = req.body;
  const userId = req.user.id || req.user._id;

  const applicationData = {
    applicationId: uuidv4(),
    name,
    description,
    createdBy: userId,
    status: 'active',
    settings: {
      theme: 'default',
      allowGuestAccess: false,
      enableWorkflows: true,
      enableReports: true,
      ...settings
    }
  };

  const application = await createApplication(applicationData);

  logger.info(`Application created: ${name} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Application created successfully',
    data: { application }
  });
});

// Get all applications
export const getApplicationsHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const filters = {};
  
  // If not super admin, only show user's applications
  if (userRole !== 'super_admin') {
    filters.createdBy = userId;
  }

  if (search) {
    filters.search = search;
  }

  if (status) {
    filters.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getApplications(filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Get single application
export const getApplicationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check permission to view
  if (userRole !== 'super_admin' && 
      (application.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { application }
  });
});

// Update application
export const updateApplicationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status, settings } = req.body;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check permission to update
  if (userRole !== 'super_admin' && 
      (application.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (status) updateData.status = status;
  if (settings) updateData.settings = { ...application.settings, ...settings };

  const updatedApplication = await updateApplication(id, updateData);

  logger.info(`Application updated: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Application updated successfully',
    data: { application: updatedApplication }
  });
});

// Delete application
export const deleteApplicationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check permission to delete
  if (userRole !== 'super_admin' && 
      (application.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await deleteApplication(id);

  logger.info(`Application deleted: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Application deleted successfully'
  });
});

// Get application statistics
export const getApplicationStatsHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check permission to view stats
  if (userRole !== 'super_admin' && 
      (application.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const stats = await getApplicationStats(application.applicationId || id);

  res.json({
    success: true,
    data: { stats }
  });
});

export {
  createApplicationHandler as createApplication,
  getApplicationsHandler as getApplications,
  getApplicationHandler as getApplication,
  updateApplicationHandler as updateApplication,
  deleteApplicationHandler as deleteApplication,
  getApplicationStatsHandler as getApplicationStats
};