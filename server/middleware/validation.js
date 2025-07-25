import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      url: req.url,
      method: req.method,
      errors: errors.array(),
      body: req.body
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};

// Custom validation functions
export const validateApplicationId = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error('Invalid application ID format');
  }
  return true;
};

export const validateFormStructure = (structure) => {
  if (!structure || typeof structure !== 'object') {
    throw new Error('Form structure must be an object');
  }

  if (!Array.isArray(structure.fields)) {
    throw new Error('Form structure must contain a fields array');
  }

  // Validate each field
  for (const field of structure.fields) {
    if (!field.id || !field.type || !field.name) {
      throw new Error('Each field must have id, type, and name properties');
    }

    // Validate field type
    const validTypes = [
      'text', 'textarea', 'number', 'email', 'password', 'tel', 'url',
      'select', 'radio', 'checkbox', 'multiselect',
      'date', 'time', 'datetime', 'daterange',
      'file', 'image', 'signature',
      'location', 'formula', 'lookup', 'repeater',
      'heading', 'divider', 'section', 'html'
    ];

    if (!validTypes.includes(field.type)) {
      throw new Error(`Invalid field type: ${field.type}`);
    }
  }

  return true;
};

export const validateWorkflowStages = (stages) => {
  if (!Array.isArray(stages)) {
    throw new Error('Workflow stages must be an array');
  }

  for (const stage of stages) {
    if (!stage.id || !stage.name) {
      throw new Error('Each stage must have id and name properties');
    }

    if (!stage.role && !stage.users) {
      throw new Error('Each stage must have either role or users assigned');
    }
  }

  return true;
};

export const validateReportConfiguration = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error('Report configuration must be an object');
  }

  if (!Array.isArray(config.columns)) {
    throw new Error('Report configuration must contain a columns array');
  }

  // Validate columns
  for (const column of config.columns) {
    if (!column.field || !column.label) {
      throw new Error('Each column must have field and label properties');
    }
  }

  return true;
};