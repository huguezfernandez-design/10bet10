import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminConfigured, checkPassword, sessionCookieOptions, signSession } from "@/server/admin-auth";
import { clientIp, json, rateLimit } from "@/server/http";

export async function POST(req: Request) {
  if (!adminConfigured()) return json({ error: "admin_disabled", message: "Configura ADMIN_PASSWORD." }, 503);
  if (!rateLimit(`login:${clientIp(req)}`, 8, 10 * 60_000)) return json({ error: "too_many" }, 429);
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    return json({ error: "bad_password" }, 401);
  }
  (await cookies()).set(ADMIN_COOKIE, signSession(), sessionCookieOptions);
  return json({ ok: true });
}
