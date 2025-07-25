import { User as MongoUser } from '../models/mongodb/index.js';
import { User as MySQLUser } from '../models/mysql/index.js';
import { logger } from '../utils/logger.js';

// Determine which model to use based on DB_TYPE
const getUserModel = () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  return dbType === 'mysql' ? MySQLUser : MongoUser;
};

// Create user
export const createUser = async (userData) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.create(userData);
    } else {
      const user = new UserModel(userData);
      return await user.save();
    }
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.findOne({ where: { email } });
    } else {
      return await UserModel.findOne({ email });
    }
  } catch (error) {
    logger.error('Error getting user by email:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.findByPk(id);
    } else {
      return await UserModel.findById(id);
    }
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id, updateData) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      await UserModel.update(updateData, { where: { id } });
      return await UserModel.findByPk(id);
    } else {
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    }
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.destroy({ where: { id } });
    } else {
      return await UserModel.findByIdAndDelete(id);
    }
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

// Get all users with pagination
export const getUsers = async (filters = {}, options = {}) => {
  try {
    const UserModel = getUserModel();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (process.env.DB_TYPE === 'mysql') {
      const whereClause = {};
      
      if (filters.role) {
        whereClause.role = filters.role;
      }
      
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.search) {
        const { Op } = await import('sequelize');
        whereClause[Op.or] = [
          { firstName: { [Op.like]: `%${filters.search}%` } },
          { lastName: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await UserModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'refreshTokens'] }
      });

      return {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } else {
      const query = {};
      
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.search) {
        query.$or = [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const total = await UserModel.countDocuments(query);
      const users = await UserModel.find(query)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    logger.error('Error getting users:', error);
    throw error;
  }
};

// Validate refresh token
export const validateRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await getUserById(userId);
    if (!user || !user.refreshTokens) {
      return false;
    }

    return user.refreshTokens.includes(refreshToken);
  } catch (error) {
    logger.error('Error validating refresh token:', error);
    return false;
  }
};

// Update user permissions
export const updateUserPermissions = async (userId, permissions) => {
  try {
    return await updateUser(userId, { permissions });
  } catch (error) {
    logger.error('Error updating user permissions:', error);
    throw error;
  }
};

// Bulk operations
export const createUsers = async (usersData) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.bulkCreate(usersData);
    } else {
      return await UserModel.insertMany(usersData);
    }
  } catch (error) {
    logger.error('Error creating users in bulk:', error);
    throw error;
  }
};

export const updateUsers = async (filter, updateData) => {
  try {
    const UserModel = getUserModel();
    
    if (process.env.DB_TYPE === 'mysql') {
      return await UserModel.update(updateData, { where: filter });
    } else {
      return await UserModel.updateMany(filter, updateData);
    }
  } catch (error) {
    logger.error('Error updating users in bulk:', error);
    throw error;
  }
};