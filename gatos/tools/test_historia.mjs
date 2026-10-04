// Prueba del modo historia en el motor.
// 1) Infraestructura: diálogo (anfitrión e invitado, relevo por tiempo, saltar, desconexión, cola con la subida de
//    nivel), objetivos genéricos, aliados, cámara y la foto del estado.
// 2) El guion real (js/story.js): cada mecánica nueva (disparadores, EVENT_DO, NEW_TYPES, aliados, especial de Maitena,
//    variante solo) y cada capítulo jugado entero con el bot (tools/bot_historia.mjs), solo y de a dos, más un jugador
//    que no hace nada para probar que se puede perder. Imprime la duración de cada capítulo.
// Uso: node test_historia.mjs   (SEEDS=semillas por capítulo y modo, por defecto 2)
import assert from "assert/strict";
import { Sim, chapterGuion, makeGuion, ENEMY, ENEMY_ID, ENEMY_NAME, ALLY, GOALS, MAPS, WEAPONS } from "../js/engine.js";
import * as STORY from "../js/story.js";
import * as EJEMPLO from "./story_ejemplo.js";
import { playChapter } from "./bot_historia.mjs";
const { CHAPTERS } = STORY;

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
  const sn = s.snapshot(); assert.equal(sn.goal.hp, 0); assert.deepEqual(sn.goal.T[0].slice(0, 3), [300, 300, 20]);
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
  tick(s, 10.2); assert.equal(s.allies[0].down, true, "Corbata tarda 20 s en volver de la cucha");
  tick(s, 10); assert.equal(s.allies[0].down, false);
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

/* ---------- el capítulo de ejemplo (tools/story_ejemplo.js) sigue andando ---------- */
t("capítulo de ejemplo con bots: intro de 2 líneas, se defiende la fuente 60 s y termina", () => {
  assert.equal(EJEMPLO.EXAMPLE, true);
  const ch = EJEMPLO.CHAPTERS[0];
  const s = new Sim(ch.map, chapterGuion(ch), { seed: 9 });
  s.addPlayer("host", "thomas"); s.addPlayer("guest", "rocio");
  for (const p of Object.values(s.players)) s.setView(p.side, 195, 422);
  s.step(1 / 30, {}); assert.equal(s.state, "dialog"); assert.equal(s.snapshot().cap, "prueba");
  s.adv("host"); s.adv("guest"); s.adv("host"); s.adv("guest");
  for (let i = 0; i < 70 * 30 && (s.state === "run" || s.state === "levelup"); i++) {
    if (s.state === "levelup") { for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0); continue; }
    s.step(1 / 30, { host: { dir: { x: Math.cos(i / 20) * 0.6, y: Math.sin(i / 20) * 0.6 } }, guest: { pos: { x: 512 + Math.cos(i / 25) * 40, y: 560 } } });
  }
  assert.ok(s.state === "win" || s.state === "over", "terminó: " + s.state);
});

/* ---------- el guion real: forma ---------- */
const ch = id => CHAPTERS.find(c => c.id === id);
const mkCh = (id, { duo = true, seed = 5, safe = true, quiet = true } = {}) => {
  const c = ch(id), g = chapterGuion(c, { solo: !duo });
  if (quiet) { g.rate = null; g.mix = []; g.crates = null; g.pigeons = null; g.hordes = []; g.orders = []; }
  const s = new Sim(c.map, g, { seed });
  s.addPlayer("host", "thomas"); if (duo) s.addPlayer("guest", "rocio");
  for (const p of Object.values(s.players)) { s.setView(p.side, 195, 422); if (safe) p.hp = p.maxHp = 1e9; }
  s.step(1 / 30, {}); // arranca: aliados, objetivo e intro
  return s;
};
const skipDlg = s => { let n = 0; while (s.state === "dialog" && n++ < 200) { const l = s.dlg.lines[s.dlg.i]; for (const k of Object.keys(s.players)) s.adv(k, false, l && l.ask ? l.ask.a : undefined); } };
const run = (s, secs, inp = () => ({})) => { for (let i = 0; i < Math.round(secs * 30) && s.state !== "win" && s.state !== "over"; i++) { skipDlg(s); if (s.state === "levelup") { for (const k of Object.keys(s.offers)) if (s.offers[k].pick === null) s.pick(k, 0); continue; } s.step(1 / 30, inp(s)); } };
const at = (x, y) => s => Object.fromEntries(Object.keys(s.players).map((k, i) => [k, { pos: { x: x + (i ? 6 : -6), y } }]));
// registra los eventos aunque la foto vacíe la lista (snapshot() hace this.ev = [])
const evs = s => { const out = []; const wrap = arr => { const o = arr.push.bind(arr); arr.push = (...a) => { out.push(...a); return o(...a); }; return arr; }; let cur = wrap(s.ev); Object.defineProperty(s, "ev", { get: () => cur, set: v => { cur = wrap(v); }, configurable: true }); return out; };

