import { OrganizationService } from "../../../services/organization.service";
import { defineEventHandler, readBody } from "h3";
import type { Zone } from "~/types/organization";
import { getUserContext, requireAbility } from "../../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "Organization");
  const ctx = getUserContext(event);
  const body = await readBody<Partial<Zone>>(event);
  return orgService.createZone(body, ctx);
});
