# ST010 - Technical Design: 帳號安全與密碼管理

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-010
- **Priority**: Should Have
- **User Story**: As a 系統管理員, I want to 管理會友的帳號安全（重設密碼、強制登出、查看登入歷史）, So that 我能在必要時處理帳號安全問題，確保系統安全與會友帳號受保護。

### 1.2 Design Goals
1. 實作密碼重設功能（發送連結 / 手動設定）
2. 實作強制登出功能（撤銷 Token）
3. 實作登入歷史記錄與查詢
4. 實作密碼強度檢查（前後端驗證）
5. 整合 RBAC 權限控制

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK, Firebase Auth
- **Database**: Firestore
- **Email**: Firebase Extensions (Trigger Email) 或 SendGrid
- **Validation**: Zod

---

## 2. Data Models

### 2.1 Password Reset Token

```typescript
// Firestore Collection: passwordResetTokens
export interface PasswordResetToken {
  token: string;              // UUID v4
  memberId: string;           // 會友 ID
  email: string;              // 會友 Email
  expiresAt: Timestamp;       // 到期時間（1 小時後）
  used: boolean;              // 是否已使用
  createdAt: Timestamp;       // 建立時間
  usedAt?: Timestamp;         // 使用時間（選填）
}
```

### 2.2 Login Log

```typescript
// Firestore Subcollection: members/{memberId}/loginLogs
export interface LoginLog {
  timestamp: Timestamp;       // 登入時間
  ipAddress: string;          // IP 位址
  userAgent: string;          // 裝置資訊
  status: 'success' | 'failed'; // 登入狀態
  failReason?: string;        // 失敗原因（若失敗）
}
```

### 2.3 Member Account Extension

```typescript
// 擴展 Member 介面（部分欄位）
interface Member {
  // ... 其他欄位
  account?: {
    email: string;
    status: 'Active' | 'Locked';
    createdAt: Timestamp;
    lastLoginAt?: Timestamp;
    lastLoginIp?: string;
    failedLoginAttempts?: number;  // 連續失敗次數
    lockedUntil?: Timestamp;       // 鎖定至何時（選填）
    tokensRevokedAfter?: Timestamp; // Token 撤銷時間（選填）
  };
}
```

### 2.4 API Request/Response Types

```typescript
// 重設密碼請求（發送連結）
export interface SendResetPasswordLinkRequest {
  memberId: string;
}

// 重設密碼請求（手動設定）
export interface SetPasswordRequest {
  memberId: string;
  newPassword: string;
  notifyMember: boolean;      // 是否通知會友
  forceLogout: boolean;       // 是否強制登出
}

// 驗證重設密碼 Token 請求
export interface ValidateResetTokenRequest {
  token: string;
}

// 完成重設密碼請求
export interface CompleteResetPasswordRequest {
  token: string;
  newPassword: string;
}

// 強制登出請求
export interface ForceLogoutRequest {
  memberId: string;
}

// 查詢登入歷史請求
export interface GetLoginLogsRequest {
  memberId: string;
  limit?: number;            // 預設 10
  offset?: number;           // 分頁偏移
}

// 登入歷史回應
export interface GetLoginLogsResponse {
  data: LoginLog[];
  total: number;
  hasMore: boolean;
}
```

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── member/
│   │   ├── AccountSecurityPanel.vue       # 帳號安全區塊
│   │   ├── ResetPasswordDialog.vue        # 重設密碼對話框
│   │   ├── SetPasswordDialog.vue          # 手動設定密碼對話框
│   │   └── LoginHistoryDialog.vue         # 登入歷史對話框
│   └── auth/
│       └── ResetPasswordForm.vue          # 重設密碼頁面表單
├── pages/
│   ├── members/
│   │   └── [id]/
│   │       └── edit.vue                   # 會友編輯頁（整合帳號安全）
│   └── auth/
│       └── reset-password.vue             # 重設密碼頁面（會友自行重設）
├── composables/
│   ├── useAccountSecurity.ts              # 帳號安全邏輯
│   └── usePasswordValidation.ts           # 密碼驗證邏輯
└── types/
    └── account-security.ts                # 帳號安全相關型別
