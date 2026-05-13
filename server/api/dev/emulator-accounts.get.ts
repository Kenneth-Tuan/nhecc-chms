/**
 * GET /api/dev/emulator-accounts
 * 列出 seed 用的全部測試帳（僅 Emulator 後端啟用時可用）。
 */
import { createError } from "h3";
import { mockMembers } from "../../mockData/members.data";
import { mockRoles } from "../../mockData/roles.data";
import { isFirebaseEmulatorBackend } from "../../utils/firebase-emulator";

export default defineEventHandler(() => {
  if (!isFirebaseEmulatorBackend()) {
    throw createError({ statusCode: 404, message: "Not Found" });
  }

  const roleById = new Map(mockRoles.map((role) => [role.id, role]));

  return mockMembers.map((member) => {
    const roleIds = member.roleIds.length ? member.roleIds : ["general"];
    const roles = roleIds.map((id) => {
      const role = roleById.get(id);
      return {
        id,
        name: role?.name ?? id,
      };
    });

    return {
      uid: member.uuid,
      fullName: member.fullName,
      email: member.email,
      roleIds,
      roles,
      roleLabels: roles.map((role) => role.name).join("、"),
    };
  });
});
