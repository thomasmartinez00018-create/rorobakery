// Partidas con bots, en lote. Cada partida usa una semilla fija (Math.random con semilla), así una corrida se puede repetir.
//   node run_batch.mjs                      batería: los 7 mapas a dúo, 40 partidas cada uno, en paralelo, con resumen
//   node run_batch.mjs <mapa> <duo|solo> <N> [policy] [react] [meta0|meta2|meta5] [etiqueta]
// Variables: OUT=carpeta de resultados (tools/results/<OUT>, por defecto "actual"), ENGINE=otro engine.js,
//            DT=pasos por segundo (30), SEED=semilla base (1), EXACT=1 (el motor usa Math.random: comparación bit a bit),
//            MODES=duo,solo (para la batería).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { seedMath } from "./azar.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "results", process.env.OUT || "actual");
const MAPS7 = ["plaza", "estacion", "feria", "bielli", "cancha", "tortugas", "terrazas"];
const args = process.argv.slice(2);

if (!args.length) {
  // batería completa: un proceso por configuración
  const modes = (process.env.MODES || "duo").split(",");
  const jobs = MAPS7.flatMap(m => modes.map(mode => [m, mode, "40"]));
  const t0 = Date.now();
  await Promise.all(jobs.map(j => new Promise((res, rej) => {
    const ch = spawn(process.execPath, [fileURLToPath(import.meta.url), ...j], { stdio: ["ignore", "inherit", "inherit"], env: process.env });
    ch.on("exit", c => c === 0 ? res() : rej(new Error("falló " + j.join(" "))));
  })));
  console.log(`\nlisto en ${Math.round((Date.now() - t0) / 1000)} s · resultados en ${path.relative(process.cwd(), OUT)}`);
  const { resumen } = await import("./resumen.mjs");
  resumen([OUT]);
  process.exit(0);
}

const [map, mode, N = "40", policy = "builder", react = "0", metaS = "meta0", tag = ""] = args;
const meta = metaS === "meta5" ? { hp: 5, dmg: 5, spd: 5, mag: 5 } : metaS === "meta2" ? { hp: 2, dmg: 2, spd: 2, mag: 2 } : {};
const { runGame } = await import("./bot.mjs");
const base = +(process.env.SEED || 1), exact = process.env.EXACT === "1";
const out = [];
for (let i = 0; i < +N; i++) {
  const duo = mode === "duo";
  const chars = duo ? ["thomas", "rocio"] : [i % 2 ? "rocio" : "thomas"];
  const seed = (base * 7919 + i * 104729 + MAPS7.indexOf(map) * 31) >>> 0;
  const restore = seedMath(seed);
  try { out.push(runGame({ map, duo, policy, react: +react, meta, chars, dt: process.env.DT ? 1 / +process.env.DT : 1 / 30, seed: seed ^ 0x9e3779b9, exact })); }
  finally { restore(); }
}
const name = `${map}_${mode}_${policy}_r${react}_${metaS}${tag}`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(out));
console.log(name, "ok", out.filter(r => r.state === "win").length + "/" + N);
