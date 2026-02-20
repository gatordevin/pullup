import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

interface FriendRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  profile: Profile;
}

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Accepted friendships where user is either requester or addressee
    const { data: asRequester } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("requester_id", userId)
      .eq("status", "accepted");

    const { data: asAddressee } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("addressee_id", userId)
      .eq("status", "accepted");

    // Collect friend IDs
    const friendEntries: { row: any; friendId: string }[] = [];
    for (const r of asRequester ?? []) {
      friendEntries.push({ row: r, friendId: r.addressee_id });
    }
    for (const r of asAddressee ?? []) {
      friendEntries.push({ row: r, friendId: r.requester_id });
    }

    // Fetch profiles for friends
    const friendIds = friendEntries.map((e) => e.friendId);
    let profileMap: Record<string, Profile> = {};
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);
      for (const p of (profiles as Profile[]) ?? []) {
        profileMap[p.id] = p;
      }
    }

    setFriends(
      friendEntries
        .filter((e) => profileMap[e.friendId])
        .map((e) => ({
          ...e.row,
          profile: profileMap[e.friendId],
        }))
    );

    // Incoming pending requests
    const { data: pending } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("addressee_id", userId)
      .eq("status", "pending");

    const pendingIds = (pending ?? []).map((r: any) => r.requester_id);
    let pendingProfileMap: Record<string, Profile> = {};
    if (pendingIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", pendingIds);
      for (const p of (profiles as Profile[]) ?? []) {
        pendingProfileMap[p.id] = p;
      }
    }

    setIncomingRequests(
      (pending ?? [])
        .filter((r: any) => pendingProfileMap[r.requester_id])
        .map((r: any) => ({
          ...r,
          profile: pendingProfileMap[r.requester_id],
        }))
    );

    setLoading(false);
  }, [userId]);

  const sendRequestById = useCallback(
    async (targetId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Not logged in" };
      if (targetId === userId) return { error: "You can't add yourself" };

      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const status = (existing[0] as any).status;
        if (status === "accepted") return { error: "Already friends" };
        if (status === "pending") return { error: "Request already pending" };
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: userId,
        addressee_id: targetId,
      });

      if (error) return { error: error.message };
      return {};
    },
    [userId]
  );

  const sendRequest = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Not logged in" };

      const normalizedEmail = email.toLowerCase().trim();

      // Look up profile by email
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return { error: "No player found with that email" };
      }

      const targetId = (profiles[0] as { id: string }).id;
      if (targetId === userId) {
        return { error: "You can't add yourself" };
      }

      // Check if friendship already exists in either direction
      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const status = (existing[0] as any).status;
        if (status === "accepted") return { error: "Already friends" };
        if (status === "pending") return { error: "Request already pending" };
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: userId,
        addressee_id: targetId,
      });

      if (error) return { error: error.message };
      return {};
    },
    [userId]
  );

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" as const, updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
  }, []);

  const declineRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "declined" as const, updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }, []);

  return {
    friends,
    incomingRequests,
    loading,
    fetchFriends,
    sendRequest,
    sendRequestById,
    acceptRequest,
    declineRequest,
    removeFriend,
  };
}
