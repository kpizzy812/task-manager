import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";

// Mock modules before importing the actions
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProfileDetails, updateProfile } from "@/actions/profile";

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

// Helper to create FormData
const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

describe("Profile Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);
  });

  describe("getProfileDetails", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await getProfileDetails();
      expect(result).toBeNull();
    });

    it("should return profile details for authenticated user", async () => {
      const mockProfile = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        avatar: "https://example.com/avatar.jpg",
        createdAt: new Date("2024-01-01"),
        _count: {
          ownedProjects: 3,
          assignedTasks: 10,
        },
      };

      vi.mocked(prisma.profile.findUnique).mockResolvedValue(mockProfile as never);

      const result = await getProfileDetails();

      expect(result).toEqual(mockProfile);
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              assignedTasks: true,
            },
          },
        },
      });
    });

    it("should return null when profile not found", async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);

      const result = await getProfileDetails();
      expect(result).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should return error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const formData = createFormData({ name: "Updated Name" });
      const result = await updateProfile(formData);

      expect(result).toEqual({ success: false, error: "Необходима авторизация" });
    });

    it("should return error for invalid name (too short)", async () => {
      const formData = createFormData({ name: "A" });
      const result = await updateProfile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error for invalid name (too long)", async () => {
      const formData = createFormData({ name: "A".repeat(101) });
      const result = await updateProfile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error for invalid avatar URL", async () => {
      const formData = new FormData();
      formData.append("name", "Valid Name");
      formData.append("avatar", "not-a-url");

      const result = await updateProfile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should update profile successfully with name only", async () => {
      vi.mocked(prisma.profile.update).mockResolvedValue({} as never);

      const formData = createFormData({ name: "Updated Name" });
      const result = await updateProfile(formData);

      expect(result).toEqual({ success: true });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: "Updated Name",
          avatar: null,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("should update profile with name and avatar", async () => {
      vi.mocked(prisma.profile.update).mockResolvedValue({} as never);

      const formData = new FormData();
      formData.append("name", "Updated Name");
      formData.append("avatar", "https://example.com/new-avatar.jpg");

      const result = await updateProfile(formData);

      expect(result).toEqual({ success: true });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: "Updated Name",
          avatar: "https://example.com/new-avatar.jpg",
        },
      });
    });

    it("should trim whitespace from name", async () => {
      vi.mocked(prisma.profile.update).mockResolvedValue({} as never);

      const formData = createFormData({ name: "  Trimmed Name  " });
      const result = await updateProfile(formData);

      expect(result).toEqual({ success: true });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: "Trimmed Name",
          avatar: null,
        },
      });
    });

    it("should handle database error gracefully", async () => {
      vi.mocked(prisma.profile.update).mockRejectedValue(new Error("Database error"));

      const formData = createFormData({ name: "Valid Name" });
      const result = await updateProfile(formData);

      expect(result).toEqual({ success: false, error: "Ошибка при обновлении профиля" });
    });
  });
});
