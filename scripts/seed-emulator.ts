/**
 * Firebase Emulator Seed 腳本
 *
 * 用途：一次性初始化 Emulator 的 Auth 使用者與 Firestore 資料，
 *       對應 server/mockData/ 裡的所有測試資料。
 *
 * 用法（先確認 emulator 已啟動）：
 *   npm run seed:emulator
 *
 * 測試帳號密碼一律為：Test@12345
 */

// ⚠️ 必須在 initializeApp 之前設定，Admin SDK 才會路由到 emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";

// Mock data（相對於 scripts/，避免 IDE 未套用 tsconfig.seed 時 ~/ 解析成 app/）
import { mockMembers } from "../server/mockData/members.data";
import { mockZones } from "../server/mockData/zones.data";
import { mockGroups } from "../server/mockData/groups.data";
import { mockRoles } from "../server/mockData/roles.data";
import { mockCourses } from "../server/mockData/courses.data";
import { mockCourseCategories } from "../server/mockData/courseCategories.data";
import { mockCourseTemplates } from "../server/mockData/courseTemplates.data";

const TEST_PASSWORD = "Test@12345";
const PROJECT_ID = "nhecc-chms";

// ===== 初始化 Admin SDK =====
if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}
const auth = getAuth();
const db = getFirestore();

// ===== 工具函式 =====
async function clearCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return;
  const batchSize = 400;
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch: WriteBatch = db.batch();
    snapshot.docs
      .slice(i, i + batchSize)
      .forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`  cleared ${snapshot.size} docs from "${collectionName}"`);
}

async function writeInBatches<T>(
  collectionName: string,
  items: T[],
  getId: (item: T) => string,
  toDoc: (item: T) => Record<string, unknown>
) {
  const batchSize = 400;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch: WriteBatch = db.batch();
    items.slice(i, i + batchSize).forEach((item) => {
      const ref = db.collection(collectionName).doc(getId(item));
      batch.set(ref, toDoc(item));
    });
    await batch.commit();
  }
  console.log(`  wrote ${items.length} docs to "${collectionName}"`);
}

// ===== 刪除並重建 Auth 使用者 =====
async function seedAuthUsers() {
  console.log("\n[1/7] Seeding Auth users...");

  for (const member of mockMembers) {
    // 先嘗試刪除舊帳號（冪等）
    try {
      await auth.deleteUser(member.uuid);
    } catch {
      // 不存在就跳過
    }

    await auth.createUser({
      uid: member.uuid,
      email: member.email,
      password: TEST_PASSWORD,
      displayName: member.fullName,
      emailVerified: true,
    });
    console.log(`  ✓ ${member.fullName} (${member.email})`);
  }
}

// ===== Firestore collections =====
async function seedFirestore() {
  console.log("\n[2/7] Seeding roles...");
  await clearCollection("roles");
  await writeInBatches(
    "roles",
    mockRoles,
    (r) => r.id,
    (r) => ({
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      scope: r.scope,
      revealAuthority: r.revealAuthority,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      createdBy: r.createdBy,
    })
  );

  console.log("\n[3/7] Seeding zones...");
  await clearCollection("zones");
  await writeInBatches(
    "zones",
    mockZones,
    (z) => z.id,
    (z) => ({
      name: z.name,
      leaderId: z.leaderId ?? null,
      leaderName: z.leaderName ?? null,
      leaders: z.leaders ?? [],
      status: z.status,
      createdAt: z.createdAt,
      updatedAt: z.updatedAt,
    })
  );

  console.log("\n[4/7] Seeding groups...");
  await clearCollection("groups");
  await writeInBatches(
    "groups",
    mockGroups,
    (g) => g.id,
    (g) => ({
      name: g.name,
      // groups.data.ts 使用 `type`，但 Firestore schema 用 `groupType`——統一補正
      groupType: (g as any).type ?? (g as any).groupType ?? "Pastoral",
      zoneId: g.zoneId ?? null,
      leaderId: g.leaderId ?? null,
      leaderName: g.leaderName ?? null,
      leaders: g.leaders ?? [],
      status: g.status,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })
  );

  console.log("\n[5/7] Seeding members...");
  await clearCollection("members");
  await writeInBatches(
    "members",
    mockMembers,
    (m) => m.uuid,
    (m) => ({
      fullName: m.fullName,
      gender: m.gender,
      dob: m.dob,
      email: m.email,
      mobile: m.mobile,
      address: m.address ?? null,
      lineId: m.lineId ?? null,
      emergencyContactName: m.emergencyContactName,
      emergencyContactRelationship: m.emergencyContactRelationship,
      emergencyContactPhone: m.emergencyContactPhone,
      baptismStatus: m.baptismStatus,
      baptismDate: m.baptismDate ?? null,
      status: m.status,
      zoneId: m.zoneId ?? null,
      groupId: m.groupId ?? null,
      roleIds: m.roleIds ?? ["general"],
      functionalGroupIds: m.functionalGroupIds ?? [],
      pastCourses: m.pastCourses ?? [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      createdBy: m.createdBy,
      updatedBy: m.updatedBy,
    })
  );

  console.log("\n[6/7] Seeding course categories...");
  await clearCollection("courseTemplates");
  await clearCollection("courseCategories");
  await writeInBatches(
    "courseCategories",
    mockCourseCategories,
    (c) => c.id,
    (c) => ({
      name: c.name,
      order: c.order,
      description: c.description ?? null,
    })
  );

  console.log("\n[7/7] Seeding course templates...");
  await writeInBatches(
    "courseTemplates",
    mockCourseTemplates,
    (t) => t.id,
    (t) => ({
      name: t.name,
      code: t.code,
      categoryIds: t.categoryIds,
      format: t.format ?? null,
      prerequisites: t.prerequisites,
      estimatedDuration: t.estimatedDuration ?? null,
      frequency: t.frequency ?? null,
      attachments: t.attachments,
      syllabus: t.syllabus ?? null,
      status: t.status,
      hasAssociations: t.hasAssociations,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })
  );
}

async function seedCourses() {
  // courses 雖然在 mockData 但 Firestore 可能沒有 courses collection
  // 還是一併 seed 進去以備不時之需
  await writeInBatches(
    "courses",
    mockCourses,
    (c) => c.id,
    (c) => ({
      name: c.name,
      code: c.code,
      category: c.category,
      status: c.status,
      createdAt: c.createdAt,
    })
  );
}

// ===== 執行 =====
async function main() {
  console.log("=== Firebase Emulator Seed ===");
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Auth Emulator:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Test password:      ${TEST_PASSWORD}`);

  await seedAuthUsers();
  await seedFirestore();

  console.log("\n[bonus] Seeding courses...");
  await seedCourses();

  console.log("\n=== Done! ===");
  console.log("\nEmulator 帳號列表：");
  console.table(
    mockMembers.map((member) => ({
      姓名: member.fullName,
      Email: member.email,
      角色: member.roleIds.join(", "),
      Scope: member.zoneId
        ? `zone: ${member.zoneId}`
        : member.groupId
        ? `group: ${member.groupId}`
        : "Global",
    }))
  );
  console.log(`\n密碼：${TEST_PASSWORD}\n`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
