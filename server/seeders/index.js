import bcrypt from 'bcryptjs';
import { connectDatabases } from '../config/database.js';
import { createUser } from '../services/userService.js';
import { createApplication } from '../services/applicationService.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to databases
    await connectDatabases();
    
    // Create admin user
    const adminPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', 
      12
    );
    
    const adminUser = await createUser({
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@system.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      isActive: true,
      permissions: [
        {
          resource: '*',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    }).catch(error => {
      if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
        logger.info('Admin user already exists');
        return null;
      }
      throw error;
    });

    if (adminUser) {
      logger.info('Admin user created successfully');
    }

    // Create sample users
    const sampleUsers = [
      {
        email: 'manager@demo.com',
        password: await bcrypt.hash('Manager@123', 12),
        firstName: 'Demo',
        lastName: 'Manager',
        role: 'manager',
        isActive: true,
        permissions: [
          {
            resource: 'applications',
            actions: ['create', 'read', 'update']
          },
          {
            resource: 'forms',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            resource: 'reports',
            actions: ['create', 'read', 'update']
          },
          {
            resource: 'workflows',
            actions: ['create', 'read', 'update']
          }
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
          {
            resource: 'forms',
            actions: ['read', 'create']
          },
          {
            resource: 'reports',
            actions: ['read']
          }
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
          {
            resource: 'forms',
            actions: ['read', 'create']
          }
        ]
      }
    ];

    for (const userData of sampleUsers) {
      try {
        await createUser(userData);
        logger.info(`Sample user created: ${userData.email}`);
      } catch (error) {
        if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
          logger.info(`Sample user already exists: ${userData.email}`);
        } else {
          logger.error(`Error creating sample user ${userData.email}:`, error);
        }
      }
    }

    // Create sample application
    if (adminUser) {
      const sampleApp = {
        applicationId: 'demo-app-001',
        name: 'Demo Application',
        description: 'A sample application for demonstration purposes',
        createdBy: adminUser.id || adminUser._id,
        status: 'active',
        settings: {
          theme: 'default',
          allowGuestAccess: false,
          enableWorkflows: true,
          enableReports: true
        }
      };

      try {
        await createApplication(sampleApp);
        logger.info('Sample application created successfully');
      } catch (error) {
        if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
          logger.info('Sample application already exists');
        } else {
          logger.error('Error creating sample application:', error);
        }
      }
    }

    logger.info('Database seeding completed successfully!');
    
    // Log credentials
    logger.info('='.repeat(50));
    logger.info('DEFAULT CREDENTIALS:');
    logger.info('='.repeat(50));
    logger.info(`Admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@system.com'} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123'}`);
    logger.info('Manager: manager@demo.com / Manager@123');
    logger.info('Staff: staff@demo.com / Staff@123');
    logger.info('User: user@demo.com / User@123');
    logger.info('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;