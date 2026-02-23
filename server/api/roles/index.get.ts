/**
 * GET /api/roles
 * Returns paginated role list.
 */
import { getQuery } from 'h3';
import { roleFiltersSchema } from '~/schemas/role.schema';
import { RoleService } from '../../services/role.service';
import { requireAbility, validateWithSchema } from '../../utils/validation';

const roleService = new RoleService();

export default defineEventHandler(async (event) => {
  requireAbility(event, 'manage', 'System');

  const query = getQuery(event);
  const filters = validateWithSchema(roleFiltersSchema, query);

  const result = await roleService.list(
    filters.search,
    filters.page,
    filters.pageSize,
  );

  return result;
});
