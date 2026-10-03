// Resumen corto de una o dos corridas de run_batch.mjs.
//   node resumen.mjs results/antes                 tabla por configuración
//   node resumen.mjs results/antes results/despues  compara: medianas, victorias y si la diferencia entra en el margen
// El margen de la mediana es un intervalo bootstrap del 95% (2000 remuestreos); el de victorias, ±2 errores estándar.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mulberry32 } from "./azar.mjs";

const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function load(dir) {
  const o = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) o[f.replace(".json", "")] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  return o;
}
function stats(R) {
  const t = R.map(r => r.t);
  return { n: R.length, win: R.filter(r => r.state === "win").length / R.length, t50: q(t, 0.5), t25: q(t, 0.25), t75: q(t, 0.75), lv50: q(R.map(r => r.lv), 0.5), k50: q(R.map(r => r.kills), 0.5), lv: avg(R.map(r => r.lv)), k: avg(R.map(r => r.kills)), t };
}
// intervalo bootstrap de la diferencia de medianas
function bootDiff(a, b, rnd = mulberry32(7)) {
  const d = [];
  for (let i = 0; i < 2000; i++) {
    const ra = Array.from(a, () => a[Math.floor(rnd() * a.length)]), rb = Array.from(b, () => b[Math.floor(rnd() * b.length)]);
    d.push(q(rb, 0.5) - q(ra, 0.5));
  }
  return [q(d, 0.025), q(d, 0.975)];
}
const pct = x => Math.round(x * 100) + "%";
const mmss = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

export function resumen(dirs) {
  const [A, B] = dirs.map(load);
  if (!B) {
    console.log("config | n | gana | fin mediana (p25-p75) | nivel mediano | gatos mediana");
    for (const [k, R] of Object.entries(A)) { const s = stats(R); console.log(`${k} | ${s.n} | ${pct(s.win)} | ${mmss(s.t50)} (${mmss(s.t25)}-${mmss(s.t75)}) | ${s.lv50} | ${s.k50}`); }
    return;
  }
  console.log("config | gana A → B | fin mediana A → B (IC95 dif) | nivel A → B | gatos A → B | ¿dentro del margen?");
  let ok = 0, tot = 0;
  for (const k of Object.keys(A)) {
    if (!B[k]) continue;
    const a = stats(A[k]), b = stats(B[k]);
    const [lo, hi] = bootDiff(a.t, b.t);
    const se = Math.sqrt((a.win * (1 - a.win)) / a.n + (b.win * (1 - b.win)) / b.n) || 0.05;
    const inT = lo <= 0 && hi >= 0, inW = Math.abs(b.win - a.win) <= 2 * Math.max(se, 0.05);
    tot++; if (inT && inW) ok++;
    console.log(`${k} | ${pct(a.win)} → ${pct(b.win)} | ${mmss(a.t50)} → ${mmss(b.t50)} (${lo >= 0 ? "+" : ""}${lo} a +${hi} s) | ${a.lv.toFixed(1)} → ${b.lv.toFixed(1)} | ${Math.round(a.k)} → ${Math.round(b.k)} | ${inT && inW ? "sí" : "NO"}`);
  }
  console.log(`\n${ok}/${tot} configuraciones dentro del margen`);
  return { ok, tot };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dirs = process.argv.slice(2);
  if (!dirs.length) { console.error("uso: node resumen.mjs <carpeta> [carpeta]"); process.exit(1); }
  resumen(dirs);
}
