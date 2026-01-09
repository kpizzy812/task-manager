import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "@/components/projects/project-card";

// Mock the projects action
vi.mock("@/actions/projects", () => ({
  deleteProject: vi.fn(),
}));

// Mock date-fns to have consistent output
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    formatDistanceToNow: vi.fn(() => "2 дня назад"),
  };
});

const mockProject = {
  id: "project-123",
  name: "Test Project",
  description: "This is a test project description",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-10"),
  ownerId: "user-123",
  _count: {
    tasks: 5,
  },
  members: [
    { userId: "user-123", role: "OWNER" },
    { userId: "user-456", role: "MEMBER" },
  ],
};

describe("ProjectCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render project name", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("should render project description when provided", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByText("This is a test project description")).toBeInTheDocument();
  });

  it("should not render description when null", () => {
    const projectWithoutDescription = { ...mockProject, description: null };
    render(<ProjectCard project={projectWithoutDescription} currentUserId="user-123" />);
    expect(screen.queryByText("This is a test project description")).not.toBeInTheDocument();
  });

  it("should render member count", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should render task count", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByText("5 задач")).toBeInTheDocument();
  });

  it("should render update time", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByText(/обновлён/i)).toBeInTheDocument();
  });

  it("should link to project page", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/project-123");
  });

  it("should show menu button for owner", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-123" />);
    expect(screen.getByRole("button", { name: /меню/i })).toBeInTheDocument();
  });

  it("should not show menu button for non-owner", () => {
    render(<ProjectCard project={mockProject} currentUserId="user-789" />);
    expect(screen.queryByRole("button", { name: /меню/i })).not.toBeInTheDocument();
  });

  it("should render project with 0 tasks", () => {
    const projectWithNoTasks = {
      ...mockProject,
      _count: { tasks: 0 },
    };
    render(<ProjectCard project={projectWithNoTasks} currentUserId="user-123" />);
    expect(screen.getByText("0 задач")).toBeInTheDocument();
  });

  it("should render project with 1 member", () => {
    const projectWithOneMember = {
      ...mockProject,
      members: [{ userId: "user-123", role: "OWNER" }],
    };
    render(<ProjectCard project={projectWithOneMember} currentUserId="user-123" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
