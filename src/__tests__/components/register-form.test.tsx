import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";
import { register } from "@/actions/auth";

// Mock the auth action
vi.mock("@/actions/auth", () => ({
  register: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  redirect: vi.fn(),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render registration form with all fields", () => {
    render(<RegisterForm />);

    expect(screen.getByText("Создать аккаунт")).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByLabelText("Подтверждение пароля")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it("should render login link", () => {
    render(<RegisterForm />);

    expect(screen.getByText("Уже есть аккаунт?")).toBeInTheDocument();
    expect(screen.getByText("Войти")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /войти/i })).toHaveAttribute("href", "/login");
  });

  it("should not submit form with short name", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "A");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    // Verify register was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(register).not.toHaveBeenCalled();
  });

  it("should not submit form with invalid email", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "Test User");
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    // Verify register was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(register).not.toHaveBeenCalled();
  });

  it("should not submit form with short password", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "12345");
    await user.type(confirmPasswordInput, "12345");
    await user.click(submitButton);

    // Verify register was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(register).not.toHaveBeenCalled();
  });

  it("should not submit form with non-matching passwords", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "different456");
    await user.click(submitButton);

    // Verify register was NOT called due to validation error
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(register).not.toHaveBeenCalled();
  });

  it("should call register action with form data on valid submission", async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue({ success: true });

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(register).toHaveBeenCalled();
    });
  });

  it("should disable form inputs when submitting", async () => {
    const user = userEvent.setup();
    // Make register hang to test loading state
    vi.mocked(register).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
    );

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");
    const submitButton = screen.getByRole("button", { name: /зарегистрироваться/i });

    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it("should have correct input placeholders", () => {
    render(<RegisterForm />);

    expect(screen.getByPlaceholderText("Иван Иванов")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Минимум 6 символов")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Повторите пароль")).toBeInTheDocument();
  });

  it("should have correct autocomplete attributes", () => {
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Имя");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Пароль");
    const confirmPasswordInput = screen.getByLabelText("Подтверждение пароля");

    expect(nameInput).toHaveAttribute("autocomplete", "name");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    expect(confirmPasswordInput).toHaveAttribute("autocomplete", "new-password");
  });
});
