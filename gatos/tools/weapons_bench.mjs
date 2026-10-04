// DPS aislado de cada arma: un jugador quieto con una sola arma, rodeado de gatos inmóviles de vida infinita.
// RUNS=corridas por celda (6). ENGINE=otro engine.js. La columna "media" promedia las dos densidades; al final, para
// nivel 5, cuánto se aparta cada arma de la mediana (objetivo de la dinámica 7: todas dentro de ±35%).
import path from "path";
import { pathToFileURL } from "url";
import { seedMath } from "./azar.mjs";
seedMath(+(process.env.SEED || 1)); // posiciones repetibles: la misma semilla da el mismo banco
const { Sim, WEAPONS } = await import(process.env.ENGINE ? pathToFileURL(path.resolve(process.env.ENGINE)).href : "../js/engine.js");
const dens = [["poca gente (8 gatos en 120 px)", 8, 120], ["horda (40 gatos en 140 px)", 40, 140]];
const rows = [];
for (const [w] of Object.entries(WEAPONS)) for (const evo of [false, true]) {
  const out = [w + (evo ? " EVO" : " nv5")];
  for (const [, N, R] of dens) {
    let tot = 0; const RUNS = +(process.env.RUNS || 6);
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
  out.push(Math.round((out[1] + out[2]) / 2));
  rows.push(out);
}
console.log("arma | " + dens.map(d => d[0]).join(" | ") + " | media"); for (const r of rows) console.log(r.join(" | "));
const nv5 = rows.filter(r => r[0].endsWith("nv5")), med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
for (const [col, name] of [[3, "media"], [1, "poca gente"], [2, "horda"]]) {
  const m = med(nv5.map(r => r[col]));
  console.log(`\nnivel 5, ${name}: mediana ${m} · ` + nv5.map(r => `${r[0].replace(" nv5", "")} ${r[col] >= m ? "+" : ""}${Math.round((r[col] / m - 1) * 100)}%`).join(", ") + ` · fuera de ±35%: ${nv5.filter(r => Math.abs(r[col] / m - 1) > 0.35).map(r => r[0].replace(" nv5", "")).join(", ") || "ninguna"}`);
}