t("guion real: 9 capítulos (prólogo, 7 y epílogo), mapas con zona caminable y todo adentro", () => {
  assert.equal(CHAPTERS.length, 9); assert.deepEqual(CHAPTERS.map(c => c.n), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (const c of CHAPTERS) {
    const b = MAPS[c.map].b; assert.ok(b, c.map);
    const inB = (q, m = 0) => q.x >= b[0] - m && q.x <= b[2] + m && q.y >= b[1] - m && q.y <= b[3] + m;
    const G = c.goal;
    for (const q of [...(G.path || []), ...(G.spots || []), ...(G.targets || []), G.start, G.rescue, G.spawn, G.then && G.then.x !== undefined ? G.then : null].filter(Boolean)) assert.ok(inB(q), `${c.id}: (${q.x}, ${q.y}) fuera de ${b}`);
    for (const e of c.events) for (const k of ["pos", "from"]) if (e[k] && e.do !== "ally") assert.ok(inB(e[k]), `${c.id} ${e.do} ${k}`);
    for (const l of [...c.intro, ...c.outro, ...c.events.flatMap(e => [...(e.lines || []), ...(e.onOk || []), ...(e.onFail || [])])]) {
      assert.ok(STORY.SPEAKERS[l.who], "quién habla: " + l.who);
      assert.ok(!/—/.test(l.text), "guion largo en: " + l.text);
    }
  }
});
t("guion real: los tipos de mezcla existen y las acciones y disparadores son los documentados", () => {
  for (const c of CHAPTERS) {
    for (const [k] of c.mix) assert.ok(ENEMY[k], `${c.id}: ${k}`);
    for (const e of c.events) {
      assert.ok(STORY.EVENT_DO[e.do] || e.do === "spawn", `${c.id}: acción ${e.do}`);
      if (e.at) assert.ok(STORY.TRIGGERS[e.at] || /^(step:\d+|tag:\w+|goal\d+)$/.test(e.at), `${c.id}: disparador ${e.at}`);
      if (e.at && e.at.startsWith("tag:")) assert.ok((c.goal.path || []).some(q => q.tag === e.at.slice(4)), `${c.id}: no hay punto con ${e.at}`);
    }
  }
  for (const k of Object.keys(STORY.NEW_TYPES)) assert.ok(ENEMY[k] && ENEMY_ID[k] > 16, k);
  assert.equal(WEAPONS.juli.evo.name, "Juliano Benito Mostacholi"); assert.equal(WEAPONS.romero.evo.name, "Monsieur Gomeghooo");
});
t("variante solo: el objetivo se mezcla y los campos del capítulo se pisan", () => {
  const g = chapterGuion(ch("plaza"), { solo: true }); assert.equal(g.goal.near, 90); assert.deepEqual(g.goal.fleeEvery, [60, 75]); assert.equal(g.goal.path.length, ch("plaza").goal.path.length);
  const f = chapterGuion(ch("feria"), { solo: true }); assert.equal(f.goal.fill, 14); assert.equal(f.goal.r, 26); assert.deepEqual(f.hordes, []);
  const t6 = chapterGuion(ch("tortugas"), { solo: true }); assert.equal(t6.goal.then.time, 60); assert.equal(t6.goal.then.kind, "protect");
  const a5 = chapterGuion(ch("abuela"), { solo: true }); assert.ok(a5.events.some(e => e.do === "hint" && /cucha/.test(e.text)));
  const d = chapterGuion(ch("feria")); assert.equal(d.goal.fill, 24); assert.equal(d.hordes.length, 1);
});

/* ---------- mecánicas, una por una ---------- */
t("prólogo: defender dos objetivos con sesgo; si cae uno se pierde una estrella, no el capítulo", () => {
  const s = mkCh("prologo"); skipDlg(s); s.step(1 / 30, {});
  assert.equal(s.goal.targets.length, 2); assert.equal(s.goal.failOnLoss, false);
  s.goal.targets[0].hp = 0; run(s, 1);
  assert.equal(s.state === "dialog" ? "run" : s.state, "run"); assert.equal(s.score.lost, 1);
  const sn = s.snapshot(); assert.equal(sn.goal.T.length, 2); assert.equal(sn.goal.T[0][5], 1);
  // con sesgo 0,6, más o menos 6 de cada 10 gatos van a la mesa o al horno
  let lb = 0; for (let i = 0; i < 400; i++) { const e = s.spawnAt("gato", 600, 700); s.pickLure(e, 1e9); lb += e.lb; e.hp = 0; }
  assert.ok(lb > 200 && lb < 280, "sesgo " + lb);
});
t("prólogo: los chicos están en la cocina y la cinemática se los lleva sin pausar", () => {
  const s = mkCh("prologo"); skipDlg(s);
  assert.deepEqual(s.allies.map(a => a.type).sort(), ["amanda", "chema"]);
  run(s, 78.2); assert.equal(s.state, "run", "la cinemática no pausa");
  const sn = s.snapshot(); assert.ok(sn.tk && sn.tk[1] === "chema", "subtítulo"); assert.ok(sn.cam, "la cámara sigue a los chicos");
  run(s, 12); assert.equal(s.allies.filter(a => a.type === "chema" || a.type === "amanda").length, 0, "se fueron");
  assert.ok(s.players.host.weapons.juli, "Juli se sumó a los 40 s");
});
t("cap. 1: Carmelo camina solo con alguien cerca, se asusta, llora (allyDown) y se calma", () => {
  const s = mkCh("plaza"); skipDlg(s); s.step(1 / 30, {});
  const A = s.goal.ally; assert.equal(A.type, "carmelo");
  const x0 = A.x; run(s, 2, at(900, 300)); assert.equal(A.x, x0, "sin nadie cerca no camina");
  run(s, 3, s2 => at(A.x + 20, A.y)(s2)); assert.ok(A.x > x0 + 20, "con alguien cerca camina");
  const out = evs(s); for (let i = 0; i < 5; i++) { A.inv = 0; s.hurtAlly(A, 5); }
  assert.ok(A.cry); assert.ok(out.some(e => e[0] === "allydown"));
  assert.equal(s.state, "dialog", "el diálogo de allyDown"); skipDlg(s);
  run(s, 2.5, s2 => at(A.x + 10, A.y)(s2)); assert.ok(!A.cry, "se calmó con alguien al lado");
});
t("cap. 1: recorrido completo con tags (sarmiento, mástiles), mitad y llegada a la catedral", () => {
  const s = mkCh("plaza"); skipDlg(s); s.step(1 / 30, {});
  const A = s.goal.ally, seen = new Set(); const o = s.fire.bind(s); s.fire = (k, d) => { seen.add(k); return o(k, d); };
  s.goal.flee = [9e9, 9e9]; s.goal.fleeNext = 9e9;
  run(s, 400, s2 => at(A.x + 16, A.y + 4)(s2));
  assert.equal(s.state, "win"); for (const k of ["tag:sarmiento", "tag:mastiles", "tag:catedral", "goalDone"]) assert.ok(seen.has(k), k);
  assert.ok(s.atEvents.find(e => e.at === "goal50").fired);
});
t("cap. 2: los trenes cuentan (step:N), el rescate se habilita después del segundo y suma a Amanda", () => {
  const s = mkCh("estacion"); skipDlg(s); s.step(1 / 30, {});
  assert.equal(s.allies[0].type, "amanda"); assert.equal(s.allies[0].cfg.act, "idle");
  const R = s.goal.res; let rs = null;
  run(s, 400, s2 => { if (s2.goal.n >= 2 && !R.done) return at(R.x, R.y)(s2); return at(512, 640)(s2); });
  assert.equal(s.state, "win"); assert.ok(R.done); assert.equal(s.goal.n >= 3, true);
  assert.equal(s.allies.find(a => a.type === "amanda").cfg.act, "follow");
  void rs;
});
t("cap. 2: antes del segundo tren pararse en el refugio no rescata", () => {
  const s = mkCh("estacion"); skipDlg(s); s.step(1 / 30, {});
  const R = s.goal.res; run(s, 20, at(R.x, R.y)); assert.equal(R.prog, 0); assert.equal(s.snapshot().goal.rs[3], -1);
});
t("cap. 3: rastros de a uno, con espera entre uno y otro, que se vencen y saltan", () => {
  const s = mkCh("feria"); skipDlg(s); s.step(1 / 30, {});
  const S = s.goal.spot; const x0 = S.x;
  run(s, 61, at(100, 900)); assert.notEqual(S.x, x0, "se venció y saltó"); assert.equal(s.score.miss, 1);
  assert.ok(s.enemies.filter(e => e.type === "negro").length >= 6, "llegó una tanda de negros");
  run(s, 12, s2 => at(S.x, S.y)(s2)); assert.equal(s.goal.cur, 0); run(s, 4, s2 => at(S.x, S.y)(s2)); assert.equal(s.goal.cur, 1, "los dos juntos llenan en 14 s");
  assert.ok(s.snapshot().goal.wt > 0, "el siguiente aparece más tarde");
});
t("cap. 3: el tercer rastro da a Romero (arma) y la liquidación de cajones", () => {
  const s = mkCh("feria"); skipDlg(s); s.step(1 / 30, {});
  const S = s.goal.spot; run(s, 400, s2 => at(S.x, S.y)(s2));
  assert.equal(s.state, "win"); assert.equal(s.players.host.weapons.romero, 2);
});
t("cap. 4: sobrevivir; a la mitad entra Maitena (gratis una vez) y queda el especial", () => {
  const s = mkCh("bielli"); skipDlg(s); const out = evs(s);
  run(s, 151); skipDlg(s);
  assert.ok(out.some(e => e[0] === "maitena"), "entró"); assert.ok(s.mai, "especial habilitado");
  assert.ok(out.filter(e => e[0] === "elite" && Math.hypot(e[1] - 690, e[2] - 570) < 30).length >= 2, "élites con guantes que salen del ring");
  run(s, 160); assert.equal(s.state, "win");
});
t("Llamá a Maitena: se carga con 60 gatos; solo sale al toque; de a dos, si tocan los dos en 2,5 s, sale doble", () => {
  const s = mkCh("bielli", { duo: false }); skipDlg(s); s.mai = { k: 0, base: s.kills }; const out = evs(s);
  s.step(1 / 30, { host: { mai: true } }); assert.ok(!out.some(e => e[0] === "maitena"), "sin carga no sale");
  s.kills += 60; s.step(1 / 30, { host: { mai: true } }); assert.ok(out.some(e => e[0] === "maitena" && e[1] === 0), "solo sale apenas tocás");
  const d = mkCh("bielli"); skipDlg(d); d.mai = { k: 0, base: d.kills - 60 }; const o2 = evs(d);
  d.step(1 / 30, { host: { mai: true } }); assert.ok(!o2.some(e => e[0] === "maitena")); assert.equal(d.snapshot().mai[1], "host");
  run(d, 1); d.step(1 / 30, { guest: { mai: true } }); assert.ok(o2.some(e => e[0] === "maitena" && e[1] === 1), "doble");
  const e = mkCh("bielli"); skipDlg(e); e.mai = { k: 0, base: e.kills - 60 }; const o3 = evs(e);
  e.step(1 / 30, { host: { mai: true } }); run(e, 2.7); assert.ok(o3.some(q => q[0] === "maitena" && q[1] === 0), "si el otro no toca, sale simple");
  // las tres patadas aturden y pegan
  const g = e.spawnAt("gordo", e.maiOn ? e.maiOn.x : 512, e.maiOn ? e.maiOn.y : 600); g.hp = g.maxHp = 1e5;
  run(e, 3); assert.ok(g.hp < 1e5);
});
t("cap. 5: Luz pelea de pareja: si el otro está pegado al marcado, se frena y queda aturdida (x1,5)", () => {
  const s = mkCh("abuela"); skipDlg(s); run(s, 111); skipDlg(s);
  const L = s.enemies.find(e => e.type === "luz2"); assert.ok(L && L.surrender);
  L.cd = 0; L.x = 512; L.y = 300;
  run(s, 0.1, at(512, 520)); assert.equal(L.st, 1); const P = s.players[L.mk], O = Object.values(s.players).find(q => q !== P);
  run(s, 1.2, () => ({ [P.side]: { pos: { x: 512, y: 520 } }, [O.side]: { pos: { x: 520, y: 522 } } }));
  assert.equal(L.st, 3, "aturdida"); assert.equal(L.dmgIn, 1.5);
  const h = L.hp; s.damage(L, 100, null, 0, 0, true); assert.equal(h - L.hp, 150);
  L.st = 0; L.cd = 0; run(s, 0.1, () => ({ host: { pos: { x: 300, y: 700 } }, guest: { pos: { x: 800, y: 700 } } })); run(s, 1.2, () => ({ host: { pos: { x: 300, y: 700 } }, guest: { pos: { x: 800, y: 700 } } }));
  assert.equal(L.st === 2 || L.st === 0, true, "separados, carga");
});
t("cap. 5: fase 2 al 50% (bossPhase2), se rinde a 0 (goalDone) y aparece la caniche", () => {
  const s = mkCh("abuela"); skipDlg(s); run(s, 111); skipDlg(s);
  const L = s.enemies.find(e => e.type === "luz2"); const out = evs(s);
  s.damage(L, L.hp * 0.55, null, 0, 0, true); run(s, 0.2);
  assert.ok(out.some(e => e[0] === "sphase" && e[1] === 2)); skipDlg(s);
  s.damage(L, 1e9, null, 0, 0, true); assert.ok(L.surr && L.hp > 0, "no muere: se rinde");
  s.step(1 / 30, {}); assert.equal(s.state, "dialog"); assert.equal(s.dlg.id, "outro");
  assert.ok(s.allies.some(a => a.type === "caniche"), "la caniche entra en escena");
  skipDlg(s); assert.equal(s.state, "win");
});
t("cap. 5 solo: la cucha de Corbata hace de pareja", () => {
  const s = mkCh("abuela", { duo: false }); skipDlg(s); run(s, 111); skipDlg(s);
  const L = s.enemies.find(e => e.type === "luz2"); const c = s.points().cucha;
  L.st = 0; L.cd = 0; run(s, 1.3, at(c.x + 6, c.y)); assert.equal(L.st, 3);
});
t("cap. 6: llegar por el recorrido (hold en el puente), rescatar al Chema, después proteger a la gata Linda", () => {
  const s = mkCh("tortugas"); skipDlg(s); s.step(1 / 30, {});
  const seen = new Set(); const o = s.fire.bind(s); s.fire = (k, d) => { seen.add(k); return o(k, d); };
  run(s, 400, s2 => { const g = s2.goal; const a = g.k === "protect" ? g.at : g.aim || { x: 512, y: 430 }; return at(a.x, a.y)(s2); });
  assert.equal(s.state, "win"); for (const k of ["tag:puente", "tag:torre", "rescue", "goalDone"]) assert.ok(seen.has(k), k);
  assert.ok(s.allies.some(a => a.type === "chema") && s.allies.some(a => a.type === "gatalinda"));
});
t("cap. 6: llamada del comisario: si aciertan los dos, caja; si uno se equivoca, nada", () => {
  for (const [ans, prize] of [[[1, 1], true], [[1, 0], false]]) {
    const s = mkCh("tortugas"); skipDlg(s); run(s, 29.9);
    while (s.state !== "dialog") s.step(1 / 30, {});
    while (!s.dlg.lines[s.dlg.i].ask) { s.adv("host"); s.adv("guest"); }
    assert.deepEqual(s.snapshot().dlg.o, ["Una", "Dos", "Tres"]);
    const k0 = s.pickups.filter(p => p.k === "caja").length;
    s.adv("host", false, ans[0]); assert.equal(s.dlg.lines[s.dlg.i].ask ? 1 : 0, 1, "espera al otro"); s.adv("guest", false, ans[1]);
    assert.equal(s.pickups.filter(p => p.k === "caja").length - k0, prize ? 1 : 0);
    assert.match(s.dlg.lines[s.dlg.i].text, prize ? /Correcto/ : /Mal/);
  }
});
t("cap. 6: si cae la gata Linda se pierde con su cartel; si cae Corbata, no", () => {
  const s = mkCh("tortugas"); skipDlg(s); s.step(1 / 30, {});
  const C = s.allies.find(a => a.type === "corbata"); s.hurtAlly(C, 1e9); run(s, 0.5); skipDlg(s); assert.equal(s.state, "run");
  s.doEvent({ do: "ally", who: "gataLinda", from: { x: 600, y: 600 } });
  const G = s.allies.find(a => a.type === "gatalinda"); s.hurtAlly(G, 1e9);
  assert.equal(s.state, "over"); assert.deepEqual(s.snapshot().eb, ["Se llevaron a Linda", "Revancha"]);
});
t("cap. 7: la caniche (en escena hasta los 100 s) pasa por premios, carritos y berrinche, y se rinde", () => {
  const s = mkCh("terrazas"); skipDlg(s);
  assert.ok(s.allies.some(a => a.type === "caniche" && a.cfg.act === "idle"));
  run(s, 101); skipDlg(s);
  const B = s.enemies.find(e => e.type === "canicheBoss"); assert.ok(B); assert.ok(!s.allies.some(a => a.type === "caniche"));
  const out = evs(s);
  run(s, 4, at(200, 900)); assert.ok(s.enemies.some(e => e.type === "premio"), "tiró premios");
  // un gato que come un premio se agranda; un jugador que lo pisa lo levanta
  const P = s.enemies.find(e => e.type === "premio"); const c = s.spawnAt("gato", P.x + 2, P.y); run(s, 0.3, at(200, 900));
  assert.ok(c.buffT > s.t || P.gone, "lo comió");
  const P2 = s.dropPremio(600, 700); run(s, 0.2, at(600, 700)); assert.ok(P2.gone, "lo levantó");
  s.damage(B, B.hp * 0.4, null, 0, 0, true); run(s, 0.5); skipDlg(s);
  assert.ok(out.some(e => e[0] === "sphase" && e[1] === 2)); run(s, 8, at(200, 900)); assert.ok(out.some(e => e[0] === "warn" && e[1] === "carritos"), "carritos");
  s.damage(B, B.hp * 0.7, null, 0, 0, true); run(s, 0.5); skipDlg(s);
  assert.ok(out.some(e => e[0] === "sphase" && e[1] === 3)); run(s, 5, at(200, 900)); assert.ok(out.some(e => e[0] === "tantrum"), "berrinche");
  assert.ok(s.snapshot().Wv.length || out.some(e => e[0] === "tantrum"));
  s.damage(B, 1e9, null, 0, 0, true); s.step(1 / 30, {}); assert.equal(s.dlg && s.dlg.id, "outro"); skipDlg(s); assert.equal(s.state, "win");
});
t("aliados: Corbata embiste, Amanda marca (+25%), el Chema cura si están juntos", () => {
  const s = mkCh("terrazas"); skipDlg(s);
  const out = evs(s);
  for (let i = 0; i < 6; i++) { const e = s.spawnAt("gordo", 512 + i * 3, 700); e.hp = e.maxHp = 1e5; e.spd = 0; }
  for (const p of Object.values(s.players)) { p.hp = 50; p.maxHp = 100; }
  run(s, 9, at(500, 690));
  assert.ok(out.some(e => e[0] === "charge"), "Corbata embistió"); assert.ok(out.some(e => e[0] === "mark"), "Amanda marcó");
  const m = s.enemies.find(e => e.markT > s.t); if (m) assert.equal(m.dmgIn, 1.25);
  assert.ok(s.players.host.hp > 50, "ronroneo del Chema");
});
t("epílogo: sin combate, escena con el elenco, epílogo y créditos", () => {
  const s = mkCh("epilogo", { quiet: false }); skipDlg(s); for (let i = 0; i < 30 && s.state === "run"; i++) s.step(1 / 30, {});
  assert.equal(s.state === "dialog" ? s.dlg.id : s.state, "outro");
  assert.ok(s.allies.length >= 8); assert.equal(s.enemies.filter(e => e.type !== "caja").length, 0);
  skipDlg(s); assert.equal(s.state, "win"); assert.ok(s.G.credits.length);
});
t("foto: estado de la historia en JSON chico (objetivo, cartel, subtítulo, ondas, especial)", () => {
  const s = mkCh("terrazas"); skipDlg(s); run(s, 4);
  const sn = s.snapshot(); for (const k of ["goal", "hn", "tk", "Wv", "mai", "A"]) assert.ok(k in sn, k);
  assert.ok(JSON.stringify(sn).length < 6000);
  const a = new Sim("plaza", undefined, { seed: 1 }); a.addPlayer("host", "thomas"); a.step(1 / 30, {});
  const as = a.snapshot(); assert.equal(as.goal, null); assert.ok(!("hn" in as), "el arcade no suma campos");
});

/* ---------- cada capítulo, entero, con el bot ---------- */
const SEEDS = +(process.env.SEEDS || 2);
const fmt = x => { x = Math.round(x); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`; };
const rows = [];
for (const c of CHAPTERS) {
  t(`capítulo ${c.n} (${c.title}): el bot lo completa solo y de a dos`, () => {
    for (const duo of [false, true]) {
      const rs = []; for (let i = 0; i < SEEDS + 2 && rs.filter(r => r.state === "win").length < SEEDS; i++) rs.push(playChapter(c, { duo, seed: 31 + i * 101 }));
      const wins = rs.filter(r => r.state === "win");
      assert.ok(wins.length >= 1, `${c.id} ${duo ? "dúo" : "solo"}: no ganó nunca (${rs.map(r => r.state + "@" + r.t).join(", ")})`);
      const tm = wins.reduce((a, r) => a + r.t, 0) / wins.length;
      console.log(`   cap. ${c.n} ${duo ? "dúo " : "solo"}: ganó ${wins.length}/${rs.length}, juego ${fmt(tm)} + lectura ${fmt(wins[0].read)} = ${fmt(tm + wins[0].read)}`);
      if (c.n >= 1 && c.n <= 7) assert.ok(tm + wins[0].read >= 200 && tm + wins[0].read <= 400, `${c.id}: duración ${fmt(tm + wins[0].read)} fuera de 3:20 a 6:40`);
    }
  });
  if (c.goal.kind !== "none") t(`capítulo ${c.n}: se puede perder (un jugador que no hace nada)`, () => {
    const r = playChapter(c, { duo: true, seed: 7, afk: true, maxT: 700 });
    assert.notEqual(r.state, "win", `${c.id}: ganó sin hacer nada`);
  });
}
console.log(rows.join("\n"));

console.log(`\n${ok} pruebas del modo historia en verde`);
