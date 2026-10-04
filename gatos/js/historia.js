// Runtime del modo historia de "Gatos de Linda 2.0" ("La otra Linda"): ejecuta el guion de js/story.js sobre el motor.
// engine.js lo instala sobre Sim al final del archivo (installStory). Todo lo que importa para la historia viaja como
// estado en la foto (diálogo, objetivo, aliados, cartel, subtítulo, ondas, especial), no como evento suelto.
// En el arcade sin aliados, objetivo ni especiales nada de esto corre y no se consume azar (test_guion.mjs).
//
// Qué resuelve: objetivos (defend, escort, survive, trains, track, boss, reach, protect, none, con `then` y variante
// solo), disparadores (start, goalNN, goalDone, allyDown, bossPhase2/3, step:N, tag:X, rescue), las acciones de
// EVENT_DO, los tipos nuevos (guantes, luz2, canicheBoss, premio), los aliados (Carmelo, Corbata, gata Linda, el Chema,
// Amanda, Maitena y los de escena) y el especial "Llamá a Maitena".

let K = null; // constantes de engine.js (se pasan al instalar para no importar en círculo)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const ANG = a => Math.atan2(Math.sin(a), Math.cos(a));
// en el guion los aliados se llaman como en story.js; en el motor, como en ENEMY_ID
const ALLY_ID = { gataLinda: "gatalinda", gatalinda: "gatalinda" };
const allyId = w => ALLY_ID[w] || w;
// quién habla → a quién mira la cámara en un diálogo (aliado o jefa)
const SPEAKER_ALLY = { carmelo: "carmelo", corbata: "corbata", gata: "gatalinda", chema: "chema", amanda: "amanda", maitena: "maitena", caniche: "caniche", juli: "juli", romero: "romero" };
const SPEAKER_BOSS = { luz: "luz2", caniche: "canicheBoss" };
const KID_BARKS = {
  carmelo: { kick: ["¡Patadita!", "¡Tomá, gato!"], flee: ["¡Paloma! ¡Vení que te doy un abrazo!"], cry: ["¡Quiero a mi mamá!"], calm: ["Bueno. Ya está. Vamos."] },
  amanda: { mark: ["Miau. Ese es el más grande.", "Ese. El gordo."] },
  chema: { purr: ["Rrrrr.", "Están juntos. Qué bien."] },
  corbata: { charge: ["¡Guau!"], back: ["Guau. (Volvió.)"] },
  gatalinda: { hit: ["Yo soy la mala, querido.", "Siete vidas, ¿te acordás?"] },
  maitena: { in: ["¡Correte, Thomas!", "Invicta, dije.", "¿Otra vez yo?"] }
};
export const MAITENA_KILLS = 60;   // gatos para cargar "Llamá a Maitena"
export const MAITENA_PAIR = 2.5;   // segundos para que el otro también lo toque

