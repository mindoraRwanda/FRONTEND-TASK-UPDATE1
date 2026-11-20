"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Pill,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useTherapistDashboard,
  useTherapistPatients,
  useTherapistSchedule,
} from "@/hooks/useAppointments";
import { useCreateCarePlan, useTherapistCarePlans } from "@/hooks/useCarePlans";
import {
  useCommunityGroups,
  useCommunityMembership,
  useCommunityPosts,
  useCreateCommunityPost,
  useJoinCommunity,
} from "@/hooks/useCommunity";

type ModuleInfo = {
  title: string;
  subtitle: string;
  status: string;
  warning: string;
  icon: LucideIcon;
  points: string[];
};

const modules: Record<string, ModuleInfo> = {
  "treatment-plans": {
    title: "Treatment plans",
    subtitle: "Create structured care plans and review agreed patient goals.",
    status: "Encrypted care-plan drafts connected",
    warning:
      "This workspace stores agreed goals and review milestones only. It does not create diagnoses, medication instructions or prescriptions.",
    icon: ClipboardList,
    points: [
      "Agree goals collaboratively with the patient",
      "Define milestones and review dates",
      "Review progress after a clinical session",
    ],
  },
  medication: {
    title: "Medication overview",
    subtitle: "A protected workspace for authorised medication review.",
    status: "Clinical workflow not connected",
    warning:
      "No verified V3 medication endpoint is available. No sample medication records are shown and no medication instructions can be changed here.",
    icon: Pill,
    points: [
      "Medication review queue is unavailable",
      "Allergy and interaction checks must be part of an approved clinical workflow",
      "Only authorised clinicians may change patient medication records",
    ],
  },
  prescriptions: {
    title: "Prescriptions",
    subtitle: "A protected prescription workflow for authorised clinical staff.",
    status: "Prescription service not connected",
    warning:
      "The current V3 API does not expose a verified prescription workflow. No prescription is issued, signed, saved or sent to a pharmacy from this page.",
    icon: FileText,
    points: [
      "Verify clinician permissions and patient identity",
      "Require medicine and dosage safety checks",
      "Keep authorisation and audit history before issuing",
    ],
  },
  communities: {
    title: "Professional communities",
    subtitle: "Connect with peers around clinical practice and learning.",
    status: "Community Service unavailable",
    warning:
      "The supplied frontend API notes that Community Service is not deployed in V1. These are planned areas, not active groups; no membership or posts are created.",
    icon: Users,
    points: ["Clinical practice circle", "Wellbeing at work", "Trauma-informed care"],
  },
  "video-sessions": {
    title: "Video sessions",
    subtitle: "Review scheduled teletherapy sessions and session-readiness checks.",
    status: "Video provider not connected",
    warning:
      "The video room in the HTML prototype was a visual preview only. No camera, microphone, meeting link or recording is started here.",
    icon: Video,
    points: [
      "Connect an approved video provider",
      "Use authenticated, time-limited session links",
      "Do not record without informed consent and authorisation",
    ],
  },
};

function postText(content: Record<string, unknown>): string {
  const parts: string[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const node = value as { text?: unknown; content?: unknown };
    if (typeof node.text === "string") parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(visit);
  };
  visit(content);
  return parts.join(" ").trim() || "This post has no text content.";
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
      <p className="text-2xl font-extrabold text-[#28243a]">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-[#77758a]">{label}</p>
    </div>
  );
}

