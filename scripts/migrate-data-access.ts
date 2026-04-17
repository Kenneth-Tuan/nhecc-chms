/**
 * Migration Script: 建立 data_access 文件 + 清理 roles
 *
 * 讀取所有 members + 對應 roles，根據原始 role.scope 建立 data_access/{userId}：
 *   - Global → admin.isGlobal = true
 *   - Zone   → admin.zone = [member.zoneId]
 *   - Group  → admin.group = [member.groupId], functions.targets.group = member.functionalGroupIds
 *   - Self   → 不建立文件
 *
 * 同時清理所有 roles 文件中的 scope 和 revealAuthority 欄位。
 *
 * 用法：npx tsx scripts/migrate-data-access.ts
 * 需要設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數。
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// --- 設定 ---
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`=== Data Access Migration ${DRY_RUN ? "(DRY RUN)" : ""} ===\n`);

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    console.error("請設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(resolve(credPath), "utf8"));
  const app = initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
  const db = getFirestore(app);

  // 1. 讀取所有 roles
  const rolesSnap = await db.collection("roles").get();
  const rolesMap = new Map<string, any>();
  for (const doc of rolesSnap.docs) {
    rolesMap.set(doc.id, { id: doc.id, ...doc.data() });
  }
  console.log(`找到 ${rolesMap.size} 個角色`);

  // 2. 讀取所有 members
  const membersSnap = await db.collection("members").get();
  console.log(`找到 ${membersSnap.size} 個會友\n`);

  let created = 0;
  let skipped = 0;

  for (const doc of membersSnap.docs) {
    const member = doc.data();
    const userId = doc.id;
    const roleIds: string[] = member.roleIds || [];

    // 找出此會友的最寬 scope
    let broadestScope = "Self";
    const hierarchy = ["Self", "Group", "Zone", "Global"];

    for (const roleId of roleIds) {
      const role = rolesMap.get(roleId);
      if (!role || !role.scope) continue;
      if (hierarchy.indexOf(role.scope) > hierarchy.indexOf(broadestScope)) {
        broadestScope = role.scope;
      }
    }

    if (broadestScope === "Self") {
      skipped++;
      continue;
    }

    const dataAccess: any = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "migration",
      admin: { isGlobal: false, zone: [], group: [] },
      functions: { isGlobal: false, targets: {} },
    };

    switch (broadestScope) {
      case "Global":
        dataAccess.admin.isGlobal = true;
        break;
      case "Zone":
        if (member.zoneId) {
          dataAccess.admin.zone = [member.zoneId];
        }
        break;
      case "Group":
        if (member.groupId) {
          dataAccess.admin.group = [member.groupId];
        }
        if (member.functionalGroupIds?.length > 0) {
          dataAccess.functions.targets.group = member.functionalGroupIds;
        }
        break;
    }

    console.log(
      `[${broadestScope}] ${userId} (${member.fullName || "?"})` +
      ` → admin.zone=${dataAccess.admin.zone.length}, admin.group=${dataAccess.admin.group.length}`,
    );

    if (!DRY_RUN) {
      await db.collection("data_access").doc(userId).set(dataAccess);
    }
    created++;
  }

  console.log(`\n--- 結果 ---`);
  console.log(`建立 data_access 文件: ${created}`);
  console.log(`跳過 (Self scope): ${skipped}`);

  // 3. 清理 roles — 移除 scope 和 revealAuthority
  console.log(`\n清理 roles 的 scope/revealAuthority 欄位...`);
  let cleaned = 0;

  for (const [roleId, role] of rolesMap) {
    if (role.scope !== undefined || role.revealAuthority !== undefined) {
      console.log(`  清理角色: ${roleId} (${role.name})`);
      if (!DRY_RUN) {
        await db.collection("roles").doc(roleId).update({
          scope: FieldValue.delete(),
          revealAuthority: FieldValue.delete(),
          updatedAt: new Date().toISOString(),
        });
      }
      cleaned++;
    }
  }

  console.log(`清理角色: ${cleaned}`);
  console.log(`\n=== Migration ${DRY_RUN ? "(DRY RUN) " : ""}完成 ===`);
}

main().catch((err) => {
  console.error("Migration 失敗:", err);
  process.exit(1);
});
