import { beforeEach, describe, expect, it, vi } from "vitest";

// 用 hoisted mocks 避免 vi.mock 提升（hoist）後拿不到變數的初始化值。
const {
  orgRepoMocks,
  roleRepoMocks,
  memberRepoMocks,
} = vi.hoisted(() => ({
  orgRepoMocks: {
    findAllZones: vi.fn(),
    findAllGroups: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
  roleRepoMocks: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  memberRepoMocks: {
    countByRoleId: vi.fn(),
  },
}));

vi.mock("../../server/repositories/organization.repository", () => ({
  OrganizationRepository: class {
    findAllZones = orgRepoMocks.findAllZones;
    findAllGroups = orgRepoMocks.findAllGroups;
    createZone = orgRepoMocks.createZone;
    updateZone = orgRepoMocks.updateZone;
    deleteZone = orgRepoMocks.deleteZone;
    createGroup = orgRepoMocks.createGroup;
    updateGroup = orgRepoMocks.updateGroup;
    deleteGroup = orgRepoMocks.deleteGroup;
  },
}));

vi.mock("../../server/repositories/role.repository", () => ({
  RoleRepository: class {
    findById = roleRepoMocks.findById;
    create = roleRepoMocks.create;
    update = roleRepoMocks.update;
    delete = roleRepoMocks.delete;
  },
}));

vi.mock("../../server/repositories/member.repository", () => ({
  MemberRepository: class {
    countByRoleId = memberRepoMocks.countByRoleId;
  },
}));

import type { UserContext } from "../../app/types/auth";
import { MemberService } from "../../server/services/member.service";
import { OrganizationService } from "../../server/services/organization.service";
import { RoleService } from "../../server/services/role.service";

const testGlobalCtx = {
  userId: "test-user",
  fullName: "Test",
  scope: "Global",
  groupIds: [],
  functionalGroupIds: [],
  managedGroupIds: [],
  permissions: {} as UserContext["permissions"],
  revealAuthority: {} as UserContext["revealAuthority"],
  linkedProviders: { google: false, line: false, email: false },
} satisfies UserContext;

describe("Reference cache invalidation", () => {
  beforeEach(() => {
    // 每個案例都從乾淨狀態開始，避免 spy/mock call 次數互相污染。
    vi.clearAllMocks();
    orgRepoMocks.findAllZones.mockResolvedValue([]);
    orgRepoMocks.findAllGroups.mockResolvedValue([]);
  });

  it("invalidates zones cache only when createZone succeeds", async () => {
    const service = new OrganizationService();
    const invalidateSpy = vi.spyOn(MemberService, "invalidateReferenceCache");

    orgRepoMocks.createZone.mockResolvedValueOnce({
      success: false,
      message: "failed",
    });
    await service.createZone({ name: "Zone A" }, testGlobalCtx);
    // CRUD 失敗不應清 cache，避免不必要 cache miss。
    expect(invalidateSpy).not.toHaveBeenCalled();

    orgRepoMocks.createZone.mockResolvedValueOnce({
      success: true,
      message: "ok",
      id: "z1",
    });
    await service.createZone({ name: "Zone B" }, testGlobalCtx);
    // CRUD 成功才清 cache，避免後續讀到舊的 zone 參照資料。
    expect(invalidateSpy).toHaveBeenCalledWith(["zones"]);
  });

  it("invalidates roles cache on successful role update", async () => {
    const service = new RoleService();
    const invalidateSpy = vi.spyOn(MemberService, "invalidateReferenceCache");

    roleRepoMocks.findById.mockResolvedValue({
      id: "role_1",
      isSystem: false,
    });
    roleRepoMocks.update.mockResolvedValue({
      id: "role_1",
      isSystem: false,
    });

    await service.update("role_1", { description: "updated" } as any);

    // Role 變更成功後，會友清單中的 roleName 映射必須即時刷新。
    expect(invalidateSpy).toHaveBeenCalledWith(["roles"]);
  });
});
