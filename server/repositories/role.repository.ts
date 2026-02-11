/**
 * Role Repository
 * Abstracts data source for roles.
 */
import type { Role } from '~/types/role';
import type { CreateRolePayload, UpdateRolePayload } from '~/types/role';
import { mockRoles } from '../mockData';
import { generateId } from '../utils/helpers';

/** In-memory store for DEV mode */
let devRoles: Role[] = [...mockRoles];

export class RoleRepository {
  /**
   * Find all roles.
   */
  async findAll(search?: string): Promise<Role[]> {
    let results = [...devRoles];

    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term),
      );
    }

    return results;
  }

  /**
   * Find a single role by ID.
   */
  async findById(id: string): Promise<Role | undefined> {
    return devRoles.find((r) => r.id === id);
  }

  /**
   * Find multiple roles by IDs.
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    return devRoles.filter((r) => ids.includes(r.id));
  }

  /**
   * Create a new role.
   */
  async create(payload: CreateRolePayload): Promise<Role> {
    const now = new Date().toISOString();
    const newRole: Role = {
      id: generateId(),
      name: payload.name,
      description: payload.description,
      isSystem: false,
      permissions: payload.permissions,
      scope: payload.scope,
      revealAuthority: payload.revealAuthority,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    };

    devRoles.push(newRole);
    return newRole;
  }

  /**
   * Update an existing role.
   */
  async update(
    id: string,
    payload: UpdateRolePayload,
  ): Promise<Role | undefined> {
    const index = devRoles.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    // Prevent modifying system roles' permissions
    if (devRoles[index].isSystem) {
      // Only allow name and description changes for system roles
      const updated: Role = {
        ...devRoles[index],
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        updatedAt: new Date().toISOString(),
      };
      devRoles[index] = updated;
      return updated;
    }

    const updated: Role = {
      ...devRoles[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    devRoles[index] = updated;
    return updated;
  }

  /**
   * Delete a role.
   */
  async delete(id: string): Promise<boolean> {
    const index = devRoles.findIndex((r) => r.id === id);
    if (index === -1) return false;

    // Prevent deleting system roles
    if (devRoles[index].isSystem) {
      return false;
    }

    devRoles.splice(index, 1);
    return true;
  }

  /**
   * Reset to initial mock data (for testing).
   */
  reset(): void {
    devRoles = [...mockRoles];
  }
}
