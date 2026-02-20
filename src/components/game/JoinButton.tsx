import React, { useState } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface JoinButtonProps {
  gameId: string;
  userId: string;
  hasJoined: boolean;
  isFull: boolean;
  isHost: boolean;
  onToggle: () => void;
}

export function JoinButton({
  gameId,
  userId,
  hasJoined,
  isFull,
  isHost,
  onToggle,
}: JoinButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (hasJoined) {
        await supabase
          .from("game_participants")
          .update({ status: "left" as const })
          .eq("game_id", gameId)
          .eq("user_id", userId);
      } else {
        const { data: existing } = await supabase
          .from("game_participants")
          .select("id, status")
          .eq("game_id", gameId)
          .eq("user_id", userId)
          .single();

        if (existing) {
          await supabase
            .from("game_participants")
            .update({ status: "joined" as const })
            .eq("id", (existing as { id: string }).id);
        } else {
          await supabase
            .from("game_participants")
            .insert({ game_id: gameId, user_id: userId, status: "joined" as const });
        }
      }
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onToggle();
    } catch {
      // Error handled silently — UI reverts via realtime
    } finally {
      setLoading(false);
    }
  };

  if (isHost) {
    return <Button title="You're hosting" onPress={() => {}} variant="secondary" disabled />;
  }

  if (isFull && !hasJoined) {
    return <Button title="Game Full" onPress={() => {}} variant="outline" disabled />;
  }

  return (
    <Button
      title={hasJoined ? "Leave Game" : "Pull Up"}
      onPress={handlePress}
      variant={hasJoined ? "outline" : "primary"}
      size="lg"
      loading={loading}
    />
  );
}
