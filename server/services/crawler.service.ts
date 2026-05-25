import * as cheerio from "cheerio";

export interface ScrapedEvent {
  title: string;
  imageUrl?: string;
  contentHtml?: string;
  signUpUrl?: string;
}

/**
 * 爬取內湖行道會官網消息
 */
export async function crawlChurchNewsService(): Promise<ScrapedEvent[]> {
  const url = "https://www.neihuecc.org/new/new-of-church";

  // 1. 抓取網頁 HTML 內容
  const html = await $fetch<string>(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  // 2. 使用 cheerio 解析 HTML
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // Elementor 的頂層區塊通常為 section.elementor-top-section
  $("section.elementor-top-section").each((_, element) => {
    const $section = $(element);

    // 尋找活動標題 (必須有標題才算是一個消息活動)
    const titleElement = $section.find(".elementor-widget-heading h4.elementor-heading-title");
    if (titleElement.length === 0) {
      return;
    }

    const title = titleElement.text().trim();
    if (!title) {
      return;
    }

    // 尋找活動內文 (必須有 text-editor 說明內文，以避免抓到選單或側邊欄等無關 section)
    const textEditor = $section.find(".elementor-widget-text-editor");
    if (textEditor.length === 0) {
      return;
    }

    // 取得圖片連結 (選填)
    const imgElement = $section.find(".elementor-widget-image img");
    let imageUrl: string | undefined = undefined;
    if (imgElement.length > 0) {
      imageUrl = imgElement.attr("src") || undefined;
      // 處理 lazy load 圖片屬性
      if (!imageUrl || imageUrl.startsWith("data:")) {
        imageUrl = imgElement.attr("data-src") || imgElement.attr("data-lazy-src") || imageUrl;
      }
    }

    // 取得內文 HTML (選填)
    const contentElement = $section.find(".elementor-widget-text-editor .elementor-widget-container");
    const contentHtml = contentElement.length > 0 ? contentElement.html()?.trim() : undefined;

    // 取得線上報名連結 (選填)
    const btnElement = $section.find(".elementor-widget-button a.elementor-button-link");
    const signUpUrl = btnElement.attr("href") || undefined;

    events.push({
      title,
      imageUrl,
      contentHtml,
      signUpUrl,
    });
  });

  // 過濾重複資料 (防止 Elementor 多載入或結構重複造成重複抓取)
  const uniqueEvents: ScrapedEvent[] = [];
  const seenTitles = new Set<string>();
  for (const event of events) {
    if (!seenTitles.has(event.title)) {
      seenTitles.add(event.title);
      uniqueEvents.push(event);
    }
  }

  return uniqueEvents;
}
