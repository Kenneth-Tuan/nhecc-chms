import { describe, it, expect } from 'vitest'
import { courseClassSchema } from '../../app/schemas/course-class.schema'

describe('Course Class Schema', () => {
  it('should validate a valid course class payload', () => {
    const validData = {
      templateId: 'temp_123',
      name: 'Test Class',
      teacherIds: ['teacher_1'],
      status: 'SETUP',
      sessions: [
        {
          sessionId: 'session_1',
          startTime: new Date('2026-03-20T10:00:00Z').toISOString(),
          endTime: new Date('2026-03-20T12:00:00Z').toISOString()
        }
      ],
      currentSessionId: null
    }

    const result = courseClassSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should fail if session end time is before start time', () => {
    const invalidData = {
      templateId: 'temp_123',
      name: 'Test Class',
      teacherIds: ['teacher_1'],
      status: 'SETUP',
      sessions: [
        {
          sessionId: 'session_1',
          startTime: new Date('2026-03-20T12:00:00Z').toISOString(),
          endTime: new Date('2026-03-20T10:00:00Z').toISOString() // Invalid end time
        }
      ],
      currentSessionId: null
    }

    const result = courseClassSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message
      expect(errorMessage).toBe('結束時間必須晚於開始時間')
    }
  })
})
