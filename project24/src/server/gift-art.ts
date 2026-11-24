import "server-only";
import type { Gift } from "./config-types";

/**
 * Editorial illustrations for the final reveal.
 * They live on the server and only the winning one is ever sent to the browser,
 * so inspecting the frontend bundle reveals nothing about the other options.
 */
export function giftArt(kind: Gift["art"], p: Gift["palette"]): string {
  const { fg, accent, bg } = p;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
  switch (kind) {
    case "table":
      return `${open}
  <circle cx="200" cy="120" r="70" stroke="${accent}" stroke-dasharray="2 6"/>
  <path d="M120 120 Q200 60 280 120" stroke="${accent}"/>
  <g class="g-float">
    <path d="M170 60 q8 -14 0 -28 M200 54 q8 -14 0 -28 M230 60 q8 -14 0 -28" stroke-width="1.5" opacity=".7"/>
  </g>
  <ellipse cx="200" cy="300" rx="150" ry="42"/>
  <path d="M50 300 v12 q150 70 300 0 v-12"/>
  <ellipse cx="200" cy="296" rx="70" ry="18" fill="${accent}" fill-opacity=".18"/>
  <ellipse cx="200" cy="296" rx="50" ry="12"/>
  <path d="M100 280 l-6 34 M108 280 l-2 34 M116 280 v34" stroke-width="1.6"/>
  <path d="M292 278 q10 18 0 38 M300 278 v38" stroke-width="1.6"/>
  <path d="M150 240 q-4 -30 6 -46 h18 q10 16 6 46 z" fill="${bg}"/>
  <path d="M166 240 v26 M154 268 h24"/>
  <path d="M224 238 q-4 -30 6 -46 h18 q10 16 6 46 z" fill="${bg}"/>
  <path d="M240 238 v28 M228 268 h24"/>
  <path d="M156 222 q12 6 22 0" stroke="${accent}"/>
  <path d="M230 220 q12 6 22 0" stroke="${accent}"/>
  <path d="M120 345 v110 M280 345 v110 M90 455 h60 M250 455 h60"/>
  <circle cx="330" cy="200" r="4" fill="${accent}" stroke="none"/>
  <path d="M330 196 v-30" stroke-width="1.4"/>
  <path d="M326 168 q4 -14 8 0 q-4 8 -8 0z" fill="${accent}" stroke="${accent}" class="g-flicker"/>
</svg>`;
    case "stage":
      return `${open}
  <path d="M40 40 h320 v30 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 z" fill="${accent}" fill-opacity=".9" stroke="${accent}"/>
  <path d="M40 70 v380 M360 70 v380"/>
  <path d="M40 70 q50 120 20 380 M360 70 q-50 120 -20 380" stroke="${accent}"/>
  <path d="M120 70 L70 420 h260 L280 70" stroke-width="1" opacity=".35" class="g-beam"/>
  <ellipse cx="200" cy="420" rx="130" ry="14" stroke-dasharray="3 5"/>
  <path d="M200 420 v-150"/>
  <rect x="190" y="230" width="20" height="40" rx="10" fill="${bg}"/>
  <path d="M193 242 h14 M193 250 h14 M193 258 h14" stroke-width="1.2"/>
  <path d="M188 420 l12 -10 l12 10"/>
  <path d="M60 470 h280" stroke-width="1"/>
  <g stroke-width="1.6">
    <circle cx="90" cy="478" r="10"/><circle cx="140" cy="480" r="10"/><circle cx="190" cy="478" r="10"/>
    <circle cx="240" cy="480" r="10"/><circle cx="290" cy="478" r="10"/>
  </g>
  <g class="g-float" stroke="${accent}">
    <path d="M300 160 q12 -6 18 4 q-10 8 -18 -4z"/>
    <path d="M90 190 q12 -6 18 4 q-10 8 -18 -4z"/>
  </g>
</svg>`;
    case "glass":
      return `${open}
  <circle cx="200" cy="230" r="150" stroke="${accent}" stroke-width="1" stroke-dasharray="2 7"/>
  <path d="M140 110 q-14 110 60 140 q74 -30 60 -140 z" fill="${bg}"/>
  <path d="M146 170 q54 18 108 0 q-6 64 -54 80 q-48 -16 -54 -80z" fill="${accent}" fill-opacity=".85" stroke="none" class="g-swirl"/>
  <path d="M200 250 v130"/>
  <path d="M150 390 q50 -18 100 0"/>
  <ellipse cx="200" cy="392" rx="50" ry="8"/>
  <path d="M166 124 q-6 40 4 70" stroke-width="1.4" opacity=".7"/>
  <g transform="translate(290 270) rotate(18)">
    <path d="M0 0 h26 v40 q8 10 8 26 v94 h-42 v-94 q0 -16 8 -26z" fill="${bg}"/>
    <path d="M-8 100 h42 v40 h-42z" fill="${accent}" fill-opacity=".85" stroke="none"/>
    <path d="M2 -14 h22 v14 h-22z"/>
  </g>
  <g transform="translate(78 300)">
    <path d="M10 0 q-10 20 0 40 q10 -20 0 -40z" fill="${accent}" fill-opacity=".6" stroke="none"/>
    <circle cx="20" cy="50" r="7"/><circle cx="34" cy="50" r="7"/><circle cx="27" cy="62" r="7"/>
    <circle cx="13" cy="62" r="7"/><circle cx="20" cy="74" r="7"/><circle cx="27" cy="86" r="7"/>
    <path d="M24 42 q2 -12 10 -16"/>
  </g>
</svg>`;
    case "mountain":
      return `${open}
  <circle cx="290" cy="110" r="34" fill="${accent}" fill-opacity=".2" stroke="${accent}"/>
  <path d="M20 360 L130 170 L180 240 L240 140 L380 360 z" fill="${accent}" fill-opacity=".12"/>
  <path d="M110 205 l20 -35 l14 20 l-12 8 l-8 -10z M222 172 l18 -32 l22 36 l-14 -8 l-12 10z" fill="${fg}" stroke="none" opacity=".85"/>
  <path d="M20 360 h360"/>
  <path d="M60 360 q40 -40 90 -20 q40 16 90 -10 q60 -30 120 30" stroke-width="1.4" opacity=".6"/>
  <g class="g-float">
    <path d="M60 90 q20 -16 40 0 q14 -8 24 4 h-70z" stroke-width="1.6"/>
    <path d="M300 200 q16 -12 32 0 q10 -6 18 2 h-54z" stroke-width="1.4"/>
  </g>
  <g transform="translate(150 380)">
    <rect x="0" y="0" width="100" height="90" rx="20" fill="${bg}"/>
    <path d="M20 0 v-18 q30 -22 60 0 v18"/>
    <rect x="22" y="38" width="56" height="34" rx="8" fill="${accent}" fill-opacity=".8" stroke="${accent}"/>
    <path d="M22 26 h56 M50 38 v-12"/>
    <path d="M0 30 h-10 v40 h10 M100 30 h10 v40 h-10"/>
  </g>
  <path d="M40 470 q60 -20 120 0 t120 0 t120 0" stroke-width="1" opacity=".5" stroke-dasharray="4 6"/>
</svg>`;
    default:
      return "";
  }
}
