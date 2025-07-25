import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  generateReportData
} from '../services/reportService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Create new report
export const createReportHandler = asyncHandler(async (req, res) => {
  const { name, description, applicationId, sourceForm, type, configuration, schedule } = req.body;
  const userId = req.user.id || req.user._id;

  const reportData = {
    name,
    description,
    applicationId,
    sourceForm,
    type: type || 'custom',
    configuration,
    schedule,
    createdBy: userId
  };

  const report = await createReport(reportData);

  logger.info(`Report created: ${name} by user ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: { report }
  });
});

// Get all reports
export const getReportsHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, type, applicationId } = req.query;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const filters = {};
  
  if (applicationId) {
    filters.applicationId = applicationId;
  }
  
  if (type) {
    filters.type = type;
  }
  
  // If not super admin, only show user's reports
  if (userRole !== 'super_admin') {
    filters.createdBy = userId;
  }

  if (search) {
    filters.search = search;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await getReports(filters, options);

  res.json({
    success: true,
    data: result
  });
});

// Get single report
export const getReportHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Check permission to view
  if (userRole !== 'super_admin' && 
      (report.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { report }
  });
});

// Update report
export const updateReportHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, configuration, schedule } = req.body;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Check permission to update
  if (userRole !== 'super_admin' && 
      (report.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (configuration) updateData.configuration = configuration;
  if (schedule) updateData.schedule = schedule;

  const updatedReport = await updateReport(id, updateData);

  logger.info(`Report updated: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Report updated successfully',
    data: { report: updatedReport }
  });
});

// Delete report
export const deleteReportHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Check permission to delete
  if (userRole !== 'super_admin' && 
      (report.createdBy?.toString() !== userId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await deleteReport(id);

  logger.info(`Report deleted: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// Generate report
export const generateReportHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { filters } = req.body;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  const reportData = await generateReportData(report, filters);

  res.json({
    success: true,
    data: { reportData }
  });
});

// Get report data
export const getReportDataHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'json', filters } = req.query;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  const reportData = await generateReportData(report, filters ? JSON.parse(filters) : {});

  if (format === 'csv') {
    const csvContent = convertToCSV(reportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report_${id}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    data: { reportData }
  });
});

// Schedule report
export const scheduleReportHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { schedule } = req.body;

  const report = await getReportById(id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  const updatedReport = await updateReport(id, { schedule });

  logger.info(`Report scheduled: ${id} by user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Report scheduled successfully',
    data: { report: updatedReport }
  });
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );

  return [headers.join(','), ...csvRows].join('\n');
}

export {
  createReportHandler as createReport,
  getReportsHandler as getReports,
  getReportHandler as getReport,
  updateReportHandler as updateReport,
  deleteReportHandler as deleteReport,
  generateReportHandler as generateReport,
  getReportDataHandler as getReportData,
  scheduleReportHandler as scheduleReport
};