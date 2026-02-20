// PullUp Brand — Dark mode + Nano Banana gradient
export const Colors = {
  // Gradient endpoints
  gradientStart: "#FFD60A",
  gradientEnd: "#FF9500",
  // Solid accent (midpoint)
  accent: "#FFB800",
  accentLight: "#FFD60A",
  // Dark surfaces
  dark: "#0D0D0F",
  darkElevated: "#1A1A1E",
  darkCard: "#222226",
  darkTertiary: "#2E2E33",
  darkInput: "#18181C",
  // Text on dark
  text: "#FFFFFF",
  textSecondary: "#A1A1A6",
  textMuted: "#636366",
  // Semantic
  success: "#30D158",
  error: "#FF453A",
  warning: "#FFD60A",
  // Utility
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.7)",
  // Aliases
  primary: "#FFB800",
  secondary: "#FF9500",
  background: "#0D0D0F",
  card: "#1A1A1E",
  border: "#2E2E33",
} as const;

export const Gradient = {
  brand: ["#FFD60A", "#FF9500"] as const,
  brandSubtle: ["rgba(255,214,10,0.15)", "rgba(255,149,0,0.05)"] as const,
  darkSurface: ["#0D0D0F", "#0A0A0C"] as const,
  cardShine: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0)"] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 44,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export type Sport =
  | "pickleball"
  | "spikeball"
  | "running"
  | "volleyball"
  | "climbing"
  | "soccer"
  | "football"
  | "basketball"
  | "frisbee"
  | "tennis"
  | "badminton";

export type SkillLevel =
  | "any"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  // Climbing V-grades
  | "v0-v3"
  | "v4-v6"
  | "v7-v10"
  | "v11plus"
  // Tennis NTRP
  | "ntrp-2.5"
  | "ntrp-3.0"
  | "ntrp-3.5"
  | "ntrp-4.0"
  | "ntrp-4.5plus";

export type GameStatus = "open" | "full" | "started" | "cancelled" | "completed";

export const SPORTS: { value: Sport; label: string; emoji: string; teamBased: boolean; maxPlayersDefault: number }[] = [
  { value: "pickleball", label: "Pickleball", emoji: "🏓", teamBased: true, maxPlayersDefault: 4 },
  { value: "spikeball", label: "Spikeball", emoji: "🔵", teamBased: true, maxPlayersDefault: 4 },
  { value: "volleyball", label: "Volleyball", emoji: "🏐", teamBased: true, maxPlayersDefault: 12 },
  { value: "basketball", label: "Basketball", emoji: "🏀", teamBased: true, maxPlayersDefault: 10 },
  { value: "soccer", label: "Soccer", emoji: "⚽", teamBased: true, maxPlayersDefault: 14 },
  { value: "football", label: "Flag Football", emoji: "🏈", teamBased: true, maxPlayersDefault: 14 },
  { value: "frisbee", label: "Ultimate Frisbee", emoji: "🥏", teamBased: true, maxPlayersDefault: 14 },
  { value: "tennis", label: "Tennis", emoji: "🎾", teamBased: true, maxPlayersDefault: 4 },
  { value: "badminton", label: "Badminton", emoji: "🏸", teamBased: true, maxPlayersDefault: 4 },
  { value: "climbing", label: "Climbing", emoji: "🧗", teamBased: false, maxPlayersDefault: 8 },
  { value: "running", label: "Running", emoji: "🏃", teamBased: false, maxPlayersDefault: 20 },
];

export function sportInfo(sport: string) {
  return SPORTS.find((s) => s.value === sport) ?? { emoji: "🎯", label: sport };
}

export function equipmentLabel(sport: string) {
  switch (sport) {
    case "pickleball": return "paddles";
    case "spikeball": return "a Spikeball set";
    case "volleyball": return "a ball";
    case "basketball": return "a ball";
    case "soccer": return "a ball + cleats";
    case "football": return "a football + flags";
    case "frisbee": return "a disc";
    case "tennis": return "rackets + balls";
    case "badminton": return "rackets + shuttlecock";
    case "climbing": return "shoes + chalk";
    case "running": return "running shoes";
    default: return "equipment";
  }
}

