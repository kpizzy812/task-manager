import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckCircle, Users, Folder } from "lucide-react";
import { StatCard } from "@/components/analytics/stat-card";

describe("StatCard", () => {
  it("should render title and value", () => {
    render(
      <StatCard
        title="Test Title"
        value={42}
        icon={CheckCircle}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render string value", () => {
    render(
      <StatCard
        title="Test Title"
        value="100%"
        icon={CheckCircle}
      />
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(
      <StatCard
        title="Tasks"
        value={10}
        description="5 completed this week"
        icon={Folder}
      />
    );

    expect(screen.getByText("5 completed this week")).toBeInTheDocument();
  });

  it("should not render description when not provided", () => {
    render(
      <StatCard
        title="Tasks"
        value={10}
        icon={Folder}
      />
    );

    // Make sure only the title and value are rendered, no extra paragraphs
    const paragraphs = document.querySelectorAll("p.text-xs");
    expect(paragraphs).toHaveLength(0);
  });

  it("should render the icon", () => {
    const { container } = render(
      <StatCard
        title="Users"
        value={25}
        icon={Users}
      />
    );

    // Check for SVG icon presence
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={0}
        icon={CheckCircle}
        className="custom-class"
      />
    );

    // Find the Card component (first div with role or specific class)
    const card = container.firstChild;
    expect(card).toHaveClass("custom-class");
  });

  it("should render zero value correctly", () => {
    render(
      <StatCard
        title="Empty"
        value={0}
        icon={Folder}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should render large numbers correctly", () => {
    render(
      <StatCard
        title="Big Number"
        value={1000000}
        icon={CheckCircle}
      />
    );

    expect(screen.getByText("1000000")).toBeInTheDocument();
  });
});
