/**
 * CASL Ability definitions (shared between client and server)
 */
import { Ability, AbilityBuilder, type AbilityClass } from '@casl/ability';
import type { UserContext } from '~/types/auth';

export type AppAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'manage'
  | 'grade'
  | 'reveal';

export type AppSubject =
  | 'Dashboard'
  | 'Member'
  | 'Organization'
  | 'System'
  | 'Course'
  | 'all';

export type AppAbility = Ability<[AppAction, AppSubject]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Build a CASL Ability from a resolved UserContext.
 * Maps X-axis (permissions) and Z-axis (revealAuthority) into CASL rules.
 * Y-axis (scope) is handled separately in service-layer scope filters.
 */
export function buildAbility(userContext: UserContext): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(AppAbility);

  // X-axis: functional permissions
  if (userContext.permissions['dashboard:view']) can('view', 'Dashboard');
  if (userContext.permissions['dashboard:export']) can('export', 'Dashboard');
  if (userContext.permissions['member:view']) can('view', 'Member');
  if (userContext.permissions['member:create']) can('create', 'Member');
  if (userContext.permissions['member:edit']) can('update', 'Member');
  if (userContext.permissions['member:delete']) can('delete', 'Member');
  if (userContext.permissions['member:export']) can('export', 'Member');
  if (userContext.permissions['org:view']) can('view', 'Organization');
  if (userContext.permissions['org:manage']) can('manage', 'Organization');
  if (userContext.permissions['system:config']) can('manage', 'System');
  if (userContext.permissions['course:view']) can('view', 'Course');
  if (userContext.permissions['course:manage']) can('manage', 'Course');
  if (userContext.permissions['course:grade']) can('grade', 'Course');

  // Z-axis: field-level reveal authority
  if (userContext.revealAuthority.mobile) can('reveal', 'Member', 'mobile');
  if (userContext.revealAuthority.email) can('reveal', 'Member', 'email');
  if (userContext.revealAuthority.lineId) can('reveal', 'Member', 'lineId');
  if (userContext.revealAuthority.address) can('reveal', 'Member', 'address');
  if (userContext.revealAuthority.emergencyContactPhone)
    can('reveal', 'Member', 'emergencyContactPhone');

  return build();
}
