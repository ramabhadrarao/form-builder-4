// server/seeders/index.js
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple schema for seeding (avoiding the index warnings)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  permissions: [{ resource: String, actions: [String] }],
  refreshTokens: [String]
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    theme: { type: String, default: 'default' },
    allowGuestAccess: { type: Boolean, default: false },
    enableWorkflows: { type: Boolean, default: true },
    enableReports: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Create models for seeding
const User = mongoose.model('User', userSchema);
const Application = mongoose.model('Application', applicationSchema);

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nocode_system';
    console.log('🔌 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function clearData() {
  try {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Application.deleteMany({});
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('⚠️  Warning: Could not clear existing data:', error.message);
  }
}

async function createUsers() {
  console.log('👥 Creating users...');
  
  const users = [
    {
      email: 'admin@system.com',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      permissions: [{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }]
    },
    {
      email: 'manager@demo.com',
      password: 'Manager@123',
      firstName: 'Demo',
      lastName: 'Manager',
      role: 'manager',
      permissions: [
        { resource: 'applications', actions: ['create', 'read', 'update'] },
        { resource: 'forms', actions: ['create', 'read', 'update', 'delete'] }
      ]
    },
    {
      email: 'staff@demo.com',
      password: 'Staff@123',
      firstName: 'Demo',
      lastName: 'Staff',
      role: 'staff',
      permissions: [{ resource: 'forms', actions: ['read', 'create'] }]
    },
    {
      email: 'user@demo.com',
      password: 'User@123',
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      permissions: [{ resource: 'forms', actions: ['read', 'create'] }]
    }
  ];

  const createdUsers = [];

  for (const userData of users) {
    try {
      console.log(`🔐 Hashing password for ${userData.email}...`);
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
        isActive: true,
        refreshTokens: []
      });

      const savedUser = await user.save();
      console.log(`✅ Created user: ${userData.email}`);
      
      // Test password immediately
      const isValid = await bcrypt.compare(userData.password, hashedPassword);
      console.log(`🧪 Password test for ${userData.email}: ${isValid ? 'PASS' : 'FAIL'}`);
      
      createdUsers.push(savedUser);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createSampleApplication(adminUser) {
  try {
    console.log('🏢 Creating sample application...');
    
    const app = new Application({
      applicationId: 'demo-app-001',
      name: 'Demo Application',
      description: 'A sample application for demonstration purposes',
      createdBy: adminUser._id,
      status: 'active',
      settings: {
        theme: 'default',
        allowGuestAccess: false,
        enableWorkflows: true,
        enableReports: true
      }
    });

    const savedApp = await app.save();
    console.log('✅ Sample application created');
    return savedApp;
  } catch (error) {
    console.error('❌ Failed to create sample application:', error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\n🧪 Testing login credentials...');
    
    const testUser = await User.findOne({ email: 'admin@system.com' });
    if (!testUser) {
      console.log('❌ Admin user not found');
      return false;
    }

    const isValidPassword = await bcrypt.compare('Admin@123', testUser.password);
    console.log(`✅ Admin login test: ${isValidPassword ? 'PASSED' : 'FAILED'}`);
    
    if (isValidPassword) {
      console.log('🎯 Admin user can login successfully');
      return true;
    } else {
      console.log('❌ Admin password verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    return false;
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    // Clear existing data
    await clearData();

    // Create users
    const users = await createUsers();
    if (users.length === 0) {
      throw new Error('No users were created');
    }

    const adminUser = users.find(u => u.role === 'super_admin');
    if (!adminUser) {
      throw new Error('Admin user was not created');
    }

    // Create sample application
    await createSampleApplication(adminUser);

    // Test login
    const loginTest = await testLogin();

    console.log('\n🎉 Database seeding completed successfully!');
    
    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('👑 Admin:   admin@system.com   / Admin@123');
    console.log('👨‍💼 Manager: manager@demo.com  / Manager@123');
    console.log('👷 Staff:   staff@demo.com    / Staff@123');
    console.log('👤 User:    user@demo.com     / User@123');
    console.log('='.repeat(60));
    
    if (loginTest) {
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Start the server:   npm run server:dev');
      console.log('2. Start the client:   npm run client:dev');
      console.log('3. Open browser:       http://localhost:5173');
      console.log('4. Login with admin credentials above');
      console.log('5. Build amazing apps! 🎯\n');
    } else {
      console.log('\n⚠️  WARNING: Login test failed. Please check the database manually.\n');
    }

  } catch (error) {
    console.error('\n❌ Database seeding failed!');
    console.error('Error:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Is MongoDB running?     mongod --version');
    console.log('2. Check connection:       mongosh');
    console.log('3. Install dependencies:   npm install');
    console.log('4. Check ports:            netstat -an | grep 27017');
    console.log('5. Restart MongoDB:        sudo service mongod restart\n');
    
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('📋 Database connection closed');
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run seeder
seedDatabase();