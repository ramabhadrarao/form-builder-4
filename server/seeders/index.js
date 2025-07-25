import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Application } from '../models/mongodb/index.js';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nocode_system');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`ℹ️  User already exists: ${userData.email}`);
      return existingUser;
    }

    const user = new User(userData);
    await user.save();
    console.log(`✅ User created: ${userData.email}`);
    return user;
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    throw error;
  }
}

async function createApplication(appData) {
  try {
    const existingApp = await Application.findOne({ applicationId: appData.applicationId });
    if (existingApp) {
      console.log(`ℹ️  Application already exists: ${appData.name}`);
      return existingApp;
    }

    const app = new Application(appData);
    await app.save();
    console.log(`✅ Application created: ${appData.name}`);
    return app;
  } catch (error) {
    console.error(`❌ Error creating application:`, error.message);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const adminUser = await createUser({
      email: 'admin@system.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      isActive: true,
      permissions: [{
        resource: '*',
        actions: ['create', 'read', 'update', 'delete']
      }]
    });

    // Create sample users
    const users = [
      {
        email: 'manager@demo.com',
        password: await bcrypt.hash('Manager@123', 12),
        firstName: 'Demo',
        lastName: 'Manager',
        role: 'manager',
        isActive: true,
        permissions: [
          { resource: 'applications', actions: ['create', 'read', 'update'] },
          { resource: 'forms', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'reports', actions: ['create', 'read', 'update'] },
          { resource: 'workflows', actions: ['create', 'read', 'update'] }
        ]
      },
      {
        email: 'staff@demo.com',
        password: await bcrypt.hash('Staff@123', 12),
        firstName: 'Demo',
        lastName: 'Staff',
        role: 'staff',
        isActive: true,
        permissions: [
          { resource: 'forms', actions: ['read', 'create'] },
          { resource: 'reports', actions: ['read'] }
        ]
      },
      {
        email: 'user@demo.com',
        password: await bcrypt.hash('User@123', 12),
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        isActive: true,
        permissions: [
          { resource: 'forms', actions: ['read', 'create'] }
        ]
      }
    ];

    for (const userData of users) {
      await createUser(userData);
    }

    // Create sample application
    if (adminUser) {
      await createApplication({
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
    }

    console.log('\n🎉 Database seeding completed successfully!');
    
    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('🔑 DEFAULT LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('👑 Admin:   admin@system.com / Admin@123');
    console.log('👨‍💼 Manager: manager@demo.com / Manager@123');
    console.log('👷 Staff:   staff@demo.com / Staff@123');
    console.log('👤 User:    user@demo.com / User@123');
    console.log('='.repeat(60));
    console.log('\n🚀 Next steps:');
    console.log('1. Go to: http://localhost:5173');
    console.log('2. Login with admin credentials above');
    console.log('3. Start building your applications! 🎯\n');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    console.error('\nError details:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your database connection');
    console.log('3. Ensure all dependencies are installed: npm install');
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📋 Database connection closed');
    process.exit(0);
  }
}

// Run seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}