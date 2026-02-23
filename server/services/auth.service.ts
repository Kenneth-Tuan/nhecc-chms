/**
 * Auth Service
 * Handles authentication and user context resolution.
 */
import type { UserContext, AuthContextResponse } from "~/types/auth";
import type { Role } from "~/types/role";
import { packRules } from "@casl/ability/extra";
import { MemberRepository } from "../repositories/member.repository";
import { RoleRepository } from "../repositories/role.repository";
import { resolveUserContext } from "../utils/rbac/resolver";
import { buildAbility } from "~/utils/casl/ability";

const memberRepo = new MemberRepository();
const roleRepo = new RoleRepository();

/** In-memory cache for user contexts */
const contextCache = new Map<
  string,
  { context: UserContext; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export class AuthService {
  async resolveContext(userId: string): Promise<UserContext> {
    const cached = contextCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    const member = await memberRepo.findById(userId);
    if (!member) {
      throw new Error(`User not found: ${userId}`);
    }

    const roles: Role[] = await roleRepo.findByIds(member.roleIds);
    if (roles.length === 0) {
      const generalRole = await roleRepo.findById("general");
      if (generalRole) {
        roles.push(generalRole);
      }
    }

    const context = resolveUserContext(member, roles);

    contextCache.set(userId, {
      context,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return context;
  }

  clearCache(userId?: string): void {
    if (userId) {
      contextCache.delete(userId);
    } else {
      contextCache.clear();
    }
  }

  async getAuthContextResponse(userId: string): Promise<AuthContextResponse> {
    const context = await this.resolveContext(userId);
    const ability = buildAbility(context);
    return {
      user: context,
      rules: packRules(ability.rules),
    };
  }
}
