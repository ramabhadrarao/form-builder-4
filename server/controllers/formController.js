import {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  duplicateForm,
  submitForm,
  getFormSubmissions,
  getFormSubmissionById,
  updateFormSubmission,
  deleteFormSubmission
} from '../services/formService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Create new form
export const createFormHandler = asyncHandler(async (req, res) => {
  const { name, description, applicationId, structure, settings } = req.body;
  const userId = req.user.id || req.user._id;

  const formData = {
    name,
    description,
    applicationId,
    createdBy: userId,
    status: 'draft',
    structure: structure || {
      fields: [],
      layout: 'single-column',
      sections: []
    },
    settings: {
      allowDrafts: true,
      enableValidation: true,
      submitButtonText: 'Submit',
      ...settings
    }
  };

  const form = await createForm(formData);

  logger.info(`Form created: ${name} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Form created successfully',
    data: { form }
  });
});

// Get all forms
export const getFormsHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, applicationId } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const filters = {};
  
  if (applicationId) {
    filters.applicationId = applicationId;
  }
  
  // If not super admin, only show user's forms
  if (userRole !== 'super_admin') {
    filters.createdBy = userId;
  }

  if (search) {
    filters.search = search;
  }

  if (status) {
    filters.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getForms(filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Get single form
export const getFormHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const form = await getFormById(id);

  if (!form) {
    return res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }

  // Check permission to view
  if (userRole !== 'super_admin' && 
      (form.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { form }
  });
});

// Update form
export const updateFormHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status, structure, settings } = req.body;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const form = await getFormById(id);

  if (!form) {
    return res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }

  // Check permission to update
  if (userRole !== 'super_admin' && 
      (form.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (status) updateData.status = status;
  if (structure) updateData.structure = structure;
  if (settings) updateData.settings = { ...form.settings, ...settings };

  const updatedForm = await updateForm(id, updateData);

  logger.info(`Form updated: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Form updated successfully',
    data: { form: updatedForm }
  });
});

// Delete form
export const deleteFormHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const form = await getFormById(id);

  if (!form) {
    return res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }

  // Check permission to delete
  if (userRole !== 'super_admin' && 
      (form.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await deleteForm(id);

  logger.info(`Form deleted: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Form deleted successfully'
  });
});

// Duplicate form
export const duplicateFormHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  const duplicatedForm = await duplicateForm(id, userId);

  logger.info(`Form duplicated: ${id} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Form duplicated successfully',
    data: { form: duplicatedForm }
  });
});

// Submit form data
export const submitFormHandler = asyncHandler(async (req, res) => {
  const { formId, applicationId, data } = req.body;
  const userId = req.user.id || req.user._id;

  const submissionData = {
    formId,
    applicationId,
    data,
    submittedBy: userId,
    status: 'submitted'
  };

  const submission = await submitForm(submissionData);

  logger.info(`Form submitted: ${formId} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Form submitted successfully',
    data: { submission }
  });
});

// Get form submissions
export const getFormSubmissionsHandler = asyncHandler(async (req, res) => {
  const { formId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const filters = {};
  
  if (status) {
    filters.status = status;
  }

  // If not admin, only show user's submissions
  if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
    filters.submittedBy = userId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getFormSubmissions(formId, filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Get single form submission
export const getFormSubmissionHandler = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const submission = await getFormSubmissionById(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found'
    });
  }

  // Check permission to view
  if (!['super_admin', 'admin', 'manager'].includes(userRole) && 
      (submission.submittedBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { submission }
  });
});

// Update form submission
export const updateFormSubmissionHandler = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { data, status } = req.body;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const submission = await getFormSubmissionById(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found'
    });
  }

  // Check permission to update
  if (!['super_admin', 'admin', 'manager'].includes(userRole) && 
      (submission.submittedBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {};
  if (data) updateData.data = data;
  if (status) updateData.status = status;

  const updatedSubmission = await updateFormSubmission(submissionId, updateData);

  logger.info(`Form submission updated: ${submissionId} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Submission updated successfully',
    data: { submission: updatedSubmission }
  });
});

// Delete form submission
export const deleteFormSubmissionHandler = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const submission = await getFormSubmissionById(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found'
    });
  }

  // Check permission to delete
  if (!['super_admin', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await deleteFormSubmission(submissionId);

  logger.info(`Form submission deleted: ${submissionId} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Submission deleted successfully'
  });
});

// Export form data
export const exportFormDataHandler = asyncHandler(async (req, res) => {
  const { formId } = req.params;
  const { format = 'csv' } = req.query;

  const result = await getFormSubmissions(formId, {}, { page: 1, limit: 10000 });
  const submissions = result.submissions;

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="form_${formId}_data.json"`);
    return res.json(submissions);
  }

  // CSV export
  if (submissions.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No data to export'
    });
  }

  const csvHeaders = Object.keys(submissions[0].data || {});
  const csvRows = submissions.map(submission => 
    csvHeaders.map(header => submission.data[header] || '').join(',')
  );

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="form_${formId}_data.csv"`);
  res.send(csvContent);
});

// Validate form structure
export const validateFormStructureHandler = asyncHandler(async (req, res) => {
  const { structure } = req.body;

  // Basic validation
  if (!structure || !structure.fields || !Array.isArray(structure.fields)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid form structure'
    });
  }

  // Validate each field
  const errors = [];
  structure.fields.forEach((field, index) => {
    if (!field.id || !field.type || !field.name) {
      errors.push(`Field at index ${index} is missing required properties (id, type, name)`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Form structure validation failed',
      errors
    });
  }

  res.json({
    success: true,
    message: 'Form structure is valid'
  });
});

export {
  createFormHandler as createForm,
  getFormsHandler as getForms,
  getFormHandler as getForm,
  updateFormHandler as updateForm,
  deleteFormHandler as deleteForm,
  duplicateFormHandler as duplicateForm,
  submitFormHandler as submitForm,
  getFormSubmissionsHandler as getFormSubmissions,
  getFormSubmissionHandler as getFormSubmission,
  updateFormSubmissionHandler as updateFormSubmission,
  deleteFormSubmissionHandler as deleteFormSubmission,
  exportFormDataHandler as exportFormData,
  validateFormStructureHandler as validateFormStructure
};