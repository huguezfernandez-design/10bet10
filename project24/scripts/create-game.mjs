// Creates a new game link from the command line (alternative to /admin).
// Usage: node scripts/create-game.mjs [label] [baseUrl]
// Requires the app to be running and ADMIN_PASSWORD set in the environment.
const label = process.argv[2] ?? "";
const base = process.argv[3] ?? process.env.BASE_URL ?? "http://localhost:3000";
const pw = process.env.ADMIN_PASSWORD;
if (!pw) {
  console.error("Set ADMIN_PASSWORD in the environment.");
  process.exit(1);
}
const login = await fetch(`${base}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: pw }),
});
if (!login.ok) {
  console.error("Login failed:", login.status);
  process.exit(1);
}
const cookie = login.headers.get("set-cookie")?.split(";")[0];
const res = await fetch(`${base}/api/admin/games`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify({ label }),
});
const { game } = await res.json();
console.log(`${base}/play/${game.token}`);
