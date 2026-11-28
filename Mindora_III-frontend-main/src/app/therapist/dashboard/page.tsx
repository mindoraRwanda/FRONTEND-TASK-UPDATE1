"use client";

import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import {
  useAvailability,
  useTherapistDashboard,
  useTherapistSchedule,
} from "@/hooks/useAppointments";
import type { BookedAppointment } from "@/types/domain";

const STATUS_VARIANT = {
  PENDING: "pending",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
} as const;

const QUICK_ACTIONS = [
  {
    href: "/therapist",
    title: "Review appointments",
    description: "Confirm or decline patient requests.",
    icon: CalendarDays,
  },
  {
    href: "/therapist/availability",
    title: "Manage availability",
    description: "Set your weekly hours and time off.",
    icon: Clock3,
  },
  {
    href: "/therapist/treatment-plans",
    title: "Treatment plans",
    description: "Create and review agreed care goals.",
    icon: ClipboardList,
  },
  {
    href: "/therapist/patients",
    title: "Your patients",
    description: "Open summaries for established patient relationships.",
    icon: Users,
  },
];

function kigaliDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Kigali",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Kigali",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSessionType(type: BookedAppointment["sessionType"]): string {
  switch (String(type)) {
    case "VIDEO":
      return "Video session";
    case "AUDIO":
      return "Audio session";
    case "IN_PERSON":
      return "In-person session";
    case "CHAT":
      return "Chat session";
    default:
      return "Session";
  }
}

function patientReference(patientId: string): string {
  return `Patient ${patientId.slice(0, 8)}`;
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | null;
  note: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <article className="rounded-[18px] border border-[#ebe8f1] bg-white p-5 shadow-[0_12px_34px_rgba(45,32,65,.055)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-[#77758a]">{label}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1ecf7] text-[#7350a0]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#28243a]">
        {loading ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-[#f0edf4]" />
        ) : value === null ? (
          <span className="text-[15px] font-semibold text-[#9691a0]">Unavailable</span>
        ) : (
          value.toLocaleString()
        )}
      </p>
      <p className="mt-1 text-[11px] text-[#8c8798]">{note}</p>
    </article>
  );
}

