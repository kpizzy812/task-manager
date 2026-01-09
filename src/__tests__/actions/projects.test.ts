import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Mock modules before importing the actions
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    invitation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
} from "@/actions/projects";

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

// Helper to create FormData
const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

describe("Projects Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);
  });

  describe("getProjects", () => {
    it("should return empty array when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getProjects();
      expect(result).toEqual([]);
    });

    it("should return projects for authenticated user", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "Project 1",
          description: "Description 1",
          owner: { id: "user-123", name: "Test User", avatar: null },
          members: [{ userId: "user-123", role: "OWNER" }],
          _count: { tasks: 5 },
        },
      ];

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as never);

      const result = await getProjects();
      expect(result).toEqual(mockProjects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: mockUser.id },
            { members: { some: { userId: mockUser.id } } },
          ],
        },
        include: expect.any(Object),
        orderBy: { updatedAt: "desc" },
      });
    });
  });

  describe("getProject", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getProject("project-123");
      expect(result).toBeNull();
    });

    it("should return project when user has access", async () => {
      const mockProject = {
        id: "project-123",
        name: "Test Project",
        description: "Test",
        owner: { id: "user-123", name: "Test User", email: "test@example.com", avatar: null },
        members: [],
        _count: { tasks: 0 },
      };

      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject as never);

      const result = await getProject("project-123");
      expect(result).toEqual(mockProject);
    });

    it("should return null when project not found", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await getProject("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("createProject", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const formData = createFormData({ name: "New Project" });
      const result = await createProject(formData);

      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error for invalid name", async () => {
      const formData = createFormData({ name: "A" });
      const result = await createProject(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should create project and redirect", async () => {
      vi.mocked(prisma.project.create).mockResolvedValue({
        id: "new-project-123",
        name: "New Project",
        description: null,
        ownerId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const formData = createFormData({
        name: "New Project",
        description: "Test description",
      });

      // In test environment, redirect doesn't throw - it just gets called
      await createProject(formData);

      expect(prisma.project.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/projects/new-project-123");
    });
  });

  describe("updateProject", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const formData = createFormData({ name: "Updated Name" });
      const result = await updateProject("project-123", formData);

      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when project not found", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const formData = createFormData({ name: "Updated Name" });
      const result = await updateProject("project-123", formData);

      expect(result).toEqual({ success: false, error: "Проект не найден или нет доступа" });
    });

    it("should update project successfully", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "project-123",
        name: "Old Name",
        description: null,
        ownerId: mockUser.id,
      } as never);

      vi.mocked(prisma.project.update).mockResolvedValue({} as never);

      const formData = createFormData({ name: "Updated Name" });
      const result = await updateProject("project-123", formData);

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/projects/project-123");
    });
  });

  describe("deleteProject", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await deleteProject("project-123");
      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when user is not owner", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await deleteProject("project-123");
      expect(result).toEqual({ success: false, error: "Проект не найден или нет доступа" });
    });

    it("should delete project successfully", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "project-123",
        ownerId: mockUser.id,
      } as never);
      vi.mocked(prisma.project.delete).mockResolvedValue({} as never);

      const result = await deleteProject("project-123");

      expect(result).toEqual({ success: true });
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: "project-123" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("inviteMember", () => {
    it("should return error when user has no permission", async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null);

      const formData = createFormData({ email: "invite@example.com" });
      const result = await inviteMember("project-123", formData);

      expect(result).toEqual({ success: false, error: "Нет прав для приглашения участников" });
    });

    it("should return error when user is already a member", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "member-1", role: "OWNER" } as never)
        .mockResolvedValueOnce({ id: "existing-member" } as never);

      const formData = createFormData({ email: "existing@example.com" });
      const result = await inviteMember("project-123", formData);

      expect(result).toEqual({ success: false, error: "Пользователь уже является участником проекта" });
    });

    it("should return error when invitation already exists", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "member-1", role: "ADMIN" } as never)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
        id: "existing-invitation",
        status: "PENDING",
      } as never);

      const formData = createFormData({ email: "pending@example.com" });
      const result = await inviteMember("project-123", formData);

      expect(result).toEqual({ success: false, error: "Приглашение уже отправлено на этот email" });
    });

    it("should create invitation successfully", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "member-1", role: "OWNER" } as never)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.invitation.create).mockResolvedValue({} as never);

      const formData = createFormData({ email: "new@example.com" });
      const result = await inviteMember("project-123", formData);

      expect(result).toEqual({ success: true });
      expect(prisma.invitation.create).toHaveBeenCalled();
    });
  });

  describe("acceptInvitation", () => {
    it("should return error when invitation not found", async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        email: "test@example.com",
      } as never);
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null);

      const result = await acceptInvitation("invalid-token");
      expect(result).toEqual({ success: false, error: "Приглашение не найдено" });
    });

    it("should return error when invitation is expired", async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        email: "test@example.com",
      } as never);
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
        id: "inv-1",
        email: "test@example.com",
        status: "PENDING",
        expiresAt: new Date("2020-01-01"), // expired
      } as never);

      const result = await acceptInvitation("expired-token");
      expect(result).toEqual({ success: false, error: "Срок действия приглашения истёк" });
    });

    it("should return error when email does not match", async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        email: "other@example.com",
      } as never);
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
        id: "inv-1",
        email: "test@example.com",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
      } as never);

      const result = await acceptInvitation("valid-token");
      expect(result).toEqual({ success: false, error: "Это приглашение предназначено для другого email" });
    });
  });

  describe("updateMemberRole", () => {
    it("should return error when user is not owner", async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null);

      const result = await updateMemberRole("project-123", "member-456", "ADMIN");
      expect(result).toEqual({ success: false, error: "Только владелец может изменять роли" });
    });

    it("should return error when trying to change owner role", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "owner", role: "OWNER" } as never)
        .mockResolvedValueOnce({ id: "target", role: "OWNER" } as never);

      const result = await updateMemberRole("project-123", "owner-id", "ADMIN");
      expect(result).toEqual({ success: false, error: "Нельзя изменить роль владельца" });
    });
  });

  describe("removeMember", () => {
    it("should return error when trying to remove owner", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "member", userId: mockUser.id, role: "ADMIN" } as never)
        .mockResolvedValueOnce({ id: "target", role: "OWNER" } as never);

      const result = await removeMember("project-123", "owner-id");
      expect(result).toEqual({ success: false, error: "Нельзя удалить владельца проекта" });
    });

    it("should allow user to remove themselves", async () => {
      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce({ id: "member", userId: mockUser.id, role: "MEMBER" } as never)
        .mockResolvedValueOnce({ id: "target", userId: mockUser.id, role: "MEMBER" } as never);
      vi.mocked(prisma.projectMember.delete).mockResolvedValue({} as never);

      const result = await removeMember("project-123", mockUser.id);
      expect(result).toEqual({ success: true });
    });
  });
});
