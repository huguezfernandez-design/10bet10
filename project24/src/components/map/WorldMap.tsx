"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
import { Character } from "@/components/characters/Character";
import { WORLD_H, WORLD_W } from "@/game/projection";
import { segmentPath, stopPoint, type Pt } from "@/game/route";
import type { AvatarArt, CharacterPose, PublicStop } from "@/game/types";
import { CityScene } from "./CityScene";
import { Clouds, Terrain } from "./Terrain";

/**
 * The game world. Five independent layers:
 *   1-2  <Terrain>        static territory + scenery (memoised, never re-renders)
 *   2    <CityScene>      one diorama per stop
 *   3    route            roads, progress line, markers
 *   4    characters       HTML overlay, positioned from motion values (no React re-render per frame)
 *   5    labels/HUD       HTML overlay (city names, level numbers) — HUD lives in the Game
 * The camera is three motion values (cx, cy, z) + an anchor (ax, ay) that respects UI insets.
 */

export type MarkerState = "done" | "next" | "locked" | "here";
export type FocusMode = "fit" | "route" | "near" | "close";

export interface MapHandle {
  focus(p: Pt | "route", mode: FocusMode, duration?: number): Promise<void>;
  setInsets(i: { top?: number; bottom?: number; right?: number }, duration?: number): void;
  placeHeroine(p: Pt): void;
  placeHero(p: Pt): void;
  walkHero(to: Pt, duration: number): Promise<void>;
  travel(leg: number, opts: { duration: number; cinematic?: boolean; onProgress?: (t: number) => void }): Promise<void>;
  recenter(): void;
  zoomBy(factor: number): void;
}

interface Props {
  ref?: Ref<MapHandle>;
  stops: PublicStop[];
  markers: MarkerState[];
  completedLegs: number;
  activeLeg: number | null;
  heroine: { pose: CharacterPose; facing: "left" | "right"; visible: boolean };
  hero: { pose: CharacterPose; facing: "left" | "right"; visible: boolean };
  avatars: { her: AvatarArt; him: AvatarArt };
  interactive: boolean;
  onFacing?: (f: "left" | "right") => void;
  onUserMoved?: (moved: boolean) => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Tweens several motion values together. A newer tween on the same value cancels the older one. */
const owners = new WeakMap<MotionValue<number>, symbol>();
function tweenValues(pairs: [MotionValue<number>, number][], seconds: number): Promise<void> {
  const token = Symbol();
  const from = pairs.map(([mv]) => mv.get());
  pairs.forEach(([mv]) => owners.set(mv, token));
  return tween(seconds, (t) => {
    pairs.forEach(([mv, to], i) => {
      if (owners.get(mv) === token) mv.set(from[i] + (to - from[i]) * t);
    });
  });
}

/** requestAnimationFrame tween, eased, resolves when done. */
function tween(seconds: number, onUpdate: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const raw = Math.min(1, (now - t0) / (seconds * 1000));
      onUpdate(easeInOut(raw));
      if (raw < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

export function WorldMap({
  ref,
  stops,
  markers,
  completedLegs,
  activeLeg,
  heroine,
  hero,
  avatars,
  interactive,
  onFacing,
  onUserMoved,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 390, h: 800 });
  const insets = useRef({ top: 64, bottom: 0, right: 0 });
  const lastFocus = useRef<{ p: Pt | "route"; mode: FocusMode }>({ p: "route", mode: "fit" });
  const segRefs = useRef<(SVGPathElement | null)[]>([]);

  const pts = useMemo(() => stops.map(stopPoint), [stops]);
  const segs = useMemo(() => pts.slice(1).map((b, i) => segmentPath(pts[i], b, i)), [pts]);

  // camera
  const cx = useMotionValue(WORLD_W / 2);
  const cy = useMotionValue(WORLD_H / 2);
  const z = useMotionValue(0.4);
  const ax = useMotionValue(195);
  const ay = useMotionValue(400);
  // characters
  const hx = useMotionValue(pts[0].x);
  const hy = useMotionValue(pts[0].y);
  const mx = useMotionValue(pts[pts.length - 1].x + 14);
  const my = useMotionValue(pts[pts.length - 1].y + 4);
  const legProgress = useMotionValue(0);

  // Applied as an SVG attribute (not CSS) so the origin is exactly the SVG user space.
  const worldTransform = useTransform(
    () => `translate(${ax.get()} ${ay.get()}) scale(${z.get()}) translate(${-cx.get()} ${-cy.get()})`,
  );
  const worldRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const apply = (v: string) => worldRef.current?.setAttribute("transform", v);
    apply(worldTransform.get());
    return worldTransform.on("change", apply);
  }, [worldTransform]);

  /* ───────── geometry helpers ───────── */
  const view = useCallback(() => {
    const { w, h } = size.current;
    const { top, bottom, right } = insets.current;
    const W = Math.max(120, w - right);
    const H = Math.max(160, h - top - bottom);
    return { W, H, ax: W / 2, ay: top + H / 2 };
  }, []);

