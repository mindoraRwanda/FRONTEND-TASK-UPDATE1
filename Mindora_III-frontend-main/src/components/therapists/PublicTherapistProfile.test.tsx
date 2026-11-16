import { render, screen } from "@testing-library/react";
import { PublicTherapistProfile } from "@/components/therapists/PublicTherapistProfile";
import type { Therapist } from "@/lib/mock-data/therapists";

const mockUse = jest.fn();
jest.mock("@/hooks/usePublicTherapists", () => ({ usePublicTherapists: () => mockUse() }));
jest.mock("@/components/public/BookNowButton", () => ({ BookNowButton: () => null }));

const base: Therapist = {
  id: "t1",
  name: "Dr Fictional",
  title: "Clinical Psychologist",
  specialisations: ["Anxiety"],
  clientsChoice: false,
  availableToday: false,
  availableThisWeek: false,
  online: true,
};

function withTherapist(t: Therapist) {
  mockUse.mockReturnValue({
    data: { source: "live", therapists: [t] },
    isLoading: false,
    isError: false,
    isAuthenticated: true,
  });
}

describe("PublicTherapistProfile CV summary", () => {
  it("shows the full summary, preserving line breaks, under its own heading", () => {
    withTherapist({ ...base, cvSummary: "Line one.\n\nLine two." });
    render(<PublicTherapistProfile id="t1" />);
    expect(screen.getByRole("heading", { name: "Professional summary" })).toBeInTheDocument();
    const text = screen.getByText(/Line one\./);
    expect(text.textContent).toBe("Line one.\n\nLine two.");
    expect(text.className).toContain("whitespace-pre-line");
  });

  it("omits the section when there is no summary", () => {
    withTherapist(base);
    render(<PublicTherapistProfile id="t1" />);
    expect(screen.queryByRole("heading", { name: "Professional summary" })).not.toBeInTheDocument();
  });
});
