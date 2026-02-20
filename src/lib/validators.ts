import { z } from "zod/v4";

export const emailSchema = z
  .string()
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const otpSchema = z.object({
  token: z.string().length(6, "Enter the 6-digit code"),
});

export const onboardingSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(30),
  preferred_sport: z.enum(["pickleball", "spikeball"]),
  skill_level: z.enum(["beginner", "intermediate", "advanced", "any"]),
  favorite_location_id: z.string().min(1, "Pick a favorite spot"),
});

export const createGameSchema = z.object({
  sport: z.enum(["pickleball", "spikeball"]),
  skill_level: z.enum(["beginner", "intermediate", "advanced", "any"]),
  location_id: z.string().min(1, "Select a location"),
  starts_at: z.date({ message: "Pick a date and time" }),
  max_players: z.number().min(2, "At least 2 players").max(20, "Max 20 players"),
  notes: z.string().max(200).optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(500, "Message too long (max 500 chars)"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
export type OnboardingForm = z.infer<typeof onboardingSchema>;
export type CreateGameForm = z.infer<typeof createGameSchema>;
export type MessageForm = z.infer<typeof messageSchema>;
