/**
 * GET /api/courses/classes/teachers
 * 獲取所有具備課程管理/授課權限的教職員清單 (ST015)
 */
import { MemberService } from "../../../services/member.service";
import { requireAbility } from "../../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  // 檢查是否有權限管理課程
  requireAbility(event, "manage", "Course");

  const teachers = await memberService.listTeachers();
  
  return {
    data: teachers
  };
});
