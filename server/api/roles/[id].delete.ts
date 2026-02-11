/**
 * DELETE /api/roles/:id
 * Deletes a role.
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

  await roleService.delete(id);

  return {
    success: true,
    message: '角色刪除成功',
  };
});
