// Simulación de "Gatos de Linda". La corre solo el anfitrión; el invitado recibe fotos del estado.
export const MAP = 1024;          // el mundo mide 1024 x 1024 px (baja resolución)
export const RUN_BOSS1 = 210;     // Luz aparece a los 3:30
export const RUN_BOSS2 = 420;     // Linda aparece a los 7:00

export const ENEMY = {
  gato:   { hp: 10, spd: 30, dmg: 6,  r: 6,  xp: 1 },
  negro:  { hp: 20, spd: 38, dmg: 8,  r: 6,  xp: 2 },
  paloma: { hp: 6,  spd: 70, dmg: 5,  r: 5,  xp: 1 },
  gordo:  { hp: 55, spd: 21, dmg: 12, r: 9,  xp: 5 },
  luz:    { hp: 900, spd: 28, dmg: 16, r: 13, xp: 40, boss: true },
  linda:  { hp: 3200, spd: 25, dmg: 20, r: 17, xp: 0, boss: true }
};
export const ENEMY_ID = { gato: 0, negro: 1, paloma: 2, gordo: 3, luz: 4, linda: 5 };
export const ENEMY_NAME = Object.keys(ENEMY_ID);

export const WEAPONS = {
  patada:    { name: "Patada Bielli", desc: "Patada en arco hacia donde mirás. Nivel 3: a los dos lados.", max: 5 },
  medialuna: { name: "Medialunas", desc: "Tira medialunas al gato más cercano.", max: 5 },
  juli:      { name: "Juli", desc: "Juli gira a tu alrededor y araña lo que toca.", max: 5 },
  romero:    { name: "Romero", desc: "Romero sale corriendo a morder gatos.", max: 5 },
  mate:      { name: "Mate hirviendo", desc: "Charcos de mate que queman lo que pisa.", max: 5 },
  bondi:     { name: "El 315", desc: "Pasa el colectivo y se lleva puesto todo.", max: 5 },
  rodillo:   { name: "Palo de amasar", desc: "Va y vuelve, atraviesa a todos.", max: 5 },
  torta:     { name: "Torta bomba", desc: "Una torta que explota al caer.", max: 5 }
};
export const PASSIVES = {
  guantes:    { name: "Guantes de box", desc: "+15% de daño.", max: 5 },
  zapatillas: { name: "Zapatillas", desc: "+8% de velocidad.", max: 5 },
  termo:      { name: "Termo", desc: "Recuperás vida de a poco.", max: 5 },
  iman:       { name: "Imán", desc: "Juntás la experiencia desde más lejos.", max: 5 },
  amargo:     { name: "Mate amargo", desc: "Las armas se recargan 7% más rápido.", max: 5 },
  abrazo:     { name: "Abrazo", desc: "+20 de vida máxima.", max: 5 }
};

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export class Sim {
  constructor(map = "plaza") {
    this.map = map;
    this.t = 0; this.state = "run";
    this.players = {}; this.enemies = []; this.proj = []; this.eproj = []; this.gems = []; this.pools = []; this.bombs = []; this.buses = []; this.pickups = [];
    this.nextId = 1; this.level = 1; this.xp = 0; this.xpNext = 5; this.kills = 0; this.coins = 0;
    this.offers = {}; this.pendingLevels = 0;
    this.ev = []; this.spawnAcc = 0; this.boss1 = false; this.boss2 = false; this.bossRef = null;
    this.hordes = [150, 330];
    this.grid = new Map();
  }

  addPlayer(side, char, meta = {}) {
    const m = { hp: 0, dmg: 0, spd: 0, mag: 0, ...meta };
    const p = {
      side, char, x: MAP / 2 + (side === "host" ? -14 : 14), y: MAP / 2 + 40, face: 1, moving: 0,
      maxHp: 100 + m.hp * 10, hp: 100 + m.hp * 10, speed: 62 * (1 + m.spd * 0.05), dmgMul: 1 + m.dmg * 0.08, cdMul: 1, magnet: 26 * (1 + m.mag * 0.15), regen: 0,
      weapons: { [char === "thomas" ? "patada" : "medialuna"]: 1 }, passives: {}, cds: {}, inv: 0, downed: false, reviveT: 0, ult: 0, kills: 0,
      dog: null, orbA: 0, boomer: []
    };
    this.players[side] = p;
    return p;
  }

  alive() { return Object.values(this.players).filter(p => !p.downed); }

  /* ---------- paso de simulación ---------- */
  step(dt, input) {
    if (this.state !== "run") return;
    this.t += dt;
    const ps = Object.values(this.players);
    // movimiento: el anfitrión se mueve con su joystick; el invitado manda su posición
    for (const p of ps) {
      const inp = input[p.side] || {};
      if (p.downed) { p.moving = 0; continue; }
      if (inp.pos) { p.x = clamp(inp.pos.x, 12, MAP - 12); p.y = clamp(inp.pos.y, 12, MAP - 12); p.face = inp.face || p.face; p.moving = inp.moving ? 1 : 0; }
      else if (inp.dir) {
        const { x, y } = inp.dir; const m = Math.hypot(x, y);
        p.moving = m > 0.1 ? 1 : 0;
        if (m > 0.1) { p.x = clamp(p.x + x * p.speed * dt, 12, MAP - 12); p.y = clamp(p.y + y * p.speed * dt, 12, MAP - 12); if (Math.abs(x) > 0.15) p.face = Math.sign(x); }
      }
      if (inp.ult && p.ult >= 1) this.ultimate(p);
      p.inv = Math.max(0, p.inv - dt);
      if (p.regen) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    }
    this.revive(dt);
    this.spawn(dt);
    this.buildGrid();
    this.moveEnemies(dt);
    for (const p of ps) if (!p.downed) this.weapons(p, dt);
    this.updateProjectiles(dt);
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
    const b = ENEMY[type];
    const scale = 1 + this.t / 170;
    const solo = Object.keys(this.players).length === 1 ? 0.7 : 1;
    const hp = b.boss ? b.hp * solo : b.hp * scale * hpMul;
    const e = { id: this.nextId++, type, x: clamp(x, 4, MAP - 4), y: clamp(y, 4, MAP - 4), hp, maxHp: hp, spd: b.spd * (b.boss ? 1 : 1 + this.t / 900), dmg: b.dmg, r: b.r, flash: 0, kx: 0, ky: 0, ph: Math.random() * 9, cd: 2, charge: 0, hits: {} };
    this.enemies.push(e);
    return e;
  }
  ringPos(dist) {
    const ps = this.alive(); const p = ps[Math.floor(Math.random() * ps.length)] || Object.values(this.players)[0];
    const a = Math.random() * Math.PI * 2;
    return { x: p.x + Math.cos(a) * dist, y: p.y + Math.sin(a) * dist, p };
  }
  spawn(dt) {
    const t = this.t;
    if (!this.boss1 && t >= RUN_BOSS1) { this.boss1 = true; const q = this.ringPos(150); this.bossRef = this.spawnAt("luz", q.x, q.y); this.ev.push(["boss", "luz"]); }
    if (!this.boss2 && t >= RUN_BOSS2) { this.boss2 = true; const q = this.ringPos(160); this.bossRef = this.spawnAt("linda", q.x, q.y); this.ev.push(["boss", "linda"]); }
    if (this.hordes.length && t >= this.hordes[0]) {
      this.hordes.shift(); this.ev.push(["horde"]);
      const ps = this.alive(); const p = ps[0] || Object.values(this.players)[0];
      for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; this.spawnAt(t > 300 ? "negro" : "gato", p.x + Math.cos(a) * 150, p.y + Math.sin(a) * 150); }
    }
    // bandada de palomas que cruza
    if (t > 50 && Math.floor(t / 42) !== Math.floor((t - dt) / 42)) {
      const q = this.ringPos(170); const dx = q.p.x - q.x, dy = q.p.y - q.y, m = Math.hypot(dx, dy);
      for (let i = 0; i < 12; i++) { const e = this.spawnAt("paloma", q.x + rnd(-20, 20), q.y + rnd(-20, 20)); e.vx = dx / m; e.vy = dy / m; }
    }
    if (this.enemies.length >= 230) return;
    const rate = Math.min(8, 0.8 + t / 38);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const r = Math.random();
      let type = "gato";
      if (t > 100 && r < 0.3) type = "negro";
      if (t > 170 && r < 0.12) type = "gordo";
      if (t > 300 && r < 0.45) type = r < 0.2 ? "gordo" : "negro";
      const q = this.ringPos(rnd(140, 180));
      this.spawnAt(type, q.x, q.y);
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
  nearest(p, maxR = 200) {
    let best = null, bd = maxR * maxR;
    for (const e of this.enemies) { if (e.hp <= 0) continue; const d = d2(p, e); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  moveEnemies(dt) {
    const alive = this.alive();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - dt);
      let tgt = null, bd = Infinity;
      for (const p of alive) { const d = d2(p, e); if (d < bd) { bd = d; tgt = p; } }
      if (!tgt) continue;
      let dx = tgt.x - e.x, dy = tgt.y - e.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      let spd = e.spd;
      if (e.type === "paloma" && e.vx !== undefined) { dx = e.vx; dy = e.vy + Math.sin(this.t * 6 + e.ph) * 0.4; }
      if (e.type === "luz") {
        e.cd -= dt;
        if (e.charge > 0) { e.charge -= dt; spd *= 4.2; dx = e.cx; dy = e.cy; }
        else if (e.cd <= 0) { e.cd = 3.2; e.charge = 0.7; e.cx = dx; e.cy = dy; this.ev.push(["charge", e.x, e.y]); }
      }
      if (e.type === "linda") {
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = 2.4;
          for (let i = -1; i <= 1; i++) { const a = Math.atan2(dy, dx) + i * 0.3; this.eproj.push({ x: e.x, y: e.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 3.5, dmg: 12 }); }
          this.ev.push(["hairball", e.x, e.y]);
          if (Math.random() < 0.45) { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; this.spawnAt("negro", e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30); } this.ev.push(["summon", e.x, e.y]); }
        }
      }
      // separación entre gatos para que no se amontonen en un punto
      let sx = 0, sy = 0;
      this.near(e.x, e.y, 12, o => { if (o === e) return; const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy; const rr = (e.r + o.r) * 0.8; if (dd < rr * rr && dd > 0.01) { const k = (rr - Math.sqrt(dd)) / rr; sx += ox * k; sy += oy * k; } });
      e.x += (dx * spd + e.kx + sx * 6) * dt; e.y += (dy * spd + e.ky + sy * 6) * dt;
      e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (e.type === "paloma" && (e.x < -20 || e.x > MAP + 20 || e.y < -20 || e.y > MAP + 20)) e.hp = 0, e.gone = true;
      // contacto con jugadores
      for (const p of alive) {
        const rr = e.r + 5;
        if (p.inv <= 0 && d2(p, e) < rr * rr) this.hurt(p, e.dmg);
      }
    }
  }

  hurt(p, dmg) {
    if (p.downed || p.inv > 0) return;
    p.hp -= dmg; p.inv = 0.6;
    this.ev.push(["hurt", p.x, p.y, p.side]);
    if (p.hp <= 0) { p.hp = 0; p.downed = true; p.reviveT = 0; this.ev.push(["down", p.x, p.y, p.side]); }
  }

  damage(e, dmg, p, kx = 0, ky = 0) {
    if (e.hp <= 0) return;
    const crit = Math.random() < 0.08;
    const d = Math.round(dmg * (p ? p.dmgMul : 1) * (crit ? 2 : 1));
    e.hp -= d; e.flash = 0.12;
    const kb = ENEMY[e.type].boss ? 0.15 : 1;
    e.kx += kx * kb; e.ky += ky * kb;
    this.ev.push(["hit", Math.round(e.x), Math.round(e.y - 8), d, crit ? 1 : 0]);
    if (e.hp <= 0) this.kill(e, p);
  }

  kill(e, p) {
    this.kills++;
    if (p) { p.kills++; p.ult = Math.min(1, p.ult + (ENEMY[e.type].boss ? 0.5 : 1 / 55)); }
    this.ev.push(["die", Math.round(e.x), Math.round(e.y), ENEMY_ID[e.type]]);
    const xp = ENEMY[e.type].xp;
    if (e.type === "linda") { this.state = "win"; this.ev.push(["win"]); return; }
    if (e.type === "luz") { for (let i = 0; i < 16; i++) this.gems.push({ x: e.x + rnd(-24, 24), y: e.y + rnd(-24, 24), v: 5, pull: 0 }); this.pickups.push({ k: "alfajor", x: e.x, y: e.y }); this.bossRef = null; this.ev.push(["bossdown"]); return; }
    this.gems.push({ x: e.x, y: e.y, v: xp, pull: 0 });
    if (Math.random() < 0.012) this.pickups.push({ k: "alfajor", x: e.x + 4, y: e.y });
    if (Math.random() < 0.05) this.pickups.push({ k: "moneda", x: e.x - 4, y: e.y });
  }

  /* ---------- armas ---------- */
  cd(p, id, base) {
    p.cds[id] = (p.cds[id] || 0) - this.dt;
    if (p.cds[id] > 0) return false;
    p.cds[id] = base * p.cdMul; return true;
  }
  weapons(p, dt) {
    this.dt = dt;
    const W = p.weapons;
    if (W.patada && this.cd(p, "patada", 1.05 - W.patada * 0.07)) {
      const lv = W.patada, r = 30 + lv * 3, both = lv >= 3;
      this.ev.push(["slash", Math.round(p.x), Math.round(p.y), p.face, r, both ? 1 : 0]);
      this.near(p.x, p.y, r, e => { const dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy > r * r) return; if (!both && dx * p.face < -6) return; this.damage(e, 13 + lv * 6, p, Math.sign(dx || p.face) * 120, dy * 2); });
    }
    if (W.medialuna && this.cd(p, "medialuna", 0.95 - W.medialuna * 0.07)) {
      const n = 1 + Math.floor(W.medialuna / 2);
      const targets = this.enemies.filter(e => e.hp > 0 && d2(p, e) < 170 * 170).sort((a, b) => d2(p, a) - d2(p, b)).slice(0, n);
      targets.forEach(t => { const a = Math.atan2(t.y - p.y, t.x - p.x); this.proj.push({ k: 0, x: p.x, y: p.y - 6, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg: 10 + W.medialuna * 4, pierce: W.medialuna >= 4 ? 2 : 1, life: 1.4, own: p.side, hit: new Set() }); });
      if (targets.length) this.ev.push(["throw", p.x, p.y]);
    }
    if (W.juli) {
      p.orbA += dt * 3.2;
      const n = Math.min(3, 1 + Math.floor(W.juli / 2)), r = 26 + W.juli * 3;
      p.orbs = [];
      for (let i = 0; i < n; i++) {
        const a = p.orbA + i * Math.PI * 2 / n, ox = p.x + Math.cos(a) * r, oy = p.y + Math.sin(a) * r * 0.7;
        p.orbs.push([Math.round(ox), Math.round(oy)]);
        this.near(ox, oy, 10, e => { if (d2({ x: ox, y: oy }, e) > (e.r + 6) ** 2) return; if ((e.hits.juli || 0) > this.t) return; e.hits.juli = this.t + 0.35; this.damage(e, 5 + W.juli * 3, p, Math.cos(a) * 80, Math.sin(a) * 80); });
      }
    } else p.orbs = null;
    if (W.romero) {
      if (!p.dog) p.dog = { x: p.x, y: p.y, bite: 0 };
      const dog = p.dog, spd = 110 + W.romero * 12;
      const tgt = this.nearest(dog, 140);
      const gx = tgt ? tgt.x : p.x + 16, gy = tgt ? tgt.y : p.y + 8;
      const dx = gx - dog.x, dy = gy - dog.y, m = Math.hypot(dx, dy) || 1;
      if (m > 4) { dog.x += dx / m * spd * dt; dog.y += dy / m * spd * dt; dog.face = Math.sign(dx) || 1; }
      if (Math.hypot(p.x - dog.x, p.y - dog.y) > 200) { dog.x = p.x; dog.y = p.y; }
      dog.bite -= dt;
      if (tgt && m < tgt.r + 6 && dog.bite <= 0) { dog.bite = 0.55 - W.romero * 0.04; this.damage(tgt, 14 + W.romero * 7, p, dx / m * 60, dy / m * 60); this.ev.push(["bite", tgt.x, tgt.y]); }
    }
    if (W.mate && this.cd(p, "mate", 3.3 - W.mate * 0.3)) {
      const tgt = this.nearest(p, 110);
      const x = tgt ? tgt.x : p.x + rnd(-30, 30), y = tgt ? tgt.y : p.y + rnd(-30, 30);
      this.pools.push({ x, y, r: 17 + W.mate * 3, life: 3, tick: 0, dmg: 5 + W.mate * 3, own: p.side });
    }
    if (W.bondi && this.cd(p, "bondi", 9.5 - W.bondi * 1.2)) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.buses.push({ x: p.x - dir * 220, y: p.y + rnd(-18, 18), dir, life: 1.8, dmg: 40 + W.bondi * 20, own: p.side, hit: new Set(), h: 14 + W.bondi * 2 });
      this.ev.push(["bus", p.x, p.y]);
    }
    if (W.rodillo && this.cd(p, "rodillo", 1.7 - W.rodillo * 0.15)) {
      this.proj.push({ k: 1, x: p.x, y: p.y - 4, vx: p.face * 190, vy: rnd(-20, 20), dmg: 12 + W.rodillo * 5, pierce: 999, life: 1.6, own: p.side, back: true, t: 0, hit: new Set() });
    }
    if (W.torta && this.cd(p, "torta", 2.9 - W.torta * 0.3)) {
      const cands = this.enemies.filter(e => e.hp > 0 && d2(p, e) < 110 * 110);
      const tgt = cands[Math.floor(Math.random() * cands.length)];
      if (tgt) this.bombs.push({ x0: p.x, y0: p.y, x: tgt.x, y: tgt.y, t: 0, dur: 0.55, r: 24 + W.torta * 4, dmg: 22 + W.torta * 10, own: p.side });
    }
  }

  ultimate(p) {
    p.ult = 0;
    if (p.char === "thomas") {
      this.ev.push(["ultT", p.x, p.y]);
      this.near(p.x, p.y, 75, e => { const dx = e.x - p.x, dy = e.y - p.y, m = Math.hypot(dx, dy) || 1; if (m < 75) this.damage(e, 90, p, dx / m * 260, dy / m * 260); });
    } else {
      this.ev.push(["ultR", p.x, p.y]);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = rnd(20, 80); this.bombs.push({ x0: p.x, y0: p.y, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, t: -i * 0.06, dur: 0.5, r: 28, dmg: 55, own: p.side }); }
    }
  }

  updateProjectiles(dt) {
    const byside = s => this.players[s];
    for (const b of this.proj) {
      b.life -= dt;
      if (b.back) { b.t += dt; const p = byside(b.own); if (b.t > 0.55 && p) { const dx = p.x - b.x, dy = p.y - b.y, m = Math.hypot(dx, dy) || 1; b.vx += dx / m * 900 * dt; b.vy += dy / m * 900 * dt; const sp = Math.hypot(b.vx, b.vy); if (sp > 230) { b.vx *= 230 / sp; b.vy *= 230 / sp; } if (m < 10) b.life = 0; if (b.t > 0.55 && !b.cleared) { b.hit.clear(); b.cleared = true; } } else b.vx *= Math.pow(0.35, dt); }
      b.x += b.vx * dt; b.y += b.vy * dt;
      this.near(b.x, b.y, 12, e => {
        if (b.pierce <= 0 || b.hit.has(e.id)) return;
        if (d2(b, e) < (e.r + 4) ** 2) { b.hit.add(e.id); b.pierce--; this.damage(e, b.dmg, byside(b.own), b.vx * 0.4, b.vy * 0.4); }
      });
      if (b.pierce <= 0) b.life = 0;
    }
    for (const pl of this.pools) {
      pl.life -= dt; pl.tick -= dt;
      if (pl.tick <= 0) { pl.tick = 0.4; this.near(pl.x, pl.y, pl.r, e => { if (d2(pl, e) < pl.r * pl.r) this.damage(e, pl.dmg, byside(pl.own)); }); }
    }
    for (const bm of this.bombs) {
      bm.t += dt;
      if (bm.t >= bm.dur && !bm.done) {
        bm.done = true; this.ev.push(["boom", Math.round(bm.x), Math.round(bm.y), bm.r]);
        this.near(bm.x, bm.y, bm.r, e => { const dx = e.x - bm.x, dy = e.y - bm.y, m = Math.hypot(dx, dy) || 1; if (m < bm.r) this.damage(e, bm.dmg, byside(bm.own), dx / m * 150, dy / m * 150); });
      }
    }
    for (const bus of this.buses) {
      bus.life -= dt; bus.x += bus.dir * 260 * dt;
      this.near(bus.x, bus.y, 24, e => { if (bus.hit.has(e.id)) return; if (Math.abs(e.x - bus.x) < 18 && Math.abs(e.y - bus.y) < bus.h) { bus.hit.add(e.id); this.damage(e, bus.dmg, byside(bus.own), bus.dir * 300, (e.y - bus.y) * 8); } });
    }
    for (const h of this.eproj) {
      h.life -= dt; h.x += h.vx * dt; h.y += h.vy * dt;
      for (const p of this.alive()) if (d2(h, p) < 64) { this.hurt(p, h.dmg); h.life = 0; }
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
        const dx = tgt.x - g.x, dy = tgt.y - g.y, m = Math.hypot(dx, dy) || 1, sp = 60 + g.pull * 260;
        g.x += dx / m * sp * dt; g.y += dy / m * sp * dt;
        if (m < 7) { g.got = true; this.gainXp(g.v); this.ev.push(["gem", tgt.side]); }
      }
    }
    for (const k of this.pickups) {
      for (const p of alive) if (d2(p, k) < 144) {
        k.got = true;
        if (k.k === "alfajor") { p.hp = Math.min(p.maxHp, p.hp + 35); this.ev.push(["heal", p.x, p.y, p.side]); }
        else { this.coins += 1; this.ev.push(["coin", p.x, p.y, p.side]); }
        break;
      }
    }
  }

  gainXp(v) {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext; this.level++;
      this.xpNext = Math.floor(4 + this.level * 3 + Math.pow(this.level, 1.5));
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
    const nW = Object.keys(p.weapons).length;
    for (const [id, w] of Object.entries(WEAPONS)) { const lv = p.weapons[id] || 0; if (lv < w.max && (lv > 0 || nW < 5)) pool.push({ kind: "w", id, lv: lv + 1, weight: lv ? 3 : 2 }); }
    for (const [id, w] of Object.entries(PASSIVES)) { const lv = p.passives[id] || 0; if (lv < w.max) pool.push({ kind: "p", id, lv: lv + 1, weight: 1.6 }); }
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
  }

  cleanup() {
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.proj = this.proj.filter(b => b.life > 0);
    this.pools = this.pools.filter(b => b.life > 0);
    this.bombs = this.bombs.filter(b => !b.done || b.t < b.dur + 0.05);
    this.buses = this.buses.filter(b => b.life > 0);
    this.eproj = this.eproj.filter(b => b.life > 0);
    this.gems = this.gems.filter(g => !g.got);
    this.pickups = this.pickups.filter(k => !k.got);
    if (this.gems.length > 400) { const extra = this.gems.splice(0, this.gems.length - 400); this.gainXp(extra.reduce((a, g) => a + g.v, 0)); }
  }

  /* ---------- foto del estado para dibujar (local o por red) ---------- */
  snapshot() {
    const E = []; for (const e of this.enemies) E.push(e.id, ENEMY_ID[e.type], Math.round(e.x), Math.round(e.y), e.flash > 0 ? 1 : 0, e.type === "luz" && e.charge > 0 ? 1 : 0);
    const B = []; for (const b of this.proj) B.push(b.k, Math.round(b.x), Math.round(b.y), Math.round(Math.atan2(b.vy, b.vx) * 10));
    const H = []; for (const h of this.eproj) H.push(Math.round(h.x), Math.round(h.y));
    const G = []; for (const g of this.gems) G.push(Math.round(g.x), Math.round(g.y), g.v);
    const K = this.pickups.map(k => [k.k === "alfajor" ? 0 : 1, Math.round(k.x), Math.round(k.y)]);
    const U = this.pools.map(p => [Math.round(p.x), Math.round(p.y), p.r, Math.round(p.life * 10)]);
    const M = this.bombs.map(b => [Math.round(b.x0), Math.round(b.y0), Math.round(b.x), Math.round(b.y), Math.round(Math.min(1, Math.max(0, b.t / b.dur)) * 100), b.done ? 1 : 0, b.r]);
    const Bu = this.buses.map(b => [Math.round(b.x), Math.round(b.y), b.dir]);
    const P = {};
    for (const p of Object.values(this.players)) P[p.side] = {
      c: p.char, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, f: p.face, m: p.moving, hp: Math.round(p.hp), mh: p.maxHp, d: p.downed ? 1 : 0, rv: Math.round(p.reviveT * 100) / 100, u: Math.round(p.ult * 100) / 100, i: p.inv > 0 ? 1 : 0, sp: p.speed,
      o: p.orbs || null, dg: p.dog ? [Math.round(p.dog.x), Math.round(p.dog.y), p.dog.face || 1] : null, w: p.weapons, pa: p.passives, k: p.kills
    };
    const boss = this.bossRef && this.bossRef.hp > 0 ? { n: this.bossRef.type, hp: this.bossRef.hp / this.bossRef.maxHp } : null;
    const ev = this.ev; this.ev = [];
    return { t: Math.round(this.t * 100) / 100, st: this.state, lv: this.level, xp: this.xp, xn: this.xpNext, kl: this.kills, co: this.coins, E, B, H, G, K, U, M, Bu, P, boss, of: this.offers, ev, map: this.map };
  }
}
