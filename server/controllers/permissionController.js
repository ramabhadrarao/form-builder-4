import {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission,
  getUserPermissions,
  checkPermission
} from '../services/permissionService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Create new permission
export const createPermissionHandler = asyncHandler(async (req, res) => {
  const { resource, resourceId, user, role, permissions, fieldPermissions, applicationId } = req.body;

  const permissionData = {
    resource,
    resourceId,
    user,
    role,
    permissions,
    fieldPermissions,
    applicationId
  };

  const permission = await createPermission(permissionData);

  logger.info(`Permission created for user ${user} on ${resource} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Permission created successfully',
    data: { permission }
  });
});

// Get all permissions
export const getPermissionsHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, resource, user, applicationId } = req.query;

  const filters = {};
  
  if (resource) {
    filters.resource = resource;
  }
  
  if (user) {
    filters.user = user;
  }
  
  if (applicationId) {
    filters.applicationId = applicationId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getPermissions(filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Update permission
export const updatePermissionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, fieldPermissions } = req.body;

  const updateData = {};
  if (permissions) updateData.permissions = permissions;
  if (fieldPermissions) updateData.fieldPermissions = fieldPermissions;

  const updatedPermission = await updatePermission(id, updateData);

  if (!updatedPermission) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found'
    });
  }

  logger.info(`Permission updated: ${id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Permission updated successfully',
    data: { permission: updatedPermission }
  });
});

// Delete permission
export const deletePermissionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await deletePermission(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Permission not found'
    });
  }

  logger.info(`Permission deleted: ${id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Permission deleted successfully'
  });
});

// Get user permissions
export const getUserPermissionsHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { applicationId } = req.query;

  const permissions = await getUserPermissions(userId, applicationId);

  res.json({
    success: true,
    data: { permissions }
  });
});

// Check user permission
export const checkUserPermissionHandler = asyncHandler(async (req, res) => {
  const { resource, action, resourceId } = req.body;
  const userId = req.user.id || req.user._id;

  const hasPermission = await checkPermission(userId, resource, action, resourceId);

  res.json({
    success: true,
    data: { hasPermission }
  });
});

export {
  createPermissionHandler as createPermission,
  getPermissionsHandler as getPermissions,
  updatePermissionHandler as updatePermission,
  deletePermissionHandler as deletePermission,
  getUserPermissionsHandler as getUserPermissions,
  checkUserPermissionHandler as checkUserPermission
};