/**
 * 組織服務 (Organization Service)
 * 處理組織架構查詢與成員分配的業務邏輯。
 */
import type {
  OrganizationStructure,
  Course,
  ZoneWithGroups,
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
