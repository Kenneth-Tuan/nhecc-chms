/**
 * DELETE /api/roles/:id
 * 刪除角色。
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

  await roleService.delete(id);

  return {
    success: true,
    message: "角色刪除成功",
  };
});
