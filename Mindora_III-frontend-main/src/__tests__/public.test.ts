import { scoreTest, getTestById, TESTS } from "@/lib/mock-data/tests";
import { THERAPISTS } from "@/lib/mock-data/therapists";

describe("Public mock data", () => {
  it("lists real therapists only, with no placeholder stats", () => {
    expect(THERAPISTS.map((therapist) => therapist.name)).toEqual(["Nsengiyumva Athanase"]);
    for (const therapist of THERAPISTS) {
      expect(therapist.rating).toBeUndefined();
      expect(therapist.reviews).toBeUndefined();
      expect(therapist.nearest).toBeUndefined();
    }
  });

  it("scores GAD-7 moderate at 14", () => {
    const test = getTestById("gad7");
    expect(test).toBeDefined();
    const answers = { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 };
    const result = scoreTest(test!, answers);
    expect(result.rawScore).toBe(14);
    expect(result.severity).toBe("Moderate");
  });

  it("counts ASRS primary indicators at Often or above", () => {
    const test = getTestById("asrs");
    const answers = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 1, 5: 1 };
    const result = scoreTest(test!, answers);
    expect(result.rawScore).toBe(4);
    expect(result.extras?.[0].value).toContain("4 out of 6");
  });

  it.each([
    ["gad7", 7, "Minimal", "Minimal Anxiety"],
    ["dass21-depression", 7, "Normal", "Normal Depression"],
    ["dass21-anxiety", 7, "Normal", "Normal Anxiety"],
    ["dass21-stress", 7, "Normal", "Normal Stress"],
    ["asrs", 18, "Not consistent", "Symptoms not highly consistent with ADHD"],
    ["cybocs", 10, "Subclinical", "Subclinical OCD symptoms"],
  ])(
    "keeps public instrument %s definitions and scoring available",
    (id, count, severity, label) => {
      const test = getTestById(id as string);
      expect(test).toBeDefined();
      expect(test?.items).toHaveLength(count as number);
      const result = scoreTest(
        test!,
        Object.fromEntries(test!.items.map((_, index) => [index, 0]))
      );
      expect(result.severity).toBe(severity);
      expect(result.label).toBe(label);
    }
  );

  it("keeps every public instrument mapped to a supported backend screening ID", () => {
    expect(TESTS.map((test) => test.id).sort()).toEqual(
      ["gad7", "dass21-depression", "dass21-anxiety", "dass21-stress", "asrs", "cybocs"].sort()
    );
  });
});
