import { useState, createElement, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { useGameChat } from "@/hooks/useGameChat";
import { useMatches, type GuestPlayer } from "@/hooks/useMatches";
import { useFriends } from "@/hooks/useFriends";
import { useGameInvites } from "@/hooks/useGameInvites";
import { JoinButton } from "@/components/game/JoinButton";
import { RosterList } from "@/components/game/RosterList";
import { ChatMessage } from "@/components/game/ChatMessage";
import { ChatInput } from "@/components/game/ChatInput";
import { copyGameLink } from "@/lib/clipboard";
import { formatGameTime, formatRelative } from "@/lib/datetime";
import { supabase } from "@/lib/supabase";
import QRCode from "react-native-qrcode-svg";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  SKILL_LEVELS,
  UF_LOCATIONS,
  SkillLevel,
  sportInfo,
  equipmentLabel as getEquipLabel,
  getGameCode,
  getGameUrl,
} from "@/lib/constants";

let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

function crossAlert(title: string, msg: string, onOk?: () => void) {
  if (Platform.OS === "web") {
    (window as any).alert(`${title}\n${msg}`);
    onOk?.();
  } else {
    Alert.alert(title, msg, [{ text: "OK", onPress: onOk }]);
  }
}

function crossConfirm(title: string, msg: string, onYes: () => void) {
  if (Platform.OS === "web") {
    if ((window as any).confirm(`${title}\n${msg}`)) onYes();
  } else {
    Alert.alert(title, msg, [
      { text: "No" },
      { text: "Yes", style: "destructive", onPress: onYes },
    ]);
  }
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isGuest, guestLogin } = useAuth();
  const { game, participants, loading, refresh } = useGame(id!);
  const { messages, sendMessage } = useGameChat(id!);
  const chatListRef = useRef<FlatList>(null);

  // Match recording
  const { matches, fetchMatches, recordMatch } = useMatches(id);
  const [showRecordMatch, setShowRecordMatch] = useState(false);
  const [team1Score, setTeam1Score] = useState("0");
  const [team2Score, setTeam2Score] = useState("0");
  const [teamAssignments, setTeamAssignments] = useState<Record<string, 1 | 2>>({});
  const [savingMatch, setSavingMatch] = useState(false);
  const [team1Guests, setTeam1Guests] = useState<GuestPlayer[]>([]);
  const [team2Guests, setTeam2Guests] = useState<GuestPlayer[]>([]);
  const [addingGuestTeam, setAddingGuestTeam] = useState<1 | 2 | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [guestEmailInput, setGuestEmailInput] = useState("");

  // Game lifecycle (start / end)
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Friend invites
  const { friends, fetchFriends } = useFriends(user?.id);
  const { sendInvite } = useGameInvites(user?.id);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = useState<string | null>(null);

  // Guest prompt state
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillLevel>("any");
  const [editMaxPlayers, setEditMaxPlayers] = useState(4);
  const [editStartsAt, setEditStartsAt] = useState(new Date());
  const [editLocationId, setEditLocationId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTimeFlexible, setEditTimeFlexible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBigCode, setShowBigCode] = useState(false);

  // Fetch matches and friends when game loads
  useEffect(() => {
    if (id) fetchMatches();
  }, [id, fetchMatches]);

  const handleStartGame = async () => {
    setUpdatingStatus(true);
    await supabase
      .from("games")
      .update({ status: "started" as any, started_at: new Date().toISOString() })
      .eq("id", id as string);
    setUpdatingStatus(false);
    setShowStartConfirm(false);
    refresh();
  };

  const handleEndGame = async () => {
    setUpdatingStatus(true);
    await supabase
      .from("games")
      .update({ status: "completed" as const, ended_at: new Date().toISOString() } as any)
      .eq("id", id as string);
    setUpdatingStatus(false);
    setShowEndConfirm(false);
    refresh();
  };

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (loading || !game) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const isHost = game.host_id === user?.id;
  const hasJoined = participants.some((p) => p.user_id === user?.id);
  const isFull = game.current_players >= game.max_players;
  const spotsLeft = game.max_players - game.current_players;
  const progress =
    game.max_players > 0 ? game.current_players / game.max_players : 0;

  const si = sportInfo(game.sport);
  const canChat = hasJoined || isHost;

  const handleJoinPress = () => {
    if (!user) {
      // Not logged in — show guest prompt
      setShowGuestPrompt(true);
      return;
    }
    // Already handled by JoinButton
  };

  const performJoin = async (gameId: string, userId: string) => {
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
  };

  const handleGuestSubmit = async () => {
    if (guestName.trim().length < 2) {
      crossAlert("Name required", "Please enter your name (at least 2 characters)");
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      crossAlert("Email required", "Please enter a valid email");
      return;
    }
    setGuestLoading(true);
    const guestId = await guestLogin(guestName.trim(), guestEmail.trim());
    // Auto-join the game immediately
    await performJoin(id!, guestId);
    setGuestLoading(false);
    setShowGuestPrompt(false);
    refresh();
  };

  const startEdit = () => {
    setEditSkill((game.skill_level as SkillLevel) ?? "any");
    setEditMaxPlayers(game.max_players);
    setEditStartsAt(new Date(game.starts_at));
    setEditLocationId(game.location_id);
    setEditNotes(game.notes ?? "");
    setEditTimeFlexible(game.time_flexible ?? false);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    await supabase
      .from("games")
      .update({
        skill_level: editSkill,
        max_players: editMaxPlayers,
        starts_at: editStartsAt.toISOString(),
        location_id: editLocationId,
        notes: editNotes.trim() || null,
        time_flexible: editTimeFlexible,
      })
      .eq("id", game.id);
    setSaving(false);
    setEditing(false);
    refresh();
  };

  const handleCancel = () => {
    crossConfirm("Cancel Game", "Are you sure you want to cancel this game?", async () => {
      await supabase
        .from("games")
        .update({ status: "cancelled" as const })
        .eq("id", game.id);
      router.back();
    });
  };

  const handleShare = async () => {
    await copyGameLink(game.id);
    crossAlert("Copied!", "Game link copied to clipboard");
  };

  const toLocalDatetimeStr = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[...Gradient.brandSubtle]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.heroEmoji}>{si.emoji}</Text>
            <Text style={styles.heroTitle}>{si.label}</Text>
            {game.status === "started" && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>● LIVE</Text>
              </View>
            )}
            <Text style={styles.heroTime}>
              {formatRelative(game.starts_at)}
            </Text>

            {/* Game code */}
            <Pressable
              onPress={() => setShowBigCode(true)}
              style={({ pressed }) => [styles.codeRow, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.codeLabel}>CODE</Text>
              <Text style={styles.codeValue}>{getGameCode(game.id)}</Text>
              <Text style={styles.codeTap}>Show Big</Text>
            </Pressable>

            {/* Player count */}
            <View style={styles.countRow}>
              <Text style={styles.countNum}>{game.current_players}</Text>
              <Text style={styles.countSlash}>/</Text>
              <Text style={styles.countMax}>{game.max_players}</Text>
            </View>
            <Text style={styles.countHint}>
              {isFull
                ? "Game is full"
                : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
            </Text>

            {/* Progress */}
            <View style={styles.progressBg}>
              <LinearGradient
                colors={
                  isFull ? ["#FF453A", "#FF6961"] : [...Gradient.brand]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress * 100, 100)}%` as any,
                  },
                ]}
              />
            </View>
          </View>

          {/* Detail card */}
          {!editing ? (
            <View style={styles.detailCard}>
              {game.sport === "running" &&
                (game.distance_miles || game.pace) && (
                  <DetailRow
                    label="Run"
                    value={[
                      game.distance_miles
                        ? `${game.distance_miles} mi`
                        : null,
                      game.pace ? `${game.pace} pace` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                )}
              <DetailRow
                label="Where"
                value={game.locations?.name ?? "Any court"}
              />
              <DetailRow
                label="When"
                value={formatGameTime(game.starts_at)}
                badge={game.time_flexible ? "Flexible" : undefined}
              />
              <DetailRow
                label="Level"
                value={
                  game.skill_level === "any"
                    ? "All levels welcome"
                    : game.skill_level
                }
              />
              {(game.has_equipment || game.extra_equipment) && (
                <DetailRow
                  label="Gear"
                  value={[
                    game.has_equipment
                      ? `${si.emoji} Has ${getEquipLabel(game.sport)}`
                      : null,
                    game.extra_equipment ? "Extras to share" : null,
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                  last
                />
              )}
            </View>
          ) : (
            /* ═══ EDIT MODE ═══ */
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Edit Game</Text>

              <Text style={styles.editLabel}>Skill Level</Text>
              <View style={styles.chipRow}>
                {SKILL_LEVELS.map((s) => {
                  const sel = editSkill === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => setEditSkill(s.value)}
                      style={[styles.chip, sel && styles.chipSel]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sel && styles.chipTextSel,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.editLabel}>Max Players</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() =>
                    setEditMaxPlayers(Math.max(2, editMaxPlayers - 1))
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperNum}>{editMaxPlayers}</Text>
                <Pressable
                  onPress={() =>
                    setEditMaxPlayers(Math.min(20, editMaxPlayers + 1))
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>

              <Text style={styles.editLabel}>When</Text>
              {Platform.OS === "web" ? (
                <View style={{ marginBottom: Spacing.md }}>
                  {createElement("input", {
                    type: "datetime-local",
                    value: toLocalDatetimeStr(editStartsAt),
                    onChange: (e: any) => {
                      if (e.target.value)
                        setEditStartsAt(new Date(e.target.value));
                    },
                    style: {
                      backgroundColor: Colors.darkCard,
                      color: Colors.text,
                      border: `1px solid ${Colors.border}`,
                      borderRadius: 12,
                      padding: "12px 16px",
                      fontSize: 16,
                      width: "100%",
                      outline: "none",
                    },
                  })}
                </View>
              ) : (
                <View style={styles.dateRow}>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={styles.datePill}
                  >
                    <Text style={styles.datePillText}>
                      {editStartsAt.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    style={styles.datePill}
                  >
                    <Text style={styles.datePillText}>
                      {editStartsAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Pressable>
                </View>
              )}
              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={editStartsAt}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_: any, d: Date | undefined) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (d) {
                      const u = new Date(editStartsAt);
                      u.setFullYear(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate()
                      );
                      setEditStartsAt(u);
                    }
                  }}
                />
              )}
              {showTimePicker && DateTimePicker && (
                <DateTimePicker
                  value={editStartsAt}
                  mode="time"
                  onChange={(_: any, d: Date | undefined) => {
                    setShowTimePicker(Platform.OS === "ios");
                    if (d) {
                      const u = new Date(editStartsAt);
                      u.setHours(d.getHours(), d.getMinutes());
                      setEditStartsAt(u);
                    }
                  }}
                />
              )}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Flexible on time</Text>
                <Switch
                  value={editTimeFlexible}
                  onValueChange={setEditTimeFlexible}
                  trackColor={{
                    false: Colors.darkTertiary,
                    true: Colors.accent + "60",
                  }}
                  thumbColor={
                    editTimeFlexible ? Colors.accent : "#636366"
                  }
                />
              </View>

              <Text style={styles.editLabel}>Location</Text>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setEditLocationId(null)}
                  style={[
                    styles.chip,
                    editLocationId === null && styles.chipSel,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      editLocationId === null && styles.chipTextSel,
                    ]}
                  >
                    Any
                  </Text>
                </Pressable>
                {UF_LOCATIONS.map((loc) => {
                  const sel = editLocationId === loc.id;
                  return (
                    <Pressable
                      key={loc.id}
                      onPress={() => setEditLocationId(loc.id)}
                      style={[styles.chip, sel && styles.chipSel]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sel && styles.chipTextSel,
                        ]}
                      >
                        {loc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.editLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Anything players should know..."
                placeholderTextColor={Colors.textMuted}
                maxLength={200}
                multiline
                numberOfLines={3}
              />

              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setEditing(false)}
                  style={({ pressed }) => [
                    styles.editCancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveEdit}
                  style={({ pressed }) => [
                    styles.editSaveBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.editSaveText}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {game.notes && !editing && (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{game.notes}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {user ? (
              <JoinButton
                gameId={game.id}
                userId={user.id}
                hasJoined={hasJoined}
                isFull={isFull}
                isHost={isHost}
                onToggle={refresh}
              />
            ) : (
              <Pressable
                onPress={handleJoinPress}
                style={({ pressed }) => [
                  styles.guestJoinBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <LinearGradient
                  colors={[...Gradient.brand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.guestJoinText}>Pull Up</Text>
                <Text style={styles.guestJoinSub}>Quick join — no account needed</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.secondaryRow}>
            <ActionChip label="🔗 Share" onPress={handleShare} />
            {isHost && !editing && (
              <ActionChip label="✏️ Edit" onPress={startEdit} />
            )}
            {hasJoined && (
              <ActionChip
                label="📊 Record Match"
                onPress={() => {
                  setTeamAssignments({});
                  setTeam1Score("0");
                  setTeam2Score("0");
                  setShowRecordMatch(true);
                }}
              />
            )}
            {hasJoined && (
              <ActionChip
                label="👥 Invite"
                onPress={() => {
                  fetchFriends();
                  setShowInviteFriends(true);
                }}
              />
            )}
            {isHost && (game.status === "open" || game.status === "full") && (
              <ActionChip
                label="▶ Start"
                onPress={() => setShowStartConfirm(true)}
              />
            )}
            {isHost && game.status === "started" && (
              <ActionChip
                label="⏹ End Game"
                onPress={() => setShowEndConfirm(true)}
                danger
              />
            )}
            {isHost && (game.status === "open" || game.status === "full") && (
              <ActionChip
                label="Cancel Game"
                onPress={handleCancel}
                danger
              />
            )}
          </View>

          <RosterList participants={participants} hostId={game.host_id} />

          {/* ═══ MATCH HISTORY ═══ */}
          {matches.length > 0 && (
            <View style={styles.matchSection}>
              <Text style={styles.matchSectionTitle}>Match History ({matches.length})</Text>
              {matches.slice(0, 5).map((match) => {
                const team1 = match.players.filter((p) => p.team === 1);
                const team2 = match.players.filter((p) => p.team === 2);
                const team1Win = match.team1_score > match.team2_score;
                const team2Win = match.team2_score > match.team1_score;
                return (
                  <View key={match.id} style={styles.matchCard}>
                    <View style={styles.matchRow}>
                      <View style={[styles.matchTeam, team1Win && styles.matchTeamWin]}>
                        <Text style={styles.matchTeamLabel}>{team1Win ? "🏆 " : ""}Team 1</Text>
                        <Text style={styles.matchScore}>{match.team1_score}</Text>
                        <Text style={styles.matchPlayers} numberOfLines={1}>
                          {team1.map((p) => p.guest_name ?? p.profile?.display_name ?? "Player").join(", ") || "—"}
                        </Text>
                      </View>
                      <Text style={styles.matchVs}>vs</Text>
                      <View style={[styles.matchTeam, team2Win && styles.matchTeamWin]}>
                        <Text style={styles.matchTeamLabel}>{team2Win ? "🏆 " : ""}Team 2</Text>
                        <Text style={styles.matchScore}>{match.team2_score}</Text>
                        <Text style={styles.matchPlayers} numberOfLines={1}>
                          {team2.map((p) => p.guest_name ?? p.profile?.display_name ?? "Player").join(", ") || "—"}
                        </Text>
                      </View>
                    </View>
                    {match.notes ? <Text style={styles.matchNotes}>{match.notes}</Text> : null}
                  </View>
                );
              })}
            </View>
          )}

          {/* ═══ INLINE CHAT ═══ */}
          {canChat && (
            <View style={styles.chatSection}>
              <Text style={styles.chatTitle}>
                Chat ({messages.length})
              </Text>
              {messages.length === 0 ? (
                <Text style={styles.chatEmpty}>
                  No messages yet — say hi!
                </Text>
              ) : (
                <FlatList
                  ref={chatListRef}
                  data={messages}
                  keyExtractor={(m) => m.id}
                  renderItem={({ item }) => (
                    <ChatMessage
                      content={item.content}
                      displayName={item.profiles?.display_name ?? null}
                      avatarUrl={item.profiles?.avatar_url ?? null}
                      createdAt={item.created_at}
                      isOwn={item.user_id === user?.id}
                    />
                  )}
                  style={styles.chatList}
                  scrollEnabled={false}
                />
              )}
              <ChatInput
                onSend={(content) => {
                  if (user) sendMessage(user.id, content);
                }}
              />
            </View>
          )}

          {!canChat && user && (
            <View style={styles.chatLockedBox}>
              <Text style={styles.chatLockedText}>
                Join to see the chat
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ═══ BIG CODE + QR MODAL ═══ */}
      <Modal
        visible={showBigCode}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBigCode(false)}
      >
        <Pressable
          style={styles.bigCodeOverlay}
          onPress={() => setShowBigCode(false)}
        >
          <Text style={styles.bigCodeTitle}>Game Code</Text>
          <Text style={styles.bigCodeValue}>{getGameCode(game.id)}</Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={getGameUrl(game.id)}
              size={200}
              backgroundColor="#FFD60A"
              color={Colors.dark}
            />
          </View>
          <Text style={styles.bigCodeHint}>Scan to join this game</Text>
          <Text style={styles.bigCodeDismiss}>Tap anywhere to dismiss</Text>
        </Pressable>
      </Modal>

      {/* ═══ RECORD MATCH MODAL ═══ */}
      <Modal
        visible={showRecordMatch}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRecordMatch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "85%" }]}>
            <Text style={styles.modalTitle}>📊 Record Match</Text>

            {/* Score inputs */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Team 1</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="number-pad"
                  value={team1Score}
                  onChangeText={setTeam1Score}
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.scoreVs}>—</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Team 2</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="number-pad"
                  value={team2Score}
                  onChangeText={setTeam2Score}
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Player team assignment */}
            <Text style={styles.assignTitle}>Assign Players to Teams</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {participants.map((p) => {
                const assigned = teamAssignments[p.user_id];
                return (
                  <View key={p.user_id} style={styles.assignRow}>
                    <Text style={styles.assignName} numberOfLines={1}>
                      {p.profile?.display_name ?? "Player"}
                    </Text>
                    <View style={styles.teamBtns}>
                      <Pressable
                        style={[styles.teamBtn, assigned === 1 && styles.teamBtnActive1]}
                        onPress={() =>
                          setTeamAssignments((prev) => ({ ...prev, [p.user_id]: 1 }))
                        }
                      >
                        <Text style={[styles.teamBtnText, assigned === 1 && styles.teamBtnTextActive]}>T1</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.teamBtn, assigned === 2 && styles.teamBtnActive2]}
                        onPress={() =>
                          setTeamAssignments((prev) => ({ ...prev, [p.user_id]: 2 }))
                        }
                      >
                        <Text style={[styles.teamBtnText, assigned === 2 && styles.teamBtnTextActive]}>T2</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {/* Guest players */}
              <View style={styles.guestSection}>
                <Text style={styles.guestSectionTitle}>Non-app players</Text>
                {team1Guests.map((g, i) => (
                  <View key={`t1g${i}`} style={styles.guestRow}>
                    <Text style={styles.guestTeamBadge}>T1</Text>
                    <Text style={styles.guestName}>{g.name}{g.email ? ` (${g.email})` : ""}</Text>
                    <Pressable onPress={() => setTeam1Guests((prev) => prev.filter((_, j) => j !== i))}>
                      <Text style={styles.guestRemove}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {team2Guests.map((g, i) => (
                  <View key={`t2g${i}`} style={styles.guestRow}>
                    <Text style={[styles.guestTeamBadge, { backgroundColor: "#4A90E2" + "33", color: "#4A90E2" }]}>T2</Text>
                    <Text style={styles.guestName}>{g.name}{g.email ? ` (${g.email})` : ""}</Text>
                    <Pressable onPress={() => setTeam2Guests((prev) => prev.filter((_, j) => j !== i))}>
                      <Text style={styles.guestRemove}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {addingGuestTeam !== null ? (
                  <View style={styles.addGuestForm}>
                    <Text style={styles.addGuestLabel}>Adding to Team {addingGuestTeam}</Text>
                    <TextInput
                      style={styles.guestInput}
                      placeholder="Name (or 'Unknown')"
                      placeholderTextColor={Colors.textMuted}
                      value={guestNameInput}
                      onChangeText={setGuestNameInput}
                      autoFocus
                    />
                    <TextInput
                      style={styles.guestInput}
                      placeholder="Email (optional)"
                      placeholderTextColor={Colors.textMuted}
                      value={guestEmailInput}
                      onChangeText={setGuestEmailInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                      <Pressable style={[styles.teamBtn, { flex: 1 }]} onPress={() => { setAddingGuestTeam(null); setGuestNameInput(""); setGuestEmailInput(""); }}>
                        <Text style={styles.teamBtnText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.teamBtnActive1, styles.teamBtn, { flex: 1 }]}
                        onPress={() => {
                          const name = guestNameInput.trim() || "Unknown";
                          const guest: GuestPlayer = { name, email: guestEmailInput.trim() || undefined };
                          if (addingGuestTeam === 1) setTeam1Guests((prev) => [...prev, guest]);
                          else setTeam2Guests((prev) => [...prev, guest]);
                          setAddingGuestTeam(null);
                          setGuestNameInput("");
                          setGuestEmailInput("");
                        }}
                      >
                        <Text style={[styles.teamBtnText, styles.teamBtnTextActive]}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <Pressable style={[styles.teamBtn, { flex: 1 }]} onPress={() => setAddingGuestTeam(1)}>
                      <Text style={styles.teamBtnText}>+ T1 Guest</Text>
                    </Pressable>
                    <Pressable style={[styles.teamBtn, { flex: 1 }]} onPress={() => setAddingGuestTeam(2)}>
                      <Text style={styles.teamBtnText}>+ T2 Guest</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => {
                  setShowRecordMatch(false);
                  setTeam1Guests([]);
                  setTeam2Guests([]);
                  setAddingGuestTeam(null);
                  setGuestNameInput("");
                  setGuestEmailInput("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, savingMatch && { opacity: 0.6 }]}
                disabled={savingMatch}
                onPress={async () => {
                  setSavingMatch(true);
                  const assignedPlayers = Object.entries(teamAssignments).map(
                    ([user_id, team]) => ({ user_id, team })
                  );
                  const result = await recordMatch(
                    game?.sport ?? "pickleball",
                    parseInt(team1Score) || 0,
                    parseInt(team2Score) || 0,
                    assignedPlayers,
                    user?.id ?? "unknown",
                    undefined,
                    team1Guests,
                    team2Guests
                  );
                  setSavingMatch(false);
                  if (!result.error) {
                    setShowRecordMatch(false);
                    setTeam1Guests([]);
                    setTeam2Guests([]);
                    setAddingGuestTeam(null);
                    setGuestNameInput("");
                    setGuestEmailInput("");
                  }
                }}
              >
                {savingMatch ? (
                  <ActivityIndicator size="small" color={Colors.dark} />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Match</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ START GAME CONFIRM ═══ */}
      <Modal
        visible={showStartConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start this PullUp?</Text>
            <Text style={[styles.modalSubtitle, { color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xl }]}>
              This marks the session as live. You can record matches and end the session when done.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowStartConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Not yet</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, updatingStatus && { opacity: 0.6 }]}
                disabled={updatingStatus}
                onPress={handleStartGame}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color={Colors.dark} />
                ) : (
                  <Text style={styles.modalConfirmText}>Start!</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ END GAME CONFIRM ═══ */}
      <Modal
        visible={showEndConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>End this PullUp?</Text>
            <Text style={{ color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
              This will mark the session as completed. All recorded matches will be saved.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowEndConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Keep going</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { backgroundColor: Colors.error }, updatingStatus && { opacity: 0.6 }]}
                disabled={updatingStatus}
                onPress={handleEndGame}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: Colors.white }]}>End Session</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ INVITE FRIENDS MODAL ═══ */}
      <Modal
        visible={showInviteFriends}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteFriends(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "75%" }]}>
            <Text style={styles.modalTitle}>👥 Invite Friends</Text>
            {friends.length === 0 ? (
              <Text style={{ color: Colors.textMuted, textAlign: "center", marginVertical: Spacing.xl }}>
                No friends yet. Add friends from your profile!
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
                {friends.map((f) => {
                  const alreadyJoined = participants.some((p) => p.user_id === f.profile.id);
                  const alreadyInvited = invitedIds.has(f.profile.id);
                  return (
                    <View key={f.id} style={styles.inviteFriendRow}>
                      <Text style={styles.inviteFriendName} numberOfLines={1}>
                        {f.profile.display_name ?? "Player"}
                      </Text>
                      {alreadyJoined ? (
                        <Text style={styles.inviteStatus}>Already in</Text>
                      ) : alreadyInvited ? (
                        <Text style={[styles.inviteStatus, { color: Colors.success }]}>Invited ✓</Text>
                      ) : (
                        <Pressable
                          style={styles.inviteBtn}
                          disabled={invitingId === f.profile.id}
                          onPress={async () => {
                            setInvitingId(f.profile.id);
                            await sendInvite(id as string, f.profile.id, user?.id ?? "");
                            setInvitedIds((prev) => new Set([...prev, f.profile.id]));
                            setInvitingId(null);
                          }}
                        >
                          {invitingId === f.profile.id ? (
                            <ActivityIndicator size="small" color={Colors.dark} />
                          ) : (
                            <Text style={styles.inviteBtnText}>Invite</Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <Pressable
              style={[styles.modalCancel, { marginTop: Spacing.lg, width: "100%" }]}
              onPress={() => setShowInviteFriends(false)}
            >
              <Text style={styles.modalCancelText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ═══ GUEST PROMPT MODAL ═══ */}
      <Modal
        visible={showGuestPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestPrompt(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGuestPrompt(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Join this game</Text>
            <Text style={styles.modalSubtitle}>
              Enter your name and email to pull up
            </Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
            />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />

            <Pressable
              onPress={handleGuestSubmit}
              style={({ pressed }) => [
                styles.modalSubmitBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.modalSubmitText}>
                {guestLoading ? "Joining..." : "Let's Go"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowGuestPrompt(false);
                router.push("/(auth)/login");
              }}
              style={styles.modalLoginLink}
            >
              <Text style={styles.modalLoginText}>
                Have an account? Log in
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* Small helper components */
function DetailRow({
  label,
  value,
  badge,
  last,
}: {
  label: string;
  value: string;
  badge?: string;
  last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={detailStyles.label}>{label}</Text>
      <View style={detailStyles.valueWrap}>
        <Text
          style={[
            detailStyles.value,
            label === "Level" && { textTransform: "capitalize" },
          ]}
        >
          {value}
        </Text>
        {badge && (
          <View style={detailStyles.badge}>
            <Text style={detailStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        actionStyles.chip,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[actionStyles.text, danger && { color: Colors.error }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "right",
  },
  badge: {
    backgroundColor: Colors.accent + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: "600",
  },
});

const actionStyles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
  },
  scroll: { paddingBottom: 40 },
  inner: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    padding: Spacing.xl,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroTime: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  countNum: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  countSlash: {
    fontSize: 28,
    color: Colors.textMuted,
    marginHorizontal: 2,
    fontWeight: "300",
  },
  countMax: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  countHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  progressBg: {
    width: "70%",
    height: 6,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  /* Game code */
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  codeTap: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  /* Big code modal */
  bigCodeOverlay: {
    flex: 1,
    backgroundColor: "#FFD60A",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  bigCodeTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.dark,
    opacity: 0.6,
    marginBottom: Spacing.sm,
  },
  bigCodeValue: {
    fontSize: 64,
    fontWeight: "900",
    color: Colors.dark,
    letterSpacing: 8,
    marginBottom: Spacing.xxxl,
  },
  qrWrap: {
    padding: Spacing.lg,
    backgroundColor: "#FFD60A",
    borderRadius: BorderRadius.lg,
  },
  bigCodeHint: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.dark,
    opacity: 0.7,
    marginTop: Spacing.xxl,
  },
  bigCodeDismiss: {
    fontSize: FontSize.sm,
    color: Colors.dark,
    opacity: 0.4,
    marginTop: Spacing.xl,
  },

  /* Detail card */
  detailCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Notes */
  notesCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  /* Actions */
  actions: { marginBottom: Spacing.lg },
  secondaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    flexWrap: "wrap",
  },

  /* Guest join button */
  guestJoinBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  guestJoinText: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.dark,
    letterSpacing: -0.3,
  },
  guestJoinSub: {
    fontSize: FontSize.xs,
    color: Colors.dark,
    opacity: 0.7,
    marginTop: 2,
  },

  /* Edit mode */
  editCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  editTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.accent,
    marginBottom: Spacing.lg,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSel: {
    backgroundColor: Colors.accent + "18",
    borderColor: Colors.accent + "80",
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chipTextSel: {
    color: Colors.accent,
    fontWeight: "600",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xxl,
    paddingVertical: Spacing.sm,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 22,
    color: Colors.text,
    fontWeight: "500",
    lineHeight: 24,
  },
  stepperNum: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  datePill: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  datePillText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  toggleLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: "500",
    flex: 1,
  },
  notesInput: {
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  editCancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: FontSize.sm,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  editSaveText: {
    color: Colors.dark,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },

  /* Chat */
  chatSection: {
    marginTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
  },
  chatTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chatEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xxl,
  },
  chatList: {
    marginBottom: Spacing.sm,
  },
  chatLockedBox: {
    marginTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
  },
  chatLockedText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  /* Guest modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.darkElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  modalSubmitBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  modalSubmitText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.dark,
  },
  modalLoginLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalLoginText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: FontSize.sm,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  modalConfirmText: {
    color: Colors.dark,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },

  /* Match history */
  matchSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  matchSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  matchCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchTeam: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  matchTeamWin: {
    backgroundColor: Colors.accent + "15",
  },
  matchTeamLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  matchScore: {
    fontSize: FontSize.xxxl,
    fontWeight: "900",
    color: Colors.text,
    lineHeight: 38,
  },
  matchPlayers: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  matchVs: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: "700",
    marginHorizontal: Spacing.sm,
  },
  matchNotes: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: "center",
    fontStyle: "italic",
  },

  /* LIVE badge */
  liveBadge: {
    backgroundColor: Colors.success + "22",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success,
    marginBottom: Spacing.sm,
  },
  liveBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.success,
    letterSpacing: 1,
  },

  /* Invite friends */
  inviteFriendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  inviteFriendName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inviteStatus: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  inviteBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 60,
    alignItems: "center",
  },
  inviteBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.dark,
  },

  /* Record match modal */
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  scoreBox: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  scoreInput: {
    width: 72,
    height: 72,
    backgroundColor: Colors.darkInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    textAlign: "center",
    fontSize: FontSize.xxxl,
    fontWeight: "900",
    color: Colors.text,
  },
  scoreVs: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  assignTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assignName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  teamBtns: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  teamBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.darkTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamBtnActive1: {
    backgroundColor: Colors.accent + "33",
    borderColor: Colors.accent,
  },
  teamBtnActive2: {
    backgroundColor: "#4A90E233",
    borderColor: "#4A90E2",
  },
  teamBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  teamBtnTextActive: {
    color: Colors.text,
  },

  /* Guest player section in record match modal */
  guestSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  guestSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  guestTeamBadge: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.accent,
    backgroundColor: Colors.accent + "22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  guestName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  guestRemove: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: "700",
    paddingHorizontal: Spacing.xs,
  },
  addGuestForm: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  addGuestLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  guestInput: {
    backgroundColor: Colors.darkInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
