"use client";

import { memo, useMemo } from "react";
import { NEIGHBOURS, SPAIN_ISLANDS, SPAIN_MAINLAND } from "@/game/geo.generated";
import { RANGES, RIVERS, ROADS, SEA_LABELS, TOWNS, type LL } from "@/game/mapdata";
import { project, WORLD_H, WORLD_W } from "@/game/projection";
import { distToSegment, inPolygon, mulberry32, parsePolygons, smoothPath, type Pt } from "@/game/route";

/**
 * LAYER 1 (territory) + LAYER 2 (scenery: roads, vegetation, towns, ambient life).
 * Static: rendered once and never re-rendered while the camera or the character move.
 */

const P = (ll: LL): Pt => project(ll[0], ll[1]);

interface Props {
  /** Route points, used to keep scenery off the road. */
  avoid: Pt[];
}

export const Terrain = memo(function Terrain({ avoid }: Props) {
  const data = useMemo(() => buildScenery(avoid), [avoid]);

  return (
    <g>
      <defs>
        <linearGradient id="t-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9D0CC" />
          <stop offset="1" stopColor="#A6C2C0" />
        </linearGradient>
        <linearGradient id="t-land" x1="0" y1="60" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0.08" stopColor="#A9BC8E" />
          <stop offset="0.2" stopColor="#BFC497" />
          <stop offset="0.38" stopColor="#D2C99F" />
          <stop offset="0.7" stopColor="#DCCB9B" />
          <stop offset="1" stopColor="#D9C08E" />
        </linearGradient>
        <radialGradient id="t-green" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8FA978" stopOpacity="0.85" />
          <stop offset="1" stopColor="#8FA978" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="t-ochre" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#D9BF86" stopOpacity="0.7" />
          <stop offset="1" stopColor="#D9BF86" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="t-field" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E3CF95" stopOpacity="0.75" />
          <stop offset="1" stopColor="#E3CF95" stopOpacity="0" />
        </radialGradient>
        <clipPath id="t-clip">
          <path d={SPAIN_MAINLAND} />
        </clipPath>
        <pattern id="t-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M0 0 V6" stroke="#B8A57A" strokeWidth="0.6" opacity="0.35" />
        </pattern>
        <symbol id="t-tree" viewBox="-6 -12 12 14" overflow="visible">
          <ellipse cx="0" cy="1" rx="4" ry="1.4" fill="#5F6B47" opacity="0.25" />
          <path d="M0 -11 C4 -11 5.5 -6 5 -3 C4.5 0 2 1 0 1 C-2 1 -4.5 0 -5 -3 C-5.5 -6 -4 -11 0 -11Z" fill="#6E8A5A" />
          <path d="M0 -11 C4 -11 5.5 -6 5 -3 C4.5 0 2 1 0 1 Z" fill="#5A7549" />
          <path d="M-2.6 -7.5 q1.3 -2 3 -2.2" stroke="#A3BC86" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="t-pine" viewBox="-5 -14 10 16" overflow="visible">
          <ellipse cx="0" cy="1" rx="3.4" ry="1.2" fill="#4E5A3B" opacity="0.25" />
          <path d="M0 -14 L4.5 -3 L1 -3 L1 1 L-1 1 L-1 -3 L-4.5 -3 Z" fill="#4F6A45" />
          <path d="M0 -14 L4.5 -3 L1 -3 L1 1 L0 1 Z" fill="#3F5838" />
        </symbol>
        <symbol id="t-olive" viewBox="-4 -6 8 8" overflow="visible">
          <circle cx="0" cy="-2.5" r="2.4" fill="#8E9A67" />
          <circle cx="0.8" cy="-2" r="1.6" fill="#7A8657" />
        </symbol>
        <symbol id="t-house" viewBox="-5 -8 10 10" overflow="visible">
          <path d="M-4 -3 L0 -6.5 L4 -3 L4 1 L-4 1Z" fill="#F4EEDF" />
          <path d="M0 -6.5 L4 -3 L4 1 L0 1Z" fill="#DCD2BC" />
          <path d="M-4.8 -2.6 L0 -7.2 L4.8 -2.6" fill="none" stroke="#B4614A" strokeWidth="1.8" strokeLinejoin="round" />
        </symbol>
      </defs>

      {/* Sea */}
      <rect x={-2000} y={-2000} width={WORLD_W + 4000} height={WORLD_H + 4000} fill="url(#t-sea)" />
      <g opacity="0.5">
        {data.waves.map((w, i) => (
          <path
            key={i}
            d={`M${w.x} ${w.y} q4 -3 8 0 t8 0`}
            stroke="#EDF3EE"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
            className="amb-wave"
            style={{ animationDelay: `${(i % 7) * -0.9}s` }}
          />
        ))}
      </g>

      {/* Neighbouring countries: muted, paper-like */}
      <path d={NEIGHBOURS} transform="translate(0 5)" fill="#CFC6B3" />
      <path d={NEIGHBOURS} fill="#E9E4D8" stroke="#F7F4EC" strokeWidth="1.5" />
      <path d={NEIGHBOURS} fill="url(#t-hatch)" />

      {/* Spain: foam, cliff (thickness) and terrain */}
      <path d={SPAIN_MAINLAND} fill="none" stroke="#E4EEE8" strokeWidth="7" strokeLinejoin="round" opacity="0.7" />
      <path d={SPAIN_ISLANDS} fill="none" stroke="#E4EEE8" strokeWidth="5" strokeLinejoin="round" opacity="0.7" />
      <path d={SPAIN_MAINLAND} transform="translate(0 7)" fill="#8D7C5C" />
      <path d={SPAIN_MAINLAND} transform="translate(0 3.5)" fill="#A69472" />
      <path d={SPAIN_ISLANDS} transform="translate(0 5)" fill="#8D7C5C" />
      <path d={SPAIN_MAINLAND} fill="url(#t-land)" />
      <path d={SPAIN_ISLANDS} fill="#D8C99C" />

      <g clipPath="url(#t-clip)">
        {/* regional tints */}
        <ellipse cx={P([-7.4, 43.0]).x} cy={P([-7.4, 43.0]).y} rx="120" ry="70" fill="url(#t-green)" />
        <ellipse cx={P([-4.6, 43.25]).x} cy={P([-4.6, 43.25]).y} rx="140" ry="38" fill="url(#t-green)" />
        <ellipse cx={P([-1.5, 43.0]).x} cy={P([-1.5, 43.0]).y} rx="90" ry="30" fill="url(#t-green)" />
        <ellipse cx={P([-4.7, 41.9]).x} cy={P([-4.7, 41.9]).y} rx="120" ry="60" fill="url(#t-field)" />
        <ellipse cx={P([-3.3, 39.2]).x} cy={P([-3.3, 39.2]).y} rx="140" ry="70" fill="url(#t-ochre)" />
        <ellipse cx={P([-1.2, 41.5]).x} cy={P([-1.2, 41.5]).y} rx="70" ry="40" fill="url(#t-ochre)" />
        {/* field patches (Castilla) */}
        {data.fields.map((f, i) => (
          <rect
            key={i}
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx="1"
            fill={f.c}
            opacity="0.55"
            transform={`rotate(${f.r} ${f.x + f.w / 2} ${f.y + f.h / 2})`}
          />
        ))}
      </g>
      <path d={SPAIN_MAINLAND} fill="none" stroke="#F7F2E6" strokeWidth="1" opacity="0.8" />

      {/* Rivers */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {data.rivers.map((r, i) => (
          <g key={i}>
            <path d={r.d} stroke="#E9F0EA" strokeWidth={r.w + 1.6} opacity="0.6" />
            <path d={r.d} stroke="#83AAB3" strokeWidth={r.w} />
          </g>
        ))}
      </g>

      {/* Secondary roads */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {data.roads.map((d, i) => (
          <path key={`a${i}`} d={d} stroke="#BBAA86" strokeWidth="2.2" opacity="0.55" />
        ))}
        {data.roads.map((d, i) => (
          <path key={`b${i}`} d={d} stroke="#F6EFDF" strokeWidth="1" opacity="0.9" />
        ))}
      </g>

      {/* Vegetation */}
      {data.trees.map((t, i) => (
        <use key={i} href={`#t-${t.k}`} x={t.x - t.s / 2} y={t.y - t.s} width={t.s} height={t.s * 1.2} />
      ))}

      {/* Mountains (sorted back to front) */}
      {data.mountains.map((m, i) => (
        <Mountain key={i} {...m} />
      ))}

      {/* Towns */}
      {data.towns.map((t, i) => (
        <g key={i}>
          <use href="#t-house" x={t.x - 4} y={t.y - 7} width="8" height="8" />
          <use href="#t-house" x={t.x + 1} y={t.y - 5} width="6.5" height="6.5" />
          {t.label && (
            <text
              x={t.x}
              y={t.y + 8}
              textAnchor="middle"
              fontSize="6"
              fill="#7E7462"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
            >
              {t.name.toUpperCase()}
            </text>
          )}
        </g>
      ))}

      {/* Sea labels */}
      {SEA_LABELS.map((s) => {
        const p = P(s.ll);
        return (
          <text
            key={s.text}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            fontSize="9"
            fill="#6E8D8E"
            opacity="0.85"
            transform={s.rotate ? `rotate(${s.rotate} ${p.x} ${p.y})` : undefined}
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "0.35em" }}
          >
            {s.text}
          </text>
        );
      })}

      {/* Ambient life: boats, birds */}
      {data.boats.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <g className="amb-boat" style={{ animationDelay: `${i * -1.3}s` }}>
            <path d="M-6 0 h12 l-2.5 3 h-7z" fill="#5B4A3A" />
            <path d="M0 -12 L0 0 L7 -1.5Z" fill="#F7F4EC" />
            <path d="M-0.5 -10 L-0.5 -1 L-5 -1.5Z" fill="#E6DFCF" />
          </g>
          <path d="M-9 4 q3 -1.5 6 0 M4 4.5 q3 -1.5 6 0" stroke="#EDF3EE" strokeWidth="0.8" fill="none" />
        </g>
      ))}
      {data.birds.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <path
            d="M0 0 q2 -2 4 0 q2 -2 4 0"
            stroke="#5E5A52"
            strokeWidth="0.8"
            fill="none"
            className="amb-bird"
            style={{ animationDelay: `${i * -5}s` }}
          />
        </g>
      ))}
    </g>
  );
});

