## ADDED Requirements

### Requirement: Delete Course Class
The system SHALL allow administrators to delete an existing course class ONLY IF they have the `courseClass:delete` permission, and the class has no enrolled students and has not started.

#### Scenario: Admin deletes a class successfully
- **WHEN** an admin with `courseClass:delete` permission requests to delete a class (status is SETUP, enrollmentCount is 0) via `DELETE /api/courses/classes/[id]`
- **THEN** the system deletes the class from the database and returns a success response

#### Scenario: Unauthorized user attempts to delete
- **WHEN** a user without `courseClass:delete` permission attempts to delete a class
- **THEN** the system rejects the request with a 403 Forbidden error

#### Scenario: User attempts to delete out of scope class
- **WHEN** a user has `courseClass:delete` permission but the class is outside their allowed scope
- **THEN** the system rejects the request with a 403 Forbidden error

#### Scenario: Admin deletes a class with enrolled students
- **WHEN** an admin attempts to delete a class that has `enrollmentCount > 0` or existing enrollments
- **THEN** the system rejects the request with a 409 Conflict error and a message explaining why it cannot be deleted

#### Scenario: Admin deletes a class that is in progress or completed
- **WHEN** an admin attempts to delete a class whose status is `IN_PROGRESS` or `COMPLETED`
- **THEN** the system rejects the request with a 409 Conflict error

#### Scenario: Admin deletes a non-existent class
- **WHEN** an admin attempts to delete a class ID that does not exist
- **THEN** the system rejects the request with a 404 Not Found error
