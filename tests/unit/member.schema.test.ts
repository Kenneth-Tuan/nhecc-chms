/**
 * Member Schema Tests (ST004)
 * Tests Zod validation schemas for member CRUD operations.
 */
import { describe, it, expect } from 'vitest';
import {
  createMemberSchema,
  updateMemberSchema,
  softDeleteSchema,
} from '~/schemas/member.schema';

describe('createMemberSchema', () => {
  const validPayload = {
    fullName: '王大明',
    gender: 'Male' as const,
    dob: '1990-01-15',
    email: 'test@example.com',
    mobile: '0912345678',
    emergencyContactName: '王小明',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0987654321',
    baptismStatus: false,
    status: 'Active' as const,
  };

  it('should validate a valid create payload', () => {
    const result = createMemberSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should require fullName', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      fullName: '',
    });
    expect(result.success).toBe(false);
  });

  it('should require valid gender', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      gender: 'Other',
    });
    expect(result.success).toBe(false);
  });

  it('should reject future dob', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      dob: '2099-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('should validate Taiwan mobile format', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      mobile: '1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid 09 mobile format', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      mobile: '0912345678',
    });
    expect(result.success).toBe(true);
  });

  it('should require email', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject groupId without zoneId (refinement)', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      groupId: 'group-1',
    });
    expect(result.success).toBe(false);
  });

  it('should allow groupId with zoneId', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      zoneId: 'zone-1',
      groupId: 'group-1',
    });
    expect(result.success).toBe(true);
  });

  it('should allow zoneId without groupId', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      zoneId: 'zone-1',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional address within limit', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      address: '台北市信義區',
    });
    expect(result.success).toBe(true);
  });

  it('should reject address exceeding 200 chars', () => {
    const result = createMemberSchema.safeParse({
      ...validPayload,
      address: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('should default pastCourses to empty array', () => {
    const result = createMemberSchema.safeParse(validPayload);
    if (result.success) {
      expect(result.data.pastCourses).toEqual([]);
    }
  });

  it('should default status to Active', () => {
    const { status, ...withoutStatus } = validPayload;
    const result = createMemberSchema.safeParse(withoutStatus);
    if (result.success) {
      expect(result.data.status).toBe('Active');
    }
  });
});

describe('updateMemberSchema', () => {
  it('should allow partial updates', () => {
    const result = updateMemberSchema.safeParse({
      fullName: '新名字',
    });
    expect(result.success).toBe(true);
  });

  it('should allow empty object', () => {
    const result = updateMemberSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate fields when present', () => {
    const result = updateMemberSchema.safeParse({
      email: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('softDeleteSchema', () => {
  it('should validate a valid deletion reason', () => {
    const result = softDeleteSchema.safeParse({
      reason: 'left_church',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid reason with notes', () => {
    const result = softDeleteSchema.safeParse({
      reason: 'other',
      notes: '特殊原因說明',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid reason', () => {
    const result = softDeleteSchema.safeParse({
      reason: 'invalid_reason',
    });
    expect(result.success).toBe(false);
  });

  it('should require reason', () => {
    const result = softDeleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject notes exceeding 500 chars', () => {
    const result = softDeleteSchema.safeParse({
      reason: 'other',
      notes: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid reason codes', () => {
    const reasons = ['left_church', 'transferred', 'duplicate', 'data_error', 'other'];
    for (const reason of reasons) {
      const result = softDeleteSchema.safeParse({ reason });
      expect(result.success).toBe(true);
    }
  });
});
