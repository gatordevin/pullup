import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/game/GameCard";
import { useFriends } from "@/hooks/useFriends";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "@/lib/supabase";
import * as Clipboard from "expo-clipboard";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  SPORTS,
  SKILL_LEVELS,
  UF_LOCATIONS,
  APP_URL,
  getInviteUrl,
  getReferralUrl,
  sportInfo,
} from "@/lib/constants";
import { useReferral } from "@/hooks/useReferral";
import type { GameWithLocation } from "@/types/database";

export default function ProfileScreen() {
  const { user, signOut, refreshProfile, isGuest, guestLogout } = useAuth();
  const { profile, loading, fetchProfile } = useProfile(user?.id);
  const [myGames, setMyGames] = useState<GameWithLocation[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [hostedCount, setHostedCount] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);
  const [showShareQR, setShowShareQR] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [friendSuccess, setFriendSuccess] = useState<string | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const {
    friends,
    incomingRequests,
    fetchFriends,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(user?.id);
  const { statsBySport, totals, fetchStats: fetchPlayerStats } = usePlayerStats(user?.id);
  const { referralCode, stats: referralStats, fetchReferralCode, fetchStats: fetchReferralStats } = useReferral(user?.id);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyGames();
      fetchStats();
      fetchPlayerStats();
      if (!isGuest) {
        fetchFriends();
        fetchReferralCode();
        fetchReferralStats();
      }
    } else {
      setGamesLoading(false);
    }
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user) return;
    const { count: hosted } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .eq("host_id", user.id);
    const { count: joined } = await supabase
      .from("game_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "joined");
    setHostedCount(hosted ?? 0);
    setJoinedCount(joined ?? 0);
  };

  const fetchMyGames = async () => {
    if (!user) return;

    const { data: hosted } = await supabase
      .from("games")
      .select("*, locations(*)")
      .eq("host_id", user.id)
      .order("starts_at", { ascending: false })
      .limit(10);

    const { data: participantRows } = await supabase
      .from("game_participants")
      .select("game_id")
      .eq("user_id", user.id)
      .eq("status", "joined");

    const participantGameIds =
      participantRows?.map((p: any) => p.game_id) ?? [];
    let joined: GameWithLocation[] = [];

    if (participantGameIds.length > 0) {
      const { data } = await supabase
        .from("games")
        .select("*, locations(*)")
        .in("id", participantGameIds)
        .neq("host_id", user.id)
        .order("starts_at", { ascending: false })
        .limit(10);
      joined = (data as GameWithLocation[]) ?? [];
    }

    setMyGames([...((hosted as GameWithLocation[]) ?? []), ...joined]);
    setGamesLoading(false);
  };

  const handleSignOut = () => {
    if (isGuest) {
      guestLogout();
      return;
    }
    if (Platform.OS === "web") {
      if ((window as any).confirm("Sign Out\nAre you sure?")) {
        signOut().then(() => router.replace("/(auth)/login"));
      }
    } else {
      Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ]);
    }
  };

  // Not logged in at all
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.notLoggedTitle}>Welcome to PullUp</Text>
        <Text style={styles.notLoggedSub}>
          Sign in to track your games and manage your profile
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [
            styles.loginBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={[...Gradient.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
          />
          <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const sportLabel = SPORTS.find((s) => s.value === profile?.preferred_sport);
  const skillLabel = SKILL_LEVELS.find(
    (s) => s.value === profile?.skill_level
  );
  const locationLabel = UF_LOCATIONS.find(
    (l) => l.id === profile?.favorite_location_id
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Guest banner */}
        {isGuest && (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={styles.guestBanner}
          >
            <Text style={styles.guestBannerText}>
              You're browsing as a guest.{" "}
              <Text style={styles.guestBannerLink}>Create an account</Text> to keep your data.
            </Text>
          </Pressable>
        )}

        {/* Profile header */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[...Gradient.brandSubtle]}
            style={styles.profileGlow}
          />
          <Avatar name={profile?.display_name ?? null} imageUrl={profile?.avatar_url} size={80} />
          {editingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.editNameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={30}
              />
              <Pressable
                onPress={async () => {
                  if (newName.trim().length >= 2 && user) {
                    await supabase.from("profiles").update({ display_name: newName.trim() }).eq("id", user.id);
                    await refreshProfile();
                    fetchProfile();
                  }
                  setEditingName(false);
                }}
                style={styles.editNameSave}
              >
                <Text style={styles.editNameSaveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setNewName(profile?.display_name ?? ""); setEditingName(true); }}>
              <Text style={styles.name}>
                {profile?.display_name ?? "Player"} ✏️
              </Text>
            </Pressable>
          )}
          <Text style={styles.email}>
            {user?.email}
            {isGuest && " (Guest)"}
          </Text>

          <View style={styles.tags}>
            {sportLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {sportLabel.emoji} {sportLabel.label}
                </Text>
              </View>
            )}
            {skillLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{skillLabel.label}</Text>
              </View>
            )}
            {locationLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>📍 {locationLabel.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{hostedCount}</Text>
            <Text style={styles.statLabel}>Hosted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{joinedCount}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Match Stats — per sport */}
        {statsBySport.length > 0 && (
          <View style={{ marginBottom: Spacing.lg, paddingHorizontal: Spacing.lg }}>
            <Text style={styles.matchStatsSectionTitle}>Match Stats</Text>
            {statsBySport.map((s) => {
              const sport = sportInfo(s.sport);
              const winPct = s.matches_played > 0
                ? Math.round((s.wins / s.matches_played) * 100)
                : 0;
              return (
                <View key={s.sport} style={styles.matchStatsCard}>
                  <View style={styles.statsCardHeader}>
                    <Text style={styles.statsCardEmoji}>{sport.emoji}</Text>
                    <Text style={styles.statsCardSport}>{sport.label}</Text>
                    <View style={styles.eloChip}>
                      <Text style={styles.eloChipText}>{s.elo_rating} ELO</Text>
                    </View>
                  </View>
                  <View style={styles.matchStatsRow}>
                    <View style={styles.matchStatItem}>
                      <Text style={styles.matchStatValue}>{s.matches_played}</Text>
                      <Text style={styles.matchStatLabel}>Played</Text>
                    </View>
                    <View style={styles.matchStatItem}>
                      <Text style={[styles.matchStatValue, { color: Colors.success }]}>{s.wins}</Text>
                      <Text style={styles.matchStatLabel}>Wins</Text>
                    </View>
                    <View style={styles.matchStatItem}>
                      <Text style={[styles.matchStatValue, { color: Colors.error }]}>{s.losses}</Text>
                      <Text style={styles.matchStatLabel}>Losses</Text>
                    </View>
                    <View style={styles.matchStatItem}>
                      <Text style={styles.matchStatValue}>{winPct}%</Text>
                      <Text style={styles.matchStatLabel}>Win %</Text>
                    </View>
                    <View style={styles.matchStatItem}>
                      <Text style={[styles.matchStatValue, { color: Colors.accent }]}>{s.highest_elo}</Text>
                      <Text style={styles.matchStatLabel}>Peak</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Show placeholder if no matches yet */}
        {statsBySport.length === 0 && user && !isGuest && (
          <View style={[styles.matchStatsCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }]}>
            <Text style={styles.matchStatsSectionTitle}>Match Stats</Text>
            <Text style={styles.matchStatsEmpty}>No matches recorded yet. Join a game and record your first match!</Text>
          </View>
        )}

        {/* Referral / Raffle Card */}
        {!isGuest && user && referralCode && (
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Text style={styles.referralTitle}>🎟️ Raffle & Referrals</Text>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketCount}>{referralStats?.tickets ?? 0}</Text>
                <Text style={styles.ticketLabel}>tickets</Text>
              </View>
            </View>

            <Text style={styles.referralDesc}>
              Invite friends with your code. When they sign up with Google and join a game, you earn a raffle ticket for a chance to win a pickleball paddle!
            </Text>

            <View style={styles.referralStats}>
              <View style={styles.referralStatItem}>
                <Text style={styles.referralStatValue}>{referralStats?.total_referrals ?? 0}</Text>
                <Text style={styles.referralStatLabel}>Invited</Text>
              </View>
              <View style={styles.referralStatItem}>
                <Text style={[styles.referralStatValue, { color: Colors.success }]}>
                  {referralStats?.tickets ?? 0}
                </Text>
                <Text style={styles.referralStatLabel}>Joined ✓</Text>
              </View>
              <View style={styles.referralStatItem}>
                <Text style={[styles.referralStatValue, { color: Colors.textMuted }]}>
                  {referralStats?.pending_referrals ?? 0}
                </Text>
                <Text style={styles.referralStatLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your referral code</Text>
              <Text style={styles.codeText}>{referralCode}</Text>
            </View>

            <Pressable
              style={styles.shareReferralBtn}
              onPress={async () => {
                const url = getReferralUrl(referralCode);
                try {
                  await Clipboard.setStringAsync(url);
                } catch {}
                try {
                  const { Share } = await import("react-native");
                  await Share.share({ message: `Join me on PullUp! ${url}`, url });
                } catch {}
              }}
            >
              <Text style={styles.shareReferralBtnText}>📤 Share Referral Link</Text>
            </Pressable>
          </View>
        )}

        {/* My Games */}
        <Text style={styles.sectionTitle}>My Games</Text>
        {gamesLoading ? (
          <ActivityIndicator
            color={Colors.accent}
            style={{ marginTop: Spacing.xxl }}
          />
        ) : myGames.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptyHint}>
              Create or join a game to see it here
            </Text>
          </View>
        ) : (
          myGames.map((game) => <GameCard key={game.id} game={game} />)
        )}

        {/* Friends Section - hidden for guests */}
        {!isGuest && (
          <View style={styles.friendsSection}>
            {/* Incoming requests */}
            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.friendRow}>
                    <Pressable
                      onPress={() => router.push(`/player/${req.profile.id}`)}
                      style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                    >
                      <Avatar name={req.profile.display_name} imageUrl={req.profile.avatar_url} size={36} />
                      <Text style={styles.friendName}>{req.profile.display_name ?? "Player"}</Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => { await acceptRequest(req.id); fetchFriends(); }}
                      style={[styles.friendActionBtn, { backgroundColor: Colors.success }]}
                    >
                      <Text style={styles.friendActionText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => { await declineRequest(req.id); fetchFriends(); }}
                      style={[styles.friendActionBtn, { backgroundColor: Colors.darkTertiary, marginLeft: Spacing.xs }]}
                    >
                      <Text style={[styles.friendActionText, { color: Colors.textSecondary }]}>Decline</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            {/* Friends list */}
            <Text style={styles.sectionTitle}>
              Friends{friends.length > 0 ? ` (${friends.length})` : ""}
            </Text>
            {friends.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptyHint}>Add friends by their email below</Text>
              </View>
            ) : (
              friends.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => router.push(`/player/${f.profile.id}`)}
                  style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.7 }]}
                >
                  <Avatar name={f.profile.display_name} imageUrl={f.profile.avatar_url} size={36} />
                  <Text style={styles.friendName}>{f.profile.display_name ?? "Player"}</Text>
                  <Text style={styles.chevron}>{"\u203A"}</Text>
                </Pressable>
              ))
            )}

            {/* Invite link */}
            <Pressable
              onPress={async () => {
                if (!user) return;
                await Clipboard.setStringAsync(getInviteUrl(user.id));
                setInviteCopied(true);
                setTimeout(() => setInviteCopied(false), 2500);
              }}
              style={({ pressed }) => [
                styles.inviteBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.inviteBtnText}>
                {inviteCopied ? "✓ Link Copied!" : "🔗 Copy Invite Link"}
              </Text>
              <Text style={styles.inviteBtnSub}>
                {inviteCopied
                  ? "Paste it anywhere to share"
                  : "Friends open it to add you instantly"}
              </Text>
            </Pressable>

            {/* Add friend */}
            <View style={styles.addFriendCard}>
              <Text style={styles.addFriendTitle}>Add Friend by Email</Text>
              <View style={styles.addFriendRow}>
                <TextInput
                  style={styles.addFriendInput}
                  value={friendEmail}
                  onChangeText={(t) => { setFriendEmail(t); setFriendError(null); setFriendSuccess(null); }}
                  placeholder="friend@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={100}
                />
                <Pressable
                  onPress={async () => {
                    if (!friendEmail.trim() || !friendEmail.includes("@")) {
                      setFriendError("Enter a valid email");
                      return;
                    }
                    setAddingFriend(true);
                    setFriendError(null);
                    setFriendSuccess(null);
                    const result = await sendRequest(friendEmail.trim());
                    setAddingFriend(false);
                    if (result.error) {
                      setFriendError(result.error);
                    } else {
                      setFriendSuccess("Request sent!");
                      setFriendEmail("");
                      fetchFriends();
                    }
                  }}
                  disabled={addingFriend}
                  style={({ pressed }) => [
                    styles.addFriendBtn,
                    pressed && { opacity: 0.8 },
                    addingFriend && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.addFriendBtnText}>
                    {addingFriend ? "..." : "Send"}
                  </Text>
                </Pressable>
              </View>
              {friendError && <Text style={styles.friendErrorText}>{friendError}</Text>}
              {friendSuccess && <Text style={styles.friendSuccessText}>{friendSuccess}</Text>}
            </View>
          </View>
        )}

        {/* Share PullUp */}
        <Pressable
          onPress={() => setShowShareQR(true)}
          style={({ pressed }) => [
            styles.shareBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.shareBtnText}>Share PullUp</Text>
          <Text style={styles.shareBtnSub}>Show QR code to invite friends</Text>
        </Pressable>

        {/* Sign Out / Upgrade */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.signOutText}>
            {isGuest ? "Clear Guest Data" : "Sign Out"}
          </Text>
        </Pressable>
      </View>

      {/* Share QR Modal */}
      <Modal
        visible={showShareQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareQR(false)}
      >
        <Pressable
          style={styles.shareOverlay}
          onPress={() => setShowShareQR(false)}
        >
          <Text style={styles.shareTitle}>Share PullUp</Text>
          <View style={styles.shareQrWrap}>
            <QRCode
              value={APP_URL}
              size={200}
              backgroundColor="#FFD60A"
              color={Colors.dark}
            />
          </View>
          <Text style={styles.shareHint}>Scan to download PullUp</Text>
          <Text style={styles.shareDismiss}>Tap anywhere to dismiss</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingBottom: 60 },
  inner: {
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.xxl,
  },

  notLoggedTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  notLoggedSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  loginBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxxxl,
    alignItems: "center",
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.dark,
  },

  guestBanner: {
    backgroundColor: Colors.accent + "15",
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent + "30",
    padding: Spacing.md,
    alignItems: "center",
  },
  guestBannerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  guestBannerLink: {
    color: Colors.accent,
    fontWeight: "600",
  },

  profileCard: {
    alignItems: "center",
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
    position: "relative",
    overflow: "hidden",
  },
  profileGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginTop: Spacing.lg,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  tag: {
    backgroundColor: Colors.darkCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  emptyBox: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editNameInput: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: "700",
    minWidth: 180,
    textAlign: "center",
  },
  editNameSave: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  editNameSaveText: {
    color: Colors.dark,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  friendsSection: {
    marginTop: Spacing.lg,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkTertiary,
  },
  friendName: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  friendActionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
  },
  friendActionText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.dark,
  },
  inviteBtn: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.accent + "18",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  inviteBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.accent,
  },
  inviteBtnSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addFriendCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFriendTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  addFriendRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  addFriendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  addFriendBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.dark,
  },
  friendErrorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  friendSuccessText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  shareBtn: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.accent,
  },
  shareBtnSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: "#FFD60A",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  shareTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.dark,
    marginBottom: Spacing.xxxl,
  },
  shareQrWrap: {
    padding: Spacing.lg,
    backgroundColor: "#FFD60A",
    borderRadius: BorderRadius.lg,
  },
  shareHint: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.dark,
    opacity: 0.7,
    marginTop: Spacing.xxl,
  },
  shareDismiss: {
    fontSize: FontSize.sm,
    color: Colors.dark,
    opacity: 0.4,
    marginTop: Spacing.xl,
  },
  signOutBtn: {
    marginTop: Spacing.xxxxl,
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  matchStatsCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  matchStatsSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statsCardEmoji: {
    fontSize: 22,
  },
  statsCardSport: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.text,
    flex: 1,
  },
  eloChip: {
    backgroundColor: Colors.accent + "22",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accent + "44",
  },
  eloChipText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.accent,
  },
  matchStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  matchStatItem: {
    alignItems: "center",
  },
  matchStatValue: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.text,
    lineHeight: 26,
  },
  matchStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
    fontWeight: "600",
  },
  matchStatsEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingVertical: Spacing.sm,
  },
  referralCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.accent + "33",
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  referralTitle: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.text,
  },
  ticketBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    minWidth: 52,
  },
  ticketCount: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.dark,
    lineHeight: 22,
  },
  ticketLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dark,
    textTransform: "uppercase",
  },
  referralDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  referralStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
    backgroundColor: Colors.darkTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  referralStatItem: {
    alignItems: "center",
  },
  referralStatValue: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.text,
  },
  referralStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  codeBox: {
    backgroundColor: Colors.darkInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  codeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  codeText: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.accent,
    letterSpacing: 4,
  },
  shareReferralBtn: {
    backgroundColor: Colors.accent + "22",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + "44",
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  shareReferralBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.accent,
  },
});
