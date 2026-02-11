/**
 * Organization Repository
 * Abstracts data source for zones, groups, and courses.
 */
import type { Zone, Group, Course, OrganizationStructure, ZoneWithGroups } from '~/types/organization';
import { mockZones, mockGroups, mockCourses } from '../mockData';

export class OrganizationRepository {
  /**
   * Find all zones.
   */
  async findAllZones(): Promise<Zone[]> {
    return [...mockZones];
  }

  /**
   * Find a zone by ID.
   */
  async findZoneById(id: string): Promise<Zone | undefined> {
    return mockZones.find((z) => z.id === id);
  }

  /**
   * Find all groups.
   */
  async findAllGroups(): Promise<Group[]> {
    return [...mockGroups];
  }

  /**
   * Find groups by zone ID.
   */
  async findGroupsByZoneId(zoneId: string): Promise<Group[]> {
    return mockGroups.filter((g) => g.zoneId === zoneId);
  }

  /**
   * Find a group by ID.
   */
  async findGroupById(id: string): Promise<Group | undefined> {
    return mockGroups.find((g) => g.id === id);
  }

  /**
   * Get the full organization structure (zones with nested groups).
   */
  async getStructure(): Promise<OrganizationStructure> {
    const zones = await this.findAllZones();
    const allGroups = await this.findAllGroups();

    const zonesWithGroups: ZoneWithGroups[] = zones.map((zone) => ({
      ...zone,
      groups: allGroups.filter(
        (g) => g.zoneId === zone.id && g.type === 'Pastoral',
      ),
    }));

    const functionalGroups = allGroups.filter(
      (g) => g.type === 'Functional',
    );

    return {
      zones: zonesWithGroups,
      functionalGroups,
    };
  }

  /**
   * Find all courses.
   */
  async findAllCourses(): Promise<Course[]> {
    return [...mockCourses];
  }

  /**
   * Find a course by ID.
   */
  async findCourseById(id: string): Promise<Course | undefined> {
    return mockCourses.find((c) => c.id === id);
  }

  /**
   * Find courses by IDs.
   */
  async findCoursesByIds(ids: string[]): Promise<Course[]> {
    return mockCourses.filter((c) => ids.includes(c.id));
  }
}
