// Prueba de la infraestructura del modo historia en el motor: diálogo (anfitrión e invitado, relevo por tiempo,
// saltar, desconexión, cola con la subida de nivel), objetivos genéricos, aliados, cámara y la foto del estado.
// Uso: node test_historia.mjs
import assert from "assert/strict";
import { Sim, chapterGuion, makeGuion, ENEMY_ID, ENEMY_NAME, ALLY, GOALS } from "../js/engine.js";
import { CHAPTERS, EXAMPLE } from "../js/story.js";

let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log("ok -", name); };
const QUIET = { bosses: [], hordes: [], orders: [], elites: null, crates: null, pigeons: null, hazards: false, rate: null, mix: [], win: {} };
const mk = (g, { duo = true, map = "plaza", seed = 3, safe = true } = {}) => {
  const s = new Sim(map, makeGuion({ ...QUIET, ...g }), { seed });
  s.addPlayer("host", "thomas"); if (duo) s.addPlayer("guest", "rocio");
  for (const p of Object.values(s.players)) { s.setView(p.side, 195, 422); if (safe) { p.hp = p.maxHp = 1e9; } }
  return s;
};
const tick = (s, secs, dt = 1 / 30, input = {}) => { for (let i = 0; i < Math.round(secs / dt); i++) { if (s.state === "levelup") for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0); s.step(dt, input); } };
const L2 = [{ who: "rocio", text: "Primera línea." }, { who: "thomas", text: "Segunda línea." }];

/* ---------- diálogo ---------- */
t("intro: la partida arranca congelada en el diálogo y avanza cuando tocan los dos", () => {
  const s = mk({ intro: L2 });
  s.step(1 / 30, {});
  assert.equal(s.state, "dialog"); assert.equal(s.t, 0);
  let sn = s.snapshot();
  assert.equal(sn.st, "dialog"); assert.deepEqual([sn.dlg.i, sn.dlg.n, sn.dlg.who, sn.dlg.text], [0, 2, "rocio", "Primera línea."]);
  s.adv("host"); assert.equal(s.dlg.i, 0, "con uno solo no avanza");
  sn = s.snapshot(); assert.equal(sn.dlg.r.host, 1);
  s.adv("guest"); assert.equal(s.dlg.i, 1);
  s.adv("guest"); s.adv("host");
  assert.equal(s.state, "run"); assert.equal(s.snapshot().dlg, null);
  const t0 = s.t; s.step(1 / 30, {}); assert.ok(s.t > t0, "después del diálogo la partida corre");
});
t("relevo por tiempo: si nadie toca, cada línea pasa sola a los 6 s", () => {
  const s = mk({ intro: L2 });
  s.step(1 / 30, {});
  tick(s, 5.9); assert.equal(s.dlg.i, 0);
  tick(s, 0.2); assert.equal(s.dlg.i, 1);
  s.adv("host"); tick(s, 6.1);
  assert.equal(s.state, "run"); assert.ok(s.t < 0.5, "el tiempo de juego no corrió durante el diálogo");
});
t("relevo del invitado: si se desconecta en medio, el anfitrión sigue solo", () => {
  const s = mk({ intro: L2 });
  s.step(1 / 30, {}); s.adv("host");
  s.dropPlayer("guest");
  assert.equal(s.dlg.i, 1, "al irse el invitado, el toque del anfitrión alcanza");
  s.adv("host"); assert.equal(s.state, "run");
});
t("saltar: si los dos tocan Saltar se cierra entero; si uno solo, pasa una línea", () => {
  const s = mk({ intro: [...L2, { who: "rocio", text: "Tercera." }] });
  s.step(1 / 30, {});
  s.adv("host", true); s.adv("guest", false); assert.equal(s.dlg.i, 1);
  s.adv("host", true); s.adv("guest", true); assert.equal(s.state, "run"); assert.equal(s.dlg, null);
});
t("jugando solo, un toque alcanza", () => {
  const s = mk({ intro: L2 }, { duo: false });
  s.step(1 / 30, {}); s.adv("host"); assert.equal(s.dlg.i, 1); s.adv("host"); assert.equal(s.state, "run");
});
t("diálogo por evento con hora y diálogo que espera a que terminen de elegir mejora", () => {
  const s = mk({ events: [{ t: 2, do: "dialog", lines: L2, id: "charla" }] });
  tick(s, 1.9); assert.equal(s.state, "run");
  // justo cuando toca el diálogo, sube de nivel: primero se elige, después se habla
  s.gainXp(999);
  assert.equal(s.state, "levelup");
  s.openDialog(L2, { id: "otro" });
  assert.equal(s.state, "levelup");
  while (s.state === "levelup") for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0);
  assert.equal(s.state, "dialog"); assert.equal(s.dlg.id, "otro");
  s.adv("host", true); s.adv("guest", true);
  tick(s, 0.5); assert.equal(s.state, "dialog"); assert.equal(s.dlg.id, "charla");
});
t("epílogo: al cumplir el objetivo se muestra y la victoria llega al cerrarlo", () => {
  const s = mk({ goal: { kind: "survive", dur: 3 }, outro: L2 });
  tick(s, 3.1);
  assert.equal(s.state, "dialog"); assert.equal(s.dlg.id, "outro");
  s.adv("host", true); s.adv("guest", true);
  assert.equal(s.state, "win");
});

