/**
 * Member Repository Tests (ST004)
 * Tests the data access layer for member CRUD operations.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MemberRepository } from '../../server/repositories/member.repository';

describe('MemberRepository', () => {
  let repo: MemberRepository;

  beforeEach(() => {
    repo = new MemberRepository();
    repo.reset();
  });

  describe('create', () => {
    it('should create a new member with required fields', async () => {
      const payload = {
        fullName: '測試會友',
        gender: 'Male' as const,
        dob: '1990-01-01',
        email: 'new@test.com',
        mobile: '0999999999',
        emergencyContactName: '緊急聯絡人',
        emergencyContactRelationship: '配偶',
        emergencyContactPhone: '0988888888',
        baptismStatus: false,
      };

      const result = await repo.create(payload);

      expect(result.uuid).toBeDefined();
      expect(result.fullName).toBe('測試會友');
      expect(result.gender).toBe('Male');
      expect(result.mobile).toBe('0999999999');
      expect(result.status).toBe('Active');
      expect(result.roleIds).toContain('general');
    });

    it('should assign default roleIds when not provided', async () => {
      const result = await repo.create({
        fullName: '測試',
        gender: 'Female' as const,
        dob: '1995-06-15',
        email: 'default@test.com',
        mobile: '0911111111',
        emergencyContactName: '聯絡人',
        emergencyContactRelationship: '朋友',
        emergencyContactPhone: '0922222222',
        baptismStatus: true,
      });

      expect(result.roleIds).toEqual(['general']);
    });

    it('should assign custom roleIds when provided', async () => {
      const result = await repo.create({
        fullName: '測試',
        gender: 'Male' as const,
        dob: '1985-03-20',
        email: 'roles@test.com',
        mobile: '0933333333',
        emergencyContactName: '聯絡人',
        emergencyContactRelationship: '父子',
        emergencyContactPhone: '0944444444',
        baptismStatus: false,
        roleIds: ['leader', 'teacher'],
      });

      expect(result.roleIds).toEqual(['leader', 'teacher']);
    });
  });

  describe('isMobileExists', () => {
    it('should return true when mobile exists', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const exists = await repo.isMobileExists(members[0].mobile);
        expect(exists).toBe(true);
      }
    });

    it('should return false for non-existent mobile', async () => {
      const exists = await repo.isMobileExists('0900000000');
      expect(exists).toBe(false);
    });

    it('should exclude specified uuid', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const member = members[0];
        const exists = await repo.isMobileExists(member.mobile, member.uuid);
        expect(exists).toBe(false);
      }
    });
  });

  describe('isEmailExists', () => {
    it('should return true when email exists', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const exists = await repo.isEmailExists(members[0].email);
        expect(exists).toBe(true);
      }
    });

    it('should return false for non-existent email', async () => {
      const exists = await repo.isEmailExists('nonexistent@test.com');
      expect(exists).toBe(false);
    });

    it('should exclude specified uuid', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const member = members[0];
        const exists = await repo.isEmailExists(member.email, member.uuid);
        expect(exists).toBe(false);
      }
    });
  });

  describe('update', () => {
    it('should update member fields', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const member = members[0];
        const updated = await repo.update(member.uuid, {
          fullName: '新名字',
        });

        expect(updated).toBeDefined();
        expect(updated?.fullName).toBe('新名字');
        expect(updated?.updatedAt).not.toBe(member.updatedAt);
      }
    });

    it('should return undefined for non-existent member', async () => {
      const result = await repo.update('non-existent', { fullName: '不存在' });
      expect(result).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should set status to Inactive', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const member = members[0];
        const success = await repo.softDelete(member.uuid);
        expect(success).toBe(true);

        const deleted = await repo.findById(member.uuid);
        expect(deleted?.status).toBe('Inactive');
      }
    });

    it('should store deletion reason', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const member = members[0];
        const success = await repo.softDelete(member.uuid, {
          reason: 'left_church',
          notes: '搬家離開',
        });
        expect(success).toBe(true);

        const deleted = await repo.findById(member.uuid);
        expect(deleted?.deletionReason).toBe('left_church');
        expect(deleted?.deletionNotes).toBe('搬家離開');
      }
    });

    it('should return false for non-existent member', async () => {
      const success = await repo.softDelete('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('findAll with filters', () => {
    it('should filter by status', async () => {
      const activeMembers = await repo.findAll({ status: 'Active' });
      expect(activeMembers.every((m) => m.status === 'Active')).toBe(true);
    });

    it('should filter by baptism status', async () => {
      const baptized = await repo.findAll({ baptismStatus: 'baptized' });
      expect(baptized.every((m) => m.baptismStatus === true)).toBe(true);
    });

    it('should filter by search term (fullName)', async () => {
      const members = await repo.findAll();
      if (members.length > 0) {
        const searchTerm = members[0].fullName.charAt(0);
        const results = await repo.findAll({ search: searchTerm, searchField: 'fullName' });
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should filter unassigned members', async () => {
      const unassigned = await repo.findAll({ unassigned: true });
      expect(unassigned.every((m) => !m.groupId)).toBe(true);
    });

    it('should return all when status is "all"', async () => {
      const all = await repo.findAll({ status: 'all' });
      const noFilter = await repo.findAll();
      expect(all.length).toBe(noFilter.length);
    });
  });
});
