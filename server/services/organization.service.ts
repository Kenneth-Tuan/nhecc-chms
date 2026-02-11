/**
 * Organization Service
 * Business logic for organization structure queries.
 */
import type { OrganizationStructure, Course } from '~/types/organization';
import { OrganizationRepository } from '../repositories/organization.repository';

const orgRepo = new OrganizationRepository();

export class OrganizationService {
  /**
   * Get the full organization structure (zones with groups + functional groups).
   */
  async getStructure(): Promise<OrganizationStructure> {
    return orgRepo.getStructure();
  }

  /**
   * Get all courses.
   */
  async getCourses(): Promise<Course[]> {
    return orgRepo.findAllCourses();
  }
}
