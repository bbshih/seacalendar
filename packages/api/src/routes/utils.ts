/**
 * Utility Routes
 * Shared utility endpoints like date parsing
 */

import { Router } from 'express';
import { z } from 'zod';
import { parseDateFromNaturalLanguage } from '@seacalendar/shared';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const parseDateSchema = z.object({
  input: z.string().min(1).max(200),
});

/**
 * POST /api/utils/parse-dates
 * Parse natural language date input into ISO date strings
 * Public endpoint - no auth required
 */
router.post(
  '/parse-dates',
  asyncHandler(async (req, res) => {
    const { input } = parseDateSchema.parse(req.body);

    const dates = parseDateFromNaturalLanguage(input);

    res.json({
      success: true,
      data: {
        input,
        dates,
      },
    });
  })
);

export default router;
