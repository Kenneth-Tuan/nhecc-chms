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
import { OrganizationRepository } from "../repositories/organization.repository";
import { createError } from "h3";

const orgRepo = new OrganizationRepository();

export class OrganizationService {
  /**
   * 獲取完整的組織架構（包含牧區及小組 + 功能性小組）。
   */
  async getStructure(): Promise<OrganizationStructure> {
    return orgRepo.getStructure();
  }

  /**
   * 根據牧區嵌套獲取小組專屬清單 (ZoneWithGroups[])。
   */
  async getZonesWithGroups(): Promise<ZoneWithGroups[]> {
    const structure = await orgRepo.getStructure();
    return structure.zones;
  }

  // --- Zone CRUD --- //

  async createZone(
    data: Partial<Zone>,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    if (!data.name) {
      throw createError({ statusCode: 400, message: "牧區名稱為必填" });
    }
    const existingZones = await orgRepo.findAllZones();
    if (existingZones.some((z) => z.name === data.name)) {
      throw createError({ statusCode: 400, message: "該牧區名稱已存在" });
    }
    return orgRepo.createZone(data);
  }

  async updateZone(
    id: string,
    data: Partial<Zone>,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供牧區 ID" });
    }
    if (data.name) {
      const existingZones = await orgRepo.findAllZones();
      if (existingZones.some((z) => z.id !== id && z.name === data.name)) {
        throw createError({ statusCode: 400, message: "該牧區名稱已存在" });
      }
    }
    return orgRepo.updateZone(id, data);
  }

  async deleteZone(id: string): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供牧區 ID" });
    }
    return orgRepo.deleteZone(id);
  }

  // --- Group CRUD --- //

  async createGroup(
    data: Partial<Group>,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    if (!data.name || !data.zoneId) {
      throw createError({ statusCode: 400, message: "小組名稱及牧區為必填" });
    }
    const existingGroups = await orgRepo.findAllGroups();
    if (existingGroups.some((g) => g.name === data.name)) {
      throw createError({ statusCode: 400, message: "該小組名稱已存在" });
    }
    return orgRepo.createGroup(data);
  }

  async updateGroup(
    id: string,
    data: Partial<Group>,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供小組 ID" });
    }
    if (data.name) {
      const existingGroups = await orgRepo.findAllGroups();
      if (existingGroups.some((g) => g.id !== id && g.name === data.name)) {
        throw createError({ statusCode: 400, message: "該小組名稱已存在" });
      }
    }
    return orgRepo.updateGroup(id, data);
  }

  async deleteGroup(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!id) {
      throw createError({ statusCode: 400, message: "需提供小組 ID" });
    }
    return orgRepo.deleteGroup(id);
  }

  /**
   * 獲取各小組的成員人數。
   */
  async getMemberCounts(): Promise<Record<string, number>> {
    return orgRepo.getMemberCounts();
  }

  /**
   * 獲取待分配（Pending）的會友。
   */
  async getPendingMembers() {
    return orgRepo.findPendingMembers();
  }

  /**
   * 獲取特定小組的成員清單。
   */
  async getGroupMembers(groupId: string) {
    if (!groupId) {
      throw createError({ statusCode: 400, message: "需提供 groupId" });
    }
    return orgRepo.findMembersByGroupId(groupId);
  }

  /**
   * 將待分配成員分配至指定小組。
   */
  async assignMember(
    memberId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!memberId || !groupId) {
      throw createError({
        statusCode: 400,
        message: "需提供 memberId 與 groupId",
      });
    }
    return orgRepo.assignMemberToGroup(memberId, groupId);
  }

  /**
   * 獲取所有課程。
   */
  async getCourses(): Promise<Course[]> {
    return orgRepo.findAllCourses();
  }
}
