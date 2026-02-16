/**
 * POST /api/members/avatar
 * Handles avatar file upload.
 * In DEV mode: generates a mock URL.
 * In PROD mode: would upload to Firebase Storage.
 */
import { readMultipartFormData } from 'h3';
import { trackAvatarFile } from '../../utils/storage';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, message: '缺少檔案' });
  }

  const fileField = formData.find((f) => f.name === 'file');
  const memberUuidField = formData.find((f) => f.name === 'memberUuid');

  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: '缺少圖片檔案' });
  }

  const memberUuid = memberUuidField?.data.toString() || 'unknown';
  const contentType = fileField.type || '';
  const filename = fileField.filename || 'avatar';

  // Validate file type
  if (!ACCEPTED_TYPES.includes(contentType)) {
    throw createError({ statusCode: 400, message: '僅支援 JPG、PNG 格式' });
  }

  // Validate file size
  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: '圖片大小不可超過 2MB' });
  }

  // DEV mode: generate a mock URL
  // PROD mode: would upload to Firebase Storage
  const timestamp = Date.now();
  const mockUrl = `https://storage.example.com/avatars/${memberUuid}/${timestamp}_${filename}`;

  // Track the file for cleanup purposes
  trackAvatarFile(mockUrl, memberUuid);

  return {
    url: mockUrl,
  };
});
