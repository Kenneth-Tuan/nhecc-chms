/**
 * Mock Zone Data
 * 5 pastoral zones with leaders
 */
import type { Zone } from '~/types/organization';

export const mockZones: Zone[] = [
  {
    id: 'zone-youth',
    name: '社青牧區',
    leaders: [{ id: 'member-zhang-zone', name: '張恩典' }],
    status: 'Active',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'zone-family',
    name: '家庭牧區',
    leaders: [{ id: 'member-lin-zone', name: '林信望' }],
    status: 'Active',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'zone-student',
    name: '學生牧區',
    leaders: [{ id: 'member-chen-zone', name: '陳恩惠' }],
    status: 'Active',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'zone-senior',
    name: '長青牧區',
    leaders: [{ id: 'member-wang-zone', name: '王平安' }],
    status: 'Active',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'zone-new',
    name: '新人牧區',
    leaders: [{ id: 'member-liu-zone', name: '劉喜樂' }],
    status: 'Active',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
  },
];
