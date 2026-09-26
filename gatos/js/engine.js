// Simulación de "Gatos de Linda". La corre solo el anfitrión; el invitado recibe fotos del estado.
export const MAP = 1024;          // el mundo mide 1024 x 1024 px (baja resolución)
export const RUN_BOSS1 = 210;     // Luz aparece a los 3:30
export const RUN_BOSS2 = 420;     // Linda aparece a los 7:00

// b: zona caminable [x0, y0, x1, y1]; hz: peligro que cruza el mapa; tier: dificultad del lugar
export const MAPS = {
  plaza:    { tier: 0, b: [12, 12, MAP - 12, MAP - 12], hz: null, pigeons: 30 },
  estacion: { tier: 1, b: [12, 12, MAP - 12, MAP - 12], hz: "tren", hzEvery: 30, hzFirst: 35 },
  feria:    { tier: 2, b: [12, 202, MAP - 12, MAP - 12], hz: "fletero", hzEvery: 26, hzFirst: 40, crates: 6 },
  bielli:   { tier: 3, b: [30, 200, MAP - 30, 984], hz: "trote", hzEvery: 22, hzFirst: 30 },
  cancha:   { tier: 3, b: [12, 136, MAP - 12, MAP - 136], hz: "cortadora", hzEvery: 24, hzFirst: 30 },
  tortugas: { tier: 4, b: [12, 176, MAP - 12, 870], hz: "carritos", hzEvery: 22, hzFirst: 30 },
  terrazas: { tier: 5, b: [12, 214, MAP - 12, MAP - 12], hz: "autos", hzEvery: 18, hzFirst: 25 }
};
export const HAZ = {
  tren:      { len: 330, spd: 560, h: 22, dmg: 40, edmg: 9999, warn: 2.2 },
  fletero:   { len: 52, spd: 320, h: 12, dmg: 24, edmg: 140, warn: 1.7 },
  cortadora: { len: 22, spd: 120, h: 11, dmg: 18, edmg: 90, warn: 1.4 },
  carritos:  { len: 156, spd: 210, h: 9, dmg: 20, edmg: 80, warn: 1.7 },
  autos:     { len: 44, spd: 360, h: 13, dmg: 28, edmg: 160, warn: 1.5 },
  trote:     { len: 112, spd: 140, h: 10, dmg: 16, edmg: 80, warn: 1.6 }
};
export const HAZ_ID = Object.keys(HAZ);

export const ENEMY = {
  gato:      { hp: 10, spd: 30, dmg: 6, r: 6, xp: 1 },
  negro:     { hp: 22, spd: 38, dmg: 8, r: 6, xp: 2 },
  paloma:    { hp: 6, spd: 70, dmg: 5, r: 5, xp: 1 },
  gordo:     { hp: 60, spd: 21, dmg: 12, r: 9, xp: 5 },
  luz:       { hp: 1000, spd: 28, dmg: 16, r: 13, xp: 40, boss: true },
  linda:     { hp: 4200, spd: 25, dmg: 20, r: 17, xp: 0, boss: true },
  saltarin:  { hp: 16, spd: 31, dmg: 9, r: 6, xp: 2 },
  escupidor: { hp: 18, spd: 26, dmg: 5, r: 6, xp: 3 },
  madre:     { hp: 40, spd: 23, dmg: 8, r: 7, xp: 3 },
  gatito:    { hp: 4, spd: 50, dmg: 3, r: 4, xp: 1 },
  caja:      { hp: 24, spd: 0, dmg: 0, r: 7, xp: 0, obj: true }
};
export const ENEMY_ID = { gato: 0, negro: 1, paloma: 2, gordo: 3, luz: 4, linda: 5, saltarin: 6, escupidor: 7, madre: 8, gatito: 9, caja: 10 };
export const ENEMY_NAME = Object.keys(ENEMY_ID);
export const PICKS = ["alfajor", "moneda", "caja", "iman", "manguera"];
// banderas de cada gato en la foto del estado
export const F_FLASH = 1, F_TELE = 2, F_ELITE = 4, F_RUSH = 8, F_WET = 16;

