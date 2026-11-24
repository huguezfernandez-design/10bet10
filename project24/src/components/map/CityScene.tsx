"use client";

import { memo } from "react";
import type { SceneKind } from "@/game/types";

/**
 * Small diorama for each stop (LAYER 2). Local coords: (0,0) = ground centre, up = negative y.
 * `state` only changes the platform tint so the scene itself stays recognisable.
 */
export const CityScene = memo(function CityScene({
  kind,
  x,
  y,
  state,
}: {
  kind: SceneKind;
  x: number;
  y: number;
  state: "done" | "next" | "locked" | "here";
}) {
  const ring = state === "done" ? "#171717" : state === "next" || state === "here" ? "#B4532A" : "#9C9384";
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* platform with thickness */}
      <ellipse cx="0" cy="4" rx="23" ry="8.5" fill="#000" opacity="0.12" />
      <ellipse cx="0" cy="2.5" rx="21" ry="7.5" fill="#A39272" />
      <ellipse cx="0" cy="0" rx="21" ry="7.5" fill="#ECE4D1" />
      <ellipse cx="0" cy="0" rx="21" ry="7.5" fill="none" stroke={ring} strokeWidth="0.9" strokeDasharray={state === "locked" ? "2 2" : undefined} />
      {state === "next" && (
        <ellipse cx="0" cy="0" rx="21" ry="7.5" fill="none" stroke="#B4532A" strokeWidth="1.2" className="amb-pulse" />
      )}
      <g transform="translate(0 0.5)">{SCENES[kind]()}</g>
    </g>
  );
});

const stroke = { stroke: "#3A3530", strokeWidth: 0.5, strokeLinejoin: "round" as const };

