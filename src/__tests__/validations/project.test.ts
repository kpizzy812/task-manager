import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
} from "@/lib/validations/project";

describe("Project Validations", () => {
  describe("createProjectSchema", () => {
    it("should validate correct project data", () => {
      const data = {
        name: "Test Project",
        description: "Test description",
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Project");
        expect(result.data.description).toBe("Test description");
      }
    });

    it("should allow project without description", () => {
      const data = {
        name: "Test Project",
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject name shorter than 2 characters", () => {
      const data = {
        name: "A",
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const data = {
        name: "A".repeat(101),
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 500 characters", () => {
      const data = {
        name: "Test Project",
        description: "A".repeat(501),
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept name exactly 2 characters", () => {
      const data = {
        name: "AB",
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept name exactly 100 characters", () => {
      const data = {
        name: "A".repeat(100),
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept description exactly 500 characters", () => {
      const data = {
        name: "Test Project",
        description: "A".repeat(500),
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("updateProjectSchema", () => {
    it("should validate update with name only", () => {
      const data = {
        name: "Updated Name",
      };

      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate update with description only", () => {
      const data = {
        description: "Updated description",
      };

      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow null description", () => {
      const data = {
        name: "Updated Name",
        description: null,
      };

      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow empty update object", () => {
      const data = {};

      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid name in update", () => {
      const data = {
        name: "A",
      };

      const result = updateProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("inviteMemberSchema", () => {
    it("should validate correct email", () => {
      const data = {
        email: "invite@example.com",
      };

      const result = inviteMemberSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const data = {
        email: "not-an-email",
      };

      const result = inviteMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject email longer than 255 characters", () => {
      const data = {
        email: "a".repeat(250) + "@example.com",
      };

      const result = inviteMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "simple@example.com",
        "very.common@example.com",
        "disposable.style.email.with+symbol@example.com",
        "user.name+tag+sorting@example.com",
        "x@example.com",
        "example-indeed@strange-example.com",
      ];

      validEmails.forEach((email) => {
        const result = inviteMemberSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });
  });
});
