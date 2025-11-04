/**
 * Authentication Routes
 * Handles Discord OAuth, Google OAuth, local auth, token refresh, and logout
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@seacalendar/database';
import { getAuthorizationUrl, createOrLinkAccount as createOrLinkDiscordAccount } from '../services/discord';
import { localAuthService } from '../services/localAuth';
import { googleService } from '../services/google';
import { generateTokens, refreshAccessToken, revokeRefreshToken } from '../services/jwt';
import { asyncHandler, ErrorFactory } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { Config } from '../config';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric with underscores or hyphens'),
  email: z.string().email().optional(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

// ============================================================================
// Local Auth Routes (Username/Password)
// ============================================================================

/**
 * POST /api/auth/register
 * Register new user with username/password
 */
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = registerSchema.parse(req.body);

    // Register user
    const user = await localAuthService.register(data);

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      discordId: user.discordId || undefined,
      email: user.email || undefined,
    });

    logger.info('New user registered with local auth', { userId: user.id, username: user.username });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please link Discord within 7 days.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          requireDiscordLink: user.requireDiscordLink,
          discordLinkDeadline: user.discordLinkDeadline,
        },
        ...tokens,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Login with username/password
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = loginSchema.parse(req.body);

    // Authenticate user
    const user = await localAuthService.login(data);

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      discordId: user.discordId || undefined,
      email: user.email || undefined,
    });

    logger.info('User logged in with local auth', { userId: user.id, username: user.username });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          discordId: user.discordId,
          requireDiscordLink: user.requireDiscordLink,
          discordLinkDeadline: user.discordLinkDeadline,
        },
        ...tokens,
      },
    });
  })
);

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = changePasswordSchema.parse(req.body);

    // Change password
    await localAuthService.changePassword(
      req.user!.id,
      data.currentPassword,
      data.newPassword
    );

    logger.info('User changed password', { userId: req.user!.id });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

// ============================================================================
// Google OAuth Routes
// ============================================================================

/**
 * GET /api/auth/google/url
 * Get Google OAuth authorization URL
 */
router.get('/google/url', (req, res) => {
  const state = req.query.state as string | undefined;
  const linkAccount = req.query.link === 'true'; // For linking calendar
  const authUrl = googleService.getAuthUrl(state, linkAccount);

  res.json({
    success: true,
    authUrl,
  });
});

/**
 * GET /api/auth/google/callback
 * Google OAuth callback handler
 */
router.get(
  '/google/callback',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Create or link Google account
    const { user, isNewUser } = await googleService.createOrLinkAccount(code);

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      discordId: user.discordId || undefined,
      email: user.email || undefined,
    });

    logger.info(isNewUser ? 'New user created with Google auth' : 'User logged in with Google', {
      userId: user.id,
      email: user.email,
    });

    // Redirect to web app with tokens
    const redirectUrl = new URL('/auth/callback', Config.webAppUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    res.redirect(redirectUrl.toString());
  })
);

/**
 * POST /api/auth/google/link
 * Link Google account to existing user
 */
router.post(
  '/google/link',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Link Google account to current user
    const { user } = await googleService.createOrLinkAccount(code, req.user!.id);

    logger.info('Google account linked', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Google account linked successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  })
);

// ============================================================================
// Discord OAuth Routes
// ============================================================================

/**
 * GET /api/auth/discord/url
 * Get Discord OAuth authorization URL
 */
router.get('/discord/url', (req, res) => {
  const state = req.query.state as string | undefined;
  const authUrl = getAuthorizationUrl(state);

  res.json({
    success: true,
    authUrl,
  });
});

/**
 * GET /api/auth/discord/callback
 * Discord OAuth callback handler
 */
router.get(
  '/discord/callback',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Create or link Discord account
    const { user, isNewUser } = await createOrLinkDiscordAccount(code);

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      discordId: user.discordId || undefined,
      email: user.email || undefined,
    });

    logger.info(isNewUser ? 'New user created with Discord' : 'User logged in with Discord', {
      userId: user.id,
      discordId: user.discordId,
    });

    // Redirect to web app with tokens
    const redirectUrl = new URL('/auth/callback', Config.webAppUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    res.redirect(redirectUrl.toString());
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw ErrorFactory.badRequest('Refresh token required');
    }

    // Generate new token pair
    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  })
);

export default router;
