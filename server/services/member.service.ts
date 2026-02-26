/**
 * Member Service
 * Business logic for member operations.
 */
import type { UserContext } from "~/types/auth";
import type {
  Member,
  MemberListItem,
  MemberDetail,
  MemberFilters,
  MemberCourseRecord,
  CreateMemberPayload,
  UpdateMemberPayload,
} from "~/types/member";
import type { PaginatedResponse } from "~/types/api";
import type { SensitiveField } from "~/types/role";
import type { AppAbility } from "~/utils/casl/ability";
import { MemberRepository } from "../repositories/member.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { RoleRepository } from "../repositories/role.repository";
import { getMaskFunction } from "../utils/rbac/masking";
import { calculateAge, paginateArray } from "../utils/helpers";
import { createError } from "h3";
import { getAdminAuth } from "../utils/firebase-admin";

const memberRepo = new MemberRepository();
const orgRepo = new OrganizationRepository();
const roleRepo = new RoleRepository();

export class MemberService {
  /**
   * Get paginated member list with scope filtering and data masking.
   */
  async list(
    userContext: UserContext,
    ability: AppAbility,
    filters: MemberFilters,
    page: number,
    pageSize: number,
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Promise<PaginatedResponse<MemberListItem>> {
    // 1. Apply scope filter
    const scopedFilters = this.applyScopeFilter(userContext, filters);

    // 2. Fetch data
    let members = await memberRepo.findAll(scopedFilters);

    // 3. Sort
    members = this.sortMembers(members, sortBy, sortOrder);

    // 4. Transform to list items with masking
    const zones = await orgRepo.findAllZones();
    const groups = await orgRepo.findAllGroups();
    const roles = await roleRepo.findAll();

    const listItems: MemberListItem[] = members.map((m) => {
      const zone = zones.find((z) => z.id === m.zoneId);
      const group = groups.find((g) => g.id === m.groupId);
      const memberRoles = roles.filter((r) => m.roleIds.includes(r.id));

      return {
        uuid: m.uuid,
        fullName: m.fullName,
        gender: m.gender,
        dob: m.dob,
        age: calculateAge(m.dob),
        mobile: getMaskFunction("mobile")(m.mobile),
        mobileMeta: { canReveal: ability.can("reveal", "Member", "mobile") },
        email: getMaskFunction("email")(m.email),
        emailMeta: { canReveal: ability.can("reveal", "Member", "email") },
        roleIds: m.roleIds,
        roleNames: memberRoles.map((r) => r.name),
        zoneId: m.zoneId,
        zoneName: zone?.name,
        groupId: m.groupId,
        groupName: group?.name,
        status: m.status,
        avatar: m.avatar,
        baptismStatus: m.baptismStatus,
      };
    });

    // 5. Paginate
    return paginateArray(listItems, page, pageSize);
  }

  /**
   * Get a single member detail with masking.
   */
  async getDetail(
    userContext: UserContext,
    ability: AppAbility,
    uuid: string,
  ): Promise<MemberDetail> {
    const member = await memberRepo.findById(uuid);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }

    // Check scope access
    this.checkScopeAccess(userContext, member);

    const zones = await orgRepo.findAllZones();
    const groups = await orgRepo.findAllGroups();
    const roles = await roleRepo.findAll();
    const courses = await orgRepo.findAllCourses();

    const zone = zones.find((z) => z.id === member.zoneId);
    const group = groups.find((g) => g.id === member.groupId);
    const memberRoles = roles.filter((r) => member.roleIds.includes(r.id));

    // Build course records
    const courseRecords: MemberCourseRecord[] = member.pastCourses.map(
      (courseId) => {
        const course = courses.find((c) => c.id === courseId);
        return {
          courseId,
          courseName: course?.name || courseId,
          completionDate: "2024-06-01",
          status: "Completed" as const,
        };
      },
    );

    // Apply masking
    const sensitiveFields: SensitiveField[] = [
      "mobile",
      "email",
      "lineId",
      "address",
      "emergencyContactPhone",
    ];

    const maskedMember = { ...member };
    for (const field of sensitiveFields) {
      const maskFn = getMaskFunction(field);
      if (field === "mobile") {
        maskedMember.mobile = maskFn(member.mobile);
      } else if (field === "email") {
        maskedMember.email = maskFn(member.email);
      } else if (field === "lineId" && member.lineId) {
        maskedMember.lineId = maskFn(member.lineId);
      } else if (field === "address" && member.address) {
        maskedMember.address = maskFn(member.address);
      } else if (field === "emergencyContactPhone") {
        maskedMember.emergencyContactPhone = maskFn(
          member.emergencyContactPhone,
        );
      }
    }

    return {
      ...maskedMember,
      age: calculateAge(member.dob),
      zoneName: zone?.name,
      groupName: group?.name,
      roleNames: memberRoles.map((r) => r.name),
      courseRecords,
      mobileMeta: { canReveal: ability.can("reveal", "Member", "mobile") },
      emailMeta: { canReveal: ability.can("reveal", "Member", "email") },
      lineIdMeta: { canReveal: ability.can("reveal", "Member", "lineId") },
      addressMeta: { canReveal: ability.can("reveal", "Member", "address") },
      emergencyContactPhoneMeta: {
        canReveal: ability.can("reveal", "Member", "emergencyContactPhone"),
      },
    };
  }

