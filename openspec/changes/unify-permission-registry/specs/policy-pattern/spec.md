## ADDED Requirements

### Requirement: Service-Level Policy Pattern
The system SHALL use Entity-specific Policies to encapsulate all dynamic access controls, combining functional permissions (CASL), data scope rules, and business logic conditions.

#### Scenario: Validating entity update access
- **WHEN** an API or Service attempts to modify an entity
- **THEN** it MUST invoke the entity's Policy (e.g., `MemberPolicy.canUpdate()`) rather than evaluating CASL or Data Scopes directly in the service layer.

#### Scenario: Injecting _meta access indicators
- **WHEN** the backend returns a list of entities to the frontend
- **THEN** the Policy MUST be evaluated for each entity and the result appended to a `_meta` object (e.g., `_meta.canUpdate`).
