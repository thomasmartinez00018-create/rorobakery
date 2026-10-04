// Batería de dinámica: bot perfecto y bot casual, solo y dúo, en los 7 mapas (40 partidas por configuración).
// Congela una copia del motor en results/<OUT>/engine.js antes de arrancar, así se puede seguir editando el juego
// mientras corre. Al final imprime la curva (curva.mjs).
//   node bateria.mjs <OUT> [perfecto,casual] [duo,solo] [mapas separados por coma]
// Variables: N=partidas por configuración (40), CONC=procesos a la vez (1), SEED (1), FAST=1 (arranque rápido de revancha)
// Bot perfecto = policy builder, decide en cada cuadro. Bot casual = policy casual (mejoras al azar ponderado), decide cada 0,3 s.
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [OUT = "actual", botsS = "perfecto,casual", modesS = "duo,solo", mapsS = "plaza,estacion,feria,bielli,cancha,tortugas,terrazas"] = process.argv.slice(2);
const BOT = { perfecto: ["builder", "0"], casual: ["casual", "0.3"] };
const dir = path.join(HERE, "results", OUT);
fs.mkdirSync(dir, { recursive: true });
const engine = process.env.ENGINE || path.join(dir, "engine.js");
// el motor importa ./historia.js: la copia congelada lleva los dos archivos
if (!process.env.ENGINE) for (const f of ["engine.js", "historia.js"]) fs.copyFileSync(path.resolve(HERE, "../js", f), path.join(dir, f));
const N = process.env.N || "40", CONC = +(process.env.CONC || 1); // de a un proceso por defecto: la Mac la comparten otros sistemas
const jobs = [];
for (const b of botsS.split(",")) for (const mode of modesS.split(",")) for (const m of mapsS.split(",")) jobs.push([m, mode, N, ...BOT[b]]);
const t0 = Date.now();
let next = 0;
const worker = async () => {
  while (next < jobs.length) {
    const j = jobs[next++];
    await new Promise((res, rej) => spawn(process.execPath, [path.join(HERE, "run_batch.mjs"), ...j], { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, OUT, ENGINE: engine } })
      .on("exit", c => c === 0 ? res() : rej(new Error("falló " + j.join(" ")))));
  }
};
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`\nlisto en ${Math.round((Date.now() - t0) / 1000)} s · ${path.relative(process.cwd(), dir)}`);
const { curva } = await import("./curva.mjs");
curva([dir]);
