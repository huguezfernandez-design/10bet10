// Shared types. Everything in this file is safe for the browser.
// Secret data (expected objects, scoring, gifts) lives only in server types.

export type SceneKind = "coast" | "cathedral" | "plaza" | "aqueduct" | "capital" | "village";

export type CharacterPose =
  | "idle"
  | "walking"
  | "celebrating"
  | "surprised"
  | "happy"
  | "greeting";

export interface Theme {
  paper: string; // blanco roto
  ink: string; // negro
  warm: string; // gris cálido
  white: string;
  accent: string; // detalle (usado con moderación)
}

export interface AvatarArt {
  /** Optional image URLs per pose. If empty, the built-in SVG rig is used. */
  images: Partial<Record<CharacterPose, string>>;
  name: string;
}

export interface PublicOption {
  id: string;
  text: string;
}

export interface PublicStop {
  id: string;
  name: string;
  region: string;
  lon: number;
  lat: number;
  scene: SceneKind;
  /** e.g. "LEVEL 01" (empty for the origin) */
  levelLabel: string;
  /** short line shown while travelling TO this stop */
  travelQuip: string;
  /** shown on the arrival card */
  arrivalLine: string;
  mission?: {
    title: string;
    riddle: string[];
  };
  question?: {
    prompt: string;
    options: PublicOption[];
  };
}

export interface DialogueLine {
  speaker: "her" | "him" | "narrator";
  text: string;
}

export interface PublicConfig {
  meta: { title: string; subtitle: string; tagline: string; place: string; year: string };
  theme: Theme;
  start: { kicker: string; body: string[]; cta: string };
  briefing: { lines: string[]; cta: string };
  stops: PublicStop[];
  missionUi: {
    destinationReached: string;
    missionLabel: string;
    findTitle: string;
    findSubtitle: string;
    uploadCta: string;
    takePhoto: string;
    choosePhoto: string;
    retake: string;
    send: string;
    analyzing: string[];
    successTitle: string;
    retryTitle: string;
    retryMessage: string;
    questionKicker: string;
    continueCta: string;
  };
  madrid: {
    meeting: DialogueLine[];
    welcomeTitle: string;
    reached: string;
    line: string;
    finalMissionCta: string;
  };
  finale: {
    title: string;
    lines: string[];
    suspense: string[];
    cta: string;
    /** Last screen, after the gift: a personal dedication. */
    dedication: { button: string; kicker: string; lines: string[] };
  };
  avatars: { her: AvatarArt; him: AvatarArt };
}

export type Stage =
  | "welcome"
  | "briefing"
  | "traveling"
  | "meeting"
  | "mission"
  | "question"
  | "finished";

export type MissionStatus = "locked" | "active" | "verified" | "answered";

/** Game state as seen by the player. Contains no scoring information. */
export interface PublicGameState {
  stage: Stage;
  /** current level (index into stops). 0 = origin */
  level: number;
  missions: MissionStatus[];
  demoMode: boolean;
}

export interface VerifyResponse {
  valid: boolean;
  detected_object: string;
  message: string;
  demo?: boolean;
  state: PublicGameState;
}

export interface RevealPayload {
  kicker: string;
  headline: string;
  body: string[];
  signoff: string;
  image: string; // URL or ""
  art: string; // trusted inline SVG from server
  palette: { bg: string; fg: string; accent: string };
  layout: "split" | "poster" | "stack" | "frame";
}
