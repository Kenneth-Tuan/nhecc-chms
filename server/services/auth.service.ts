/**
 * Auth Service
 * Handles authentication and user context resolution.
 */
import type { UserContext, MockTestUser, AuthContextResponse } from '~/types/auth';
import type { Role } from '~/types/role';
import { MemberRepository } from '../repositories/member.repository';
import { RoleRepository } from '../repositories/role.repository';
import { resolveUserContext } from '../utils/rbac/resolver';
import { mockTestUsers, DEFAULT_TEST_USER_ID } from '../mockData';

const memberRepo = new MemberRepository();
const roleRepo = new RoleRepository();

/** In-memory cache for user contexts (DEV mode) */
const contextCache = new Map<string, { context: UserContext; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class AuthService {
  /**
   * Resolve user context from userId.
   * Uses cache to avoid repeated lookups.
   */
  async resolveContext(userId: string): Promise<UserContext> {
    // Check cache
    const cached = contextCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    // Resolve fresh
    const member = await memberRepo.findById(userId);
    if (!member) {
      throw new Error(`User not found: ${userId}`);
    }

    const roles: Role[] = await roleRepo.findByIds(member.roleIds);
    if (roles.length === 0) {
      // Fallback: assign general role
      const generalRole = await roleRepo.findById('general');
      if (generalRole) {
        roles.push(generalRole);
      }
    }

    const context = resolveUserContext(member, roles);

    // Cache
    contextCache.set(userId, {
      context,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return context;
  }

  /**
   * Clear cached context for a user.
   */
  clearCache(userId?: string): void {
    if (userId) {
      contextCache.delete(userId);
    } else {
      contextCache.clear();
    }
  }

  /**
   * Get auth context response (for /api/auth/context).
   */
  async getAuthContextResponse(userId: string): Promise<AuthContextResponse> {
    const context = await this.resolveContext(userId);
    return {
      user: context,
      mode: 'DEV',
      availableTestUsers: mockTestUsers,
    };
  }

  /**
   * Get all available test users.
   */
  getTestUsers(): MockTestUser[] {
    return mockTestUsers;
  }

  /**
   * Get default test user ID.
   */
  getDefaultUserId(): string {
    return DEFAULT_TEST_USER_ID;
  }
}
