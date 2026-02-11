/**
 * Mock Auth / Test Users Data (DEV mode)
 */
import type { MockTestUser } from '~/types/auth';

export const mockTestUsers: MockTestUser[] = [
  {
    userId: 'member-wang-admin',
    fullName: '王管理員',
    roleIds: ['super_admin'],
    zoneId: undefined,
    groupId: undefined,
    functionalGroupIds: [],
  },
  {
    userId: 'member-zhang-zone',
    fullName: '張恩典（社青牧區長）',
    roleIds: ['zone_leader'],
    zoneId: 'zone-youth',
    groupId: undefined,
    functionalGroupIds: [],
  },
  {
    userId: 'member-lin-zone',
    fullName: '林信望（家庭牧區長）',
    roleIds: ['zone_leader'],
    zoneId: 'zone-family',
    groupId: undefined,
    functionalGroupIds: [],
  },
  {
    userId: 'member-li-group',
    fullName: '李喜樂（喜樂小組長）',
    roleIds: ['group_leader'],
    zoneId: 'zone-youth',
    groupId: 'group-joy',
    functionalGroupIds: [],
  },
  {
    userId: 'member-chen-teacher',
    fullName: '陳詩恩（課程老師/詩班）',
    roleIds: ['teacher'],
    zoneId: 'zone-family',
    groupId: 'group-love',
    functionalGroupIds: ['func-choir'],
  },
  {
    userId: 'member-lin-general',
    fullName: '林會友（一般會友）',
    roleIds: ['general'],
    zoneId: 'zone-youth',
    groupId: 'group-joy',
    functionalGroupIds: [],
  },
];

/** Default test user ID */
export const DEFAULT_TEST_USER_ID = 'member-wang-admin';
