import { setPendingRedirect, consumePendingRedirect, peekPendingRedirect } from "../redirectStore";

// Mock sessionStorage for React Native test environment
const store: Record<string, string> = {};
Object.defineProperty(global, "window", { value: global, writable: true });
Object.defineProperty(global, "sessionStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  },
  writable: true,
});

describe("redirectStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and consumes a redirect URL", () => {
    setPendingRedirect("/game/123");
    expect(consumePendingRedirect()).toBe("/game/123");
  });

  it("returns null after consuming", () => {
    setPendingRedirect("/game/123");
    consumePendingRedirect();
    expect(consumePendingRedirect()).toBe(null);
  });

  it("returns null when nothing is stored", () => {
    expect(consumePendingRedirect()).toBe(null);
  });

  it("peek returns the URL without removing it", () => {
    setPendingRedirect("/join/ABC");
    expect(peekPendingRedirect()).toBe("/join/ABC");
    expect(peekPendingRedirect()).toBe("/join/ABC"); // still there
  });

  it("consume removes what peek can see", () => {
    setPendingRedirect("/join/ABC");
    expect(peekPendingRedirect()).toBe("/join/ABC");
    consumePendingRedirect();
    expect(peekPendingRedirect()).toBe(null);
  });

  it("overwrites previous redirect", () => {
    setPendingRedirect("/first");
    setPendingRedirect("/second");
    expect(consumePendingRedirect()).toBe("/second");
  });
});
