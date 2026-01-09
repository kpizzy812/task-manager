import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { login } from "@/actions/auth";

// Mock the auth action
vi.mock("@/actions/auth", () => ({
  login: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  redirect: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form with all fields", () => {
    render(<LoginForm />);

    expect(screen.getByText("Вход в систему")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /войти/i })).toBeInTheDocument();
  });

  it("should render registration link", () => {
    render(<LoginForm />);

    expect(screen.getByText("Нет аккаунта?")).toBeInTheDocument();
    expect(screen.getByText("Зарегистрироваться")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /зарегистрироваться/i })).toHaveAttribute("href", "/register");
  });

  it("should not submit form with invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const submitButton = screen.getByRole("button", { name: /войти/i });

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Wait a bit and verify login was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(login).not.toHaveBeenCalled();
  });

  it("should not submit form with short password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const submitButton = screen.getByRole("button", { name: /войти/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "12345");
    await user.click(submitButton);

    // Wait a bit and verify login was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(login).not.toHaveBeenCalled();
  });

  it("should call login action with form data on valid submission", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({ success: true });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const submitButton = screen.getByRole("button", { name: /войти/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  it("should disable form inputs when submitting", async () => {
    const user = userEvent.setup();
    // Make login hang to test loading state
    vi.mocked(login).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const submitButton = screen.getByRole("button", { name: /войти/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it("should have correct input placeholders", () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText("email@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("******")).toBeInTheDocument();
  });

  it("should have correct input types", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should have correct autocomplete attributes", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");

    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});
