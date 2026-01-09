import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";

// Mock modules before importing the actions
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    projectMember: {
      findMany: vi.fn(),
    },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  updateTaskOrder,
  deleteTask,
  getProjectMembers,
} from "@/actions/tasks";

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

// Helper to create FormData
const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

describe("Tasks Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);
  });

  describe("getTasksByProject", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getTasksByProject("project-123");
      expect(result).toBeNull();
    });

    it("should return null when user has no access", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await getTasksByProject("project-123");
      expect(result).toBeNull();
    });

    it("should return grouped tasks by status", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const mockTasks = [
        { id: "task-1", title: "Task 1", status: "TODO", assignee: null, creator: { id: "user-123", name: "Test" } },
        { id: "task-2", title: "Task 2", status: "IN_PROGRESS", assignee: null, creator: { id: "user-123", name: "Test" } },
        { id: "task-3", title: "Task 3", status: "TODO", assignee: null, creator: { id: "user-123", name: "Test" } },
        { id: "task-4", title: "Task 4", status: "DONE", assignee: null, creator: { id: "user-123", name: "Test" } },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await getTasksByProject("project-123");

      expect(result).not.toBeNull();
      expect(result!.TODO).toHaveLength(2);
      expect(result!.IN_PROGRESS).toHaveLength(1);
      expect(result!.REVIEW).toHaveLength(0);
      expect(result!.DONE).toHaveLength(1);
    });
  });

  describe("getTask", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getTask("task-123");
      expect(result).toBeNull();
    });

    it("should return null when task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await getTask("non-existent");
      expect(result).toBeNull();
    });

    it("should return null when user has no access to project", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-123",
        projectId: "project-123",
        project: { id: "project-123", name: "Test" },
      } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await getTask("task-123");
      expect(result).toBeNull();
    });

    it("should return task when user has access", async () => {
      const mockTask = {
        id: "task-123",
        title: "Test Task",
        projectId: "project-123",
        project: { id: "project-123", name: "Test" },
        assignee: null,
        creator: { id: "user-123", name: "Test", email: "test@example.com" },
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const result = await getTask("task-123");
      expect(result).toEqual(mockTask);
    });
  });

  describe("createTask", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const formData = createFormData({
        title: "New Task",
        status: "TODO",
        priority: "MEDIUM",
      });

      const result = await createTask("project-123", formData);
      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when user has no access", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const formData = createFormData({
        title: "New Task",
        status: "TODO",
        priority: "MEDIUM",
      });

      const result = await createTask("project-123", formData);
      expect(result).toEqual({ success: false, error: "Нет доступа к проекту" });
    });

    it("should return error for invalid title", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const formData = createFormData({
        title: "A", // too short
        status: "TODO",
        priority: "MEDIUM",
      });

      const result = await createTask("project-123", formData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should create task successfully", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.aggregate).mockResolvedValue({ _max: { order: 5 } } as never);
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: "new-task-123",
        title: "New Task",
        status: "TODO",
        priority: "MEDIUM",
        order: 6,
      } as never);

      const formData = createFormData({
        title: "New Task",
        description: "Task description",
        status: "TODO",
        priority: "MEDIUM",
      });

      const result = await createTask("project-123", formData);

      expect(result).toEqual({ success: true });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Task",
          description: "Task description",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project-123",
          creatorId: mockUser.id,
          order: 6,
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith("/projects/project-123");
    });

    it("should create task with deadline", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.aggregate).mockResolvedValue({ _max: { order: 0 } } as never);
      vi.mocked(prisma.task.create).mockResolvedValue({} as never);

      const formData = createFormData({
        title: "New Task",
        status: "TODO",
        priority: "HIGH",
        deadline: "2024-12-31",
      });

      const result = await createTask("project-123", formData);

      expect(result).toEqual({ success: true });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deadline: expect.any(Date),
        }),
      });
    });

    it("should create task with assignee", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.aggregate).mockResolvedValue({ _max: { order: null } } as never);
      vi.mocked(prisma.task.create).mockResolvedValue({} as never);

      const formData = createFormData({
        title: "New Task",
        status: "IN_PROGRESS",
        priority: "URGENT",
        assigneeId: "assignee-456",
      });

      const result = await createTask("project-123", formData);

      expect(result).toEqual({ success: true });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          assigneeId: "assignee-456",
          order: 1, // maxOrder is null, so new order is 0 + 1 = 1
        }),
      });
    });
  });

  describe("updateTask", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const formData = createFormData({ title: "Updated Title" });
      const result = await updateTask("task-123", formData);

      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const formData = createFormData({ title: "Updated Title" });
      const result = await updateTask("non-existent", formData);

      expect(result).toEqual({ success: false, error: "Задача не найдена" });
    });

    it("should return error when user has no access", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-123",
        projectId: "project-123",
      } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const formData = createFormData({ title: "Updated Title" });
      const result = await updateTask("task-123", formData);

      expect(result).toEqual({ success: false, error: "Нет доступа к проекту" });
    });

    it("should update task successfully", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-123",
        projectId: "project-123",
      } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.update).mockResolvedValue({} as never);

      const formData = createFormData({
        title: "Updated Title",
        status: "IN_PROGRESS",
        priority: "HIGH",
      });

      const result = await updateTask("task-123", formData);

      expect(result).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-123" },
        data: expect.objectContaining({
          title: "Updated Title",
          status: "IN_PROGRESS",
          priority: "HIGH",
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith("/projects/project-123");
    });
  });

  describe("updateTaskOrder", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await updateTaskOrder("task-123", "IN_PROGRESS", 5);
      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await updateTaskOrder("non-existent", "TODO", 0);
      expect(result).toEqual({ success: false, error: "Задача не найдена" });
    });

    it("should update task order and status successfully", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-123",
        projectId: "project-123",
        status: "TODO",
        order: 0,
      } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.update).mockResolvedValue({} as never);

      const result = await updateTaskOrder("task-123", "IN_PROGRESS", 5);

      expect(result).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-123" },
        data: {
          status: "IN_PROGRESS",
          order: 5,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/projects/project-123");
    });
  });

  describe("deleteTask", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await deleteTask("task-123");
      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error when task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await deleteTask("non-existent");
      expect(result).toEqual({ success: false, error: "Задача не найдена" });
    });

    it("should delete task successfully", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-123",
        projectId: "project-123",
      } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.delete).mockResolvedValue({} as never);

      const result = await deleteTask("task-123");

      expect(result).toEqual({ success: true });
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task-123" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/projects/project-123");
    });
  });

  describe("getProjectMembers", () => {
    it("should return empty array when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getProjectMembers("project-123");
      expect(result).toEqual([]);
    });

    it("should return empty array when user has no access", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await getProjectMembers("project-123");
      expect(result).toEqual([]);
    });

    it("should return project members", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const mockMembers = [
        { user: { id: "user-1", name: "User 1", email: "user1@example.com", avatar: null } },
        { user: { id: "user-2", name: "User 2", email: "user2@example.com", avatar: null } },
      ];

      vi.mocked(prisma.projectMember.findMany).mockResolvedValue(mockMembers as never);

      const result = await getProjectMembers("project-123");

      expect(result).toEqual([
        { id: "user-1", name: "User 1", email: "user1@example.com", avatar: null },
        { id: "user-2", name: "User 2", email: "user2@example.com", avatar: null },
      ]);
    });
  });
});