/* ---------- objetivos ---------- */
t("los 9 tipos de objetivo existen", () => assert.deepEqual(GOALS.sort(), ["boss", "defend", "escort", "none", "protect", "reach", "survive", "track", "trains"]));
t("survive: gana al cumplir el tiempo, con progreso y tiempo restante en la foto", () => {
  const s = mk({ goal: { kind: "survive", dur: 10, label: "en la plaza" } });
  tick(s, 4.05);
  const g = s.snapshot().goal; assert.equal(g.k, "survive"); assert.equal(g.l, 6); assert.ok(Math.abs(g.p - 40) <= 1); assert.equal(g.lb, "en la plaza");
  tick(s, 6); assert.equal(s.state, "win");
});
t("defend: los gatos van al objetivo y si se rompe se pierde", () => {
  const s = mk({ goal: { kind: "defend", x: 300, y: 300, r: 20, hp: 50, dur: 120 }, rate: { base: 4, per: 1e9, max: 4, cap: 220 }, mix: [["gordo", 1, 0]] });
  for (const p of Object.values(s.players)) { p.weapons = {}; p.x = 340; p.y = 330; }
  let minD = 1e9;
  for (let i = 0; i < 60 * 30 && s.state === "run"; i++) { s.step(1 / 30, {}); for (const e of s.enemies) minD = Math.min(minD, Math.hypot(e.x - 300, e.y - 300)); }
  assert.equal(s.state, "over"); assert.ok(minD < 40);
  assert.equal(s.goal.target.hp, 0);
  const sn = s.snapshot(); assert.equal(sn.goal.hp, 0); assert.deepEqual([sn.goal.x, sn.goal.y, sn.goal.r], [300, 300, 20]);
});
t("defend: si aguanta el tiempo, se gana", () => {
  const s = mk({ goal: { kind: "defend", hp: 300, dur: 5 } });
  tick(s, 5.1); assert.equal(s.state, "win");
});
t("protect: si cae el aliado protegido se pierde", () => {
  const s = mk({ goal: { kind: "protect", ally: "gatalinda", dur: 40 } });
  tick(s, 1);
  const a = s.allies[0]; assert.equal(a.type, "gatalinda"); assert.ok(s.lures.includes(a));
  s.hurtAlly(a, 1e9); tick(s, 0.1);
  assert.equal(s.state, "over");
});
t("escort: el aliado camina al destino si hay alguien cerca y se gana al llegar", () => {
  const s = mk({ goal: { kind: "escort", ally: "carmelo", to: [512, 300], r: 20 } });
  tick(s, 0.1);
  const a = s.goal.ally; assert.equal(a.type, "carmelo");
  // los jugadores lo acompañan
  for (let i = 0; i < 30 * 30 && s.state === "run"; i++) { for (const p of Object.values(s.players)) { p.x = a.x + 10; p.y = a.y + 5; } s.step(1 / 30, {}); }
  assert.equal(s.state, "win"); assert.equal(s.snapshot().goal.p, 100);
});
t("escort: solo, sin nadie cerca, no avanza hacia el destino", () => {
  const s = mk({ goal: { kind: "escort", ally: "carmelo", to: [512, 200], r: 20 } });
  tick(s, 0.1);
  const a = s.goal.ally; for (const p of Object.values(s.players)) { p.x = 900; p.y = 900; }
  const y0 = a.y; tick(s, 3, 1 / 30, { host: { pos: { x: 900, y: 900 } }, guest: { pos: { x: 900, y: 900 } } });
  assert.ok(a.y >= y0, "se fue hacia el jugador, no hacia el destino");
});
t("trains: cuenta los trenes que pasan", () => {
  const s = mk({ goal: { kind: "trains", n: 2 }, hazards: true }, { map: "estacion" });
  tick(s, 120);
  assert.equal(s.state, "win"); assert.equal(s.goal.n, 2);
});
t("track: juntar los rastros (se ven en la foto) y gana; con tiempo, se pierde si no llegan", () => {
  const s = mk({ goal: { kind: "track", n: 3 } });
  tick(s, 0.1);
  const pts = s.snapshot().goal.pts; assert.equal(pts.length, 3);
  for (const [x, y] of pts) { s.players.host.x = x; s.players.host.y = y; tick(s, 0.1, 1 / 30, { host: { pos: { x, y } } }); }
  assert.equal(s.state, "win");
  const s2 = mk({ goal: { kind: "track", pts: [[100, 100], [900, 900]], dur: 3 } });
  tick(s2, 3.2); assert.equal(s2.state, "over");
});
t("boss: aparece el jefe y gana al vencerlo", () => {
  const s = mk({ goal: { kind: "boss", type: "luz", t: 1 } });
  tick(s, 1.2);
  const b = s.enemies.find(e => e.type === "luz"); assert.ok(b);
  s.damage(b, b.hp * 0.6, null, 0, 0, true); tick(s, 0.1); assert.ok(s.snapshot().goal.p >= 59);
  s.damage(b, 1e9, null, 0, 0, true); assert.equal(s.state, "win");
});
t("reach: llegar a un punto gana", () => {
  const s = mk({ goal: { kind: "reach", to: [200, 200], r: 20 } });
  tick(s, 0.1); s.players.guest.x = 205; s.players.guest.y = 205; tick(s, 0.1, 1 / 30, { guest: { pos: { x: 205, y: 205 } } });
  assert.equal(s.state, "win");
});
t("none: no gana solo; un evento termina el capítulo", () => {
  const s = mk({ goal: { kind: "none" }, events: [{ t: 3, do: "win" }] });
  tick(s, 2); assert.equal(s.state, "run"); assert.equal(s.snapshot().goal, null);
  tick(s, 1.1); assert.equal(s.state, "win");
});
t("hitos del objetivo: { at: 'goal50' } dispara una sola vez", () => {
  const s = mk({ goal: { kind: "survive", dur: 10 }, events: [{ at: "goal50", do: "dialog", lines: L2, id: "mitad" }] });
  tick(s, 4.9); assert.equal(s.state, "run");
  tick(s, 0.2); assert.equal(s.state, "dialog"); assert.equal(s.dlg.id, "mitad");
  s.adv("host", true); s.adv("guest", true); tick(s, 1); assert.equal(s.state, "run");
});

