import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface FriendGame {
  id: string;
  sport: string;
  location_name?: string;
  scheduled_at: string;
  status: string;
  host_id: string;
  host_display_name?: string;
  host_avatar_url?: string | null;
  max_players: number;
  current_players: number;
  invited: boolean;
}

export function useFriendGames(
  userId: string | undefined,
  friendIds: string[]
) {
  const [friendGames, setFriendGames] = useState<FriendGame[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriendGames = useCallback(async () => {
    if (!userId || friendIds.length === 0) {
      setFriendGames([]);
      return;
    }
    setLoading(true);

    // Get active games hosted by friends
    const { data: hostedGames } = await supabase
      .from("games")
      .select("*")
      .in("host_id", friendIds)
      .in("status", ["open", "full", "started"])
      .order("starts_at", { ascending: true })
      .limit(10);

    // Get game invites for current user
    const { data: invites } = await supabase
      .from("game_invites")
      .select("game_id")
      .eq("invitee_id", userId)
      .eq("status", "pending");

    const invitedGameIds = new Set(
      (invites ?? []).map((i: any) => i.game_id)
    );

    // Get invited games not already in hostedGames
    const invitedNotHosted = Array.from(invitedGameIds).filter(
      (gid) => !(hostedGames ?? []).find((g: any) => g.id === gid)
    );

    let extraGames: any[] = [];
    if (invitedNotHosted.length > 0) {
      const { data } = await supabase
        .from("games")
        .select("*")
        .in("id", invitedNotHosted)
        .in("status", ["open", "full", "started"]);
      extraGames = data ?? [];
    }

    const allGames = [...(hostedGames ?? []), ...extraGames];
    if (allGames.length === 0) {
      setFriendGames([]);
      setLoading(false);
      return;
    }

    // Fetch host profiles
    const hostIds = [...new Set(allGames.map((g) => g.host_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", hostIds);

    const profileMap: Record<string, any> = {};
    for (const p of profiles ?? []) profileMap[p.id] = p;

    setFriendGames(
      allGames.map((g) => ({
        id: g.id,
        sport: g.sport,
        location_name: g.location_name ?? g.location?.name,
        scheduled_at: g.starts_at,
        status: g.status,
        host_id: g.host_id,
        host_display_name: profileMap[g.host_id]?.display_name,
        host_avatar_url: profileMap[g.host_id]?.avatar_url,
        max_players: g.max_players,
        current_players: g.current_players ?? 0,
        invited: invitedGameIds.has(g.id),
      }))
    );
    setLoading(false);
  }, [userId, friendIds.join(",")]);

  return { friendGames, loading, fetchFriendGames };
}
