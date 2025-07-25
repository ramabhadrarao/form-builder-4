import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';

let mongoConnection = null;
let sequelizeConnection = null;

// MongoDB Connection
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nocode_system';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoConnection = mongoose.connection;
    
    mongoConnection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoConnection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoConnection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    return mongoConnection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// MySQL Connection
async function connectMySQL() {
  try {
    sequelizeConnection = new Sequelize(
      process.env.MYSQL_DATABASE || 'nocode_system',
      process.env.MYSQL_USERNAME || 'root',
      process.env.MYSQL_PASSWORD || '',
      {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        dialect: 'mysql',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        retry: {
          match: [
            /ETIMEDOUT/,
            /EHOSTUNREACH/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ETIMEDOUT/,
            /ESOCKETTIMEDOUT/,
            /EHOSTUNREACH/,
            /EPIPE/,
            /EAI_AGAIN/,
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/
          ],
          max: 3
        }
      }
    );

    await sequelizeConnection.authenticate();
    logger.info('MySQL connected successfully');

    // Sync database (create tables if they don't exist)
    await sequelizeConnection.sync({ alter: false });
    logger.info('MySQL database synchronized');

    return sequelizeConnection;
  } catch (error) {
    logger.error('Failed to connect to MySQL:', error);
    throw error;
  }
}

// Main database connection function
export async function connectDatabases() {
  const dbType = process.env.DB_TYPE || 'mongodb';

  try {
    switch (dbType) {
      case 'mongodb':
        await connectMongoDB();
        break;
      case 'mysql':
        await connectMySQL();
        break;
      case 'both':
        await Promise.all([connectMongoDB(), connectMySQL()]);
        break;
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
    
    logger.info(`Database(s) connected successfully: ${dbType}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

// Close database connections
export async function closeDatabases() {
  try {
    if (mongoConnection) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    }
    
    if (sequelizeConnection) {
      await sequelizeConnection.close();
      logger.info('MySQL disconnected');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
}

export { mongoConnection, sequelizeConnection };