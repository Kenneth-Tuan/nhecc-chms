## MODIFIED Requirements

### Requirement: Member Scope Enforcement
The system MUST enforce data scope boundaries when fetching or mutating Member records, relying on the unified Policy Pattern instead of inline service logic.

#### Scenario: Updating member data
- **WHEN** a user attempts to update a member profile
- **THEN** the system MUST throw a 403 Forbidden error if `MemberPolicy.canUpdate()` returns false.

#### Scenario: Viewing member list
- **WHEN** a user requests the member list
- **THEN** each returned member MUST include a `_meta.canUpdate` and `_meta.canDelete` boolean.
