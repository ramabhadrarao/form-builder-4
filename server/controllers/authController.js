import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  validateRefreshToken
} from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh', tokenId: uuidv4() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register user
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const userData = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
    isActive: true
  };

  const user = await createUser(userData);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id || user._id);

  // Save refresh token
  await updateUser(user.id || user._id, {
    refreshTokens: [refreshToken]
  });

  logger.info(`User registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id || user._id);

  // Update refresh tokens and last login
  const existingTokens = user.refreshTokens || [];
  await updateUser(user.id || user._id, {
    refreshTokens: [...existingTokens, refreshToken],
    lastLogin: new Date()
  });

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate refresh token
    const isValidToken = await validateRefreshToken(user.id || user._id, token);
    if (!isValidToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id || user._id);

    // Update refresh tokens (remove old, add new)
    const existingTokens = user.refreshTokens || [];
    const updatedTokens = existingTokens.filter(t => t !== token);
    updatedTokens.push(newRefreshToken);

    await updateUser(user.id || user._id, {
      refreshTokens: updatedTokens
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const userId = req.user.id || req.user._id;

  if (token) {
    // Remove specific refresh token
    const user = await getUserById(userId);
    const existingTokens = user.refreshTokens || [];
    const updatedTokens = existingTokens.filter(t => t !== token);

    await updateUser(userId, {
      refreshTokens: updatedTokens
    });
  }

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: {
        id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { firstName, lastName } = req.body;

  const updatedUser = await updateUser(userId, {
    firstName,
    lastName
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id || updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role
      }
    }
  });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { currentPassword, newPassword } = req.body;

  const user = await getUserById(userId);
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear refresh tokens
  await updateUser(userId, {
    password: hashedPassword,
    refreshTokens: []
  });

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    return res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id || user._id, type: 'reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Send reset email
  try {
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    logger.info(`Password reset email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send reset email:', error);
  }

  res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent'
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear refresh tokens
    await updateUser(user.id || user._id, {
      password: hashedPassword,
      refreshTokens: []
    });

    logger.info(`Password reset for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});