```

### 3.2 Type Definitions

**`app/types/account-security.ts`**

```typescript
export interface PasswordResetToken {
  token: string;
  memberId: string;
  email: string;
  expiresAt: Timestamp;
  used: boolean;
  createdAt: Timestamp;
  usedAt?: Timestamp;
}

export interface LoginLog {
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  failReason?: string;
}

export interface SendResetPasswordLinkRequest {
  memberId: string;
}

export interface SetPasswordRequest {
  memberId: string;
  newPassword: string;
  notifyMember: boolean;
  forceLogout: boolean;
}

export interface ValidateResetTokenRequest {
  token: string;
}

export interface CompleteResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ForceLogoutRequest {
  memberId: string;
}

export interface GetLoginLogsRequest {
  memberId: string;
  limit?: number;
  offset?: number;
}

export interface GetLoginLogsResponse {
  data: LoginLog[];
  total: number;
  hasMore: boolean;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';
```

### 3.3 Composables

**`app/composables/useAccountSecurity.ts`**

```typescript
import type {
  SendResetPasswordLinkRequest,
  SetPasswordRequest,
  ForceLogoutRequest,
  GetLoginLogsRequest,
  GetLoginLogsResponse,
} from '~/types/account-security';

export const useAccountSecurity = () => {
  const toast = useToast();
  const confirm = useConfirm();

  // 發送密碼重設連結
  const sendResetPasswordLink = async (memberId: string, email: string): Promise<boolean> => {
    try {
      await $fetch('/api/auth/send-reset-link', {
        method: 'POST',
        body: { memberId } as SendResetPasswordLinkRequest,
      });

      toast.add({
        severity: 'success',
        summary: '已發送密碼重設連結',
        detail: `已發送至 ${email}`,
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '發送失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  // 管理員手動設定密碼
  const setPassword = async (request: SetPasswordRequest): Promise<boolean> => {
    try {
      await $fetch('/api/auth/set-password', {
        method: 'POST',
        body: request,
      });

      toast.add({
        severity: 'success',
        summary: '密碼已設定',
        detail: request.notifyMember ? '已通知會友' : '',
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '設定失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  // 強制登出
  const forceLogout = async (memberId: string, memberName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirm.require({
        message: `確定要強制 ${memberName} 登出嗎？此操作將清除所有裝置的登入狀態。`,
        header: '確認強制登出',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '確定登出',
        rejectLabel: '取消',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            await $fetch('/api/auth/force-logout', {
              method: 'POST',
              body: { memberId } as ForceLogoutRequest,
            });

            toast.add({
              severity: 'success',
              summary: '已強制登出',
              detail: `${memberName} 已被強制登出`,
              life: 3000,
            });

            resolve(true);
          } catch (error: any) {
            toast.add({
              severity: 'error',
              summary: '登出失敗',
              detail: error?.data?.message || '請稍後再試',
              life: 5000,
            });
            resolve(false);
          }
        },
        reject: () => {
          resolve(false);
        },
      });
    });
  };

  // 查詢登入歷史
  const fetchLoginLogs = async (request: GetLoginLogsRequest): Promise<GetLoginLogsResponse | null> => {
    try {
      const response = await $fetch<GetLoginLogsResponse>('/api/auth/login-logs', {
        method: 'GET',
        params: request,
      });

      return response;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '查詢失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return null;
    }
  };

  return {
    sendResetPasswordLink,
    setPassword,
    forceLogout,
    fetchLoginLogs,
  };
};
```

**`app/composables/usePasswordValidation.ts`**

```typescript
import { z } from 'zod';
import type { PasswordStrength } from '~/types/account-security';

// 密碼驗證 Schema（與 Backend 共用）
export const passwordSchema = z.string()
  .min(8, '密碼至少需要 8 個字元')
  .regex(/[A-Za-z]/, '密碼需包含至少 1 個英文字母')
  .regex(/[0-9]/, '密碼需包含至少 1 個數字');

export const usePasswordValidation = () => {
  // 檢查密碼強度
  const checkPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 'weak';

    let score = 0;

    // 基本要求（8 碼 + 英數）
    if (password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)) {
      score = 1;
    }

    // 包含大小寫字母
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score = 2;
    }

    // 包含特殊符號
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score = 3;
    }

    if (score === 1) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  };

  // 驗證密碼
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    try {
      passwordSchema.parse(password);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => e.message),
        };
      }
      return { valid: false, errors: ['密碼格式錯誤'] };
    }
  };

  return {
    passwordSchema,
    checkPasswordStrength,
    validatePassword,
  };
};
```

### 3.4 Component Design

**`app/components/member/AccountSecurityPanel.vue`**

```vue
<script setup lang="ts">
import type { Member } from '~/types/member';
import { useAccountSecurity } from '~/composables/useAccountSecurity';

