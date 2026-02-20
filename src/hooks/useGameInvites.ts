import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export interface GameInvite {
  id: string;
  game_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  inviter_profile?: Profile;
  game?: any;
}

export function useGameInvites(userId: string | undefined) {
  const [incomingInvites, setIncomingInvites] = useState<GameInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncomingInvites = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: invites } = await supabase
      .from("game_invites")
      .select("*")
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!invites || invites.length === 0) {
      setIncomingInvites([]);
      setLoading(false);
      return;
    }

    const gameIds = [...new Set(invites.map((i: any) => i.game_id))];
    const inviterIds = [...new Set(invites.map((i: any) => i.inviter_id))];

    const [{ data: games }, { data: profiles }] = await Promise.all([
      supabase.from("games").select("*").in("id", gameIds),
      supabase.from("profiles").select("*").in("id", inviterIds),
    ]);

    const gameMap: Record<string, any> = {};
    for (const g of games ?? []) gameMap[g.id] = g;

    const profileMap: Record<string, Profile> = {};
    for (const p of (profiles as Profile[]) ?? []) profileMap[p.id] = p;

    setIncomingInvites(
      invites.map((i: any) => ({
        ...i,
        game: gameMap[i.game_id],
        inviter_profile: profileMap[i.inviter_id],
      }))
    );
    setLoading(false);
  }, [userId]);

  const sendInvite = useCallback(
    async (
      gameId: string,
      inviteeId: string,
      inviterId: string
    ): Promise<{ error?: string }> => {
      const { error } = await supabase.from("game_invites").insert({
        game_id: gameId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
      });
      if (error && error.code !== "23505") return { error: error.message };
      return {};
    },
    []
  );

  const respondToInvite = useCallback(
    async (inviteId: string, accept: boolean): Promise<void> => {
      await supabase
        .from("game_invites")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", inviteId);
      await fetchIncomingInvites();
    },
    [fetchIncomingInvites]
  );

  return {
    incomingInvites,
    loading,
    fetchIncomingInvites,
    sendInvite,
    respondToInvite,
  };
}
