## MODIFIED Requirements

### Requirement: Pure Functional CASL Abilities
The `buildAbility` function MUST ONLY assign functional access controls (X-axis) and sensitive field unlock capabilities (Z-axis), completely devoid of data scope constraints.

#### Scenario: Building ability rules
- **WHEN** `buildAbility` processes the user's roles
- **THEN** the resulting CASL rules MUST NOT contain any object condition matchers (e.g., `{ uuid: ... }` or `{ teacherIds: ... }`).
