import { OrganizationService } from "../../../services/organization.service";
import { defineEventHandler, getRouterParam } from "h3";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Missing zone id" });
  }
  return orgService.deleteZone(id);
});
