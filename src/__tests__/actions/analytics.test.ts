import { describe, it, expect, vi, beforeEach } from "vitest";

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
    },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProjectAnalytics } from "@/actions/analytics";

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

describe("Analytics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);
  });

  describe("getProjectAnalytics", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getProjectAnalytics("project-123");
      expect(result).toBeNull();
    });

    it("should return null when user has no access", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await getProjectAnalytics("project-123");
      expect(result).toBeNull();
    });

    it("should return analytics for empty project", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await getProjectAnalytics("project-123");

      expect(result).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        statusCounts: [
          { status: "TODO", count: 0, label: "К выполнению" },
          { status: "IN_PROGRESS", count: 0, label: "В работе" },
          { status: "REVIEW", count: 0, label: "На проверке" },
          { status: "DONE", count: 0, label: "Готово" },
        ],
        overdueTasksList: [],
      });
    });

    it("should calculate correct analytics with tasks", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const mockTasks = [
        { id: "1", title: "Task 1", status: "TODO", priority: "MEDIUM", deadline: null, assignee: null },
        { id: "2", title: "Task 2", status: "TODO", priority: "HIGH", deadline: null, assignee: null },
        { id: "3", title: "Task 3", status: "IN_PROGRESS", priority: "MEDIUM", deadline: null, assignee: null },
        { id: "4", title: "Task 4", status: "REVIEW", priority: "LOW", deadline: null, assignee: null },
        { id: "5", title: "Task 5", status: "DONE", priority: "MEDIUM", deadline: null, assignee: null },
        { id: "6", title: "Task 6", status: "DONE", priority: "HIGH", deadline: null, assignee: null },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await getProjectAnalytics("project-123");

      expect(result).not.toBeNull();
      expect(result!.totalTasks).toBe(6);
      expect(result!.completedTasks).toBe(2);
      expect(result!.overdueTasks).toBe(0);
      expect(result!.completionRate).toBe(33); // 2/6 = 33%
      expect(result!.statusCounts).toEqual([
        { status: "TODO", count: 2, label: "К выполнению" },
        { status: "IN_PROGRESS", count: 1, label: "В работе" },
        { status: "REVIEW", count: 1, label: "На проверке" },
        { status: "DONE", count: 2, label: "Готово" },
      ]);
    });

    it("should identify overdue tasks correctly", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const pastDate = new Date("2020-01-01");
      const futureDate = new Date("2030-01-01");

      const mockTasks = [
        { id: "1", title: "Overdue Task 1", status: "TODO", priority: "HIGH", deadline: pastDate, assignee: { id: "user-1", name: "User 1", avatar: null } },
        { id: "2", title: "Overdue Task 2", status: "IN_PROGRESS", priority: "URGENT", deadline: pastDate, assignee: null },
        { id: "3", title: "Not overdue (DONE)", status: "DONE", priority: "MEDIUM", deadline: pastDate, assignee: null },
        { id: "4", title: "Future deadline", status: "TODO", priority: "LOW", deadline: futureDate, assignee: null },
        { id: "5", title: "No deadline", status: "TODO", priority: "MEDIUM", deadline: null, assignee: null },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await getProjectAnalytics("project-123");

      expect(result).not.toBeNull();
      expect(result!.overdueTasks).toBe(2);
      expect(result!.overdueTasksList).toHaveLength(2);
      expect(result!.overdueTasksList[0].title).toBe("Overdue Task 1");
      expect(result!.overdueTasksList[1].title).toBe("Overdue Task 2");
    });

    it("should sort overdue tasks by deadline", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const date1 = new Date("2020-01-15");
      const date2 = new Date("2020-01-01");
      const date3 = new Date("2020-01-10");

      const mockTasks = [
        { id: "1", title: "Later", status: "TODO", priority: "HIGH", deadline: date1, assignee: null },
        { id: "2", title: "Earliest", status: "TODO", priority: "HIGH", deadline: date2, assignee: null },
        { id: "3", title: "Middle", status: "TODO", priority: "HIGH", deadline: date3, assignee: null },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await getProjectAnalytics("project-123");

      expect(result).not.toBeNull();
      expect(result!.overdueTasksList[0].title).toBe("Earliest");
      expect(result!.overdueTasksList[1].title).toBe("Middle");
      expect(result!.overdueTasksList[2].title).toBe("Later");
    });

    it("should calculate 100% completion rate when all tasks done", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "project-123" } as never);

      const mockTasks = [
        { id: "1", title: "Task 1", status: "DONE", priority: "MEDIUM", deadline: null, assignee: null },
        { id: "2", title: "Task 2", status: "DONE", priority: "HIGH", deadline: null, assignee: null },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await getProjectAnalytics("project-123");

      expect(result!.completionRate).toBe(100);
    });
  });
});
