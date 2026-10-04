// Bot del modo historia: juega un capítulo de js/story.js contra el motor real (sin pantalla), solo o de a dos.
// Usa el cerebro del arcade (bot.mjs: esquiva, junta gemas) y le suma lo que pide cada objetivo: acompañar a Carmelo
// y calmarlo, cruzar al rescate después del segundo tren, pararse en el rastro, pegarse al marcado por Luz (o llevarla a
// la cucha jugando solo), ir al punto, quedarse con la gata Linda. "afk" es un jugador que no se mueve ni pega:
// sirve para probar que un capítulo se puede perder.
// Uso: node bot_historia.mjs [N=3] [capítulo]   → tabla con resultado y duración por capítulo, solo y dúo
import { pathToFileURL, fileURLToPath } from "url";
import { brain, choose } from "./bot.mjs";
import { Sim, chapterGuion } from "../js/engine.js";
import { CHAPTERS } from "../js/story.js";

const READ_S = 4; // segundos por línea de diálogo: se escribe sola (28 ms por letra), se lee y tocan los dos

export function storyBrain(sim, p, other) {
  const base = brain(sim, p, other);
  // onda del berrinche: esquivar (el esquive da medio segundo de invulnerabilidad), como haría una persona
  for (const W of sim.waves || []) { const r = W.R * Math.min(1, W.t / W.dur), d = Math.hypot(p.x - W.x, p.y - W.y); if (d > r && d - r < 22) base.dash = true; }
  const g = sim.goal; if (!g || g.done) return base;
  let tx = null, ty = null, w = 0, tol = 10;
  const set = (x, y, k, t = 10) => { tx = x; ty = y; w = k; tol = t; };
  const aim = g.aim;
  switch (g.k) {
    case "escort": {
      const A = g.ally; if (!A) break;
      if (A.cry) set(A.x, A.y, 4, 8);
      else { const nx = g.path[g.wp] || A; const dx = nx.x - A.x, dy = nx.y - A.y, m = Math.hypot(dx, dy) || 1; set(A.x + dx / m * 20 + (p.side === "host" ? -12 : 12), A.y + dy / m * 20, 2.6, 14); }
      break;
    }
    case "trains": if (aim) set(aim.x, aim.y, 2.2, 6); else if (g.def.start) set(g.def.start.x, g.def.start.y + 30, 0.8, 60); break;
    case "track": if (aim) set(aim.x + (p.side === "host" ? -5 : 5), aim.y, 2.4, 4); break;
    case "reach": case "protect": if (aim) set(aim.x + (p.side === "host" ? -8 : 8), aim.y + 6, 2, g.k === "protect" ? 30 : 6); break;
    case "defend": if (aim) set(aim.x, aim.y + 20, 1.6, 40); break;
    case "boss": {
      const B = g.boss;
      if (B && B.type === "luz2" && B.st === 1) {
        const P = sim.players[B.mk];
        if (other && P && P !== p) set(P.x, P.y, 6, 4);
        else if (!other) { const c = sim.points().cucha; if (c) set(c.x, c.y, 6, 6); }
      } else if (B && B.type === "luz2" && !other) { const c = sim.points().cucha; if (c) set(c.x + 30, c.y, 1.2, 50); }
      // premios: levantarlos antes que los gatos
      let pr = null, pd = 160; for (const q of sim.premios || []) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < pd) { pd = d; pr = q; } }
      if (pr) set(pr.x, pr.y, 1.4, 2);
      break;
    }
  }
  if (tx === null) return base;
  // con poca vida, primero salvarse (como haría una persona)
  const life = p.hp / p.maxHp; w *= life > 0.5 ? 1 : life > 0.3 ? 0.45 : 0.12;
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < tol) return base;
  const fx = base.dir.x + dx / d * w, fy = base.dir.y + dy / d * w, m = Math.hypot(fx, fy) || 1;
  return { ...base, dir: { x: fx / m, y: fy / m } };
}

