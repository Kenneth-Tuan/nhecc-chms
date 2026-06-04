## 1. CASL Permissions Update

- [x] 1.1 Update `app/utils/casl/ability.ts`: Add `can("delete", "CourseClass")` mapping for users with `"courseClass:delete"` permission.
- [x] 1.2 Update `server/utils/courseClass.policy.ts`: Add `"ADMIN_DELETE"` to `CourseClassAccessContext`.
- [x] 1.3 Update `server/utils/courseClass.policy.ts`: Map `"ADMIN_DELETE"` context to `"delete"` action in `mapContextToAction`.

## 2. Backend Service Update

- [x] 2.1 Update `deleteClass` in `server/services/courseClass.service.ts` to accept an `ability: AppAbility` parameter.
- [x] 2.2 Retrieve the target class using `classRepo.findById(classId)`. Throw 404 if not found.
- [x] 2.3 Add `this.assertClassAccess("ADMIN_DELETE", targetClass, "您無權刪除此班級", ability)` to enforce RBAC permissions.
- [x] 2.4 Add data orphan safeguard: If `targetClass.status !== 'SETUP'` or `targetClass.enrollmentCount > 0` (or `studentIds.length > 0`), throw a 409 Error indicating the class cannot be deleted.
- [x] 2.5 Execute `classRepo.delete(classId)` if all checks pass.

## 3. API Endpoint Creation

- [x] 3.1 Create new file `server/api/courses/classes/[id].delete.ts`.
- [x] 3.2 Implement the API handler using `defineEventHandler`.
- [x] 3.3 Ensure the endpoint enforces CASL action by calling `requireAbility(event, "delete", "CourseClass")`.
- [x] 3.4 Extract the `classId` from route parameters and invoke `courseClassService.deleteClass(classId, event.context.ability)`.
- [x] 3.5 Return a standard success response.

## 4. Frontend Integration

- [x] 4.1 Update `app/composables/useCourseClass.ts` to export a new `deleteCourseClass(id: string)` method calling the DELETE endpoint.
- [x] 4.2 Update relevant UI components (e.g. course class list or detail) to conditionally render the delete button ONLY IF the user has CASL `"delete"` permission for `"CourseClass"`.
- [x] 4.3 Add conditions so the delete button is disabled or hidden if the class status is not SETUP or has enrollments.
- [x] 4.4 Implement a `ConfirmDialog` when the delete button is clicked.
- [x] 4.5 Connect the UI to `deleteCourseClass` and handle loading state, success toast, and error handling (especially capturing 409 errors).
