"use client";
import { useEffect, useRef, useState } from "react";
import { WorldMap, type MapHandle } from "@/components/map/WorldMap";
import type { PublicStop } from "@/game/types";

export function MapPreview({ stops, mode }: { stops: PublicStop[]; mode: string }) {
  const ref = useRef<MapHandle>(null);
  const [facing, setFacing] = useState<"left" | "right">("right");
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === "fit") ref.current?.focus("route", "fit", 0);
      else if (mode === "route") ref.current?.focus("route", "route", 0);
      else if (mode === "madrid") { ref.current?.placeHeroine({ x: 450, y: 352 }); ref.current?.focus({ x: 454, y: 345 }, "close", 0); }
      else ref.current?.focus({ x: 337, y: 140 }, "near", 0);
    }, 50);
    return () => clearTimeout(t);
  }, [mode]);
  return (
    <div className="fixed inset-0">
      <WorldMap
        ref={ref}
        stops={stops}
        markers={["done", "done", "next", "locked", "locked"]}
        completedLegs={1}
        activeLeg={null}
        heroine={{ pose: "idle", facing, visible: true }}
        hero={{ pose: "greeting", facing: "left", visible: mode === "madrid" }}
        avatars={{ her: { name: "", images: {} }, him: { name: "", images: {} } }}
        interactive
        onFacing={setFacing}
      />
    </div>
  );
}
