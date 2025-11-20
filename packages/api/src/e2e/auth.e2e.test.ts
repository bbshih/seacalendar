/**
 * Auth API E2E Tests
 * Tests authentication endpoints with real database
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { createTestUser, getTestPrisma } from '@seacalendar/database';

describe('Auth API E2E', () => {
  describe('POST /api/auth/local/register', () => {
    it('should register new user with local auth', async () => {
      const response = await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('newuser@example.com');

      // Verify user in database
      const prisma = getTestPrisma();
      const user = await prisma.user.findFirst({
        where: { email: 'newuser@example.com' },
        include: { authProviders: true },
      });

      expect(user).toBeDefined();
      expect(user?.authProviders).toHaveLength(1);
      expect(user?.authProviders[0].provider).toBe('local');
    });

    it('should reject registration with existing email', async () => {
      const prisma = getTestPrisma();
      await createTestUser(prisma, { email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'SecurePass123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject weak passwords', async () => {
      await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: '123', // Too weak
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/local/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'SecurePass123!',
        });

      // Then login
      const response = await request(app)
        .post('/api/auth/local/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/local/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPass123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Register and get tokens
      const registerRes = await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'refreshuser',
          email: 'refresh@example.com',
          password: 'SecurePass123!',
        });

      const refreshToken = registerRes.body.refreshToken;

      // Refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      // Register and get tokens
      const registerRes = await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'logoutuser',
          email: 'logout@example.com',
          password: 'SecurePass123!',
        });

      const accessToken = registerRes.body.accessToken;
      const refreshToken = registerRes.body.refreshToken;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Try to use refresh token (should fail)
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/local/register')
        .send({
          username: 'meuser',
          email: 'me@example.com',
          password: 'SecurePass123!',
        });

      const accessToken = registerRes.body.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('me@example.com');
    });

    it('should reject request without token', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
