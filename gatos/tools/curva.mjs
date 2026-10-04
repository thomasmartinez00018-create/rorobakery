// Curva de dificultad: victorias y duración mediana por mapa, bot perfecto y casual, solo y dúo.
//   node curva.mjs results/A [results/B]      con dos carpetas muestra A → B
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const MAPS7 = ["plaza", "estacion", "feria", "bielli", "cancha", "tortugas", "terrazas"];
const COLS = [["perfecto", "duo", "builder_r0"], ["perfecto", "solo", "builder_r0"], ["casual", "duo", "casual_r0.3"], ["casual", "solo", "casual_r0.3"]];
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mmss = s => Math.floor(s / 60) + ":" + String(Math.round(s) % 60).padStart(2, "0");
function cell(dir, map, mode, tag) {
  const f = path.join(dir, `${map}_${mode}_${tag}_meta0${process.env.TAG || ""}.json`);
  if (!fs.existsSync(f)) return null;
  const R = JSON.parse(fs.readFileSync(f, "utf8"));
  return { win: Math.round(R.filter(r => r.state === "win").length / R.length * 100), t: q(R.map(r => r.t), 0.5), n: R.length };
}
export function curva(dirs) {
  const head = COLS.map(([b, m]) => `${b} ${m === "duo" ? "dúo" : "solo"}`);
  console.log("| Mapa | " + head.join(" | ") + " |");
  console.log("| --- |" + head.map(() => " --- |").join(""));
  for (const map of MAPS7) {
    const cells = COLS.map(([, mode, tag]) => {
      const c = dirs.map(d => cell(d, map, mode, tag));
      if (!c[0] && !c[1]) return "";
      const f = x => x ? `${x.win}% ${mmss(x.t)}` : "?";
      return c.length > 1 ? `${f(c[0])} → ${f(c[1])}` : f(c[0]);
    });
    console.log(`| ${map} | ${cells.join(" | ")} |`);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) curva(process.argv.slice(2));