function AppointmentRow({ appointment }: { appointment: BookedAppointment }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#f0edf3] py-3.5 last:border-0">
      <div className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-[#f1ecf7] text-center text-[11px] font-extrabold leading-tight text-[#7350a0]">
        {formatTime(appointment.slotStart)}
        <span className="text-[9px] font-medium text-[#8a789d]">
          {formatDate(appointment.slotStart).split(",")[0]}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-[#28243a]">
          {patientReference(appointment.patientId)}
        </p>
        <p className="mt-1 text-[11px] text-[#77758a]">
          {formatSessionType(appointment.sessionType)}
        </p>
      </div>
      <Badge variant={STATUS_VARIANT[appointment.status]}>
        {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
      </Badge>
    </div>
  );
}

export default function TherapistDashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const dashboard = useTherapistDashboard();
  const schedule = useTherapistSchedule();
  const availability = useAvailability(user?.userId ?? null);

  const sessions = [...(dashboard.data?.todaysSessions ?? [])].sort(
    (a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );
  const pendingRequests = (schedule.data?.appointments ?? [])
    .filter((appointment) => appointment.status === "PENDING")
    .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime())
    .slice(0, 4);

  const recentAppointments = schedule.data?.appointments ?? [];
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = kigaliDateKey(day);
    const completed = recentAppointments.filter(
      (item) => item.status === "COMPLETED" && kigaliDateKey(new Date(item.slotStart)) === key
    ).length;
    return {
      key,
      label: new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        weekday: "short",
      }).format(day),
      completed,
    };
  });
  const maxCompleted = Math.max(1, ...lastSevenDays.map((day) => day.completed));
  const displayName = profile?.profile?.userName ?? "Therapist";
  const pendingCount = dashboard.data?.pendingCount ?? null;
  const slotCount = availability.data?.slots.length ?? null;

  return (
    <main className="min-h-full bg-[#f7f6fa] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
            Therapist workspace
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#28243a]">
            {getGreeting()}, {displayName}
          </h1>
          <p className="mt-2 text-[13px] text-[#77758a]">
            Here is an overview of your MINDORA practice.
          </p>
        </div>
        <Link
          href="/therapist/availability"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7350a0] px-4 py-3 text-[12px] font-bold text-white shadow-[0_6px_14px_rgba(115,80,160,.18)] transition hover:-translate-y-0.5"
        >
          <Clock3 className="h-4 w-4" />
          Manage availability
        </Link>
      </header>

      {(dashboard.isError || schedule.isError || availability.isError) && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[#f2d5d8] bg-[#fff0f1] p-4 text-[12px] text-[#9c4651]"
        >
          Some practice information could not be loaded. Figures marked unavailable have not been
          replaced with sample values.
          <button
            type="button"
            onClick={() => {
              void dashboard.refetch();
              void schedule.refetch();
              void availability.refetch();
            }}
            className="ml-3 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's sessions"
          value={
            dashboard.isError
              ? null
              : (dashboard.data?.todaysSessions.length ?? (dashboard.isLoading ? null : 0))
          }
          note="Confirmed appointments today"
          icon={CalendarClock}
          loading={dashboard.isLoading}
        />
        <StatCard
          label="Active patients"
          value={dashboard.isError ? null : (dashboard.data?.patientCount ?? null)}
          note="Patients with an appointment relationship"
          icon={Users}
          loading={dashboard.isLoading}
        />
        <StatCard
          label="Pending requests"
          value={dashboard.isError ? null : pendingCount}
          note="Awaiting your response"
          icon={ClipboardList}
          loading={dashboard.isLoading}
        />
        <StatCard
          label="Available slots"
          value={availability.isError ? null : slotCount}
          note="Currently bookable slots in the API window"
          icon={Clock3}
          loading={availability.isLoading}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <article className="rounded-[18px] border border-[#ebe8f1] bg-white p-5 shadow-[0_12px_34px_rgba(45,32,65,.055)]">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#28243a]">Today&apos;s schedule</h2>
              <p className="mt-1 text-[11px] text-[#77758a]">
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: "Africa/Kigali",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date())}
              </p>
            </div>
            <Link
              href="/therapist"
              className="text-[11px] font-bold text-[#7350a0] hover:underline"
            >
              Full schedule
            </Link>
          </div>

          {dashboard.isLoading ? (
            <div className="space-y-3 py-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-xl bg-[#f7f6fa]" />
              ))}
            </div>
          ) : dashboard.isError ? (
            <p role="alert" className="py-8 text-center text-[12px] text-[#9c4651]">
              Today&apos;s sessions could not be loaded.
            </p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarX className="h-8 w-8 text-[#b1a3c2]" />
              <p className="mt-3 text-[13px] font-bold text-[#28243a]">No sessions today</p>
              <p className="mt-1 max-w-[270px] text-[11px] leading-5 text-[#77758a]">
                Confirmed appointments for today will appear here when they are booked.
              </p>
            </div>
          ) : (
            sessions.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))
          )}
        </article>

        <article className="rounded-[18px] border border-[#ebe8f1] bg-white p-5 shadow-[0_12px_34px_rgba(45,32,65,.055)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#28243a]">Practice snapshot</h2>
              <p className="mt-1 text-[11px] text-[#77758a]">
                Completed sessions in the latest schedule records
              </p>
            </div>
            <span className="rounded-full bg-[#f1ecf7] px-3 py-1.5 text-[10px] font-bold text-[#7350a0]">
              Last 7 days
            </span>
          </div>

          {schedule.isLoading ? (
            <div className="mt-6 h-40 animate-pulse rounded-xl bg-[#f7f6fa]" />
          ) : schedule.isError ? (
            <p role="alert" className="mt-6 text-center text-[12px] text-[#9c4651]">
              Practice activity is unavailable because the schedule could not be loaded.
            </p>
          ) : (
            <div className="mt-5 grid h-40 grid-cols-7 items-end gap-2">
              {lastSevenDays.map((day) => (
                <div
                  key={day.key}
                  className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[10px] font-bold text-[#625d70]">{day.completed}</span>
                  <div className="flex h-28 w-full items-end overflow-hidden rounded-t-lg bg-[#f5f2f8]">
                    <div
                      className="w-full rounded-t-lg bg-[#8061a8]"
                      style={{ height: `${Math.max(5, (day.completed / maxCompleted) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8a789d]">{day.label}</span>
                </div>
              ))}
            </div>
          )}
          {schedule.data && (
            <p className="mt-3 text-[10px] text-[#9691a0]">
              {schedule.data.total.toLocaleString()} schedule records available to this view.
            </p>
          )}
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded-[18px] border border-[#ebe8f1] bg-white p-5 shadow-[0_12px_34px_rgba(45,32,65,.055)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#28243a]">Requests to review</h2>
              <p className="mt-1 text-[11px] text-[#77758a]">
                Patient booking requests awaiting a decision
              </p>
            </div>
            {pendingCount !== null && (
              <Badge variant={pendingCount > 0 ? "pending" : "secondary"}>
                {pendingCount} pending
              </Badge>
            )}
          </div>
          {schedule.isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-xl bg-[#f7f6fa]" />
              ))}
            </div>
          ) : schedule.isError ? (
            <p
              role="alert"
              className="rounded-xl bg-[#fff0f1] px-4 py-6 text-center text-[12px] text-[#9c4651]"
            >
              Appointment requests could not be loaded.
            </p>
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-xl bg-[#f7f6fa] px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[#2f8a68]" />
              <p className="mt-2 text-[12px] font-bold text-[#28243a]">
                No pending requests in this page
              </p>
              <p className="mt-1 text-[10px] text-[#77758a]">
                Open your schedule to see the full appointment register.
              </p>
            </div>
          ) : (
            pendingRequests.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center gap-3 border-b border-[#f0edf3] py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-[#28243a]">
                    {patientReference(appointment.patientId)}
                  </p>
                  <p className="mt-1 text-[11px] text-[#77758a]">
                    {formatDate(appointment.slotStart)} · {formatTime(appointment.slotStart)} ·{" "}
                    {formatSessionType(appointment.sessionType)}
                  </p>
                </div>
                <Badge variant="pending">Pending</Badge>
              </div>
            ))
          )}
          <Link
            href="/therapist"
            className="mt-4 inline-flex text-[11px] font-bold text-[#7350a0] hover:underline"
          >
            Review appointment requests →
          </Link>
        </article>

        <article className="rounded-[18px] border border-[#ebe8f1] bg-white p-5 shadow-[0_12px_34px_rgba(45,32,65,.055)]">
          <div className="mb-3">
            <h2 className="text-[16px] font-extrabold text-[#28243a]">Quick actions</h2>
            <p className="mt-1 text-[11px] text-[#77758a]">
              Open the tools in your practice workspace
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-2xl border border-[#ebe8f1] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#cbbadd] hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1ecf7] text-[#7350a0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-3 block text-[12px] font-extrabold text-[#28243a]">
                    {action.title}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-[#77758a]">
                    {action.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
