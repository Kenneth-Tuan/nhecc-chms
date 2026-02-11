/**
 * POST /api/roles
 * Creates a new role.
 */
import { readBody } from 'h3';
import { createRoleSchema } from '~/schemas/role.schema';
import { RoleService } from '../../services/role.service';
import { requirePermission, validateWithSchema } from '../../utils/validation';

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const payload = validateWithSchema(createRoleSchema, body);

  const role = await roleService.create(payload);

  return {
    success: true,
    data: role,
    message: '角色建立成功',
  };
});
