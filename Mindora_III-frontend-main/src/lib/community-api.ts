import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api";

export interface CommunityGroup {
  _id: string;
  name: string;
  description: string;
  category: string;
  isAnonymous: boolean;
  memberCount: number;
  createdAt: string;
}

export interface CommunityPost {
  _id: string;
  communityId: string;
  content: Record<string, unknown>;
  isAnonymous: boolean;
  reactions: Array<{ type: "LIKE" | "HEART" | "SUPPORT"; count: number }>;
  commentCount: number;
  createdAt: string;
  userName: string | null;
  avatarUrl: string | null;
}

interface CommunityGroupListResponse {
  groups: CommunityGroup[];
  total: number;
  page: number;
  limit: number;
}

interface CommunityPostListResponse {
  posts: CommunityPost[];
  total: number;
  page: number;
  limit: number;
}

export interface CommunityMembershipResponse {
  joined: boolean;
  memberCount: number;
}

export function fetchCommunityGroups(page = 1, limit = 50): Promise<CommunityGroupListResponse> {
  return apiFetch(`/api/v1/community/groups?page=${page}&limit=${limit}`);
}

export function fetchCommunityPosts(
  groupId: string,
  page = 1,
  limit = 20
): Promise<CommunityPostListResponse> {
  return apiFetch(
    `/api/v1/community/groups/${encodeURIComponent(groupId)}/posts?page=${page}&limit=${limit}`
  );
}

export function fetchCommunityMembership(groupId: string): Promise<CommunityMembershipResponse> {
  return apiFetch(`/api/v1/community/groups/${encodeURIComponent(groupId)}/membership`);
}

export function joinCommunity(groupId: string): Promise<CommunityMembershipResponse> {
  return apiFetch(`/api/v1/community/groups/${encodeURIComponent(groupId)}/join`, {
    method: "POST",
  });
}

export function leaveCommunity(groupId: string): Promise<CommunityMembershipResponse> {
  return apiFetch(`/api/v1/community/groups/${encodeURIComponent(groupId)}/join`, {
    method: "DELETE",
  });
}

export function createCommunityPost(
  groupId: string,
  title: string,
  message: string,
  isAnonymous: boolean
): Promise<CommunityPost> {
  const text = message.trim();
  return apiFetch(`/api/v1/community/groups/${encodeURIComponent(groupId)}/posts`, {
    method: "POST",
    body: JSON.stringify({
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: title.trim() }] },
          { type: "paragraph", content: [{ type: "text", text }] },
        ],
      },
      isAnonymous,
    }),
  });
}

export function communityErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && "message" in error) return error.message;
  return (error as ApiError | undefined)?.message ?? fallback;
}
