import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PlayerStats {
  user_id: string;
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
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    setStats(data as PlayerStats | null);
    setLoading(false);
  }, [userId]);

  return { stats, loading, fetchStats };
}
