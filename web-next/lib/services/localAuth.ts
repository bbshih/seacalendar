/**
 * Local Authentication Service (Username/Password)
 */

import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { ErrorFactory } from '@/lib/errors';

const SALT_ROUNDS = 12;
const DISCORD_LINK_DAYS = 7;

interface RegisterData {
  username: string;
  email?: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

/**
 * Register a new user with username/password
 * Requires Discord link within 7 days
 */
export async function registerUser(data: RegisterData) {
  const { username, email, password } = data;

  // Validate username format (alphanumeric, underscores, hyphens, 3-20 chars)
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    throw ErrorFactory.badRequest(
      'Invalid username format. Use 3-20 alphanumeric characters, underscores, or hyphens.'
    );
  }

  // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    throw ErrorFactory.badRequest(
      'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.'
    );
  }

  // Check if username already exists
  const existingUser = await db.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw ErrorFactory.badRequest('Username already taken');
  }

  // Check if email already exists
  if (email) {
    const existingEmail = await db.user.findFirst({
      where: { email },
    });

    if (existingEmail) {
      throw ErrorFactory.badRequest('Email already registered');
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user with Discord link deadline
  const discordLinkDeadline = new Date();
  discordLinkDeadline.setDate(discordLinkDeadline.getDate() + DISCORD_LINK_DAYS);

  const user = await db.user.create({
    data: {
      username,
      email: email || undefined,
      passwordHash,
      requireDiscordLink: true,
      discordLinkDeadline,
      authProviders: {
        create: {
          provider: 'LOCAL',
          providerId: username, // Use username as provider ID for local auth
        },
      },
    },
  });

  return user;
}

/**
 * Login with username/password
 */
export async function loginUser(data: LoginData) {
  const { username, password } = data;

  // Find user by username
  const user = await db.user.findUnique({
    where: { username },
    include: {
      authProviders: {
        where: { provider: 'LOCAL' },
      },
    },
  });

  if (!user || !user.passwordHash) {
    throw ErrorFactory.unauthorized('Invalid username or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw ErrorFactory.forbidden('Account is inactive');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw ErrorFactory.unauthorized('Invalid username or password');
  }

  return user;
}

/**
 * Change password for authenticated user
 */
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  // Validate new password strength
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
    throw ErrorFactory.badRequest(
      'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.'
    );
  }

  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw ErrorFactory.badRequest('User does not have a password set');
  }

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isValid) {
    throw ErrorFactory.unauthorized('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
