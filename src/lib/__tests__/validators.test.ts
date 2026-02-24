import {
  loginSchema,
  signupSchema,
  otpSchema,
  onboardingSchema,
  createGameSchema,
  messageSchema,
} from "../validators";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 8-char password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "12345678" });
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  it("accepts valid data", () => {
    const result = signupSchema.safeParse({ email: "new@user.com", password: "securepass" });
    expect(result.success).toBe(true);
  });

  it("has same validation rules as loginSchema", () => {
    const invalidEmail = { email: "bad", password: "password123" };
    expect(loginSchema.safeParse(invalidEmail).success).toBe(
      signupSchema.safeParse(invalidEmail).success
    );
  });
});

describe("otpSchema", () => {
  it("accepts 6-digit code", () => {
    const result = otpSchema.safeParse({ token: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects 5-digit code", () => {
    const result = otpSchema.safeParse({ token: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects 7-digit code", () => {
    const result = otpSchema.safeParse({ token: "1234567" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = otpSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });

  it("accepts 6-char alphabetic string (code is string, not numeric)", () => {
    const result = otpSchema.safeParse({ token: "abcdef" });
    expect(result.success).toBe(true);
  });
});

describe("onboardingSchema", () => {
  it("accepts valid display name", () => {
    const result = onboardingSchema.safeParse({ display_name: "John" });
    expect(result.success).toBe(true);
  });

  it("rejects single character name", () => {
    const result = onboardingSchema.safeParse({ display_name: "J" });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2-char name", () => {
    const result = onboardingSchema.safeParse({ display_name: "Jo" });
    expect(result.success).toBe(true);
  });

  it("rejects name over 30 chars", () => {
    const result = onboardingSchema.safeParse({ display_name: "A".repeat(31) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 30-char name", () => {
    const result = onboardingSchema.safeParse({ display_name: "A".repeat(30) });
    expect(result.success).toBe(true);
  });
});

describe("createGameSchema", () => {
  const validGame = {
    sport: "pickleball" as const,
    skill_level: "intermediate" as const,
    starts_at: new Date(),
    max_players: 4,
  };

  it("accepts valid game with required fields", () => {
    const result = createGameSchema.safeParse(validGame);
    expect(result.success).toBe(true);
  });

  it("accepts valid game with all optional fields", () => {
    const result = createGameSchema.safeParse({
      ...validGame,
      location_id: "loc_123",
      notes: "Bring your own paddle",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sport", () => {
    const result = createGameSchema.safeParse({ ...validGame, sport: "baseball" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid sports", () => {
    for (const sport of ["pickleball", "spikeball", "running", "volleyball"]) {
      const result = createGameSchema.safeParse({ ...validGame, sport });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid skill level", () => {
    const result = createGameSchema.safeParse({ ...validGame, skill_level: "pro" });
    expect(result.success).toBe(false);
  });

  it("rejects max_players below 2", () => {
    const result = createGameSchema.safeParse({ ...validGame, max_players: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects max_players above 20", () => {
    const result = createGameSchema.safeParse({ ...validGame, max_players: 21 });
    expect(result.success).toBe(false);
  });

  it("accepts max_players at boundaries (2 and 20)", () => {
    expect(createGameSchema.safeParse({ ...validGame, max_players: 2 }).success).toBe(true);
    expect(createGameSchema.safeParse({ ...validGame, max_players: 20 }).success).toBe(true);
  });

  it("rejects notes over 200 chars", () => {
    const result = createGameSchema.safeParse({ ...validGame, notes: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects string instead of Date for starts_at", () => {
    const result = createGameSchema.safeParse({ ...validGame, starts_at: "2025-01-01" });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("accepts valid message", () => {
    const result = messageSchema.safeParse({ content: "Hello!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = messageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 500 chars", () => {
    const result = messageSchema.safeParse({ content: "A".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 500-char message", () => {
    const result = messageSchema.safeParse({ content: "A".repeat(500) });
    expect(result.success).toBe(true);
  });
});
