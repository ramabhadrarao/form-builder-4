import express from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getSystemHealth
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', authenticate, getDashboardStats);
router.get('/activity', authenticate, getRecentActivity);
router.get('/health', authenticate, authorize('super_admin', 'admin'), getSystemHealth);

export default router;