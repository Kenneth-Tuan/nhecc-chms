/**
 * GET /api/roles/:id
 * Returns a single role.
 */
import { RoleService } from '../../services/role.service';
import { requirePermission } from '../../utils/validation';

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requirePermission(event, 'system:config');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少角色 ID' });
  }

  const role = await roleService.getById(id);
  return role;
});
