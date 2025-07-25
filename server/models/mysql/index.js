import { DataTypes } from 'sequelize';
import { sequelizeConnection } from '../../config/database.js';

// User Model
const User = sequelizeConnection?.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'staff', 'user'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  permissions: {
    type: DataTypes.JSON
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  refreshTokens: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

// Application Model
const Application = sequelizeConnection?.define('Application', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    defaultValue: 'active'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  settings: {
    type: DataTypes.JSON
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'applications',
  timestamps: true,
  indexes: [
    { fields: ['applicationId'] },
    { fields: ['createdBy'] }
  ]
});

// Form Model
const Form = sequelizeConnection?.define('Form', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'),
    defaultValue: 'draft'
  },
  structure: {
    type: DataTypes.JSON
  },
  settings: {
    type: DataTypes.JSON
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'forms',
  timestamps: true,
  indexes: [
    { fields: ['formId', 'applicationId'] },
    { fields: ['applicationId'] }
  ]
});

// Form Submission Model
const FormSubmission = sequelizeConnection?.define('FormSubmission', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  submissionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON
  },
  submittedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'in_review', 'approved', 'rejected'),
    defaultValue: 'submitted'
  },
  workflowState: {
    type: DataTypes.JSON
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'form_submissions',
  timestamps: true,
  indexes: [
    { fields: ['formId', 'applicationId'] },
    { fields: ['submissionId'] },
    { fields: ['submittedBy'] }
  ]
});

// Report Model
const Report = sequelizeConnection?.define('Report', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  reportId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('custom', 'automated'),
    defaultValue: 'custom'
  },
  sourceForm: {
    type: DataTypes.STRING
  },
  configuration: {
    type: DataTypes.JSON
  },
  schedule: {
    type: DataTypes.JSON
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'reports',
  timestamps: true,
  indexes: [
    { fields: ['reportId', 'applicationId'] }
  ]
});

// Workflow Model
const Workflow = sequelizeConnection?.define('Workflow', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  workflowId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  formId: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  stages: {
    type: DataTypes.JSON
  },
  transitions: {
    type: DataTypes.JSON
  },
  settings: {
    type: DataTypes.JSON
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'workflows',
  timestamps: true,
  indexes: [
    { fields: ['workflowId', 'applicationId'] }
  ]
});

// Permission Model
const Permission = sequelizeConnection?.define('Permission', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.STRING
  },
  user: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING
  },
  permissions: {
    type: DataTypes.JSON
  },
  fieldPermissions: {
    type: DataTypes.JSON
  },
  applicationId: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  indexes: [
    { fields: ['resource', 'resourceId'] },
    { fields: ['user'] }
  ]
});

// File Model
const FileModel = sequelizeConnection?.define('File', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING
  },
  mimeType: {
    type: DataTypes.STRING
  },
  size: {
    type: DataTypes.INTEGER
  },
  path: {
    type: DataTypes.STRING
  },
  uploadedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  applicationId: {
    type: DataTypes.STRING
  },
  formId: {
    type: DataTypes.STRING
  },
  fieldId: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'files',
  timestamps: true,
  indexes: [
    { fields: ['applicationId'] },
    { fields: ['uploadedBy'] }
  ]
});

// Define associations
if (sequelizeConnection) {
  // User associations
  User.hasMany(Application, { foreignKey: 'createdBy', as: 'applications' });
  User.hasMany(Form, { foreignKey: 'createdBy', as: 'forms' });
  User.hasMany(FormSubmission, { foreignKey: 'submittedBy', as: 'submissions' });

  // Application associations
  Application.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Application.hasMany(Form, { foreignKey: 'applicationId', sourceKey: 'applicationId', as: 'forms' });
  Application.hasMany(Report, { foreignKey: 'applicationId', sourceKey: 'applicationId', as: 'reports' });
  Application.hasMany(Workflow, { foreignKey: 'applicationId', sourceKey: 'applicationId', as: 'workflows' });

  // Form associations
  Form.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Form.hasMany(FormSubmission, { foreignKey: 'formId', sourceKey: 'formId', as: 'submissions' });

  // FormSubmission associations
  FormSubmission.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });

  // Report associations
  Report.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // Workflow associations
  Workflow.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // Permission associations
  Permission.belongsTo(User, { foreignKey: 'user', as: 'userDetails' });

  // File associations
  FileModel.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
}

export {
  User,
  Application,
  Form,
  FormSubmission,
  Report,
  Workflow,
  Permission,
  FileModel as File
};