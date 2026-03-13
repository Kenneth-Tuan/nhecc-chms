import { describe, it, expect, vi } from 'vitest'
import { CourseClassService } from '../../server/services/courseClass.service'

// Mocking dependencies is a bit tricky without knowing full setup, but we can test logic by spying
vi.mock('../../server/repositories/courseClass.repository', () => {
  return {
    CourseClassRepository: class {
      findByTeacher = vi.fn().mockResolvedValue([
        {
          id: 'existing_class_1',
          name: 'Existing Class',
          status: 'IN_PROGRESS',
          sessions: [
            {
              sessionId: 's1',
              startTime: '2026-03-20T10:00:00Z',
              endTime: '2026-03-20T12:00:00Z'
            }
          ]
        }
      ])
    }
  }
})

vi.mock('../../server/repositories/courseEnrollment.repository', () => {
  return {
    CourseEnrollmentRepository: class {}
  }
})

describe('CourseClassService - Schedule Conflict Check', () => {
  it('detects time conflict', async () => {
    const service = new CourseClassService()
    
    const newSessions = [
      {
        sessionId: 'new_s1',
        startTime: '2026-03-20T11:00:00Z', // Overlaps with 10:00 - 12:00
        endTime: '2026-03-20T13:00:00Z'
      }
    ]

    const result = await service.checkTeacherScheduleConflict(['teacher_1'], newSessions)
    
    expect(result.hasConflict).toBe(true)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].classId).toBe('existing_class_1')
  })

  it('passes if no time conflict', async () => {
    const service = new CourseClassService()
    
    const newSessions = [
      {
        sessionId: 'new_s1',
        startTime: '2026-03-20T13:00:00Z', // After existing 12:00 end time
        endTime: '2026-03-20T15:00:00Z'
      }
    ]

    const result = await service.checkTeacherScheduleConflict(['teacher_1'], newSessions)
    
    expect(result.hasConflict).toBe(false)
    expect(result.conflicts).toHaveLength(0)
  })
})
