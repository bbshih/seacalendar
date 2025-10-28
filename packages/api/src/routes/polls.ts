/**
 * Poll Routes
 * CRUD operations for polls
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  createPoll,
  getPoll,
  updatePoll,
  cancelPoll,
  finalizePoll,
  getUserPolls,
  getInvitedPolls,
} from '../services/pollService';
import { requireAuth, optionalAuth, requirePollOwnership } from '../middleware/auth';
import { asyncHandler, ErrorFactory } from '../middleware/errorHandler';
import { pollCreationLimiter } from '../middleware/rateLimit';

const router = Router();

// Validation schemas
const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['EVENT', 'GENERIC']).optional(),
  votingDeadline: z.string().datetime().optional(),
  guildId: z.string().optional(),
  channelId: z.string().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        date: z.string().datetime().optional(),
        timeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        timeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
    )
    .min(1)
    .max(30),
  invitedUserIds: z.array(z.string()).optional(),
});

const updatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  votingDeadline: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'VOTING', 'FINALIZED', 'CANCELLED', 'EXPIRED']).optional(),
});

const finalizePollSchema = z.object({
  optionId: z.string().uuid(),
});

/**
 * POST /api/polls
 * Create a new poll
 */
router.post(
  '/',
  requireAuth,
  pollCreationLimiter,
  asyncHandler(async (req, res) => {
    // Validate request body
    const validatedData = createPollSchema.parse(req.body);

    // Convert string dates to Date objects
    const pollData = {
      ...validatedData,
      votingDeadline: validatedData.votingDeadline
        ? new Date(validatedData.votingDeadline)
        : undefined,
      options: validatedData.options.map((opt) => ({
        ...opt,
        date: opt.date ? new Date(opt.date) : undefined,
      })),
    };

    const poll = await createPoll(req.user!.id, pollData);

    res.status(201).json({
      success: true,
      data: { poll },
    });
  })
);

/**
 * GET /api/polls/:id
 * Get poll details
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const poll = await getPoll(req.params.id, req.user?.id);

    res.json({
      success: true,
      data: { poll },
    });
  })
);

/**
 * PATCH /api/polls/:id
 * Update poll
 */
router.patch(
  '/:id',
  requireAuth,
  requirePollOwnership,
  asyncHandler(async (req, res) => {
    // Validate request body
    const validatedData = updatePollSchema.parse(req.body);

    // Convert string dates to Date objects
    const updateData = {
      ...validatedData,
      votingDeadline: validatedData.votingDeadline
        ? new Date(validatedData.votingDeadline)
        : undefined,
    };

    const poll = await updatePoll(req.params.id, req.user!.id, updateData);

    res.json({
      success: true,
      data: { poll },
    });
  })
);

/**
 * DELETE /api/polls/:id
 * Cancel poll
 */
router.delete(
  '/:id',
  requireAuth,
  requirePollOwnership,
  asyncHandler(async (req, res) => {
    const poll = await cancelPoll(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: { poll },
      message: 'Poll cancelled successfully',
    });
  })
);

/**
 * POST /api/polls/:id/finalize
 * Finalize poll with winning option
 */
router.post(
  '/:id/finalize',
  requireAuth,
  requirePollOwnership,
  asyncHandler(async (req, res) => {
    const validatedData = finalizePollSchema.parse(req.body);

    const poll = await finalizePoll(req.params.id, req.user!.id, validatedData.optionId);

    res.json({
      success: true,
      data: { poll },
      message: 'Poll finalized successfully',
    });
  })
);

/**
 * GET /api/polls/user/created
 * Get user's created polls
 */
router.get(
  '/user/created',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = req.query.status as any;
    const polls = await getUserPolls(req.user!.id, status);

    res.json({
      success: true,
      data: { polls },
    });
  })
);

/**
 * GET /api/polls/user/invited
 * Get polls user is invited to
 */
router.get(
  '/user/invited',
  requireAuth,
  asyncHandler(async (req, res) => {
    const polls = await getInvitedPolls(req.user!.id);

    res.json({
      success: true,
      data: { polls },
    });
  })
);

export default router;
