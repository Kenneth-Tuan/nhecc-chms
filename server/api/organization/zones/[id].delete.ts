import { OrganizationService } from "../../../services/organization.service";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { getUserContext, requireAbility } from "../../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "Organization");
  const ctx = getUserContext(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Missing zone id" });
  }
  return orgService.deleteZone(id, ctx);
});
