// Corre perf.mjs en tres escenarios (Plaza y Terrazas reales a dúo, y estrés) y deja una tabla corta.
// Uso: node perf_resumen.mjs [etiqueta]   (guarda el detalle en perf_out/<etiqueta>_*.json)
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const tag = process.argv[2] || "actual";
fs.mkdirSync(path.join(HERE, "perf_out"), { recursive: true });
const runs = [["real", "plaza", "460"], ["real", "terrazas", "460"], ["estres", "plaza", "330"]];
console.log("escenario | t | gatos | gemas | objetos | foto JSON | foto binarypack | KB/s bin | step medio | step máx");
for (const [scen, map, dur] of runs) {
  const out = execFileSync(process.execPath, [path.join(HERE, "perf.mjs"), scen, map, dur], { env: { ...process.env, CLEAN: "1" }, maxBuffer: 1 << 26 }).toString();
  fs.writeFileSync(path.join(HERE, "perf_out", `${tag}_${scen}_${map}.json`), out);
  const o = JSON.parse(out);
  for (const r of o.rec) {
    const w = o.per.filter(x => x.t <= r.t).pop() || o.per[0];
    console.log(`${scen} ${map} | ${r.t} | ${r.E} | ${r.G} | ${Math.round(JSON.parse(JSON.stringify(r.parts)).K)} B | ${(r.js / 1024).toFixed(2)} KB | ${(r.bin / 1024).toFixed(2)} KB | ${w.binKBs} | ${w.stepMs} ms | ${w.maxStepMs} ms`);
  }
}