/* ---------- aliados ---------- */
t("ids de aliados al final de ENEMY_ID, sin tocar los de antes", () => {
  assert.deepEqual(ENEMY_NAME.slice(0, 11), ["gato", "negro", "paloma", "gordo", "luz", "linda", "saltarin", "escupidor", "madre", "gatito", "caja"]);
  for (const k of Object.keys(ALLY)) assert.ok(ENEMY_ID[k] > 10, k);
});
t("lista A en la foto: 6 números por aliado, como E", () => {
  const s = mk({ allies: ["corbata", { id: "carmelo", hp: 99 }] });
  tick(s, 0.5);
  const A = s.snapshot().A; assert.equal(A.length, 12);
  assert.equal(A[1], ENEMY_ID.corbata); assert.equal(A[7], ENEMY_ID.carmelo);
  assert.equal(s.allies[1].maxHp, 99);
});
t("aliado que embiste: avisa, carga en línea y pega", () => {
  const s = mk({ allies: ["corbata"] });
  for (const p of Object.values(s.players)) p.weapons = {};
  tick(s, 0.1); const a = s.allies[0];
  const e = s.spawnAt("gordo", a.x + 60, a.y); e.hp = e.maxHp = 1e6; e.spd = 0;
  let tele = false, rush = false;
  for (let i = 0; i < 4 * 30; i++) { s.step(1 / 30, {}); const f = s.snapshot().A[4]; if (f & 2) tele = true; if (f & 8) rush = true; }
  assert.ok(tele && rush); assert.ok(e.hp < 1e6);
});
t("aliado de área y aliado que sigue: pegan y acompañan", () => {
  const s = mk({ allies: ["gatalinda", "carmelo"] });
  for (const p of Object.values(s.players)) p.weapons = {};
  tick(s, 0.1);
  const [gl, ca] = s.allies;
  const e1 = s.spawnAt("gordo", gl.x + 20, gl.y); e1.hp = e1.maxHp = 1e6; e1.spd = 0;
  const e2 = s.spawnAt("gordo", ca.x + 8, ca.y); e2.hp = e2.maxHp = 1e6; e2.spd = 0;
  tick(s, 4); assert.ok(e1.hp < 1e6 && e2.hp < 1e6);
  s.players.host.x = 200; s.players.host.y = 200; s.players.guest.x = 210; s.players.guest.y = 200;
  tick(s, 12, 1 / 30, { host: { pos: { x: 200, y: 200 } }, guest: { pos: { x: 210, y: 200 } } });
  assert.ok(Math.hypot(ca.x - 205, ca.y - 200) < 60, "Carmelo siguió a los jugadores");
});
t("un aliado que cae (y no es el objetivo) se levanta solo", () => {
  const s = mk({ allies: ["corbata"] });
  tick(s, 0.1); s.hurtAlly(s.allies[0], 1e9);
  assert.ok(s.snapshot().A[4] & 64);
  tick(s, 10.2); assert.equal(s.allies[0].down, false);
});

