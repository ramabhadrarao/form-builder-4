import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  generateReport,
  scheduleReport,
  getReportData
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createReportValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Report name is required'),
  body('applicationId').exists().withMessage('Application ID is required'),
  body('sourceForm').exists().withMessage('Source form is required'),
  body('configuration').isObject().withMessage('Report configuration is required')
];

const updateReportValidation = [
  param('id').exists(),
  body('name').optional().trim().isLength({ min: 1 }),
  body('configuration').optional().isObject()
];

// Report management routes
router.post('/', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  createReportValidation, 
  validate, 
  createReport
);

router.get('/', authenticate, getReports);

router.get('/:id', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getReport
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  updateReportValidation, 
  validate, 
  updateReport
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  param('id').exists(), 
  validate, 
  deleteReport
);

// Report generation routes
router.post('/:id/generate', 
  authenticate, 
  param('id').exists(), 
  validate, 
  generateReport
);

router.get('/:id/data', 
  authenticate, 
  param('id').exists(), 
  query('format').optional().isIn(['json', 'csv', 'excel']), 
  validate, 
  getReportData
);

router.post('/:id/schedule', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  param('id').exists(), 
  body('schedule').isObject(), 
  validate, 
  scheduleReport
);

export default router;