import type { Points } from "./config-types";

export interface ScoredAnswer {
  points: Points;
}

export interface ScoreResult {
  winner: string;
  scores: Record<string, number>;
}

/**
 * Sums the points of every answer and chooses the winning category.
 *
 * Tie-breaks, in order:
 *  1. Recency: among tied categories, the one that scored more in the LAST
 *     answer wins (then the previous one, and so on). The final, "gut" answer
 *     carries the most weight.
 *  2. The explicit `tieBreakOrder` list from the config.
 *  3. Alphabetical (fully deterministic).
 */
export function scoreAnswers(categories: string[], answers: ScoredAnswer[], tieBreakOrder: string[] = []): ScoreResult {
  if (categories.length === 0) throw new Error("No categories");
  const scores: Record<string, number> = Object.fromEntries(categories.map((c) => [c, 0]));
  for (const a of answers) {
    for (const [cat, pts] of Object.entries(a.points)) {
      if (cat in scores && Number.isFinite(pts)) scores[cat] += pts;
    }
  }
  const max = Math.max(...Object.values(scores));
  let tied = categories.filter((c) => scores[c] === max);

  for (let i = answers.length - 1; i >= 0 && tied.length > 1; i--) {
    const p = answers[i].points;
    const best = Math.max(...tied.map((c) => p[c] ?? 0));
    tied = tied.filter((c) => (p[c] ?? 0) === best);
  }
  if (tied.length > 1) {
    const rank = (c: string) => {
      const i = tieBreakOrder.indexOf(c);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    tied.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }
  return { winner: tied[0], scores };
}