const props = defineProps<{
  member: Member;
}>();

const emit = defineEmits<{
  update: [];
}>();

const { sendResetPasswordLink, forceLogout } = useAccountSecurity();

// 顯示重設密碼對話框
const showResetPasswordDialog = ref(false);

// 顯示登入歷史對話框
const showLoginHistoryDialog = ref(false);

// 重設密碼
const onResetPassword = () => {
  showResetPasswordDialog.value = true;
};

// 強制登出
const onForceLogout = async () => {
  const success = await forceLogout(props.member.uuid, props.member.name.full);
  if (success) {
    emit('update');
  }
};

// 查看登入歷史
const onViewLoginHistory = () => {
  showLoginHistoryDialog.value = true;
};

// 格式化日期時間
const formatDateTime = (timestamp: any) => {
  // 實作日期格式化邏輯
  return new Date(timestamp?.toMillis?.() || timestamp).toLocaleString('zh-TW');
};

// 取得帳號狀態 Badge Severity
const getStatusSeverity = (status: string) => {
  return status === 'Active' ? 'success' : 'danger';
};
</script>

<template>
  <div class="account-security-panel">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">帳號安全</h3>
    </div>

    <!-- 若會友無帳號 -->
    <div v-if="!member.account" class="text-sm text-slate-500">
      此會友尚未建立帳號
    </div>

    <!-- 若會友有帳號 -->
    <div v-else>
      <!-- 帳號資訊卡片 -->
      <div class="p-4 bg-slate-50 rounded mb-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-slate-600">帳號狀態:</span>
            <Tag
              :value="member.account.status"
              :severity="getStatusSeverity(member.account.status)"
              size="small"
              class="ml-2"
            />
          </div>
          <div>
            <span class="text-slate-600">帳號建立日期:</span>
            <span class="ml-2">{{ formatDateTime(member.account.createdAt) }}</span>
          </div>
          <div>
            <span class="text-slate-600">上次登入:</span>
            <span class="ml-2">{{ member.account.lastLoginAt ? formatDateTime(member.account.lastLoginAt) : '無' }}</span>
          </div>
          <div>
            <span class="text-slate-600">上次登入 IP:</span>
            <span class="ml-2">{{ member.account.lastLoginIp || '無' }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex gap-2">
        <Button
          label="重設密碼"
          icon="pi pi-key"
          severity="warn"
          outlined
          size="small"
          @click="onResetPassword"
        />
        <Button
          label="強制登出"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          size="small"
          @click="onForceLogout"
        />
        <Button
          label="查看登入歷史"
          icon="pi pi-history"
          severity="secondary"
          outlined
          size="small"
          @click="onViewLoginHistory"
        />
      </div>
    </div>

    <!-- 重設密碼對話框 -->
    <ResetPasswordDialog
      v-model:visible="showResetPasswordDialog"
      :member="member"
      @success="emit('update')"
    />

    <!-- 登入歷史對話框 -->
    <LoginHistoryDialog
      v-model:visible="showLoginHistoryDialog"
      :member-id="member.uuid"
      :member-name="member.name.full"
    />
  </div>
</template>

<style scoped>
.account-security-panel {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
```

**`app/components/member/ResetPasswordDialog.vue`**

```vue
<script setup lang="ts">
import type { Member } from '~/types/member';

const props = defineProps<{
  visible: boolean;
  member: Member;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// 選擇重設方式
const resetMethod = ref<'email' | 'manual' | null>(null);

// 顯示手動設定密碼對話框
const showSetPasswordDialog = ref(false);

// 選擇發送 Email
const onSelectEmail = () => {
  resetMethod.value = 'email';
  // 顯示確認對話框後續實作
};

// 選擇手動設定
const onSelectManual = () => {
  resetMethod.value = 'manual';
  emit('update:visible', false);
  showSetPasswordDialog.value = true;
};

// 關閉對話框
const onClose = () => {
  emit('update:visible', false);
  resetMethod.value = null;
};
</script>

<template>
  <div>
    <!-- 選擇重設方式對話框 -->
    <Dialog
      :visible="visible"
      header="重設密碼"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
      @update:visible="onClose"
    >
      <div class="flex flex-col gap-3">
        <!-- 選項 1: 發送 Email -->
        <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="onSelectEmail">
          <template #content>
            <div class="flex items-center gap-3">
              <i class="pi pi-envelope text-2xl text-blue-500" />
              <div>
                <div class="font-semibold">發送密碼重設連結（推薦）</div>
                <div class="text-sm text-slate-600">會友將收到 Email 連結，自行設定新密碼</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- 選項 2: 手動設定 -->
        <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="onSelectManual">
          <template #content>
            <div class="flex items-center gap-3">
              <i class="pi pi-lock text-2xl text-orange-500" />
              <div>
                <div class="font-semibold">管理員手動設定密碼</div>
                <div class="text-sm text-slate-600">由管理員直接設定新密碼</div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <template #footer>
        <Button label="取消" severity="secondary" @click="onClose" />
      </template>
    </Dialog>

    <!-- 手動設定密碼對話框 -->
    <SetPasswordDialog
      v-model:visible="showSetPasswordDialog"
      :member="member"
      @success="emit('success')"
    />
  </div>
</template>
```

**`app/components/member/SetPasswordDialog.vue`**

```vue
<script setup lang="ts">
import type { Member } from '~/types/member';
import { useAccountSecurity } from '~/composables/useAccountSecurity';
import { usePasswordValidation } from '~/composables/usePasswordValidation';
import type { SetPasswordRequest } from '~/types/account-security';

const props = defineProps<{
  visible: boolean;
  member: Member;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const { setPassword } = useAccountSecurity();
const { checkPasswordStrength, validatePassword } = usePasswordValidation();

// 表單狀態
const newPassword = ref('');
const notifyMember = ref(true);
const forceLogout = ref(false);

// 密碼強度
const passwordStrength = computed(() => checkPasswordStrength(newPassword.value));

// 驗證結果
const validationResult = computed(() => validatePassword(newPassword.value));

// 送出表單
const onSubmit = async () => {
  if (!validationResult.value.valid) return;

  const request: SetPasswordRequest = {
    memberId: props.member.uuid,
    newPassword: newPassword.value,
    notifyMember: notifyMember.value,
    forceLogout: forceLogout.value,
  };

  const success = await setPassword(request);
  if (success) {
    onClose();
    emit('success');
  }
};

// 關閉對話框
const onClose = () => {
  emit('update:visible', false);
  newPassword.value = '';
  notifyMember.value = true;
  forceLogout.value = false;
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`為 ${member.name.full} 設定新密碼`"
    :modal="true"
    :closable="true"
    :style="{ width: '500px' }"
    @update:visible="onClose"
  >
    <div class="flex flex-col gap-4">
      <!-- 新密碼輸入 -->
      <div>
        <label for="newPassword" class="block text-sm font-semibold mb-2">新密碼</label>
        <Password
          id="newPassword"
          v-model="newPassword"
          placeholder="輸入新密碼"
          :feedback="true"
          toggle-mask
          class="w-full"
        />
        <div class="text-xs text-slate-600 mt-2">
          <div>• 至少 8 個字元</div>
          <div>• 至少包含 1 個英文字母</div>
          <div>• 至少包含 1 個數字</div>
        </div>
        <div v-if="!validationResult.valid && newPassword" class="text-xs text-red-500 mt-2">
          <div v-for="error in validationResult.errors" :key="error">• {{ error }}</div>
        </div>
      </div>

      <!-- 選項 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center">
          <Checkbox v-model="notifyMember" binary input-id="notifyMember" />
          <label for="notifyMember" class="ml-2 text-sm">設定後立即通知會友（發送 Email）</label>
        </div>
        <div class="flex items-center">
          <Checkbox v-model="forceLogout" binary input-id="forceLogout" />
          <label for="forceLogout" class="ml-2 text-sm">設定後強制會友重新登入</label>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" outlined @click="onClose" />
      <Button
        label="確定設定"
        severity="primary"
        :disabled="!validationResult.valid"
        @click="onSubmit"
      />
    </template>
  </Dialog>
</template>
```

**`app/components/member/LoginHistoryDialog.vue`**

```vue
<script setup lang="ts">
import { useAccountSecurity } from '~/composables/useAccountSecurity';
import type { LoginLog } from '~/types/account-security';

const props = defineProps<{
  visible: boolean;
  memberId: string;
  memberName: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { fetchLoginLogs } = useAccountSecurity();

// 登入歷史資料
const loginLogs = ref<LoginLog[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(0);
const rowsPerPage = 10;

// 載入登入歷史
const loadLoginLogs = async () => {
  loading.value = true;
  const response = await fetchLoginLogs({
    memberId: props.memberId,
    limit: rowsPerPage,
    offset: currentPage.value * rowsPerPage,
  });

  if (response) {
    loginLogs.value = response.data;
    total.value = response.total;
  }

  loading.value = false;
};

// 監聽對話框開啟
watch(() => props.visible, (visible) => {
  if (visible) {
    currentPage.value = 0;
    loadLoginLogs();
  }
});

// 分頁變更
const onPageChange = (event: any) => {
  currentPage.value = event.page;
  loadLoginLogs();
};

// 格式化日期時間
const formatDateTime = (timestamp: any) => {
  return new Date(timestamp?.toMillis?.() || timestamp).toLocaleString('zh-TW');
};

// 取得登入狀態 Severity
const getStatusSeverity = (status: string) => {
  return status === 'success' ? 'success' : 'danger';
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`${memberName} 的登入歷史`"
    :modal="true"
    :closable="true"
    :style="{ width: '800px' }"
    @update:visible="emit('update:visible', false)"
  >
    <DataTable
      :value="loginLogs"
      :loading="loading"
      :paginator="true"
      :rows="rowsPerPage"
      :total-records="total"
      :lazy="true"
      @page="onPageChange"
    >
      <Column field="timestamp" header="登入時間" style="width: 200px">
        <template #body="{ data }">
          {{ formatDateTime(data.timestamp) }}
        </template>
      </Column>
      <Column field="ipAddress" header="IP 位址" style="width: 150px" />
      <Column field="userAgent" header="裝置資訊" />
      <Column field="status" header="登入狀態" style="width: 100px">
        <template #body="{ data }">
          <Tag
            :value="data.status === 'success' ? '成功' : '失敗'"
            :severity="getStatusSeverity(data.status)"
            size="small"
          />
        </template>
      </Column>
    </DataTable>

    <template #footer>
      <Button label="關閉" severity="secondary" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
</template>
```

---

## 4. Backend Architecture

### 4.1 API Routes

#### POST /api/auth/send-reset-link

**`server/api/auth/send-reset-link.post.ts`**

```typescript
import { authService } from '~/server/services/auth.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: system:config
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const { memberId } = body;

  if (!memberId) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 ID',
    });
  }

  try {
    await authService.sendPasswordResetLink(memberId);
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '發送重設連結失敗',
    });
  }
});
```

#### POST /api/auth/set-password

**`server/api/auth/set-password.post.ts`**

```typescript
import { authService } from '~/server/services/auth.service';
import { requirePermission } from '~/server/utils/permission';
import { passwordSchema } from '~/composables/usePasswordValidation';

export default defineEventHandler(async (event) => {
  // 權限檢查: system:config
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const { memberId, newPassword, notifyMember, forceLogout } = body;

  // 驗證
  if (!memberId || !newPassword) {
    throw createError({
      statusCode: 400,
      message: '缺少必要參數',
    });
  }

  // 驗證密碼強度
  try {
    passwordSchema.parse(newPassword);
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: '密碼不符合強度要求',
    });
  }

  try {
    await authService.setPassword(memberId, newPassword, notifyMember, forceLogout);
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '設定密碼失敗',
    });
  }
});
```

#### POST /api/auth/force-logout

**`server/api/auth/force-logout.post.ts`**

```typescript
import { authService } from '~/server/services/auth.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: system:config
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const { memberId } = body;

  if (!memberId) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 ID',
    });
  }

  try {
    await authService.forceLogout(memberId);
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '強制登出失敗',
    });
  }
});
```

#### GET /api/auth/login-logs

**`server/api/auth/login-logs.get.ts`**

```typescript
import { authService } from '~/server/services/auth.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: member:view
  requirePermission(event, 'member:view');

  const query = getQuery(event);
  const { memberId, limit = 10, offset = 0 } = query;

  if (!memberId) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 ID',
    });
  }

  try {
    const response = await authService.getLoginLogs(
      memberId as string,
      Number(limit),
      Number(offset)
    );
    return response;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '查詢登入歷史失敗',
    });
  }
});
```

#### POST /api/auth/validate-reset-token

**`server/api/auth/validate-reset-token.post.ts`** (會友自行重設密碼時使用)

```typescript
import { authService } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token } = body;

  if (!token) {
    throw createError({
      statusCode: 400,
      message: '缺少 Token',
    });
  }

  try {
    const valid = await authService.validateResetToken(token);
    return { valid };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '驗證 Token 失敗',
    });
  }
});
```

#### POST /api/auth/complete-reset-password

**`server/api/auth/complete-reset-password.post.ts`** (會友自行重設密碼時使用)

```typescript
import { authService } from '~/server/services/auth.service';
import { passwordSchema } from '~/composables/usePasswordValidation';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    throw createError({
      statusCode: 400,
      message: '缺少必要參數',
    });
  }

  // 驗證密碼強度
  try {
    passwordSchema.parse(newPassword);
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: '密碼不符合強度要求',
    });
  }

  try {
    await authService.completeResetPassword(token, newPassword);
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '重設密碼失敗',
    });
  }
});
```

### 4.2 Service Layer

**`server/services/auth.service.ts` (新增方法)**

```typescript
import { getAuth } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';
import { memberRepository } from '~/server/repositories/member.repository';
import { passwordResetTokenRepository } from '~/server/repositories/password-reset-token.repository';
import { loginLogRepository } from '~/server/repositories/login-log.repository';
import { emailService } from '~/server/services/email.service';
import { clearUserContextCache } from '~/server/utils/cache';