export const WEAPONS = {
  patada:    { name: "Patada Bielli", desc: "Patada en arco hacia donde mirás. Nivel 3: a los dos lados.", max: 5, evo: { p: "guantes", name: "Patada Voladora", desc: "Patada giratoria enorme que tira a todos para atrás." } },
  medialuna: { name: "Medialunas", desc: "Tira medialunas al gato más cercano.", max: 5, evo: { p: "amargo", name: "Docena de Medialunas", desc: "Abanico de 6 medialunas que atraviesan." } },
  juli:      { name: "Juli", desc: "Juli gira a tu alrededor y araña lo que toca.", max: 5, evo: { p: "abrazo", name: "Juli Mimosa", desc: "4 Julis que te curan cada vez que arañan." } },
  romero:    { name: "Romero", desc: "Romero sale corriendo a morder gatos.", max: 5, evo: { p: "zapatillas", name: "Romero Desatado", desc: "Más rápido, y cada mordida pega a todos alrededor." } },
  mate:      { name: "Mate hirviendo", desc: "Charcos de mate que queman lo que pisa.", max: 5, evo: { p: "termo", name: "Pava Hirviendo", desc: "Dos charcos gigantes que además frenan a los gatos." } },
  bondi:     { name: "El 315", desc: "Pasa el colectivo y se lleva puesto todo.", max: 5, evo: { p: "iman", name: "315 Expreso", desc: "Dos colectivos, uno para cada lado, más seguido." } },
  rodillo:   { name: "Palo de amasar", desc: "Va y vuelve, atraviesa a todos.", max: 5, evo: { p: "vendas", name: "Rodillo de Acero", desc: "Cuatro palos a la vez, en cruz." } },
  torta:     { name: "Torta bomba", desc: "Una torta que explota al caer.", max: 5, evo: { p: "delantal", name: "Torta de Tres Pisos", desc: "Cada torta explota y larga tres más." } }
};
export const PASSIVES = {
  guantes:    { name: "Guantes de box", desc: "+15% de daño.", max: 5 },
  zapatillas: { name: "Zapatillas", desc: "+8% de velocidad.", max: 5 },
  termo:      { name: "Termo", desc: "Recuperás vida de a poco.", max: 5 },
  iman:       { name: "Imán", desc: "Juntás la experiencia desde más lejos.", max: 5 },
  amargo:     { name: "Mate amargo", desc: "Las armas se recargan 7% más rápido.", max: 5 },
  abrazo:     { name: "Abrazo", desc: "+20 de vida máxima.", max: 5 },
  delantal:   { name: "Delantal de Roro", desc: "+10% de área en golpes, charcos y explosiones.", max: 5 },
  vendas:     { name: "Vendas", desc: "Recibís 7% menos de daño.", max: 5 }
};
export const EVO_OF = Object.fromEntries(Object.entries(WEAPONS).map(([w, d]) => [d.evo.p, w]));
export const SLOTS = 5;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export class Sim {
  constructor(map = "plaza") {
    this.map = MAPS[map] ? map : "plaza"; this.cfg = MAPS[this.map];
    this.t = 0; this.state = "run";
    this.players = {}; this.enemies = []; this.proj = []; this.eproj = []; this.gems = []; this.pools = []; this.bombs = []; this.buses = []; this.pickups = []; this.zones = []; this.hz = [];
    this.nextId = 1; this.level = 1; this.xp = 0; this.xpNext = 5; this.kills = 0; this.coins = 0;
    this.offers = {}; this.pendingLevels = 0;
    this.ev = []; this.spawnAcc = 0; this.boss1 = false; this.boss2 = false; this.bossRef = null;
    this.hordes = [150, 330]; this.calm = 0;
    this.eliteNext = 70; this.crateNext = 12; this.hzNext = this.cfg.hzFirst || 9e9;
    this.objTimes = [95, 250, 365]; this.obj = null;
    this.bond = false;
    this.grid = new Map();
  }

  addPlayer(side, char, meta = {}) {
    const m = { hp: 0, dmg: 0, spd: 0, mag: 0, ...meta };
    const [x0, y0, x1, y1] = this.cfg.b;
    const p = {
      side, char, x: (x0 + x1) / 2 + (side === "host" ? -14 : 14), y: (y0 + y1) / 2 + 30, face: 1, moving: 0,
      maxHp: 100 + m.hp * 10, hp: 100 + m.hp * 10, speed: 62 * (1 + m.spd * 0.05), dmgMul: 1 + m.dmg * 0.08, cdMul: 1, magnet: 26 * (1 + m.mag * 0.15), regen: 0, area: 1, armor: 1,
      weapons: { [char === "thomas" ? "patada" : "medialuna"]: 1 }, passives: {}, evo: {}, cds: {}, inv: 0, downed: false, reviveT: 0, ult: 0, kills: 0, lastUlt: -9,
      dashCd: 0, dashT: 0, dvx: 0, dvy: 0, bond: false,
      dog: null, orbA: 0
    };
    if (this.map === "bielli" && char === "thomas") p.dmgMul += 0.15; // juega de local
    this.players[side] = p;
    return p;
  }

  alive() { return Object.values(this.players).filter(p => !p.downed); }
  inB(x, y, m = 0) { const b = this.cfg.b; return x >= b[0] + m && x <= b[2] - m && y >= b[1] + m && y <= b[3] - m; }

  /* ---------- paso de simulación ---------- */
  step(dt, input) {
    if (this.state !== "run") return;
    this.t += dt;
    const ps = Object.values(this.players), [bx0, by0, bx1, by1] = this.cfg.b;
    // movimiento: el anfitrión se mueve con su joystick; el invitado manda su posición
    for (const p of ps) {
      const inp = input[p.side] || {};
      p.dashCd = Math.max(0, p.dashCd - dt);
      if (p.downed) { p.moving = 0; continue; }
      let mx = 0, my = 0;
      if (inp.pos) { p.x = inp.pos.x; p.y = inp.pos.y; p.face = inp.face || p.face; p.moving = inp.moving ? 1 : 0; }
      else if (inp.dir) {
        const { x, y } = inp.dir; const m = Math.hypot(x, y);
        p.moving = m > 0.1 ? 1 : 0;
        if (m > 0.1) { mx = x / Math.max(1, m); my = y / Math.max(1, m); p.x += x * p.speed * dt; p.y += y * p.speed * dt; if (Math.abs(x) > 0.15) p.face = Math.sign(x); }
      }
      if (inp.dash && p.dashCd <= 0) {
        p.dashCd = 2.4; p.inv = Math.max(p.inv, 0.35);
        if (!inp.pos) { if (!mx && !my) mx = p.face; const m = Math.hypot(mx, my); p.dvx = mx / m * 290; p.dvy = my / m * 290; p.dashT = 0.17; }
        this.ev.push(["dash", Math.round(p.x), Math.round(p.y), p.side]);
      }
      if (p.dashT > 0) { p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt; }
      p.x = clamp(p.x, bx0, bx1); p.y = clamp(p.y, by0, by1);
      if (inp.ult && p.ult >= 1) this.ultimate(p);
      p.inv = Math.max(0, p.inv - dt);
      if (p.regen) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    }
    // juntos pegan más fuerte
    const al = this.alive();
    this.bond = al.length === 2 && d2(al[0], al[1]) < 72 * 72;
    for (const p of ps) p.bond = this.bond && !p.downed;
    this.revive(dt);
    this.spawn(dt);
    this.buildGrid();
    this.moveEnemies(dt);
    for (const p of ps) if (!p.downed) this.weapons(p, dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateObjective(dt);
    this.updateGems(dt);
    this.cleanup();
    if (this.alive().length === 0) { this.state = "over"; this.ev.push(["over"]); }
  }

  revive(dt) {
    const ps = Object.values(this.players);
    for (const p of ps) {
      if (!p.downed) continue;
      const helper = ps.find(q => q !== p && !q.downed && d2(p, q) < 24 * 24);
      p.reviveT = helper ? p.reviveT + dt : Math.max(0, p.reviveT - dt * 0.5);
      if (p.reviveT >= 2.2) { p.downed = false; p.hp = p.maxHp * 0.45; p.inv = 2; p.reviveT = 0; this.ev.push(["revive", p.x, p.y, p.side]); }
    }
  }

  /* ---------- aparición de enemigos ---------- */
  spawnAt(type, x, y, hpMul = 1) {
    const b = ENEMY[type], tier = this.cfg.tier;
    const scale = (1 + this.t / 130 + (this.t / 270) ** 2) * (1 + tier * 0.07);
    const solo = Object.keys(this.players).length === 1 ? 0.7 : 1;
    const hp = b.boss ? b.hp * solo * (1 + tier * 0.06) * (1 + this.level * 0.08) : b.hp * scale * hpMul * (solo < 1 ? 0.85 : 1);
    const [x0, y0, x1, y1] = this.cfg.b;
    const e = { id: this.nextId++, type, x: clamp(x, x0, x1), y: clamp(y, y0, y1), hp, maxHp: hp, spd: b.spd * (b.boss ? 1 : 1 + this.t / 900), dmg: b.dmg, r: b.r, flash: 0, kx: 0, ky: 0, wob: Math.random() * 9, cd: rnd(1, 2.5), st: 0, stT: 0, ax: 0, ay: 0, slow: 0, hits: {} };
    if (type === "paloma") { e.x = x; e.y = y; }
    this.enemies.push(e);
    return e;
  }
  // punto a cierta distancia de un jugador, dentro de la zona caminable
  ringPos(dist, from) {
    const ps = this.alive(); const p = from || ps[Math.floor(Math.random() * ps.length)] || Object.values(this.players)[0];
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * dist, y = p.y + Math.sin(a) * dist;
      if (this.inB(x, y, 6)) return { x, y, p };
    }
    const a = Math.random() * Math.PI * 2;
    return { x: p.x + Math.cos(a) * dist, y: p.y + Math.sin(a) * dist, p };
  }
  pressure() {
    const n = Object.keys(this.players).length;
    if (this.alive().length < n) return 0.5;                  // si uno cayó, aflojan para dar chance de levantarlo
    const expected = 1 + this.t / 16;
    return clamp(0.9 + (this.level - expected) * 0.035, 0.85, 1.25); // si van sobrados, aprietan
  }
  count(type) { let n = 0; for (const e of this.enemies) if (e.type === type && e.hp > 0) n++; return n; }
  spawn(dt) {
    const t = this.t, tier = this.cfg.tier;
    const crossed = every => Math.floor(t / every) !== Math.floor((t - dt) / every);
    if (!this.boss1 && t >= RUN_BOSS1) { this.boss1 = true; const q = this.ringPos(150); this.bossRef = this.spawnAt("luz", q.x, q.y); this.ev.push(["boss", "luz"]); this.calm = 3; }
    if (!this.boss2 && t >= RUN_BOSS2) { this.boss2 = true; const q = this.ringPos(160); this.bossRef = this.spawnAt("linda", q.x, q.y); this.bossRef.phase = 1; this.ev.push(["boss", "linda"]); this.calm = 4; }
    const bossAlive = this.bossRef && this.bossRef.hp > 0;
    // horda en anillo con dos huecos: hay que encontrar la salida
    if (this.hordes.length && t >= this.hordes[0]) {
      this.hordes.shift(); this.ev.push(["horde"]);
      const ps = this.alive(); const p = ps[0] || Object.values(this.players)[0];
      const gap = Math.random() * Math.PI * 2, N = 40;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, da = k => Math.abs(Math.atan2(Math.sin(a - k), Math.cos(a - k)));
        if (da(gap) < 0.42 || da(gap + Math.PI) < 0.42) continue;
        this.spawnAt(t > 300 ? (i % 3 ? "negro" : "saltarin") : "gato", p.x + Math.cos(a) * 150, p.y + Math.sin(a) * 150);
      }
    }
    // bandada de palomas que cruza
    const pe = this.cfg.pigeons || 42;
    if (t > 50 && crossed(pe)) {
      const q = this.ringPos(170); const dx = q.p.x - q.x, dy = q.p.y - q.y, m = Math.hypot(dx, dy);
      for (let i = 0; i < 12; i++) { const e = this.spawnAt("paloma", q.x + rnd(-20, 20), q.y + rnd(-20, 20)); e.vx = dx / m; e.vy = dy / m; }
    }
    // gato de élite: duro, lento, suelta una caja
    if (t >= this.eliteNext) {
      this.eliteNext = t + Math.max(38, 58 - t / 25);
      if (!bossAlive) this.spawnElite();
    }
    // cajones para romper
    if (t >= this.crateNext) {
      this.crateNext = t + (this.cfg.crates || 13);
      if (this.count("caja") < 5) { const q = this.ringPos(rnd(90, 200)); if (this.inB(q.x, q.y, 20)) this.spawnAt("caja", q.x, q.y); }
    }
    // pedido de Roro's
    if (this.objTimes.length && t >= this.objTimes[0]) {
      if (bossAlive) this.objTimes[0] += 12; else { this.objTimes.shift(); this.startObjective(); }
    }
    // peligro del lugar
    if (this.cfg.hz && t >= this.hzNext) { this.hzNext = t + this.cfg.hzEvery * rnd(0.85, 1.15); this.spawnHazard(); }

    if (this.calm > 0) { this.calm -= dt; }
    const moving = this.enemies.length - this.count("caja");
    if (moving >= 220) return;
    const rate = Math.min(9, 0.9 + t / 34) * this.pressure() * (1 + tier * 0.04) * (this.calm > 0 ? 0.2 : 1) * (Object.keys(this.players).length === 1 ? 0.72 : 1);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const q = this.ringPos(rnd(140, 180));
      this.spawnAt(this.pickType(), q.x, q.y);
    }
  }
  pickType() {
    const t = this.t;
    const W = [["gato", t < 300 ? 10 : 5]];
    if (t > 45) W.push(["saltarin", t > 200 ? 4 : 3]);
    if (t > 90 && this.count("escupidor") < 4 + Math.floor(t / 90)) W.push(["escupidor", t > 250 ? 3 : 2]);
    if (t > 110) W.push(["negro", t > 300 ? 7 : 4]);
    if (t > 140 && this.count("madre") < 7) W.push(["madre", 2]);
    if (t > 180) W.push(["gordo", t > 300 ? 3 : 2]);
    const tot = W.reduce((a, w) => a + w[1], 0); let r = Math.random() * tot;
    for (const [k, w] of W) { if ((r -= w) <= 0) return k; }
    return "gato";
  }
  spawnElite() {
    const t = this.t;
    const pool = t < 110 ? ["gato", "saltarin"] : t < 200 ? ["saltarin", "negro", "madre"] : ["negro", "gordo", "madre", "saltarin"];
    const q = this.ringPos(160);
    const e = this.spawnAt(pool[Math.floor(Math.random() * pool.length)], q.x, q.y, 8);
    e.elite = true; e.r = Math.round(e.r * 1.8); e.dmg *= 1.4; e.spd *= 0.85;
    this.ev.push(["elite", Math.round(e.x), Math.round(e.y)]);
  }

  /* ---------- pedido de Roro's: llevarlo juntos carga el doble ---------- */
  startObjective() {
    const ps = this.alive(); if (!ps.length) return;
    const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    let x = cx, y = cy;
    for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, d = rnd(170, 240); x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d; if (this.inB(x, y, 40)) break; }
    const b = this.cfg.b; x = clamp(x, b[0] + 40, b[2] - 40); y = clamp(y, b[1] + 40, b[3] - 40);
    this.obj = { x, y, prog: 0, left: 32, acc: 0 };
    this.ev.push(["obj", 2]);
  }
  updateObjective(dt) {
    const o = this.obj; if (!o) return;
    o.left -= dt;
    const inside = this.alive().filter(p => d2(p, o) < 22 * 22).length;
    const solo = Object.keys(this.players).length === 1;
    o.prog += dt * (inside >= 2 ? 0.5 : inside === 1 ? (solo ? 0.34 : 0.2) : 0);
    // el olor a torta atrae gatos
    if (inside) { o.acc += dt; if (o.acc > 1.1) { o.acc = 0; const a = Math.random() * Math.PI * 2; this.spawnAt(Math.random() < 0.5 ? "saltarin" : "gato", o.x + Math.cos(a) * 120, o.y + Math.sin(a) * 120); } }
    if (o.prog >= 1) {
      this.pickups.push({ k: "caja", x: o.x, y: o.y + 6 }, { k: "alfajor", x: o.x - 12, y: o.y }, { k: "moneda", x: o.x + 12, y: o.y }, { k: "moneda", x: o.x + 16, y: o.y + 8 });
      this.coins += 3; this.ev.push(["obj", 1, Math.round(o.x), Math.round(o.y)]); this.obj = null;
    } else if (o.left <= 0) { this.ev.push(["obj", 0]); this.obj = null; }
  }

  /* ---------- peligros que cruzan el mapa (avisan antes) ---------- */
  spawnHazard() {
    const k = this.cfg.hz, H = HAZ[k], ps = this.alive(); if (!ps.length) return;
    const p = ps[Math.floor(Math.random() * ps.length)], b = this.cfg.b;
    let y = clamp(p.y + rnd(-6, 6), b[1] + H.h, b[3] - H.h);
    if (k === "tren") y = Math.abs(p.y - 335) < Math.abs(p.y - 675) ? 335 : 675;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const lanes = k === "cortadora" ? [y, clamp(y + (Math.random() < 0.5 ? -60 : 60), b[1] + H.h, b[3] - H.h)] : [y];
    for (const ly of lanes) this.hz.push({ k, y: ly, h: H.h, dir, warn: H.warn, x: dir > 0 ? -10 : MAP + 10, len: H.len, spd: H.spd, dmg: H.dmg, edmg: H.edmg, hit: new Set(), ph: new Set() });
    this.ev.push(["warn", k]);
  }
  updateHazards(dt) {
    for (const z of this.hz) {
      if (z.warn > 0) { z.warn -= dt; if (z.warn <= 0) this.ev.push(["pass", z.k]); continue; }
      z.x += z.dir * z.spd * dt;
      const a = z.dir > 0 ? z.x - z.len : z.x, b = z.dir > 0 ? z.x : z.x + z.len;
      if ((z.dir > 0 && a > MAP + 20) || (z.dir < 0 && b < -20)) { z.done = true; continue; }
      for (const p of this.alive()) if (!z.ph.has(p.side) && p.x > a && p.x < b && Math.abs(p.y - z.y) < z.h + 4) { z.ph.add(p.side); p.inv = 0; this.hurt(p, z.dmg, true); }
      this.near((a + b) / 2, z.y, Math.max(z.len / 2, z.h) + 8, e => {
        if (z.hit.has(e.id) || e.x < a || e.x > b || Math.abs(e.y - z.y) > z.h + e.r) return;
        z.hit.add(e.id); this.damage(e, ENEMY[e.type].boss ? 220 : z.edmg, null, z.dir * 260, (e.y - z.y) * 10, true);
      });
    }
  }

  /* ---------- grilla espacial ---------- */
  buildGrid() {
    this.grid.clear();
    for (const e of this.enemies) {
      const k = ((e.x >> 5) << 8) | (e.y >> 5);
      let c = this.grid.get(k); if (!c) this.grid.set(k, c = []); c.push(e);
    }
  }
  near(x, y, r, fn) {
    const x0 = (x - r) >> 5, x1 = (x + r) >> 5, y0 = (y - r) >> 5, y1 = (y + r) >> 5;
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const c = this.grid.get((gx << 8) | gy); if (!c) continue;
      for (const e of c) if (e.hp > 0) fn(e);
    }
  }
  foe(e) { return e.hp > 0 && !ENEMY[e.type].obj; }
  nearest(p, maxR = 200) {
    let best = null, bd = maxR * maxR;
    for (const e of this.enemies) { if (!this.foe(e)) continue; const d = d2(p, e); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  moveEnemies(dt) {
    const alive = this.alive(), [bx0, by0, bx1, by1] = this.cfg.b;
    const dmgScale = (1 + this.t / 330) * (1 + this.cfg.tier * 0.05);
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - dt); e.slow = Math.max(0, e.slow - dt);
      if (ENEMY[e.type].obj) continue;
      let tgt = null, bd = Infinity;
      for (const p of alive) { const d = d2(p, e); if (d < bd) { bd = d; tgt = p; } }
      if (!tgt) continue;
      let dx = tgt.x - e.x, dy = tgt.y - e.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      let spd = e.spd * (e.slow > 0 ? 0.5 : 1);
      switch (e.type) {
        case "paloma": if (e.vx !== undefined) { dx = e.vx; dy = e.vy + Math.sin(this.t * 6 + e.wob) * 0.4; } break;
        case "saltarin":
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.36; } }
          else if (e.st === 2) { spd = 235; dx = e.ax; dy = e.ay; if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = rnd(2.4, 3.4); } }
          else if ((e.cd -= dt) <= 0 && m < 85) { e.st = 1; e.stT = e.elite ? 0.6 : 0.5; e.ax = dx; e.ay = dy; }
          break;
        case "escupidor":
          e.cd -= dt;
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = rnd(2.8, 3.8); const n = e.elite ? 3 : 1; for (let i = 0; i < n; i++) { const a = Math.atan2(tgt.y - e.y, tgt.x - e.x) + (i - (n - 1) / 2) * 0.28; this.eproj.push({ k: 1, x: e.x, y: e.y - 5, vx: Math.cos(a) * 88, vy: Math.sin(a) * 88, life: 2.6, dmg: 9 * dmgScale }); } this.ev.push(["spit", Math.round(e.x), Math.round(e.y)]); } }
          else if (m < 125 && e.cd <= 0 && this.eproj.length < 48) { e.st = 1; e.stT = 0.6; spd = 0; }
          else if (m < 72) { dx = -dx; dy = -dy; spd *= 0.8; }
          else if (m < 115) spd *= 0.25;
          break;
        case "luz":
          e.cd -= dt;
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.7; } }
          else if (e.st === 2) { spd *= 4.4; dx = e.ax; dy = e.ay; if ((e.stT -= dt) <= 0) { e.st = 0; if (e.hp < e.maxHp * 0.5 && !e.dbl) { e.dbl = true; e.cd = 0.25; } else { e.dbl = false; e.cd = 2.6; } } }
          else if (e.cd <= 0) { e.st = 1; e.stT = e.dbl ? 0.4 : 0.65; e.ax = dx; e.ay = dy; this.ev.push(["charge", Math.round(e.x), Math.round(e.y)]); }
          break;
        case "linda": spd *= this.linda(e, dx, dy, dt, dmgScale); break;
      }
      // separación entre gatos para que no se amontonen en un punto
      let sx = 0, sy = 0;
      this.near(e.x, e.y, 12, o => { if (o === e) return; const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy; const rr = (e.r + o.r) * 0.8; if (dd < rr * rr && dd > 0.01) { const k = (rr - Math.sqrt(dd)) / rr; sx += ox * k; sy += oy * k; } });
      e.x += (dx * spd + e.kx + sx * 6) * dt; e.y += (dy * spd + e.ky + sy * 6) * dt;
      e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (e.type === "paloma") { if (e.x < -20 || e.x > MAP + 20 || e.y < -20 || e.y > MAP + 20) e.hp = 0, e.gone = true; }
      else { e.x = clamp(e.x, bx0, bx1); e.y = clamp(e.y, by0, by1); }
      // contacto con jugadores
      const dmg = e.dmg * dmgScale;
      for (const p of alive) {
        const rr = e.r + 5;
        if (p.inv <= 0 && d2(p, e) < rr * rr) this.hurt(p, dmg);
      }
    }
  }
  // Linda cambia de táctica a medida que pierde vida
  linda(e, dx, dy, dt, dmgScale) {
    const ph = e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3;
    if (ph !== e.phase) { e.phase = ph; e.cd = 1.4; e.zcd = 1.6; this.ev.push(["phase", ph, Math.round(e.x), Math.round(e.y)]); this.calm = 2; }
    e.cd -= dt;
    if (e.cd <= 0) {
      const base = Math.atan2(dy, dx);
      if (ph < 3) {
        e.cd = ph === 1 ? 2.4 : 2.2;
        const n = ph === 1 ? 3 : 5;
        for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.3; this.eproj.push({ k: 0, x: e.x, y: e.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 3.5, dmg: 12 * dmgScale }); }
        if (Math.random() < 0.42) {
          const kinds = ph === 1 ? ["negro", "negro", "negro", "negro", "negro", "negro"] : ["madre", "saltarin", "madre", "saltarin"];
          kinds.forEach((k, i) => { const a = i / kinds.length * Math.PI * 2; this.spawnAt(k, e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); });
          this.ev.push(["summon", Math.round(e.x), Math.round(e.y)]);
        }
      } else {
        // anillo de bolas de pelo con un hueco para escapar
        e.cd = 2.9;
        const N = 20, gap = base + rnd(-0.6, 0.6);
        for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.5) continue; this.eproj.push({ k: 0, x: e.x, y: e.y - 8, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 4, dmg: 12 * dmgScale }); }
        if (Math.random() < 0.3) { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; this.spawnAt("saltarin", e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); } this.ev.push(["summon", Math.round(e.x), Math.round(e.y)]); }
      }
      this.ev.push(["hairball", Math.round(e.x), Math.round(e.y)]);
    }
    if (ph >= 2) {
      e.zcd -= dt;
      if (e.zcd <= 0) {
        e.zcd = ph === 3 ? 3.4 : 4.4;
        for (const p of this.alive()) this.zones.push({ x: p.x + rnd(-8, 8), y: p.y + rnd(-8, 8), r: 24, t: 0, dur: 1.15, dmg: 16 * dmgScale });
        if (ph === 3) { const q = this.ringPos(rnd(30, 70)); this.zones.push({ x: q.x, y: q.y, r: 30, t: 0, dur: 1.3, dmg: 16 * dmgScale }); }
        this.ev.push(["zones"]);
      }
    }
    return ph === 3 ? 1.35 : 1;
  }

  hurt(p, dmg, force) {
    if (p.downed || (p.inv > 0 && !force)) return;
    p.hp -= dmg * p.armor; p.inv = 0.6;
    this.ev.push(["hurt", Math.round(p.x), Math.round(p.y), p.side]);
    if (p.hp <= 0) { p.hp = 0; p.downed = true; p.reviveT = 0; p.dashT = 0; this.ev.push(["down", Math.round(p.x), Math.round(p.y), p.side]); }
  }

  damage(e, dmg, p, kx = 0, ky = 0, raw) {
    if (e.hp <= 0) return;
    const crit = !raw && Math.random() < 0.08;
    const d = Math.round(raw ? dmg : dmg * (p ? p.dmgMul * (p.bond ? 1.2 : 1) : 1) * (crit ? 2 : 1));
    e.hp -= d; e.flash = 0.12;
    const kb = ENEMY[e.type].boss ? 0.15 : ENEMY[e.type].obj ? 0 : e.elite ? 0.35 : 1;
    e.kx += kx * kb; e.ky += ky * kb;
    this.ev.push(["hit", Math.round(e.x), Math.round(e.y - 8), Math.min(9999, d), crit ? 1 : 0]);
    if (e.hp <= 0) this.kill(e, p);
  }

  kill(e, p) {
    const B = ENEMY[e.type];
    this.ev.push(["die", Math.round(e.x), Math.round(e.y), ENEMY_ID[e.type]]);
    if (B.obj) { this.dropCrate(e); return; }
    this.kills++;
    if (p) { p.kills++; p.ult = Math.min(1, p.ult + (B.boss ? 0.5 : e.elite ? 0.25 : 1 / 55)); }
    if (e.type === "linda") { this.state = "win"; this.ev.push(["win"]); return; }
    if (e.type === "luz") { for (let i = 0; i < 16; i++) this.gems.push({ x: e.x + rnd(-24, 24), y: e.y + rnd(-24, 24), v: 5, pull: 0 }); this.pickups.push({ k: "alfajor", x: e.x - 8, y: e.y }, { k: "caja", x: e.x + 8, y: e.y }); this.bossRef = null; this.calm = 8; this.ev.push(["bossdown"]); return; }
    if (e.type === "madre") for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const k = this.spawnAt("gatito", e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8); k.kx = Math.cos(a) * 90; k.ky = Math.sin(a) * 90; }
    if (e.elite) { this.pickups.push({ k: "caja", x: e.x, y: e.y }); for (let i = 0; i < 4; i++) this.gems.push({ x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14), v: 5, pull: 0 }); return; }
    this.gems.push({ x: e.x, y: e.y, v: B.xp, pull: 0 });
    if (Math.random() < 0.01) this.pickups.push({ k: "alfajor", x: e.x + 4, y: e.y });
    if (Math.random() < 0.04) this.pickups.push({ k: "moneda", x: e.x - 4, y: e.y });
  }
  dropCrate(e) {
    const r = Math.random();
    const k = r < 0.34 ? "moneda" : r < 0.56 ? "alfajor" : r < 0.76 ? "iman" : "manguera";
    this.pickups.push({ k, x: e.x, y: e.y });
    if (k === "moneda") this.pickups.push({ k, x: e.x + 7, y: e.y + 3 });
  }

  /* ---------- armas ---------- */
  cd(p, id, base) {
    p.cds[id] = (p.cds[id] || 0) - this.dt;
    if (p.cds[id] > 0) return false;
    p.cds[id] = base * p.cdMul; return true;
  }
  targets(p, R, n) { return this.enemies.filter(e => this.foe(e) && d2(p, e) < R * R).sort((a, b) => d2(p, a) - d2(p, b)).slice(0, n); }
  weapons(p, dt) {
    this.dt = dt;
    const W = p.weapons, X = p.evo, A = p.area;
    if (W.patada && this.cd(p, "patada", (1.05 - W.patada * 0.07) * (X.patada ? 0.8 : 1))) {
      const lv = W.patada, r = (30 + lv * 3) * A * (X.patada ? 1.35 : 1), both = lv >= 3 || X.patada, dmg = (13 + lv * 6) * (X.patada ? 1.6 : 1), kb = X.patada ? 220 : 120;
      this.ev.push(["slash", Math.round(p.x), Math.round(p.y), p.face, Math.round(r), X.patada ? 2 : both ? 1 : 0]);
      this.near(p.x, p.y, r, e => { const dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy > r * r) return; if (!both && dx * p.face < -6) return; const m = Math.hypot(dx, dy) || 1; this.damage(e, dmg, p, X.patada ? dx / m * kb : Math.sign(dx || p.face) * kb, X.patada ? dy / m * kb : dy * 2); });
    }
    if (W.medialuna && this.cd(p, "medialuna", X.medialuna ? 0.75 : 0.95 - W.medialuna * 0.07)) {
      const lv = W.medialuna, dmg = 10 + lv * 4;
      if (X.medialuna) {
        const t = this.nearest(p, 190);
        const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        for (let i = 0; i < 6; i++) { const a = base + (i - 2.5) * 0.22; this.proj.push({ k: 0, x: p.x, y: p.y - 6, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: dmg * 1.2, pierce: 3, life: 1.3, own: p.side, hit: new Set() }); }
        this.ev.push(["throw", p.x, p.y]);
      } else {
        const targets = this.targets(p, 170, 1 + Math.floor(lv / 2));
        targets.forEach(t => { const a = Math.atan2(t.y - p.y, t.x - p.x); this.proj.push({ k: 0, x: p.x, y: p.y - 6, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg, pierce: lv >= 4 ? 2 : 1, life: 1.4, own: p.side, hit: new Set() }); });
        if (targets.length) this.ev.push(["throw", p.x, p.y]);
      }
    }
    if (W.juli) {
      p.orbA += dt * 3.2;
      const lv = W.juli, n = X.juli ? 4 : Math.min(3, 1 + Math.floor(lv / 2)), r = (26 + lv * 3) * A * (X.juli ? 1.2 : 1), dmg = (5 + lv * 3) * (X.juli ? 1.5 : 1);
      p.orbs = [];
      for (let i = 0; i < n; i++) {
        const a = p.orbA + i * Math.PI * 2 / n, ox = p.x + Math.cos(a) * r, oy = p.y + Math.sin(a) * r * 0.7;
        p.orbs.push([Math.round(ox), Math.round(oy)]);
        this.near(ox, oy, 10, e => { if (d2({ x: ox, y: oy }, e) > (e.r + 6) ** 2) return; if ((e.hits.juli || 0) > this.t) return; e.hits.juli = this.t + 0.35; this.damage(e, dmg, p, Math.cos(a) * 80, Math.sin(a) * 80); if (X.juli) p.hp = Math.min(p.maxHp, p.hp + 0.35); });
      }
    } else p.orbs = null;
    if (W.romero) {
      if (!p.dog) p.dog = { x: p.x, y: p.y, bite: 0 };
      const lv = W.romero, dog = p.dog, spd = (110 + lv * 12) * (X.romero ? 1.4 : 1);
      const tgt = this.nearest(dog, 140);
      const gx = tgt ? tgt.x : p.x + 16, gy = tgt ? tgt.y : p.y + 8;
      const dx = gx - dog.x, dy = gy - dog.y, m = Math.hypot(dx, dy) || 1;
      if (m > 4) { dog.x += dx / m * spd * dt; dog.y += dy / m * spd * dt; dog.face = Math.sign(dx) || 1; }
      if (Math.hypot(p.x - dog.x, p.y - dog.y) > 200) { dog.x = p.x; dog.y = p.y; }
      dog.bite -= dt;
      if (tgt && m < tgt.r + 6 && dog.bite <= 0) {
        dog.bite = (0.55 - lv * 0.04) * (X.romero ? 0.7 : 1);
        const dmg = 14 + lv * 7;
        if (X.romero) { this.near(tgt.x, tgt.y, 22, e => { if (d2(e, tgt) < 22 * 22) this.damage(e, dmg, p, dx / m * 90, dy / m * 90); }); this.ev.push(["boom", Math.round(tgt.x), Math.round(tgt.y), 14]); }
        else this.damage(tgt, dmg, p, dx / m * 60, dy / m * 60);
        this.ev.push(["bite", tgt.x, tgt.y]);
      }
    }
    if (W.mate && this.cd(p, "mate", 3.3 - W.mate * 0.3)) {
      const lv = W.mate, n = X.mate ? 2 : 1, cands = this.targets(p, 120, 2);
      for (let i = 0; i < n; i++) {
        const tgt = cands[i];
        const x = tgt ? tgt.x : p.x + rnd(-30, 30), y = tgt ? tgt.y : p.y + rnd(-30, 30);
        this.pools.push({ x, y, r: Math.round((17 + lv * 3) * A * (X.mate ? 1.4 : 1)), life: X.mate ? 4.5 : 3, tick: 0, dmg: (5 + lv * 3) * (X.mate ? 1.3 : 1), own: p.side, slow: !!X.mate });
      }
    }
    if (W.bondi && this.cd(p, "bondi", (9.5 - W.bondi * 1.2) * (X.bondi ? 0.75 : 1))) {
      const lv = W.bondi, dirs = X.bondi ? [1, -1] : [Math.random() < 0.5 ? 1 : -1];
      dirs.forEach((dir, i) => this.buses.push({ x: p.x - dir * 220, y: p.y + (X.bondi ? (i ? 20 : -20) : rnd(-18, 18)), dir, life: 1.8, dmg: (40 + lv * 20) * (X.bondi ? 1.4 : 1), own: p.side, hit: new Set(), h: 14 + lv * 2 }));
      this.ev.push(["bus", p.x, p.y]);
    }
    if (W.rodillo && this.cd(p, "rodillo", 1.7 - W.rodillo * 0.15)) {
      const lv = W.rodillo, dmg = (12 + lv * 5) * (X.rodillo ? 1.5 : 1);
      const dirs = X.rodillo ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[p.face, 0]];
      for (const [ux, uy] of dirs) this.proj.push({ k: 1, x: p.x, y: p.y - 4, vx: ux * 190 + (uy ? 0 : 0), vy: uy * 170 + (ux ? rnd(-20, 20) : 0), dmg, pierce: 999, life: 1.6, own: p.side, back: true, t: 0, hit: new Set() });
    }
    if (W.torta && this.cd(p, "torta", 2.9 - W.torta * 0.3)) {
      const lv = W.torta, cands = this.enemies.filter(e => this.foe(e) && d2(p, e) < 110 * 110);
      const tgt = cands[Math.floor(Math.random() * cands.length)];
      if (tgt) this.bombs.push({ x0: p.x, y0: p.y, x: tgt.x, y: tgt.y, t: 0, dur: 0.55, r: Math.round((24 + lv * 4) * A), dmg: 22 + lv * 10, own: p.side, cl: !!X.torta });
    }
  }

  ultimate(p) {
    p.ult = 0;
    // si los dos tiran el combo casi juntos, se potencia y los cura
    const other = Object.values(this.players).find(q => q !== p);
    const sync = other && !other.downed && this.t - other.lastUlt < 2.5;
    p.lastUlt = this.t;
    const k = sync ? 1.7 : 1;
    if (sync) { for (const q of this.alive()) q.hp = Math.min(q.maxHp, q.hp + 30); this.ev.push(["sync", Math.round((p.x + other.x) / 2), Math.round((p.y + other.y) / 2)]); }
    if (p.char === "thomas") {
      this.ev.push(["ultT", p.x, p.y]);
      const R = 75 * (sync ? 1.3 : 1);
      this.near(p.x, p.y, R, e => { const dx = e.x - p.x, dy = e.y - p.y, m = Math.hypot(dx, dy) || 1; if (m < R) this.damage(e, 90 * k, p, dx / m * 260, dy / m * 260); });
    } else {
      this.ev.push(["ultR", p.x, p.y]);
      const n = sync ? 14 : 10;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = rnd(20, 85); this.bombs.push({ x0: p.x, y0: p.y, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, t: -i * 0.05, dur: 0.5, r: 28, dmg: 55 * k, own: p.side }); }
    }
  }

  updateProjectiles(dt) {
    const byside = s => this.players[s];
    for (const b of this.proj) {
      b.life -= dt;
      if (b.back) { b.t += dt; const p = byside(b.own); if (b.t > 0.55 && p) { const dx = p.x - b.x, dy = p.y - b.y, m = Math.hypot(dx, dy) || 1; b.vx += dx / m * 900 * dt; b.vy += dy / m * 900 * dt; const sp = Math.hypot(b.vx, b.vy); if (sp > 230) { b.vx *= 230 / sp; b.vy *= 230 / sp; } if (m < 10) b.life = 0; if (!b.cleared) { b.hit.clear(); b.cleared = true; } } else { b.vx *= Math.pow(0.35, dt); b.vy *= Math.pow(0.35, dt); } }
      b.x += b.vx * dt; b.y += b.vy * dt;
      this.near(b.x, b.y, 12, e => {
        if (b.pierce <= 0 || b.hit.has(e.id)) return;
        if (d2(b, e) < (e.r + 4) ** 2) { b.hit.add(e.id); b.pierce--; this.damage(e, b.dmg, byside(b.own), b.vx * 0.4, b.vy * 0.4); }
      });
      if (b.pierce <= 0) b.life = 0;
    }
    for (const pl of this.pools) {
      pl.life -= dt; pl.tick -= dt;
      if (pl.tick <= 0) { pl.tick = 0.4; this.near(pl.x, pl.y, pl.r, e => { if (d2(pl, e) < pl.r * pl.r) { this.damage(e, pl.dmg, byside(pl.own)); if (pl.slow) e.slow = 0.6; } }); }
    }
    const extra = [];
    for (const bm of this.bombs) {
      bm.t += dt;
      if (bm.t >= bm.dur && !bm.done) {
        bm.done = true; this.ev.push(["boom", Math.round(bm.x), Math.round(bm.y), bm.r]);
        this.near(bm.x, bm.y, bm.r, e => { const dx = e.x - bm.x, dy = e.y - bm.y, m = Math.hypot(dx, dy) || 1; if (m < bm.r) this.damage(e, bm.dmg, byside(bm.own), dx / m * 150, dy / m * 150); });
        if (bm.cl) for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + rnd(0, 1); extra.push({ x0: bm.x, y0: bm.y, x: bm.x + Math.cos(a) * bm.r * 1.2, y: bm.y + Math.sin(a) * bm.r * 1.2, t: 0, dur: 0.4, r: Math.round(bm.r * 0.7), dmg: bm.dmg * 0.6, own: bm.own }); }
      }
    }
    this.bombs.push(...extra);
    for (const bus of this.buses) {
      bus.life -= dt; bus.x += bus.dir * 260 * dt;
      this.near(bus.x, bus.y, 24, e => { if (bus.hit.has(e.id)) return; if (Math.abs(e.x - bus.x) < 18 && Math.abs(e.y - bus.y) < bus.h) { bus.hit.add(e.id); this.damage(e, bus.dmg, byside(bus.own), bus.dir * 300, (e.y - bus.y) * 8); } });
    }
    for (const h of this.eproj) {
      h.life -= dt; h.x += h.vx * dt; h.y += h.vy * dt;
      for (const p of this.alive()) if (d2(h, p) < 49) { this.hurt(p, h.dmg); h.life = 0; }
    }
    for (const z of this.zones) {
      z.t += dt;
      if (z.t >= z.dur && !z.done) {
        z.done = true; this.ev.push(["zone", Math.round(z.x), Math.round(z.y), z.r]);
        for (const p of this.alive()) if (d2(p, z) < z.r * z.r) this.hurt(p, z.dmg);
      }
    }
  }

  updateGems(dt) {
    const alive = this.alive();
    for (const g of this.gems) {
      let tgt = null, bd = Infinity;
      for (const p of alive) { const d = d2(p, g); if (d < bd) { bd = d; tgt = p; } }
      if (!tgt) continue;
      if (g.pull || bd < tgt.magnet * tgt.magnet) {
        g.pull = Math.min(1, g.pull + dt * 3);
        const dx = tgt.x - g.x, dy = tgt.y - g.y, m = Math.hypot(dx, dy) || 1, sp = 60 + g.pull * 260 + (g.vac ? 200 : 0);
        g.x += dx / m * sp * dt; g.y += dy / m * sp * dt;
        if (m < 7) { g.got = true; this.gainXp(g.v); this.ev.push(["gem", tgt.side]); }
      }
    }
    for (const k of this.pickups) {
      for (const p of alive) if (d2(p, k) < 144) {
        k.got = true;
        if (k.k === "alfajor") { p.hp = Math.min(p.maxHp, p.hp + 35); this.ev.push(["heal", p.x, p.y, p.side]); }
        else if (k.k === "moneda") { this.coins += 1; this.ev.push(["coin", p.x, p.y, p.side]); }
        else if (k.k === "caja") this.openChest(p);
        else if (k.k === "iman") { for (const g of this.gems) { g.pull = 1; g.vac = true; } this.ev.push(["vacuum", Math.round(p.x), Math.round(p.y), p.side]); }
        else if (k.k === "manguera") {
          // a los gatos no les gusta el agua
          this.near(p.x, p.y, 150, e => { if (!this.foe(e)) return; const dx = e.x - p.x, dy = e.y - p.y, m = Math.hypot(dx, dy) || 1; if (m > 150) return; e.slow = 4.5; this.damage(e, 20, p, dx / m * 200, dy / m * 200); });
          this.ev.push(["splash", Math.round(p.x), Math.round(p.y), p.side]);
        }
        break;
      }
    }
  }

  // caja de Roro's: evoluciona un arma completa con su compañera, o sube un arma
  openChest(p) {
    const evo = Object.keys(p.weapons).find(w => p.weapons[w] >= WEAPONS[w].max && !p.evo[w] && p.passives[WEAPONS[w].evo.p]);
    if (evo) { p.evo[evo] = true; this.ev.push(["chest", p.side, "evo", evo, Math.round(p.x), Math.round(p.y)]); return; }
    const up = Object.keys(p.weapons).filter(w => p.weapons[w] < WEAPONS[w].max);
    if (up.length) { const w = up[Math.floor(Math.random() * up.length)]; p.weapons[w]++; this.ev.push(["chest", p.side, "up", w, Math.round(p.x), Math.round(p.y)]); return; }
    p.hp = p.maxHp; this.coins += 5; this.ev.push(["chest", p.side, "gold", "", Math.round(p.x), Math.round(p.y)]);
  }

  gainXp(v) {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext; this.level++;
      this.xpNext = Math.floor(5 + this.level * 4 + Math.pow(this.level, 1.75));
      this.pendingLevels++;
    }
    if (this.pendingLevels && this.state === "run") this.openLevelUp();
  }

  openLevelUp() {
    this.state = "levelup"; this.pendingLevels--;
    this.offers = {};
    for (const p of Object.values(this.players)) this.offers[p.side] = { opts: this.rollOffers(p), pick: null };
    this.ev.push(["levelup", this.level]);
  }
  rollOffers(p) {
    const pool = [];
    const nW = Object.keys(p.weapons).length, nP = Object.keys(p.passives).length;
    for (const [id, w] of Object.entries(WEAPONS)) { const lv = p.weapons[id] || 0; if (lv < w.max && (lv > 0 || nW < SLOTS)) pool.push({ kind: "w", id, lv: lv + 1, weight: lv ? 3 : 2 }); }
    for (const [id, w] of Object.entries(PASSIVES)) {
      const lv = p.passives[id] || 0; if (lv >= w.max || (!lv && nP >= SLOTS)) continue;
      const pair = EVO_OF[id], wants = pair && p.weapons[pair] && !p.passives[id];
      pool.push({ kind: "p", id, lv: lv + 1, weight: wants ? 2.6 : 1.5 });
    }
    const out = [];
    while (out.length < 3 && pool.length) {
      const tot = pool.reduce((a, o) => a + o.weight, 0); let r = Math.random() * tot, i = 0;
      while (r > pool[i].weight) { r -= pool[i].weight; i++; }
      out.push(pool.splice(i, 1)[0]);
    }
    if (!out.length) out.push({ kind: "heal", id: "alfajor", lv: 1 });
    return out.map(({ kind, id, lv }) => ({ kind, id, lv }));
  }
  pick(side, idx) {
    const o = this.offers[side]; if (!o || o.pick !== null) return;
    o.pick = idx;
    const p = this.players[side], c = o.opts[idx];
    if (c) {
      if (c.kind === "w") p.weapons[c.id] = c.lv;
      else if (c.kind === "p") { p.passives[c.id] = c.lv; this.applyPassive(p, c.id); }
      else p.hp = p.maxHp;
    }
    if (Object.values(this.offers).every(x => x.pick !== null)) {
      this.offers = {};
      this.state = "run";
      if (this.pendingLevels) this.openLevelUp();
    }
  }
  applyPassive(p, id) {
    if (id === "guantes") p.dmgMul += 0.15;
    if (id === "zapatillas") p.speed *= 1.08;
    if (id === "termo") p.regen += 0.45;
    if (id === "iman") p.magnet *= 1.25;
    if (id === "amargo") p.cdMul *= 0.93;
    if (id === "abrazo") { p.maxHp += 20; p.hp += 20; }
    if (id === "delantal") p.area += 0.1;
    if (id === "vendas") p.armor *= 0.93;
  }

  cleanup() {
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.proj = this.proj.filter(b => b.life > 0);
    this.pools = this.pools.filter(b => b.life > 0);
    this.bombs = this.bombs.filter(b => !b.done || b.t < b.dur + 0.05);
    this.buses = this.buses.filter(b => b.life > 0);
    this.eproj = this.eproj.filter(b => b.life > 0);
    this.zones = this.zones.filter(z => !z.done);
    this.hz = this.hz.filter(z => !z.done);
    this.gems = this.gems.filter(g => !g.got);
    this.pickups = this.pickups.filter(k => !k.got);
    if (this.gems.length > 400) { const extra = this.gems.splice(0, this.gems.length - 400); this.gainXp(extra.reduce((a, g) => a + g.v, 0)); }
  }

  /* ---------- foto del estado para dibujar (local o por red) ---------- */
  snapshot() {
    const E = [];
    for (const e of this.enemies) {
      const tele = (e.st === 1 && (e.type === "saltarin" || e.type === "escupidor" || e.type === "luz"));
      const f = (e.flash > 0 ? F_FLASH : 0) | (tele ? F_TELE : 0) | (e.elite ? F_ELITE : 0) | (e.st === 2 ? F_RUSH : 0) | (e.slow > 0 ? F_WET : 0);
      E.push(e.id, ENEMY_ID[e.type], Math.round(e.x), Math.round(e.y), f, tele || e.st === 2 ? Math.round(Math.atan2(e.ay, e.ax) * 10) : 0);
    }
    const B = []; for (const b of this.proj) B.push(b.k, Math.round(b.x), Math.round(b.y), Math.round(Math.atan2(b.vy, b.vx) * 10));
    const H = []; for (const h of this.eproj) H.push(Math.round(h.x), Math.round(h.y), h.k);
    const G = []; for (const g of this.gems) G.push(Math.round(g.x), Math.round(g.y), g.v);
    const K = this.pickups.map(k => [PICKS.indexOf(k.k), Math.round(k.x), Math.round(k.y)]);
    const U = this.pools.map(p => [Math.round(p.x), Math.round(p.y), p.r, Math.round(p.life * 10), p.slow ? 1 : 0]);
    const M = this.bombs.map(b => [Math.round(b.x0), Math.round(b.y0), Math.round(b.x), Math.round(b.y), Math.round(Math.min(1, Math.max(0, b.t / b.dur)) * 100), b.done ? 1 : 0, b.r]);
    const Bu = this.buses.map(b => [Math.round(b.x), Math.round(b.y), b.dir]);
    const Z = this.zones.map(z => [Math.round(z.x), Math.round(z.y), z.r, Math.round(z.t / z.dur * 100)]);
    const Hz = this.hz.map(z => [HAZ_ID.indexOf(z.k), Math.round(z.y), z.h, Math.round(z.x), z.dir, z.warn > 0 ? Math.round(z.warn * 10) : 0, z.len]);
    const ob = this.obj ? [Math.round(this.obj.x), Math.round(this.obj.y), Math.round(this.obj.prog * 100), Math.ceil(this.obj.left)] : null;
    const P = {};
    for (const p of Object.values(this.players)) P[p.side] = {
      c: p.char, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, f: p.face, m: p.moving, hp: Math.round(p.hp), mh: p.maxHp, d: p.downed ? 1 : 0, rv: Math.round(p.reviveT * 100) / 100, u: Math.round(p.ult * 100) / 100, i: p.inv > 0 ? 1 : 0, sp: p.speed,
      o: p.orbs || null, dg: p.dog ? [Math.round(p.dog.x), Math.round(p.dog.y), p.dog.face || 1] : null, w: p.weapons, pa: p.passives, e: p.evo, k: p.kills, dc: Math.round(p.dashCd * 10) / 10
    };
    const boss = this.bossRef && this.bossRef.hp > 0 ? { n: this.bossRef.type, hp: this.bossRef.hp / this.bossRef.maxHp } : null;
    const ev = this.ev; this.ev = [];
    return { t: Math.round(this.t * 100) / 100, st: this.state, lv: this.level, xp: this.xp, xn: this.xpNext, kl: this.kills, co: this.coins, E, B, H, G, K, U, M, Bu, Z, Hz, ob, tg: this.bond ? 1 : 0, P, boss, of: this.offers, ev, map: this.map };
  }
}
