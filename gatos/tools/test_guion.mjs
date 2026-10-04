// Prueba del motor con guion.
// 1) El guion por defecto (ARCADE) da EXACTAMENTE las mismas partidas que el motor de antes del guion: se corren los
//    mismos bots con el mismo azar en los dos motores y se comparan los resultados byte a byte.
//    El motor de referencia sale de git (REF, por defecto 053fb2b, el último commit sin guion).
// 2) La semilla repite la partida; guiones chicos (mezcla, eventos, victoria por tiempo) hacen lo que dicen.
// Uso: node test_guion.mjs   (N=partidas por configuración en la parte 1, por defecto 6)
import assert from "assert/strict";
import fs from "fs";
import path from "path";
import { execFileSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { Sim, ARCADE, makeGuion } from "../js/engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REF = process.env.REF || "053fb2b", N = process.env.N || "6";
let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log("ok -", name); };

/* ---------- 1. arcade idéntico al motor de antes ---------- */
const refFile = path.join(HERE, ".gen", "engine_ref_" + REF + ".js");
fs.mkdirSync(path.dirname(refFile), { recursive: true });
fs.writeFileSync(refFile, execFileSync("git", ["show", REF + ":gatos/js/engine.js"], { cwd: HERE }));
const maps = ["plaza", "estacion", "feria", "bielli", "cancha", "tortugas", "terrazas"];
const run = (out, engine) => {
  fs.rmSync(path.join(HERE, "results", out), { recursive: true, force: true });
  const env = { ...process.env, EXACT: "1", OUT: out, SEED: "11" }; if (engine) env.ENGINE = engine; else delete env.ENGINE;
  return maps.flatMap(m => ["duo", "solo"].map(mode => new Promise((res, rej) => spawn(process.execPath, [path.join(HERE, "run_batch.mjs"), m, mode, N], { env, stdio: "ignore" }).on("exit", c => c ? rej(new Error("run_batch falló")) : res()))));
};
await Promise.all([...run("test_ref", refFile), ...run("test_guion", null)]);
let games = 0;
for (const f of fs.readdirSync(path.join(HERE, "results", "test_ref"))) {
  const a = fs.readFileSync(path.join(HERE, "results", "test_ref", f), "utf8"), b = fs.readFileSync(path.join(HERE, "results", "test_guion", f), "utf8");
  assert.equal(b, a, "distinto en " + f);
  games += JSON.parse(a).length;
}
ok++; console.log(`ok - arcade idéntico byte a byte al motor ${REF} en ${games} partidas con bots (7 mapas, dúo y solo)`);

/* ---------- 2. semilla y guiones chicos ---------- */
const play = (sim, secs, dt = 1 / 30) => {
  const snaps = [];
  for (let i = 0; i < secs / dt; i++) {
    if (sim.state === "levelup") for (const s of Object.keys(sim.offers)) if (sim.offers[s].pick === null) sim.pick(s, 0);
    sim.step(dt, { host: { dir: { x: Math.cos(i / 40), y: Math.sin(i / 53) } } });
    if (i % 30 === 0) snaps.push(JSON.stringify(sim.snapshot()));
  }
  return snaps;
};
t("la misma semilla repite la partida y otra semilla no", () => {
  const mk = seed => { const s = new Sim("feria", undefined, { seed }); s.addPlayer("host", "thomas"); s.setView("host", 195, 422); return s; };
  const a = play(mk(42), 90), b = play(mk(42), 90), c = play(mk(43), 90);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c);
});
t("sin guion se juega ARCADE", () => {
  const s = new Sim("plaza", undefined, { seed: 1 });
  assert.equal(s.G, ARCADE); assert.equal(s.hordes.length, 2); assert.equal(s.bosses.length, 2); assert.deepEqual(s.objTimes, [95, 250, 365]);
});
t("makeGuion completa lo que falta y respeta lo apagado", () => {
  const g = makeGuion({ bosses: [], elites: null, mix: [["negro", 1, 0]] });
  assert.deepEqual(g.bosses, []); assert.equal(g.elites, null); assert.deepEqual(g.orders, ARCADE.orders); assert.deepEqual(g.win, ARCADE.win);
});
t("la mezcla del guion manda: solo negros", () => {
  const s = new Sim("plaza", { mix: [["negro", 1, 0]], bosses: [], hordes: [], orders: [], elites: null, crates: null, pigeons: null, win: {} }, { seed: 5 });
  s.addPlayer("host", "rocio"); s.addPlayer("guest", "thomas"); s.players.host.hp = s.players.guest.hp = 1e9;
  s.players.host.weapons = {}; s.players.guest.weapons = {};
  play(s, 60);
  const types = new Set(s.enemies.map(e => e.type));
  assert.ok(s.enemies.length > 10); assert.deepEqual([...types], ["negro"]);
});
t("tope de la mezcla: nunca más de 2 gordos", () => {
  const s = new Sim("plaza", { mix: [["gordo", 5, 0, null, 2], ["gato", 1, 0]], bosses: [], hordes: [], orders: [], elites: null, crates: null, pigeons: null, win: {} }, { seed: 6 });
  s.addPlayer("host", "rocio"); s.players.host.hp = 1e9; s.players.host.weapons = {};
  let max = 0; for (let i = 0; i < 60 * 30; i++) { if (s.state === "levelup") s.pick("host", 0); s.step(1 / 30, { host: { dir: { x: 0, y: 0 } } }); max = Math.max(max, s.count("gordo")); }
  assert.equal(max, 2);
});
t("eventos con hora: élite, gatos en un punto, calma y victoria por tiempo", () => {
  const g = { bosses: [], hordes: [], orders: [], elites: null, crates: null, pigeons: null, rate: null, mix: [], win: { t: 20 },
    events: [{ t: 5, do: "elite" }, { t: 8, do: "spawn", type: "gordo", n: 3, x: 500, y: 500 }, { t: 9, do: "calm", s: 2 }] };
  const s = new Sim("plaza", g, { seed: 7 }); s.addPlayer("host", "thomas"); s.players.host.hp = 1e9; s.players.host.weapons = {};
  const seen = [];
  for (let i = 0; i < 25 * 30 && s.state !== "win"; i++) { s.step(1 / 30, { host: { dir: { x: 0, y: 0 } } }); for (const e of s.ev) seen.push(e[0]); s.ev = []; }
  assert.ok(seen.includes("elite")); assert.equal(s.count("gordo"), 3); assert.equal(s.state, "win"); assert.ok(Math.abs(s.t - 20) < 0.05);
  assert.ok(s.enemies.find(e => e.elite));
});
t("ganar por matar otro jefe: guion con Luz como objetivo", () => {
  const s = new Sim("plaza", { bosses: [{ t: 1, type: "luz" }], win: { kill: "luz" }, orders: [], hordes: [] }, { seed: 8 });
  s.addPlayer("host", "thomas");
  s.step(1.1, { host: {} });
  const luz = s.enemies.find(e => e.type === "luz"); assert.ok(luz);
  s.damage(luz, 1e9, null, 0, 0, true);
  assert.equal(s.state, "win");
});

console.log(`\n${ok} pruebas del guion en verde`);
