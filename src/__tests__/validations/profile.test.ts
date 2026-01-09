import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "@/lib/validations/profile";

describe("Profile Validations", () => {
  describe("updateProfileSchema", () => {
    it("should validate correct profile update data", () => {
      const data = {
        name: "Updated Name",
        avatar: "https://example.com/avatar.jpg",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.avatar).toBe("https://example.com/avatar.jpg");
      }
    });

    it("should trim whitespace from name", () => {
      const data = {
        name: "  Updated Name  ",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
      }
    });

    it("should allow null avatar", () => {
      const data = {
        name: "Updated Name",
        avatar: null,
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow undefined avatar", () => {
      const data = {
        name: "Updated Name",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject name shorter than 2 characters", () => {
      const data = {
        name: "A",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const data = {
        name: "A".repeat(101),
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid avatar URL", () => {
      const data = {
        name: "Updated Name",
        avatar: "not-a-url",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept various valid URL formats for avatar", () => {
      const validUrls = [
        "https://example.com/avatar.jpg",
        "http://example.com/avatar.png",
        "https://storage.example.com/images/user/avatar.webp",
        "https://cdn.example.com/u/123/avatar?size=200",
      ];

      validUrls.forEach((avatar) => {
        const result = updateProfileSchema.safeParse({ name: "Test", avatar });
        expect(result.success).toBe(true);
      });
    });

    it("should accept name exactly 2 characters", () => {
      const data = {
        name: "AB",
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept name exactly 100 characters", () => {
      const data = {
        name: "A".repeat(100),
      };

      const result = updateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
