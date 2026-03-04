import { OrganizationService } from "../../../services/organization.service";
import { defineEventHandler, readBody } from "h3";
import type { Group } from "~/types/organization";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<Group>>(event);
  return orgService.createGroup(body);
});
