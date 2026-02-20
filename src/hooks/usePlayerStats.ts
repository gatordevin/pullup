import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SportStats {
  user_id: string;
  sport: string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  elo_rating: number;
  highest_elo: number;
  total_points_scored: number;
  total_points_conceded: number;
  updated_at: string;
}

export function usePlayerStats(userId: string | undefined) {
  const [statsBySport, setStatsBySport] = useState<SportStats[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .order("matches_played", { ascending: false });
    setStatsBySport((data as SportStats[]) ?? []);
    setLoading(false);
  }, [userId]);

  // Helper: get stats for a specific sport
  const getStatsForSport = useCallback(
    (sport: string): SportStats | undefined => {
      return statsBySport.find((s) => s.sport === sport);
    },
    [statsBySport]
  );

  // Totals across all sports
  const totals = statsBySport.reduce(
    (acc, s) => ({
      matches_played: acc.matches_played + s.matches_played,
      wins: acc.wins + s.wins,
      losses: acc.losses + s.losses,
      draws: acc.draws + s.draws,
    }),
    { matches_played: 0, wins: 0, losses: 0, draws: 0 }
  );

  return { statsBySport, loading, fetchStats, getStatsForSport, totals };
}