export const authService = {
  /**
   * 發送密碼重設連結
   */
  async sendPasswordResetLink(memberId: string): Promise<void> {
    // 取得會友資訊
    const member = await memberRepository.findById(memberId);
    if (!member || !member.account) {
      throw createError({ statusCode: 404, message: '找不到該會友或會友無帳號' });
    }

    // 生成重設 Token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小時後

    // 儲存 Token
    await passwordResetTokenRepository.create({
      token,
      memberId,
      email: member.account.email,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // 發送 Email
    const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(member.account.email, member.name.full, resetLink);
  },

  /**
   * 管理員手動設定密碼
   */
  async setPassword(memberId: string, newPassword: string, notifyMember: boolean, forceLogout: boolean): Promise<void> {
    // 取得會友資訊
    const member = await memberRepository.findById(memberId);
    if (!member || !member.account) {
      throw createError({ statusCode: 404, message: '找不到該會友或會友無帳號' });
    }

    // 更新密碼（使用 Firebase Auth）
    const auth = getAuth();
    await auth.updateUser(member.uuid, {
      password: newPassword,
    });

    // 若需通知會友
    if (notifyMember) {
      await emailService.sendPasswordChangedEmail(member.account.email, member.name.full);
    }

    // 若需強制登出
    if (forceLogout) {
      await this.forceLogout(memberId);
    }
  },

  /**
   * 強制登出
   */
  async forceLogout(memberId: string): Promise<void> {
    const member = await memberRepository.findById(memberId);
    if (!member) {
      throw createError({ statusCode: 404, message: '找不到該會友' });
    }

    // 撤銷 Refresh Tokens
    const auth = getAuth();
    await auth.revokeRefreshTokens(member.uuid);

    // 清除 UserContext 快取
    await clearUserContextCache(member.uuid);
  },

  /**
   * 驗證重設密碼 Token
   */
  async validateResetToken(token: string): Promise<boolean> {
    const resetToken = await passwordResetTokenRepository.findByToken(token);
    
    if (!resetToken) return false;
    if (resetToken.used) return false;
    if (new Date() > resetToken.expiresAt) return false;

    return true;
  },

  /**
   * 完成重設密碼
   */
  async completeResetPassword(token: string, newPassword: string): Promise<void> {
    // 驗證 Token
    const resetToken = await passwordResetTokenRepository.findByToken(token);
    if (!resetToken) {
      throw createError({ statusCode: 400, message: 'Token 無效' });
    }
    if (resetToken.used) {
      throw createError({ statusCode: 400, message: 'Token 已使用' });
    }
    if (new Date() > resetToken.expiresAt) {
      throw createError({ statusCode: 400, message: 'Token 已過期' });
    }

    // 更新密碼
    const auth = getAuth();
    await auth.updateUser(resetToken.memberId, {
      password: newPassword,
    });

    // 標記 Token 為已使用
    await passwordResetTokenRepository.markAsUsed(token);

    // 清除 UserContext 快取
    await clearUserContextCache(resetToken.memberId);
  },

  /**
   * 查詢登入歷史
   */
  async getLoginLogs(memberId: string, limit: number, offset: number): Promise<GetLoginLogsResponse> {
    const logs = await loginLogRepository.findByMemberId(memberId, limit, offset);
    const total = await loginLogRepository.countByMemberId(memberId);

    return {
      data: logs,
      total,
      hasMore: offset + limit < total,
    };
  },
};
```

### 4.3 Repository Layer

**`server/repositories/password-reset-token.repository.ts` (新建)**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { PasswordResetToken } from '~/types/account-security';

export const passwordResetTokenRepository = {
  db: getFirestore(),
  collection: 'passwordResetTokens',

  async create(data: Omit<PasswordResetToken, 'id'>): Promise<void> {
    await this.db.collection(this.collection).doc(data.token).set({
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt as any),
      expiresAt: Timestamp.fromDate(data.expiresAt as any),
    });
  },

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const doc = await this.db.collection(this.collection).doc(token).get();
    if (!doc.exists) return null;
    return doc.data() as PasswordResetToken;
  },

  async markAsUsed(token: string): Promise<void> {
    await this.db.collection(this.collection).doc(token).update({
      used: true,
      usedAt: Timestamp.now(),
    });
  },
};
```

**`server/repositories/login-log.repository.ts` (新建)**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { LoginLog } from '~/types/account-security';

export const loginLogRepository = {
  db: getFirestore(),

  getCollectionPath(memberId: string) {
    return `members/${memberId}/loginLogs`;
  },

  async create(memberId: string, data: Omit<LoginLog, 'id'>): Promise<void> {
    await this.db.collection(this.getCollectionPath(memberId)).add({
      ...data,
      timestamp: Timestamp.fromDate(data.timestamp as any),
    });
  },

  async findByMemberId(memberId: string, limit: number, offset: number): Promise<LoginLog[]> {
    const snapshot = await this.db
      .collection(this.getCollectionPath(memberId))
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => doc.data() as LoginLog);
  },

  async countByMemberId(memberId: string): Promise<number> {
    const snapshot = await this.db
      .collection(this.getCollectionPath(memberId))
      .count()
      .get();

    return snapshot.data().count;
  },
};
```

### 4.4 Middleware Integration

**`server/middleware/01.auth.ts` (修改：記錄登入歷史)**

```typescript
import { loginLogRepository } from '~/server/repositories/login-log.repository';

// 在登入成功後，記錄登入歷史
const logLoginSuccess = async (userId: string, event: H3Event) => {
  const ipAddress = getRequestIP(event) || 'unknown';
  const userAgent = getHeader(event, 'user-agent') || 'unknown';

  await loginLogRepository.create(userId, {
    timestamp: new Date(),
    ipAddress,
    userAgent,
    status: 'success',
  });
};

// 在登入失敗後，記錄登入歷史
const logLoginFailure = async (userId: string, event: H3Event, failReason: string) => {
  const ipAddress = getRequestIP(event) || 'unknown';
  const userAgent = getHeader(event, 'user-agent') || 'unknown';

  await loginLogRepository.create(userId, {
    timestamp: new Date(),
    ipAddress,
    userAgent,
    status: 'failed',
    failReason,
  });
};
```

---

## 5. Email Service

### 5.1 Email Templates

**密碼重設 Email 模板**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>重設密碼通知</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>【新河教會】重設密碼通知</h2>
    <p>親愛的 {{memberName}}，</p>
    <p>您的帳號密碼已由管理員重設，請點擊以下連結設定新密碼：</p>
    <p>
      <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">
        重設密碼
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">此連結將在 1 小時後失效。</p>
    <p>若您沒有要求重設密碼，請忽略此郵件。</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">
      此郵件由系統自動發送，請勿直接回覆。<br>
      新河教會資訊系統
    </p>
  </div>
</body>
</html>
```

**密碼已變更 Email 模板**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>密碼已變更通知</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>【新河教會】密碼已變更通知</h2>
    <p>親愛的 {{memberName}}，</p>
    <p>您的帳號密碼已由管理員更新。</p>
    <p>若這不是您授權的操作，請立即聯絡教會辦公室。</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">
      此郵件由系統自動發送，請勿直接回覆。<br>
      新河教會資訊系統
    </p>
  </div>
</body>
</html>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Frontend:**
- `useAccountSecurity` composable: 測試所有帳號安全操作
- `usePasswordValidation` composable: 測試密碼驗證邏輯

**Backend:**
- `auth.service.ts`: 測試密碼重設、強制登出、Token 驗證
- `password-reset-token.repository.ts`: 測試 Token CRUD
- `login-log.repository.ts`: 測試登入歷史記錄

### 6.2 Integration Tests

- API Routes: 測試完整的 Request/Response 流程
- Email 發送: 測試 Email 模板與發送邏輯

### 6.3 E2E Tests

- 使用 Playwright 測試完整的密碼重設流程（發送連結 + 會友重設）
- 測試管理員手動設定密碼流程
- 測試強制登出流程

---

## 7. Security & Performance

### 7.1 Security
- **密碼 Hash**: 使用 Firebase Auth 預設的 bcrypt
- **Token 安全**: UUID v4，無法預測
- **Token 有效期**: 1 小時
- **一次性使用**: Token 使用後立即標記為已使用
- **權限檢查**: 所有 API 需檢查 `system:config` 權限

### 7.2 Performance
- **登入歷史非同步寫入**: 不阻擋登入流程
- **分頁查詢**: 登入歷史使用分頁，每頁 10 筆
- **定期清理**: 使用 Cloud Functions 定期清理過期 Token 與登入歷史

---

## 8. Questions & Clarifications

記錄於 `Questions.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
