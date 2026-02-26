/**
 * 角色服務 (Role Service)
 * 處理角色相關操作的業務邏輯。
 */
import type { Role, CreateRolePayload, UpdateRolePayload } from "~/types/role";
import type { PaginatedResponse } from "~/types/api";
import { RoleRepository } from "../repositories/role.repository";
import { MemberRepository } from "../repositories/member.repository";
import { paginateArray } from "../utils/helpers";
import { createError } from "h3";

const roleRepo = new RoleRepository();
const memberRepo = new MemberRepository();

export class RoleService {
  /**
   * 獲取分頁的角色清單。
   */
  async list(
    search?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<Role>> {
    const roles = await roleRepo.findAll(search);
    return paginateArray(roles, page, pageSize);
  }

  /**
   * 獲取單一角色詳情。
   */
  async getById(id: string): Promise<Role> {
    const role = await roleRepo.findById(id);
    if (!role) {
      throw createError({ statusCode: 404, message: "找不到該角色" });
    }
    return role;
  }

  /**
   * 建立新角色。
   */
  async create(payload: CreateRolePayload): Promise<Role> {
    return roleRepo.create(payload);
  }

  /**
   * 更新現有角色。
   */
  async update(id: string, payload: UpdateRolePayload): Promise<Role> {
    const existing = await roleRepo.findById(id);
    if (!existing) {
      throw createError({ statusCode: 404, message: "找不到該角色" });
    }

    if (existing.isSystem && existing.id === "super_admin") {
      // 超級管理員不可變更權限或是資料範圍
      if (payload.permissions || payload.scope || payload.revealAuthority) {
        throw createError({
          statusCode: 403,
          message: "超級管理員角色的權限不可修改",
        });
      }
    }

    const updated = await roleRepo.update(id, payload);
    if (!updated) {
      throw createError({ statusCode: 500, message: "更新失敗" });
    }
    return updated;
  }

  /**
   * 刪除角色。
   */
  async delete(id: string): Promise<void> {
    const existing = await roleRepo.findById(id);
    if (!existing) {
      throw createError({ statusCode: 404, message: "找不到該角色" });
    }

    if (existing.isSystem) {
      throw createError({
        statusCode: 403,
        message: "系統角色不可刪除",
      });
    }

    // 檢查是否有成員正在使用此角色
    const memberCount = await memberRepo.countByRoleId(id);
    if (memberCount > 0) {
      throw createError({
        statusCode: 409,
        message: `有 ${memberCount} 位會友正在使用此角色，無法刪除`,
      });
    }

    const success = await roleRepo.delete(id);
    if (!success) {
      throw createError({ statusCode: 500, message: "刪除失敗" });
    }
  }
}
