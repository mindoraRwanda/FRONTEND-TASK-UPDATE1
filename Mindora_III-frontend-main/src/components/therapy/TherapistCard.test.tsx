import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import type { TherapistProfile } from "@/types/domain";

jest.mock("@/hooks/useDominantColor", () => ({
  useDominantColor: () => null,
  isLightColor: () => false,
}));

const therapist: TherapistProfile = {
  id: "tp-1",
  userId: "user-1",
  userName: "Dr Uwase Diane",
  bio: null,
  timezone: "Africa/Kigali",
  languagePreference: "en",
  specialisation: "Anxiety",
  languages: ["English"],
  isAcceptingPatients: true,
  photoUrl: null,
};

const FLIPPED = /(^| )\[transform:rotateY\(180deg\)\]/;

// jsdom has no hover or CSS, so these cover the state-driven flip that touch and
// keyboard users rely on: the class that rotates the card, and the controls.
function flipper() {
  return screen.getByRole("button", { name: /show details/i }).parentElement!.parentElement!;
}

describe("TherapistCard flip without hover", () => {
  it("flips on tap of the front face and flips back from the back face", async () => {
    const user = userEvent.setup();
    render(<TherapistCard therapist={therapist} index={0} onBook={jest.fn()} />);
    expect(flipper().className).not.toMatch(FLIPPED);

    await user.click(screen.getByRole("button", { name: "Show details for Dr Uwase Diane" }));
    expect(flipper().className).toMatch(FLIPPED);

    await user.click(screen.getByRole("button", { name: "Back to photo" }));
    expect(flipper().className).not.toMatch(FLIPPED);
  });

  it("keeps Get started a real, tall-enough button that calls onBook", async () => {
    const user = userEvent.setup();
    const onBook = jest.fn();
    render(<TherapistCard therapist={therapist} index={0} onBook={onBook} />);
    const button = screen.getByRole("button", { name: /get started/i });
    expect(button.className).toContain("min-h-11");
    await user.click(button);
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  it("does not offer Get started when the therapist is not accepting patients", () => {
    render(
      <TherapistCard
        therapist={{ ...therapist, isAcceptingPatients: false }}
        index={0}
        onBook={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /not accepting patients/i })).toBeDisabled();
  });
});

describe("TherapistCard photo", () => {
  it("shows the photo, then falls back to the initials avatar when the image fails to load", () => {
    render(
      <TherapistCard
        therapist={{ ...therapist, photoUrl: "http://localhost:8000/api/v1/users/photos/m1.jpg" }}
        index={0}
        onBook={jest.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "Dr Uwase Diane" });
    expect(screen.queryByText("UD")).not.toBeInTheDocument();

    fireEvent.error(img);

    expect(screen.queryByRole("img", { name: "Dr Uwase Diane" })).not.toBeInTheDocument();
    expect(screen.getByText("UD")).toBeInTheDocument();
  });
});

describe("TherapistCard headshot", () => {
  it("renders the photo with alt text, top-aligned so faces are not cropped", () => {
    render(
      <TherapistCard
        therapist={{ ...therapist, photoUrl: "http://localhost:8000/api/v1/users/photos/abc.jpg" }}
        index={0}
        onBook={jest.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "Dr Uwase Diane" });
    expect(img).toHaveAttribute("src", "http://localhost:8000/api/v1/users/photos/abc.jpg");
    expect(img.className).toContain("object-cover");
    expect(img.className).toContain("object-top");
  });
});

describe("TherapistCard CV summary", () => {
  const summary = "Clinical psychologist with a focus on youth mental health. ".repeat(10).trim();

  it("shows the summary, clamped to 4 lines, with a Read more link to the full profile", () => {
    render(
      <TherapistCard
        therapist={{ ...therapist, cvSummary: summary }}
        index={0}
        onBook={jest.fn()}
      />
    );
    const block = screen.getByTestId("therapist-cv");
    const text = block.querySelector("p")!;
    expect(text).toHaveTextContent(summary);
    expect(text.className).toContain("line-clamp-4");

    const link = screen.getByRole("link", { name: "Read more about Dr Uwase Diane" });
    expect(link).toHaveAttribute("href", "/therapists/user-1");
    expect(link.className).toContain("min-h-11");
  });

  it("shows no CV section when the summary is missing, null or blank", () => {
    const { rerender } = render(
      <TherapistCard therapist={therapist} index={0} onBook={jest.fn()} />
    );
    expect(screen.queryByTestId("therapist-cv")).not.toBeInTheDocument();

    rerender(
      <TherapistCard therapist={{ ...therapist, cvSummary: null }} index={0} onBook={jest.fn()} />
    );
    expect(screen.queryByTestId("therapist-cv")).not.toBeInTheDocument();

    rerender(
      <TherapistCard therapist={{ ...therapist, cvSummary: "   " }} index={0} onBook={jest.fn()} />
    );
    expect(screen.queryByTestId("therapist-cv")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /read more/i })).not.toBeInTheDocument();
  });
});
