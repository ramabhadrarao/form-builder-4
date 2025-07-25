# Enterprise No-Code Application Management System

A comprehensive, enterprise-grade no-code platform for building applications with forms, reports, workflows, and granular permissions. Built with Node.js, React, TypeScript, and supports both MongoDB and MySQL databases.

## 🚀 Features

### Core Features
- **Multi-tenant Application Management** - Create and manage multiple applications with unique IDs
- **Drag-and-Drop Form Builder** - 30+ field types with live preview and validation
- **Advanced Report Builder** - Custom reports with filters, sorting, and automated generation
- **Workflow Engine** - Multi-stage approval system with role-based assignments
- **Granular Permissions** - CRUD + field-level access control
- **File Upload System** - GridFS support with automatic image processing
- **Real-time Features** - Socket.IO integration for live updates
- **REST API** - Auto-generated APIs for all forms and reports

### Field Types (30+)
- **Basic**: Text, Textarea, Number, Email, Password, Phone, URL
- **Choice**: Select, Radio, Checkbox, Multi-select
- **Date/Time**: Date, Time, DateTime, Date Range
- **Files**: File Upload, Image Upload, Signature
- **Advanced**: Location, Formula, Lookup, Repeater, Nested Forms
- **Layout**: Heading, Divider, Section, HTML Content

### Database Support
- **MongoDB** - Document-based with GridFS for file storage
- **MySQL** - Relational database with Sequelize ORM
- **Dual Database** - Support for both databases simultaneously

## 🏗️ Architecture

### Backend (Node.js/Express)
```
server/
├── config/          # Database and app configuration
├── models/          # Database models (MongoDB & MySQL)
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Authentication, validation, error handling
├── routes/          # API routes
├── utils/           # Utility functions
├── seeders/         # Database seeders
└── templates/       # File-based form/report templates
```

### Frontend (React/TypeScript)
```
client/src/
├── components/      # Reusable UI components
├── pages/           # Page components
├── layouts/         # Layout components
├── stores/          # Zustand state management
├── lib/             # Utilities and API client
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── styles/          # CSS and styling
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5+ (if using MongoDB)
- MySQL 8+ (if using MySQL)
- Redis (optional, for caching)

### 1. Clone and Install
```bash
git clone <repository-url>
cd enterprise-nocode-system
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173

# Database Configuration
DB_TYPE=mongodb  # Options: mongodb, mysql, both

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nocode_system

# MySQL Configuration (if using MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=nocode_system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Admin Credentials
DEFAULT_ADMIN_EMAIL=admin@system.com
DEFAULT_ADMIN_PASSWORD=Admin@123
```

### 3. Database Setup
Run the seeder to create initial users and sample data:
```bash
npm run seed
```

### 4. Start Development
```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

### 5. Build for Production
```bash
npm run build
npm start
```

## 🔐 Default Credentials

After running the seeder, use these credentials to log in:

- **Admin**: admin@system.com / Admin@123
- **Manager**: manager@demo.com / Manager@123
- **Staff**: staff@demo.com / Staff@123
- **User**: user@demo.com / User@123

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Refresh access token
POST /api/auth/logout       # User logout
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
```

### Application Management
```
POST /api/applications              # Create application
GET  /api/applications              # List applications
GET  /api/applications/:id          # Get application
PUT  /api/applications/:id          # Update application
DELETE /api/applications/:id        # Delete application
GET  /api/applications/:id/stats    # Get application statistics
```

### Form Management
```
POST /api/forms                     # Create form
GET  /api/forms                     # List forms
GET  /api/forms/:id                 # Get form
PUT  /api/forms/:id                 # Update form
DELETE /api/forms/:id               # Delete form
POST /api/forms/submit              # Submit form data
GET  /api/forms/:id/submissions     # Get form submissions
```

### Report Management
```
POST /api/reports                   # Create report
GET  /api/reports                   # List reports
GET  /api/reports/:id               # Get report
PUT  /api/reports/:id               # Update report
DELETE /api/reports/:id             # Delete report
GET  /api/reports/:id/data          # Get report data
```

### Workflow Management
```
POST /api/workflows                 # Create workflow
GET  /api/workflows                 # List workflows
GET  /api/workflows/:id             # Get workflow
PUT  /api/workflows/:id             # Update workflow
DELETE /api/workflows/:id           # Delete workflow
```

## 🎨 File-Based Plugin System

### Custom Form Templates
Create form definitions in the applications folder:
```
/applications/app_12345/forms/customer_form/
├── form.json           # Form structure
├── fields/             # Individual field definitions
│   ├── text_name.json
│   └── number_age.json
├── permissions.json    # Access permissions
├── workflow.json       # Workflow definition
└── layout.json         # Layout configuration
```

### Custom Report Templates
```
/applications/app_12345/reports/customer_report/
├── report.json         # Report configuration
├── filters.json        # Available filters
├── columns.json        # Report columns
└── permissions.json    # Access permissions
```

## 🔧 Configuration

### Database Selection
Choose your database in the `.env` file:
```env
DB_TYPE=mongodb     # MongoDB only
DB_TYPE=mysql       # MySQL only
DB_TYPE=both        # Both databases
```

### File Upload Configuration
```env
MAX_FILE_SIZE=10485760                    # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc   # Allowed file types
UPLOAD_PATH=uploads                       # Upload directory
```

### Security Configuration
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the server:
   ```bash
   NODE_ENV=production npm start
   ```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run end-to-end tests
npm run test:e2e
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized indexes for all query patterns
- **Caching**: Redis integration for session and data caching
- **File Storage**: GridFS for efficient file handling
- **API Optimization**: Request/response compression and rate limiting
- **Frontend**: Code splitting and lazy loading
- **Real-time**: Efficient Socket.IO integration

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control** (RBAC)
- **Field-Level Permissions**
- **Rate Limiting** and DDoS protection
- **Input Validation** and sanitization
- **Secure File Upload** with type validation
- **CORS Protection**
- **Helmet.js** security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added workflow engine and file upload
- **v1.2.0** - Enhanced permissions and reporting
- **v1.3.0** - Added real-time features and performance optimizations

---

Built with ❤️ for enterprise-grade no-code application development.