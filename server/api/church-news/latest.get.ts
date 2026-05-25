export default defineEventHandler(async (event) => {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("church_news")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const latestDoc = snapshot.docs[0].data();
    return latestDoc.events || [];
  } catch (error: any) {
    console.error("[Latest News API] Failed to fetch latest news:", error);
    // 回傳空陣列以避免前端渲染錯誤
    return [];
  }
});
