import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { refreshSession } from "@/lib/auth-api";
import { setAccessToken } from "@/lib/api";

jest.mock("@/lib/auth-api", () => ({
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshSession: jest.fn(),
  register: jest.fn(),
}));

const mockRefreshSession = jest.mocked(refreshSession);
const validToken = `header.${btoa(
  JSON.stringify({
    sub: "123e4567-e89b-42d3-a456-426614174000",
    email: "patient@example.com",
    role: "PATIENT",
  })
)}.signature`;

function AuthState() {
  const { isAuthenticated, user } = useAuth();
  return <output>{isAuthenticated ? user?.role : "signed out"}</output>;
}

describe("AuthProvider token synchronization", () => {
  beforeEach(() => {
    setAccessToken(null);
    mockRefreshSession.mockResolvedValue({ accessToken: validToken });
  });

  afterEach(() => setAccessToken(null));

  it("clears React auth state when the API client clears an expired token", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthState />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("PATIENT")).toBeInTheDocument());
    act(() => setAccessToken(null));
    expect(screen.getByText("signed out")).toBeInTheDocument();
    queryClient.clear();
  });
});
