/**
 * User Routes
 * User profile and preferences management
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@seacalendar/database';
import {
  getUser,
  updateUser,
  updateUserPreferences,
  getUserPolls,
  getUserStats,
  deleteUser,
} from '../services/userService';
import { googleService } from '../services/google';
import { createOrLinkAccount as createOrLinkDiscordAccount } from '../services/discord';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, ErrorFactory } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

const updatePreferencesSchema = z.object({
  notifyViaDiscordDM: z.boolean().optional(),
  notifyViaEmail: z.boolean().optional(),
  notifyViaSMS: z.boolean().optional(),
  wantVoteReminders: z.boolean().optional(),
  wantEventReminders: z.boolean().optional(),
  showInStats: z.boolean().optional(),
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUser(req.user!.id);

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const validatedData = updateUserSchema.parse(req.body);

    const user = await updateUser(req.user!.id, validatedData);

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully',
    });
  })
);

/**
 * DELETE /api/users/me
 * Delete current user account
 */
router.delete(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteUser(req.user!.id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  })
);

/**
 * GET /api/users/me/preferences
 * Get current user preferences
 */
router.get(
  '/me/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUser(req.user!.id);

    res.json({
      success: true,
      data: { preferences: user.preferences },
    });
  })
);

/**
 * PATCH /api/users/me/preferences
 * Update current user preferences
 */
router.patch(
  '/me/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const validatedData = updatePreferencesSchema.parse(req.body);

    const preferences = await updateUserPreferences(req.user!.id, validatedData);

    res.json({
      success: true,
      data: { preferences },
      message: 'Preferences updated successfully',
    });
  })
);

/**
 * GET /api/users/me/polls
 * Get current user's polls
 */
router.get(
  '/me/polls',
  requireAuth,
  asyncHandler(async (req, res) => {
    const polls = await getUserPolls(req.user!.id);

    res.json({
      success: true,
      data: { polls },
    });
  })
);

/**
 * GET /api/users/me/stats
 * Get current user's statistics
 */
router.get(
  '/me/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const stats = await getUserStats(req.user!.id);

    res.json({
      success: true,
      data: { stats },
    });
  })
);

// ============================================================================
// Auth Provider Linking
// ============================================================================

/**
 * GET /api/users/me/providers
 * Get list of linked auth providers
 */
router.get(
  '/me/providers',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        authProviders: {
          select: {
            id: true,
            provider: true,
            providerId: true,
            scope: true,
            createdAt: true,
            // Don't include tokens for security
          },
        },
      },
    });

    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }

    // Determine which providers are linked
    const linkedProviders = user.authProviders.map((ap) => ap.provider);
    const hasDiscord = linkedProviders.includes('DISCORD');
    const hasGoogle = linkedProviders.includes('GOOGLE');
    const hasLocal = linkedProviders.includes('LOCAL');

    // Calculate days until Discord link deadline
    let daysUntilDeadline: number | null = null;
    if (user.requireDiscordLink && user.discordLinkDeadline && !hasDiscord) {
      const now = new Date();
      const deadline = new Date(user.discordLinkDeadline);
      daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      data: {
        providers: user.authProviders,
        summary: {
          hasDiscord,
          hasGoogle,
          hasLocal,
          requireDiscordLink: user.requireDiscordLink,
          discordLinkDeadline: user.discordLinkDeadline,
          daysUntilDeadline,
        },
      },
    });
  })
);

/**
 * POST /api/users/me/link/google
 * Link Google account to current user
 */
router.post(
  '/me/link/google',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Link Google account
    const { user } = await googleService.createOrLinkAccount(code, req.user!.id);

    res.json({
      success: true,
      message: 'Google account linked successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  })
);

/**
 * POST /api/users/me/link/discord
 * Link Discord account to current user
 */
router.post(
  '/me/link/discord',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Link Discord account
    const { user } = await createOrLinkDiscordAccount(code, req.user!.id);

    res.json({
      success: true,
      message: 'Discord account linked successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          discordId: user.discordId,
        },
      },
    });
  })
);

/**
 * DELETE /api/users/me/unlink/:provider
 * Unlink an auth provider
 */
router.delete(
  '/me/unlink/:provider',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const providerUpper = provider.toUpperCase();

    // Validate provider
    if (!['DISCORD', 'GOOGLE', 'LOCAL'].includes(providerUpper)) {
      throw ErrorFactory.badRequest('Invalid provider');
    }

    // Get user's auth providers
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        authProviders: true,
      },
    });

    if (!user) {
      throw ErrorFactory.notFound('User not found');
    }

    // Prevent unlinking the last provider
    if (user.authProviders.length <= 1) {
      throw ErrorFactory.badRequest('Cannot unlink the last auth provider. You must have at least one way to sign in.');
    }

    // Find and delete the provider
    const authProvider = user.authProviders.find((ap) => ap.provider === providerUpper);

    if (!authProvider) {
      throw ErrorFactory.notFound(`${provider} account not linked`);
    }

    await prisma.authProvider.delete({
      where: { id: authProvider.id },
    });

    // If unlinking Discord, clear Discord-related fields
    if (providerUpper === 'DISCORD') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId: null,
          requireDiscordLink: false,
          discordLinkDeadline: null,
        },
      });
    }

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`,
    });
  })
);

export default router;
