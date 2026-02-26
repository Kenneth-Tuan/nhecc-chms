/**
 * RBAC 中間件
 * 解析用戶權限並將 UserContext + CASL Ability 注入事件中。
 */
import { AuthService } from "../services/auth.service";
import { buildAbility } from "~/utils/casl/ability";

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/")) {
    return;
  }

  // 跳過身份驗證相關端點
  if (url.pathname.startsWith("/api/auth/")) {
    if (url.pathname === "/api/auth/context" && event.context.userId) {
      try {
        const context = await authService.resolveContext(event.context.userId);
        event.context.userContext = context;
        event.context.ability = buildAbility(context);
      } catch {
        // 忽略身份驗證上下文的錯誤
      }
    }
    return;
  }

  const userId = event.context.userId;
  if (!userId) {
    return;
  }

  try {
    const userContext = await authService.resolveContext(userId);
    event.context.userContext = userContext;
    event.context.ability = buildAbility(userContext);
  } catch (error) {
    console.error("RBAC resolution failed:", error);
  }
});
