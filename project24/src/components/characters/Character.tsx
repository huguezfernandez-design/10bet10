"use client";

import { useId } from "react";
import type { AvatarArt, CharacterPose } from "@/game/types";

/**
 * Character rig shared by both avatars, so they always share proportions,
 * shading and face construction. Each pose is the SAME drawing with different
 * joint rotations (CSS, see globals.css → .rig) and expressions — identity never changes.
 *
 * viewBox 0 0 120 200, feet on y≈192.
 * To replace with final illustrations, set avatars.<her|him>.images.<pose> in the config.
 */

type Variant = "her" | "him";

interface Props {
  variant: Variant;
  pose?: CharacterPose;
  facing?: "left" | "right";
  size?: number; // rendered height in px
  art?: AvatarArt;
  className?: string;
  title?: string;
}

const SKIN = "#F2CDB2";
const SKIN_SHADE = "#D9A88A";
const INK = "#2A1B14";

export function Character({ variant, pose = "idle", facing = "right", size = 160, art, className, title }: Props) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, "");
  const width = (size * 120) / 200;
  const override = art?.images?.[pose] || art?.images?.idle;

  if (override) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={override}
        alt={title ?? ""}
        width={width}
        height={size}
        className={className}
        style={{ transform: facing === "left" ? "scaleX(-1)" : undefined, objectFit: "contain" }}
      />
    );
  }

  const expression: "neutral" | "joy" | "wow" =
    pose === "surprised" ? "wow" : pose === "celebrating" || pose === "happy" ? "joy" : "neutral";

  return (
    <svg
      viewBox="0 0 120 200"
      width={width}
      height={size}
      className={`rig ${className ?? ""}`}
      data-pose={pose}
      role="img"
      aria-label={title ?? (variant === "her" ? "Protagonista" : "Personaje en Madrid")}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`skin${id}`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#FBE0CB" />
          <stop offset="65%" stopColor={SKIN} />
          <stop offset="100%" stopColor={SKIN_SHADE} />
        </radialGradient>
        <linearGradient id={`limb${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#FBE0CB" />
          <stop offset="100%" stopColor={SKIN_SHADE} />
        </linearGradient>
        <radialGradient id={`shadow${id}`}>
          <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {variant === "her" ? (
          <>
            <linearGradient id={`hair${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A2C1E" />
              <stop offset="55%" stopColor="#2E1A11" />
              <stop offset="100%" stopColor="#1E110B" />
            </linearGradient>
            <linearGradient id={`vest${id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#2C3A5C" />
              <stop offset="55%" stopColor="#1F2A44" />
              <stop offset="100%" stopColor="#151D31" />
            </linearGradient>
            <pattern id={`stripe${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#F7F6F2" />
              <rect width="4" height="1.6" fill="#7FA3CF" />
            </pattern>
            <linearGradient id={`pants${id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#F1E9DA" />
              <stop offset="100%" stopColor="#CFC3AC" />
            </linearGradient>
          </>
        ) : (
          <>
            <radialGradient id={`hair${id}`} cx="40%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#8B5A36" />
              <stop offset="60%" stopColor="#6A4127" />
              <stop offset="100%" stopColor="#4A2C19" />
            </radialGradient>
            <linearGradient id={`shirt${id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#D5E3F1" />
              <stop offset="60%" stopColor="#B9CFE6" />
              <stop offset="100%" stopColor="#9DB7D3" />
            </linearGradient>
            <linearGradient id={`sweater${id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#2C3A5C" />
              <stop offset="100%" stopColor="#18213A" />
            </linearGradient>
            <linearGradient id={`pants${id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#D9C6A0" />
              <stop offset="100%" stopColor="#B59E74" />
            </linearGradient>
          </>
        )}
      </defs>

      {title ? <title>{title}</title> : null}

      <g style={{ transform: facing === "left" ? "scaleX(-1)" : undefined, transformOrigin: "60px 100px" }}>
        <ellipse cx="60" cy="193" rx="30" ry="6" fill={`url(#shadow${id})`} className="rig-shadow" />

        <g className="rig-figure">
          {/* Back hair (her) */}
          {variant === "her" && (
            <path
              d="M30 60 C26 34 42 20 60 20 C78 20 94 34 90 60 C92 82 96 108 92 128 C84 134 72 132 66 126 L54 126 C48 132 36 134 28 128 C24 108 28 82 30 60 Z"
              fill={`url(#hair${id})`}
            />
          )}

          {/* Legs */}
          <g className="rig-leg rig-leg-l">
            <path d="M47 140 h12 v40 q0 3 -3 3 h-6 q-3 0 -3 -3 z" fill={`url(#pants${id})`} />
            <path
              d={variant === "her" ? "M45 181 q8 -4 16 0 q2 6 -4 7 h-10 q-5 -1 -2 -7z" : "M44 180 q9 -4 17 0 q2 7 -4 8 h-11 q-5 -1 -2 -8z"}
              fill={variant === "her" ? "#3B2416" : "#6B4226"}
            />
            {variant === "her" && <path d="M47 183 h10" stroke="#C9A46A" strokeWidth="1" />}
          </g>
          <g className="rig-leg rig-leg-r">
            <path d="M61 140 h12 v40 q0 3 -3 3 h-6 q-3 0 -3 -3 z" fill={`url(#pants${id})`} />
            <path
              d={variant === "her" ? "M59 181 q8 -4 16 0 q2 6 -4 7 h-10 q-5 -1 -2 -7z" : "M59 180 q9 -4 17 0 q2 7 -4 8 h-11 q-5 -1 -2 -8z"}
              fill={variant === "her" ? "#3B2416" : "#6B4226"}
            />
            {variant === "her" && <path d="M61 183 h10" stroke="#C9A46A" strokeWidth="1" />}
          </g>

          {/* Torso */}
          <g className="rig-torso">
            {variant === "her" ? (
              <>
                <path d="M40 98 Q60 90 80 98 L84 146 Q60 152 36 146 Z" fill={`url(#stripe${id})`} />
                {/* quilted vest */}
                <path d="M41 98 Q50 94 55 96 L58 146 Q46 148 37 145 Z" fill={`url(#vest${id})`} />
                <path d="M79 98 Q70 94 65 96 L62 146 Q74 148 83 145 Z" fill={`url(#vest${id})`} />
                <path
                  d="M40 110 L56 104 M39 122 L57 116 M38 134 L57 128 M80 110 L64 104 M81 122 L63 116 M82 134 L63 128"
                  stroke="#3A4B72"
                  strokeWidth="0.9"
                  opacity="0.8"
                />
                {/* collar */}
                <path d="M52 92 L60 102 L68 92 L66 90 L60 96 L54 90 Z" fill="#FFFFFF" />
                {/* bag strap + bag */}
                <path d="M46 98 L80 136" stroke="#C9A46A" strokeWidth="1.4" />
                <rect x="76" y="132" width="14" height="11" rx="2.5" fill="#B88A55" />
                <rect x="76" y="132" width="14" height="4" rx="2" fill="#9C7142" />
                <circle cx="83" cy="137" r="1" fill="#E9D3A8" />
              </>
            ) : (
              <>
                <path d="M39 98 Q60 90 81 98 L84 146 Q60 152 36 146 Z" fill={`url(#shirt${id})`} />
                <path d="M60 100 V146" stroke="#8FA9C6" strokeWidth="0.8" />
                <circle cx="60" cy="112" r="0.9" fill="#F7F6F2" />
                <circle cx="60" cy="124" r="0.9" fill="#F7F6F2" />
                <circle cx="60" cy="136" r="0.9" fill="#F7F6F2" />
                <path d="M36 146 Q60 152 84 146 L84 142 Q60 148 36 142Z" fill="#6B4A2E" />
                {/* collar */}
                <path d="M51 91 L60 101 L56 104 L49 95 Z M69 91 L60 101 L64 104 L71 95 Z" fill="#E6EFF8" />
                {/* sweater on shoulders */}
                <path d="M36 98 Q60 88 84 98 L84 106 Q60 98 36 106 Z" fill={`url(#sweater${id})`} />
                <path d="M54 102 Q50 116 46 124 L51 125 Q56 114 60 104 Z" fill={`url(#sweater${id})`} />
                <path d="M66 102 Q70 116 74 124 L69 125 Q64 114 60 104 Z" fill={`url(#sweater${id})`} />
                <ellipse cx="60" cy="104" rx="5" ry="4" fill="#1A2440" />
                <path d="M46 123 h5 M69 123 h5" stroke="#3A4B72" strokeWidth="1" />
              </>
            )}
          </g>

          {/* Arms */}
          <g className="rig-arm rig-arm-l">
            <path
              d="M36 100 q-6 2 -6 10 l0 22 q0 4 5 4 h2 q4 0 4 -4 l1 -26 z"
              fill={variant === "her" ? `url(#stripe${id})` : `url(#shirt${id})`}
            />
            <circle cx="35" cy="140" r="5.2" fill={`url(#limb${id})`} />
          </g>
          <g className="rig-arm rig-arm-r">
            <path
              d="M84 100 q6 2 6 10 l0 22 q0 4 -5 4 h-2 q-4 0 -4 -4 l-1 -26 z"
              fill={variant === "her" ? `url(#stripe${id})` : `url(#shirt${id})`}
            />
            {variant === "him" && <rect x="80" y="131" width="9" height="3" rx="1" fill="#C9A46A" />}
            <circle cx="85" cy="140" r="5.2" fill={`url(#limb${id})`} />
          </g>

          {/* Neck + head */}
          <g className="rig-head">
            <path d="M54 82 h12 v12 q-6 4 -12 0 z" fill={SKIN_SHADE} />
            {variant === "him" && (
              <>
                <ellipse cx="33" cy="60" rx="4" ry="6" fill={SKIN} />
                <ellipse cx="87" cy="60" rx="4" ry="6" fill={SKIN} />
              </>
            )}
            <ellipse cx="60" cy="57" rx="27" ry="28" fill={`url(#skin${id})`} />

            <Face variant={variant} expression={expression} />

            {variant === "her" ? <HerHair id={id} /> : <HisHair id={id} />}
          </g>
        </g>
      </g>
    </svg>
  );
}

function Face({ variant, expression }: { variant: Variant; expression: "neutral" | "joy" | "wow" }) {
  const eyeY = 61;
  return (
    <g>
      {/* blush */}
      <ellipse cx="44" cy="71" rx="5" ry="3" fill="#EE9C8C" opacity="0.45" />
      <ellipse cx="76" cy="71" rx="5" ry="3" fill="#EE9C8C" opacity="0.45" />
      {/* brows */}
      {variant === "him" ? (
        <path d="M43 50 q6 -4 12 -1 M65 49 q6 -3 12 1" stroke="#4A2C19" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M44 51 q5 -3 10 -1 M66 50 q5 -2 10 1" stroke="#3A2418" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      )}
      {/* eyes */}
      {expression === "joy" ? (
        <path
          d={`M44 ${eyeY + 1} q5 -6 10 0 M66 ${eyeY + 1} q5 -6 10 0`}
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <>
          <ellipse cx="49" cy={eyeY} rx={expression === "wow" ? 4 : 3.3} ry={expression === "wow" ? 5 : 4.3} fill={INK} />
          <ellipse cx="71" cy={eyeY} rx={expression === "wow" ? 4 : 3.3} ry={expression === "wow" ? 5 : 4.3} fill={INK} />
          <circle cx="50.3" cy={eyeY - 1.8} r="1.3" fill="#fff" />
          <circle cx="72.3" cy={eyeY - 1.8} r="1.3" fill="#fff" />
          {variant === "her" && (
            <path d="M45.5 57.5 l-2.5 -1.6 M74.5 57.5 l2.5 -1.6" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
          )}
        </>
      )}
      {/* nose */}
      <path d="M59 66 q1.6 1.6 3 0" stroke={SKIN_SHADE} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* mouth */}
      {expression === "wow" ? (
        <ellipse cx="60" cy="74.5" rx="3.2" ry="4" fill="#7A3B33" />
      ) : expression === "joy" ? (
        <path d="M53 71 q7 9 14 0 z" fill="#7A3B33" stroke="#7A3B33" strokeWidth="1" strokeLinejoin="round" />
      ) : (
        <path d="M54.5 72 q5.5 5 11 0" stroke="#7A3B33" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      )}
      {variant === "her" && (
        <>
          <circle cx="33.5" cy="70" r="1.9" fill="#FBF7EE" stroke="#D8CFBF" strokeWidth="0.5" />
          <circle cx="86.5" cy="70" r="1.9" fill="#FBF7EE" stroke="#D8CFBF" strokeWidth="0.5" />
        </>
      )}
    </g>
  );
}

function HerHair({ id }: { id: string }) {
  return (
    <g>
      {/* crown */}
      <path
        d="M31 60 C28 36 42 24 60 24 C78 24 92 36 89 60 C86 46 76 34 60 34 C44 34 34 46 31 60 Z"
        fill={`url(#hair${id})`}
      />
      {/* curtain bangs — parted in the middle, swept to both sides */}
      <path
        d="M60 31 C49 31 37 39 33 55 C31 64 32 72 34 82 L38 82 C37 68 40 56 49 48 C54 44 58 40 60 36 Z"
        fill={`url(#hair${id})`}
      />
      <path
        d="M60 31 C71 31 83 39 87 55 C89 64 88 72 86 82 L82 82 C83 68 80 56 71 48 C66 44 62 40 60 36 Z"
        fill={`url(#hair${id})`}
      />
      {/* long side strands in front of the shoulders */}
      <path d="M33 62 C28 82 31 102 27 122 C33 125 40 120 41 108 C41 94 38 80 38 66 Z" fill={`url(#hair${id})`} />
      <path d="M87 62 C92 82 89 102 93 122 C87 125 80 120 79 108 C79 94 82 80 82 66 Z" fill={`url(#hair${id})`} />
      {/* sheen */}
      <path d="M44 32 Q56 26 70 30" stroke="#7A4E36" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M57 36 Q50 42 44 52" stroke="#5C3A28" strokeWidth="1" fill="none" opacity="0.8" />
      <path d="M63 36 Q70 42 76 52" stroke="#5C3A28" strokeWidth="1" fill="none" opacity="0.8" />
    </g>
  );
}

// Deterministic curl layout for the curly-haired character.
const CURLS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.02 + (0.96 * i) / (n - 1));
    const r = i % 2 ? 29 : 31;
    out.push([60 + Math.cos(a) * r, 50 + Math.sin(a) * (r - 4), i % 3 === 0 ? 7.5 : 6.5]);
  }
  // inner crown curls
  [[46, 30], [56, 26], [66, 27], [75, 32], [52, 36], [64, 35], [40, 40], [81, 41]].forEach(([x, y], i) =>
    out.push([x, y, i % 2 ? 6 : 7]),
  );
  // fringe curls falling on the forehead
  [[43, 44], [52, 42], [61, 43], [70, 41], [78, 45]].forEach(([x, y]) => out.push([x, y, 5.5]));
  return out;
})();

function HisHair({ id }: { id: string }) {
  return (
    <g>
      <path d="M31 56 C28 32 44 20 60 20 C76 20 92 32 89 56 C84 46 76 42 60 42 C44 42 36 46 31 56 Z" fill={`url(#hair${id})`} />
      {CURLS.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={`url(#hair${id})`} />
          <path
            d={`M${x - r * 0.45} ${y + r * 0.1} a ${r * 0.45} ${r * 0.45} 0 1 1 ${r * 0.6} ${r * 0.35}`}
            stroke="#3E2414"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
            opacity="0.75"
          />
          {i % 3 === 1 && (
            <path d={`M${x - r * 0.3} ${y - r * 0.5} q ${r * 0.3} -${r * 0.25} ${r * 0.6} 0`} stroke="#A0704A" strokeWidth="1" fill="none" />
          )}
        </g>
      ))}
    </g>
  );
}