/* ---------- cámara ---------- */
t("cámara: evento a un punto por unos segundos, a un aliado, y por línea de diálogo", () => {
  const s = mk({ allies: ["corbata"], events: [{ t: 1, do: "cam", x: 100, y: 120, s: 2 }, { t: 4, do: "cam", ally: "corbata" }, { t: 6, do: "dialog", lines: [{ who: "thomas", text: "Mirá allá.", cam: [700, 650] }] }] });
  assert.equal(s.snapshot().cam, null);
  tick(s, 1.5); assert.deepEqual(s.snapshot().cam, [100, 120]);
  tick(s, 2); assert.equal(s.snapshot().cam, null);
  tick(s, 1); const a = s.allies[0]; assert.deepEqual(s.snapshot().cam, [Math.round(a.x), Math.round(a.y)]);
  tick(s, 1.6); assert.equal(s.state, "dialog"); assert.deepEqual(s.snapshot().cam, [700, 650]);
});

/* ---------- el story.js de ejemplo ---------- */
t("story.js de ejemplo: marcado como ejemplo, contrato de DISENO.md sección 6", () => {
  assert.equal(EXAMPLE, true);
  const ch = CHAPTERS[0];
  for (const k of ["id", "n", "map", "title", "sub", "intro", "goal", "dur", "mix", "events", "allies", "outro", "unlock"]) assert.ok(k in ch, k);
  assert.equal(ch.intro.length, 2); assert.equal(ch.goal.kind, "defend"); assert.equal(ch.dur, 60);
});
t("capítulo de ejemplo con bots: intro de 2 líneas, se defiende la fuente 60 s y termina", () => {
  const ch = CHAPTERS[0];
  const s = new Sim(ch.map, chapterGuion(ch), { seed: 9 });
  s.addPlayer("host", "thomas"); s.addPlayer("guest", "rocio");
  for (const p of Object.values(s.players)) s.setView(p.side, 195, 422);
  s.step(1 / 30, {}); assert.equal(s.state, "dialog"); assert.equal(s.snapshot().cap, "prueba");
  s.adv("host"); s.adv("guest"); s.adv("host"); s.adv("guest");
  const types = new Set(); let elites = 0, minHp = 100;
  for (let i = 0; i < 70 * 30 && (s.state === "run" || s.state === "levelup"); i++) {
    if (s.state === "levelup") { for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0); continue; }
    // los dos se quedan cerca de la fuente
    s.step(1 / 30, { host: { dir: { x: Math.cos(i / 20) * 0.6, y: Math.sin(i / 20) * 0.6 } }, guest: { pos: { x: 512 + Math.cos(i / 25) * 40, y: 560 } } });
    for (const e of s.ev) if (e[0] === "elite") elites++;
    for (const e of s.enemies) types.add(e.type);
    minHp = Math.min(minHp, s.snapshot().goal ? s.snapshot().goal.hp : minHp);
  }
  assert.ok(s.state === "win" || s.state === "over", "terminó: " + s.state);
  assert.equal(elites, 1); for (const k of types) assert.ok(["gato", "saltarin", "caja", "paloma"].includes(k), k);
  console.log(`   (capítulo de ejemplo: ${s.state === "win" ? "ganado" : "perdido"} a los ${s.t.toFixed(1)} s, la fuente quedó con ${minHp}% como mínimo)`);
});

console.log(`\n${ok} pruebas del modo historia en verde`);
