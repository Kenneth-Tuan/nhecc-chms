/**
 * PATCH /api/roles/:id
 * Updates an existing role.
 */
import { readBody } from 'h3';
import { updateRoleSchema } from '~/schemas/role.schema';
import { RoleService } from '../../services/role.service';
import { requireAbility, validateWithSchema } from '../../utils/validation';

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requireAbility(event, 'manage', 'System');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少角色 ID' });
  }

  const body = await readBody(event);
  const payload = validateWithSchema(updateRoleSchema, body);

  const updated = await roleService.update(id, payload);

  return {
    success: true,
    data: updated,
    message: '角色更新成功',
  };
});
