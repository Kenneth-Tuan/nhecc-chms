/**
 * POST /api/roles
 * 建立新角色。
 */
import { readBody } from "h3";
import { createRoleSchema } from "~/schemas/role.schema";
import { RoleService } from "../../services/role.service";
import { requireAbility, validateWithSchema } from "../../utils/validation";

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "System");

  const body = await readBody(event);
  const payload = validateWithSchema(createRoleSchema, body);

  const role = await roleService.create(payload);

  return {
    success: true,
    data: role,
    message: "角色建立成功",
  };
});
