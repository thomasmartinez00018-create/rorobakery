// Monedas por partida desde una corrida de run_batch.mjs. Uso: node coins.mjs [carpeta] (por defecto results/actual)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const DIR = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "results/actual");
const T = { plaza: 0, estacion: 1, feria: 2, bielli: 3, cancha: 3, tortugas: 4, terrazas: 5 };
for (const f of fs.readdirSync(DIR).filter(f => /_r0(\.3)?_meta0\.json$/.test(f) && f.includes("builder"))) {
  const R = JSON.parse(fs.readFileSync(path.join(DIR, f))); const k = T[R[0].map] * 0.12 + 1;
  const a = x => R.reduce((s, r) => s + x(r), 0) / R.length;
  const co = a(r => r.coinsRun) * k, kl = a(r => Math.floor(r.kills / 12)) * k, tt = a(r => Math.floor(r.t / 20)) * k, w = a(r => r.state === "win" ? 60 : 0) * k, tot = a(r => r.earned);
  console.log(f.replace(".json", "").padEnd(36), "total", tot.toFixed(0), "| juntadas", (co / tot * 100).toFixed(0) + "%", "gatos/12", (kl / tot * 100).toFixed(0) + "%", "tiempo", (tt / tot * 100).toFixed(0) + "%", "victoria", (w / tot * 100).toFixed(0) + "%", "| partidas para Taller completo (1760):", (1760 / tot).toFixed(1), "| min por partida", (a(r => r.t) / 60).toFixed(1));
}