const SCENES: Record<SceneKind, () => React.ReactNode> = {
  // Gijón: the sea, the beach and the "Elogio del Horizonte" on Cerro Santa Catalina
  coast: () => (
    <g>
      <path d="M-20 -1 q10 -5 20 -3 q10 2 20 -1 v3 q-20 6 -40 3z" fill="#E8D7A8" />
      <path d="M-19 -3 q9 -4 19 -2 q10 2 19 -1" stroke="#9EC0C4" strokeWidth="1.4" fill="none" />
      {/* houses */}
      <g {...stroke}>
        <path d="M-17 0 v-7 l3 -2.5 l3 2.5 v7z" fill="#F4EEDF" />
        <path d="M-17.6 -6.7 l3.6 -3 l3.6 3" fill="none" stroke="#B4614A" strokeWidth="1.3" />
        <path d="M-11 0 v-9 l3 -2.5 l3 2.5 v9z" fill="#EAD9C0" />
        <path d="M-11.6 -8.7 l3.6 -3 l3.6 3" fill="none" stroke="#B4614A" strokeWidth="1.3" />
        <rect x="-9" y="-6" width="2" height="2.5" fill="#6B8BA4" stroke="none" />
      </g>
      {/* hill */}
      <path d="M-2 0 q8 -10 20 -2 v2z" fill="#9DB07E" />
      {/* Elogio del Horizonte */}
      <g {...stroke} transform="translate(9 -5)">
        <path d="M-5 0 L-6 -10 Q-2 -16 4 -13 L6 -3 L5 0 L3 0 L2.5 -8 Q0 -11 -3 -9 L-3 0Z" fill="#C9C2B4" />
        <path d="M2.5 -8 L3 0 L5 0 L6 -3 L4 -13Z" fill="#A9A192" stroke="none" />
      </g>
      {/* lighthouse */}
      <g {...stroke} transform="translate(17 -3)">
        <path d="M-1.6 0 L-1 -11 h2 L1.6 0Z" fill="#F7F4EC" />
        <path d="M-1.4 -4 h2.8 M-1.2 -8 h2.4" stroke="#B4532A" strokeWidth="1" />
        <rect x="-1.4" y="-13.5" width="2.8" height="2.5" fill="#3A3530" />
        <circle cx="0" cy="-12.3" r="3.5" fill="#FFF3C4" stroke="none" className="amb-light" />
      </g>
    </g>
  ),

  // León: gothic cathedral with two towers and a rose window
  cathedral: () => (
    <g {...stroke}>
      <path d="M-16 0 v-8 h32 v8z" fill="#E4D3AE" />
      <path d="M-9 0 v-16 h18 v16z" fill="#EADCB9" />
      <path d="M-9 -16 L0 -24 L9 -16z" fill="#D8C59C" />
      <circle cx="0" cy="-11" r="3.4" fill="#7E9AB8" />
      <path d="M0 -14.4 v6.8 M-3.4 -11 h6.8 M-2.4 -13.4 l4.8 4.8 M2.4 -13.4 l-4.8 4.8" stroke="#E9DFC6" strokeWidth="0.45" />
      <path d="M-3 0 v-5 q3 -3.5 6 0 v5z" fill="#5A4A3A" />
      {/* towers */}
      <path d="M-16 0 v-20 h6 v20z" fill="#E2D0A6" />
      <path d="M-16 -20 L-13 -32 L-10 -20z" fill="#CDB98C" />
      <path d="M10 0 v-20 h6 v20z" fill="#E2D0A6" />
      <path d="M10 -20 L13 -33 L16 -20z" fill="#CDB98C" />
      <path d="M-14.5 -16 v4 M-11.5 -16 v4 M11.5 -16 v4 M14.5 -16 v4" stroke="#6E5E48" strokeWidth="0.8" />
      {/* pinnacles */}
      <path d="M-9 -16 v-3 M9 -16 v-3 M-5 -20 v-3 M5 -20 v-3" stroke="#B9A57A" strokeWidth="0.8" />
    </g>
  ),

  // Valladolid: arcaded red Plaza Mayor + church tower
  plaza: () => (
    <g {...stroke}>
      <path d="M-18 0 v-11 h26 v11z" fill="#B9614A" />
      <path d="M-18.5 -11 h27" stroke="#F1E6D2" strokeWidth="1.2" />
      {[-15, -10, -5, 0, 5].map((x) => (
        <g key={x}>
          <path d={`M${x - 1.6} 0 v-3 q1.6 -2 3.2 0 v3z`} fill="#5E3328" stroke="none" />
          <rect x={x - 1.1} y={-9} width={2.2} height={3} fill="#F1E6D2" stroke="none" />
        </g>
      ))}
      <g>
        <path d="M11 0 v-18 h7 v18z" fill="#F0E7D6" />
        <path d="M11 -18 L14.5 -27 L18 -18z" fill="#6F7A84" />
        <path d="M13 -14 h3 v4 h-3z" fill="#5A4A3A" stroke="none" />
        <path d="M14.5 -27 v-3 M13.5 -29 h2" stroke="#3A3530" strokeWidth="0.6" />
      </g>
    </g>
  ),

  // Segovia: two-tier Roman aqueduct + Alcázar turret
  aqueduct: () => (
    <g {...stroke}>
      <g transform="translate(-13 -16)">
        <path d="M0 16 v-9 h7 v9z" fill="#E6DFCF" />
        <path d="M-1 7 h9 l-1 -2 h-7z" fill="#D7CEBB" />
        <path d="M0.8 5 L2 -1 L3.5 1 L5 -2 L6.2 5z" fill="#E6DFCF" />
        <path d="M1.5 -1 l2 -5 l2 5z" fill="#5C6B7A" />
        <path d="M4.5 -2 l1.2 -3.4 l1.2 3.4z" fill="#5C6B7A" />
      </g>
      <path d="M-6 0 v-20 h27 v20z" fill="#CBBFA8" />
      {[-4, 1, 6, 11, 16].map((x) => (
        <path key={`l${x}`} d={`M${x - 1.8} 0 v-7 q1.8 -2.6 3.6 0 v7z`} fill="#8E8170" stroke="none" />
      ))}
      <path d="M-6 -11 h27" stroke="#B3A68E" strokeWidth="1" />
      {[-4, 1, 6, 11, 16].map((x) => (
        <path key={`u${x}`} d={`M${x - 1.4} -12 v-4 q1.4 -2 2.8 0 v4z`} fill="#8E8170" stroke="none" />
      ))}
      <path d="M-6.5 -20 h28" stroke="#A89B83" strokeWidth="1.2" />
    </g>
  ),

  // Madrid: Puerta de Alcalá in front of the Cuatro Torres skyline
  capital: () => (
    <g {...stroke}>
      {/* skyline */}
      <g transform="translate(0 -4)">
        <path d="M-15 0 v-24 h4 v24z" fill="#9FB0BE" />
        <path d="M-9 0 v-28 h4 v28z" fill="#B8C6D1" />
        <path d="M-9 -28 h4 l-0.5 -2 h-3z" fill="#9FB0BE" />
        <path d="M6 0 v-27 h4 v27z" fill="#A9B8C4" />
        <path d="M12 0 v-25 q2 -3 4 0 v25z" fill="#C5D0D8" />
        <path d="M-13 -20 v16 M-7 -24 v20 M8 -23 v19 M14 -21 v17" stroke="#E8EEF2" strokeWidth="0.5" />
      </g>
      {/* Metrópolis-like dome */}
      <g transform="translate(-1 -6)">
        <path d="M-4 0 v-9 h8 v9z" fill="#F1EADA" />
        <path d="M-3.5 -9 q3.5 -6 7 0z" fill="#2E2A26" />
        <path d="M0 -13.5 v-2.5" stroke="#C9A46A" strokeWidth="1" />
      </g>
      {/* Puerta de Alcalá */}
      <g transform="translate(0 0)">
        <path d="M-14 0 v-10 h28 v10z" fill="#F2ECDF" />
        <path d="M-15 -10 h30 v-2 h-30z" fill="#E3D9C6" />
        <path d="M-5 -12 h10 l-1 -3 h-8z" fill="#E3D9C6" />
        {[-9, 0, 9].map((x) => (
          <path key={x} d={`M${x - 2.2} 0 v-5 q2.2 -3 4.4 0 v5z`} fill="#6E655A" stroke="none" />
        ))}
        <path d="M-13 0 h3 v-6 h-3z M10 0 h3 v-6 h-3z" fill="#6E655A" stroke="none" />
      </g>
      {/* little flag */}
      <g transform="translate(9.6 -30)">
        <path d="M0 0 v7" stroke="#3A3530" strokeWidth="0.5" />
        <path d="M0 0 h5 v3 h-5z" fill="#C8463A" stroke="none" className="amb-flag" />
        <path d="M0 0.8 h5 v1.4 h-5z" fill="#E9B949" stroke="none" className="amb-flag" />
      </g>
    </g>
  ),

  village: () => (
    <g {...stroke}>
      <path d="M-8 0 v-7 l4 -3 l4 3 v7z" fill="#F4EEDF" />
      <path d="M1 0 v-9 l4 -3 l4 3 v9z" fill="#EAD9C0" />
    </g>
  ),
};
