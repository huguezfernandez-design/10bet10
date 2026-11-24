// Minimal stand-in for POST /v1/messages, used by tests/e2e-vision.mjs.
// Verdicts are returned in sequence: different_object → unclear → match (repeat).
import http from "node:http";

const verdicts = [
  { verdict: "different_object", detected_object: "lápiz", message: "Casi: eso es un lápiz, no lo que buscamos." },
  { verdict: "unclear", detected_object: "nada claro", message: "No se ve nada." },
  { verdict: "match", detected_object: "bolígrafo", message: "Bolígrafo localizado." },
];
let n = 0;
export const requests = [];

export function startMock(port = 4010) {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = JSON.parse(body || "{}");
      requests.push({ url: req.url, headers: req.headers, body: parsed });
      if (process.env.MOCK_FAIL && n === 0) {
        n++;
        res.writeHead(529, { "content-type": "application/json", "x-should-retry": "false" });
        return res.end(JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } }));
      }
      const v = verdicts[n++ % verdicts.length];
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "msg_mock_" + n,
          type: "message",
          role: "assistant",
          model: parsed.model,
          content: [{ type: "text", text: JSON.stringify(v) }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      );
    });
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}