/** Clouds float above everything else (separate so they can sit over the route). */
export const Clouds = memo(function Clouds() {
  const clouds = [
    { x: 250, y: 60, s: 1.1, slow: false },
    { x: 560, y: 180, s: 0.9, slow: true },
    { x: 360, y: 420, s: 1.3, slow: false },
    { x: 700, y: 520, s: 1, slow: true },
    { x: 140, y: 300, s: 0.8, slow: true },
  ];
  return (
    <g pointerEvents="none">
      {clouds.map((c, i) => (
        <g key={i} className={`amb-cloud ${c.slow ? "slow" : ""}`} style={{ animationDelay: `${i * -17}s` }}>
          <g transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <ellipse cx="4" cy="16" rx="26" ry="4" fill="#5E5A52" opacity="0.08" />
            <path
              d="M-22 0 a8 8 0 0 1 10 -8 a11 11 0 0 1 20 -2 a8 8 0 0 1 14 6 a6 6 0 0 1 -2 8 h-38 a6 6 0 0 1 -4 -4z"
              fill="#FFFFFF"
              opacity="0.82"
            />
            <path d="M-24 4 h46" stroke="#E7E2D6" strokeWidth="1" opacity="0.8" />
          </g>
        </g>
      ))}
    </g>
  );
});

