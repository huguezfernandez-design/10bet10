import { describe, expect, it } from "vitest";
import { scoreAnswers } from "@/server/scoring";

const CATS = ["DINNER", "COMEDY", "WINE", "GETAWAY"];

describe("scoreAnswers", () => {
  it("sums points and picks the highest category", () => {
    const r = scoreAnswers(CATS, [{ points: { DINNER: 2, GETAWAY: 1 } }, { points: { DINNER: 3 } }, { points: { WINE: 3 } }, { points: { COMEDY: 3 } }]);
    expect(r.scores).toEqual({ DINNER: 5, COMEDY: 3, WINE: 3, GETAWAY: 1 });
    expect(r.winner).toBe("DINNER");
  });

  it("breaks ties with the most recent answer", () => {
    // WINE 3 vs COMEDY 3; last answer favoured COMEDY
    const r = scoreAnswers(CATS, [{ points: { WINE: 3 } }, { points: { COMEDY: 3 } }]);
    expect(r.winner).toBe("COMEDY");
  });

  it("walks back through answers when the last one does not decide", () => {
    const r = scoreAnswers(CATS, [{ points: { WINE: 3 } }, { points: { COMEDY: 3 } }, { points: { WINE: 1, COMEDY: 1 } }]);
    // tie at 4-4, last answer tied 1-1, previous answer favoured COMEDY
    expect(r.winner).toBe("COMEDY");
  });

  it("falls back to tieBreakOrder, then alphabetical", () => {
    const pts = [{ points: { WINE: 2, DINNER: 2 } }];
    expect(scoreAnswers(CATS, pts, ["WINE", "DINNER"]).winner).toBe("WINE");
    expect(scoreAnswers(CATS, pts, []).winner).toBe("DINNER");
  });

  it("ignores unknown categories and non-finite values", () => {
    const r = scoreAnswers(CATS, [{ points: { HACK: 99, GETAWAY: Number.NaN, COMEDY: 1 } }]);
    expect(r.winner).toBe("COMEDY");
    expect(r.scores).not.toHaveProperty("HACK");
  });

  it("is deterministic with no answers", () => {
    expect(scoreAnswers(CATS, [], ["GETAWAY"]).winner).toBe("GETAWAY");
  });
});
