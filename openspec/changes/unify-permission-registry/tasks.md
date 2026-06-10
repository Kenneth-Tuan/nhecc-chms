## 1. Phase 1: Build Unified Permission Registry

- [ ] 1.1 Create `app/utils/rbac/registry.ts` and define `PERMISSION_REGISTRY` mapping features/fields to permission keys and sensitive fields.
- [ ] 1.2 Implement `usePolicy` composable in `app/composables/usePolicy.ts` to provide frontend UI access to the registry.
- [ ] 1.3 Update existing frontend components (e.g. member list, member details) to use `usePolicy().canAccessFeature()` and `canRevealField()` for static UI toggles.
- [ ] 1.4 Refactor `server/utils/validation.ts` to include a helper `requireFeatureAccess` that reads from the registry.

## 2. Phase 2: Refactor Permission Logic (Policy Pattern)

- [ ] 2.1 Refactor `app/utils/casl/ability.ts`: Remove all Data Scope filtering logic (e.g., `{ uuid: userContext.userId }`) so it only handles pure functional rules.
- [ ] 2.2 Create Base Policy or generic interfaces in `server/policies/base.policy.ts` (if applicable) and standard error handling.
- [ ] 2.3 Create `MemberPolicy` (`server/policies/member.policy.ts`) implementing `canUpdate`, `canDelete`, etc., combining CASL and Data Scope.
- [ ] 2.4 Refactor `server/services/member.service.ts`: Update `getDetail` and `list` methods to return `_meta.canUpdate` and `_meta.canDelete` calculated from `MemberPolicy`.
- [ ] 2.5 Refactor `server/api/members/**/*.ts`: Replace scattered `requireAbility` with calls to `MemberPolicy`.
- [ ] 2.6 Migrate `courseClass.policy.ts` into the standard Policy pattern.
- [ ] 2.7 Update other entity services and API routes (e.g., Organization, CourseTemplate) to follow the new Policy and Backend-driven UI pattern.

## 3. Phase 3: Validation & Cleanup

- [ ] 3.1 Verify frontend functionality: Ensure UI elements toggle correctly based on dynamic `_meta` flags and static `usePolicy` checks.
- [ ] 3.2 Verify backend enforcement: Ensure API routes still block unauthorized access based on the new Policy pattern.
- [ ] 3.3 Cleanup old inline permission logic and unused imports across the codebase.
