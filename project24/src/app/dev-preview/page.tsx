import { notFound } from "next/navigation";
import { Character } from "@/components/characters/Character";

// Development-only gallery of every character pose (404 in production).
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  const herPoses = ["idle", "walking", "celebrating", "surprised", "happy"] as const;
  const himPoses = ["idle", "greeting", "walking", "happy"] as const;
  return (
    <main className="p-8 bg-paper min-h-dvh">
      <div className="flex flex-wrap gap-8 items-end">
        {herPoses.map((p) => (
          <figure key={p} className="text-center">
            <Character variant="her" pose={p} size={220} />
            <figcaption className="label mt-2">her · {p}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap gap-8 items-end mt-10">
        {himPoses.map((p) => (
          <figure key={p} className="text-center">
            <Character variant="him" pose={p} size={220} />
            <figcaption className="label mt-2">him · {p}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
