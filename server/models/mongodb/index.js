import { Schema, model } from 'mongoose';

// User Schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'staff', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    resource: String,
    actions: [String]
  }],
  lastLogin: Date,
  refreshTokens: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Application Schema
const applicationSchema = new Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    },
    enableWorkflows: {
      type: Boolean,
      default: true
    },
    enableReports: {
      type: Boolean,
      default: true
    }
  },
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

applicationSchema.index({ applicationId: 1 });
applicationSchema.index({ createdBy: 1 });

// Form Schema
const formSchema = new Schema({
  formId: {
    type: String,
    required: true
  },
  applicationId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  structure: {
    fields: [{
      id: String,
      type: String,
      name: String,
      label: String,
      required: Boolean,
      validation: Schema.Types.Mixed,
      options: Schema.Types.Mixed,
      permissions: Schema.Types.Mixed,
      conditionalLogic: Schema.Types.Mixed
    }],
    layout: {
      type: String,
      enum: ['single-column', '2-column', '3-column', 'grid'],
      default: 'single-column'
    },
    sections: [Schema.Types.Mixed]
  },
  settings: {
    allowDrafts: {
      type: Boolean,
      default: true
    },
    enableValidation: {
      type: Boolean,
      default: true
    },
    submitButtonText: {
      type: String,
      default: 'Submit'
    },
    successMessage: String,
    redirectUrl: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

formSchema.index({ formId: 1, applicationId: 1 });
formSchema.index({ applicationId: 1 });

// Form Submission Schema
const formSubmissionSchema = new Schema({
  formId: String,
  applicationId: String,
  submissionId: {
    type: String,
    unique: true
  },
  data: Schema.Types.Mixed,
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected'],
    default: 'submitted'
  },
  workflowState: {
    currentStage: String,
    history: [{
      stage: String,
      action: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date,
      comments: String
    }]
  },
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

formSubmissionSchema.index({ formId: 1, applicationId: 1 });
formSubmissionSchema.index({ submissionId: 1 });
formSubmissionSchema.index({ submittedBy: 1 });

// Report Schema
const reportSchema = new Schema({
  reportId: String,
  applicationId: String,
  name: String,
  description: String,
  type: {
    type: String,
    enum: ['custom', 'automated'],
    default: 'custom'
  },
  sourceForm: String,
  configuration: {
    columns: [Schema.Types.Mixed],
    filters: [Schema.Types.Mixed],
    sorting: Schema.Types.Mixed,
    grouping: Schema.Types.Mixed,
    aggregations: [Schema.Types.Mixed]
  },
  schedule: {
    enabled: Boolean,
    frequency: String,
    recipients: [String]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

reportSchema.index({ reportId: 1, applicationId: 1 });

// Workflow Schema
const workflowSchema = new Schema({
  workflowId: String,
  applicationId: String,
  formId: String,
  name: String,
  description: String,
  stages: [{
    id: String,
    name: String,
    role: String,
    users: [String],
    actions: [String],
    conditions: Schema.Types.Mixed,
    notifications: Schema.Types.Mixed
  }],
  transitions: [{
    from: String,
    to: String,
    condition: Schema.Types.Mixed,
    action: String
  }],
  settings: {
    autoProgress: Boolean,
    enableEscalation: Boolean,
    escalationTime: Number
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

workflowSchema.index({ workflowId: 1, applicationId: 1 });

// Permission Schema
const permissionSchema = new Schema({
  resource: String,
  resourceId: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  role: String,
  permissions: {
    create: Boolean,
    read: Boolean,
    update: Boolean,
    delete: Boolean
  },
  fieldPermissions: Schema.Types.Mixed,
  applicationId: String
}, {
  timestamps: true
});

permissionSchema.index({ resource: 1, resourceId: 1 });
permissionSchema.index({ user: 1 });

// File Schema
const fileSchema = new Schema({
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  path: String,
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  applicationId: String,
  formId: String,
  fieldId: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

fileSchema.index({ applicationId: 1 });
fileSchema.index({ uploadedBy: 1 });

// Export models
export const User = model('User', userSchema);
export const Application = model('Application', applicationSchema);
export const Form = model('Form', formSchema);
export const FormSubmission = model('FormSubmission', formSubmissionSchema);
export const Report = model('Report', reportSchema);
export const Workflow = model('Workflow', workflowSchema);
export const Permission = model('Permission', permissionSchema);
export const File = model('File', fileSchema);