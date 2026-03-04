import { OrganizationService } from "../../../services/organization.service";
import { defineEventHandler, readBody, getRouterParam } from "h3";
import type { Group } from "~/types/organization";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Missing group id" });
  }
  const body = await readBody<Partial<Group>>(event);
  return orgService.updateGroup(id, body);
});
