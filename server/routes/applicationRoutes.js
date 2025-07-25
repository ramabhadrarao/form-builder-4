import express from 'express';
import { body, param } from 'express-validator';
import {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createApplicationValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Application name is required'),
  body('description').optional().trim()
];

const updateApplicationValidation = [
  param('id').exists(),
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'archived'])
];

// Routes
router.post('/', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  createApplicationValidation, 
  validate, 
  createApplication
);

router.get('/', authenticate, getApplications);

router.get('/:id', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getApplication
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  updateApplicationValidation, 
  validate, 
  updateApplication
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  param('id').exists(), 
  validate, 
  deleteApplication
);

router.get('/:id/stats', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getApplicationStats
);

export default router;