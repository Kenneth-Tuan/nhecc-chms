/**
 * GET /api/dev/emulator-accounts
 * 列出 seed 用的測試帳（僅 Emulator 後端啟用時可用）。
 */
import { createError } from "h3";
import { mockTestUsers } from "../../mockData/auth.data";
import { mockMembers } from "../../mockData/members.data";
import { mockRoles } from "../../mockData/roles.data";
import { isFirebaseEmulatorBackend } from "../../utils/firebase-emulator";

export default defineEventHandler(() => {
  if (!isFirebaseEmulatorBackend()) {
    throw createError({ statusCode: 404, message: "Not Found" });
  }

  const roleName = (id: string) =>
    mockRoles.find((r) => r.id === id)?.name ?? id;

  return mockTestUsers.map((u) => {
    const member = mockMembers.find((m) => m.uuid === u.userId);
    return {
      uid: u.userId,
      fullName: member?.fullName ?? u.userId,
      email: member?.email ?? "",
      roleLabels: u.roleIds.map(roleName).join("、"),
    };
  });
});