// juega un capítulo: devuelve el resultado, el tiempo de juego y las líneas de diálogo vistas
export function playChapter(ch, { duo = true, seed = 1, dt = 1 / 30, maxT = 900, afk = false, policy = "builder", meta = {} } = {}) {
  const sim = new Sim(ch.map, chapterGuion(ch, { solo: !duo }), { seed });
  // solo: Thomas o Rocío según la semilla (a dúo, los dos)
  sim.addPlayer("host", duo || seed % 2 ? "thomas" : "rocio", meta); if (duo) sim.addPlayer("guest", "rocio", meta);
  for (const s of Object.keys(sim.players)) sim.setView(s, 195, 422);
  if (afk) for (const p of Object.values(sim.players)) { p.weapons = {}; }
  let lines = 0, lastDlg = "", downs = 0, steps = 0;
  const trig = [];
  while (sim.state !== "over" && sim.state !== "win" && sim.t < maxT && steps < 2e6) {
    steps++;
    if (sim.state === "dialog") {
      const d = sim.dlg, k = d.id + ":" + d.i + ":" + d.lines.length; if (k !== lastDlg) { lastDlg = k; lines++; }
      const line = d.lines[d.i];
      for (const s of Object.keys(sim.players)) sim.adv(s, false, line && line.ask ? line.ask.a : undefined);
      continue;
    }
    if (sim.state === "levelup") { for (const s of Object.keys(sim.offers)) if (sim.offers[s] && sim.offers[s].pick === null) sim.pick(s, choose(policy, sim.players[s], sim.offers[s].opts)); continue; }
    const inp = {};
    for (const [s, p] of Object.entries(sim.players)) {
      if (afk) { inp[s] = { dir: { x: 0, y: 0 } }; continue; }
      const o = Object.values(sim.players).find(q => q !== p);
      inp[s] = storyBrain(sim, p, o);
      if (sim.mai && sim.mai.k >= 1) inp[s].mai = true;
    }
    sim.step(dt, inp);
    for (const e of sim.ev) { if (e[0] === "down") downs++; if (e[0] === "goaldone" || e[0] === "rescue" || e[0] === "boss" || e[0] === "sphase" || e[0] === "maitena") trig.push([Math.round(sim.t), e[0], e[1]]); }
    sim.ev = [];
  }
  return { id: ch.id, n: ch.n, duo, state: sim.state, t: Math.round(sim.t), lines, read: Math.round(lines * READ_S), lv: sim.level, kills: sim.kills, downs, stars: sim.stars || 0, goalP: sim.goal ? Math.round(sim.goal.p * 100) : null, trig, sim };
}

const fmt = s => { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const N = +(process.argv[2] || 3), only = process.argv[3];
  console.log("cap  modo  gana   juego (min-max)   + lectura  nivel  caídas  estrellas");
  for (const ch of CHAPTERS) {
    if (only !== undefined && ch.id !== only && String(ch.n) !== only) continue;
    for (const duo of [false, true]) {
      const rs = []; for (let i = 0; i < N; i++) rs.push(playChapter(ch, { duo, seed: 1000 + i * 7919 + ch.n }));
      const wins = rs.filter(r => r.state === "win"), ts = wins.map(r => r.t).sort((a, b) => a - b);
      const med = ts.length ? ts[Math.floor(ts.length / 2)] : 0;
      console.log(`${String(ch.n).padEnd(4)} ${duo ? "dúo " : "solo"}  ${wins.length}/${N}   ${ts.length ? fmt(med) + " (" + fmt(ts[0]) + "-" + fmt(ts[ts.length - 1]) + ")" : "  -  "}   + ${fmt(rs[0].read)}   ${Math.round(rs.reduce((a, r) => a + r.lv, 0) / N)}   ${(rs.reduce((a, r) => a + r.downs, 0) / N).toFixed(1)}   ${wins.length ? (wins.reduce((a, r) => a + r.stars, 0) / wins.length).toFixed(1) : "-"}   ${rs.filter(r => r.state !== "win").map(r => r.state + "@" + r.t + " p" + r.goalP).join(" ")}`);
    }
  }
}
