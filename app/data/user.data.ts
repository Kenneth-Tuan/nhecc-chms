/**
 * 測試環境使用的虛擬用戶資料
 * 用於前端登入測試與 UI 展示
 */
export const DUMMY_USERS = [
  {
    id: "user-001",
    email: "admin@nhecc.org.tw",
    password: "Password123!",
    name: "系統管理員",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  },
  {
    id: "user-002",
    email: "teacher@nhecc.org.tw",
    password: "Password123!",
    name: "林老師",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher",
  },
  {
    id: "user-003",
    email: "student@nhecc.org.tw",
    password: "Password123!",
    name: "陳同學",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
  },
  {
    id: "user-004",
    email: "tester@nhecc.org.tw",
    password: "Password123!",
    name: "測試帳號",
    role: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
  },
];

/**
 * 方便登入頁面快速使用的憑證列表
 */
export const LOGIN_CREDENTIALS = DUMMY_USERS.map((user) => ({
  email: user.email,
  password: user.password,
  role: user.role,
}));
