"use client";

import { AnimatePresence, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MadridWelcome } from "@/components/madrid/MadridWelcome";
import { WorldMap, type MapHandle, type MarkerState } from "@/components/map/WorldMap";
import { ArrivalCard } from "@/components/mission/ArrivalCard";
import { MissionPanel } from "@/components/mission/MissionPanel";
import { QuestionPanel } from "@/components/mission/QuestionPanel";
import { Finale } from "@/components/reveal/Finale";
import { roadKm, stopPoint, type Pt } from "@/game/route";
import type { CharacterPose, PublicConfig, PublicGameState } from "@/game/types";
import { ApiError, createApi } from "@/lib/api";
import { sound } from "@/lib/audio";
import { Dialogue, Hud, MapControls, Panel, TravelBanner } from "./Hud";
import { StartScreen } from "./StartScreen";

type Phase = "start" | "briefing" | "travel" | "arrival" | "meeting" | "welcome" | "mission" | "question" | "finale";

function phaseFor(s: PublicGameState): Phase {
  switch (s.stage) {
    case "welcome":
      return "start";
    case "briefing":
      return "briefing";
    case "traveling":
      return "travel";
    case "meeting":
      return "meeting";
    case "mission":
      return "mission";
    case "question":
      return "question";
    case "finished":
      return "finale";
  }
}

const add = (p: Pt, dx: number, dy: number): Pt => ({ x: p.x + dx, y: p.y + dy });

