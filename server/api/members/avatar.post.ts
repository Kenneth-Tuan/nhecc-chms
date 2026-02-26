/**
 * POST /api/members/avatar
 * 處理大頭貼檔案上傳。
 * 開發模式 (DEV)：產生模擬 URL。
 * 正式模式 (PROD)：應上傳至 Firebase Storage。
 */
import { readMultipartFormData } from "h3";
import { trackAvatarFile } from "../../utils/storage";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, message: "缺少檔案" });
  }

  const fileField = formData.find((f) => f.name === "file");
  const memberUuidField = formData.find((f) => f.name === "memberUuid");

  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: "缺少圖片檔案" });
  }

  const memberUuid = memberUuidField?.data.toString() || "unknown";
  const contentType = fileField.type || "";
  const filename = fileField.filename || "avatar";

  // 驗證檔案類型
  if (!ACCEPTED_TYPES.includes(contentType)) {
    throw createError({ statusCode: 400, message: "僅支援 JPG、PNG 格式" });
  }

  // 驗證檔案大小
  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: "圖片大小不可超過 2MB" });
  }

  // 開發模式 (DEV)：產生模擬 URL
  // 正式模式 (PROD)：應上傳至 Firebase Storage
  const timestamp = Date.now();
  const mockUrl = `https://storage.example.com/avatars/${memberUuid}/${timestamp}_${filename}`;

  // 追蹤檔案以便後續清理
  trackAvatarFile(mockUrl, memberUuid);

  return {
    url: mockUrl,
  };
});
