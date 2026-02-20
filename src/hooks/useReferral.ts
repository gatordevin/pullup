import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ReferralStats {
  tickets: number;
  total_referrals: number;
  pending_referrals: number;
}

export function useReferral(userId: string | undefined) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReferralCode = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_or_create_referral_code", {
      p_user_id: userId,
    });
    setReferralCode(data as string | null);
    setLoading(false);
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("raffle_tickets")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) {
      setStats({
        tickets: Number(data.tickets) || 0,
        total_referrals: Number(data.total_referrals) || 0,
        pending_referrals: Number(data.pending_referrals) || 0,
      });
    } else {
      setStats({ tickets: 0, total_referrals: 0, pending_referrals: 0 });
    }
  }, [userId]);

  const registerReferral = useCallback(
    async (code: string, usedGoogle: boolean): Promise<boolean> => {
      if (!userId) return false;
      const { data } = await supabase.rpc("register_referral", {
        p_referee_id: userId,
        p_referral_code: code.toUpperCase(),
        p_used_google: usedGoogle,
      });
      return !!data;
    },
    [userId]
  );

  return {
    referralCode,
    stats,
    loading,
    fetchReferralCode,
    fetchStats,
    registerReferral,
  };
}