/* ---------- capítulo de story.js → guion del motor ---------- */
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function merge(a, b) { const o = { ...a }; for (const [k, v] of Object.entries(b || {})) o[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : v; return o; }

export function storyGuion(ch0, opts = {}, ARCADE) {
  const solo = !!opts.solo, S = (solo && ch0.solo) || {};
  // la variante para uno puede pisar también campos del capítulo (rate, hordes, xpMul...), además de goal y hint
  const ch = { ...ch0 }; for (const [k, v] of Object.entries(S)) if (k !== "goal" && k !== "hint") ch[k] = v;
  const goal = merge(ch.goal || { kind: "none" }, S.goal || {});
  // jugando solo la historia afloja un poco más que el arcade (un capítulo no se puede ganar subiendo de nivel en 7 min)
  const m = (ch.rate || 1) * (solo ? 0.75 : 1), none = goal.kind === "none";
  const events = (ch.events || []).map(e => ({ ...e }));
  for (const gv of ch.give || []) events.push({ at: "start", do: "give", weapon: gv.weapon, lv: gv.lv });
  if (S.hint) events.push({ t: 6, do: "hint", text: S.hint });
  if (none) events.push({ t: 0.5, do: "win" });
  const hz = ch.hz;
  return {
    id: ch.id, chapter: ch.id, n: ch.n | 0, story: true, solo,
    bosses: [], elites: null,
    // jugando solo, las hordas de la historia son más chicas
    hordes: (ch.hordes || []).map((t, i) => ({ t, n: solo ? 26 : 40, dist: 150, kinds: i ? ["saltarin", "negro", "negro"] : ["gato"] })),
    orders: (ch.orders || []).slice(),
    crates: none ? null : ARCADE.crates, pigeons: none ? null : ARCADE.pigeons,
    hazards: !none && hz !== null, hzFirst: hz ? hz.first : undefined, hzEvery: hz ? hz.every : undefined,
    rate: none ? null : { base: ARCADE.rate.base * m, per: ARCADE.rate.per / m, max: ARCADE.rate.max * m, cap: ARCADE.rate.cap },
    mix: none ? [] : (ch.mix || ARCADE.mix).map(r => r.slice()),
    xpMul: ch.xpMul || 1,
    events, goal, dur: ch.dur, allies: (ch.allies || []).slice(), cast: (ch.cast || []).slice(),
    intro: ch.intro || [], outro: ch.outro || [], credits: ch.credits || null, unlock: ch.unlock || [],
    win: {}, lose: { allDown: true }
  };
}

/* ---------- métodos que se suman a Sim ---------- */
const M = {
  // primer paso: aliados, objetivo, eventos de arranque e intro. Sin nada de historia, igual que el motor de siempre.
  begin() {
    this.begun = true;
    const G = this.G;
    this.story = !!(G.story || (G.goal && G.goal.kind && G.goal.kind !== "none") || (G.allies && G.allies.length) || (G.specials && Object.keys(G.specials).length));
    if (!this.story) {
      for (const e of this.atEvents) if (e.at === "start") { e.fired = true; this.doEvent(e); }
      if (G.intro && G.intro.length) this.openDialog(G.intro, { id: "intro" });
      return;
    }
    this.hint = null; this.hintN = 0; this.talks = []; this.talk = null; this.waves = []; this.premios = []; this.sniff = [];
    this.trig = {}; this.score = { downs: 0, allyDown: 0, lost: 0, miss: 0 }; this.endBanner = null; this.kills0 = this.kills;
    this.mai = null; this.maiArm = null; this.maiFree = 0; this.stars = 0; this.wasDown = {};
    if (G.specials && G.specials.maitena) this.mai = { k: 0, base: this.kills };
    const pts = this.points();
    // los chicos del prólogo están en la cocina antes de que se los lleven
    for (const e of G.events) if (e.do === "kidnap") for (const w of e.who || []) { const q = pts.isla || pts.horno || null; this.addAlly(w, { act: "idle", x: q ? q.x + this.rr(-30, 30) : undefined, y: q ? q.y + 26 : undefined }); }
    for (const a of G.allies || []) this.addAlly(typeof a === "string" ? a : a.id || a.type, typeof a === "string" ? {} : a);
    (G.cast || []).forEach((w, i, all) => { const b = this.cfg.b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2 - 20, a = i / all.length * Math.PI * 2; if (typeof w === "object") this.addAlly(w.id, { act: "idle", x: w.x, y: w.y }); else this.addAlly(w, { act: "idle", x: cx + Math.cos(a) * 70, y: cy + Math.sin(a) * 46 }); });
    if (G.goal && G.goal.kind && G.goal.kind !== "none") this.initGoal(G.goal);
    for (const e of this.atEvents) if (e.at === "start") { e.fired = true; this.doEvent(e); }
    if (G.intro && G.intro.length) this.openDialog(G.intro, { id: "intro" });
  },
  // puntos con nombre del mapa (GEO de maps.js, copiados acá para que el motor no dependa del canvas)
  points() { return (POINTS[this.map]) || {}; },
  gainXp(v) { return this._o.gainXp.call(this, v * (this.G.xpMul || 1)); },
  addPlayer(side, char, meta, skin) { const p = this._o.addPlayer.call(this, side, char, meta); p.skin = skin || null; return p; },

  /* ---------- disparadores ---------- */
  fire(at, data) {
    let any = false;
    for (const e of this.atEvents) {
      if (e.at !== at) continue;
      if (e.fired && (e.once || !REPEAT[at.split(":")[0]])) continue;
      // allyDown con who: solo si cayó ese aliado (si no, la caída de Corbata hacía perder el capítulo 6)
      if (e.who && data && data.type && allyId(e.who) !== data.type) continue;
      e.fired = true; any = true; this.doEvent({ ...e, _data: data });
    }
    return any;
  },

  /* ---------- acciones de los eventos (EVENT_DO de story.js) ---------- */
  doEvent(e) {
    if (!this.story) return this._o.doEvent.call(this, e);
    switch (e.do) {
      case "dialog": this.openDialog(e.lines, { id: e.id, auto: e.auto }); break;
      case "hint": this.setHint(e.text); break;
      case "elite": this.storyElite(e.kind || e.type, e.pos); break;
      case "give": for (const p of Object.values(this.players)) if ((p.weapons[e.weapon] || 0) < (e.lv || 1)) { p.weapons[e.weapon] = e.lv || 1; this.ev.push(["give", p.side, e.weapon]); } break;
      case "ally": { const w = allyId(e.who || e.type), had = this.allies.find(a => a.type === w && !a.gone);
        // el que esperaba quieto (Amanda en el refugio, el Chema en la torre) se suma al grupo
        if (had) { if (had.cfg.act === "idle" && !e.idle) had.cfg = { ...K.ALLY[w] }; break; } const o = e.from ? { x: e.from.x, y: e.from.y } : {}; if (e.idle) o.act = "idle"; this.addAlly(w, o); break; }
      case "special": if (e.id === "maitena" && !this.mai) { this.mai = { k: 0, base: this.kills }; this.ev.push(["special", "maitena"]); } break;
      case "maitena": this.callMaitena(false, e.from); break;
      case "kidnap": this.kidnap(e); break;
      case "boss": this.spawnBoss(e.kind || e.type); break;
      case "crates": this.crates(e); break;
      case "horde": this.hordeAround(Math.round((e.n || 30) * (Object.keys(this.players).length < 2 ? 0.6 : 1)), e.around, e.dist || 150); break;
      case "call": this.call(e); break;
      case "fail": this.endBanner = e.banner || null; if (this.goal) this.goal.done = true; this.ev.push(["goalfail", this.goal ? this.goal.k : ""]); this.lose(); break;
      case "spawn": { const n = e.n || 1; for (let i = 0; i < n; i++) { const q = e.x !== undefined ? { x: e.x + this.rr(-24, 24), y: e.y + this.rr(-16, 16) } : this.edgePos(150); this.spawnAt(e.kind || e.type || "gato", q.x, q.y, e.hp || 1); } break; }
      case "win": this.win(); break;
      case "lose": this.lose(); break;
      case "cam": this.cam = e.off ? null : { x: e.x, y: e.y, ally: e.ally, until: e.s ? this.t + e.s : null }; break;
      default: this._o.doEvent.call(this, e);
    }
  },
  setHint(text) { this.hint = { n: ++this.hintN, text, until: this.t + 6 }; },
  say(who, text, dur = 2.6) { this.talks.push({ who, text, dur }); },
  bark(a, kind, p = 1) { const B = KID_BARKS[a.type]; if (!B || !B[kind] || this.rnd() > p) return; if ((a.barkT || 0) > this.t) return; a.barkT = this.t + 9; if (this.talk || this.talks.length > 1) return; const L = B[kind]; this.say(a.type === "gatalinda" ? "gata" : a.type, L[Math.floor(this.rnd() * L.length)], 2.2); },
  storyElite(type, pos) {
    const q = pos ? { x: pos.x + this.rr(-10, 10), y: pos.y + this.rr(-10, 10) } : this.edgePos(160);
    const e = this.spawnAt(type || "gato", q.x, q.y, 8);
    e.elite = true; e.r = Math.round(e.r * 1.8); e.dmg *= 1.4; e.spd *= 0.85;
    this.ev.push(["elite", Math.round(e.x), Math.round(e.y)]);
    return e;
  },
  spawnBoss(type) {
    const g = this.goal, sp = (g && g.def.spawn) || null;
    const q = sp ? { x: sp.x, y: sp.y } : this.ringPos(150);
    // la caniche que estaba en escena pasa a ser la jefa
    if (type === "canicheBoss") for (const a of this.allies) if (a.type === "caniche") { a.gone = true; q.x = a.x; q.y = a.y; }
    const e = this.spawnAt(type, q.x, q.y);
    // jugando solo, la jefa de la historia tiene un cuarto menos de vida que en el arcade (además del 0,7 de siempre)
    if (Object.keys(this.players).length < 2) { e.hp *= 0.75; e.maxHp = e.hp; }
    e.surrender = !g || g.def.surrender !== false; e.ph = 1; e.cd = 2; e.st = 0;
    this.bossRef = e; this.calm = 3;
    if (g && g.k === "boss") g.boss = e;
    this.ev.push(["boss", type]);
    return e;
  },
  crates(e) {
    const [r0, r1] = e.r || [60, 160];
    for (let i = 0; i < (e.n || 6); i++) { const q = this.ringPos(this.rr(r0, r1)); if (this.inB(q.x, q.y, 16)) this.spawnAt("caja", q.x, q.y); }
    if (e.banner) this.ev.push(["sbanner", e.banner[0], e.banner[1] || ""]);
  },
  hordeAround(N, around, dist) {
    const a = around ? this.allies.find(q => q.type === allyId(around)) : null;
    const c = a || this.alive()[0] || Object.values(this.players)[0]; if (!c) return;
    this.ev.push(["horde"]);
    const gap = this.rnd() * Math.PI * 2;
    for (let i = 0; i < N; i++) {
      const ang = i / N * Math.PI * 2, da = k => Math.abs(ANG(ang - k));
      if (da(gap) < 0.42 || da(gap + Math.PI) < 0.42) continue;
      this.spawnAt(i % 3 ? "gato" : "negro", c.x + Math.cos(ang) * dist, c.y + Math.sin(ang) * dist * 0.8);
    }
  },
  // llamada del comisario: las líneas y después la pregunta; si aciertan todos, premio
  call(e) {
    const lines = [...(e.lines || []), { who: e.who || "comisario", text: e.q, ask: { opts: e.opts, a: e.a, prize: e.prize, ok: e.onOk || [], fail: e.onFail || [] } }];
    this.openDialog(lines, { id: "call" });
  },
  kidnap(e) {
    const ex = e.exit || { x: 980, y: 200 };
    for (const w of e.who || []) {
      let a = this.allies.find(q => q.type === w && !q.gone);
      if (!a) a = this.addAlly(w, {});
      a.cfg = { ...a.cfg, act: "kidnap" }; a.to = { x: ex.x, y: ex.y };
      // los gatos que los "llevan"
      for (let i = 0; i < 2; i++) { const c = this.spawnAt("gato", a.x + this.rr(-14, 14), a.y + this.rr(-10, 10)); c.goTo = a; c.escort = true; }
    }
    if (e.who && e.who[0]) this.cam = { ally: e.who[0], until: this.t + 5 };
    for (const l of e.lines || []) this.say(l.who, l.text, 2.2);
    this.ev.push(["kidnap"]);
  },

  /* ---------- diálogo: igual que el motor, más la pregunta del comisario ---------- */
  adv(side, skip = false, choice) {
    const d = this.dlg; if (this.state !== "dialog" || !d || !this.players[side]) return;
    const line = d.lines[d.i];
    if (line && line.ask) {
      if (typeof choice !== "number" || !(choice >= 0 && choice < line.ask.opts.length)) return;
      (d.ans || (d.ans = {}))[side] = choice; d.ready[side] = 1;
      return this.checkDialog();
    }
    d.ready[side] = skip ? 2 : 1;
    this.checkDialog();
  },
  checkDialog() {
    const d = this.dlg; if (!d) return;
    const sides = Object.keys(this.players);
    const line = d.lines[d.i];
    if (line && line.ask) { if (sides.every(s => d.ans && d.ans[s] !== undefined)) this.answer(d, line.ask); return; }
    if (!sides.every(s => d.ready[s])) return;
    if (sides.every(s => d.ready[s] === 2)) this.closeDialog(); else this.nextLine();
  },
  answer(d, ask) {
    const sides = Object.keys(this.players);
    const ok = sides.length > 0 && sides.every(s => d.ans && d.ans[s] === ask.a);
    if (ok && ask.prize) { const ps = this.alive(), p = ps[0] || Object.values(this.players)[0]; if (p) this.drop(ask.prize === "caja" ? "caja" : ask.prize, p.x + 14, p.y); }
    this.ev.push(["answer", ok ? 1 : 0]);
    const rest = ok ? ask.ok : ask.fail;
    d.lines = d.lines.slice(0, d.i + 1).concat(rest); d.ans = null;
    this.nextLine();
  },
  dialogTick(dt) {
    const d = this.dlg; if (!d) { this.state = "run"; return; }
    const line = d.lines[d.i];
    d.t += dt;
    if (line && line.ask) { if (d.t >= 15) { for (const s of Object.keys(this.players)) if (!d.ans || d.ans[s] === undefined) (d.ans || (d.ans = {}))[s] = -1; this.answer(d, line.ask); } return; }
    if (d.t >= d.auto) this.nextLine();
  },
  // cámara de cinemática: punto de la línea, el aliado o la jefa que habla, o el evento cam
  camPos() {
    const line = this.dlg && this.dlg.lines[this.dlg.i];
    if (line && line.cam) return [Math.round(line.cam[0]), Math.round(line.cam[1])];
    if (line && this.story) {
      const bt = SPEAKER_BOSS[line.who], at = SPEAKER_ALLY[line.who];
      const b = bt && this.enemies.find(e => e.type === bt && e.hp > 0);
      if (b) return [Math.round(b.x), Math.round(b.y)];
      const a = at && this.allies.find(q => q.type === allyId(at) && !q.gone);
      if (a) return [Math.round(a.x), Math.round(a.y)];
      if (bt && this.goal && this.goal.def.spawn && !b) return [this.goal.def.spawn.x, this.goal.def.spawn.y];
    }
    const c = this.cam; if (!c) return null;
    if (c.until !== null && c.until !== undefined && this.t > c.until) { this.cam = null; return null; }
    if (c.ally) { const a = this.allies.find(q => q.type === allyId(c.ally) && !q.gone); return a ? [Math.round(a.x), Math.round(a.y)] : null; }
    return [Math.round(c.x), Math.round(c.y)];
  },

  /* ---------- aliados ---------- */
  addAlly(type, o = {}) {
    type = allyId(type);
    const base = K.ALLY[type]; if (!base) return null;
    const cfg = { ...base, ...o };
    if (type === "gatalinda" && this.goal && this.goal.k !== "protect" && !o.hp) cfg.hp = 500; // capítulo 7: aliada
    const ps = this.alive(), lead = ps[0] || Object.values(this.players)[0];
    let x = o.x !== undefined ? o.x : lead ? lead.x + this.rr(-20, 20) : K.MAP / 2, y = o.y !== undefined ? o.y : lead ? lead.y + this.rr(10, 24) : K.MAP / 2;
    const a = { id: this.nextId++, type, cfg, x, y, hp: cfg.hp, maxHp: cfg.hp, r: cfg.r, inv: 1, flash: 0, cd: 1, st: 0, stT: 0, ax: 0, ay: 0, face: 1, down: false, downT: 0, hit: new Set(), fear: 0, cry: false, calmT: 0, flee: 0, wait: 0, home: { x, y } };
    if (o.x !== undefined && (o.x < this.cfg.b[0] || o.x > this.cfg.b[2] || o.y < this.cfg.b[1] || o.y > this.cfg.b[3])) a.enter = true; // entra desde afuera
    this.allies.push(a);
    this.ev.push(["ally", a.id, type]);
    return a;
  },
  hurtAlly(a, dmg) {
    if (a.down || a.gone) return;
    a.inv = 0.6; a.flash = 0.12;
    if (a.cfg.act === "escort") {
      // Carmelo no se lastima: se asusta
      a.fear += 20;
      if (a.fear >= 100 && !a.cry) { a.cry = true; a.calmT = 0; a.flee = 0; this.score.allyDown++; this.ev.push(["allydown", a.id, Math.round(a.x), Math.round(a.y)]); this.bark(a, "cry"); this.fire("allyDown", a); }
      return;
    }
    a.hp -= dmg;
    if (a.hp <= 0) {
      a.hp = 0; a.down = true; a.downT = a.cfg.down || 10; a.st = 0; this.score.allyDown++;
      this.ev.push(["allydown", a.id, Math.round(a.x), Math.round(a.y)]);
      this.fire("allyDown", a);
    }
  },
  updateAllies(dt) {
    const alive = this.alive(), [bx0, by0, bx1, by1] = this.cfg.b, g = this.goal;
    for (const a of this.allies) {
      if (a.gone) continue;
      const C = a.cfg;
      a.inv = Math.max(0, a.inv - dt); a.flash = Math.max(0, a.flash - dt); a.cd -= dt;
      if (a.down) {
        const key = g && !g.done && g.k === "protect" && g.ally === a;
        // Corbata se va a su cucha mientras junta fuerzas
        if (a.type === "corbata") { const c = this.points().cucha; if (c) { a.x += clamp(c.x - a.x, -60 * dt, 60 * dt); a.y += clamp(c.y - a.y, -60 * dt, 60 * dt); } }
        if (!key && (a.downT -= dt) <= 0) { a.down = false; a.hp = a.maxHp; a.inv = 2; this.ev.push(["allyup", a.id, Math.round(a.x), Math.round(a.y)]); this.bark(a, "back"); }
        continue;
      }
      let lead = null, ld = Infinity; for (const p of alive) { const d = d2(p, a); if (d < ld) { ld = d; lead = p; } }
      let gx = a.x, gy = a.y, spd = C.spd;
      switch (C.act) {
        case "escort": [gx, gy, spd] = this.carmelo(a, dt, lead, ld); break;
        case "kidnap": gx = a.to.x; gy = a.to.y; spd = 52; if (Math.hypot(a.x - gx, a.y - gy) < 10) { a.gone = true; this.ev.push(["allygone", a.id]); } break;
        case "idle": if (a.cd <= 0) { a.cd = this.rr(2, 4); a.wx = a.home.x + this.rr(-18, 18); a.wy = a.home.y + this.rr(-10, 10); } if (a.wx !== undefined) { gx = a.wx; gy = a.wy; spd = 14; } break;
        case "maitena": [gx, gy, spd] = this.maitenaTick(a, dt); break;
        default: {
          // protegida: la gata Linda se queda acorralada donde está; si no, sigue al jugador más cercano
          const prot = g && g.k === "protect" && g.ally === a && !g.done;
          if (prot) { gx = g.at.x; gy = g.at.y; }
          else if (a.type === "gatalinda" && this.bossRef && this.bossRef.hp > 0 && !this.bossRef.surr) { gx = this.bossRef.x; gy = this.bossRef.y; }
          else if (lead && ld > 30 * 30) { gx = lead.x + (a.type === "amanda" ? -14 : a.type === "chema" ? 14 : 0); gy = lead.y + 10; }
        }
      }
      if (a.enter) { spd = Math.max(spd, 90); if (this.inB(a.x, a.y, 4)) a.enter = false; }
      if (C.act === "ram") spd = this.corbata(a, dt, spd);
      else if (C.act === "scratch") this.scratch(a);
      else if (C.act === "escort") this.kick(a);
      if (a.type === "amanda") this.maullido(a);
      if (a.type === "chema" && this.bond) { for (const p of alive) p.hp = Math.min(p.maxHp, p.hp + 0.6 * dt); if (this.rnd() < dt / 25) this.bark(a, "purr"); }
      const dx = gx - a.x, dy = gy - a.y, m = Math.hypot(dx, dy);
      if (spd > 0 && m > 2) { const k = Math.min(m, spd * dt) / m; a.x += dx * k; a.y += dy * k; if (Math.abs(dx) > 1) a.face = Math.sign(dx); }
      if (!a.enter && C.act !== "kidnap" && C.act !== "maitena") { a.x = clamp(a.x, bx0, bx1); a.y = clamp(a.y, by0, by1); }
    }
    this.allies = this.allies.filter(a => !a.gone);
  },
  // Carmelo: camina por el recorrido si tiene a alguien cerca; se sienta a llorar; persigue palomas
  carmelo(a, dt, lead, ld) {
    const g = this.goal, esc = g && g.k === "escort" && g.ally === a && !g.done;
    a.fear = Math.max(0, a.fear - 2.5 * dt);
    if (!esc) return lead && ld > 26 * 26 ? [lead.x, lead.y, a.cfg.spd] : [a.x, a.y, 0];
    if (a.cry) {
      const beside = this.alive().some(p => d2(p, a) < 30 * 30);
      a.calmT = beside ? a.calmT + dt : Math.max(0, a.calmT - dt * 0.5);
      if (a.calmT >= g.calm) { a.cry = false; a.fear = 0; a.inv = 2; this.ev.push(["allyup", a.id, Math.round(a.x), Math.round(a.y)]); this.bark(a, "calm"); }
      return [a.x, a.y, 0];
    }
    if (this.t >= g.fleeNext) { g.fleeNext = this.t + this.rr(g.flee[0], g.flee[1]); a.flee = 3; let best = null, bd = 260 * 260; for (const e of this.enemies) if (e.type === "paloma" && e.hp > 0 && d2(e, a) < bd) { bd = d2(e, a); best = e; } const ang = best ? Math.atan2(best.y - a.y, best.x - a.x) : this.rr(0, Math.PI * 2); a.fx = Math.cos(ang); a.fy = Math.sin(ang); this.bark(a, "flee"); this.ev.push(["flee", a.id]); }
    if (a.flee > 0) { a.flee -= dt; return [a.x + a.fx * 40, a.y + a.fy * 40, 44]; }
    const near = lead && ld < g.near * g.near;
    if (a.wait > 0) { if (near) a.wait -= dt; return [a.x, a.y, 0]; }
    const w = g.path[g.wp]; if (!w) return [a.x, a.y, 0];
    if (!near) return [a.x, a.y, 0];
    const d = Math.hypot(w.x - a.x, w.y - a.y);
    if (d < 4) {
      g.wp++;
      if (w.tag) this.fire("tag:" + w.tag);
      if (w.wait) a.wait = w.wait;
      return [a.x, a.y, 0];
    }
    return [w.x, w.y, g.spd];
  },
  kick(a) {
    if (a.cry || a.cd > 0) return;
    const C = a.cfg, t = this.nearest(a, C.reach + 10);
    if (t && d2(a, t) < (C.reach + t.r) ** 2) { a.cd = C.cd; const dx = t.x - a.x, dy = t.y - a.y, m = Math.hypot(dx, dy) || 1; this.damage(t, C.dmg, null, dx / m * C.kb, dy / m * C.kb); this.ev.push(["slash", Math.round(a.x), Math.round(a.y), dx < 0 ? -1 : 1, C.reach, 0]); this.bark(a, "kick", 0.15); }
  },
  scratch(a) {
    if (a.cd > 0) return;
    const C = a.cfg; let t = null, bd = (C.reach + 18) ** 2;
    for (const e of this.enemies) { if (!this.foe(e)) continue; const d = d2(a, e) - (e.r * e.r); if (d < bd) { bd = d; t = e; } }
    if (!t) return;
    a.cd = C.cd; const dx = t.x - a.x, dy = t.y - a.y, m = Math.hypot(dx, dy) || 1;
    this.damage(t, C.dmg, null, dx / m * C.kb, dy / m * C.kb); this.ev.push(["slash", Math.round(a.x), Math.round(a.y), dx < 0 ? -1 : 1, C.reach + 4, 0]);
    if (K.ENEMY[t.type].boss) this.bark(a, "hit", 0.2);
  },
  // Corbata: cada 4 s embiste al grupo de gatos más grande que tenga a 140 px
  corbata(a, dt, spd) {
    const C = a.cfg;
    if (a.st === 1) { if ((a.stT -= dt) <= 0) { a.st = 2; a.stT = 0.45; a.hit.clear(); } return 0; }
    if (a.st === 2) {
      a.x += a.ax * 260 * dt; a.y += a.ay * 260 * dt;
      this.near(a.x, a.y, 18, e => { if (a.hit.has(e.id) || !this.foe(e) || d2(a, e) > (e.r + a.r + 5) ** 2) return; a.hit.add(e.id); this.damage(e, C.dmg, null, a.ax * C.kb, a.ay * C.kb); });
      if ((a.stT -= dt) <= 0) { a.st = 0; a.cd = C.cd; }
      return 0;
    }
    if (a.cd <= 0) {
      let best = null, bn = 0;
      for (const e of this.enemies) { if (!this.foe(e) || d2(a, e) > C.reach * C.reach) continue; let n = 0; this.near(e.x, e.y, 32, o => { if (d2(o, e) < 32 * 32) n++; }); if (n > bn) { bn = n; best = e; } }
      if (best) { const m = Math.hypot(best.x - a.x, best.y - a.y) || 1; a.ax = (best.x - a.x) / m; a.ay = (best.y - a.y) / m; a.st = 1; a.stT = 0.4; this.ev.push(["charge", Math.round(a.x), Math.round(a.y)]); this.bark(a, "charge", 0.2); }
      else a.cd = 0.5;
    }
    return spd;
  },
  // Amanda: cada 8 s marca al gato con más vida a menos de 160 px (+25% de daño 6 s)
  maullido(a) {
    if (a.cd > 0) return;
    a.cd = 8; let best = null, bh = 0;
    for (const e of this.enemies) if (this.foe(e) && d2(a, e) < 160 * 160 && e.hp > bh) { bh = e.hp; best = e; }
    if (best) { best.markT = this.t + 6; this.ev.push(["mark", Math.round(best.x), Math.round(best.y)]); this.bark(a, "mark", 0.3); }
  },

  /* ---------- Llamá a Maitena ---------- */
  pressMaitena(side) {
    const M = this.mai; if (!M || M.k < 1 || this.maiOn) return;
    const n = Object.keys(this.players).length;
    if (n < 2) return this.callMaitena(false);
    if (this.maiArm && this.maiArm.side !== side && this.t - this.maiArm.t <= MAITENA_PAIR) { this.maiArm = null; return this.callMaitena(true); }
    if (!this.maiArm) { this.maiArm = { side, t: this.t }; this.ev.push(["maiarm", side]); }
  },
  callMaitena(pair, from) {
    if (this.maiOn) return;
    const ps = this.alive(); if (!ps.length) return;
    const cx = ps.reduce((s, p) => s + p.x, 0) / ps.length, cy = ps.reduce((s, p) => s + p.y, 0) / ps.length;
    if (this.mai && !from) { this.mai.k = 0; this.mai.base = this.kills; }
    let x, y;
    if (from) { x = from.x; y = from.y; }
    else { const q = this.edgePos(120, ps[0]); x = q.x; y = q.y; }
    const a = this.addAlly("maitena", { x, y });
    a.mt = { pair, n: 0, t: 0, cx, cy, phase: 0 };
    this.maiOn = a;
    this.ev.push(["maitena", pair ? 1 : 0]);
    this.bark(a, "in");
  },
  maitenaTick(a, dt) {
    const S = a.mt; S.t += dt;
    const ps = this.alive(); if (ps.length) { S.cx = ps.reduce((s, p) => s + p.x, 0) / ps.length; S.cy = ps.reduce((s, p) => s + p.y, 0) / ps.length; }
    if (S.phase === 0) {
      // llega corriendo (si está muy lejos, aparece al lado)
      if (Math.hypot(a.x - S.cx, a.y - S.cy) > 260) { a.x = S.cx + this.rr(-80, 80); a.y = S.cy + this.rr(-60, 60); }
      if (Math.hypot(a.x - S.cx, a.y - S.cy) < 26 || S.t > 1.4) { S.phase = 1; S.t = 0; }
      return [S.cx, S.cy, a.cfg.spd];
    }
    if (S.phase === 1) {
      // tres patadas giratorias en 2,5 s
      if (S.t >= S.n * 0.8 && S.n < 3) {
        S.n++;
        const R = S.pair ? 170 : a.cfg.reach, dmg = a.cfg.dmg * (S.pair ? 1.5 : 1);
        this.ev.push(["maikick", Math.round(a.x), Math.round(a.y), R]);
        this.near(a.x, a.y, R, e => { if (!this.foe(e)) return; const dx = e.x - a.x, dy = e.y - a.y, m = Math.hypot(dx, dy) || 1; if (m > R) return; this.damage(e, dmg, null, dx / m * a.cfg.kb, dy / m * a.cfg.kb, true); if (e.hp > 0 && !K.ENEMY[e.type].boss) this.stun(e, 2); });
      }
      if (S.t >= 2.5) { S.phase = 2; S.t = 0; }
      return [S.cx + 20, S.cy, 30];
    }
    // se va saludando
    if (S.t > 1.2) { a.gone = true; this.maiOn = null; this.ev.push(["allygone", a.id]); }
    return [a.x + 200, a.y, 160];
  },
  stun(e, s) { e.stunT = this.t + s; e.sx = e.x; e.sy = e.y; },

  /* ---------- objetivos ---------- */
  initGoal(def) {
    const k = def.kind || "none", b = this.cfg.b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    const prev = this.goal;
    const g = this.goal = { k, def, p: 0, n: 0, of: def.n || def.count || 0, t0: this.t, dur: def.time || def.dur || (prev ? 0 : this.G.dur) || 0, lb: def.label || "", done: false, aim: null, chain: !!prev };
    this.lures = this.lures.filter(L => !L.tgt && !L.prot);
    const solo = Object.keys(this.players).length < 2;
    if (def.start) this.place(def.start);
    if (k === "defend") {
      const list = def.targets || [{ id: "obj", name: def.label || "", x: def.x !== undefined ? def.x : cx, y: def.y !== undefined ? def.y : cy, r: def.r, hp: def.hp }];
      g.targets = list.map(q => ({ id: q.id, name: q.name || "", x: q.x, y: q.y, r: q.r || 22, hp: q.hp || 300, maxHp: q.hp || 300, inv: 0, flash: 0, tgt: true, down: false }));
      g.target = g.targets[0]; g.bias = def.targetBias !== undefined ? def.targetBias : null; g.failOnLoss = def.failOnLoss !== false;
      for (const T of g.targets) this.lures.push(T);
    }
    if (k === "protect" || k === "escort") {
      const w = allyId(def.ally || "");
      g.ally = (w && this.allies.find(a => a.type === w && !a.gone)) || (w ? this.addAlly(w, def.allyOpts || {}) : this.allies[0]) || null;
    }
    if (k === "protect" && g.ally) {
      const A = g.ally; g.at = def.x !== undefined ? { x: def.x, y: def.y } : { x: A.x, y: A.y };
      const hp = solo ? 520 : 400; if (A.type === "gatalinda" && !def.allyOpts) { A.hp = A.maxHp = hp; }
      A.prot = true; A.lureR = 200; A.bias = 0.6; this.lures.push(A);
    }
    if (k === "escort") {
      const A = g.ally;
      g.path = def.path ? def.path.map(q => ({ ...q })) : [{ x: (def.to || [cx, b[1] + 60])[0], y: (def.to || [cx, b[1] + 60])[1] }];
      if (A && def.path) { A.x = g.path[0].x; A.y = g.path[0].y; this.place({ x: A.x + 26, y: A.y + 10 }); }
      g.wp = def.path ? 1 : 0; g.near = def.near || 70; g.spd = def.speed || (A ? A.cfg.spd : 40); g.calm = def.calm || 2;
      g.flee = def.fleeEvery || [40, 55]; g.fleeNext = this.t + this.rr(g.flee[0], g.flee[1]);
      g.len = 0; let q0 = A ? { x: A.x, y: A.y } : g.path[0]; for (const q of g.path.slice(def.path ? 1 : 0)) { g.len += Math.hypot(q.x - q0.x, q.y - q0.y); q0 = q; }
      g.len = Math.max(1, g.len); g.r = def.r || 24;
      if (A) { A.cfg = { ...A.cfg, act: "escort" }; A.fear = 0; A.cry = false; }
    }
    if (k === "reach") {
      g.path = def.path ? def.path.map(q => ({ ...q })) : [{ x: (def.to || [cx, b[1] + 60])[0], y: (def.to || [cx, b[1] + 60])[1] }];
      g.wp = 0; g.r = def.r || 24; g.res = def.rescue ? { ...def.rescue, prog: 0, done: false } : null;
      const st = def.start || this.alive()[0] || { x: cx, y: cy }; g.len = 0; let q0 = st; for (const q of g.path) { g.len += Math.hypot(q.x - q0.x, q.y - q0.y); q0 = q; } g.len = Math.max(1, g.len);
    }
    if (k === "trains") { g.of = def.count || def.n || 3; g.res = def.rescue ? { ...def.rescue, prog: 0, done: false } : null; g.seen = 0; }
    // quien hay que rescatar espera quieto en su lugar hasta que lo van a buscar
    if (g.res && g.res.who && !this.allies.some(a => a.type === allyId(g.res.who))) this.addAlly(g.res.who, { act: "idle", x: g.res.x, y: g.res.y });
    if (k === "track") {
      g.of = def.count || def.n || (def.spots ? def.spots.length : def.pts ? def.pts.length : 3);
      if (def.spots) {
        g.spots = def.spots.map(q => ({ x: q.x, y: q.y })); g.cur = 0; g.r = def.r || 26; g.fill = def.fill || 6; g.fillPair = def.fillPair || g.fill / 2; g.win = def.window || 0;
        g.spot = { ...g.spots[0], f: 0, until: g.win ? this.t + g.win : 0, live: true, spot: true }; g.sniffNext = def.sniffers ? this.t + def.sniffers.every : 9e9; this.lures.push(g.spot);
      } else {
        // compatibilidad con la infraestructura: rastros al azar que se juntan con solo pisarlos
        g.pts = def.pts ? def.pts.map(q => q.slice()) : Array.from({ length: g.of }, () => { const q = this.ringPos(this.rr(220, 380)); return [Math.round(clamp(q.x, b[0] + 30, b[2] - 30)), Math.round(clamp(q.y, b[1] + 30, b[3] - 30))]; });
      }
    }
    if (k === "boss") {
      g.type = def.boss || def.type;
      // sin evento que la traiga, aparece sola a los t s; si no se rinde, se gana al vencerla (como el motor de antes)
      if (!this.G.events.some(e => e.do === "boss")) this.bosses.splice(this.bossIdx, 0, { t: this.t + (def.t || 3), type: g.type, dist: def.dist || 160, calm: 3, phase: def.phase });
      if (!def.surrender) this.G = { ...this.G, win: { kill: g.type } };
    }
    this.ev.push(["goal", k]);
    return g;
  },
  // pone a los jugadores en el punto de arranque del objetivo (el invitado recibe la posición en la primera foto)
  place(q) { Object.values(this.players).forEach((p, i) => { p.x = q.x + (i ? 14 : -14); p.y = q.y; }); },
  setP(g, p) {
    g.p = Math.max(g.p, Math.min(1, p));
    if (g.chain) return;
    for (const e of this.atEvents) if (!e.fired && /^goal\d+$/.test(e.at) && g.p * 100 >= +e.at.slice(4)) { e.fired = true; this.doEvent(e); }
  },
  step_(g) { g.n++; this.fire("step:" + g.n); },
  // rescate: quedarse encima hold s (los dos juntos, holdPair s)
  rescueTick(g, R, dt) {
    const inside = this.alive().filter(p => (p.x - R.x) ** 2 + (p.y - R.y) ** 2 < R.r * R.r).length;
    const solo = Object.keys(this.players).length < 2;
    void solo;
    const need = inside >= 2 ? (R.holdPair || R.hold || 2) : solo && R.holdSolo ? R.holdSolo : (R.hold || 3);
    if (inside) R.prog = Math.min(1, R.prog + dt / need); else R.prog = Math.max(0, R.prog - dt * 0.25);
    if (R.prog >= 1 && !R.done) { R.done = true; this.ev.push(["rescue", R.who || ""]); this.fire("rescue", R); }
    return solo;
  },
  updateGoal(dt) {
    const g = this.goal; if (!g || g.done) return;
    const el = this.t - g.t0;
    for (const T of g.targets || []) { T.inv = Math.max(0, T.inv - dt); T.flash = Math.max(0, T.flash - dt); if (!T.down && T.hp <= 0) { T.down = true; this.score.lost++; this.ev.push(["goallost", T.id || "", Math.round(T.x), Math.round(T.y)]); } }
    g.aim = null;
    switch (g.k) {
      case "survive": this.setP(g, g.dur ? el / g.dur : 0); if (g.dur && el >= g.dur) return this.goalDone(); break;
      case "defend": {
        this.setP(g, g.dur ? el / g.dur : 0);
        const up = g.targets.filter(T => !T.down);
        if (g.failOnLoss && up.length < g.targets.length) return this.goalFail();
        let worst = up[0]; for (const T of up) if (T.hp / T.maxHp < worst.hp / worst.maxHp) worst = T; if (worst) g.aim = worst;
        if (g.dur && el >= g.dur) return this.goalDone();
        break;
      }
      case "protect": this.setP(g, g.dur ? el / g.dur : 0); if (!g.ally || g.ally.down) return this.goalFail(); g.aim = g.ally; if (g.dur && el >= g.dur) return this.goalDone(); break;
      case "escort": {
        const A = g.ally; if (!A || A.down) return this.goalFail();
        let rest = 0; const w = g.path[g.wp];
        if (w) { rest = Math.hypot(w.x - A.x, w.y - A.y); for (let i = g.wp; i + 1 < g.path.length; i++) rest += Math.hypot(g.path[i + 1].x - g.path[i].x, g.path[i + 1].y - g.path[i].y); }
        this.setP(g, 1 - rest / g.len); g.aim = A;
        if (g.wp >= g.path.length && A.wait <= 0) return this.goalDone();
        if (!g.def.path && rest < g.r) return this.goalDone();
        break;
      }
      case "reach": {
        const ps = this.alive(); if (!ps.length) break;
        const w = g.path[g.wp];
        if (w) {
          g.aim = w;
          const inside = ps.filter(p => (p.x - w.x) ** 2 + (p.y - w.y) ** 2 < g.r * g.r).length;
          if (inside && w.hold && !w.h) { w.h = 1; w.prog = 0; if (w.tag) this.fire("tag:" + w.tag); }
          const solo = Object.keys(this.players).length < 2;
          if (w.hold) { if (inside) w.prog = Math.min(1, w.prog + dt / (inside >= 2 ? (w.holdPair || w.hold) : solo && w.holdSolo ? w.holdSolo : w.hold)); g.hold = w; }
          if (inside && (!w.hold || w.prog >= 1)) { g.wp++; g.hold = null; if (w.tag && !w.hold) this.fire("tag:" + w.tag); }
        }
        let rest = 0; const lead = ps.reduce((a, p) => !a || (w && d2(p, w) < d2(a, w)) ? p : a, null);
        if (g.path[g.wp]) { rest = Math.hypot(g.path[g.wp].x - lead.x, g.path[g.wp].y - lead.y); for (let i = g.wp; i + 1 < g.path.length; i++) rest += Math.hypot(g.path[i + 1].x - g.path[i].x, g.path[i + 1].y - g.path[i].y); }
        const R = g.res;
        this.setP(g, (1 - rest / g.len) * (R ? 0.85 : 1) + (R ? R.prog * 0.15 : 0));
        if (g.wp >= g.path.length) {
          if (!R) return this.goalDone();
          g.aim = R; this.rescueTick(g, R, dt);
          if (R.done) return this.goalDone();
        }
        break;
      }
      case "trains": {
        while (g.seen < g.n) { g.seen++; this.fire("step:" + g.seen); }
        const R = g.res;
        if (R && !R.done && g.n >= (R.after || 0)) { g.aim = R; this.rescueTick(g, R, dt); }
        const of = g.of + (R ? 1 : 0), got = Math.min(g.n, g.of) + (R && R.done ? 1 : 0);
        this.setP(g, got / of);
        if (g.n >= g.of && (!R || R.done)) return this.goalDone();
        break;
      }
      case "track": {
        if (g.spots) {
          const S = g.spot, D = g.def;
          // entre un rastro y el siguiente, Romero se mueve: el rastro nuevo aparece a los gap s
          if (S.from && this.t < S.from) { g.aim = null; S.wait = Math.ceil(S.from - this.t); this.setP(g, g.cur / g.of); break; }
          S.wait = 0;
          const inside = this.alive().filter(p => (p.x - S.x) ** 2 + (p.y - S.y) ** 2 < g.r * g.r).length;
          let sat = false; this.near(S.x, S.y, g.r, e => { if (this.foe(e) && d2(e, S) < (g.r * 0.7) ** 2) sat = true; });
          S.sat = sat;
          // los gatos sentados arriba lo frenan (no lo traban)
          if (inside) S.f = Math.min(1, S.f + dt / (inside >= 2 ? g.fillPair : g.fill) * (sat ? 0.35 : 1));
          if (S.f >= 1) {
            this.ev.push(["track", Math.round(S.x), Math.round(S.y)]);
            g.cur++; this.step_(g);
            if (g.cur >= g.of) { S.live = false; this.setP(g, 1); return this.goalDone(); }
            const nx = g.spots[g.cur % g.spots.length], gap = g.def.gap || 0; Object.assign(S, { x: nx.x, y: nx.y, f: 0, until: (g.win ? this.t + g.win : 0) + gap, from: this.t + gap });
          } else if (g.win && this.t >= S.until) {
            // se venció: el rastro salta a otro puesto y llega una tanda de negros
            this.score.miss++;
            const b = this.cfg.b; let q = null;
            for (let i = 0; i < 12; i++) { const c = { x: this.rr(b[0] + 60, b[2] - 60), y: this.rr(b[1] + 60, b[3] - 60) }; if (Math.hypot(c.x - S.x, c.y - S.y) > 220) { q = c; break; } }
            if (q) { S.x = Math.round(q.x); S.y = Math.round(q.y); }
            S.until = this.t + g.win; // lo que ya llenaron no se pierde
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.spawnAt("negro", S.x + Math.cos(a) * 110, S.y + Math.sin(a) * 80); }
            this.ev.push(["trackmove", S.x, S.y]);
          }
          if (D.sniffers && this.t >= g.sniffNext) { g.sniffNext = this.t + D.sniffers.every; const q = this.edgePos(150); const e = this.spawnAt(D.sniffers.kind || "negro", q.x, q.y); e.goTo = S; }
          g.aim = S;
          this.setP(g, (g.cur + S.f) / g.of);
        } else {
          for (const p of this.alive()) for (let i = g.pts.length - 1; i >= 0; i--) { const q = g.pts[i]; if ((p.x - q[0]) ** 2 + (p.y - q[1]) ** 2 < 16 * 16) { g.pts.splice(i, 1); this.ev.push(["track", q[0], q[1], p.side]); this.step_(g); } }
          this.setP(g, g.n / g.of);
          if (g.n >= g.of) return this.goalDone();
          if (g.dur && el >= g.dur) return this.goalFail();
        }
        break;
      }
      case "boss": {
        const B = g.boss || (this.bossRef && this.bossRef.type === g.type ? this.bossRef : null);
        if (B) { g.boss = B; this.setP(g, 1 - Math.max(0, B.hp) / B.maxHp); g.aim = B; if (B.surr) return this.goalDone(); }
        break;
      }
    }
  },
  goalDone() {
    const g = this.goal; if (g.done) return;
    g.done = true; g.p = 1; this.ev.push(["goaldone", g.k]);
    if (g.def.then) {
      // segundo objetivo (capítulo 6: proteger a la gata Linda después del rescate)
      this.initGoal({ ...g.def.then, kind: g.def.then.kind });
      return;
    }
    this.fire("goalDone");
    if (this.state === "over") return;
    this.calm = 99; // ya está: no salen más gatos
    this.win();
  },
  goalFail() { const g = this.goal; if (g.done) return; g.done = true; this.ev.push(["goalfail", g.k]); this.lose(); },
  win() {
    if (this.state === "win" || this.state === "over") return;
    if (this.story && !this.stars) this.stars = 1 + (this.score.downs === 0 ? 1 : 0) + (this.score.allyDown === 0 && this.score.lost === 0 && this.score.miss === 0 ? 1 : 0);
    return this._o.win.call(this);
  },

  /* ---------- a quién van los gatos (lo llama moveEnemies si hay algo para defender) ---------- */
  pickLure(e, bd) {
    if (e.goTo) {
      if (e.goTo.live !== false && !e.goTo.gone && !(e.goTo.hp <= 0 && e.goTo.tgt)) {
        // el que olfatea el rastro se distrae si tiene un jugador encima
        if (e.goTo.spot && bd < 70 * 70) return null;
        return e.goTo;
      }
      e.goTo = null;
    }
    let best = null;
    for (const L of this.lures) {
      if (L.down || L.gone) continue;
      if (L.premio) { if (!e.buffT && d2(L, e) < 140 * 140) { const d = d2(L, e); if (!best || d < d2(best, e)) best = L; } continue; }
      if (best && best.premio) continue;
      if (L.tgt && this.goal && this.goal.bias !== null && this.goal.bias !== undefined) {
        if (e.lb === undefined) e.lb = this.rnd() < this.goal.bias ? 1 : 0;
        if (e.lb) { const d = d2(L, e); if (!best || d < d2(best, e)) best = L; }
        continue;
      }
      if (L.prot) {
        if (d2(L, e) < L.lureR * L.lureR) { if (e.lp === undefined) e.lp = this.rnd() < L.bias ? 1 : 0; if (e.lp) best = L; }
        continue;
      }
      if (L.spot) continue;
      if (L.tgt) { const d = d2(L, e) * 0.5; if (d < bd) { bd = d; best = L; } }
    }
    return best;
  },

  /* ---------- tipos nuevos de enemigos ---------- */
  storyEnemy(e, tgt, dx, dy, m, spd, dt, dmgScale) {
    e.tel = 0;
    if (e.stunT && e.stunT > this.t) return [dx, dy, 0];
    if (e.type === "guantes") {
      // jab doble: se frena con aviso y hace dos embestidas cortas
      if (e.st === 1) { e.tel = 1; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.12; e.jab = (e.jab || 0) + 1; } return [dx, dy, 0]; }
      if (e.st === 2) { if ((e.stT -= dt) <= 0) { if (e.jab < 2) { e.st = 3; e.stT = 0.2; } else { e.st = 0; e.jab = 0; e.cd = this.rr(2.2, 3.2); } } return [e.ax, e.ay, 330]; }
      if (e.st === 3) { if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.12; e.jab++; } return [e.ax, e.ay, 0]; }
      e.cd -= dt;
      if (e.cd <= 0 && m < 60) { e.st = 1; e.stT = 0.45; e.ax = dx; e.ay = dy; e.jab = 0; }
      return [dx, dy, spd];
    }
    if (e.type === "luz2") return this.luz2(e, tgt, dx, dy, spd, dt);
    if (e.type === "canicheBoss") return this.caniche(e, tgt, dx, dy, spd, dt, dmgScale);
    return [dx, dy, spd];
  },
  // Luz, pelea de pareja: marca a uno; si el otro está pegado al marcado cuando arranca, se frena y queda aturdida
  luz2(e, tgt, dx, dy, spd, dt) {
    if (e.surr) return [dx, dy, 0];
    if (e.ph === 1 && e.hp < e.maxHp * 0.5) { e.ph = 2; this.ev.push(["sphase", 2, Math.round(e.x), Math.round(e.y)]); this.fire("bossPhase2"); }
    e.dmgIn = (e.st === 3 ? 1.5 : 1) * (e.markT > this.t ? 1.25 : 1);
    const ps = this.alive();
    if (e.st === 1) {
      e.tel = 1;
      const P = this.players[e.mk];
      if (!P || P.downed) { e.st = 0; e.cd = 0.6; return [dx, dy, 0]; }
      const ax = P.x - e.x, ay = P.y - e.y, am = Math.hypot(ax, ay) || 1; e.ax = ax / am; e.ay = ay / am;
      if ((e.stT -= dt) <= 0) {
        const other = ps.find(q => q !== P);
        const cucha = this.points().cucha, corb = this.allies.find(a => a.type === "corbata" && !a.down && !a.gone);
        const blocked = other ? d2(other, P) < 28 * 28 : ((cucha && d2(P, cucha) < 40 * 40) || (corb && d2(corb, P) < 28 * 28));
        if (blocked) { e.st = 3; e.stT = 2.5; this.ev.push(["stun", Math.round(e.x), Math.round(e.y)]); if (!this.stunHint) { this.stunHint = 1; this.setHint("¡Se frenó! Aturdida: pega más fuerte"); } }
        else { e.st = 2; e.stT = 0.7; this.ev.push(["charge", Math.round(e.x), Math.round(e.y)]); }
      }
      return [e.ax, e.ay, 0];
    }
    if (e.st === 2) { if ((e.stT -= dt) <= 0) { if (e.ph === 2 && !e.dbl) { e.dbl = true; e.st = 1; e.stT = 0.35; } else { e.dbl = false; e.st = 0; e.cd = 2.4; } } return [e.ax, e.ay, spd * 4.4]; }
    if (e.st === 3) { if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = 1.6; } return [dx, dy, 0]; }
    e.cd -= dt;
    if (e.cd <= 0 && ps.length) {
      // marca al que no marcó la última vez (de a dos se turnan)
      const P = ps.length > 1 ? ps.find(q => q.side !== e.mk) || ps[0] : ps[0];
      e.mk = P.side; e.st = 1; e.stT = e.ph === 2 ? 0.7 : 1; this.ev.push(["lmark", P.side]);
    }
    return [dx, dy, spd];
  },
  // la caniche: premios, carritos y berrinche
  caniche(e, tgt, dx, dy, spd, dt, dmgScale) {
    if (e.surr) return [dx, dy, 0];
    const ph = e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3;
    if (ph > e.ph) { e.ph = ph; e.cd = 1.5; e.zcd = 2; e.st = 0; this.calm = 2; this.ev.push(["sphase", ph, Math.round(e.x), Math.round(e.y)]); this.fire("bossPhase" + ph); }
    e.dmgIn = e.markT > this.t ? 1.25 : 1;
    e.cd -= dt; e.zcd = (e.zcd || 3) - dt;
    const m = Math.hypot(tgt.x - e.x, tgt.y - e.y);
    if (e.ph === 1) {
      if (e.cd <= 0) {
        e.cd = 3;
        for (let i = 0; i < 4; i++) { const a = this.rr(0, Math.PI * 2), r = this.rr(60, 120); this.dropPremio(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.8); }
        this.ev.push(["premios", Math.round(e.x), Math.round(e.y)]);
        if (this.rnd() < 0.5) { ["gato", "negro", "gato", "negro"].forEach((k, i) => { const a = i / 4 * Math.PI * 2; this.spawnAt(k, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 30); }); this.ev.push(["summon", Math.round(e.x), Math.round(e.y)]); }
      }
      // se queda a distancia: es la buena, no pelea de cerca
      return m < 90 ? [-dx, -dy, spd * 0.8] : [dx, dy, spd * 0.6];
    }
    if (e.ph === 2) {
      if (e.zcd <= 0) { e.zcd = 7; this.spawnHazard("carritos"); this.spawnHazard("carritos"); this.ev.push(["whistle", Math.round(e.x), Math.round(e.y)]); }
      if (e.st === 1) { e.tel = 1; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.6; } return [e.ax, e.ay, 0]; }
      if (e.st === 2) { if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = 3; } return [e.ax, e.ay, spd * 4.2]; }
      if (e.cd <= 0) { e.st = 1; e.stT = 0.8; e.ax = dx; e.ay = dy; this.ev.push(["charge", Math.round(e.x), Math.round(e.y)]); }
      return [dx, dy, spd];
    }
    // berrinche: ondas en anillo con dos huecos, ladridos y saltarines; un 30% más rápida
    if (e.zcd <= 0) {
      e.zcd = 4; const gap = this.rr(0, Math.PI * 2);
      this.waves.push({ x: e.x, y: e.y, t: 0, dur: 1.2, R: 160, g1: gap, g2: gap + Math.PI * this.rr(0.6, 1.4), hit: new Set(), dmg: 14 * dmgScale });
      this.ev.push(["tantrum", Math.round(e.x), Math.round(e.y)]);
      this.near(e.x, e.y, 60, o => { if (o === e || !this.foe(o)) return; const ox = o.x - e.x, oy = o.y - e.y, om = Math.hypot(ox, oy) || 1; o.kx += ox / om * 200; o.ky += oy / om * 200; });
      if (this.rnd() < 0.5) for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; this.spawnAt("saltarin", e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 30); }
    }
    return [dx, dy, spd * 1.3];
  },
  dropPremio(x, y) {
    const b = this.cfg.b; x = clamp(x, b[0] + 8, b[2] - 8); y = clamp(y, b[1] + 8, b[3] - 8);
    const p = this.spawnAt("premio", x, y); p.premio = true; p.until = this.t + 15; this.premios.push(p); this.lures.push(p);
    return p;
  },
  storyKill(e, p) {
    if (e.type === "premio") { e.hp = 0; e.gone = true; return; }
    // la jefa no muere: se rinde
    e.hp = 1; e.surr = true; e.st = 4; e.dmgIn = 1e-6; e.tel = 0; e.spd = 0;
    this.kills++;
    this.ev.push(["bossdown", e.type, Math.round(e.x), Math.round(e.y)]);
    for (let i = 0; i < 12; i++) this.gems.push({ x: e.x + this.rr(-24, 24), y: e.y + this.rr(-24, 24), v: 5, pull: 0 });
    this.calm = 99;
    // los gatos que quedaban se van
    for (const o of this.enemies) if (o !== e && this.foe(o)) { o.hp = 0; this.ev.push(["die", Math.round(o.x), Math.round(o.y), K.ENEMY_ID[o.type]]); }
  },

  /* ---------- un paso de la historia ---------- */
  storyTick(dt, input) {
    // los aturdidos no se mueven (moveEnemies ya los movió: vuelven a donde estaban)
    for (const e of this.enemies) if (e.stunT) { if (e.stunT > this.t) { e.x = e.sx; e.y = e.sy; } else e.stunT = 0; }
    // daño recibido: marca de Amanda
    for (const e of this.enemies) if (e.markT && e.type !== "luz2" && e.type !== "canicheBoss") e.dmgIn = e.markT > this.t ? 1.25 : 1;
    // premios de la caniche: los come un gato (lo agranda 10 s) o los levanta un jugador
    if (this.premios.length) {
      for (const P of this.premios) {
        if (P.hp <= 0 || P.gone) continue;
        if (this.t > P.until) { P.hp = 0; P.gone = true; continue; }
        if (this.alive().some(p => d2(p, P) < 12 * 12)) { P.hp = 0; P.gone = true; this.ev.push(["premio", 0, Math.round(P.x), Math.round(P.y)]); continue; }
        this.near(P.x, P.y, 12, o => { if (P.gone || !this.foe(o) || o.buffT || K.ENEMY[o.type].boss || d2(o, P) > (o.r + 5) ** 2) return; P.hp = 0; P.gone = true; o.buffT = this.t + 10; o.spd *= 1.4; o.dmg *= 1.3; o.r = Math.round(o.r * 1.25); this.ev.push(["premio", 1, Math.round(P.x), Math.round(P.y)]); });
      }
      this.premios = this.premios.filter(P => !P.gone && P.hp > 0);
    }
    for (const e of this.enemies) if (e.buffT && e.buffT < this.t && e.buffT > 0) { e.buffT = -1; e.spd /= 1.4; e.dmg /= 1.3; e.r = Math.round(e.r / 1.25); }
    this.lures = this.lures.filter(L => !(L.premio && (L.gone || L.hp <= 0)));
    // ondas del berrinche
    for (const W of this.waves) {
      W.t += dt; const r = W.R * Math.min(1, W.t / W.dur);
      for (const p of this.alive()) {
        if (W.hit.has(p.side)) continue;
        const d = Math.hypot(p.x - W.x, p.y - W.y); if (Math.abs(d - r) > 7) continue;
        const a = Math.atan2(p.y - W.y, p.x - W.x);
        if (Math.abs(ANG(a - W.g1)) < 0.45 || Math.abs(ANG(a - W.g2)) < 0.45) continue;
        W.hit.add(p.side); this.hurt(p, W.dmg);
      }
    }
    this.waves = this.waves.filter(W => W.t < W.dur);
    // especial de Maitena: carga con gatos, se toca desde el HUD
    if (this.mai) {
      this.mai.k = Math.min(1, (this.kills - this.mai.base) / MAITENA_KILLS);
      for (const [side, inp] of Object.entries(input || {})) if (inp && inp.mai && this.players[side]) this.pressMaitena(side);
      if (this.maiArm && this.t - this.maiArm.t > MAITENA_PAIR) { this.maiArm = null; this.callMaitena(false); }
    }
    for (const p of Object.values(this.players)) { if (p.downed && !this.wasDown[p.side]) this.score.downs++; this.wasDown[p.side] = p.downed; }
    // subtítulos que no pausan (la cinemática del prólogo y lo que dicen los aliados)
    if (this.talk && this.t > this.talk.until) this.talk = null;
    if (!this.talk && this.talks.length) { const n = this.talks.shift(); this.talk = { who: n.who, text: n.text, until: this.t + n.dur, n: ++this.hintN }; }
    if (this.hint && this.t > this.hint.until) this.hint = null;
    if (this.allies.length) this.updateAllies(dt);
    if (this.goal) this.updateGoal(dt);
  },

  /* ---------- foto del estado: lo de la historia ---------- */
  snapshot() {
    const s = this._o.snapshot.call(this);
    for (const [side, p] of Object.entries(this.players)) if (p.skin && s.P[side]) s.P[side].sk = p.skin;
    if (!this.story) return s;
    // banderas de los gatos: aviso de los tipos nuevos (con ángulo), marcado, agrandado, aturdido
    const E = s.E;
    for (let i = 0, j = 0; i < this.enemies.length; i++, j += 6) {
      const e = this.enemies[i];
      if (e.tel) { E[j + 4] |= K.F_TELE; E[j + 5] = Math.round(Math.atan2(e.ay, e.ax) * 10); }
      else if (e.st === 2 && (e.type === "guantes" || e.type === "luz2" || e.type === "canicheBoss")) E[j + 5] = Math.round(Math.atan2(e.ay, e.ax) * 10);
      if (e.markT > this.t) E[j + 4] |= F_MARK;
      if (e.buffT > this.t) E[j + 4] |= F_BUFF;
      if ((e.stunT > this.t) || (e.type === "luz2" && e.st === 3)) E[j + 4] |= F_STUN;
      if (e.surr) E[j + 4] |= F_SURR;
    }
    // aliados: Carmelo llorando o corriendo palomas; los que se fueron no se dibujan
    const A = []; for (const a of this.allies) {
      if (a.gone) continue;
      const tele = a.st === 1, f = (a.flash > 0 ? K.F_FLASH : 0) | (tele ? K.F_TELE : 0) | (a.st === 2 ? K.F_RUSH : 0) | (a.face < 0 ? K.F_LEFT : 0) | (a.down ? K.F_DOWN : 0) | (a.cry ? F_CRY : 0) | (a.flee > 0 ? F_RUN : 0) | (a.mt && a.mt.phase === 1 ? F_KICK : 0);
      A.push(a.id, K.ENEMY_ID[a.type], Math.round(a.x), Math.round(a.y), f, tele || a.st === 2 ? Math.round(Math.atan2(a.ay, a.ax) * 10) : 0);
    }
    s.A = A;
    s.goal = this.goalSnap();
    s.hn = this.hint ? [this.hint.n, this.hint.text] : null;
    s.tk = this.talk ? [this.talk.n, this.talk.who, this.talk.text] : null;
    s.Wv = this.waves.map(W => [Math.round(W.x), Math.round(W.y), Math.round(W.R * Math.min(1, W.t / W.dur)), Math.round(W.g1 * 100), Math.round(W.g2 * 100)]);
    s.mai = this.mai ? [Math.round(this.mai.k * 100) / 100, this.maiArm ? this.maiArm.side : "", this.maiOn ? 1 : 0] : null;
    if (s.dlg) { const line = this.dlg.lines[this.dlg.i]; if (line && line.ask) { s.dlg.o = line.ask.opts; s.dlg.an = { ...(this.dlg.ans || {}) }; s.dlg.a = 15; } }
    if (s.boss) { const B = this.bossRef; s.boss.mk = B && B.type === "luz2" && B.st === 1 ? B.mk : null; s.boss.ph = B && B.ph || 1; if (B && B.surr) s.boss.hp = 0; }
    if (this.state === "win") s.sr = this.stars;
    if (this.state === "over" && this.endBanner) s.eb = this.endBanner;
    return s;
  },
  goalSnap() {
    const g = this.goal; if (!g || g.k === "none") return null;
    const el = this.t - g.t0;
    const o = { k: g.k, p: Math.round(Math.min(1, g.p) * 100), lb: g.lb, n: g.n, of: g.of, ok: g.done ? 1 : 0, l: null, hp: null, x: null, y: null, r: null, fl: 0, to: null, a: null, pts: null, T: null, rs: null, sp: null };
    if (g.dur && (g.k === "survive" || g.k === "defend" || g.k === "protect")) o.l = Math.max(0, Math.ceil(g.dur - el));
    if (g.targets) { o.T = g.targets.map(T => [Math.round(T.x), Math.round(T.y), T.r, Math.round(Math.max(0, T.hp) / T.maxHp * 100), T.flash > 0 ? 1 : 0, T.down ? 1 : 0]); const up = g.targets.filter(T => !T.down); o.hp = up.length ? Math.round(Math.min(...up.map(T => T.hp / T.maxHp)) * 100) : 0; }
    if (g.ally) { o.a = g.ally.id; if (g.k === "protect") o.hp = Math.round(Math.max(0, g.ally.hp) / g.ally.maxHp * 100); if (g.k === "escort") o.hp = g.ally.cry ? -1 : Math.round(Math.max(0, 100 - g.ally.fear)); }
    if (g.k === "escort" && g.path) { const w = g.path[g.wp] || g.path[g.path.length - 1]; o.to = [Math.round(w.x), Math.round(w.y)]; o.r = 14; }
    if (g.k === "reach") { const w = g.path[g.wp]; if (w) { o.to = [Math.round(w.x), Math.round(w.y)]; o.r = g.r; } }
    if (g.res && (g.k === "reach" ? g.wp >= g.path.length : g.n >= (g.res.after || 0)) && !g.res.done) o.rs = [Math.round(g.res.x), Math.round(g.res.y), g.res.r, Math.round(g.res.prog * 100), g.res.who || ""];
    else if (g.res && !g.res.done && g.k === "trains") o.rs = [Math.round(g.res.x), Math.round(g.res.y), g.res.r, -1, g.res.who || ""]; // todavía no se puede
    if (g.spots) { const S = g.spot; o.sp = S.wait ? null : [Math.round(S.x), Math.round(S.y), g.r, Math.round(S.f * 100), g.win ? Math.max(0, Math.ceil(S.until - this.t)) : -1, S.sat ? 1 : 0]; o.n = g.cur; o.wt = S.wait || 0; }
    if (g.k === "reach" && g.hold && g.hold.prog !== undefined) o.hd = Math.round(g.hold.prog * 100);
    if (g.pts) o.pts = g.pts.slice();
    if (g.k === "boss") { const B = g.boss; o.hp = B ? Math.round(Math.max(0, B.hp) / B.maxHp * 100) : null; o.bt = g.type; o.in = B ? 1 : 0; }
    if (g.aim) { o.am = [Math.round(g.aim.x), Math.round(g.aim.y)]; }
    return o;
  }
};
const REPEAT = { allyDown: true };
// banderas nuevas de la foto (las viejas: 1 destello, 2 aviso, 4 élite, 8 embestida, 16 mojado, 32 izquierda, 64 caído)
export const F_MARK = 128, F_BUFF = 256, F_STUN = 512, F_SURR = 1024, F_CRY = 128, F_RUN = 256, F_KICK = 512; // CRY/RUN/KICK: solo aliados
// puntos con nombre de los mapas nuevos (GEO de maps.js)
const POINTS = {
  abuela: { galeria: { x: 512, y: 236 }, cucha: { x: 300, y: 650 }, porton: { x: 512, y: 850 }, limonero: { x: 220, y: 430 } },
  roros: { horno: { x: 180, y: 226 }, mesaTortas: { x: 800, y: 436 }, isla: { x: 512, y: 392 }, vidriera: { x: 512, y: 610 }, puerta: { x: 512, y: 950 } }
};
export function installStory(Sim, consts) {
  K = consts;
  const P = Sim.prototype;
  // los métodos del motor que se envuelven quedan guardados en la propia clase (bot.mjs carga una copia del motor)
  P._o = { gainXp: P.gainXp, addPlayer: P.addPlayer, doEvent: P.doEvent, win: P.win, snapshot: P.snapshot };
  // métodos del motor que pasan por acá aunque no haya historia: se comportan igual que antes en el arcade
  for (const [k, fn] of Object.entries(M)) P[k] = fn;
  P.step_ = M.step_;
}
