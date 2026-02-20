import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export interface MatchPlayer {
  user_id: string;
  team: 1 | 2;
  profile?: Profile;
  guest_name?: string;
  guest_email?: string;
}

export interface GuestPlayer {
  name: string;
  email?: string;
}

export interface Match {
  id: string;
  game_id: string;
  team1_score: number;
  team2_score: number;
  recorded_by: string;
  played_at: string;
  notes?: string;
  created_at: string;
  players: MatchPlayer[];
}

export function useMatches(gameId: string | undefined) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);

    const { data: matchRows } = await supabase
      .from("matches")
      .select("*")
      .eq("game_id", gameId)
      .order("played_at", { ascending: false });

    if (!matchRows || matchRows.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const matchIds = matchRows.map((m: any) => m.id);
    const { data: playerRows } = await supabase
      .from("match_players")
      .select("*")
      .in("match_id", matchIds);

    // Fetch profiles for real players (not guests)
    const realPlayerIds = [...new Set(
      (playerRows ?? [])
        .filter((p: any) => !p.guest_name && !String(p.user_id).startsWith("guest_"))
        .map((p: any) => p.user_id)
    )];
    let profileMap: Record<string, Profile> = {};
    if (realPlayerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", realPlayerIds);
      for (const p of (profiles as Profile[]) ?? []) {
        profileMap[p.id] = p;
      }
    }

    const playersByMatch: Record<string, MatchPlayer[]> = {};
    for (const p of (playerRows ?? []) as any[]) {
      if (!playersByMatch[p.match_id]) playersByMatch[p.match_id] = [];
      playersByMatch[p.match_id].push({
        user_id: p.user_id,
        team: p.team as 1 | 2,
        profile: profileMap[p.user_id],
        guest_name: p.guest_name ?? undefined,
        guest_email: p.guest_email ?? undefined,
      });
    }

    setMatches(
      matchRows.map((m: any) => ({
        ...m,
        players: playersByMatch[m.id] ?? [],
      }))
    );
    setLoading(false);
  }, [gameId]);

  const recordMatch = useCallback(
    async (
      sport: string,
      team1Score: number,
      team2Score: number,
      players: { user_id: string; team: 1 | 2 }[],
      recordedBy: string,
      notes?: string,
      team1Guests?: GuestPlayer[],
      team2Guests?: GuestPlayer[]
    ): Promise<{ error?: string }> => {
      if (!gameId) return { error: "No game" };

      const team1Players = players.filter((p) => p.team === 1).map((p) => p.user_id);
      const team2Players = players.filter((p) => p.team === 2).map((p) => p.user_id);

      const { error } = await supabase.rpc("record_match_and_update_stats", {
        p_game_id: gameId,
        p_sport: sport,
        p_team1_score: team1Score,
        p_team2_score: team2Score,
        p_recorded_by: recordedBy,
        p_notes: notes ?? null,
        p_team1_players: team1Players,
        p_team2_players: team2Players,
        p_team1_guests: team1Guests ?? [],
        p_team2_guests: team2Guests ?? [],
      });

      if (error) return { error: error.message };
      await fetchMatches();
      return {};
    },
    [gameId, fetchMatches]
  );

  return { matches, loading, fetchMatches, recordMatch };
}
