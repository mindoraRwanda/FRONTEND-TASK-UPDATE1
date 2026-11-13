import { render, screen } from "@testing-library/react";
import { AppSidebar } from "./AppSidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/today",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "a@b.c", role: "PATIENT" }, logout: jest.fn() }),
}));
jest.mock("@/hooks/useMyProfile", () => ({ useMyProfile: () => ({ data: undefined }) }));
jest.mock("@/hooks/useMood", () => ({ useMoodToday: () => ({ data: undefined }) }));
jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => null,
}));

describe("AppSidebar", () => {
  it("has no Messages item and no standalone Emergency button", () => {
    render(<AppSidebar />);
    expect(screen.queryByRole("link", { name: /messages/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /emergency/i })).toBeNull();
    expect(document.querySelector('a[href="tel:112"]')).toBeNull();
  });

  it("keeps the crisis-line call button", () => {
    render(<AppSidebar />);
    expect(screen.getByRole("link", { name: /\+250 783 974 066/ })).toHaveAttribute(
      "href",
      "tel:+250783974066"
    );
  });
});
