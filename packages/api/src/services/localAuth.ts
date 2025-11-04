import bcrypt from 'bcrypt';
import { prisma } from '@seacalendar/database';
import { ApiError } from '../utils/errors';

const SALT_ROUNDS = 12;
const DISCORD_LINK_DAYS = 7; // Days to link Discord account

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

export const localAuthService = {
  /**
   * Register a new user with username/password
   * Requires Discord link within 7 days
   */
  async register(data: RegisterData) {
    const { username, email, password } = data;

    // Validate username format (alphanumeric, underscores, hyphens, 3-20 chars)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      throw new ApiError(
        'Invalid username format. Use 3-20 alphanumeric characters, underscores, or hyphens.',
        400,
        'INVALID_USERNAME'
      );
    }

    // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      throw new ApiError(
        'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.',
        400,
        'WEAK_PASSWORD'
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ApiError('Username already taken', 400, 'USERNAME_TAKEN');
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email },
      });

      if (existingEmail) {
        throw new ApiError('Email already registered', 400, 'EMAIL_TAKEN');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with Discord link deadline
    const discordLinkDeadline = new Date();
    discordLinkDeadline.setDate(discordLinkDeadline.getDate() + DISCORD_LINK_DAYS);

    const user = await prisma.user.create({
      data: {
        username,
        email: email || undefined,
        passwordHash,
        requireDiscordLink: true,
        discordLinkDeadline,
        preferences: {
          create: {}, // Default preferences
        },
        authProviders: {
          create: {
            provider: 'LOCAL',
            providerId: username, // Use username as provider ID for LOCAL auth
          },
        },
      },
      include: {
        preferences: true,
        authProviders: true,
      },
    });

    return user;
  },

  /**
   * Authenticate user with username/password
   */
  async login(data: LoginData) {
    const { username, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        preferences: true,
        authProviders: {
          where: { provider: 'LOCAL' },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ApiError('Account is disabled', 403, 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new ApiError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check Discord link deadline
    if (user.requireDiscordLink && user.discordLinkDeadline) {
      const now = new Date();
      if (now > user.discordLinkDeadline && !user.discordId) {
        throw new ApiError(
          `Account requires Discord linking. Deadline was ${user.discordLinkDeadline.toLocaleDateString()}.`,
          403,
          'DISCORD_LINK_REQUIRED'
        );
      }
    }

    return user;
  },

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError('User not found or does not have password auth', 404, 'NOT_FOUND');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new ApiError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Validate new password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      throw new ApiError(
        'New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.',
        400,
        'WEAK_PASSWORD'
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  },

  /**
   * Request password reset (generates a token)
   * TODO: Implement email sending in future
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists (security)
    if (!user) {
      return { success: true, message: 'If email exists, reset link sent' };
    }

    // TODO: Generate password reset token and send email
    // For now, return success message
    return { success: true, message: 'Password reset not yet implemented' };
  },
};
