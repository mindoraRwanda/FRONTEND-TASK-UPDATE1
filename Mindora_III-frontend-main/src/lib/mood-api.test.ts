import { apiFetch } from "@/lib/api";
import { submitScreening } from "@/lib/mood-api";

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

describe("submitScreening", () => {
  beforeEach(() => mockApiFetch.mockReset());

  it("posts only instrumentId and answers to the authenticated screening endpoint", async () => {
    const answers = { 0: 1, 1: 0, 2: 2, 3: 1, 4: 0, 5: 1, 6: 0 };
    const result = {
      id: "result-id",
      patientId: "patient-id",
      instrumentId: "gad7",
      scoringVersion: "public-screenings-v1",
      rawScore: 5,
      displayScore: "5",
      maxScore: "21",
      severity: "Mild",
      label: "Mild Anxiety",
      interpretation: "Backend calculated interpretation",
      completedAt: "2026-11-15T12:00:00.000Z",
      createdAt: "2026-11-15T12:00:00.000Z",
    };
    mockApiFetch.mockResolvedValue(result);

    await expect(submitScreening({ instrumentId: "gad7", answers })).resolves.toEqual(result);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/mood/screenings", {
      method: "POST",
      body: JSON.stringify({ instrumentId: "gad7", answers }),
    });
    const sentBody = JSON.parse(mockApiFetch.mock.calls[0][1]?.body as string);
    expect(sentBody).not.toHaveProperty("patientId");
    expect(sentBody).not.toHaveProperty("score");
  });
});
