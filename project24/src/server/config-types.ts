import "server-only";
import type { PublicConfig, PublicStop } from "@/game/types";

/** Points that an answer adds to each internal category (e.g. { DINNER: 2, WINE: 1 }). */
export type Points = Record<string, number>;

export interface SecretOption {
  id: string;
  text: string;
  points: Points;
}

export interface SecretMission {
  title: string;
  riddle: string[];
  expectedObject: string;
  acceptable: string[];
  /** Things that look similar but must be rejected (helps the vision model). */
  rejectExamples: string[];
  successMessage: string;
  errorMessage: string;
}

export interface SecretStop extends Omit<PublicStop, "mission" | "question"> {
  mission?: SecretMission;
  question?: { prompt: string; options: SecretOption[] };
}

export interface Gift {
  kicker: string;
  headline: string;
  body: string[];
  signoff: string;
  image: string;
  art: "table" | "stage" | "glass" | "mountain" | "none";
  palette: { bg: string; fg: string; accent: string };
  layout: "split" | "poster" | "stack" | "frame";
}

/** Full configuration. Never send this object to the browser. */
export interface GameConfig extends Omit<PublicConfig, "stops"> {
  stops: SecretStop[];
  gifts: Record<string, Gift>;
  scoring: {
    /** Used only when scores AND recency tie-break are still equal. */
    tieBreakOrder: string[];
  };
}
