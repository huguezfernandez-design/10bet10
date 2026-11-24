import { notFound } from "next/navigation";
import { getDefaultConfig, toPublic } from "@/server/config";
import { MapPreview } from "./MapPreview";

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "near" } = await searchParams;
  return <MapPreview stops={toPublic(getDefaultConfig()).stops} mode={mode} />;
}
