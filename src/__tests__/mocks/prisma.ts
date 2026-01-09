import { vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import { type PrismaClient } from "@prisma/client";

// Create a mock PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Reset the mock before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock the prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

export type PrismaMock = DeepMockProxy<PrismaClient>;

// Test data factories
export const createMockProfile = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  avatar: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: "project-123",
  name: "Test Project",
  description: "Test description",
  ownerId: "user-123",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockProjectMember = (overrides = {}) => ({
  id: "member-123",
  userId: "user-123",
  projectId: "project-123",
  role: "OWNER" as const,
  joinedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: "task-123",
  title: "Test Task",
  description: "Test description",
  status: "TODO" as const,
  priority: "MEDIUM" as const,
  deadline: null,
  order: 0,
  projectId: "project-123",
  assigneeId: null,
  creatorId: "user-123",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockInvitation = (overrides = {}) => ({
  id: "invitation-123",
  email: "invite@example.com",
  token: "token-123",
  status: "PENDING" as const,
  projectId: "project-123",
  senderId: "user-123",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date("2024-01-01"),
  ...overrides,
});
