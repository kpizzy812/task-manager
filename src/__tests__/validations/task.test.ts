import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskOrderSchema,
  taskStatusSchema,
  taskPrioritySchema,
} from "@/lib/validations/task";

describe("Task Validations", () => {
  describe("taskStatusSchema", () => {
    it("should accept valid status values", () => {
      const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

      validStatuses.forEach((status) => {
        const result = taskStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status value", () => {
      const result = taskStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });

    it("should reject lowercase status", () => {
      const result = taskStatusSchema.safeParse("todo");
      expect(result.success).toBe(false);
    });
  });

  describe("taskPrioritySchema", () => {
    it("should accept valid priority values", () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

      validPriorities.forEach((priority) => {
        const result = taskPrioritySchema.safeParse(priority);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priority value", () => {
      const result = taskPrioritySchema.safeParse("CRITICAL");
      expect(result.success).toBe(false);
    });
  });

  describe("createTaskSchema", () => {
    it("should validate correct task data", () => {
      const data = {
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Task");
        expect(result.data.status).toBe("TODO");
        expect(result.data.priority).toBe("MEDIUM");
      }
    });

    it("should allow task without optional fields", () => {
      const data = {
        title: "Test Task",
        status: "TODO",
        priority: "LOW",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow deadline as string", () => {
      const data = {
        title: "Test Task",
        status: "TODO",
        priority: "HIGH",
        deadline: "2024-12-31",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow null deadline", () => {
      const data = {
        title: "Test Task",
        status: "TODO",
        priority: "MEDIUM",
        deadline: null,
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow assigneeId", () => {
      const data = {
        title: "Test Task",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "user-123",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject title shorter than 2 characters", () => {
      const data = {
        title: "A",
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject title longer than 200 characters", () => {
      const data = {
        title: "A".repeat(201),
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 2000 characters", () => {
      const data = {
        title: "Test Task",
        description: "A".repeat(2001),
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept title exactly 2 characters", () => {
      const data = {
        title: "AB",
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept title exactly 200 characters", () => {
      const data = {
        title: "A".repeat(200),
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept description exactly 2000 characters", () => {
      const data = {
        title: "Test Task",
        description: "A".repeat(2000),
        status: "TODO",
        priority: "MEDIUM",
      };

      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("updateTaskSchema", () => {
    it("should validate partial update with title only", () => {
      const data = {
        title: "Updated Title",
      };

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate partial update with status only", () => {
      const data = {
        status: "IN_PROGRESS",
      };

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow null description", () => {
      const data = {
        description: null,
      };

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow empty update object", () => {
      const data = {};

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid title in update", () => {
      const data = {
        title: "A",
      };

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status in update", () => {
      const data = {
        status: "INVALID",
      };

      const result = updateTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("updateTaskOrderSchema", () => {
    it("should validate correct order update data", () => {
      const data = {
        taskId: "task-123",
        newStatus: "IN_PROGRESS",
        newOrder: 5,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject missing taskId", () => {
      const data = {
        newStatus: "TODO",
        newOrder: 0,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing newStatus", () => {
      const data = {
        taskId: "task-123",
        newOrder: 0,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing newOrder", () => {
      const data = {
        taskId: "task-123",
        newStatus: "TODO",
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status in order update", () => {
      const data = {
        taskId: "task-123",
        newStatus: "INVALID",
        newOrder: 0,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept zero order", () => {
      const data = {
        taskId: "task-123",
        newStatus: "TODO",
        newOrder: 0,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept negative order", () => {
      const data = {
        taskId: "task-123",
        newStatus: "TODO",
        newOrder: -1,
      };

      const result = updateTaskOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
