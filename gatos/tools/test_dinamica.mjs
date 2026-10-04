// Pruebas de la dinámica del arcade (cambios 1 a 11 de la auditoría). Rápidas, en Node, con semilla fija.
// Uso: node test_dinamica.mjs
import assert from "assert/strict";
import { Sim, ARCADE, ENEMY, ENEMY_ID, ENEMY_NAME, ALLY, MID_OF, METAS, coinsFor, COMBO, MAITENA, chapterGuion, F_STUN, F_BAG, F_FLASH, F_TELE, F_ELITE, F_RUSH, F_WET, F_LEFT, F_DOWN } from "../js/engine.js";
import * as H from "../js/historia.js";

let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log("ok -", name); };
const mk = (map = "plaza", duo = true, g, opts = {}) => {
  const s = new Sim(map, g, { seed: 7, ...opts });
  s.addPlayer("host", "thomas", opts.meta || {}); if (duo) s.addPlayer("guest", "rocio", opts.meta || {});
  for (const k of Object.keys(s.players)) s.setView(k, 195, 422);
  return s;
};
const pickAll = s => { if (s.state === "levelup") for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0); };
const still = { host: { dir: { x: 0, y: 0 } }, guest: { dir: { x: 0, y: 0 } } };

t("ids nuevos al final: sparring 30 y ladrón 31, sin tocar los de antes", () => {
  assert.equal(ENEMY_ID.sparring, 30); assert.equal(ENEMY_ID.ladron, 31); assert.equal(ENEMY_ID.amanda, 16);
  assert.equal(ENEMY_NAME[30], "sparring"); assert.equal(ENEMY_NAME[7], "escupidor");
});
t("1. el escupidor no carga si su objetivo no lo ve, y sí si lo ve a menos de 95 px", () => {
  const s = mk("plaza", false); const p = s.players.host; s.step(1 / 30, still);
  const off = s.spawnAt("escupidor", p.x + 90, p.y - 230); off.cd = 0; // a 90 px de costado pero fuera de pantalla (vertical)
  assert.equal(s.sees(p, off.x, off.y - 10), false);
  const on = s.spawnAt("escupidor", p.x + 80, p.y); on.cd = 0;
  s.step(1 / 30, still);
  assert.equal(on.st, 1, "el que se ve carga"); assert.notEqual(off.st, 1, "el de afuera no carga");
});
t("2. Luz tiene vida extra (x1,8 tras calibrar), marca a uno y se frena si la pareja está pegada", () => {
  const s = mk(); s.t = 209.99; s.step(1 / 30, still);
  const L = s.bossRef; assert.equal(L.type, "luz"); assert.ok(L.pair);
  const ref = mk(); ref.G = { ...ref.G, bosses: [{ t: 0, type: "luz" }] }; ref.bosses = ref.G.bosses; ref.step(1 / 30, still);
  assert.ok(Math.abs(L.maxHp / ref.bossRef.maxHp - ARCADE.bosses[0].hp) < 0.2, "vida x" + ARCADE.bosses[0].hp);
  let marks = 0, stuns = 0;
  for (let i = 0; i < 30 * 12 && s.state !== "over"; i++) {
    for (const p of Object.values(s.players)) p.hp = p.maxHp;
    const h = s.players.host; s.players.guest.x = h.x + 8; s.players.guest.y = h.y; // pegados
    s.step(1 / 30, still); pickAll(s);
    for (const e of s.ev) { if (e[0] === "lmark") marks++; if (e[0] === "stun") stuns++; } s.ev = [];
  }
  assert.ok(marks >= 2 && stuns >= 1, `marcas ${marks}, frenadas ${stuns}`);
});
t("3. cada mapa tiene su evento a los 4:40 y termina antes de la horda de las 5:30", () => {
  for (const [map, k] of Object.entries(MID_OF)) {
    const s = mk(map, true, { bosses: [] }); s.t = 279; let start = null, end = null;
    for (let i = 0; i < 30 * 50; i++) { for (const p of Object.values(s.players)) p.hp = p.maxHp; s.step(1 / 30, still); pickAll(s); for (const e of s.ev) if (e[0] === "mid") { if (e[2]) start = [e[1], s.t]; else end = s.t; } s.ev = []; if (end) break; }
    assert.ok(start && start[0] === k, map + ": arrancó " + (start && start[0])); assert.ok(start[1] >= 280 && end <= 326, `${map}: de ${start[1]} a ${end}`);
  }
  const ch = chapterGuion({ id: "x", map: "plaza", goal: { kind: "none" } }); assert.equal(ch.mid, null); assert.equal(ch.fast, null); assert.equal(ch.second, null);
});
t("3. el gato ladrón se lleva gemas y las suelta si lo agarran", () => {
  const s = mk("plaza", false, { bosses: [], mid: null }); s.t = 301; const p = s.players.host;
  for (let i = 0; i < 6; i++) s.gems.push({ x: p.x + 150 + i, y: p.y, v: 2, pull: 0 });
  const L = s.spawnAt("ladron", p.x + 170, p.y); L.hp = L.maxHp = 1e9;
  for (let i = 0; i < 60; i++) { s.step(1 / 30, { host: { dir: { x: 0, y: 0 } } }); pickAll(s); }
  assert.ok(L.bag > 0, "robó " + L.bag);
  const n = s.gems.length; L.hp = 1; s.damage(L, 10, null, 0, 0, true);
  assert.ok(s.gems.some(g => g.v >= L.bag), "soltó lo robado"); assert.ok(s.gems.length > n - 1);
});
t("4. arranque rápido: reloj en 0:30, una mejora para elegir y saltarines desde el arranque", () => {
  const s = mk("plaza", true, undefined, { fast: true }); s.step(1 / 30, still);
  assert.equal(s.t >= 30, true); assert.equal(s.state, "levelup"); assert.equal(s.level, 2);
  assert.ok(s.G.mix.some(m => m[0] === "saltarin" && m[2] === 15)); assert.equal(s.G.pigeons.from, 15);
  const n = mk("plaza"); assert.equal(n.t, 0); assert.equal(n.G, ARCADE);
});
t("5. combo medialuna al mate: solo con el hilo y entre armas de los dos", () => {
  const run = (gap, same) => {
    const s = mk("plaza", true, { bosses: [], hordes: [], mid: null }); s.t = 330;
    const h = s.players.host, g = s.players.guest; h.weapons = same ? { patada: 1 } : { mate: 5 }; g.weapons = same ? { medialuna: 5, mate: 5 } : { medialuna: 5 };
    for (let i = 0; i < 30 * 20; i++) { h.hp = h.maxHp; g.hp = g.maxHp; s.step(1 / 30, { host: { pos: { x: 500, y: 500 } }, guest: { pos: { x: 500 + gap, y: 505 } } }); pickAll(s); s.ev = []; }
    return s.stats.cb.mate;
  };
  assert.ok(run(10, false) > 0, "juntos y con armas de los dos sale"); assert.equal(run(120, false), 0, "separados no"); assert.equal(run(10, true), 0, "con las dos armas de uno no");
  assert.equal(COMBO.mate, 1.5);
});
t("6. roles: el arma que tiene tu pareja pesa la mitad y la que combina se anuncia", () => {
  const s = mk(); const h = s.players.host, g = s.players.guest; g.weapons = { medialuna: 1, torta: 1 };
  let dupe = 0, cb = 0, n = 0;
  for (let i = 0; i < 3000; i++) for (const o of s.rollOffers(h)) { if (o.kind !== "w" || o.lv !== 1) continue; n++; if (o.id === "medialuna") dupe++; if (o.cb) { cb++; assert.equal(o.who, "rocio"); } }
  const solo = mk("plaza", false); let dupe0 = 0, n0 = 0;
  for (let i = 0; i < 3000; i++) for (const o of solo.rollOffers(solo.players.host)) { if (o.kind !== "w" || o.lv !== 1) continue; n0++; if (o.id === "medialuna") dupe0++; }
  assert.ok(dupe / n < dupe0 / n0 * 0.75, `medialuna ${(dupe / n * 100).toFixed(1)}% contra ${(dupe0 / n0 * 100).toFixed(1)}% sin pareja`);
  assert.ok(cb > 0);
});
t("8. segunda chance: una sola vez y solo con Linda", () => {
  const s = mk(); s.t = 419.95; s.step(1 / 30, still); s.step(1 / 30, still);
  assert.equal(s.bossRef.type, "linda");
  for (const p of Object.values(s.players)) { p.inv = 0; s.hurt(p, 9999); }
  s.step(1 / 30, still); assert.equal(s.state, "run"); assert.equal(s.stats.second, 1);
  for (const p of Object.values(s.players)) { assert.ok(p.hp > 0 && !p.downed); p.inv = 0; s.hurt(p, 9999); }
  s.step(1 / 30, still); assert.equal(s.state, "over");
  const e = mk(); for (const p of Object.values(e.players)) { p.inv = 0; e.hurt(p, 9999); } e.step(1 / 30, still); assert.equal(e.state, "over", "sin Linda no hay segunda chance");
});
t("9. monedas: ganar paga x1,5 (x1,25 con segunda chance), picante x1,4; metas y sin fin", () => {
  const base = coinsFor({ co: 100, kl: 1200, t: 400, tier: 0 });
  assert.equal(base, 100 + 100 + 20);
  assert.equal(coinsFor({ co: 100, kl: 1200, t: 400, tier: 0, win: true }), Math.round(base * 1.5));
  assert.equal(coinsFor({ co: 100, kl: 1200, t: 400, tier: 0, win: true, second: true }), Math.round(base * 1.25));
  assert.equal(coinsFor({ co: 100, kl: 1200, t: 400, tier: 2, hot: true }), Math.round(base * 1.24 * 1.4));
  const s = mk("feria"); s.stats.mid = METAS.feria.mid[0]; s.stats.ped = 3; s.state = "win";
  assert.deepEqual(s.metas(), [1, 1, 1]); s.stats.downs = 1; assert.deepEqual(s.metas(), [1, 1, 0]);
  const snap = s.snapshot(); assert.deepEqual(snap.mt, [1, 1, 0]);
  const e = mk("plaza", true, undefined, { sinfin: true }); e.t = 420; e.step(1 / 30, still); const L = e.bossRef; L.hp = 1; e.damage(L, 10, null, 0, 0, true);
  assert.equal(e.state, "run"); assert.equal(e.stats.won, 1);
});
t("11. Maitena en el arcade: solo si alguno la desbloqueó, recarga larga, noquea en el radio y es la misma de la historia", () => {
  // integración: un solo camino para la historia y el arcade (js/historia.js). main.js arma el guion del arcade con
  // specials.maitena si alguno de los dos tiene prof.unlock["special:maitena"]; la carga es compartida y el botón es "mai"
  const s = mk("plaza", false, { specials: { maitena: true }, bosses: [], mid: null }); const p = s.players.host;
  s.t = 200; s.step(1 / 30, still);
  assert.ok(s.mai, "habilitada"); assert.equal(s.mai.need, MAITENA.kills, "en el arcade carga con MAITENA.kills");
  const n = mk("plaza", false); n.step(1 / 30, still); assert.equal(n.mai, null, "sin desbloquear no hay botón");
  const h = new Sim("bielli", chapterGuion({ id: "x", n: 4, goal: { kind: "survive", dur: 60 }, events: [{ at: "start", do: "special", id: "maitena" }] }), { seed: 7 }); h.addPlayer("host", "thomas"); h.step(1 / 30, still);
  assert.ok(h.mai && h.mai.need < MAITENA.kills, "en la historia carga más rápido");
  const cats = []; for (let i = 0; i < 8; i++) { const e = s.spawnAt("gordo", p.x + 30 + i * 8, p.y + 10); e.hp = e.maxHp = 1e6; cats.push(e); }
  s.step(1 / 30, { host: { dir: { x: 0, y: 0 }, mai: true } }); assert.equal(s.allies.length, 0, "sin carga no sale");
  s.mai.base = s.kills - MAITENA.kills; s.step(1 / 30, { host: { dir: { x: 0, y: 0 }, mai: true } }); assert.equal(s.allies.length, 1); assert.equal(s.mai.k, 0, "gastó la carga");
  let ko = 0;
  for (let i = 0; i < 30 * 7; i++) { p.hp = p.maxHp; s.step(1 / 30, still); pickAll(s); ko = Math.max(ko, cats.filter(e => e.ko > s.t).length); }
  assert.ok(cats.every(e => e.maxHp - e.hp >= MAITENA.dmg), "las patadas pegaron"); assert.ok(ko >= 6, "noqueó " + ko); assert.equal(s.allies.length, 0, "se fue");
});
t("integración con la historia: banderas sin choques, ids con nombre y la historia sin la dinámica del arcade", () => {
  // engine.js: 1..64 de siempre, 512 aturdido (el mismo bit que la historia), 2048 ladrón; historia.js: 128, 256, 1024
  assert.equal(F_STUN, H.F_STUN, "aturdido es el mismo bit en los dos");
  const base = [F_FLASH, F_TELE, F_ELITE, F_RUSH, F_WET, F_LEFT, F_DOWN];
  for (const f of [H.F_MARK, H.F_BUFF, H.F_SURR, F_BAG]) assert.ok(!base.includes(f) && f !== F_STUN, "bandera " + f + " libre");
  assert.equal(new Set([H.F_MARK, H.F_BUFF, H.F_SURR, F_STUN, F_BAG]).size, 5);
  for (const k of [...Object.keys(ENEMY), ...Object.keys(ALLY)]) { assert.ok(ENEMY_ID[k] !== undefined, "sin id: " + k); assert.equal(ENEMY_NAME[ENEMY_ID[k]], k); }
  const G = new Sim("plaza", chapterGuion({ id: "x", n: 1, goal: { kind: "survive", dur: 60 } })).G;
  assert.equal(G.mid, null); assert.equal(G.fast, null); assert.equal(G.second, null);
  const c = new Sim("plaza", chapterGuion({ id: "x", n: 1, goal: { kind: "survive", dur: 60 } }), { fast: true }); assert.equal(c.fast, false, "sin arranque rápido en la historia");
});
console.log(`\n${ok} pruebas de dinámica en verde`);
