import { describe, it, expect } from 'vitest'
import { buildAbility } from '../../app/utils/casl/ability'
import type { UserContext } from '../../app/types/auth'

describe('CASL Course ABAC Rules', () => {
  it('allows teacher to teach their own class', () => {
    const userContext: UserContext = {
      userId: 'teacher_123',
      roleId: 'role_1',
      permissions: {} as any, // No course:manage permission
      scope: 'Self',
      revealAuthority: {} as any,
      managedGroupIds: [],
      orgRoles: []
    }

    const ability = buildAbility(userContext)
    const myClass = { __type: 'CourseClass', teacherIds: ['teacher_123'] }
    const otherClass = { __type: 'CourseClass', teacherIds: ['other_teacher'] }

    expect(ability.can('teach', myClass)).toBe(true)
    expect(ability.can('teach', otherClass)).toBe(false)
  })

  it('allows admin with course:manage to teach any class', () => {
    const adminContext: UserContext = {
      userId: 'admin_1',
      roleId: 'role_admin',
      permissions: { 'course:manage': true } as any,
      scope: 'Global',
      revealAuthority: {} as any,
      managedGroupIds: [],
      orgRoles: []
    }

    const ability = buildAbility(adminContext)
    const someClass = { __type: 'CourseClass', teacherIds: ['teacher_123'] }

    expect(ability.can('teach', someClass)).toBe(true)
    expect(ability.can('manage', someClass)).toBe(true)
  })
})
