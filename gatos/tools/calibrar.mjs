// Calibración rápida de la curva: corre bot casual dúo en Plaza y Terrazas y bot perfecto dúo en Plaza (40 partidas)
// con una DIFF dada, sobre una copia congelada del motor actual.
//   node calibrar.mjs <nombre> '{"hp":1.1}' [configs]   configs: lista "mapa:modo:bot" (por defecto la de arriba)
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [name, diff = "{}", cfgS = "plaza:duo:casual,terrazas:duo:casual,plaza:duo:perfecto"] = process.argv.slice(2);
const BOT = { perfecto: ["builder", "0"], casual: ["casual", "0.3"] };
const OUT = "cal_" + name, dir = path.join(HERE, "results", OUT); fs.mkdirSync(dir, { recursive: true });
const engine = path.join(dir, "engine.js"); if (!fs.existsSync(engine)) fs.copyFileSync(path.resolve(HERE, "../js/engine.js"), engine);
const N = process.env.N || "40";
await Promise.all(cfgS.split(",").map(c => { const [m, mode, b] = c.split(":"); return new Promise(res => spawn(process.execPath, [path.join(HERE, "run_batch.mjs"), m, mode, N, ...BOT[b]], { stdio: "ignore", env: { ...process.env, OUT, ENGINE: engine, DIFF: diff } }).on("exit", res)); }));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * s.length)]; };
const out = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) { const R = JSON.parse(fs.readFileSync(path.join(dir, f))); out.push(`${f.replace("_meta0.json", "")}: ${Math.round(R.filter(r => r.state === "win").length / R.length * 100)}% (${Math.floor(q(R.map(r => r.t), .5) / 60)}:${String(q(R.map(r => r.t), .5) % 60).padStart(2, "0")})`); }
console.log(name, diff, "\n  " + out.join("\n  "));
fs.writeFileSync(path.join(dir, "diff.json"), diff);
