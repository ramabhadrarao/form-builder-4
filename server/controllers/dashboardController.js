import { getApplications } from '../services/applicationService.js';
import { getForms } from '../services/formService.js';
import { getReports } from '../services/reportService.js';
import { getWorkflows } from '../services/workflowService.js';
import { getUsers } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  try {
    const filters = {};
    
    // If not super admin, only show user's data
    if (userRole !== 'super_admin') {
      filters.createdBy = userId;
    }

    // Get counts for different entities
    const [
      applicationsResult,
      formsResult,
      reportsResult,
      workflowsResult,
      usersResult
    ] = await Promise.all([
      getApplications(filters, { page: 1, limit: 1 }),
      getForms(filters, { page: 1, limit: 1 }),
      getReports(filters, { page: 1, limit: 1 }),
      getWorkflows(filters, { page: 1, limit: 1 }),
      userRole === 'super_admin' ? getUsers({}, { page: 1, limit: 1 }) : Promise.resolve({ pagination: { total: 0 } })
    ]);

    const stats = {
      applications: {
        total: applicationsResult.pagination.total,
        active: 0, // Will be calculated separately if needed
      },
      forms: {
        total: formsResult.pagination.total,
        active: 0,
      },
      reports: {
        total: reportsResult.pagination.total,
        custom: 0,
        automated: 0,
      },
      workflows: {
        total: workflowsResult.pagination.total,
        active: 0,
      },
      users: {
        total: usersResult.pagination.total,
        active: 0,
      }
    };

    // Get more detailed stats if needed
    if (userRole === 'super_admin') {
      // Get active applications
      const activeAppsResult = await getApplications(
        { ...filters, status: 'active' }, 
        { page: 1, limit: 1 }
      );
      stats.applications.active = activeAppsResult.pagination.total;

      // Get active forms
      const activeFormsResult = await getForms(
        { ...filters, status: 'active' }, 
        { page: 1, limit: 1 }
      );
      stats.forms.active = activeFormsResult.pagination.total;

      // Get active users
      const activeUsersResult = await getUsers(
        { isActive: true }, 
        { page: 1, limit: 1 }
      );
      stats.users.active = activeUsersResult.pagination.total;
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics'
    });
  }
});

// Get recent activity
export const getRecentActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;
  const { limit = 10 } = req.query;

  try {
    const filters = {};
    
    // If not super admin, only show user's data
    if (userRole !== 'super_admin') {
      filters.createdBy = userId;
    }

    // Get recent items from different entities
    const [
      recentApplications,
      recentForms,
      recentReports
    ] = await Promise.all([
      getApplications(filters, { page: 1, limit: parseInt(limit) / 3 }),
      getForms(filters, { page: 1, limit: parseInt(limit) / 3 }),
      getReports(filters, { page: 1, limit: parseInt(limit) / 3 })
    ]);

    // Combine and sort by creation date
    const activities = [];

    recentApplications.applications.forEach(app => {
      activities.push({
        type: 'application',
        action: 'created',
        item: {
          id: app.id || app._id,
          name: app.name,
          applicationId: app.applicationId
        },
        user: app.createdBy || app.creator,
        timestamp: app.createdAt
      });
    });

    recentForms.forms.forEach(form => {
      activities.push({
        type: 'form',
        action: 'created',
        item: {
          id: form.id || form._id,
          name: form.name,
          formId: form.formId
        },
        user: form.createdBy || form.creator,
        timestamp: form.createdAt
      });
    });

    recentReports.reports.forEach(report => {
      activities.push({
        type: 'report',
        action: 'created',
        item: {
          id: report.id || report._id,
          name: report.name,
          reportId: report.reportId
        },
        user: report.createdBy || report.creator,
        timestamp: report.createdAt
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit the results
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: { activities: limitedActivities }
    });
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent activity'
    });
  }
});

// Get system health (admin only)
export const getSystemHealth = asyncHandler(async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        mongodb: 'unknown',
        mysql: 'unknown'
      },
      services: {
        api: 'healthy',
        fileUpload: 'healthy',
        authentication: 'healthy'
      }
    };

    // Check database connections
    try {
      const { mongoConnection, sequelizeConnection } = await import('../config/database.js');
      
      if (mongoConnection && mongoConnection.readyState === 1) {
        health.database.mongodb = 'connected';
      } else if (process.env.DB_TYPE === 'mongodb' || process.env.DB_TYPE === 'both') {
        health.database.mongodb = 'disconnected';
        health.status = 'degraded';
      }

      if (sequelizeConnection) {
        try {
          await sequelizeConnection.authenticate();
          health.database.mysql = 'connected';
        } catch (error) {
          health.database.mysql = 'disconnected';
          if (process.env.DB_TYPE === 'mysql' || process.env.DB_TYPE === 'both') {
            health.status = 'degraded';
          }
        }
      }
    } catch (error) {
      logger.error('Error checking database health:', error);
      health.status = 'degraded';
    }

    // Check file upload directory
    try {
      const fs = await import('fs');
      const path = await import('path');
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        health.services.fileUpload = 'degraded';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.fileUpload = 'unhealthy';
      health.status = 'degraded';
    }

    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving system health'
    });
  }
});