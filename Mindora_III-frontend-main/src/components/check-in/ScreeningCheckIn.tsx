"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { submitScreening, type ScreeningInstrumentId, type ScreeningResult } from "@/lib/mood-api";
import { TESTS, type TestDefinition } from "@/lib/mock-data/tests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const INSTRUMENT_IDS: ScreeningInstrumentId[] = [
  "gad7",
  "dass21-depression",
  "dass21-anxiety",
  "dass21-stress",
  "asrs",
  "cybocs",
];

function isScreeningInstrumentId(id: string): id is ScreeningInstrumentId {
  return INSTRUMENT_IDS.includes(id as ScreeningInstrumentId);
}

function screeningErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Could not save your screening. Please try again.";
  }

  if (error.status === 400) {
    return (
      error.fieldErrors?.answers?.[0] ?? error.message ?? "Please check your answers and try again."
    );
  }
  if (error.status === 401) return "Your session expired. Please sign in again.";
  if (error.status === 403) return "Only patient accounts can submit a screening.";
  if (error.status === 429) return "Too many screening requests. Please wait and try again.";
  if (error.status === 503) return "Screening is temporarily unavailable. Please try again later.";
  if (error.status === 0) return "Could not reach the server. Check your connection and try again.";
  return "Could not save your screening. Please try again.";
}

function ScreeningResultView({ result }: { result: ScreeningResult }) {
  return (
    <div
      aria-live="polite"
      className="mt-6 rounded-2xl border border-mindora-purple/20 bg-white p-6"
    >
      <p className="text-sm font-semibold text-mindora-purple">Screening saved</p>
      <h3 className="mt-2 text-xl font-bold text-foreground">{result.label}</h3>
      <p className="mt-2 text-3xl font-bold text-foreground">
        Score: {result.displayScore} / {result.maxScore}
      </p>
      <Badge className="mt-3">{result.severity}</Badge>
      {result.extras?.map((item) => (
        <p key={item.label} className="mt-2 text-sm text-muted-foreground">
          {item.label}: {item.value}
        </p>
      ))}
      <p className="mt-4 leading-relaxed text-muted-foreground">{result.interpretation}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        This is a self-report screening result, not a diagnosis.
      </p>
    </div>
  );
}

export function ScreeningCheckIn() {
  const [instrumentId, setInstrumentId] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionInFlight = useRef(false);

  const test: TestDefinition | undefined = TESTS.find((item) => item.id === instrumentId);
  const total = test?.items.length ?? 0;
  const selectedAnswer = answers[questionIndex];
  const isLastQuestion = questionIndex === total - 1;

  function resetForInstrument(nextInstrumentId: string) {
    setInstrumentId(nextInstrumentId);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setError("");
  }

  function chooseAnswer(value: number) {
    setAnswers((current) => ({ ...current, [questionIndex]: value }));
    setError("");
  }

  async function submit() {
    if (submissionInFlight.current || !test || !isScreeningInstrumentId(test.id)) return;

    const isComplete = Array.from({ length: total }, (_, index) => index).every((index) =>
      Number.isInteger(answers[index])
    );
    if (!isComplete) {
      setError("Please answer every question before saving your screening.");
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const savedResult = await submitScreening({
        instrumentId: test.id,
        answers,
      });
      setResult(savedResult);
    } catch (submitError) {
      setError(screeningErrorMessage(submitError));
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  function goNext() {
    if (selectedAnswer === undefined) {
      setError("Please select an answer to continue.");
      return;
    }
    setError("");
    if (isLastQuestion) {
      void submit();
    } else {
      setQuestionIndex((current) => current + 1);
    }
  }

  return (
    <section className="rounded-[34px] bg-white p-7 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff] lg:p-9">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Screening check-in</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a screening to reflect on your wellbeing. Your answers are saved securely with your
          patient record.
        </p>
      </div>

      <label htmlFor="screening-instrument" className="mt-6 block text-sm font-semibold">
        Choose a screening
      </label>
      <select
        id="screening-instrument"
        value={instrumentId}
        onChange={(event) => resetForInstrument(event.target.value)}
        disabled={isSubmitting}
        className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
      >
        <option value="">Select an instrument</option>
        {TESTS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      {test && !result ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">
            Question {questionIndex + 1} of {total}
          </p>
          <Progress value={((questionIndex + 1) / total) * 100} className="mt-2" />
          <p className="mt-6 text-sm text-muted-foreground">{test.instructions}</p>
          <h3 className="mt-3 text-lg font-semibold leading-relaxed text-foreground">
            {test.items[questionIndex]}
          </h3>
          <div className="mt-4 space-y-2">
            {test.answers.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={selectedAnswer === option.value}
                onClick={() => chooseAnswer(option.value)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  selectedAnswer === option.value
                    ? "border-mindora-purple bg-mindora-purple text-white"
                    : "border-border bg-white text-foreground hover:border-mindora-purple/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={questionIndex === 0 || isSubmitting}
              onClick={() => {
                setError("");
                setQuestionIndex((current) => Math.max(0, current - 1));
              }}
            >
              Back
            </Button>
            <Button type="button" onClick={goNext} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isLastQuestion ? "Save screening" : "Next"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {result ? <ScreeningResultView result={result} /> : null}
    </section>
  );
}
