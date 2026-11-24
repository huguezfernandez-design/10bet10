import type { Metadata } from "next";

export const metadata: Metadata = { title: "PROJECT 24 · Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
}
