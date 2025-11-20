/**
 * Votes API E2E Tests
 * Tests voting endpoints with real database
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { createTestUser, createTestPoll, createTestVote, getTestPrisma } from '@seacalendar/database';

describe('Votes API E2E', () => {
  let authToken: string;
  let userId: string;
  let pollId: string;
  let optionIds: string[];

  // Setup helper
  async function setupPollAndAuth() {
    const prisma = getTestPrisma();

    // Create user and get token
    const response = await request(app)
      .post('/api/auth/local/register')
      .send({
        username: `voteuser${Date.now()}`,
        email: `voteuser${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

    authToken = response.body.accessToken;
    userId = response.body.user.id;

    // Create poll
    const poll = await createTestPoll(prisma, { optionsCount: 3 });
    pollId = poll.id;
    optionIds = poll.options.map((opt) => opt.id);

    return { poll, authToken, userId };
  }

  describe('POST /api/polls/:id/vote', () => {
    it('should submit vote for poll options', async () => {
      await setupPollAndAuth();

      const response = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [
            { optionId: optionIds[0], availability: 'AVAILABLE' },
            { optionId: optionIds[1], availability: 'MAYBE' },
          ],
        })
        .expect(200);

      expect(response.body).toHaveProperty('votes');
      expect(response.body.votes).toHaveLength(2);

      // Verify in database
      const prisma = getTestPrisma();
      const votes = await prisma.vote.findMany({
        where: { userId, pollOptionId: { in: optionIds } },
      });

      expect(votes).toHaveLength(2);
    });

    it('should update existing votes', async () => {
      await setupPollAndAuth();

      // First vote
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [{ optionId: optionIds[0], availability: 'AVAILABLE' }],
        });

      // Update vote
      const response = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [{ optionId: optionIds[0], availability: 'MAYBE' }],
        })
        .expect(200);

      // Verify updated
      const prisma = getTestPrisma();
      const vote = await prisma.vote.findFirst({
        where: { userId, pollOptionId: optionIds[0] },
      });

      expect(vote?.availability).toBe('MAYBE');
    });

    it('should reject vote without auth', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      await request(app)
        .post(`/api/polls/${poll.id}/vote`)
        .send({
          votes: [{ optionId: poll.options[0].id, availability: 'AVAILABLE' }],
        })
        .expect(401);
    });

    it('should validate vote data', async () => {
      await setupPollAndAuth();

      // Invalid availability
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [{ optionId: optionIds[0], availability: 'INVALID' }],
        })
        .expect(400);

      // Invalid option ID
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [{ optionId: 'non-existent', availability: 'AVAILABLE' }],
        })
        .expect(400);
    });
  });

  describe('GET /api/polls/:id/votes', () => {
    it('should retrieve all votes for poll', async () => {
      const prisma = getTestPrisma();
      const { poll } = await setupPollAndAuth();

      // Create votes from multiple users
      const user1 = await createTestUser(prisma);
      const user2 = await createTestUser(prisma);

      await createTestVote(prisma, {
        userId: user1.id,
        optionId: poll.options[0].id,
      });
      await createTestVote(prisma, {
        userId: user2.id,
        optionId: poll.options[0].id,
      });

      const response = await request(app)
        .get(`/api/polls/${pollId}/votes`)
        .expect(200);

      expect(response.body.votes).toBeDefined();
      expect(response.body.votes.length).toBeGreaterThanOrEqual(2);
    });

    it('should return vote tallies', async () => {
      const prisma = getTestPrisma();
      const { poll } = await setupPollAndAuth();

      // Create votes
      const user1 = await createTestUser(prisma);
      await createTestVote(prisma, {
        userId: user1.id,
        optionId: poll.options[0].id,
        availability: 'AVAILABLE',
      });

      const response = await request(app)
        .get(`/api/polls/${pollId}/votes/tally`)
        .expect(200);

      expect(response.body.tallies).toBeDefined();
      expect(response.body.tallies[poll.options[0].id]).toBeDefined();
      expect(response.body.tallies[poll.options[0].id].available).toBeGreaterThan(0);
    });
  });

  describe('GET /api/polls/:id/votes/me', () => {
    it('should retrieve current user votes', async () => {
      await setupPollAndAuth();

      // Submit votes
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [
            { optionId: optionIds[0], availability: 'AVAILABLE' },
            { optionId: optionIds[1], availability: 'MAYBE' },
          ],
        });

      // Get user's votes
      const response = await request(app)
        .get(`/api/polls/${pollId}/votes/me`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.votes).toHaveLength(2);
      expect(response.body.votes[0].userId).toBe(userId);
    });

    it('should require authentication', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      await request(app)
        .get(`/api/polls/${poll.id}/votes/me`)
        .expect(401);
    });
  });

  describe('DELETE /api/polls/:id/votes', () => {
    it('should delete user votes', async () => {
      await setupPollAndAuth();

      // Submit votes
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          votes: [{ optionId: optionIds[0], availability: 'AVAILABLE' }],
        });

      // Delete votes
      await request(app)
        .delete(`/api/polls/${pollId}/votes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deleted
      const prisma = getTestPrisma();
      const votes = await prisma.vote.findMany({
        where: { userId },
      });

      expect(votes).toHaveLength(0);
    });
  });
});
