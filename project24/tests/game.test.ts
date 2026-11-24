import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "@/content/default-config";
import { getDefaultConfig, toPublic, validateConfig } from "@/server/config";
import { applyAction, applyAnswer, freshData, GameError, markVerified, isTokenShaped, newToken } from "@/server/games";
import { sniffImage } from "@/server/vision";

const cfg = getDefaultConfig();

function play(choices: string[]) {
  const d = freshData(cfg);
  applyAction(d, "start", cfg);
  applyAction(d, "depart", cfg);
  for (let lvl = 1; lvl <= 4; lvl++) {
    applyAction(d, "arrive", cfg);
    if (lvl === 4) {
      expect(d.stage).toBe("meeting");
      applyAction(d, "meet", cfg);
    }
    expect(d.stage).toBe("mission");
    markVerified(d, "ai", "x");
    applyAnswer(d, choices[lvl - 1], lvl, cfg);
  }
  return d;
}

describe("game state machine", () => {
  it("completes a full game and decides the gift on the server", () => {
    const d = play(["b", "c", "b", "a"]); // DINNER 3, GETAWAY 3, DINNER 3, WINE 3
    expect(d.stage).toBe("finished");
    expect(d.result?.gift).toBe("DINNER");
    expect(d.result?.scores.DINNER).toBe(6);
    expect(d.answers).toHaveLength(4);
  });

  it.each([
    [["a", "c", "d", "c"], "GETAWAY"],
    [["c", "a", "c", "d"], "COMEDY"],
    [["d", "b", "a", "a"], "WINE"],
    [["b", "d", "b", "b"], "DINNER"],
  ])("answers %j lead to %s", (choices, gift) => {
    expect(play(choices as string[]).result?.gift).toBe(gift);
  });

  it("every category can win", () => {
    const winners = new Set<string>();
    const opts = ["a", "b", "c", "d"];
    for (const a of opts) for (const b of opts) for (const c of opts) for (const e of opts) winners.add(play([a, b, c, e]).result!.gift);
    expect([...winners].sort()).toEqual(["COMEDY", "DINNER", "GETAWAY", "WINE"]);
  });

  it("cannot answer before the photo is verified", () => {
    const d = freshData(cfg);
    applyAction(d, "start", cfg);
    applyAction(d, "depart", cfg);
    applyAction(d, "arrive", cfg);
    expect(() => applyAnswer(d, "a", 1, cfg)).toThrow(GameError);
  });

  it("cannot verify while travelling or answer for another level", () => {
    const d = freshData(cfg);
    applyAction(d, "start", cfg);
    applyAction(d, "depart", cfg);
    expect(() => markVerified(d, "ai", "x")).toThrow(GameError);
    applyAction(d, "arrive", cfg);
    markVerified(d, "ai", "x");
    expect(() => applyAnswer(d, "a", 3, cfg)).toThrow(GameError);
    expect(() => applyAnswer(d, "zzz", 1, cfg)).toThrow(GameError);
  });

  it("ignores out-of-order actions (no level skipping)", () => {
    const d = freshData(cfg);
    applyAction(d, "arrive", cfg);
    applyAction(d, "meet", cfg);
    expect(d.stage).toBe("welcome");
    expect(d.level).toBe(0);
  });
});

describe("secrets never reach the browser", () => {
  const pub = JSON.stringify(toPublic(DEFAULT_CONFIG));
  it("strips scoring, gifts and expected objects", () => {
    for (const secret of ["points", "gifts", "scoring", "expectedObject", "acceptable", "rejectExamples", "successMessage"]) {
      expect(pub).not.toContain(`"${secret}"`);
    }
    for (const cat of Object.keys(DEFAULT_CONFIG.gifts)) expect(pub).not.toContain(cat);
    for (const g of Object.values(DEFAULT_CONFIG.gifts)) expect(pub).not.toContain(g.headline);
    for (const s of DEFAULT_CONFIG.stops) if (s.mission) expect(pub).not.toContain(`"${s.mission.expectedObject}"`);
  });
});

describe("config + helpers", () => {
  it("default config is valid", () => {
    expect(validateConfig(structuredClone(DEFAULT_CONFIG))).toEqual([]);
  });
  it("rejects unknown categories in points", () => {
    const c = structuredClone(DEFAULT_CONFIG);
    c.stops[1].question!.options[0].points = { NOPE: 1 };
    expect(validateConfig(c).join()).toContain("NOPE");
  });
  it("tokens are long and URL safe", () => {
    const t = newToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(isTokenShaped(t)).toBe(true);
    expect(isTokenShaped("../etc")).toBe(false);
  });
  it("sniffs image formats from magic bytes", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
});
