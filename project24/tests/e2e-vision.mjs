// End-to-end check of the server flow against a mocked Anthropic API.
// Usage: start the app with ANTHROPIC_API_KEY=sk-test ANTHROPIC_BASE_URL=http://localhost:4010,
// then: node tests/e2e-vision.mjs http://localhost:3200
import { requests, startMock } from "./mock-anthropic.mjs";

const base = process.argv[2] ?? "http://localhost:3200";
const pw = process.env.ADMIN_PASSWORD ?? "test-admin-pass";
const ok = (c, m) => {
  if (!c) {
    console.error("✗", m);
    process.exit(1);
  }
  console.log("✓", m);
};

const mock = await startMock(4010);
const login = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
ok(login.ok, "admin login");
const cookie = login.headers.get("set-cookie").split(";")[0];
const { game } = await (await fetch(`${base}/api/admin/games`, { method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify({ label: "e2e-vision" }) })).json();
const g = `${base}/api/game/${game.token}`;
const post = (p, b) => fetch(g + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

// a real JPEG header + padding
const jpeg = new Uint8Array(2048);
jpeg.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const verify = (bytes, type = "image/jpeg") => {
  const fd = new FormData();
  fd.append("photo", new Blob([bytes], { type }), "p.jpg");
  return fetch(g + "/verify", { method: "POST", body: fd });
};

let r = await verify(jpeg);
ok(r.status === 409, "verify refused before reaching a mission (409)");
r = await post("/answer", { level: 1, optionId: "a" });
ok(r.status === 409, "answer refused before the mission (409)");
r = await fetch(g + "/result");
ok(r.status === 403, "result hidden until the end (403)");

await post("/action", { action: "start" });
await post("/action", { action: "depart" });
r = await post("/action", { action: "arrive" });
ok((await r.json()).state.stage === "mission", "arrived at León → mission");

r = await verify(new TextEncoder().encode("<svg onload=alert(1)></svg>          "), "image/jpeg");
ok(r.status === 415, "non-image content rejected by magic bytes (415)");
r = await verify(new Uint8Array(9 * 1024 * 1024).fill(0xff));
ok(r.status === 413, "oversized upload rejected (413)");

const before = requests.length;
r = await verify(jpeg);
let j = await r.json();
ok(r.ok && j.valid === false && j.detected_object === "lápiz", "different object → valid:false, detected 'lápiz'");
ok(j.state.stage === "mission", "still on the mission after a wrong photo");

r = await verify(jpeg);
j = await r.json();
ok(j.valid === false && /luz|cerca/i.test(j.message), "unclear photo → asks for a better one");

r = await verify(jpeg);
j = await r.json();
ok(j.valid === true && j.state.stage === "question" && !j.demo, "correct object → valid:true, real (not demo), stage question");

const sent = requests[before].body;
ok(sent.model === (process.env.ANTHROPIC_MODEL || "claude-opus-5-5"), `model from env (${sent.model})`);
ok(sent.messages[0].content[0].type === "image" && sent.messages[0].content[0].source.media_type === "image/jpeg", "image sent as base64 JPEG");
ok(sent.output_config?.format?.type === "json_schema", "structured output schema requested");
ok(/bolígrafo/.test(sent.messages[0].content[1].text), "expected object passed to the model (server-side only)");
console.log("   headers:", Object.keys(requests[before].headers).join(","), requests[before].headers["anthropic-beta"]);
ok(requests[before].headers["x-api-key"] === "sk-test" || /sk-test/.test(requests[before].headers["authorization"] ?? ""), "API key sent from the server");

r = await post("/answer", { level: 1, optionId: "b" });
ok((await r.json()).state.stage === "traveling", "answer recorded → travelling to level 2");
r = await post("/answer", { level: 1, optionId: "b" });
ok(r.status === 409, "cannot answer the same question twice");

const state = await (await fetch(g)).json();
ok(!JSON.stringify(state).match(/COMEDY|DINNER|points|scores/), "public state carries no scoring data");

mock.close();
console.log("\nAll vision e2e checks passed.");
