/**
 * Organization Service
 * Business logic for organization structure queries and member assignment.
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
   * Get the full organization structure (zones with groups + functional groups).
   */
  async getStructure(): Promise<OrganizationStructure> {
    return orgRepo.getStructure();
  }

  /**
   * Get zones with nested groups (ZoneWithGroups[]).
   */
  async getZonesWithGroups(): Promise<ZoneWithGroups[]> {
    const structure = await orgRepo.getStructure();
    return structure.zones;
  }

  /**
   * Get member counts per group.
   */
  async getMemberCounts(): Promise<Record<string, number>> {
    return orgRepo.getMemberCounts();
  }

  /**
   * Get unassigned (pending) members.
   */
  async getPendingMembers() {
    return orgRepo.findPendingMembers();
  }

  /**
   * Get members of a specific group.
   */
  async getGroupMembers(groupId: string) {
    if (!groupId) {
      throw createError({ statusCode: 400, message: "groupId is required" });
    }
    return orgRepo.findMembersByGroupId(groupId);
  }

  /**
   * Assign a pending member to a group.
   */
  async assignMember(
    memberId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!memberId || !groupId) {
      throw createError({
        statusCode: 400,
        message: "memberId and groupId are required",
      });
    }
    return orgRepo.assignMemberToGroup(memberId, groupId);
  }

  /**
   * Get all courses.
   */
  async getCourses(): Promise<Course[]> {
    return orgRepo.findAllCourses();
  }
}
