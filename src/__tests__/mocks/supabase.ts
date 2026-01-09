import { vi } from "vitest";

// Mock user for authenticated state
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: { name: "Test User" },
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
};

// Mock session
export const mockSession = {
  user: mockUser,
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Date.now() + 3600,
};

// Create mock Supabase auth methods
export const createMockSupabaseAuth = (isAuthenticated = true) => ({
  getUser: vi.fn().mockResolvedValue({
    data: { user: isAuthenticated ? mockUser : null },
    error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
    data: { session: isAuthenticated ? mockSession : null },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
});

// Create mock Supabase client
export const createMockSupabaseClient = (isAuthenticated = true) => ({
  auth: createMockSupabaseAuth(isAuthenticated),
});

// Setup Supabase mock with configurable authentication state
export const setupSupabaseMock = (isAuthenticated = true) => {
  const mockClient = createMockSupabaseClient(isAuthenticated);

  vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(mockClient),
  }));

  vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(() => mockClient),
  }));

  return mockClient;
};

// Helper to simulate authentication errors
export const createAuthError = (message: string) => ({
  data: { user: null, session: null },
  error: { message, status: 400 },
});

// Helper to simulate successful login
export const mockSuccessfulLogin = (client: ReturnType<typeof createMockSupabaseClient>) => {
  client.auth.signInWithPassword.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  });
};

// Helper to simulate failed login
export const mockFailedLogin = (client: ReturnType<typeof createMockSupabaseClient>, message = "Invalid credentials") => {
  client.auth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message, status: 400 },
  });
};

// Helper to simulate successful registration
export const mockSuccessfulRegistration = (client: ReturnType<typeof createMockSupabaseClient>) => {
  client.auth.signUp.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  });
};

// Helper to simulate registration with email confirmation required
export const mockRegistrationWithConfirmation = (client: ReturnType<typeof createMockSupabaseClient>) => {
  client.auth.signUp.mockResolvedValue({
    data: { user: mockUser, session: null },
    error: null,
  });
};

// Helper to simulate registration failure
export const mockFailedRegistration = (
  client: ReturnType<typeof createMockSupabaseClient>,
  message = "User already registered"
) => {
  client.auth.signUp.mockResolvedValue({
    data: { user: null, session: null },
    error: { message, status: 400 },
  });
};
