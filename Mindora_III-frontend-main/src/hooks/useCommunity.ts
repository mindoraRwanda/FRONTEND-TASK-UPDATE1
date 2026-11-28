import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCommunityPost,
  fetchCommunityGroups,
  fetchCommunityMembership,
  fetchCommunityPosts,
  joinCommunity,
  leaveCommunity,
} from "@/lib/community-api";

export function useCommunityGroups() {
  return useQuery({
    queryKey: ["community", "groups"],
    queryFn: () => fetchCommunityGroups(1, 50),
  });
}

export function useCommunityPosts(groupId: string | null) {
  return useQuery({
    queryKey: ["community", "posts", groupId],
    queryFn: () => fetchCommunityPosts(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useCommunityMembership(groupId: string | null) {
  return useQuery({
    queryKey: ["community", "membership", groupId],
    queryFn: () => fetchCommunityMembership(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, join }: { groupId: string; join: boolean }) =>
      join ? joinCommunity(groupId) : leaveCommunity(groupId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community", "groups"] });
      queryClient.invalidateQueries({ queryKey: ["community", "membership", variables.groupId] });
      toast.success(variables.join ? "You joined the community." : "You left the community.");
    },
    onError: () => toast.error("Could not update your community membership. Please retry."),
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      title,
      message,
      isAnonymous,
    }: {
      groupId: string;
      title: string;
      message: string;
      isAnonymous: boolean;
    }) => createCommunityPost(groupId, title, message, isAnonymous),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts", variables.groupId] });
      toast.success("Your post was published.");
    },
    onError: () => toast.error("Could not publish your post. Please retry."),
  });
}
