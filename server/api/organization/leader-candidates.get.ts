import { MemberRepository } from "../../repositories/member.repository";
import { RoleRepository } from "../../repositories/role.repository";
import { defineEventHandler, getQuery } from "h3";
import type { DataScope } from "~/types/role";
import type { Member } from "~/types/member";

const memberRepo = new MemberRepository();
const roleRepo = new RoleRepository();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as "zone" | "group";
  const groupId = query.groupId as string | undefined;
  const zoneId = query.zoneId as string | undefined;

  // 1. Get roles and filter by scope
  const roles = await roleRepo.findAll();
  let targetScopes: DataScope[] = [];
  if (type === "zone") {
    targetScopes = ["Global", "Zone"];
  } else {
    targetScopes = ["Global", "Zone", "Group"];
  }

  const validRoleIds = roles
    .filter((r: any) => targetScopes.includes(r.scope))
    .map((r: any) => r.id);

  // 2. Fetch members
  let members = await memberRepo.findAll({ status: "Active" });

  if (type === "group" && groupId) {
    // 編輯小組時：只列出屬於這個小組的成員
    members = members.filter((m: Member) => m.groupId === groupId);
  } else if (type === "group" && !groupId && zoneId) {
    // 新增小組時：列出屬於同個牧區的成員？或者是未分配小組的？
    // The prompt says "同理，在新增編輯小組的指派小組長欄位的 options 會是 scope 在 group 層級上，且屬於這個小組的成員。"
    // But a new group has no members. So let's allow anyone in the zone, or pending members. Let's just return all members in the zone.
    members = members.filter((m: Member) => m.zoneId === zoneId || !m.groupId);
  }

  // 3. Filter members by role scope
  const candidates = members
    .filter(
      (m: Member) =>
        m.roleIds?.some((rId: string) => validRoleIds.includes(rId)) ||
        // 如果沒設定任何 roleId (例如超級管理員) 也能被選？如果是超級管理員，一定有 roleId。
        // 可以考慮防呆
        false,
    )
    .map((m: Member) => ({
      id: m.uuid,
      name: m.fullName,
    }));

  return candidates;
});
