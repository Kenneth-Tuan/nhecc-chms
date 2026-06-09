## ADDED Requirements

### Requirement: 管理員可將學生從實體班級移除
The system SHALL allow users with `ADMIN_MANAGE` permission on a `CourseClass` to remove an enrolled or assigned student from that class.
Upon removal, the student's enrollment record SHALL be deleted, and the class's `enrollmentCount` and `studentIds` list SHALL be updated accordingly in a single atomic transaction.

#### Scenario: 管理員成功移除學生
- **WHEN** the administrator initiates a request to remove a student (`userId`) from a class (`classId`)
- **THEN** the system SHALL delete the corresponding `courseEnrollment` document
- **THEN** the system SHALL remove the `userId` from the `CourseClass`'s `studentIds` list and decrement `enrollmentCount` by 1
- **THEN** the system SHALL return a success response

#### Scenario: 權限不足時拒絕移除
- **WHEN** a user without `ADMIN_MANAGE` permission attempts to remove a student from a class
- **THEN** the system SHALL return a 403 Forbidden error

#### Scenario: 學生不存在於班級中
- **WHEN** the administrator attempts to remove a student who is not currently enrolled in the specified class
- **THEN** the system SHALL return a 400 Bad Request error or 404 Not Found error indicating the enrollment does not exist
