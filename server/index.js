import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations and middleware
import { connectDatabases } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import formRoutes from './routes/formRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  }
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('join-application', (applicationId) => {
    socket.join(`app-${applicationId}`);
    logger.info(`Socket ${socket.id} joined application ${applicationId}`);
  });

  socket.on('form-update', (data) => {
    socket.to(`app-${data.applicationId}`).emit('form-updated', data);
  });

  socket.on('workflow-update', (data) => {
    socket.to(`app-${data.applicationId}`).emit('workflow-updated', data);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await connectDatabases();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`Database type: ${process.env.DB_TYPE}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };