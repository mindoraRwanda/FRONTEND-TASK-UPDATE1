"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useAdminAppointments,
  useAdminNotificationLogs,
  usePlatformAnalytics,
} from "@/hooks/useAdmin";
import type { AppointmentStatus } from "@/types/domain";

function Stat({ title, value }: { title: string; value: number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-[#ebe8f1] bg-white p-5">
      <p className="text-[11px] text-[#77758a]">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#28243a]">
        {value == null ? "Unavailable" : value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AdminPrototypeSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section;
  const analytics = usePlatformAnalytics();
  const [notificationStatus, setNotificationStatus] = useState("ALL");
  const [notificationChannel, setNotificationChannel] = useState("ALL");
  const [notificationPage, setNotificationPage] = useState(1);
  const notifications = useAdminNotificationLogs({
    page: notificationPage,
    limit: 20,
    ...(notificationStatus === "ALL" ? {} : { status: notificationStatus }),
    ...(notificationChannel === "ALL" ? {} : { channel: notificationChannel }),
  });
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [appointmentPage, setAppointmentPage] = useState(1);
  const appointmentQuery = useAdminAppointments({
    page: appointmentPage,
    limit: 20,
    ...(appointmentStatus === "ALL" ? {} : { status: appointmentStatus }),
  });

  if (section === "appointments") {
    const rows = appointmentQuery.data?.appointments ?? [];
    const totalPages = Math.max(1, Math.ceil((appointmentQuery.data?.total ?? 0) / 20));
    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">All appointments</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Live booking records from the Appointment Service. This register is read-only.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#625d70]">
            Status
            <select
              value={appointmentStatus}
              onChange={(event) => {
                setAppointmentStatus(event.target.value as AppointmentStatus | "ALL");
                setAppointmentPage(1);
              }}
              className="rounded-xl border border-[#e4deeb] bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat title="All-time bookings" value={analytics.data?.totalAppointments} />
          <Stat title="Completed bookings" value={analytics.data?.completedAppointments} />
          <Stat title="Records in this view" value={appointmentQuery.data?.total} />
        </div>

        {appointmentQuery.isError && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <span>Could not load the appointment register. Check the connection and retry.</span>
            <button
              type="button"
              onClick={() => appointmentQuery.refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#ebe8f1] bg-white">
          {appointmentQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 animate-pulse rounded-lg bg-[#f5f3f8]" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#77758a]">
              No appointments match this status filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-[#faf9fc] text-[10px] uppercase tracking-wide text-[#8a789d]">
                  <tr>
                    <th className="px-5 py-4">Booking</th>
                    <th className="px-5 py-4">Patient reference</th>
                    <th className="px-5 py-4">Therapist reference</th>
                    <th className="px-5 py-4">Session</th>
                    <th className="px-5 py-4">Date & time</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-[#f0edf3] text-[#625d70]">
                      <td className="px-5 py-4 font-semibold text-[#28243a]">
                        {item.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4">{item.patientId.slice(0, 8)}</td>
                      <td className="px-5 py-4">{item.therapistId.slice(0, 8)}</td>
                      <td className="px-5 py-4">{item.sessionType.replace("_", " ")}</td>
                      <td className="px-5 py-4">{new Date(item.slotStart).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#f1ecf7] px-2.5 py-1 text-[10px] font-bold text-[#7350a0]">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#f0edf3] px-5 py-3 text-xs text-[#77758a]">
            <span>
              {appointmentQuery.data?.total ?? 0} total bookings · Page {appointmentPage} of{" "}
              {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={appointmentPage <= 1 || appointmentQuery.isFetching}
                onClick={() => setAppointmentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-[#e4deeb] px-3 py-2 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={appointmentPage >= totalPages || appointmentQuery.isFetching}
                onClick={() => setAppointmentPage((page) => page + 1)}
                className="rounded-lg border border-[#e4deeb] px-3 py-2 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
        <p className="mt-4 rounded-xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
          Patient and therapist identifiers are shortened in this register. Detailed clinical notes,
          treatment content and private profile documents are intentionally excluded.
        </p>
      </main>
    );
  }

  if (section === "notifications") {
    const logs = notifications.data?.logs ?? [];
    const totalPages = Math.max(1, Math.ceil((notifications.data?.total ?? 0) / 20));
    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold text-[#28243a]">Notification delivery</h1>
            <p className="mt-1 text-sm text-[#77758a]">
              Actual email, SMS, push and voice delivery attempts recorded by MINDORA.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-semibold text-[#625d70]">
              Channel
              <select
                value={notificationChannel}
                onChange={(event) => {
                  setNotificationChannel(event.target.value);
                  setNotificationPage(1);
                }}
                className="ml-2 rounded-xl border border-[#e4deeb] bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">All channels</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="voice">Voice</option>
                <option value="push">Push</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-[#625d70]">
              Status
              <select
                value={notificationStatus}
                onChange={(event) => {
                  setNotificationStatus(event.target.value);
                  setNotificationPage(1);
                }}
                className="ml-2 rounded-xl border border-[#e4deeb] bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="delivered">Delivered</option>
                <option value="accepted">Accepted</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </label>
          </div>
        </div>

        {notifications.isError && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <span>
              Delivery logs could not be loaded. Check admin access and the Notification Service.
            </span>
            <button
              type="button"
              onClick={() => notifications.refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#ebe8f1] bg-white">
          {notifications.isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 animate-pulse rounded-lg bg-[#f5f3f8]" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#77758a]">
              No delivery attempts match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="bg-[#faf9fc] text-[10px] uppercase tracking-wide text-[#8a789d]">
                  <tr>
                    <th className="px-4 py-4">Created (Kigali)</th>
                    <th className="px-4 py-4">Event</th>
                    <th className="px-4 py-4">Channel</th>
                    <th className="px-4 py-4">Recipient ref.</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Attempts</th>
                    <th className="px-4 py-4">Delivered (Kigali)</th>
                    <th className="px-4 py-4">Failure</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-[#f0edf3] text-[#625d70]">
                      <td className="whitespace-nowrap px-4 py-4">
                        {new Date(log.createdAtKigali).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#28243a]">{log.eventType}</td>
                      <td className="px-4 py-4 uppercase">{log.channel}</td>
                      <td className="px-4 py-4">{log.userId.slice(0, 8)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            log.status === "delivered"
                              ? "bg-[#e8f5ef] text-[#39765e]"
                              : log.status === "failed"
                                ? "bg-red-50 text-red-700"
                                : "bg-[#fff5e5] text-[#8d641f]",
                          ].join(" ")}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">{log.attempts}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {log.deliveredAtKigali
                          ? new Date(log.deliveredAtKigali).toLocaleString()
                          : "—"}
                      </td>
                      <td className="max-w-[220px] px-4 py-4 text-[#9a5c43]">
                        {log.failureReason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#f0edf3] px-5 py-3 text-xs text-[#77758a]">
            <span>
              {notifications.data?.total ?? 0} delivery records · Page {notificationPage} of{" "}
              {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={notificationPage <= 1 || notifications.isFetching}
                onClick={() => setNotificationPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-[#e4deeb] px-3 py-2 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={notificationPage >= totalPages || notifications.isFetching}
                onClick={() => setNotificationPage((page) => page + 1)}
                className="rounded-lg border border-[#e4deeb] px-3 py-2 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
        <p className="mt-4 rounded-xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
          A provider status of accepted or processing is not the same as confirmed recipient
          delivery. Voice delivery records depend on Africa&apos;s Talking voice support being
          enabled and configured.
        </p>
      </main>
    );
  }

  if (section === "release-readiness") {
    const checks = [
      "Preserve existing authentication and role guards",
      "Keep patient and therapist data connected to the V3 APIs",
      "Run frontend lint, tests and production build",
      "Verify email and crisis escalation delivery with approved credentials",
      "Test patient, therapist and admin workflows in staging",
      "Confirm production deployment and domain health",
    ];

    return (
      <main className="min-h-full bg-[#f7f6fa] px-5 py-8 sm:px-7 lg:px-10">
        <h1 className="text-[27px] font-extrabold text-[#28243a]">Release readiness</h1>
        <p className="mt-1 text-sm text-[#77758a]">
          Checklist for a safe product release. This page does not claim a live Railway deployment
          state.
        </p>
        <div className="mt-6 space-y-3">
          {checks.map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-[#ebe8f1] bg-white p-4 text-sm text-[#625d70]"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f1ecf7] text-xs font-bold text-[#7350a0]">
                {index + 1}
              </span>
              {item}
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#795b2b]">
          Treatment plans, medication, prescriptions, community service and video meetings still
          require corresponding backend/provider workflows before they can be treated as production
          features.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#f7f6fa] p-8">
      <h1 className="text-2xl font-bold text-[#28243a]">Page not found</h1>
    </main>
  );
}
