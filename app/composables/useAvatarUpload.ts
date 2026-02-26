/**
 * 大頭貼上傳 Composable (ST004)
 * 處理頭像選擇、預覽、上傳至 Firebase 儲存空間及移除功能。
 */

interface AvatarSelectEvent {
  files: File[];
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export function useAvatarUpload() {
  const avatarPreview = ref<string | null>(null);
  const avatarFile = ref<File | null>(null);
  const isUploading = ref(false);
  const avatarError = ref<string | null>(null);
  const shouldRemoveAvatar = ref(false);

  /** 處理來自 FileUpload 元件的檔案選擇事件 */
  function onAvatarSelect(event: AvatarSelectEvent): void {
    avatarError.value = null;
    const file = event.files[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      avatarError.value = "僅支援 JPG、PNG 格式";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      avatarError.value = "圖片大小不可超過 2MB";
      return;
    }

    avatarFile.value = file;
    shouldRemoveAvatar.value = false;

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /** 透過 API 代理將頭像上傳至伺服器（避免將 Firebase 憑證暴露於用戶端） */
  async function uploadAvatar(memberUuid: string): Promise<string | null> {
    if (!avatarFile.value) return null;

    isUploading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", avatarFile.value);
      formData.append("memberUuid", memberUuid);

      const response = await $fetch<{ url: string }>("/api/members/avatar", {
        method: "POST",
        body: formData,
      });

      return response.url;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      throw new Error("頭像上傳失敗，請稍後再試");
    } finally {
      isUploading.value = false;
    }
  }

  /** 移除當前頭像（在提交時標記為刪除） */
  function removeAvatar(): void {
    avatarPreview.value = null;
    avatarFile.value = null;
    shouldRemoveAvatar.value = true;
    avatarError.value = null;
  }

  /** 從現有的頭像 URL 初始化預覽（編輯模式） */
  function initFromExisting(avatarUrl: string | undefined): void {
    if (avatarUrl) {
      avatarPreview.value = avatarUrl;
    }
  }

  /** 重置所有狀態 */
  function reset(): void {
    avatarPreview.value = null;
    avatarFile.value = null;
    isUploading.value = false;
    avatarError.value = null;
    shouldRemoveAvatar.value = false;
  }

  return {
    avatarPreview,
    avatarFile,
    isUploading,
    avatarError,
    shouldRemoveAvatar,
    onAvatarSelect,
    uploadAvatar,
    removeAvatar,
    initFromExisting,
    reset,
  };
}
