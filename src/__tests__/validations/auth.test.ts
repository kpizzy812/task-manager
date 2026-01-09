import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("Auth Validations", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("should transform email to lowercase", () => {
      // Note: Zod email validation happens before transform,
      // so emails with leading/trailing spaces fail validation.
      // Only uppercase transformation is tested here.
      const data = {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should reject invalid email format", () => {
      const data = {
        email: "invalid-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 6 characters", () => {
      const data = {
        email: "test@example.com",
        password: "12345",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject password longer than 72 characters", () => {
      const data = {
        email: "test@example.com",
        password: "a".repeat(73),
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept password exactly 6 characters", () => {
      const data = {
        email: "test@example.com",
        password: "123456",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept password exactly 72 characters", () => {
      const data = {
        email: "test@example.com",
        password: "a".repeat(72),
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test User");
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should trim whitespace from name", () => {
      const data = {
        name: "  Test User  ",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test User");
      }
    });

    it("should reject name shorter than 2 characters", () => {
      const data = {
        name: "A",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const data = {
        name: "A".repeat(101),
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject non-matching passwords", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "differentpassword",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("should reject invalid email in registration", () => {
      const data = {
        name: "Test User",
        email: "not-an-email",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept name exactly 2 characters", () => {
      const data = {
        name: "AB",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept name exactly 100 characters", () => {
      const data = {
        name: "A".repeat(100),
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
