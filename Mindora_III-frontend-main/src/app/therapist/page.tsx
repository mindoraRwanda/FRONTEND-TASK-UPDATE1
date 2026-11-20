"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarX, CheckCircle2, Download, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useTherapistSchedule,
} from "@/hooks/useAppointments";
import type { AppointmentStatus, BookedAppointment } from "@/types/domain";

type TimeFilter = "today" | "week" | "upcoming";
type StatusFilter = "ALL" | AppointmentStatus;

const STATUS_VARIANT = {
  PENDING: "pending",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
} as const;

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

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

function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return kigaliDateKey(date);
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSession(type: BookedAppointment["sessionType"]): string {
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

function exportAppointments(appointments: BookedAppointment[]) {
  const header = ["Booking ID", "Patient reference", "Date/time (UTC)", "Session type", "Status"];
  const rows = appointments.map((item) => [
    item.id,
    patientReference(item.patientId),
    item.slotStart,
    formatSession(item.sessionType),
    item.status,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mindora-therapist-appointments.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export default function TherapistSchedulePage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [declineTarget, setDeclineTarget] = useState<BookedAppointment | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const schedule = useTherapistSchedule();
  const confirmAppointment = useConfirmAppointment();
  const completeAppointment = useCompleteAppointment();
  const cancelAppointment = useCancelAppointment();

  const appointments = useMemo(() => {
    const now = new Date();
    const today = kigaliDateKey(now);
    const weekEnd = dateAfterDays(7);
    return [...(schedule.data?.appointments ?? [])]
      .filter((appointment) => {
        const key = kigaliDateKey(new Date(appointment.slotStart));
        if (timeFilter === "today" && key !== today) return false;
        if (timeFilter === "week" && (key < today || key > weekEnd)) return false;
        if (timeFilter === "upcoming" && key < today) return false;
        if (statusFilter !== "ALL" && appointment.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime());
  }, [schedule.data, timeFilter, statusFilter]);

  const counts = useMemo(() => {
    const all = schedule.data?.appointments ?? [];
    return {
      total: schedule.data?.total ?? 0,
      pending: all.filter((item) => item.status === "PENDING").length,
      confirmed: all.filter((item) => item.status === "CONFIRMED").length,
      completed: all.filter((item) => item.status === "COMPLETED").length,
    };
  }, [schedule.data]);

  async function handleDecline() {
    if (!declineTarget || !declineReason.trim()) return;
    try {
      await cancelAppointment.mutateAsync({
        id: declineTarget.id,
        reason: declineReason.trim(),
      });
      setDeclineTarget(null);
      setDeclineReason("");
    } catch {
      // The mutation error is rendered in the dialog below.
    }
  }

  return (
    <main className="min-h-full bg-[#f7f6fa] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a789d]">
            Practice
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#28243a]">
            Your schedule
          </h1>
          <p className="mt-1.5 text-[13px] text-[#77758a]">
            Review appointment requests and manage your sessions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportAppointments(appointments)}
          disabled={appointments.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export current view
        </Button>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-[#ebe8f1] bg-white p-4">
          <p className="text-[11px] text-[#77758a]">Appointments in loaded records</p>
          <p className="mt-2 text-2xl font-extrabold text-[#28243a]">
            {schedule.isLoading ? "—" : counts.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#ebe8f1] bg-white p-4">
          <p className="text-[11px] text-[#77758a]">Pending requests in this page</p>
          <p className="mt-2 text-2xl font-extrabold text-[#b77b21]">
            {schedule.isLoading ? "—" : counts.pending.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#ebe8f1] bg-white p-4">
          <p className="text-[11px] text-[#77758a]">Confirmed / completed in this page</p>
          <p className="mt-2 text-2xl font-extrabold text-[#2f8a68]">
            {schedule.isLoading ? "—" : (counts.confirmed + counts.completed).toLocaleString()}
          </p>
        </div>
      </section>

      {schedule.isError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[#f2d5d8] bg-[#fff0f1] p-4 text-[12px] text-[#9c4651]"
        >
          Your schedule could not be loaded.
          <button
            type="button"
            onClick={() => void schedule.refetch()}
            className="ml-3 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-[18px] border border-[#ebe8f1] bg-white shadow-[0_12px_34px_rgba(45,32,65,.055)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe8f1] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#28243a]">My appointments</h2>
            <p className="mt-1 text-[11px] text-[#77758a]">
              Choose a date range and booking status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["today", "week", "upcoming"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={
                  timeFilter === filter
                    ? "rounded-full border border-[#ded2eb] bg-[#f1ecf7] px-3 py-2 text-[11px] font-bold capitalize text-[#7350a0]"
                    : "rounded-full border border-[#ebe8f1] bg-white px-3 py-2 text-[11px] font-semibold capitalize text-[#77758a]"
                }
              >
                {filter === "week" ? "This week" : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#f0edf3] px-5 py-3">
          {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? "rounded-full bg-[#38294d] px-3 py-1.5 text-[10px] font-bold text-white"
                  : "rounded-full bg-[#f7f6fa] px-3 py-1.5 text-[10px] font-bold text-[#77758a] hover:bg-[#f1ecf7]"
              }
            >
              {status === "ALL" ? "All statuses" : STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        {schedule.isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-[#f7f6fa]" />
            ))}
          </div>
        ) : schedule.isError ? (
          <div role="alert" className="p-5 text-center text-[12px] text-[#9c4651]">
            Appointment records are unavailable. Use Retry above to load them again.
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <CalendarX className="h-8 w-8 text-[#b1a3c2]" />
            <p className="mt-3 text-[13px] font-extrabold text-[#28243a]">
              No appointments in this view
            </p>
            <p className="mt-1 max-w-[320px] text-[11px] leading-5 text-[#77758a]">
              Bookings from your MINDORA patients will appear here when they match the selected
              filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead className="bg-[#faf9fc] text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9691a0]">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient reference</th>
                  <th className="px-5 py-3">Session</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-t border-[#f0edf3] text-[11px] text-[#625d70]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#28243a]">
                      {formatWhen(appointment.slotStart)}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#28243a]">
                      {patientReference(appointment.patientId)}
                    </td>
                    <td className="px-5 py-4">{formatSession(appointment.sessionType)}</td>
                    <td className="px-5 py-4">
                      <AppointmentStatusBadge status={appointment.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {appointment.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 bg-[#7350a0] px-3 text-[10px]"
                              disabled={confirmAppointment.isPending}
                              onClick={() => confirmAppointment.mutate(appointment.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-[#f0d7d9] px-3 text-[10px] text-[#b84d58] hover:bg-[#fff0f1]"
                              onClick={() => {
                                setDeclineTarget(appointment);
                                setDeclineReason("");
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Decline
                            </Button>
                          </>
                        )}
                        {appointment.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 px-3 text-[10px]"
                            disabled={completeAppointment.isPending}
                            onClick={() => completeAppointment.mutate(appointment.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark complete
                          </Button>
                        )}
                        {appointment.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2f8a68]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0edf3] px-5 py-3 text-[10px] text-[#8c8798]">
          <span>
            Showing {appointments.length} filtered record(s) from {schedule.data?.total ?? 0} total
            appointment record(s).
          </span>
          <Link href="/therapist/dashboard" className="font-bold text-[#7350a0] hover:underline">
            Back to dashboard
          </Link>
        </div>
      </section>

      <Dialog
        open={!!declineTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineTarget(null);
            setDeclineReason("");
            cancelAppointment.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>Decline appointment request</DialogTitle>
            <p className="text-[12px] text-muted-foreground">
              {declineTarget
                ? `${patientReference(declineTarget.patientId)} · ${formatWhen(declineTarget.slotStart)}`
                : ""}
            </p>
          </DialogHeader>
          <div>
            <label
              htmlFor="decline-reason"
              className="mb-2 block text-[12px] font-bold text-[#625d70]"
            >
              Reason for declining
            </label>
            <Textarea
              id="decline-reason"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="Explain why you cannot accept this appointment."
              className="min-h-[100px]"
            />
            <p className="mt-1 text-right text-[10px] text-[#9691a0]">{declineReason.length}/500</p>
            {cancelAppointment.isError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-[#fff0f1] p-3 text-[11px] text-[#9c4651]"
              >
                {cancelAppointment.error.message}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeclineTarget(null)}>
                Keep request
              </Button>
              <Button
                type="button"
                disabled={!declineReason.trim() || cancelAppointment.isPending}
                onClick={() => void handleDecline()}
                className="bg-[#b84d58] text-white hover:bg-[#9d3d47]"
              >
                {cancelAppointment.isPending ? "Declining…" : "Decline request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