function Mountain({ x, y, s, snow, tone }: { x: number; y: number; s: number; snow: boolean; tone: number }) {
  const w = s * 0.85;
  const lit = tone > 0.5 ? "#B7AB8A" : "#AFA383";
  const shade = tone > 0.5 ? "#8C7F62" : "#857859";
  const peakX = x + (tone - 0.5) * s * 0.2;
  const top = y - s;
  return (
    <g>
      <path d={`M${x - w} ${y} L${peakX} ${top} L${x + w} ${y} Z`} fill={lit} />
      <path d={`M${peakX} ${top} L${x + w} ${y} L${x + w * 0.15} ${y} Z`} fill={shade} />
      {snow && (
        <path
          d={`M${peakX} ${top} L${peakX - w * 0.32} ${top + s * 0.36} L${peakX - w * 0.12} ${top + s * 0.3} L${peakX + w * 0.02} ${top + s * 0.4} L${peakX + w * 0.32} ${top + s * 0.36} Z`}
          fill="#FBF9F3"
        />
      )}
      <path d={`M${x - w} ${y} L${x + w} ${y}`} stroke="#7C6F53" strokeWidth="0.6" opacity="0.35" />
    </g>
  );
}

/* ───────────────────────── deterministic scenery generation ───────────────────────── */

