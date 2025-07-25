import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create email transporter
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    config.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  return nodemailer.createTransporter(config);
};

// Send email
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@system.com',
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to No-Code System';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to No-Code System!</h2>
      <p>Hello ${user.firstName} ${user.lastName},</p>
      <p>Your account has been created successfully. You can now log in and start building amazing applications.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/login" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Login to Your Account
        </a>
      </div>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The No-Code System Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hello ${user.firstName} ${user.lastName},</p>
      <p>You requested a password reset for your account. Click the button below to reset your password:</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>The No-Code System Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
  });
};

// Send form submission notification
export const sendFormSubmissionNotification = async (form, submission, recipients) => {
  const subject = `New Form Submission: ${form.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Form Submission</h2>
      <p>A new submission has been received for the form: <strong>${form.name}</strong></p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3>Submission Details:</h3>
        <p><strong>Submission ID:</strong> ${submission.submissionId}</p>
        <p><strong>Submitted By:</strong> ${submission.submittedBy?.firstName} ${submission.submittedBy?.lastName}</p>
        <p><strong>Submitted At:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> ${submission.status}</p>
      </div>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/applications/${form.applicationId}/forms/${form.formId}/submissions" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Submission
        </a>
      </div>
      <p>Best regards,<br>The No-Code System</p>
    </div>
  `;

  const emailPromises = recipients.map(recipient => 
    sendEmail({
      to: recipient,
      subject,
      html,
    })
  );

  return await Promise.allSettled(emailPromises);
};

// Send workflow notification
export const sendWorkflowNotification = async (workflow, submission, action, user, recipients) => {
  const subject = `Workflow Action: ${workflow.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Workflow Action Required</h2>
      <p>A workflow action has been performed on submission: <strong>${submission.submissionId}</strong></p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3>Action Details:</h3>
        <p><strong>Workflow:</strong> ${workflow.name}</p>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Performed By:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Current Stage:</strong> ${submission.workflowState?.currentStage}</p>
        <p><strong>Status:</strong> ${submission.status}</p>
      </div>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/applications/${workflow.applicationId}/forms/${workflow.formId}/submissions" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Submission
        </a>
      </div>
      <p>Best regards,<br>The No-Code System</p>
    </div>
  `;

  const emailPromises = recipients.map(recipient => 
    sendEmail({
      to: recipient,
      subject,
      html,
    })
  );

  return await Promise.allSettled(emailPromises);
};

// Send report notification
export const sendReportNotification = async (report, reportData, recipients) => {
  const subject = `Scheduled Report: ${report.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Scheduled Report</h2>
      <p>Your scheduled report <strong>${report.name}</strong> has been generated.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3>Report Summary:</h3>
        <p><strong>Total Records:</strong> ${reportData.total}</p>
        <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/applications/${report.applicationId}/reports/${report.reportId}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Report
        </a>
      </div>
      <p>Best regards,<br>The No-Code System</p>
    </div>
  `;

  const emailPromises = recipients.map(recipient => 
    sendEmail({
      to: recipient,
      subject,
      html,
    })
  );

  return await Promise.allSettled(emailPromises);
};