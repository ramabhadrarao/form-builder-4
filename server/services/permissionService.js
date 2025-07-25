import { Permission as MongoPermission } from '../models/mongodb/index.js';
import { Permission as MySQLPermission } from '../models/mysql/index.js';
import { getUserById } from './userService.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getPermissionModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLPermission : MongoPermission;
};

// Create permission
export const createPermission = async (permissionData) => {
  try {
    const PermissionModel = getPermissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await PermissionModel.create(permissionData);
    } else {
      const permission = new PermissionModel(permissionData);
      return await permission.save();
    }
  } catch (error) {
    logger.error('Error creating permission:', error);
    throw error;
  }
};

// Get permissions with pagination and filters
export const getPermissions = async (filters = {}, options = {}) => {
  try {
    const PermissionModel = getPermissionModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (filters.resource) {
        whereClause.resource = filters.resource;
      }
      
      if (filters.user) {
        whereClause.user = filters.user;
      }
      
      if (filters.applicationId) {
        whereClause.applicationId = filters.applicationId;
      }

      const { count, rows } = await PermissionModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          association: 'userDetails',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      return {
        permissions: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } else {
      const query = {};
      
      if (filters.resource) {
        query.resource = filters.resource;
      }
      
      if (filters.user) {
        query.user = filters.user;
      }
      
      if (filters.applicationId) {
        query.applicationId = filters.applicationId;
      }

      const total = await PermissionModel.countDocuments(query);
      const permissions = await PermissionModel.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        permissions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting permissions:', error);
    throw error;
  }
};

// Update permission
export const updatePermission = async (id, updateData) => {
  try {
    const PermissionModel = getPermissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      const [updatedRows] = await PermissionModel.update(updateData, { 
        where: { id },
        returning: true
      });
      
      if (updatedRows === 0) {
        return null;
      }
      
      return await PermissionModel.findByPk(id, {
        include: [{
          association: 'userDetails',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    } else {
      return await PermissionModel.findByIdAndUpdate(id, updateData, { 
        new: true 
      }).populate('user', 'firstName lastName email');
    }
  } catch (error) {
    logger.error('Error updating permission:', error);
    throw error;
  }
};

// Delete permission
export const deletePermission = async (id) => {
  try {
    const PermissionModel = getPermissionModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      const deletedRows = await PermissionModel.destroy({ where: { id } });
      return deletedRows > 0;
    } else {
      const result = await PermissionModel.findByIdAndDelete(id);
      return result !== null;
    }
  } catch (error) {
    logger.error('Error deleting permission:', error);
    throw error;
  }
};

// Get user permissions
export const getUserPermissions = async (userId, applicationId = null) => {
  try {
    const PermissionModel = getPermissionModel();
    
    let query = { user: userId };
    if (applicationId) {
      query.applicationId = applicationId;
    }

    if (process.env.DB_TYPE === 'mysql') {
      return await PermissionModel.findAll({
        where: query,
        order: [['createdAt', 'DESC']]
      });
    } else {
      return await PermissionModel.find(query)
        .sort({ createdAt: -1 });
    }
  } catch (error) {
    logger.error('Error getting user permissions:', error);
    throw error;
  }
};

// Check if user has specific permission
export const checkPermission = async (userId, resource, action, resourceId = null) => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    // Check user's global permissions first
    if (user.permissions && Array.isArray(user.permissions)) {
      const globalPermission = user.permissions.find(perm => 
        perm.resource === resource || perm.resource === '*'
      );
      
      if (globalPermission && globalPermission.actions.includes(action)) {
        return true;
      }
    }

    // Check specific permissions
    const PermissionModel = getPermissionModel();
    
    let query = {
      user: userId,
      resource
    };
    
    if (resourceId) {
      query.resourceId = resourceId;
    }

    let permission;
    if (process.env.DB_TYPE === 'mysql') {
      permission = await PermissionModel.findOne({ where: query });
    } else {
      permission = await PermissionModel.findOne(query);
    }

    if (!permission) {
      return false;
    }

    // Check if the specific action is allowed
    return permission.permissions && permission.permissions[action] === true;
  } catch (error) {
    logger.error('Error checking permission:', error);
    return false;
  }
};

// Check field-level permission
export const checkFieldPermission = async (userId, resource, resourceId, fieldName, action) => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    const PermissionModel = getPermissionModel();
    
    let query = {
      user: userId,
      resource,
      resourceId
    };

    let permission;
    if (process.env.DB_TYPE === 'mysql') {
      permission = await PermissionModel.findOne({ where: query });
    } else {
      permission = await PermissionModel.findOne(query);
    }

    if (!permission || !permission.fieldPermissions) {
      // Fall back to general permission
      return await checkPermission(userId, resource, action, resourceId);
    }

    const fieldPermission = permission.fieldPermissions[fieldName];
    if (!fieldPermission) {
      // Field not specifically configured, use general permission
      return permission.permissions && permission.permissions[action] === true;
    }

    return fieldPermission[action] === true;
  } catch (error) {
    logger.error('Error checking field permission:', error);
    return false;
  }
};

// Grant permission to user
export const grantPermission = async (userId, resource, resourceId, permissions, fieldPermissions = null) => {
  try {
    const existingPermission = await getUserPermissions(userId);
    const existing = existingPermission.find(p => 
      p.resource === resource && p.resourceId === resourceId
    );

    if (existing) {
      // Update existing permission
      return await updatePermission(existing.id || existing._id, {
        permissions: { ...existing.permissions, ...permissions },
        fieldPermissions: fieldPermissions ? 
          { ...existing.fieldPermissions, ...fieldPermissions } : 
          existing.fieldPermissions
      });
    } else {
      // Create new permission
      return await createPermission({
        user: userId,
        resource,
        resourceId,
        permissions,
        fieldPermissions
      });
    }
  } catch (error) {
    logger.error('Error granting permission:', error);
    throw error;
  }
};

// Revoke permission from user
export const revokePermission = async (userId, resource, resourceId, actions) => {
  try {
    const userPermissions = await getUserPermissions(userId);
    const permission = userPermissions.find(p => 
      p.resource === resource && p.resourceId === resourceId
    );

    if (!permission) {
      return false;
    }

    const updatedPermissions = { ...permission.permissions };
    actions.forEach(action => {
      updatedPermissions[action] = false;
    });

    return await updatePermission(permission.id || permission._id, {
      permissions: updatedPermissions
    });
  } catch (error) {
    logger.error('Error revoking permission:', error);
    throw error;
  }
};