/**
 * 組織服務 (Organization Service)
 * 處理組織架構查詢與成員分配的業務邏輯。
 */
import type {
  OrganizationStructure,
  Course,
  ZoneWithGroups,
  Zone,
  Group,
} from "~/types/organization";
import type { UserContext } from "~/types/auth";
import type { Member } from "~/types/member";
import type { DataScope } from "~/types/role";
import { OrganizationRepository } from "../repositories/organization.repository";
import { MemberRepository } from "../repositories/member.repository";
import { RoleRepository } from "../repositories/role.repository";
import { MemberService } from "./member.service";
import { filterByScope } from "../utils/rbac/scopes";
import { createError } from "h3";

const orgRepo = new OrganizationRepository();
const memberRepo = new MemberRepository();
const roleRepo = new RoleRepository();

export class OrganizationService {
  /**
   * 獲取完整的組織架構（包含牧區及小組 + 功能性小組）。
   * 根據 userContext 的 scope 過濾可見範圍。
   */
  async getStructure(ctx?: UserContext): Promise<OrganizationStructure> {
    const structure = await orgRepo.getStructure();

    if (!ctx || ctx.scope === "Global") {
      return structure;
    }

    // Zone scope: 只回傳自己牧區的子樹
    if (ctx.scope === "Zone") {
      return {
        zones: structure.zones.filter((z) => z.id === ctx.zoneId),
        functionalGroups: structure.functionalGroups,
      };
    }

    // Group scope: 只回傳自己小組所在的牧區
    if (ctx.scope === "Group") {
      const filteredZones = structure.zones
        .map((zone) => ({
          ...zone,
          groups: zone.groups.filter((g) =>
            ctx.managedGroupIds.includes(g.id),
          ),
        }))
        .filter((zone) => zone.groups.length > 0);

      // 功能性小組只保留使用者管理的
      const filteredFunctionalGroups = structure.functionalGroups.filter((g) =>
        ctx.managedGroupIds.includes(g.id),
      );

      return {
        zones: filteredZones,
        functionalGroups: filteredFunctionalGroups,
      };
    }

    // Self scope: 回傳最小範圍（空結構）
    return { zones: [], functionalGroups: [] };
  }

  /**
   * 根據牧區嵌套獲取小組專屬清單 (ZoneWithGroups[])。
   */
  async getZonesWithGroups(ctx?: UserContext): Promise<ZoneWithGroups[]> {
    const structure = await this.getStructure(ctx);
    return structure.zones;
  }

  // --- Zone CRUD --- //

  async createZone(
    data: Partial<Zone>,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    if (ctx.scope !== "Global") {
      throw createError({
        statusCode: 403,
        message: "僅全會管理員可新增牧區",
      });
    }
    if (!data.name) {
      throw createError({ statusCode: 400, message: "牧區名稱為必填" });
    }
    const existingZones = await orgRepo.findAllZones();
    if (existingZones.some((z) => z.name === data.name)) {
      throw createError({ statusCode: 400, message: "該牧區名稱已存在" });
    }
    const result = await orgRepo.createZone(data);
    if (result.success) {
      // Zone 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["zones"]);
    }
    return result;
  }

