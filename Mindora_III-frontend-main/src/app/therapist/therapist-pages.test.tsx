import { fireEvent, render, screen } from "@testing-library/react";
import TherapistSchedulePage from "@/app/therapist/page";
import TherapistDashboardPage from "@/app/therapist/dashboard/page";
import TherapistPatientsPage from "@/app/therapist/patients/page";
import {
  useAvailability,
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useTherapistDashboard,
  useTherapistPatients,
  useTherapistSchedule,
} from "@/hooks/useAppointments";
import { useMyProfile } from "@/hooks/useMyProfile";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { userId: "therapist-test-id", email: "therapist@example.test", role: "THERAPIST" },
  }),
}));

jest.mock("@/hooks/useMyProfile", () => ({
  useMyProfile: jest.fn(),
}));

jest.mock("@/hooks/useAppointments", () => ({
  useAvailability: jest.fn(),
  useCancelAppointment: jest.fn(),
  useCompleteAppointment: jest.fn(),
  useConfirmAppointment: jest.fn(),
  useTherapistDashboard: jest.fn(),
  useTherapistPatients: jest.fn(),
  useTherapistSchedule: jest.fn(),
}));

jest.mock("@/components/therapist/MoodReportDialog", () => ({
  MoodReportDialog: () => null,
}));

const schedule = useTherapistSchedule as jest.Mock;
const dashboard = useTherapistDashboard as jest.Mock;
const availability = useAvailability as jest.Mock;
const patients = useTherapistPatients as jest.Mock;

const idle = { data: undefined, isLoading: false, isError: false };
const upcomingSlotStart = new Date(Date.now() + 36 * 60 * 60 * 1000);

const appointment = {
  id: "a1",
  patientId: "11111111-aaaa-bbbb-cccc-222222222222",
  therapistId: "t1",
  slotStart: upcomingSlotStart.toISOString(),
  slotEnd: new Date(upcomingSlotStart.getTime() + 50 * 60 * 1000).toISOString(),
  sessionType: "VIDEO",
  status: "PENDING",
  cancellationReason: null,
  rating: null,
  createdAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-20T09:00:00.000Z",
};

const dashboardData = {
  todaysSessions: [{ ...appointment, status: "CONFIRMED" }],
  pendingCount: 2,
  upcomingCount: 5,
  patientCount: 3,
};

const patientList = {
  patients: [
    { patientId: "p1", userName: "Amina Uwase", totalSessions: 4, lastSessionAt: null },
    { patientId: "22222222-x", userName: null, totalSessions: 1, lastSessionAt: null },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

beforeEach(() => {
  jest.clearAllMocks();
  schedule.mockReturnValue({
    ...idle,
    data: { appointments: [appointment], total: 1 },
    refetch: jest.fn(),
  });
  dashboard.mockReturnValue({ ...idle, data: dashboardData, refetch: jest.fn() });
  availability.mockReturnValue({ ...idle, data: { slots: [] }, refetch: jest.fn() });
  patients.mockReturnValue({ ...idle, data: patientList });
  (useMyProfile as jest.Mock).mockReturnValue({
    data: { profile: { userName: "Amina" } },
  });
  (useCancelAppointment as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    isPending: false,
  });
  (useConfirmAppointment as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
  (useCompleteAppointment as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
});

describe("TherapistSchedulePage", () => {
  it("lists upcoming appointment references, session type, status and actions", () => {
    render(<TherapistSchedulePage />);
    fireEvent.click(screen.getByRole("button", { name: "upcoming" }));
    expect(screen.getAllByText("Patient 11111111").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video session").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("shows loading skeletons without presenting an empty schedule", () => {
    schedule.mockReturnValue({ ...idle, isLoading: true, refetch: jest.fn() });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("My appointments")).toBeInTheDocument();
    expect(screen.queryByText("No appointments in this view")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no appointments", () => {
    schedule.mockReturnValue({
      ...idle,
      data: { appointments: [], total: 0 },
      refetch: jest.fn(),
    });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("No appointments in this view")).toBeInTheDocument();
  });

  it("does not show a false empty state when loading fails", () => {
    schedule.mockReturnValue({ ...idle, isError: true, refetch: jest.fn() });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("Your schedule could not be loaded.")).toBeInTheDocument();
    expect(screen.getByText(/Appointment records are unavailable/)).toBeInTheDocument();
    expect(screen.queryByText("No appointments in this view")).not.toBeInTheDocument();
  });
});

describe("TherapistDashboardPage", () => {
  it("shows practice stats and today's patient appointment reference", () => {
    render(<TherapistDashboardPage />);
    expect(screen.getByText(/Amina/)).toBeInTheDocument();
    expect(screen.getAllByText("Patient 11111111").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video session").length).toBeGreaterThan(0);
  });

  it("shows loading skeletons without presenting an empty day", () => {
    dashboard.mockReturnValue({ ...idle, isLoading: true, refetch: jest.fn() });
    render(<TherapistDashboardPage />);
    expect(screen.getByText("Today's schedule")).toBeInTheDocument();
    expect(screen.queryByText("No sessions today")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no sessions today", () => {
    dashboard.mockReturnValue({
      ...idle,
      data: { ...dashboardData, todaysSessions: [] },
      refetch: jest.fn(),
    });
    render(<TherapistDashboardPage />);
    expect(screen.getByText("No sessions today")).toBeInTheDocument();
  });

  it("shows unavailable states instead of false zeroes when data loading fails", () => {
    dashboard.mockReturnValue({ ...idle, isError: true, refetch: jest.fn() });
    schedule.mockReturnValue({ ...idle, isError: true, refetch: jest.fn() });
    availability.mockReturnValue({ ...idle, isError: true, refetch: jest.fn() });
    render(<TherapistDashboardPage />);
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getByText(/Today's sessions could not be loaded/)).toBeInTheDocument();
    expect(screen.getByText(/Appointment requests could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByText("No sessions today")).not.toBeInTheDocument();
    expect(screen.queryByText("No pending requests in this page")).not.toBeInTheDocument();
  });
});

describe("TherapistPatientsPage", () => {
  it("lists patients and uses a short ID when a name is unavailable", () => {
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Amina Uwase")).toBeInTheDocument();
    expect(screen.getByText("Patient 22222222")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    patients.mockReturnValue({ ...idle, isLoading: true });
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Loading patients…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no patients", () => {
    patients.mockReturnValue({
      ...idle,
      data: { ...patientList, patients: [], total: 0 },
    });
    render(<TherapistPatientsPage />);
    expect(screen.getByText(/have any patients yet/)).toBeInTheDocument();
  });

  it("shows only the error, not the empty state, when loading fails", () => {
    patients.mockReturnValue({ ...idle, isError: true });
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Could not load your patients.")).toBeInTheDocument();
    expect(screen.queryByText(/have any patients yet/)).not.toBeInTheDocument();
  });
});