  const zoomFor = useCallback(
    (mode: FocusMode) => {
      const { W, H } = view();
      if (mode === "fit") return Math.min(W / 880, H / 700);
      if (mode === "route") {
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const bw = Math.max(...xs) - Math.min(...xs) + 120;
        const bh = Math.max(...ys) - Math.min(...ys) + 110;
        return Math.min(W / bw, H / bh);
      }
      const near = clamp(Math.min(W, H) / 135, 2.1, 3.8);
      return mode === "close" ? near * 1.55 : near;
    },
    [pts, view],
  );

  const routeCenter = useCallback((): Pt => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [pts]);

  const focus = useCallback(
    (p: Pt | "route", mode: FocusMode, duration = 1.2) => {
      lastFocus.current = { p, mode };
      onUserMoved?.(false);
      const target = p === "route" ? (mode === "fit" ? { x: 470, y: 380 } : routeCenter()) : p;
      const tz = zoomFor(mode);
      const v = view();
      if (duration === 0) {
        [cx, cy, z, ax, ay].forEach((mv) => owners.set(mv, Symbol()));
        cx.set(target.x);
        cy.set(target.y);
        z.set(tz);
        ax.set(v.ax);
        ay.set(v.ay);
        return Promise.resolve();
      }
      return tweenValues([[cx, target.x], [cy, target.y], [z, tz], [ax, v.ax], [ay, v.ay]], duration);
    },
    [ax, ay, cx, cy, z, routeCenter, view, zoomFor, onUserMoved],
  );

  useImperativeHandle(
    ref,
    (): MapHandle => ({
      focus,
      setInsets(i, duration = 0.6) {
        insets.current = { ...insets.current, ...i };
        const v = view();
        void tweenValues([[ax, v.ax], [ay, v.ay]], duration);
      },
      placeHeroine(p) {
        hx.set(p.x);
        hy.set(p.y);
      },
      placeHero(p) {
        mx.set(p.x);
        my.set(p.y);
      },
      walkHero(to, duration) {
        return tweenValues([[mx, to.x], [my, to.y]], duration);
      },
      async travel(leg, { duration, cinematic, onProgress }) {
        const path = segRefs.current[leg];
        if (!path) return;
        const L = path.getTotalLength();
        const start = path.getPointAtLength(0);
        legProgress.set(0);
        await focus(start, "near", 0.8);
        const baseZ = z.get();
        let lastX = start.x;
        let facing: "left" | "right" = "right";
        await tween(duration, (t) => {
          const p = path.getPointAtLength(t * L);
          hx.set(p.x);
          hy.set(p.y);
          cx.set(p.x);
          cy.set(p.y);
          legProgress.set(t);
          if (cinematic) z.set(baseZ * (1 - 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.05))));
          const f = p.x < lastX - 0.02 ? "left" : p.x > lastX + 0.02 ? "right" : facing;
          if (f !== facing) {
            facing = f;
            onFacing?.(f);
          }
          lastX = p.x;
          onProgress?.(t);
        });
      },
      recenter() {
        const { p, mode } = lastFocus.current;
        void focus(p, mode, 0.9);
      },
      zoomBy(factor) {
        void tweenValues([[z, clamp(z.get() * factor, zoomFor("fit") * 0.85, 9)]], 0.35);
        onUserMoved?.(true);
      },
    }),
    [ax, ay, focus, hx, hy, legProgress, mx, my, onFacing, onUserMoved, view, z, zoomFor],
  );

  /* ───────── resize ───────── */
  // measure synchronously before any camera move is computed
  useLayoutEffect(() => {
    const el = box.current;
    if (el) size.current = { w: el.clientWidth, h: el.clientHeight };
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
      const { p, mode } = lastFocus.current;
      void focus(p, mode, 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [focus]);

  /* ───────── gestures: drag, pinch, wheel ───────── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const clampCam = () => {
    cx.set(clamp(cx.get(), 40, WORLD_W - 40));
    cy.set(clamp(cy.get(), 40, WORLD_H - 40));
  };
  const zoomAt = (factor: number, sx: number, sy: number) => {
    const z0 = z.get();
    const z1 = clamp(z0 * factor, zoomFor("fit") * 0.85, 9);
    // keep the world point under the cursor fixed
    const wx = cx.get() + (sx - ax.get()) / z0;
    const wy = cy.get() + (sy - ay.get()) / z0;
    cx.set(wx - (sx - ax.get()) / z1);
    cy.set(wy - (sy - ay.get()) / z1);
    z.set(z1);
    clampCam();
    onUserMoved?.(true);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: z.get() };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      cx.set(cx.get() - (e.clientX - prev.x) / z.get());
      cy.set(cy.get() - (e.clientY - prev.y) / z.get());
      clampCam();
      onUserMoved?.(true);
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = box.current!.getBoundingClientRect();
      const target = (pinch.current.z * d) / pinch.current.d;
      zoomAt(target / z.get(), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  const avoid = pts;

  return (
    <div
      ref={box}
      className="absolute inset-0 overflow-hidden touch-none select-none"
      style={{ background: "#A9C4C2", cursor: interactive ? "grab" : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <g ref={worldRef}>
          <Terrain avoid={avoid} />
          <RouteLayer
            segs={segs}
            segRefs={segRefs}
            completedLegs={completedLegs}
            activeLeg={activeLeg}
            legProgress={legProgress}
          />
          {stops.map((s, i) => (
            <CityScene key={s.id} kind={s.scene} x={pts[i].x} y={pts[i].y} state={markers[i]} />
          ))}
          <Clouds />
        </g>
      </svg>

      {/* LAYER 5a — labels */}
      {stops.map((s, i) => (
        <StopLabel key={s.id} stop={s} p={pts[i]} state={markers[i]} cam={{ cx, cy, z, ax, ay }} />
      ))}

      {/* LAYER 4 — characters */}
      {hero.visible && (
        <CharacterSprite x={mx} y={my} cam={{ cx, cy, z, ax, ay }}>
          <Character variant="him" pose={hero.pose} facing={hero.facing} size={74} art={avatars.him} />
        </CharacterSprite>
      )}
      {heroine.visible && (
        <CharacterSprite x={hx} y={hy} cam={{ cx, cy, z, ax, ay }} lift={3}>
          <Character variant="her" pose={heroine.pose} facing={heroine.facing} size={74} art={avatars.her} />
        </CharacterSprite>
      )}
    </div>
  );
}

