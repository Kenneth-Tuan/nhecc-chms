import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { crawlChurchNewsService } from "../../services/crawler.service";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cronSecret = config.cronSecret;

  // 1. 安全金鑰檢查
  if (cronSecret) {
    const requestKey = getHeader(event, "x-cron-key");
    if (requestKey !== cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Invalid cron key",
      });
    }
  }

  try {
    // 2. 爬取活動消息
    const events = await crawlChurchNewsService();

    if (events.length === 0) {
      console.log("[Crawl Cron] No matching events found.");
      return {
        success: true,
        message: "No events matching features were found on the website.",
        updated: false,
        count: 0,
      };
    }

    // 3. 排序活動（確保 Hash 與陣列順序無關）並計算 SHA-256 Hash
    const sortedEvents = [...events].sort((a, b) => a.title.localeCompare(b.title));
    const eventsStr = JSON.stringify(sortedEvents);
    const hash = crypto.createHash("sha256").update(eventsStr).digest("hex");

    // 4. 比對資料庫
    const db = getAdminFirestore();
    const docRef = db.collection("church_news").doc(hash);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log(`[Crawl Cron] Data with hash ${hash} already exists. No update.`);
      return {
        success: true,
        message: "Content unchanged. No database record created.",
        updated: false,
        hash,
        count: events.length,
      };
    }

    // 5. 寫入新紀錄
    console.log(`[Crawl Cron] New content detected. Saving to Firestore with hash ${hash}.`);
    const cleanEvents = JSON.parse(JSON.stringify(events));
    await docRef.set({
      hash,
      events: cleanEvents,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 6. 維持最多 21 筆紀錄
    const snapshot = await db
      .collection("church_news")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.size > 21) {
      console.log(`[Crawl Cron] Collection size ${snapshot.size} exceeds 21. Cleaning up excess records.`);
      const batch = db.batch();
      snapshot.docs.slice(21).forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("[Crawl Cron] Excess records deleted.");
    }

    return {
      success: true,
      message: "Successfully crawled and recorded new events.",
      updated: true,
      hash,
      count: events.length,
    };
  } catch (error: any) {
    console.error("[Crawl Cron] Crawler endpoint failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Internal Server Error: ${error.message}`,
    });
  }
});
