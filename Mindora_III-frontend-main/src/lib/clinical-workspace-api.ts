import { apiFetch } from "@/lib/api";

export type PrescriptionDraftStatus = "DRAFT" | "ARCHIVED";
export type MedicationUpdateStatus = "PENDING" | "REVIEWED" | "FOLLOW_UP_REQUIRED";
export type MedicationUpdateType = "STARTED" | "STOPPED" | "CHANGED" | "SIDE_EFFECT" | "QUESTION";

export interface PrescriptionDraft {
  id: string;
  therapistId: string;
  patientId: string;
  medicationName: string;
  strength: string;
  frequency: string;
  instructions: string;
  status: PrescriptionDraftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationUpdate {
  id: string;
  therapistId: string;
  patientId: string;
  medicationName: string;
  updateType: MedicationUpdateType;
  note: string;
  reviewNote?: string;
  status: MedicationUpdateStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionDraftListResponse {
  prescriptionDrafts: PrescriptionDraft[];
}

interface PrescriptionDraftResponse {
  prescriptionDraft: PrescriptionDraft;
}

interface MedicationReviewListResponse {
  medicationReviews: MedicationUpdate[];
}

interface MedicationUpdateResponse {
  medicationUpdate: MedicationUpdate;
}

export interface CreatePrescriptionDraftInput {
  patientId: string;
  medicationName: string;
  strength: string;
  frequency: string;
  instructions: string;
}

export interface UpdatePrescriptionDraftInput {
  medicationName?: string;
  strength?: string;
  frequency?: string;
  instructions?: string;
}

export interface ReviewMedicationUpdateInput {
  status: Exclude<MedicationUpdateStatus, "PENDING">;
  reviewNote: string;
}

export interface SubmitMedicationUpdateInput {
  therapistId: string;
  medicationName: string;
  updateType: MedicationUpdateType;
  note: string;
}

export function fetchPrescriptionDrafts(
  status?: PrescriptionDraftStatus
): Promise<PrescriptionDraftListResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch(`/api/v1/users/prescription-drafts${query}`);
}

export function createPrescriptionDraft(
  input: CreatePrescriptionDraftInput
): Promise<PrescriptionDraftResponse> {
  return apiFetch("/api/v1/users/prescription-drafts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePrescriptionDraft(
  id: string,
  input: UpdatePrescriptionDraftInput
): Promise<PrescriptionDraftResponse> {
  return apiFetch(`/api/v1/users/prescription-drafts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archivePrescriptionDraft(id: string): Promise<PrescriptionDraftResponse> {
  return apiFetch(`/api/v1/users/prescription-drafts/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
}

export function fetchMedicationReviews(
  status?: MedicationUpdateStatus
): Promise<MedicationReviewListResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch(`/api/v1/users/medication-reviews${query}`);
}

export function reviewMedicationUpdate(
  id: string,
  input: ReviewMedicationUpdateInput
): Promise<MedicationUpdateResponse> {
  return apiFetch(`/api/v1/users/medication-reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function submitMedicationUpdate(
  input: SubmitMedicationUpdateInput
): Promise<MedicationUpdateResponse> {
  return apiFetch("/api/v1/users/medication-updates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMyMedicationUpdates(): Promise<{
  medicationUpdates: MedicationUpdate[];
}> {
  return apiFetch("/api/v1/users/medication-updates/mine");
}
