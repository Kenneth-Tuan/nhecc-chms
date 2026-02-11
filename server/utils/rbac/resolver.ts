/**
 * RBAC Permission Resolver (ST002)
 * Implements the Union strategy for multi-role resolution.
 */
import type { Role, DataScope, PermissionKey, SensitiveField } from '~/types/role';
import type { UserContext } from '~/types/auth';
import type { Member } from '~/types/member';
import {
  ALL_PERMISSION_KEYS,
  ALL_SENSITIVE_FIELDS,
  SCOPE_HIERARCHY,
  createEmptyPermissions,
  createEmptyRevealAuthority,
} from './permissions';

/**
 * Resolve user context from member data and roles.
 * Uses Union strategy: broadest scope, any-role permissions.
 */
export function resolveUserContext(
  member: Member,
  roles: Role[],
): UserContext {
  // Resolve scope (Y-axis): take broadest
  const scope = resolveBroadestScope(roles);

  // Resolve permissions (X-axis): union of all roles
  const permissions = resolveUnionPermissions(roles);

  // Resolve reveal authority (Z-axis): union of all roles
  const revealAuthority = resolveUnionRevealAuthority(roles);

  // Build managed group IDs
  const groupIds = member.groupId ? [member.groupId] : [];
  const functionalGroupIds = member.functionalGroupIds || [];
  const managedGroupIds = [...new Set([...groupIds, ...functionalGroupIds])];

  return {
    userId: member.uuid,
    fullName: member.fullName,
    scope,
    zoneId: member.zoneId,
    groupIds,
    functionalGroupIds,
    managedGroupIds,
    permissions,
    revealAuthority,
  };
}

/**
 * Get the broadest scope from all roles.
 * Global > Zone > Group > Self
 */
function resolveBroadestScope(roles: Role[]): DataScope {
  let maxIndex = 0;

  for (const role of roles) {
    const index = SCOPE_HIERARCHY.indexOf(role.scope as typeof SCOPE_HIERARCHY[number]);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return SCOPE_HIERARCHY[maxIndex] as DataScope;
}

/**
 * Union permissions: if any role has permission, grant it.
 */
function resolveUnionPermissions(
  roles: Role[],
): Record<PermissionKey, boolean> {
  const result = createEmptyPermissions();

  for (const role of roles) {
    for (const key of ALL_PERMISSION_KEYS) {
      if (role.permissions[key]) {
        result[key] = true;
      }
    }
  }

  return result;
}

/**
 * Union reveal authority: if any role can reveal, grant it.
 */
function resolveUnionRevealAuthority(
  roles: Role[],
): Record<SensitiveField, boolean> {
  const result = createEmptyRevealAuthority();

  for (const role of roles) {
    for (const field of ALL_SENSITIVE_FIELDS) {
      if (role.revealAuthority[field]) {
        result[field] = true;
      }
    }
  }

  return result;
}
