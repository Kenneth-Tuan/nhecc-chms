/**
 * GET /api/roles/:id
 * 獲取單一角色詳情。
 */
import { RoleService } from "../../services/role.service";
import { requireAbility } from "../../utils/validation";

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "System");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少角色 ID" });
  }

  const role = await roleService.getById(id);
  return role;
});