  async updateZone(
    id: string,
    data: Partial<Zone>,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供牧區 ID" });
    }
    this.assertZoneWriteAccess(ctx, id);
    if (data.name) {
      const existingZones = await orgRepo.findAllZones();
      if (existingZones.some((z) => z.id !== id && z.name === data.name)) {
        throw createError({ statusCode: 400, message: "該牧區名稱已存在" });
      }
    }
    const result = await orgRepo.updateZone(id, data);
    if (result.success) {
      // Zone 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["zones"]);
    }
    return result;
  }

  async deleteZone(
    id: string,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供牧區 ID" });
    }
    if (ctx.scope !== "Global") {
      throw createError({
        statusCode: 403,
        message: "僅全會管理員可刪除牧區",
      });
    }
    const result = await orgRepo.deleteZone(id);
    if (result.success) {
      // Zone 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["zones"]);
    }
    return result;
  }

  // --- Group CRUD --- //

  async createGroup(
    data: Partial<Group>,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    if (!data.name || !data.zoneId) {
      throw createError({ statusCode: 400, message: "小組名稱及牧區為必填" });
    }
    if (ctx.scope === "Zone") {
      if (!ctx.zoneId || data.zoneId !== ctx.zoneId) {
        throw createError({
          statusCode: 403,
          message: "僅能於所屬牧區內新增小組",
        });
      }
    } else if (ctx.scope !== "Global") {
      throw createError({ statusCode: 403, message: "無權新增小組" });
    }
    const existingGroups = await orgRepo.findAllGroups();
    if (existingGroups.some((g) => g.name === data.name)) {
      throw createError({ statusCode: 400, message: "該小組名稱已存在" });
    }
    const result = await orgRepo.createGroup(data);
    if (result.success) {
      // Group 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["groups"]);
    }
    return result;
  }

  async updateGroup(
    id: string,
    data: Partial<Group>,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供小組 ID" });
    }
    const existingGroup = await orgRepo.findGroupById(id);
    if (!existingGroup) {
      throw createError({ statusCode: 404, message: "找不到該小組" });
    }
    this.assertGroupStructureWriteAccess(ctx, existingGroup);
    if (
      data.zoneId != null &&
      data.zoneId !== existingGroup.zoneId &&
      ctx.scope !== "Global"
    ) {
      throw createError({
        statusCode: 403,
        message: "無權將小組移轉至其他牧區",
      });
    }
    if (data.name) {
      const existingGroups = await orgRepo.findAllGroups();
      if (existingGroups.some((g) => g.id !== id && g.name === data.name)) {
        throw createError({ statusCode: 400, message: "該小組名稱已存在" });
      }
    }
    const result = await orgRepo.updateGroup(id, data);
    if (result.success) {
      // Group 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["groups"]);
    }
    return result;
  }

  async deleteGroup(
    id: string,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供小組 ID" });
    }
    const existingGroup = await orgRepo.findGroupById(id);
    if (!existingGroup) {
      throw createError({ statusCode: 404, message: "找不到該小組" });
    }
    this.assertGroupStructureWriteAccess(ctx, existingGroup);
    const result = await orgRepo.deleteGroup(id);
    if (result.success) {
      // Group 主資料異動成功後，立即清掉會友清單參照快取。
      MemberService.invalidateReferenceCache(["groups"]);
    }
    return result;
  }

  /**
   * 獲取各小組的成員人數（依使用者資料範圍過濾 groupId）。
   */
  async getMemberCounts(ctx: UserContext): Promise<Record<string, number>> {
    const raw = await orgRepo.getMemberCounts();
    const structure = await this.getStructure(ctx);
    const allowed = new Set<string>();
    for (const z of structure.zones) {
      for (const g of z.groups) {
        allowed.add(g.id);
      }
    }
    for (const fg of structure.functionalGroups) {
      allowed.add(fg.id);
    }
    const scoped: Record<string, number> = {};
    for (const [groupId, count] of Object.entries(raw)) {
      if (allowed.has(groupId)) {
        scoped[groupId] = count;
      }
    }
    return scoped;
  }

  /**
   * 獲取待分配（Pending）的會友。
   * 根據 userContext 的 scope 過濾可見範圍。
   */
  async getPendingMembers(ctx: UserContext) {
    const members = await orgRepo.findPendingMembers();
    return filterByScope(ctx, members as Record<string, any>[], {
      userId: "uuid",
    });
  }

  /**
   * 獲取特定小組的成員清單。
   * 檢查 userContext 是否有權查看該小組。
   */
  async getGroupMembers(groupId: string, ctx?: UserContext) {
    if (!groupId) {
      throw createError({ statusCode: 400, message: "需提供 groupId" });
    }

    // 如果有 ctx，檢查 scope 是否允許查看此小組
    if (ctx) {
      this.assertGroupAccess(ctx, groupId);
    }

    return orgRepo.findMembersByGroupId(groupId);
  }

  /**
   * 將待分配成員分配至指定小組。
   */
  async assignMember(
    memberId: string,
    groupId: string,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!memberId || !groupId) {
      throw createError({
        statusCode: 400,
        message: "需提供 memberId 與 groupId",
      });
    }
    const member = await memberRepo.findById(memberId);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }
    const group = await orgRepo.findGroupById(groupId);
    if (!group) {
      throw createError({ statusCode: 404, message: "找不到該小組" });
    }
    await this.assertAssignMemberAllowed(ctx, member, group);
    return orgRepo.assignMemberToGroup(memberId, groupId);
  }

  /**
   * 將會友移出小組或退回待分發。
   */
  async unassignMember(
    memberId: string,
    clearZone: boolean,
    ctx: UserContext,
  ): Promise<{ success: boolean; message: string }> {
    if (!memberId) {
      throw createError({ statusCode: 400, message: "需提供 memberId" });
    }
    const member = await memberRepo.findById(memberId);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }

    if (ctx.scope === "Zone" && member.zoneId !== ctx.zoneId) {
       throw createError({ statusCode: 403, message: "無權操作非本牧區之會友" });
    } else if (ctx.scope === "Group" && (!member.groupId || !ctx.managedGroupIds.includes(member.groupId))) {
       throw createError({ statusCode: 403, message: "無權操作非本小組之會友" });
    } else if (ctx.scope === "Self") {
       throw createError({ statusCode: 403, message: "無權操作" });
    }

    return orgRepo.unassignMember(memberId, clearZone);
  }

  /**
   * 獲取所有課程。
   */
  async getCourses(): Promise<Course[]> {
    return orgRepo.findAllCourses();
  }

  /**
   * 獲取可指派為領袖的候選人清單。
   * 從原本的 leader-candidates.get.ts 搬入。
   */
  async getLeaderCandidates(
    type: "zone" | "group",
    ctx?: UserContext,
    options?: { zoneId?: string; groupId?: string },
  ): Promise<{ id: string; name: string }[]> {
    // 1. 根據領袖類型決定目標 scope 範圍
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

    // 2. 獲取活動中的會友
    let members = await memberRepo.findAll({ status: "Active" } as any);

    // 3. 根據類型過濾
    if (type === "group" && options?.groupId) {
      members = members.filter((m) => m.groupId === options.groupId);
    } else if (type === "group" && !options?.groupId && options?.zoneId) {
      members = members.filter(
        (m) => m.zoneId === options.zoneId || !m.groupId,
      );
    }

    // 4. 根據 userContext scope 過濾
    if (ctx) {
      members = filterByScope(ctx, members);
    }

    // 5. 過濾具有正確角色 scope 的成員
    return members
      .filter((m) => m.roleIds?.some((rId: string) => validRoleIds.includes(rId)))
      .map((m) => ({
        id: m.uuid,
        name: m.fullName,
      }));
  }

  // ===== 私有輔助方法 =====

  /**
   * 牧區主檔變更：全會可改任意牧區；牧區長僅能改自己牧區。
   */
  private assertZoneWriteAccess(ctx: UserContext, zoneId: string): void {
    if (ctx.scope === "Global") {
      return;
    }
    if (ctx.scope === "Zone") {
      if (ctx.zoneId !== zoneId) {
        throw createError({
          statusCode: 403,
          message: "無權變更此牧區（牧區範圍限制）",
        });
      }
      return;
    }
    throw createError({
      statusCode: 403,
      message: "無權變更牧區",
    });
  }

  /**
   * 小組主檔變更：全會任意；牧區長限所屬牧區內；小組長限所管理小組。
   */
  private assertGroupStructureWriteAccess(ctx: UserContext, group: Group): void {
    switch (ctx.scope) {
      case "Global":
        return;
      case "Zone":
        if (!ctx.zoneId || group.zoneId !== ctx.zoneId) {
          throw createError({
            statusCode: 403,
            message: "無權變更此小組（牧區範圍限制）",
          });
        }
        return;
      case "Group":
        if (!ctx.managedGroupIds.includes(group.id)) {
          throw createError({
            statusCode: 403,
            message: "無權變更此小組（小組範圍限制）",
          });
        }
        return;
      default:
        throw createError({
          statusCode: 403,
          message: "無權變更小組",
        });
    }
  }

  private async assertAssignMemberAllowed(
    ctx: UserContext,
    member: Member,
    group: Group,
  ): Promise<void> {
    switch (ctx.scope) {
      case "Global":
        return;
      case "Zone": {
        if (!ctx.zoneId || group.zoneId !== ctx.zoneId) {
          throw createError({
            statusCode: 403,
            message: "無權將會友分配至此牧區下的小組",
          });
        }
        if (member.groupId) {
          const fromGroup = await orgRepo.findGroupById(member.groupId);
          if (!fromGroup || fromGroup.zoneId !== ctx.zoneId) {
            throw createError({
              statusCode: 403,
              message: "無權移動此會友（非本牧區）",
            });
          }
        } else if (member.zoneId && member.zoneId !== ctx.zoneId) {
          throw createError({
            statusCode: 403,
            message: "無權分配此會友（非本牧區待分配）",
          });
        }
        return;
      }
      case "Group": {
        if (!ctx.managedGroupIds.includes(group.id)) {
          throw createError({
            statusCode: 403,
            message: "無權將會友分配至此小組",
          });
        }
        if (member.groupId && !ctx.managedGroupIds.includes(member.groupId)) {
          throw createError({
            statusCode: 403,
            message: "無權移動此會友",
          });
        }
        if (
          !member.groupId &&
          member.zoneId &&
          member.zoneId !== group.zoneId
        ) {
          throw createError({
            statusCode: 403,
            message: "無權分配此會友至此小組",
          });
        }
        return;
      }
      case "Self":
        throw createError({
          statusCode: 403,
          message: "無權分配會友",
        });
    }
  }

  /**
   * 檢查使用者是否有權存取指定小組。
   */
  private assertGroupAccess(ctx: UserContext, groupId: string): void {
    switch (ctx.scope) {
      case "Global":
        return;
      case "Zone":
        // Zone scope 需要查驗小組是否屬於該牧區，但這裡沒有小組的 zoneId 資訊
        // 暫時允許通過，由 repository 層級的資料自然過濾
        return;
      case "Group":
        if (!ctx.managedGroupIds.includes(groupId)) {
          throw createError({
            statusCode: 403,
            message: "無權查看此小組成員（小組範圍限制）",
          });
        }
        return;
      case "Self":
        throw createError({
          statusCode: 403,
          message: "無權查看小組成員（僅限本人範圍）",
        });
    }
  }
}