export function Game({ token, config, initial }: { token: string; config: PublicConfig; initial: PublicGameState }) {
  const api = useMemo(() => createApi(token), [token]);
  const map = useRef<MapHandle>(null);
  const { stops } = config;
  const last = stops.length - 1;
  const pts = useMemo(() => stops.map(stopPoint), [stops]);

  const [state, setState] = useState(initial);
  const [phase, setPhase] = useState<Phase>(phaseFor(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; retry?: () => void } | null>(null);
  const [herPose, setHerPose] = useState<CharacterPose>("idle");
  const [herFacing, setHerFacing] = useState<"left" | "right">("right");
  const [hisPose, setHisPose] = useState<CharacterPose>("idle");
  const [heroOnStage, setHeroOnStage] = useState(
    initial.level === last && ["mission", "question", "finished"].includes(initial.stage),
  );
  const [meetingLinesVisible, setMeetingLinesVisible] = useState(false);
  const [userMoved, setUserMoved] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const travelProgress = useMotionValue(0);

  const sfx = useCallback((s: Parameters<typeof sound.play>[0]) => sound?.play(s), []);
  const theme = config.theme;

  // where each character stands at a stop
  const herSpot = useCallback((i: number) => (i === last ? add(pts[i], -9, 4) : add(pts[i], 0, 4)), [pts, last]);
  const hisSpot = add(pts[last], 10, 4);

  /* ───────────── derived map state ───────────── */
  const traveling = state.stage === "traveling";
  const completedLegs = traveling ? state.level - 1 : state.level;
  const activeLeg = traveling && phase === "travel" ? state.level - 1 : null;
  const markers: MarkerState[] = stops.map((_, i) => {
    if (i === 0) return state.level > 0 ? "done" : "here";
    if (state.missions[i - 1] === "answered") return "done";
    if (i === state.level) return traveling ? "next" : "here";
    if (i === state.level + 1 && !traveling && state.stage !== "finished") return "next";
    return "locked";
  });

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, retry?: () => void): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        return await fn();
      } catch (e) {
        setError({ msg: e instanceof ApiError ? e.message : "Algo ha fallado.", retry });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  /* ───────────── initial placement ───────────── */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const at = traveling ? state.level - 1 : state.level;
    m.placeHeroine(herSpot(at));
    m.placeHero(hisSpot);
    if (phase === "start") m.focus("route", "fit", 0);
    else m.focus(herSpot(at), "near", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────────── phase choreography ───────────── */
  const travelling = useRef<number | null>(null);
  const meetingRan = useRef(false);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (phase === "briefing") {
      setHerPose("happy");
      void m.focus(herSpot(0), "near", 1.8);
    }

    if (phase === "travel" && state.stage === "traveling" && travelling.current !== state.level) {
      const leg = state.level - 1;
      travelling.current = state.level;
      const final = state.level === last;
      setHerPose("walking");
      travelProgress.set(0);
      void (async () => {
        await m.travel(leg, {
          duration: final ? 7.5 : 5,
          cinematic: final,
          onProgress: (t) => travelProgress.set(t),
        });
        m.placeHeroine(herSpot(state.level));
        setHerPose("celebrating");
        sfx("arrive");
        const arrive = async () => {
          const res = await run(() => api.action("arrive"), () => void arrive());
          if (!res) return;
          setState(res.state);
          setPhase("arrival");
          travelling.current = null;
        };
        await arrive();
      })();
    }

    if (phase === "arrival") {
      void m.focus(herSpot(state.level), "close", 1.2);
    }

    if (phase === "mission" || phase === "question") {
      setHerPose((p) => (p === "celebrating" && phase === "mission" ? "idle" : p));
      void m.focus(add(pts[state.level], 0, -4), "near", 1.1);
    }

    if (phase === "meeting" && !meetingRan.current) {
      meetingRan.current = true;
      void (async () => {
        setHerPose("idle");
        setHerFacing("right");
        await m.focus(add(pts[last], 0, -2), "close", 1.4);
        m.placeHero(add(pts[last], 34, 8));
        setHisPose("walking");
        setHeroOnStage(true);
        await new Promise((r) => setTimeout(r, 400));
        setHerPose("surprised");
        await m.walkHero(hisSpot, 1.9);
        setHisPose("greeting");
        sfx("arrive");
        await new Promise((r) => setTimeout(r, 700));
        setMeetingLinesVisible(true);
      })();
    }

    if (phase === "finale") {
      setHerPose("celebrating");
      setHisPose("happy");
      void m.focus("route", "route", 1.6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state.stage, state.level]);

  /* ───────────── actions ───────────── */
  const start = async () => {
    sfx("tap");
    const res = await run(() => api.action("start"));
    if (!res) return;
    setState(res.state);
    setPhase("briefing");
  };
  const depart = async () => {
    sfx("whoosh");
    const res = await run(() => api.action("depart"));
    if (!res) return;
    setState(res.state);
    setPhase("travel");
  };
  const afterArrival = useCallback(() => {
    setPhase(state.stage === "meeting" ? "meeting" : "mission");
    setHerPose("idle");
  }, [state.stage]);
  const meet = async () => {
    sfx("tap");
    const res = await run(() => api.action("meet"));
    if (!res) return;
    setState(res.state);
    setMeetingLinesVisible(false);
    setHerPose("happy");
    setHisPose("idle");
    setPhase("mission");
  };

  const onInsets = useCallback((i: { bottom: number; right: number }) => map.current?.setInsets(i), []);
  const toggleSound = () => {
    const on = !soundOn;
    setSoundOn(on);
    sound?.setEnabled(on);
    if (on) sound?.play("tap");
  };

  const stop = stops[state.level];
  const mapInteractive = !["travel", "arrival"].includes(phase) && !(phase === "meeting" && !meetingLinesVisible);
  const reached = traveling ? state.level - 1 : state.level;
  const meetingLines = config.madrid.meeting.map((l) => ({
    who: l.speaker === "him" ? config.avatars.him.name : l.speaker === "her" ? config.avatars.her.name : "",
    text: l.text,
  }));

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-paper"
      style={
        {
          "--p24-paper": theme.paper,
          "--p24-ink": theme.ink,
          "--p24-warm": theme.warm,
          "--p24-white": theme.white,
          "--p24-accent": theme.accent,
        } as React.CSSProperties
      }
    >
      <WorldMap
        ref={map}
        stops={stops}
        markers={markers}
        completedLegs={completedLegs}
        activeLeg={activeLeg}
        heroine={{ pose: herPose, facing: herFacing, visible: true }}
        hero={{ pose: hisPose, facing: "left", visible: heroOnStage }}
        avatars={config.avatars}
        interactive={mapInteractive}
        onFacing={setHerFacing}
        onUserMoved={setUserMoved}
      />

      {phase !== "start" && (
        <Hud
          title={config.meta.title}
          stops={stops}
          reached={reached}
          current={state.level}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          demo={state.demoMode}
        />
      )}
      {mapInteractive && phase !== "start" && phase !== "finale" && phase !== "welcome" && (
        <MapControls
          compactHidden={["briefing", "mission", "question", "meeting"].includes(phase)}
          onZoomIn={() => map.current?.zoomBy(1.35)}
          onZoomOut={() => map.current?.zoomBy(1 / 1.35)}
          onRecenter={() => map.current?.recenter()}
          showRecenter={userMoved}
        />
      )}

      <AnimatePresence>
        {phase === "travel" && state.level >= 1 && (
          <TravelBannerLive
            key={`tb${state.level}`}
            from={stops[state.level - 1].name}
            to={stops[state.level].name}
            quip={stops[state.level].travelQuip}
            km={roadKm(stops[state.level - 1], stops[state.level])}
            progress={travelProgress}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "arrival" && (
          <ArrivalCard
            key={`arr${state.level}`}
            stop={stop}
            level={state.level}
            reachedLabel={config.missionUi.destinationReached}
            missionLabel={config.missionUi.missionLabel}
            onDone={afterArrival}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "briefing" && (
          <Panel key="briefing" panelKey="briefing" onInsets={onInsets}>
            <p className="label text-accent mb-1">
              {stops[0].name} · {stops[0].region}
            </p>
            <Dialogue
              lines={config.briefing.lines.map((t) => ({ who: "", text: t }))}
              speakerLabel="Briefing"
              doneLabel={config.briefing.cta}
              onDone={depart}
            />
          </Panel>
        )}
        {phase === "mission" && stop?.mission && (
          <Panel key={`m${state.level}`} panelKey={`m${state.level}`} onInsets={onInsets}>
            <MissionPanel
              stop={stop}
              level={state.level}
              ui={config.missionUi}
              api={api}
              demoMode={state.demoMode}
              verified={state.missions[state.level - 1] === "verified"}
              onVerified={(s) => {
                setHerPose("celebrating");
                setState(s);
              }}
              onContinue={() => {
                setHerPose("idle");
                setPhase("question");
              }}
              onSfx={sfx}
            />
          </Panel>
        )}
        {phase === "question" && stop?.question && (
          <Panel key={`q${state.level}`} panelKey={`q${state.level}`} onInsets={onInsets}>
            <QuestionPanel
              stop={stop}
              level={state.level}
              total={last}
              ui={config.missionUi}
              api={api}
              onSfx={sfx}
              onAnswered={(s) => {
                setState(s);
                setPhase(phaseFor(s));
              }}
            />
          </Panel>
        )}
        {phase === "meeting" && meetingLinesVisible && (
          <Panel key="meeting" panelKey="meeting" onInsets={onInsets}>
            <p className="label text-accent mb-1">
              {stops[last].name} · {config.missionUi.destinationReached}
            </p>
            <Dialogue lines={meetingLines} doneLabel={config.missionUi.continueCta} onDone={() => setPhase("welcome")} />
          </Panel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "start" && <StartScreen key="start" config={config} onStart={start} busy={busy} />}
        {phase === "welcome" && <MadridWelcome key="welcome" config={config} onContinue={meet} busy={busy} />}
      </AnimatePresence>

      {phase === "finale" && <Finale config={config} api={api} onSfx={sfx} />}

      <AnimatePresence>
        {error && (
          <div className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-6 w-[min(92vw,440px)]">
            <div className="rounded-2xl bg-ink text-paper px-5 py-4 shadow-2xl flex items-center gap-4">
              <p className="text-sm flex-1">{error.msg}</p>
              {error.retry ? (
                <button className="label !text-[10px] border border-paper/30 rounded-full px-3 py-2" onClick={error.retry}>
                  Reintentar
                </button>
              ) : (
                <button className="label !text-[10px] text-paper/60" onClick={() => setError(null)}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TravelBannerLive(props: { from: string; to: string; quip: string; km: number; progress: MotionValue<number> }) {
  const [p, setP] = useState(props.progress.get());
  useMotionValueEvent(props.progress, "change", (v) => setP(v));
  return <TravelBanner from={props.from} to={props.to} quip={props.quip} km={props.km} progress={p} />;
}
