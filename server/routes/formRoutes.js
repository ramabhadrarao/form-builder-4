import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createForm,
  getForms,
  getForm,
  updateForm,
  deleteForm,
  duplicateForm,
  submitForm,
  getFormSubmissions,
  getFormSubmission,
  updateFormSubmission,
  deleteFormSubmission,
  exportFormData,
  validateFormStructure
} from '../controllers/formController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createFormValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Form name is required'),
  body('applicationId').exists().withMessage('Application ID is required'),
  body('description').optional().trim(),
  body('structure').optional().isObject()
];

const submitFormValidation = [
  body('formId').exists().withMessage('Form ID is required'),
  body('applicationId').exists().withMessage('Application ID is required'),
  body('data').isObject().withMessage('Form data is required')
];

// Form management routes
router.post('/', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  createFormValidation, 
  validate, 
  createForm
);

router.get('/', authenticate, getForms);

router.get('/:id', 
  authenticate, 
  param('id').exists(), 
  validate, 
  getForm
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  param('id').exists(), 
  validate, 
  updateForm
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  param('id').exists(), 
  validate, 
  deleteForm
);

router.post('/:id/duplicate', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  param('id').exists(), 
  validate, 
  duplicateForm
);

router.post('/validate-structure', 
  authenticate, 
  body('structure').isObject(), 
  validate, 
  validateFormStructure
);

// Form submission routes
router.post('/submit', 
  authenticate, 
  submitFormValidation, 
  validate, 
  submitForm
);

router.get('/:formId/submissions', 
  authenticate, 
  param('formId').exists(), 
  validate, 
  getFormSubmissions
);

router.get('/submissions/:submissionId', 
  authenticate, 
  param('submissionId').exists(), 
  validate, 
  getFormSubmission
);

router.put('/submissions/:submissionId', 
  authenticate, 
  param('submissionId').exists(), 
  validate, 
  updateFormSubmission
);

router.delete('/submissions/:submissionId', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  param('submissionId').exists(), 
  validate, 
  deleteFormSubmission
);

router.get('/:formId/export', 
  authenticate, 
  authorize('super_admin', 'admin', 'manager'), 
  param('formId').exists(), 
  query('format').optional().isIn(['csv', 'excel', 'json']), 
  validate, 
  exportFormData
);

export default router;