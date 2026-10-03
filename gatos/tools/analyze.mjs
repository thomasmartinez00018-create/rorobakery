// Análisis largo de una corrida de run_batch.mjs. Uso: node analyze.mjs [carpeta o archivos .json] (por defecto results/actual)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), dir0 = argv.length === 1 && fs.statSync(argv[0]).isDirectory() ? argv[0] : !argv.length ? path.join(HERE, "results/actual") : null;
const files = dir0 ? fs.readdirSync(dir0).filter(f => f.endsWith(".json")).map(f => path.join(dir0, f)) : argv;
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : null;
for (const f of files.sort()) {
  const R = JSON.parse(fs.readFileSync(f, "utf8")), n = R.length;
  const wins = R.filter(r => r.state === "win");
  const losses = R.filter(r => r.state === "over");
  const endT = losses.map(r => r.t);
  // tramo de muerte
  const bins = { "<210 (antes de Luz)": 0, "210-330 (Luz a horda 2)": 0, "330-420 (horda 2 a Linda)": 0, "420+ (Linda)": 0 };
  for (const t of endT) bins[t < 210 ? "<210 (antes de Luz)" : t < 330 ? "210-330 (Luz a horda 2)" : t < 420 ? "330-420 (horda 2 a Linda)" : "420+ (Linda)"]++;
  const firstDown = R.map(r => r.downs[0] ? r.downs[0].t : null).filter(x => x !== null);
  const causes = {}; for (const r of R) for (const d of r.downs) causes[d.cause] = (causes[d.cause] || 0) + 1;
  const taken = {}; for (const r of R) for (const [k, v] of Object.entries(r.taken)) { const kk = k.replace("*", ""); taken[kk] = (taken[kk] || 0) + v; }
  const totT = Object.values(taken).reduce((a, b) => a + b, 0);
  const dmg = {}; for (const r of R) for (const [k, v] of Object.entries(r.dmgBy)) dmg[k] = (dmg[k] || 0) + v;
  const totD = Object.values(dmg).reduce((a, b) => a + b, 0);
  const own = {}; for (const r of R) for (const b of r.build) for (const w of Object.keys(b.w)) own[w] = (own[w] || 0) + 1;
  const nb = R.reduce((a, r) => a + r.build.length, 0);
  const evoN = R.reduce((a, r) => a + r.evos.length, 0), evoRuns = R.filter(r => r.evos.length).length, evoT = R.flatMap(r => r.evos.map(e => e.t));
  const evoW = {}; for (const r of R) for (const e of r.evos) evoW[e.w] = (evoW[e.w] || 0) + 1;
  const luzK = R.filter(r => r.S.luzDown).map(r => r.S.luzDown - r.S.luz);
  const lindaK = wins.map(r => r.t - r.S.linda);
  const objs = R.flatMap(r => r.S.obj), objOk = objs.filter(o => o.ok).length;
  const lvAt = tt => avg(R.map(r => { const w = r.S.win.find(x => x.t >= tt); return w ? w.lv : null; }).filter(x => x !== null));
  // curva por minuto: kills/s, daño recibido/s, gatos en pantalla, % de ventanas de 10 s sin daño
  const minute = {};
  for (const r of R) for (const w of r.S.win) { const m = Math.floor((w.t - 1) / 60); const o = minute[m] || (minute[m] = { k: [], dt: [], on: [], en: [], zero: 0, n: 0, hp: [] }); o.k.push(w.k / 10); o.dt.push(w.dt / 10); o.on.push(w.on); o.en.push(w.en); o.hp.push(w.minHp); o.n++; if (w.dt === 0) o.zero++; }
  const lvPerMin = {}; for (const r of R) for (const t of r.S.lvT) { const m = Math.floor(t / 60); lvPerMin[m] = (lvPerMin[m] || 0) + 1; }
  const alive = m => R.filter(r => r.t > m * 60 || r.state === "win").length;
  console.log(`\n### ${path.basename(f, ".json")}  (n=${n})`);
  console.log(`gana ${wins.length}/${n} (${Math.round(wins.length / n * 100)}%) · fin mediana ${q(R.map(r => r.t), 0.5)}s · p25 ${q(R.map(r => r.t), 0.25)} p75 ${q(R.map(r => r.t), 0.75)} · nivel final ${avg(R.map(r => r.lv))} · kills ${avg(R.map(r => r.kills))} · monedas ganadas ${avg(R.map(r => r.earned))} (en partida ${avg(R.map(r => r.coinsRun))})`);
  console.log(`muere en: ${JSON.stringify(bins)} · primera caída mediana ${q(firstDown, 0.5)}s (p25 ${q(firstDown, 0.25)}) · caídas/partida ${avg(R.map(r => r.downs.length))} · revividas/partida ${avg(R.map(r => r.S.revives))}`);
  console.log(`causas de caída: ${JSON.stringify(Object.fromEntries(Object.entries(causes).sort((a, b) => b[1] - a[1])))}`);
  console.log(`daño recibido %: ${Object.entries(taken).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + Math.round(v / totT * 100)).join(", ")}`);
  console.log(`daño hecho %: ${Object.entries(dmg).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + (v / totD * 100).toFixed(1)).join(", ")}`);
  console.log(`armas en el build final (% de personajes): ${Object.entries(own).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + Math.round(v / nb * 100)).join(", ")}`);
  const per = {}; for (const r of R) { const ownedBy = {}; for (const b of r.build) for (const w of Object.keys(b.w)) ownedBy[w] = (ownedBy[w] || 0) + 1; for (const [w, c] of Object.entries(ownedBy)) { const o = per[w] || (per[w] = []); o.push((r.dmgBy[w] || 0) / c / Math.max(1, r.t)); } }
  console.log(`DPS medio por personaje que la tiene (toda la partida): ${Object.entries(per).sort((a, b) => avg(b[1]) - avg(a[1])).map(([k, v]) => k + " " + Math.round(avg(v))).join(", ")}`);
  const tl = {}; for (const r of R) for (const [k, o] of Object.entries(r.tele || {})) { const t = tl[k] || (tl[k] = { n: 0, off: 0 }); t.n += o.n; t.off += o.off; }
  console.log(`avisos fuera de cámara del atacado: ${Object.entries(tl).map(([k, o]) => k + " " + Math.round(o.off / o.n * 100) + "% de " + o.n).join(", ")}`);
  const pk = {}; for (const r of R) for (const p of r.picks) if (p.kind === "w" && p.lv === 1) pk[p.id] = (pk[p.id] || 0) + 1;
  console.log(`armas nuevas tomadas: ${JSON.stringify(pk)}`);
  console.log(`evoluciones: ${evoN} en ${evoRuns}/${n} partidas, primera t mediana ${q(evoT, 0.5)}s · ${JSON.stringify(evoW)}`);
  console.log(`Luz: muere en ${q(luzK, 0.5)}s mediana (llegan ${R.filter(r => r.S.luz).length}, la matan ${luzK.length}) · Linda: muere en ${q(lindaK, 0.5)}s (llegan ${R.filter(r => r.S.linda).length}) · pedidos ok ${objOk}/${objs.length} · combos de pareja ${avg(R.map(r => r.S.sync))} · élites ${avg(R.map(r => r.S.elites))}`);
  console.log(`nivel a 60/120/210/300/420s: ${[60, 120, 210, 300, 420].map(lvAt).join(" / ")} · subidas por minuto: ${Object.keys(lvPerMin).sort((a, b) => a - b).map(m => (lvPerMin[m] / Math.max(1, alive(+m))).toFixed(1)).join(" ")}`);
  console.log(`min | vivos | kills/s | daño recibido/s | gatos en pantalla | total gatos | ventanas sin daño | vida mínima`);
  for (const m of Object.keys(minute).sort((a, b) => a - b)) { const o = minute[m]; console.log(`${m}-${+m + 1} | ${alive(+m)} | ${avg(o.k)} | ${avg(o.dt)} | ${avg(o.on)} | ${avg(o.en)} | ${Math.round(o.zero / o.n * 100)}% | ${avg(o.hp)}`); }
}
