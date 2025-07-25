import express from 'express';
import { body, param } from 'express-validator';
import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowHistory
} from '../controllers/workflowController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createWorkflowValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Workflow name is required'),
  body('applicationId').exists().withMessage('Application ID is required'),
  body('formId').exists().withMessage('Form ID is required'),
  body('stages').isArray().withMessage('Stages must be an array')
];

const updateWorkflowValidation = [
  param('id').exists(),
  body('name').optional().trim().isLength({ min: 1 }),
  body('stages').optional().isArray()
];

// Workflow management routes
router.post('/', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  createWorkflowValidation, 
  validate, 
  createWorkflow
);

router.get('/', authenticate, getWorkflows);

router.get('/:id', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getWorkflow
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  updateWorkflowValidation, 
  validate, 
  updateWorkflow
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  param('id').exists(), 
  validate, 
  deleteWorkflow
);

// Workflow execution routes
router.post('/:id/execute', 
  authenticate, 
  param('id').exists(), 
  body('submissionId').exists(), 
  body('action').exists(), 
  validate, 
  executeWorkflow
);

router.get('/:id/history', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getWorkflowHistory
);

export default router;