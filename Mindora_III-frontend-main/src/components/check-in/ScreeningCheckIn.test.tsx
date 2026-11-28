import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { submitScreening } from "@/lib/mood-api";
import { ScreeningCheckIn } from "@/components/check-in/ScreeningCheckIn";

jest.mock("@/lib/mood-api", () => ({
  submitScreening: jest.fn(),
}));

const mockSubmitScreening = jest.mocked(submitScreening);

const savedResult = {
  id: "screening-result-id",
  patientId: "patient-id",
  instrumentId: "gad7" as const,
  scoringVersion: "public-screenings-v1",
  rawScore: 5,
  displayScore: "5",
  maxScore: "21",
  severity: "Mild" as const,
  label: "Mild Anxiety",
  interpretation: "Backend interpretation text",
  extras: [{ label: "Detail", value: "Backend detail" }],
  completedAt: "2026-11-15T12:00:00.000Z",
  createdAt: "2026-11-15T12:00:00.000Z",
};

async function completeGad7(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Choose a screening"), "gad7");
  for (let index = 0; index < 7; index += 1) {
    await user.click(screen.getByRole("button", { name: "Not at all" }));
    if (index < 6) await user.click(screen.getByRole("button", { name: "Next" }));
  }
}

describe("authenticated screening check-in", () => {
  beforeEach(() => mockSubmitScreening.mockReset());

  it("requires an answer before advancing or submitting", async () => {
    const user = userEvent.setup();
    render(<ScreeningCheckIn />);
    await user.selectOptions(screen.getByLabelText("Choose a screening"), "gad7");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please select an answer");
    expect(mockSubmitScreening).not.toHaveBeenCalled();
  });

  it("submits the selected instrument and answers, then renders the backend result", async () => {
    const user = userEvent.setup();
    mockSubmitScreening.mockResolvedValue(savedResult);
    render(<ScreeningCheckIn />);
    await completeGad7(user);
    await user.click(screen.getByRole("button", { name: "Save screening" }));

    await screen.findByText("Mild Anxiety");
    expect(mockSubmitScreening).toHaveBeenCalledWith({
      instrumentId: "gad7",
      answers: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    });
    expect(screen.getByText("Score: 5 / 21")).toBeInTheDocument();
    expect(screen.getByText("Mild")).toBeInTheDocument();
    expect(screen.getByText("Backend interpretation text")).toBeInTheDocument();
    expect(screen.getByText("Detail: Backend detail")).toBeInTheDocument();
  });

  it("guards against duplicate requests while the first submission is pending", async () => {
    const user = userEvent.setup();
    let resolveSubmission: ((value: typeof savedResult) => void) | undefined;
    mockSubmitScreening.mockImplementation(
      () => new Promise((resolve) => (resolveSubmission = resolve))
    );
    render(<ScreeningCheckIn />);
    await completeGad7(user);

    const saveButton = screen.getByRole("button", { name: "Save screening" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    expect(mockSubmitScreening).toHaveBeenCalledTimes(1);
    resolveSubmission?.(savedResult);
    await screen.findByText("Mild Anxiety");
  });

  it.each([
    [401, "Your session expired"],
    [403, "Only patient accounts"],
    [429, "Too many screening requests"],
    [503, "Screening is temporarily unavailable"],
    [0, "Could not reach the server"],
  ])("shows a useful message for HTTP status %i", async (status, message) => {
    const user = userEvent.setup();
    mockSubmitScreening.mockRejectedValue(new ApiError("Request failed", status));
    render(<ScreeningCheckIn />);
    await completeGad7(user);
    await user.click(screen.getByRole("button", { name: "Save screening" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message as string);
  });

  it("shows backend answer validation details for a 400 response", async () => {
    const user = userEvent.setup();
    mockSubmitScreening.mockRejectedValue(
      new ApiError("Validation failed", 400, { answers: ["Invalid answer range"] })
    );
    render(<ScreeningCheckIn />);
    await completeGad7(user);
    await user.click(screen.getByRole("button", { name: "Save screening" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid answer range");
  });

  it("offers the same six public screening definitions", () => {
    render(<ScreeningCheckIn />);
    const selector = screen.getByLabelText("Choose a screening");
    expect(selector).toHaveTextContent("Anxiety");
    expect(selector).toHaveTextContent("Physical anxiety");
    expect(selector).toHaveTextContent("Stress");
    expect(selector).toHaveTextContent("Depression");
    expect(selector).toHaveTextContent("Focus & attention");
    expect(selector).toHaveTextContent("OCD");
  });
});
