import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  acknowledgeCarePlan,
  createCarePlan,
  fetchMyCarePlans,
  fetchTherapistCarePlans,
  updateCarePlan,
  type CarePlanMilestone,
} from "@/lib/care-plans-api";

export function useTherapistCarePlans() {
  return useQuery({
    queryKey: ["care-plans", "therapist"],
    queryFn: fetchTherapistCarePlans,
  });
}

export function useCreateCarePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      patientId: string;
      title: string;
      goals: string[];
      milestones: CarePlanMilestone[];
      reviewDate?: string;
    }) => createCarePlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-plans"] });
      toast.success("Care plan draft saved securely.");
    },
    onError: () => toast.error("Could not save this care plan. Please retry."),
  });
}

export function useUpdateCarePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        title?: string;
        goals?: string[];
        milestones?: CarePlanMilestone[];
        reviewDate?: string;
      };
    }) => updateCarePlan(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-plans"] });
      toast.success("Care plan updated. Patient acknowledgement is required again.");
    },
    onError: () => toast.error("Could not update this care plan. Please retry."),
  });
}

export function useMyCarePlans() {
  return useQuery({
    queryKey: ["care-plans", "mine"],
    queryFn: fetchMyCarePlans,
  });
}

export function useAcknowledgeCarePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acknowledgeCarePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-plans"] });
      toast.success("You acknowledged this care plan.");
    },
    onError: () => toast.error("Could not acknowledge this care plan. Please retry."),
  });
}
