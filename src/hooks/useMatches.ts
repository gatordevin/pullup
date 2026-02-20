import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export interface MatchPlayer {
  user_id: string;
  team: 1 | 2;
  profile?: Profile;
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

    // Fetch profiles for all players
    const playerUserIds = [...new Set((playerRows ?? []).map((p: any) => p.user_id))];
    let profileMap: Record<string, Profile> = {};
    if (playerUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", playerUserIds);
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
      team1Score: number,
      team2Score: number,
      players: { user_id: string; team: 1 | 2 }[],
      recordedBy: string,
      notes?: string
    ): Promise<{ error?: string }> => {
      if (!gameId) return { error: "No game" };

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          game_id: gameId,
          team1_score: team1Score,
          team2_score: team2Score,
          recorded_by: recordedBy,
          notes: notes ?? null,
        })
        .select("id")
        .single();

      if (matchError || !match) return { error: matchError?.message ?? "Failed to create match" };

      if (players.length > 0) {
        const { error: playersError } = await supabase.from("match_players").insert(
          players.map((p) => ({
            match_id: match.id,
            user_id: p.user_id,
            team: p.team,
          }))
        );
        if (playersError) return { error: playersError.message };
      }

      await fetchMatches();
      return {};
    },
    [gameId, fetchMatches]
  );

  return { matches, loading, fetchMatches, recordMatch };
}
