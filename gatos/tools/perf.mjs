// Mide el costo de Sim.step por sección, el de snapshot() y el tamaño de lo que manda el anfitrión,
// imitando el bucle de main.js (step + snapshot cada cuadro a 60 Hz, envío cada >= 0,05 s con los eventos acumulados).
// Uso: node --expose-gc perf.mjs <escenario: real|estres|estres_quietos> [mapa] [segundos]   (ENGINE=ruta para otro motor)
// Corre con Math.random con semilla (SEED, por defecto 1) para que antes y después se comparen con la misma partida.
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { seedMath } from "./azar.mjs";
seedMath(+(process.env.SEED || 1));
const { Sim } = await import(pathToFileURL(process.env.ENGINE || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../js/engine.js")).href);
import { brain, choose } from "./bot.mjs";
import { pack } from "peerjs-js-binarypack";
import { PerformanceObserver, performance } from "perf_hooks";

const [scen = "real", map = "plaza", dur = "460"] = process.argv.slice(2);
let gcMs = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) gcMs += e.duration; }).observe({ entryTypes: ["gc"] });

const sim = new Sim(map, undefined, { seed: +(process.env.SEED || 1) });
sim.addPlayer("host", "thomas"); sim.addPlayer("guest", "rocio");
for (const s of Object.keys(sim.players)) sim.setView(s, 195, 422);
const SECT = ["revive", "spawn", "buildGrid", "moveEnemies", "weapons", "updateProjectiles", "updateHazards", "updateObjective", "updateGems", "cleanup"];
const acc = {}; for (const k of [...SECT, "snapshot", "step"]) acc[k] = 0;
if (!process.env.CLEAN) for (const k of SECT) { const f = sim[k]; sim[k] = function (...a) { const t0 = performance.now(); const r = f.apply(this, a); acc[k] += performance.now() - t0; return r; }; }
const CNT = { targets: 0, nearest: 0, near: 0, alive: 0, count: 0, damage: 0 };
if (!process.env.CLEAN) for (const k of Object.keys(CNT)) { const f = sim[k]; sim[k] = function (...a) { CNT[k]++; return f.apply(this, a); }; }

