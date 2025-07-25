import express from 'express';
import { body, param } from 'express-validator';
import {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission,
  getUserPermissions,
  checkUserPermission
} from '../controllers/permissionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createPermissionValidation = [
  body('resource').exists().withMessage('Resource is required'),
  body('user').exists().withMessage('User ID is required'),
  body('permissions').isObject().withMessage('Permissions must be an object')
];

const updatePermissionValidation = [
  param('id').exists(),
  body('permissions').optional().isObject()
];

// Permission management routes
router.post('/', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  createPermissionValidation, 
  validate, 
  createPermission
);

router.get('/', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  getPermissions
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  updatePermissionValidation, 
  validate, 
  updatePermission
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'admin'), 
  param('id').exists(), 
  validate, 
  deletePermission
);

// User permission routes
router.get('/user/:userId', 
  authenticate, 
  param('userId').exists(), 
  validate, 
  getUserPermissions
);

router.post('/check', 
  authenticate, 
  body('resource').exists(), 
  body('action').exists(), 
  validate, 
  checkUserPermission
);

export default router;