export function sportDescription(sport: string): string {
  switch (sport) {
    case "pickleball": return "2v2 or 1v1 paddle sport";
    case "spikeball": return "2v2 roundnet game";
    case "volleyball": return "6v6 net sport";
    case "basketball": return "5v5 half or full court";
    case "soccer": return "7v7 or 11v11 on grass";
    case "football": return "Flag football, 7v7";
    case "frisbee": return "7v7 ultimate frisbee";
    case "tennis": return "Singles or doubles";
    case "badminton": return "Singles or doubles";
    case "climbing": return "Bouldering or top rope session";
    case "running": return "Group run";
    default: return sport;
  }
}

// Generic skill levels (used by most sports)
export const GENERIC_SKILL_LEVELS: { value: SkillLevel; label: string; description?: string }[] = [
  { value: "any", label: "Any Level", description: "All skill levels welcome" },
  { value: "beginner", label: "Beginner", description: "New to the sport" },
  { value: "intermediate", label: "Intermediate", description: "Knows the rules, plays regularly" },
  { value: "advanced", label: "Advanced", description: "Competitive experience" },
  { value: "expert", label: "Expert", description: "Elite / tournament level" },
];

export const CLIMBING_SKILL_LEVELS: { value: SkillLevel; label: string; description?: string }[] = [
  { value: "any", label: "Any Level", description: "All climbers welcome" },
  { value: "v0-v3", label: "V0–V3", description: "Learning movement basics" },
  { value: "v4-v6", label: "V4–V6", description: "Solid technique, working harder problems" },
  { value: "v7-v10", label: "V7–V10", description: "Strong climber, projecting hard routes" },
  { value: "v11plus", label: "V11+", description: "Elite level" },
];

export const TENNIS_SKILL_LEVELS: { value: SkillLevel; label: string; description?: string }[] = [
  { value: "any", label: "Any Level" },
  { value: "ntrp-2.5", label: "NTRP 2.5", description: "Beginner, learning strokes" },
  { value: "ntrp-3.0", label: "NTRP 3.0", description: "Consistent on medium-paced shots" },
  { value: "ntrp-3.5", label: "NTRP 3.5", description: "Reliable strokes, starting strategy" },
  { value: "ntrp-4.0", label: "NTRP 4.0", description: "Consistent and dependable in strokes" },
  { value: "ntrp-4.5plus", label: "NTRP 4.5+", description: "Strong competitive player" },
];

export function getSkillLevels(sport?: string) {
  switch (sport) {
    case "climbing": return CLIMBING_SKILL_LEVELS;
    case "tennis": return TENNIS_SKILL_LEVELS;
    default: return GENERIC_SKILL_LEVELS;
  }
}

// Keep SKILL_LEVELS as alias for backward compatibility
export const SKILL_LEVELS = GENERIC_SKILL_LEVELS;

export const UF_LOCATIONS = [
  { id: "flavet", name: "Flavet Field", lat: 29.6499, lng: -82.3486 },
  { id: "sw-rec-indoor", name: "SW Rec (Indoor)", lat: 29.6397, lng: -82.3534 },
  { id: "sw-rec-outdoor", name: "SW Rec (Outdoor)", lat: 29.6393, lng: -82.3539 },
  { id: "lake-alice", name: "Lake Alice Fields", lat: 29.6428, lng: -82.3614 },
  { id: "reitz-lawn", name: "Reitz Lawn", lat: 29.6462, lng: -82.3478 },
  { id: "hume", name: "Hume Field", lat: 29.6449, lng: -82.3404 },
  { id: "ring-road", name: "Ring Road Fields", lat: 29.6501, lng: -82.3408 },
] as const;

export const PACE_OPTIONS = [
  { value: "casual", label: "Casual", emoji: "🚶" },
  { value: "moderate", label: "Moderate", emoji: "🏃" },
  { value: "fast", label: "Fast", emoji: "⚡" },
] as const;

export const DISTANCE_OPTIONS = [1, 2, 3, 5, 8, 10] as const;

export const UF_CAMPUS_CENTER = {
  latitude: 29.6436,
  longitude: -82.3549,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export const APP_URL = "https://pullup-sepia.vercel.app";

export function getGameCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function getGameUrl(id: string): string {
  return `${APP_URL}/game/${id}`;
}

export function getInviteUrl(userId: string): string {
  return `${APP_URL}/add-friend/${userId}`;
}

export function getReferralUrl(code: string): string {
  return `${APP_URL}/join/${code}`;
}