export default function TherapistWorkspaceModulePage() {
  const params = useParams<{ workspace: string }>();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communityDraft, setCommunityDraft] = useState("");
  const [communityDraftTitle, setCommunityDraftTitle] = useState("");
  const [anonymousPost, setAnonymousPost] = useState(false);
  const [carePlanPatientId, setCarePlanPatientId] = useState("");
  const [carePlanTitle, setCarePlanTitle] = useState("");
  const [carePlanGoals, setCarePlanGoals] = useState("");
  const [carePlanReviewDate, setCarePlanReviewDate] = useState("");
  const [prescriptionDrafts, setPrescriptionDrafts] = useState<
    Array<{ id: string; createdAt: string }>
  >([]);
  const [prescriptionNote, setPrescriptionNote] = useState("");
  const [showPrescriptionDraftForm, setShowPrescriptionDraftForm] = useState(false);
  const carePlanPatients = useTherapistPatients(1, 50);
  const carePlans = useTherapistCarePlans();
  const createCarePlan = useCreateCarePlan();
  const communityGroups = useCommunityGroups();
  const activeCommunityId = selectedCommunityId ?? communityGroups.data?.groups[0]?._id ?? null;
  const communityPosts = useCommunityPosts(activeCommunityId);
  const communityMembership = useCommunityMembership(activeCommunityId);
  const updateMembership = useJoinCommunity();
  const createPost = useCreateCommunityPost();
  const workspaceKey = params.workspace;
  const info = modules[workspaceKey];
  const { data, isLoading, isError } = useTherapistDashboard();
  const scheduleQuery = useTherapistSchedule();
  const [reportNow] = useState(() => Date.now());

  if (!info && workspaceKey !== "reports") {
    return (
      <main className="min-h-full bg-[#f7f6fa] p-8">
        <h1 className="text-2xl font-bold text-[#28243a]">Page not found</h1>
      </main>
    );
  }

  if (workspaceKey === "reports") {
    const appointments = scheduleQuery.data?.appointments ?? [];
    const completedCount = appointments.filter((item) => item.status === "COMPLETED").length;
    const cancelledCount = appointments.filter((item) => item.status === "CANCELLED").length;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(reportNow);
      date.setDate(date.getDate() - (6 - index));
      const dateKey = date.toISOString().slice(0, 10);
      const completed = appointments.filter(
        (item) =>
          item.status === "COMPLETED" &&
          new Date(item.slotStart).toISOString().slice(0, 10) === dateKey
      ).length;
      return {
        key: dateKey,
        label: date.toLocaleDateString("en", { weekday: "short" }),
        completed,
      };
    });
    const maxCompleted = Math.max(1, ...days.map((day) => day.completed));

    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
          Therapist workspace
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">Practice reports</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Live appointment activity from your own MINDORA schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void scheduleQuery.refetch();
            }}
            className="rounded-xl border border-[#ebe8f1] bg-white px-4 py-2 text-xs font-bold text-[#7350a0]"
          >
            Refresh report
          </button>
        </div>
        {(isError || scheduleQuery.isError) && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Could not load the complete live practice report. Retry before using these figures.
          </p>
        )}
        {isLoading || scheduleQuery.isLoading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Pending requests" value={data?.pendingCount ?? 0} />
            <Metric label="Upcoming sessions" value={data?.upcomingCount ?? 0} />
            <Metric label="Patients" value={data?.patientCount ?? 0} />
            <Metric label="Completed in loaded records" value={completedCount} />
          </div>
        )}

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#28243a]">
                  Completed sessions · last 7 days
                </h2>
                <p className="mt-1 text-xs text-[#77758a]">
                  Calculated from your loaded appointment records.
                </p>
              </div>
              <span className="rounded-full bg-[#f1ecf7] px-2.5 py-1 text-[10px] font-bold text-[#7350a0]">
                {scheduleQuery.data?.total ?? 0} total records
              </span>
            </div>
            <div className="mt-6 grid grid-cols-7 items-end gap-2">
              {days.map((day) => (
                <div key={day.key} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-[#625d70]">{day.completed}</span>
                  <div className="flex h-36 w-full items-end rounded-t-lg bg-[#f5f2f8]">
                    <div
                      className="w-full rounded-t-lg bg-[#8061a8]"
                      style={{ height: `${Math.max(6, (day.completed / maxCompleted) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8a789d]">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
            <h2 className="text-sm font-bold text-[#28243a]">Schedule summary</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77758a]">Completed records</span>
                <strong className="text-[#28243a]">{completedCount}</strong>
              </div>
              <div className="h-2 rounded-full bg-[#f1ecf7]">
                <div
                  className="h-2 rounded-full bg-[#5d9b7c]"
                  style={{
                    width: `${appointments.length ? (completedCount / appointments.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77758a]">Cancelled records</span>
                <strong className="text-[#28243a]">{cancelledCount}</strong>
              </div>
              <div className="h-2 rounded-full bg-[#f1ecf7]">
                <div
                  className="h-2 rounded-full bg-[#d39a63]"
                  style={{
                    width: `${appointments.length ? (cancelledCount / appointments.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[11px] leading-5 text-[#8a789d]">
                These percentages use the currently loaded schedule page, not a complete clinical
                outcome measure.
              </p>
            </div>
          </section>
        </div>
        <p className="mt-4 rounded-xl border border-[#ebe8f1] bg-white p-4 text-xs leading-5 text-[#77758a]">
          Reports only summarize scheduling activity. They do not score clinical outcomes or infer
          patient progress from appointment counts.
        </p>
      </main>
    );
  }

  if (workspaceKey === "medication") {
    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
          Clinical tools
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">Medication management</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Review medication-related tasks and patient follow-up workflows.
            </p>
          </div>
          <Link
            href="/therapist/prescriptions"
            className="rounded-xl bg-[#7350a0] px-4 py-2.5 text-xs font-bold text-white"
          >
            Open prescriptions
          </Link>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#f0dfbd] bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <strong className="block">Medication safety notice</strong>
            This workspace does not display real medication names, dosages or prescription records.
            Clinical decisions must be recorded only in MINDORA&apos;s authorised clinical system.
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#28243a]">Medication review queue</h2>
                <p className="mt-1 text-xs text-[#77758a]">
                  Assigned tasks from the authorised clinical record.
                </p>
              </div>
              <span className="rounded-full bg-[#f1ecf7] px-3 py-1.5 text-[10px] font-bold text-[#7350a0]">
                Live records only
              </span>
            </div>
            <div className="mt-5 rounded-xl bg-[#faf9fc] p-6 text-center">
              <Pill className="mx-auto h-6 w-6 text-[#9a86b3]" />
              <h3 className="mt-3 text-sm font-bold text-[#28243a]">
                No medication review tasks are connected
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#77758a]">
                There are no verified medication-review records available through the current
                MINDORA V3 API. No sample patients or medication details are shown.
              </p>
            </div>
            <Link
              href="/therapist/patients"
              className="mt-4 inline-flex rounded-xl border border-[#e4deeb] px-4 py-2.5 text-xs font-bold text-[#7350a0]"
            >
              View patient references
            </Link>
          </section>

          <section className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
            <h2 className="text-sm font-bold text-[#28243a]">Medication review workflow</h2>
            <p className="mt-1 text-xs text-[#77758a]">
              Use the authorised clinical record for all patient-specific decisions.
            </p>
            <ol className="mt-4 space-y-3">
              {[
                "Open the authorised patient record.",
                "Verify the patient's identity and current medication record.",
                "Document the medication review and clinical decision in the approved system.",
                "Use an approved prescription workflow only when appropriately authorised.",
                "Record the follow-up and patient communication.",
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-xs leading-5 text-[#625d70]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f1ecf7] text-[10px] font-bold text-[#7350a0]">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <Link
              href="/therapist/prescriptions"
              className="mt-5 inline-flex rounded-xl border border-[#e4deeb] px-4 py-2.5 text-xs font-bold text-[#7350a0]"
            >
              Review prescription workflow
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (workspaceKey === "prescriptions") {
    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
          Clinical tools
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">Prescriptions</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Prescription workflow preview — no real prescriptions are issued.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrescriptionDraftForm((open) => !open)}
            className="rounded-xl bg-[#7350a0] px-4 py-2.5 text-xs font-bold text-white"
          >
            {showPrescriptionDraftForm ? "Close draft form" : "New prescription draft"}
          </button>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#f0dfbd] bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <strong className="block">Clinical safety</strong>
            Drafts on this page are stored only in this browser session. They are not sent to a
            pharmacy, patient or clinical record and must not be used as medical instructions. Do
            not enter real patient or medication information.
          </div>
        </div>

        {showPrescriptionDraftForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!prescriptionNote.trim()) return;
              setPrescriptionDrafts((items) => [
                {
                  id: "RX-DRAFT-" + String(items.length + 1).padStart(3, "0"),
                  createdAt: new Date().toISOString(),
                },
                ...items,
              ]);
              setPrescriptionNote("");
              setShowPrescriptionDraftForm(false);
            }}
            className="mt-5 rounded-2xl border border-[#ebe8f1] bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#28243a]">Non-clinical workflow draft</h2>
                <p className="mt-1 text-xs text-[#77758a]">
                  For interface review only. Do not enter patient-specific details.
                </p>
              </div>
              <FileText className="h-5 w-5 text-[#7350a0]" />
            </div>
            <label
              htmlFor="prescription-preview-note"
              className="mt-4 block text-xs font-semibold text-[#625d70]"
            >
              Preview note
            </label>
            <textarea
              id="prescription-preview-note"
              rows={4}
              maxLength={1000}
              required
              value={prescriptionNote}
              onChange={(event) => setPrescriptionNote(event.target.value)}
              placeholder="Add a non-prescriptive workflow note only — no medicine, dosage or patient information."
              className="mt-2 w-full rounded-xl border border-[#e4deeb] p-3 text-sm text-[#28243a]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrescriptionDraftForm(false);
                  setPrescriptionNote("");
                }}
                className="rounded-xl border border-[#e4deeb] px-4 py-2.5 text-xs font-bold text-[#625d70]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!prescriptionNote.trim()}
                className="rounded-xl bg-[#7350a0] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Save local draft
              </button>
            </div>
          </form>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#ebe8f1] bg-white">
          <div className="border-b border-[#f0edf3] px-5 py-4">
            <h2 className="text-sm font-bold text-[#28243a]">Recent prescription activity</h2>
            <p className="mt-1 text-xs text-[#77758a]">
              Local preview drafts only · {prescriptionDrafts.length} drafts in this session
            </p>
          </div>
          {prescriptionDrafts.length === 0 ? (
            <p className="p-8 text-center text-xs text-[#77758a]">
              No prescription drafts created in this preview.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-[#faf9fc] text-[10px] uppercase tracking-wide text-[#8a789d]">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionDrafts.map((draft) => (
                    <tr key={draft.id} className="border-t border-[#f0edf3] text-[#625d70]">
                      <td className="px-5 py-4 font-semibold text-[#28243a]">{draft.id}</td>
                      <td className="px-5 py-4">{new Date(draft.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#fff5e5] px-2.5 py-1 text-[10px] font-bold text-[#8d641f]">
                          Draft
                        </span>
                      </td>
                      <td className="px-5 py-4">Preview only — not a valid prescription</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (workspaceKey === "treatment-plans") {
    const patients = carePlanPatients.data?.patients ?? [];
    const plans = carePlans.data?.carePlans ?? [];
    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
          Therapist workspace
        </p>
        <h1 className="mt-2 text-[27px] font-extrabold text-[#28243a]">Treatment plans</h1>
        <p className="mt-1 text-sm text-[#77758a]">
          Create encrypted goal-setting drafts for patients with an established appointment
          relationship.
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#d9eadf] bg-[#f1faf4] p-4 text-xs leading-5 text-[#39765e]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Goals and milestones are encrypted at rest. Patients can see a plan after it is shared
          with their account and acknowledge it before it becomes active.
        </div>

        {carePlans.isError && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Care plans could not be loaded. The secure encryption key may need to be configured on
            the backend.
            <button type="button" onClick={() => carePlans.refetch()} className="ml-3 underline">
              Retry
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const goals = carePlanGoals
                .split(/\r?\n/)
                .map((goal) => goal.trim())
                .filter(Boolean)
                .slice(0, 20);
              if (!carePlanPatientId || !carePlanTitle.trim() || goals.length === 0) return;
              createCarePlan.mutate(
                {
                  patientId: carePlanPatientId,
                  title: carePlanTitle.trim(),
                  goals,
                  milestones: [],
                  ...(carePlanReviewDate
                    ? { reviewDate: new Date(carePlanReviewDate + "T00:00:00+02:00").toISOString() }
                    : {}),
                },
                {
                  onSuccess: () => {
                    setCarePlanTitle("");
                    setCarePlanGoals("");
                    setCarePlanReviewDate("");
                  },
                }
              );
            }}
            className="rounded-2xl border border-[#ebe8f1] bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#28243a]">New care-plan draft</h2>
                <p className="mt-1 text-xs text-[#77758a]">
                  Agree goals with the patient during care.
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-[#7350a0]" />
            </div>

            {carePlanPatients.isError ? (
              <p role="alert" className="mt-4 text-xs text-red-700">
                Patient list could not be loaded. Retry the Patients page.
              </p>
            ) : patients.length === 0 && !carePlanPatients.isLoading ? (
              <p className="mt-4 rounded-xl bg-[#fff8eb] p-3 text-xs leading-5 text-[#795b2b]">
                No patient relationship is available yet. A care plan can only be created for
                someone who has an appointment history with you.
              </p>
            ) : (
              <>
                <label
                  htmlFor="care-plan-patient"
                  className="mt-4 block text-xs font-semibold text-[#625d70]"
                >
                  Patient
                </label>
                <select
                  id="care-plan-patient"
                  required
                  value={carePlanPatientId}
                  onChange={(event) => setCarePlanPatientId(event.target.value)}
                  disabled={carePlanPatients.isLoading}
                  className="mt-2 w-full rounded-xl border border-[#e4deeb] bg-white px-3 py-2.5 text-sm text-[#28243a]"
                >
                  <option value="">Select a patient…</option>
                  {patients.map((patient) => (
                    <option key={patient.patientId} value={patient.patientId}>
                      {patient.userName || "Patient"} · {patient.patientId.slice(0, 8)}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="care-plan-title"
                  className="mt-4 block text-xs font-semibold text-[#625d70]"
                >
                  Plan title
                </label>
                <input
                  id="care-plan-title"
                  required
                  maxLength={120}
                  value={carePlanTitle}
                  onChange={(event) => setCarePlanTitle(event.target.value)}
                  placeholder="e.g. Building a steady sleep routine"
                  className="mt-2 w-full rounded-xl border border-[#e4deeb] px-3 py-2.5 text-sm text-[#28243a]"
                />

                <label
                  htmlFor="care-plan-goals"
                  className="mt-4 block text-xs font-semibold text-[#625d70]"
                >
                  Agreed goals · one per line
                </label>
                <textarea
                  id="care-plan-goals"
                  required
                  rows={5}
                  value={carePlanGoals}
                  onChange={(event) => setCarePlanGoals(event.target.value)}
                  placeholder={
                    "Establish a regular evening routine\nPractise a short daily reflection"
                  }
                  className="mt-2 w-full rounded-xl border border-[#e4deeb] px-3 py-3 text-sm leading-5 text-[#28243a]"
                />

                <label
                  htmlFor="care-plan-review"
                  className="mt-4 block text-xs font-semibold text-[#625d70]"
                >
                  Review date (optional)
                </label>
                <input
                  id="care-plan-review"
                  type="date"
                  value={carePlanReviewDate}
                  onChange={(event) => setCarePlanReviewDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e4deeb] px-3 py-2.5 text-sm text-[#28243a]"
                />

                <button
                  type="submit"
                  disabled={
                    !carePlanPatientId ||
                    !carePlanTitle.trim() ||
                    !carePlanGoals.trim() ||
                    createCarePlan.isPending
                  }
                  className="mt-5 w-full rounded-xl bg-[#7350a0] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
                >
                  {createCarePlan.isPending ? "Saving encrypted draft…" : "Save care-plan draft"}
                </button>
              </>
            )}
          </form>

          <section className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#28243a]">Your saved plans</h2>
                <p className="mt-1 text-xs text-[#77758a]">
                  Only records from your own patient relationships.
                </p>
              </div>
              <span className="rounded-full bg-[#f1ecf7] px-3 py-1.5 text-[10px] font-bold text-[#7350a0]">
                {plans.length} plans
              </span>
            </div>
            {carePlans.isLoading ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 animate-pulse rounded-xl bg-[#f5f3f8]" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="mt-5 rounded-xl bg-[#faf9fc] p-6 text-center text-xs text-[#77758a]">
                No care plans have been saved yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {plans.map((plan) => {
                  const patient = patients.find((item) => item.patientId === plan.patientId);
                  return (
                    <article key={plan.id} className="rounded-xl border border-[#f0edf3] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#28243a]">{plan.title}</h3>
                          <p className="mt-1 text-[11px] text-[#77758a]">
                            {patient?.userName ?? "Patient"} · {plan.patientId.slice(0, 8)}
                          </p>
                        </div>
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            plan.status === "ACTIVE"
                              ? "bg-[#e8f5ef] text-[#39765e]"
                              : "bg-[#fff5e5] text-[#8d641f]",
                          ].join(" ")}
                        >
                          {plan.status === "DRAFT"
                            ? "Awaiting patient acknowledgement"
                            : plan.status}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {plan.goals.map((goal, index) => (
                          <li key={index} className="flex gap-2 text-xs leading-5 text-[#625d70]">
                            <span className="text-[#9072b2]">•</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[10px] text-[#9993a2]">
                        {plan.reviewDate
                          ? "Review " + new Date(plan.reviewDate).toLocaleDateString()
                          : "No review date set"}{" "}
                        · Updated {new Date(plan.updatedAt).toLocaleDateString()}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (workspaceKey === "communities") {
    const groups = communityGroups.data?.groups ?? [];
    const activeGroup = groups.find((group) => group._id === activeCommunityId) ?? null;
    const joined = communityMembership.data?.joined ?? false;

    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
          Therapist workspace
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">Professional communities</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Real MINDORA groups and discussions from the Community Service.
            </p>
          </div>
          <span className="rounded-full bg-[#e8f5ef] px-3 py-2 text-[10px] font-bold text-[#39765e]">
            Connected to Community Service
          </span>
        </div>

        {communityGroups.isError && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <span>Community groups could not be loaded.</span>
            <button
              type="button"
              onClick={() => communityGroups.refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {communityGroups.isLoading ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-[#ebe8f1] bg-white p-8 text-center">
            <h2 className="text-sm font-bold text-[#28243a]">
              No communities have been created yet
            </h2>
            <p className="mt-2 text-xs text-[#77758a]">
              An administrator must create a group before it appears here.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <button
                  type="button"
                  key={group._id}
                  onClick={() => setSelectedCommunityId(group._id)}
                  className={[
                    "rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                    activeCommunityId === group._id
                      ? "border-[#9072b2] ring-2 ring-[#9072b2]/15"
                      : "border-[#ebe8f1]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#f1ecf7] px-2.5 py-1 text-[10px] font-bold text-[#7350a0]">
                      {group.category}
                    </span>
                    <span className="text-[10px] text-[#8a789d]">
                      {group.memberCount.toLocaleString()} members
                    </span>
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-[#28243a]">{group.name}</h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#77758a]">
                    {group.description}
                  </p>
                </button>
              ))}
            </section>

            {activeGroup && (
              <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-4">
                  <div className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a789d]">
                          {activeGroup.category}
                        </p>
                        <h2 className="mt-1 text-lg font-extrabold text-[#28243a]">
                          {activeGroup.name}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[#77758a]">
                          {activeGroup.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={
                          communityMembership.isLoading ||
                          updateMembership.isPending ||
                          communityMembership.isError
                        }
                        onClick={() =>
                          updateMembership.mutate({ groupId: activeGroup._id, join: !joined })
                        }
                        className="rounded-xl bg-[#7350a0] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {updateMembership.isPending
                          ? "Saving…"
                          : joined
                            ? "Leave group"
                            : "Join group"}
                      </button>
                    </div>
                    {communityMembership.isError && (
                      <p role="alert" className="mt-3 text-xs text-red-700">
                        Membership status could not be checked. Refresh this group and try again.
                      </p>
                    )}
                  </div>

                  {joined && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!communityDraftTitle.trim() || !communityDraft.trim()) return;
                        createPost.mutate(
                          {
                            groupId: activeGroup._id,
                            title: communityDraftTitle,
                            message: communityDraft,
                            isAnonymous: anonymousPost,
                          },
                          { onSuccess: () => setCommunityDraft("") }
                        );
                      }}
                      className="rounded-2xl border border-[#ebe8f1] bg-white p-5"
                    >
                      <label htmlFor="community-post" className="text-sm font-bold text-[#28243a]">
                        Share with this community
                      </label>
                      <label
                        htmlFor="community-post-title"
                        className="mt-3 block text-xs font-semibold text-[#625d70]"
                      >
                        Post title
                      </label>
                      <input
                        id="community-post-title"
                        maxLength={160}
                        value={communityDraftTitle}
                        onChange={(event) => setCommunityDraftTitle(event.target.value)}
                        placeholder="Start a discussion"
                        className="mt-2 w-full rounded-xl border border-[#e4deeb] bg-[#fcfbfd] p-3 text-sm text-[#28243a] outline-none focus:border-[#9072b2]"
                      />
                      <textarea
                        id="community-post"
                        value={communityDraft}
                        onChange={(event) => setCommunityDraft(event.target.value)}
                        rows={4}
                        maxLength={10000}
                        placeholder="Write a supportive, professional message…"
                        className="mt-3 w-full rounded-xl border border-[#e4deeb] bg-[#fcfbfd] p-3 text-sm text-[#28243a] outline-none focus:border-[#9072b2]"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-[#625d70]">
                          <input
                            type="checkbox"
                            checked={anonymousPost}
                            onChange={(event) => setAnonymousPost(event.target.checked)}
                          />
                          Post anonymously
                        </label>
                        <button
                          type="submit"
                          disabled={
                            !communityDraftTitle.trim() ||
                            !communityDraft.trim() ||
                            createPost.isPending
                          }
                          className="rounded-xl bg-[#7350a0] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {createPost.isPending ? "Publishing…" : "Publish post"}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-[#ebe8f1] bg-white">
                    <div className="border-b border-[#f0edf3] px-5 py-4">
                      <h3 className="text-sm font-bold text-[#28243a]">Community discussion</h3>
                      <p className="mt-1 text-xs text-[#77758a]">
                        Posts are loaded from the live group feed.
                      </p>
                    </div>
                    {communityPosts.isLoading ? (
                      <div className="space-y-3 p-5">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="h-20 animate-pulse rounded-xl bg-[#f5f3f8]" />
                        ))}
                      </div>
                    ) : communityPosts.isError ? (
                      <div className="p-6 text-sm text-red-700">
                        <p>Posts could not be loaded.</p>
                        <button
                          type="button"
                          onClick={() => communityPosts.refetch()}
                          className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (communityPosts.data?.posts.length ?? 0) === 0 ? (
                      <p className="p-7 text-center text-xs text-[#77758a]">
                        No posts in this group yet. Be the first to share a supportive message.
                      </p>
                    ) : (
                      communityPosts.data?.posts.map((post) => (
                        <article
                          key={post._id}
                          className="border-b border-[#f0edf3] p-5 last:border-0"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <strong className="text-xs text-[#28243a]">
                              {post.isAnonymous ? "Community member" : (post.userName ?? "Member")}
                            </strong>
                            <time className="text-[10px] text-[#9993a2]">
                              {new Date(post.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#625d70]">
                            {postText(post.content)}
                          </p>
                          <p className="mt-3 text-[10px] text-[#8a789d]">
                            {(post.reactions ?? []).reduce(
                              (sum, reaction) => sum + reaction.count,
                              0
                            )}{" "}
                            reactions · {post.commentCount} comments
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border border-[#ebe8f1] bg-white p-5">
                  <h3 className="text-sm font-bold text-[#28243a]">Community guidelines</h3>
                  <ul className="mt-3 space-y-3 text-xs leading-5 text-[#77758a]">
                    <li>Protect patient and colleague confidentiality.</li>
                    <li>Do not share identifiable case details or private clinical records.</li>
                    <li>Keep discussions respectful, supportive and professional.</li>
                    <li>Report unsafe or inappropriate posts for moderator review.</li>
                  </ul>
                  <div className="mt-4 rounded-xl bg-[#fff8eb] p-3 text-[11px] leading-5 text-[#795b2b]">
                    Communities support peer discussion; they are not an emergency service or a
                    substitute for clinical supervision.
                  </div>
                </aside>
              </section>
            )}
          </>
        )}
      </main>
    );
  }

  if (!info) {
    return (
      <main className="min-h-full bg-[#f7f6fa] p-8">
        <h1 className="text-2xl font-bold text-[#28243a]">Page not found</h1>
      </main>
    );
  }

  const Icon = info.icon;

  return (
    <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
        Therapist workspace
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[27px] font-extrabold text-[#28243a]">{info.title}</h1>
          <p className="mt-1 text-sm text-[#77758a]">{info.subtitle}</p>
        </div>
        <span className="rounded-full bg-[#fff5e5] px-3 py-2 text-[10px] font-extrabold text-[#8d641f]">
          {info.status}
        </span>
      </div>
      <div className="mt-5 flex gap-3 rounded-2xl border border-[#f0dfbd] bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {info.warning}
      </div>
      <section className="mt-5 rounded-2xl border border-[#ebe8f1] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1ecf7] text-[#7350a0]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#28243a]">Prototype workflow</h2>
            <p className="text-xs text-[#77758a]">
              The section is included without creating fictional clinical records.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-3 border-t border-[#f0edf3] pt-4">
          {info.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-xs leading-5 text-[#625d70]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9b82b8]" />
              {point}
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-5 flex gap-2 rounded-xl bg-[#e8f5ef] p-4 text-xs leading-5 text-[#39765e]">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Patient data and clinical actions remain protected by the existing V3 role and API
        permissions.
      </div>
    </main>
  );
}
