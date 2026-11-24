// Builds preview/index.html: the whole game in one self-contained page with the API simulated
// in the browser. For the creator to try the game; NOT the link to send (it contains the answers).
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const root = process.cwd();
const out = await build({
  entryPoints: ["src/preview/entry.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "stub-server-store",
      setup(b) {
        b.onResolve({ filter: /^\.\/db$/ }, (a) =>
          a.importer.includes(path.join("src", "server")) ? { path: path.join(root, "src/preview/db-stub.ts") } : undefined,
        );
      },
    },
  ],
  alias: { "@": path.join(root, "src"), "server-only": path.join(root, "tests/server-only-stub.ts") },
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const cssSrc = readFileSync("src/app/globals.css", "utf8");
const css = (await postcss([tailwind()]).process(cssSrc, { from: path.join(root, "src/app/globals.css") })).css;

const html = `<title>Toti 24</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}
html,body{height:100%;margin:0;background:#F3F0E9}
</style>
<div id="root"></div>
<script>${js}</script>
`;
mkdirSync("preview", { recursive: true });
writeFileSync("preview/index.html", html);
console.log("preview/index.html", (html.length / 1024).toFixed(0) + " KB");