  /**
   * Reveal sensitive fields for a member.
   */
  async revealFields(
    userContext: UserContext,
    ability: AppAbility,
    uuid: string,
    fields: string[],
  ): Promise<Record<string, string>> {
    const member = await memberRepo.findById(uuid);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }

    this.checkScopeAccess(userContext, member);

    const result: Record<string, string> = {};

    for (const field of fields) {
      if (!ability.can("reveal", "Member", field)) {
        throw createError({
          statusCode: 403,
          message: `無權解鎖欄位: ${field}`,
        });
      }

      // Return plain value
      switch (field) {
        case "mobile":
          result[field] = member.mobile;
          break;
        case "email":
          result[field] = member.email;
          break;
        case "lineId":
          result[field] = member.lineId || "";
          break;
        case "address":
          result[field] = member.address || "";
          break;
        case "emergencyContactPhone":
          result[field] = member.emergencyContactPhone;
          break;
      }
    }

    // TODO: Log audit trail for reveal action

    return result;
  }

  /**
   * Create a new member.
   */
  async create(payload: CreateMemberPayload): Promise<Member> {
    // Check mobile uniqueness
    const mobileExists = await memberRepo.isMobileExists(payload.mobile);
    if (mobileExists) {
      throw createError({
        statusCode: 409,
        message: "此手機號碼已被使用",
      });
    }

    // Validate zone-group relationship
    if (payload.groupId) {
      await this.validateZoneGroupRelationship(payload.zoneId, payload.groupId);
    }

    return memberRepo.create(payload);
  }

  /**
   * Update an existing member.
   */
  async update(uuid: string, payload: UpdateMemberPayload): Promise<Member> {
    const existing = await memberRepo.findById(uuid);
    if (!existing) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }

    // Check for immutable fields based on social login provider
    const auth = getAdminAuth();
    try {
      const fbUser = await auth.getUser(uuid);
      const isGoogleUser = fbUser.providerData.some(
        (p: any) => p.providerId === "google.com",
      );
      const isLineUser = uuid.startsWith("line_");

      if (isGoogleUser && payload.email && payload.email !== existing.email) {
        throw createError({
          statusCode: 400,
          message: "Google 用戶不允許變更電子信箱",
        });
      }

      if (isLineUser && payload.lineId && payload.lineId !== existing.lineId) {
        throw createError({
          statusCode: 400,
          message: "LINE 用戶不允許變更 LINE ID",
        });
      }
    } catch {
      // If Firebase user not found or other auth error, continue with standard logic
    }

    // Check mobile uniqueness if changed
    if (payload.mobile && payload.mobile !== existing.mobile) {
      const mobileExists = await memberRepo.isMobileExists(
        payload.mobile,
        uuid,
      );
      if (mobileExists) {
        throw createError({
          statusCode: 409,
          message: "此手機號碼已被使用",
        });
      }
    }

    // Validate zone-group relationship if changed
    const newZoneId =
      payload.zoneId !== undefined ? payload.zoneId : existing.zoneId;
    const newGroupId =
      payload.groupId !== undefined ? payload.groupId : existing.groupId;

    if (newGroupId) {
      if (!newZoneId) {
        throw createError({
          statusCode: 400,
          message: "選擇小組時必須先選擇牧區",
        });
      }
      await this.validateZoneGroupRelationship(newZoneId, newGroupId);
    }

    const updated = await memberRepo.update(uuid, payload);
    if (!updated) {
      throw createError({ statusCode: 500, message: "更新失敗" });
    }

    return updated;
  }

  /**
   * Soft delete a member with deletion reason.
   */
  async softDelete(
    uuid: string,
    deletion?: { reason: string; notes?: string },
  ): Promise<void> {
    const member = await memberRepo.findById(uuid);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到該會友" });
    }

    const success = await memberRepo.softDelete(uuid, deletion);
    if (!success) {
      throw createError({ statusCode: 500, message: "刪除失敗" });
    }
  }

  // ===== Private helpers =====

  /**
   * Apply RBAC scope filtering to member query filters.
   */
  private applyScopeFilter(
    ctx: UserContext,
    filters: MemberFilters,
  ): MemberFilters {
    const scopedFilters = { ...filters };

    switch (ctx.scope) {
      case "Global":
        // No additional filtering
        break;
      case "Zone":
        if (ctx.zoneId) {
          scopedFilters.zoneId = ctx.zoneId;
        }
        break;
      case "Group":
        // For group scope, we need to handle differently
        // This will be handled at the query level
        if (ctx.managedGroupIds.length > 0) {
          scopedFilters.groupId = ctx.managedGroupIds[0];
        }
        break;
      case "Self":
        // Will be handled specially - return only the user's own data
        break;
    }

    return scopedFilters;
  }

  /**
   * Check if user has scope access to a member.
   */
  private checkScopeAccess(ctx: UserContext, member: Member): void {
    switch (ctx.scope) {
      case "Global":
        return;
      case "Zone":
        if (member.zoneId !== ctx.zoneId) {
          throw createError({
            statusCode: 403,
            message: "無權存取此會友資料",
          });
        }
        return;
      case "Group":
        if (!member.groupId || !ctx.managedGroupIds.includes(member.groupId)) {
          // Also check functional groups
          const memberInFunctionalGroup = member.functionalGroupIds?.some(
            (fgId) => ctx.managedGroupIds.includes(fgId),
          );
          if (!memberInFunctionalGroup) {
            throw createError({
              statusCode: 403,
              message: "無權存取此會友資料",
            });
          }
        }
        return;
      case "Self":
        if (member.uuid !== ctx.userId) {
          throw createError({
            statusCode: 403,
            message: "無權存取此會友資料",
          });
        }
        return;
    }
  }

  /**
   * Validate that a group belongs to the specified zone.
   */
  private async validateZoneGroupRelationship(
    zoneId: string | undefined | null,
    groupId: string | undefined | null,
  ): Promise<void> {
    if (!groupId) return;
    if (!zoneId) {
      throw createError({
        statusCode: 400,
        message: "選擇小組時必須先選擇牧區",
      });
    }

    const group = await orgRepo.findGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 400,
        message: "找不到指定的小組",
      });
    }

    // Functional groups don't need zone validation
    if (group.type === "Functional") return;

    if (group.zoneId !== zoneId) {
      throw createError({
        statusCode: 400,
        message: "所選小組不屬於所選牧區",
      });
    }
  }

  /**
   * Sort members array.
   */
  private sortMembers(
    members: Member[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Member[] {
    const multiplier = sortOrder === "asc" ? 1 : -1;

    return [...members].sort((a, b) => {
      switch (sortBy) {
        case "dob":
          return (
            multiplier * (new Date(a.dob).getTime() - new Date(b.dob).getTime())
          );
        case "fullName":
          return multiplier * a.fullName.localeCompare(b.fullName, "zh-TW");
        case "createdAt":
        default:
          return (
            multiplier *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
      }
    });
  }
}
