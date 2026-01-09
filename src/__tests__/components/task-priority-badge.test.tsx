import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";

describe("TaskPriorityBadge", () => {
  it("should render LOW priority badge", () => {
    render(<TaskPriorityBadge priority="LOW" />);
    expect(screen.getByText("Низкий")).toBeInTheDocument();
  });

  it("should render MEDIUM priority badge", () => {
    render(<TaskPriorityBadge priority="MEDIUM" />);
    expect(screen.getByText("Средний")).toBeInTheDocument();
  });

  it("should render HIGH priority badge", () => {
    render(<TaskPriorityBadge priority="HIGH" />);
    expect(screen.getByText("Высокий")).toBeInTheDocument();
  });

  it("should render URGENT priority badge", () => {
    render(<TaskPriorityBadge priority="URGENT" />);
    expect(screen.getByText("Срочный")).toBeInTheDocument();
  });

  it("should apply correct style classes for LOW priority", () => {
    render(<TaskPriorityBadge priority="LOW" />);
    const badge = screen.getByText("Низкий");
    expect(badge).toHaveClass("bg-slate-100", "text-slate-700");
  });

  it("should apply correct style classes for MEDIUM priority", () => {
    render(<TaskPriorityBadge priority="MEDIUM" />);
    const badge = screen.getByText("Средний");
    expect(badge).toHaveClass("bg-blue-100", "text-blue-700");
  });

  it("should apply correct style classes for HIGH priority", () => {
    render(<TaskPriorityBadge priority="HIGH" />);
    const badge = screen.getByText("Высокий");
    expect(badge).toHaveClass("bg-orange-100", "text-orange-700");
  });

  it("should apply correct style classes for URGENT priority", () => {
    render(<TaskPriorityBadge priority="URGENT" />);
    const badge = screen.getByText("Срочный");
    expect(badge).toHaveClass("bg-red-100", "text-red-700");
  });

  it("should accept additional className", () => {
    render(<TaskPriorityBadge priority="LOW" className="custom-class" />);
    const badge = screen.getByText("Низкий");
    expect(badge).toHaveClass("custom-class");
  });
});
