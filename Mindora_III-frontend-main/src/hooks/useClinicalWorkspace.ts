import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  archivePrescriptionDraft,
  createPrescriptionDraft,
  fetchMedicationReviews,
  fetchPrescriptionDrafts,
  reviewMedicationUpdate,
  submitMedicationUpdate,
  updatePrescriptionDraft,
  type CreatePrescriptionDraftInput,
  type PrescriptionDraftStatus,
  type ReviewMedicationUpdateInput,
  type UpdatePrescriptionDraftInput,
  type MedicationUpdateStatus,
  type SubmitMedicationUpdateInput,
} from "@/lib/clinical-workspace-api";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function usePrescriptionDrafts(enabled = true, status?: PrescriptionDraftStatus) {
  return useQuery({
    queryKey: ["clinical-workspace", "prescription-drafts", status],
    queryFn: () => fetchPrescriptionDrafts(status),
    enabled,
  });
}

export function useCreatePrescriptionDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePrescriptionDraftInput) => createPrescriptionDraft(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-workspace", "prescription-drafts"] });
      toast.success("Encrypted prescription draft saved.");
    },
    onError: (error) => toast.error(errorText(error, "Could not save the prescription draft.")),
  });
}

export function useUpdatePrescriptionDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePrescriptionDraftInput }) =>
      updatePrescriptionDraft(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-workspace", "prescription-drafts"] });
      toast.success("Prescription draft updated.");
    },
    onError: (error) => toast.error(errorText(error, "Could not update the prescription draft.")),
  });
}

export function useArchivePrescriptionDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archivePrescriptionDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-workspace", "prescription-drafts"] });
      toast.success("Prescription draft archived.");
    },
    onError: (error) => toast.error(errorText(error, "Could not archive the prescription draft.")),
  });
}

export function useMedicationReviews(enabled = true, status?: MedicationUpdateStatus) {
  return useQuery({
    queryKey: ["clinical-workspace", "medication-reviews", status],
    queryFn: () => fetchMedicationReviews(status),
    enabled,
  });
}

export function useReviewMedicationUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewMedicationUpdateInput }) =>
      reviewMedicationUpdate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-workspace", "medication-reviews"] });
      toast.success("Medication update review recorded.");
    },
    onError: (error) => toast.error(errorText(error, "Could not record the medication review.")),
  });
}

export function useSubmitMedicationUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitMedicationUpdateInput) => submitMedicationUpdate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-workspace", "my-medication-updates"] });
      toast.success("Your medication update was sent to your therapist.");
    },
    onError: (error) => toast.error(errorText(error, "Could not send your medication update.")),
  });
}
