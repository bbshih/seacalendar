/**
 * Polls API E2E Tests
 * Tests poll endpoints with real database
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { createTestUser, createTestPoll, getTestPrisma } from '@seacalendar/database';
import { PollStatus } from '@prisma/client';

describe('Polls API E2E', () => {
  let authToken: string;
  let userId: string;

  // Helper to get authenticated token
  async function getAuthToken() {
    const response = await request(app)
      .post('/api/auth/local/register')
      .send({
        username: 'polluser',
        email: `polluser${Date.now()}@example.com`,
        password: 'SecurePass123!',
      });

    authToken = response.body.accessToken;
    userId = response.body.user.id;
    return authToken;
  }

  describe('POST /api/polls', () => {
    it('should create new poll', async () => {
      await getAuthToken();

      const response = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Team Lunch',
          description: 'Where should we go for lunch?',
          guildId: 'guild-123',
          channelId: 'channel-456',
          options: [
            {
              label: 'Friday 12pm',
              date: '2025-12-01',
              timeStart: '12:00',
              timeEnd: '14:00',
            },
            {
              label: 'Saturday 1pm',
              date: '2025-12-02',
              timeStart: '13:00',
              timeEnd: '15:00',
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Team Lunch');
      expect(response.body.options).toHaveLength(2);
      expect(response.body.status).toBe('VOTING');

      // Verify in database
      const prisma = getTestPrisma();
      const poll = await prisma.poll.findUnique({
        where: { id: response.body.id },
        include: { options: true },
      });

      expect(poll).toBeDefined();
      expect(poll?.options).toHaveLength(2);
    });

    it('should reject poll creation without auth', async () => {
      await request(app)
        .post('/api/polls')
        .send({
          title: 'Unauthorized Poll',
          guildId: 'guild-123',
          channelId: 'channel-456',
          options: [],
        })
        .expect(401);
    });

    it('should validate poll data', async () => {
      await getAuthToken();

      // Missing title
      await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guildId: 'guild-123',
          channelId: 'channel-456',
          options: [],
        })
        .expect(400);

      // No options
      await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Options Poll',
          guildId: 'guild-123',
          channelId: 'channel-456',
          options: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/polls/:id', () => {
    it('should retrieve poll by id', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      const response = await request(app)
        .get(`/api/polls/${poll.id}`)
        .expect(200);

      expect(response.body.id).toBe(poll.id);
      expect(response.body.title).toBe(poll.title);
      expect(response.body.options).toBeDefined();
    });

    it('should return 404 for non-existent poll', async () => {
      await request(app)
        .get('/api/polls/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/polls', () => {
    it('should list user polls', async () => {
      await getAuthToken();
      const prisma = getTestPrisma();

      // Create polls for this user
      await createTestPoll(prisma, { creatorId: userId });
      await createTestPoll(prisma, { creatorId: userId });

      const response = await request(app)
        .get('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('polls');
      expect(response.body.polls.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter polls by status', async () => {
      await getAuthToken();
      const prisma = getTestPrisma();

      await createTestPoll(prisma, {
        creatorId: userId,
        status: PollStatus.VOTING,
      });
      await createTestPoll(prisma, {
        creatorId: userId,
        status: PollStatus.CLOSED,
      });

      const response = await request(app)
        .get('/api/polls?status=VOTING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.polls).toBeDefined();
      response.body.polls.forEach((poll: any) => {
        expect(poll.status).toBe('VOTING');
      });
    });
  });

  describe('PATCH /api/polls/:id', () => {
    it('should update poll by creator', async () => {
      await getAuthToken();
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma, { creatorId: userId });

      const response = await request(app)
        .patch(`/api/polls/${poll.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated description');
    });

    it('should reject update by non-creator', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      await getAuthToken(); // Different user

      await request(app)
        .patch(`/api/polls/${poll.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('POST /api/polls/:id/close', () => {
    it('should close poll by creator', async () => {
      await getAuthToken();
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma, { creatorId: userId });

      const response = await request(app)
        .post(`/api/polls/${poll.id}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CLOSED');
      expect(response.body.closedAt).toBeDefined();
    });

    it('should reject closing by non-creator', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      await getAuthToken(); // Different user

      await request(app)
        .post(`/api/polls/${poll.id}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/polls/:id', () => {
    it('should delete poll by creator', async () => {
      await getAuthToken();
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma, { creatorId: userId });

      await request(app)
        .delete(`/api/polls/${poll.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deleted
      const deleted = await prisma.poll.findUnique({
        where: { id: poll.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject deletion by non-creator', async () => {
      const prisma = getTestPrisma();
      const poll = await createTestPoll(prisma);

      await getAuthToken(); // Different user

      await request(app)
        .delete(`/api/polls/${poll.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
