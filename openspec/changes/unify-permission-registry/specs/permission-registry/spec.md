## ADDED Requirements

### Requirement: Unified Permission Registry Table
The system SHALL provide a centralized registry (`PERMISSION_REGISTRY`) mapping all application features and sensitive data fields to their respective permission keys and sensitive field requirements.

#### Scenario: Frontend checks feature access
- **WHEN** the frontend UI evaluates whether to render a feature button (e.g., "Delete Member")
- **THEN** it MUST query the centralized registry to find the required `PermissionKey` and verify against the user's active permissions.

#### Scenario: Backend validates API access
- **WHEN** an API endpoint receives a request involving sensitive fields
- **THEN** it MUST use the registry to map the requested fields to the correct `SensitiveField` and check against CASL reveal authority.