type Cam = { cx: MotionValue<number>; cy: MotionValue<number>; z: MotionValue<number>; ax: MotionValue<number>; ay: MotionValue<number> };

function CharacterSprite({
  x,
  y,
  cam,
  lift = 0,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  cam: Cam;
  lift?: number;
  children: React.ReactNode;
}) {
  const left = useTransform(() => cam.ax.get() + (x.get() - cam.cx.get()) * cam.z.get());
  const top = useTransform(() => cam.ay.get() + (y.get() + lift - cam.cy.get()) * cam.z.get());
  const scale = useTransform(() => clamp(cam.z.get() / 3.2, 0.62, 1.35));
  return (
    <motion.div className="absolute left-0 top-0 pointer-events-none will-change-transform" style={{ x: left, y: top }}>
      <motion.div style={{ scale, originX: 0.5, originY: 1, x: "-50%", y: "-100%" }}>{children}</motion.div>
    </motion.div>
  );
}

function StopLabel({ stop, p, state, cam }: { stop: PublicStop; p: Pt; state: MarkerState; cam: Cam }) {
  const left = useTransform(() => cam.ax.get() + (p.x - cam.cx.get()) * cam.z.get());
  const top = useTransform(() => cam.ay.get() + (p.y - cam.cy.get()) * cam.z.get() + 9 * cam.z.get() + 8);
  const opacity = useTransform(() => (cam.z.get() < 0.9 ? 0 : 1));
  const done = state === "done";
  const next = state === "next";
  return (
    <motion.div className="absolute left-0 top-0 pointer-events-none" style={{ x: left, y: top, opacity }}>
      <div className="-translate-x-1/2 flex flex-col items-center gap-1 whitespace-nowrap">
        <span
          className={`label !text-[9px] px-2 py-[3px] rounded-full ${
            done ? "bg-ink text-paper" : next ? "bg-accent text-snow" : "bg-paper/85 text-ink/60"
          }`}
        >
          {done ? "✓ " : ""}
          {stop.levelLabel}
        </span>
        <span className="display text-[19px] text-ink drop-shadow-[0_1px_0_rgba(243,240,233,.9)]">{stop.name}</span>
      </div>
    </motion.div>
  );
}

function RouteLayer({
  segs,
  segRefs,
  completedLegs,
  activeLeg,
  legProgress,
}: {
  segs: string[];
  segRefs: React.RefObject<(SVGPathElement | null)[]>;
  completedLegs: number;
  activeLeg: number | null;
  legProgress: MotionValue<number>;
}) {
  const offset = useTransform(legProgress, (t) => 1 - t);
  const [, force] = useState(0);
  useEffect(() => force((n) => n + 1), []);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* road bed */}
      {segs.map((d, i) => (
        <path key={`bed${i}`} d={d} stroke="#857659" strokeWidth="7.5" opacity="0.55" />
      ))}
      {segs.map((d, i) => (
        <path
          key={`road${i}`}
          d={d}
          ref={(el) => {
            segRefs.current[i] = el;
          }}
          stroke={i < completedLegs ? "#2B2926" : "#EFE7D4"}
          strokeWidth="5.5"
        />
      ))}
      {/* active leg progress */}
      {activeLeg !== null && segs[activeLeg] && (
        <motion.path
          d={segs[activeLeg]}
          pathLength={1}
          stroke="#2B2926"
          strokeWidth="5.5"
          strokeDasharray="1 1"
          style={{ strokeDashoffset: offset }}
        />
      )}
      {/* centre line */}
      {segs.map((d, i) => (
        <path
          key={`line${i}`}
          d={d}
          stroke={i < completedLegs || i === activeLeg ? "#F3F0E9" : "#8E8370"}
          strokeWidth="0.8"
          strokeDasharray="2.4 2.6"
        />
      ))}
    </g>
  );
}