function buildScenery(avoid: Pt[]) {
  const rnd = mulberry32(24);
  const land = parsePolygons(SPAIN_MAINLAND);
  const onLand = (p: Pt) => land.some((poly) => inPolygon(p, poly));
  const nearRoute = (p: Pt, d: number) => {
    for (let i = 0; i < avoid.length; i++) {
      if (Math.hypot(p.x - avoid[i].x, p.y - avoid[i].y) < d + 10) return true;
      if (i < avoid.length - 1 && distToSegment(p, avoid[i], avoid[i + 1]) < d) return true;
    }
    return false;
  };

  const rivers = RIVERS.map((r) => ({ d: smoothPath(r.pts.map(P)), w: r.w * 0.8 }));
  const roads = ROADS.map((r) => smoothPath(r.map(P)));

  // mountains
  const mountains: { x: number; y: number; s: number; snow: boolean; tone: number }[] = [];
  for (const r of RANGES) {
    const pts = r.pts.map(P);
    for (let i = 0; i < r.n; i++) {
      const t = (i + rnd() * 0.8) / r.n;
      const f = t * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(f));
      const u = f - k;
      const base = { x: pts[k].x + (pts[k + 1].x - pts[k].x) * u, y: pts[k].y + (pts[k + 1].y - pts[k].y) * u };
      const spread = r.spread * 80;
      const p = { x: base.x + (rnd() - 0.5) * spread, y: base.y + (rnd() - 0.5) * spread * 0.8 };
      if (nearRoute(p, 9)) continue;
      const s = r.size * (0.65 + rnd() * 0.6);
      mountains.push({ ...p, s, snow: Boolean(r.snow) && s > r.size * 0.85, tone: rnd() });
    }
  }
  mountains.sort((a, b) => a.y - b.y);

  // trees: denser in the green north, olive groves in the south
  const trees: { x: number; y: number; s: number; k: "tree" | "pine" | "olive" }[] = [];
  let guard = 0;
  while (trees.length < 420 && guard++ < 9000) {
    const p = { x: 70 + rnd() * 880, y: 60 + rnd() * 640 };
    if (!onLand(p) || nearRoute(p, 8)) continue;
    const north = p.y < 190;
    const south = p.y > 470;
    const keep = north ? 0.95 : south ? 0.38 : 0.2;
    if (rnd() > keep) continue;
    if (mountains.some((m) => Math.abs(m.x - p.x) < m.s * 0.6 && p.y < m.y + 2 && p.y > m.y - m.s)) continue;
    trees.push({ ...p, s: south ? 5 : 6 + rnd() * 3, k: south ? "olive" : north && rnd() > 0.5 ? "pine" : "tree" });
  }
  trees.sort((a, b) => a.y - b.y);

  // Castilla field patches
  const fields: { x: number; y: number; w: number; h: number; r: number; c: string }[] = [];
  const fc = ["#E4D3A0", "#CFD09A", "#D8C08A", "#C9C796", "#E8DAB0"];
  for (let i = 0; i < 70; i++) {
    const p = { x: 300 + rnd() * 320, y: 190 + rnd() * 260 };
    if (!onLand(p) || nearRoute(p, 6)) continue;
    fields.push({ x: p.x, y: p.y, w: 8 + rnd() * 16, h: 5 + rnd() * 9, r: -20 + rnd() * 40, c: fc[i % fc.length] });
  }

  const towns = TOWNS.map((t) => ({ ...P(t.ll), name: t.name, label: Boolean(t.label) })).filter((t) => !nearRoute(t, 14));

  const waves: Pt[] = [];
  while (waves.length < 60) {
    const p = { x: rnd() * WORLD_W, y: rnd() * WORLD_H };
    const nearLand = land.some((poly) => inPolygon(p, poly)) || inPolygon({ x: p.x, y: p.y + 14 }, land[0]);
    if (!nearLand) waves.push({ x: Math.round(p.x), y: Math.round(p.y) });
  }

  const boats = [P([-5.3, 43.85]), P([-2.0, 43.7]), P([0.6, 39.9]), P([-9.7, 42.0])];
  const birds = [P([-5.9, 43.2]), P([-4.3, 41.2]), P([-3.0, 42.2])];

  return { rivers, roads, mountains, trees, fields, towns, waves, boats, birds };
}
