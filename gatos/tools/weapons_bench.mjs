// DPS aislado de cada arma: un jugador quieto con una sola arma, rodeado de gatos inmóviles de vida infinita.
import { Sim, WEAPONS } from "../js/engine.js";
const dens = [["poca gente (8 gatos en 120 px)", 8, 120], ["horda (40 gatos en 140 px)", 40, 140]];
const rows = [];
for (const [w] of Object.entries(WEAPONS)) for (const evo of [false, true]) {
  const out = [w + (evo ? " EVO" : " nv5")];
  for (const [, N, R] of dens) {
    let tot = 0; const RUNS = 6;
    for (let k = 0; k < RUNS; k++) {
      const sim = new Sim("plaza"); const p = sim.addPlayer("host", "rocio"); p.weapons = { [w]: 5 }; if (evo) p.evo[w] = true;
      sim.spawn = () => {}; sim.updateHazards = () => {}; sim.updateObjective = () => {};
      const home = [];
      for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = 14 + Math.sqrt(Math.random()) * (R - 14); const e = sim.spawnAt("gato", p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); e.hp = e.maxHp = 1e12; e.spd = 0; e.dmg = 0; home.push([e, e.x, e.y]); }
      let dmg = 0; const od = sim.damage.bind(sim); sim.damage = (e, d, pp, kx, ky, raw) => { const b = e.hp; od(e, d, pp, kx, ky, raw); dmg += b - e.hp; };
      const dt = 1 / 60;
      for (let s = 0; s < 30 * 60; s++) { for (const [e, x, y] of home) { e.x = x; e.y = y; e.kx = e.ky = 0; } p.hp = p.maxHp; sim.step(dt, { host: { dir: { x: 0, y: 0 } } }); sim.ev = []; sim.gems = []; }
      tot += dmg / 30;
    }
    out.push(Math.round(tot / RUNS));
  }
  rows.push(out);
}
console.log("arma | " + dens.map(d => d[0]).join(" | ")); for (const r of rows) console.log(r.join(" | "));
