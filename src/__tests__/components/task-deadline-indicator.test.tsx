import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskDeadlineIndicator } from "@/components/tasks/task-deadline-indicator";

describe("TaskDeadlineIndicator", () => {
  // Use a fixed date for testing
  const baseDate = new Date("2024-06-15T12:00:00");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show 'Сегодня' for today's deadline", () => {
    const todayDeadline = new Date("2024-06-15T18:00:00");
    render(<TaskDeadlineIndicator deadline={todayDeadline} />);
    expect(screen.getByText("Сегодня")).toBeInTheDocument();
  });

  it("should show 'Завтра' for tomorrow's deadline", () => {
    const tomorrowDeadline = new Date("2024-06-16T12:00:00");
    render(<TaskDeadlineIndicator deadline={tomorrowDeadline} />);
    expect(screen.getByText("Завтра")).toBeInTheDocument();
  });

  it("should show overdue message for past deadlines", () => {
    const pastDeadline = new Date("2024-06-10T12:00:00"); // 5 days ago
    render(<TaskDeadlineIndicator deadline={pastDeadline} />);
    expect(screen.getByText(/Просрочено/)).toBeInTheDocument();
    expect(screen.getByText(/назад/)).toBeInTheDocument();
  });

  it("should show future date format for deadlines more than 1 day away", () => {
    const futureDeadline = new Date("2024-06-20T12:00:00"); // 5 days from now
    render(<TaskDeadlineIndicator deadline={futureDeadline} />);
    // date-fns formatDistanceToNow will return something like "через 5 дней"
    expect(screen.getByText(/через/)).toBeInTheDocument();
  });

  it("should apply orange color for today deadline", () => {
    const todayDeadline = new Date("2024-06-15T18:00:00");
    render(<TaskDeadlineIndicator deadline={todayDeadline} />);
    const indicator = screen.getByText("Сегодня").closest("div");
    expect(indicator).toHaveClass("text-orange-600");
  });

  it("should apply red color for overdue deadline", () => {
    const pastDeadline = new Date("2024-06-10T12:00:00");
    render(<TaskDeadlineIndicator deadline={pastDeadline} />);
    const indicator = screen.getByText(/Просрочено/).closest("div");
    expect(indicator).toHaveClass("text-red-600");
  });

  it("should apply muted color for future deadline", () => {
    const futureDeadline = new Date("2024-06-20T12:00:00");
    render(<TaskDeadlineIndicator deadline={futureDeadline} />);
    const indicator = screen.getByText(/через/).closest("div");
    expect(indicator).toHaveClass("text-muted-foreground");
  });

  it("should accept additional className", () => {
    const todayDeadline = new Date("2024-06-15T18:00:00");
    render(<TaskDeadlineIndicator deadline={todayDeadline} className="custom-class" />);
    const indicator = screen.getByText("Сегодня").closest("div");
    expect(indicator).toHaveClass("custom-class");
  });

  it("should render calendar icon for non-overdue deadlines", () => {
    const futureDeadline = new Date("2024-06-20T12:00:00");
    const { container } = render(<TaskDeadlineIndicator deadline={futureDeadline} />);
    // Calendar icon is an SVG, check for its presence
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render alert icon for overdue deadlines", () => {
    const pastDeadline = new Date("2024-06-10T12:00:00");
    const { container } = render(<TaskDeadlineIndicator deadline={pastDeadline} />);
    // AlertTriangle icon is an SVG, check for its presence
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