if (scen.startsWith("estres")) {
  // peor caso: 220 gatos vivos, los dos con 5 armas evolucionadas, daño casi nulo para que no mueran
  for (const p of Object.values(sim.players)) {
    p.weapons = p.char === "thomas" ? { patada: 5, juli: 5, mate: 5, bondi: 5, torta: 5 } : { medialuna: 5, romero: 5, rodillo: 5, torta: 5, mate: 5 };
    for (const w of Object.keys(p.weapons)) p.evo[w] = true;
    p.dmgMul = 1e-4;
  }
  sim.t = 300;
}
const dt = 1 / 60;
let pending = [], sendAcc = 0, frames = 0;
const per = []; let win = { n: 0, step: 0, snap: 0, sends: 0, json: 0, bin: 0, hits: 0, ev: 0, en: 0, maxStep: 0, gc: 0, sec: {}, cnt: {} };
const rec = [];
let lastSec = Math.floor(sim.t);
while (sim.t < +dur && sim.state !== "win") {
  if (sim.state === "levelup") { for (const s of Object.keys(sim.offers)) if (sim.offers[s].pick === null) sim.pick(s, choose("builder", sim.players[s], sim.offers[s].opts)); continue; }
  if (sim.state === "over") break;
  const inp = {};
  for (const [s, p] of Object.entries(sim.players)) { p.hp = p.maxHp; inp[s] = brain(sim, p, Object.values(sim.players).find(q => q !== p)); }
  if (scen === "estres_quietos" || scen.startsWith("estres")) {
    // mantener 220 gatos: si bajan, rellenar alrededor
    while (sim.enemies.length < 220) { const q = sim.edgePos(150); sim.spawnAt(sim.pickType(), q.x, q.y); }
    for (const e of sim.enemies) { if (e.hp < 1e6) e.hp = e.maxHp = 1e9; }
  }
  const before = { ...acc };
  const t0 = performance.now(); sim.step(dt, inp); const t1 = performance.now();
  const snap = sim.snapshot(); const t2 = performance.now();
  frames++;
  for (const e of snap.ev) { pending.push(e); }
  sendAcc += dt;
  if (sendAcc >= 0.05) {
    sendAcc = 0;
    const msg = { t: "s", s: { ...snap, ev: pending } };
    const js = JSON.stringify(msg).length, bin = pack(msg).byteLength;
    win.sends++; win.json += js; win.bin += bin; win.hits += pending.filter(e => e[0] === "hit").length; win.ev += pending.length;
    const gp = sim.players.guest, inV = (x, y) => Math.abs(x - gp.x) < 97.5 + 40 && Math.abs(y - gp.y) < 211 + 40;
    const G2 = []; for (let i = 0; i < snap.G.length; i += 3) if (inV(snap.G[i], snap.G[i + 1])) G2.push(snap.G[i], snap.G[i + 1], snap.G[i + 2]);
    const E2 = []; for (let i = 0; i < snap.E.length; i += 6) if (inV(snap.E[i + 2], snap.E[i + 3])) E2.push(...snap.E.slice(i, i + 6));
    const evNoHit = pending.filter(e => e[0] !== "hit" || inV(e[1], e[2]));
    const cullMsg = { t: "s", s: { ...snap, G: G2, K: snap.K.filter(k => inV(k[1], k[2])), E: E2, ev: evNoHit } };
    const binCull = pack(cullMsg).byteLength, jsCull = JSON.stringify(cullMsg).length;
    win.binCull = (win.binCull || 0) + binCull;
    if (rec.length < 400 && [60, 180, 300, 420].some(T => Math.abs(sim.t - T) < 0.5)) rec.push({ t: Math.round(sim.t), js, bin, jsCull, binCull, E: snap.E.length / 6, G: snap.G.length / 3, B: snap.B.length / 4, ev: pending.length, hits: pending.filter(e => e[0] === "hit").length, parts: Object.fromEntries(["E", "B", "H", "G", "K", "U", "M", "P", "of", "ev"].map(k => [k, JSON.stringify(k === "ev" ? pending : snap[k]).length])) });
    pending = [];
  }
  win.n++; win.step += t1 - t0; win.snap += t2 - t1; win.en += sim.enemies.length; win.maxStep = Math.max(win.maxStep, t1 - t0);
  for (const k of SECT) win.sec[k] = (win.sec[k] || 0) + acc[k] - before[k];
  const sec = Math.floor(sim.t);
  if (sec !== lastSec && sec % 10 === 0) {
    per.push({ t: sec, en: Math.round(win.en / win.n), stepMs: +(win.step / win.n).toFixed(3), maxStepMs: +win.maxStep.toFixed(2), snapMs: +(win.snap / win.n).toFixed(3), sendsPerS: +(win.sends / (win.n * dt)).toFixed(1), jsonKBs: +(win.json / (win.n * dt) / 1024).toFixed(1), binKBs: +(win.bin / (win.n * dt) / 1024).toFixed(1), binCullKBs: +((win.binCull || 0) / (win.n * dt) / 1024).toFixed(1), jsonB: Math.round(win.json / Math.max(1, win.sends)), binB: Math.round(win.bin / Math.max(1, win.sends)), hitsPerS: Math.round(win.hits / (win.n * dt)), evPerS: Math.round(win.ev / (win.n * dt)), gcMsPerS: +(gcMs / (win.n * dt)).toFixed(2), sec: Object.fromEntries(Object.entries(win.sec).map(([k, v]) => [k, +(v / win.n).toFixed(3)])), cnt: Object.fromEntries(Object.entries(CNT).map(([k, v]) => [k, Math.round(v / win.n)])) });
    win = { n: 0, step: 0, snap: 0, sends: 0, json: 0, bin: 0, hits: 0, ev: 0, en: 0, maxStep: 0, gc: 0, sec: {}, cnt: {} }; gcMs = 0; for (const k of Object.keys(CNT)) CNT[k] = 0;
  }
  lastSec = sec;
}
console.log(JSON.stringify({ scen, map, frames, per, rec: rec.filter((r, i, a) => a.findIndex(x => x.t === r.t) === i) }));
