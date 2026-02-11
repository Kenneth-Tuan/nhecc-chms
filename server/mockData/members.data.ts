/**
 * Mock Member Data
 * 60 members with diverse attributes covering all zones, groups, statuses, and roles.
 */
import type { Member } from '~/types/member';

/** Helper to generate a member */
function m(overrides: Partial<Member> & { uuid: string; fullName: string; gender: 'Male' | 'Female'; dob: string; email: string; mobile: string; emergencyContactName: string; emergencyContactRelationship: string; emergencyContactPhone: string }): Member {
  return {
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-01T08:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    baptismStatus: false,
    status: 'Active',
    pastCourses: [],
    roleIds: ['general'],
    functionalGroupIds: [],
    ...overrides,
  };
}

export const mockMembers: Member[] = [
  // ===== Special role users (test accounts) =====
  m({
    uuid: 'member-wang-admin',
    fullName: '王管理員',
    gender: 'Male',
    dob: '1975-03-15',
    email: 'admin@nhecc.org',
    mobile: '0912345678',
    address: '台北市信義區信義路五段7號',
    lineId: 'wang_admin',
    emergencyContactName: '王太太',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0923456789',
    baptismStatus: true,
    baptismDate: '2000-12-25',
    status: 'Active',
    roleIds: ['super_admin'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }),
  m({
    uuid: 'member-zhang-zone',
    fullName: '張恩典',
    gender: 'Male',
    dob: '1980-07-20',
    email: 'zhang.grace@nhecc.org',
    mobile: '0922334455',
    address: '台北市大安區復興南路一段390號',
    lineId: 'zhang_grace',
    emergencyContactName: '張媽媽',
    emergencyContactRelationship: '母親',
    emergencyContactPhone: '0933445566',
    baptismStatus: true,
    baptismDate: '2005-04-16',
    status: 'Active',
    zoneId: 'zone-youth',
    roleIds: ['zone_leader'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  }),
  m({
    uuid: 'member-li-group',
    fullName: '李喜樂',
    gender: 'Female',
    dob: '1992-11-05',
    email: 'li.joy@nhecc.org',
    mobile: '0911223344',
    address: '台北市中山區南京東路二段120號',
    lineId: 'li_joy',
    emergencyContactName: '李爸爸',
    emergencyContactRelationship: '父親',
    emergencyContactPhone: '0944556677',
    baptismStatus: true,
    baptismDate: '2015-06-21',
    status: 'Active',
    zoneId: 'zone-youth',
    groupId: 'group-joy',
    roleIds: ['group_leader'],
    pastCourses: ['course-alpha', 'course-new-life', 'course-grow'],
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-20T08:00:00Z',
  }),
  m({
    uuid: 'member-chen-teacher',
    fullName: '陳詩恩',
    gender: 'Female',
    dob: '1985-04-10',
    email: 'chen.teacher@nhecc.org',
    mobile: '0955667788',
    address: '台北市松山區八德路三段36號',
    lineId: 'chen_teacher',
    emergencyContactName: '陳先生',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0966778899',
    baptismStatus: true,
    baptismDate: '2010-12-25',
    status: 'Active',
    zoneId: 'zone-family',
    groupId: 'group-love',
    roleIds: ['teacher'],
    functionalGroupIds: ['func-choir'],
    pastCourses: ['course-alpha', 'course-encounter', 'course-worship', 'course-leadership'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  }),
  m({
    uuid: 'member-lin-general',
    fullName: '林會友',
    gender: 'Male',
    dob: '1998-09-28',
    email: 'lin.member@nhecc.org',
    mobile: '0977889900',
    address: '台北市內湖區瑞光路513號',
    lineId: 'lin_member',
    emergencyContactName: '林媽媽',
    emergencyContactRelationship: '母親',
    emergencyContactPhone: '0988990011',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone-youth',
    groupId: 'group-joy',
    roleIds: ['general'],
    pastCourses: ['course-alpha'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  }),

  // ===== Zone Leaders (other zones) =====
  m({
    uuid: 'member-lin-zone',
    fullName: '林信望',
    gender: 'Male',
    dob: '1978-02-14',
    email: 'lin.faith@nhecc.org',
    mobile: '0912111213',
    emergencyContactName: '林太太',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0923222324',
    baptismStatus: true,
    baptismDate: '2003-04-20',
    zoneId: 'zone-family',
    roleIds: ['zone_leader'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  }),
  m({
    uuid: 'member-chen-zone',
    fullName: '陳恩惠',
    gender: 'Female',
    dob: '1982-08-30',
    email: 'chen.grace@nhecc.org',
    mobile: '0912141516',
    emergencyContactName: '陳爸爸',
    emergencyContactRelationship: '父親',
    emergencyContactPhone: '0923252627',
    baptismStatus: true,
    baptismDate: '2006-12-25',
    zoneId: 'zone-student',
    roleIds: ['zone_leader'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  }),
  m({
    uuid: 'member-wang-zone',
    fullName: '王平安',
    gender: 'Male',
    dob: '1965-05-18',
    email: 'wang.peace@nhecc.org',
    mobile: '0912171819',
    emergencyContactName: '王太太',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0923282930',
    baptismStatus: true,
    baptismDate: '1995-06-18',
    zoneId: 'zone-senior',
    roleIds: ['zone_leader'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  }),
  m({
    uuid: 'member-liu-zone',
    fullName: '劉喜樂',
    gender: 'Female',
    dob: '1988-12-01',
    email: 'liu.joy@nhecc.org',
    mobile: '0912202122',
    emergencyContactName: '劉先生',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0923313233',
    baptismStatus: true,
    baptismDate: '2012-04-08',
    zoneId: 'zone-new',
    roleIds: ['zone_leader'],
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
  }),

  // ===== 社青牧區 members =====
  ...generateZoneMembers('zone-youth', [
    { group: 'group-joy', members: [
      { uuid: 'member-001', fullName: '趙恩慈', gender: 'Female' as const, dob: '1995-01-12', mobile: '0911001001', email: 'zhao.ec@example.com' },
      { uuid: 'member-002', fullName: '孫信實', gender: 'Male' as const, dob: '1993-06-22', mobile: '0911001002', email: 'sun.xs@example.com' },
      { uuid: 'member-003', fullName: '錢和平', gender: 'Male' as const, dob: '1997-03-08', mobile: '0911001003', email: 'qian.hp@example.com' },
      { uuid: 'member-004', fullName: '周愛心', gender: 'Female' as const, dob: '1996-11-30', mobile: '0911001004', email: 'zhou.ax@example.com' },
    ]},
    { group: 'group-peace', members: [
      { uuid: 'member-005', fullName: '吳忠誠', gender: 'Male' as const, dob: '1994-04-15', mobile: '0911001005', email: 'wu.zc@example.com' },
      { uuid: 'member-006', fullName: '鄭美善', gender: 'Female' as const, dob: '1998-08-25', mobile: '0911001006', email: 'zheng.ms@example.com' },
      { uuid: 'member-007', fullName: '馮溫柔', gender: 'Female' as const, dob: '1995-12-03', mobile: '0911001007', email: 'feng.wr@example.com' },
    ]},
    { group: 'group-grace', members: [
      { uuid: 'member-008', fullName: '陸節制', gender: 'Male' as const, dob: '1991-09-17', mobile: '0911001008', email: 'lu.jz@example.com' },
      { uuid: 'member-009', fullName: '何良善', gender: 'Female' as const, dob: '1999-02-28', mobile: '0911001009', email: 'he.ls@example.com' },
      { uuid: 'member-010', fullName: '施恩惠', gender: 'Female' as const, dob: '1996-07-14', mobile: '0911001010', email: 'shi.eh@example.com' },
    ]},
    { group: 'group-faith', members: [
      { uuid: 'member-011', fullName: '張堅定', gender: 'Male' as const, dob: '1993-10-05', mobile: '0911001011', email: 'zhang.jd@example.com' },
      { uuid: 'member-012', fullName: '黃盼望', gender: 'Female' as const, dob: '1997-05-20', mobile: '0911001012', email: 'huang.pw@example.com' },
    ]},
  ]),

  // ===== 家庭牧區 members =====
  ...generateZoneMembers('zone-family', [
    { group: 'group-love', members: [
      { uuid: 'member-013', fullName: '蔡仁愛', gender: 'Female' as const, dob: '1980-03-21', mobile: '0911002001', email: 'cai.ra@example.com' },
      { uuid: 'member-014', fullName: '許忍耐', gender: 'Male' as const, dob: '1978-11-15', mobile: '0911002002', email: 'xu.rn@example.com' },
      { uuid: 'member-015', fullName: '呂恩寵', gender: 'Female' as const, dob: '1982-06-08', mobile: '0911002003', email: 'lv.ec@example.com' },
    ]},
    { group: 'group-blessing', members: [
      { uuid: 'member-016', fullName: '蘇感恩', gender: 'Male' as const, dob: '1975-09-10', mobile: '0911002004', email: 'su.ge@example.com' },
      { uuid: 'member-017', fullName: '葉慈愛', gender: 'Female' as const, dob: '1983-12-25', mobile: '0911002005', email: 'ye.ca@example.com' },
      { uuid: 'member-018', fullName: '彭公義', gender: 'Male' as const, dob: '1979-01-30', mobile: '0911002006', email: 'peng.gy@example.com' },
    ]},
    { group: 'group-harvest', members: [
      { uuid: 'member-019', fullName: '段豐盛', gender: 'Male' as const, dob: '1985-07-04', mobile: '0911002007', email: 'duan.fs@example.com' },
    ]},
  ]),

  // ===== 學生牧區 members =====
  ...generateZoneMembers('zone-student', [
    { group: 'group-light', members: [
      { uuid: 'member-036', fullName: '高聰慧', gender: 'Female' as const, dob: '2002-04-12', mobile: '0911003001', email: 'gao.ch@example.com' },
      { uuid: 'member-037', fullName: '鄒勤奮', gender: 'Male' as const, dob: '2001-09-30', mobile: '0911003002', email: 'zou.qf@example.com' },
      { uuid: 'member-038', fullName: '范正直', gender: 'Male' as const, dob: '2003-01-18', mobile: '0911003003', email: 'fan.zz@example.com' },
    ]},
    { group: 'group-salt', members: [
      { uuid: 'member-039', fullName: '夏真誠', gender: 'Female' as const, dob: '2002-07-22', mobile: '0911003004', email: 'xia.zc@example.com' },
      { uuid: 'member-040', fullName: '秦謙卑', gender: 'Male' as const, dob: '2001-03-14', mobile: '0911003005', email: 'qin.qb@example.com' },
    ]},
    { group: 'group-hope', members: [
      { uuid: 'member-041', fullName: '尤信靠', gender: 'Female' as const, dob: '2003-11-28', mobile: '0911003006', email: 'you.xk@example.com' },
      { uuid: 'member-042', fullName: '江剛強', gender: 'Male' as const, dob: '2002-05-06', mobile: '0911003007', email: 'jiang.gq@example.com' },
    ]},
  ]),

  // ===== 長青牧區 members =====
  ...generateZoneMembers('zone-senior', [
    { group: 'group-wisdom', members: [
      { uuid: 'member-043', fullName: '宋安詳', gender: 'Male' as const, dob: '1955-02-20', mobile: '0911004001', email: 'song.ax@example.com' },
      { uuid: 'member-044', fullName: '郭慧靈', gender: 'Female' as const, dob: '1960-08-15', mobile: '0911004002', email: 'guo.hl@example.com' },
      { uuid: 'member-045', fullName: '田溫暖', gender: 'Female' as const, dob: '1958-04-03', mobile: '0911004003', email: 'tian.wn@example.com' },
    ]},
    { group: 'group-olive', members: [
      { uuid: 'member-046', fullName: '方堅韌', gender: 'Male' as const, dob: '1952-10-12', mobile: '0911004004', email: 'fang.jr@example.com' },
      { uuid: 'member-047', fullName: '石持守', gender: 'Female' as const, dob: '1957-06-28', mobile: '0911004005', email: 'shi.cs@example.com' },
    ]},
  ]),

  // ===== 新人牧區 members =====
  ...generateZoneMembers('zone-new', [
    { group: 'group-welcome', members: [
      { uuid: 'member-048', fullName: '白新生', gender: 'Male' as const, dob: '1995-08-18', mobile: '0911005001', email: 'bai.xs@example.com' },
      { uuid: 'member-049', fullName: '曹盼望', gender: 'Female' as const, dob: '2000-01-25', mobile: '0911005002', email: 'cao.pw@example.com' },
    ]},
    { group: 'group-seedling', members: [
      { uuid: 'member-050', fullName: '魏渴慕', gender: 'Male' as const, dob: '1998-11-10', mobile: '0911005003', email: 'wei.km@example.com' },
      { uuid: 'member-051', fullName: '姜追求', gender: 'Female' as const, dob: '1999-05-15', mobile: '0911005004', email: 'jiang.zq@example.com' },
    ]},
    { group: 'group-root', members: [
      { uuid: 'member-052', fullName: '傅扎根', gender: 'Male' as const, dob: '1997-03-22', mobile: '0911005005', email: 'fu.zg@example.com' },
    ]},
  ]),

  // ===== Unassigned members (待分發) =====
  m({
    uuid: 'member-053',
    fullName: '胡等待',
    gender: 'Male',
    dob: '1990-04-10',
    email: 'hu.dd@example.com',
    mobile: '0911006001',
    emergencyContactName: '胡媽媽',
    emergencyContactRelationship: '母親',
    emergencyContactPhone: '0922006001',
    status: 'Active',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  }),
  m({
    uuid: 'member-054',
    fullName: '龍新來',
    gender: 'Female',
    dob: '2001-07-18',
    email: 'long.xl@example.com',
    mobile: '0911006002',
    emergencyContactName: '龍爸爸',
    emergencyContactRelationship: '父親',
    emergencyContactPhone: '0922006002',
    status: 'Active',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
  }),
  m({
    uuid: 'member-055',
    fullName: '萬初信',
    gender: 'Male',
    dob: '1988-10-05',
    email: 'wan.cx@example.com',
    mobile: '0911006003',
    emergencyContactName: '萬太太',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0922006003',
    status: 'Active',
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-01T08:00:00Z',
  }),

  // ===== Inactive/Suspended members =====
  m({
    uuid: 'member-056',
    fullName: '古停權',
    gender: 'Male',
    dob: '1985-06-20',
    email: 'gu.tq@example.com',
    mobile: '0911007001',
    emergencyContactName: '古太太',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0922007001',
    status: 'Suspended',
    zoneId: 'zone-youth',
    groupId: 'group-joy',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  }),
  m({
    uuid: 'member-057',
    fullName: '甘離開',
    gender: 'Female',
    dob: '1992-09-12',
    email: 'gan.lk@example.com',
    mobile: '0911007002',
    emergencyContactName: '甘爸爸',
    emergencyContactRelationship: '父親',
    emergencyContactPhone: '0922007002',
    status: 'Inactive',
    zoneId: 'zone-family',
    groupId: 'group-blessing',
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
  }),
];

// ===== Helper to generate zone members =====
interface MemberSeed {
  uuid: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  mobile: string;
  email: string;
}

interface GroupSeed {
  group: string;
  members: MemberSeed[];
}

function generateZoneMembers(zoneId: string, groups: GroupSeed[]): Member[] {
  const relationships = ['父親', '母親', '配偶', '兄弟', '姊妹', '朋友'];
  const addresses = [
    '台北市信義區信義路五段7號',
    '台北市大安區忠孝東路四段216號',
    '台北市中山區南京東路三段168號',
    '新北市板橋區文化路一段266號',
    '新北市中和區中和路122號',
    '台北市松山區南京東路五段188號',
    '台北市內湖區成功路四段182號',
  ];
  const courseIds = ['course-alpha', 'course-happiness', 'course-encounter', 'course-doubt-to-faith', 'course-new-life', 'course-grow'];

  const result: Member[] = [];
  let idx = 0;

  for (const groupSeed of groups) {
    for (const seed of groupSeed.members) {
      const isBaptized = Math.random() > 0.4;
      const numCourses = Math.floor(Math.random() * 3);
      const selectedCourses = courseIds.slice(0, numCourses);

      result.push(m({
        uuid: seed.uuid,
        fullName: seed.fullName,
        gender: seed.gender,
        dob: seed.dob,
        email: seed.email,
        mobile: seed.mobile,
        address: addresses[idx % addresses.length],
        lineId: seed.fullName.toLowerCase().replace(/\s/g, '_'),
        emergencyContactName: `${seed.fullName.charAt(0)}家人`,
        emergencyContactRelationship: relationships[idx % relationships.length],
        emergencyContactPhone: `09${String(22000000 + idx).padStart(8, '0')}`,
        baptismStatus: isBaptized,
        baptismDate: isBaptized ? `20${10 + (idx % 15)}-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}` : undefined,
        status: 'Active',
        zoneId,
        groupId: groupSeed.group,
        pastCourses: selectedCourses,
        createdAt: `2024-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}T08:00:00Z`,
        updatedAt: `2024-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}T08:00:00Z`,
      }));
      idx++;
    }
  }

  return result;
}
