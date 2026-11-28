import { apiFetch } from "@/lib/api";

export type CarePlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface CarePlanMilestone {
  title: string;
  dueDate?: string;
}

export interface CarePlan {
  id: string;
  therapistId: string;
  patientId: string;
  title: string;
  goals: string[];
  milestones: CarePlanMilestone[];
  reviewDate?: string;
  status: CarePlanStatus;
  patientAcknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CarePlanListResponse {
  carePlans: CarePlan[];
}

export function fetchTherapistCarePlans(): Promise<CarePlanListResponse> {
  return apiFetch("/api/v1/users/care-plans");
}

export function createCarePlan(input: {
  patientId: string;
  title: string;
  goals: string[];
  milestones: CarePlanMilestone[];
  reviewDate?: string;
}): Promise<{ carePlan: CarePlan }> {
  return apiFetch("/api/v1/users/care-plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCarePlan(
  id: string,
  input: Partial<Pick<CarePlan, "title" | "goals" | "milestones" | "reviewDate">>
): Promise<{ carePlan: CarePlan }> {
  return apiFetch(`/api/v1/users/care-plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchMyCarePlans(): Promise<CarePlanListResponse> {
  return apiFetch("/api/v1/users/care-plans/mine");
}

export function acknowledgeCarePlan(id: string): Promise<{ carePlan: CarePlan }> {
  return apiFetch(`/api/v1/users/care-plans/${encodeURIComponent(id)}/acknowledge`, {
    method: "POST",
  });
}
