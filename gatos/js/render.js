// Render 2D pixel art: mapa pregenerado, entidades ordenadas por altura, luces nocturnas y efectos.
import { SPR } from "./sprites.js";
import { MAP, ENEMY_NAME, HAZ_ID, PICKS, F_FLASH, F_TELE, F_ELITE, F_RUSH, F_WET } from "./engine.js";
import { THEMES, buildMap } from "./maps.js";
export { THEMES };

/* ---------- números en pixel ---------- */
const DIG = ["111101101101111", "010110010010111", "111001111100111", "111001111001111", "101101111001001", "111100111001111", "111100111101111", "111001010010010", "111101111101111", "111101111001111"];
function drawNum(g, n, x, y, col) {
  const s = String(n);
  const w = s.length * 4 - 1;
  let ox = Math.round(x - w / 2);
  for (const ch of s) {
    const bits = DIG[+ch]; if (!bits) { ox += 4; continue; }
    for (let i = 0; i < 15; i++) if (bits[i] === "1") { const px = ox + (i % 3), py = Math.round(y) + Math.floor(i / 3); g.fillStyle = "#16121c"; g.fillRect(px + 1, py + 1, 1, 1); g.fillStyle = col; g.fillRect(px, py, 1, 1); }
    ox += 4;
  }
}

const FUR = { 0: "#8d8f98", 1: "#2b2833", 2: "#8f96a3", 3: "#e08a3a", 4: "#8d8170", 5: "#8a7a66", 6: "#e0822e", 7: "#efe0c4", 8: "#f4f1ea", 9: "#b7b9c2", 10: "#b07a42" };
const PICK_SPR = { alfajor: "alfajor", moneda: "moneda", caja: "regalo", iman: "iman", manguera: "manguera" };

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.buf = document.createElement("canvas"); this.bg = this.buf.getContext("2d");
    this.lc = document.createElement("canvas"); this.lg = this.lc.getContext("2d");
    this.parts = []; this.nums = []; this.slashes = []; this.rings = [];
    this.cam = { x: MAP / 2, y: MAP / 2 }; this.shake = 0; this.t = 0;
    this.resize();
    addEventListener("resize", () => this.resize());
  }
  resize() {
    const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    this.s = Math.max(2, Math.round(Math.min(W, H) / 230));
    this.bw = Math.ceil(W / this.s); this.bh = Math.ceil(H / this.s);
    this.buf.width = this.bw; this.buf.height = this.bh; this.lc.width = this.bw; this.lc.height = this.bh;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    this.cv.style.width = W + "px"; this.cv.style.height = H + "px";
    this.bg.imageSmoothingEnabled = false;
  }
  setMap(theme) { this.theme = theme; this.map = buildMap(theme); }

  /* efectos a partir de los eventos de la simulación */
  events(ev, localSide) {
    const snd = [];
    for (const e of ev) {
      const k = e[0];
      if (k === "hit") { this.nums.push({ x: e[1], y: e[2], n: e[3], c: e[4] ? "#ffd24a" : "#ffffff", life: 0.6, big: e[4] }); for (let i = 0; i < 3; i++) this.part(e[1], e[2] + 6, "#ffffff", 40, 0.2); snd.push("hit"); }
      if (k === "die") { const col = FUR[e[3]] || "#888"; for (let i = 0; i < 10; i++) this.part(e[1], e[2], col, 70, 0.45); this.part(e[1], e[2], "#ffffff", 20, 0.3); snd.push("die"); }
      if (k === "slash") this.slashes.push({ x: e[1], y: e[2], f: e[3], r: e[4], both: e[5], life: 0.16 });
      if (k === "boom") { this.rings.push({ x: e[1], y: e[2], r: e[3], life: 0.3, c: "#ffb04a" }); for (let i = 0; i < 16; i++) this.part(e[1], e[2], i % 2 ? "#ffcf5a" : "#ff6a3a", 110, 0.5); this.shake = Math.max(this.shake, 2); snd.push("boom"); }
      if (k === "ultT" || k === "ultR") { this.rings.push({ x: e[1], y: e[2], r: 80, life: 0.45, c: k === "ultT" ? "#ffffff" : "#ff8ad8" }); this.shake = 5; snd.push("ult"); }
      if (k === "hurt") { if (e[3] === localSide) { this.shake = Math.max(this.shake, 3); this.hurtFlash = 0.25; } snd.push(e[3] === localSide ? "hurt" : ""); }
      if (k === "down") { for (let i = 0; i < 20; i++) this.part(e[1], e[2], "#ff4a5a", 60, 0.8); snd.push("down"); }
      if (k === "revive") { for (let i = 0; i < 18; i++) this.part(e[1], e[2], "#ff8ad8", 50, 0.9); snd.push("revive"); }
      if (k === "heal") { for (let i = 0; i < 10; i++) this.part(e[1], e[2], "#6aff9a", 40, 0.7); snd.push("heal"); }
      if (k === "coin") snd.push("coin");
      if (k === "gem") snd.push(e[1] === localSide ? "gem" : "");
      if (k === "bite") this.part(e[1], e[2], "#ffffff", 30, 0.2);
      if (k === "charge") this.rings.push({ x: e[1], y: e[2], r: 30, life: 0.3, c: "#ff5a3a" });
      if (k === "dash") { for (let i = 0; i < 8; i++) this.part(e[1], e[2], "#d8d2c4", 40, 0.35); snd.push(e[3] === localSide ? "dash" : ""); }
      if (k === "elite") { this.rings.push({ x: e[1], y: e[2], r: 50, life: 0.45, c: "#ffd24a" }); snd.push("elite"); }
      if (k === "spit") snd.push("spit");
      if (k === "zones") snd.push("zones");
      if (k === "zone") { this.rings.push({ x: e[1], y: e[2], r: e[3] * 1.4, life: 0.35, c: "#ff4a5a" }); for (let i = 0; i < 12; i++) this.part(e[1], e[2], i % 2 ? "#ff4a5a" : "#8a7a66", 90, 0.5); this.shake = Math.max(this.shake, 2); snd.push("boom"); }
      if (k === "phase") { this.rings.push({ x: e[2], y: e[3], r: 120, life: 0.45, c: "#b36aff" }); this.shake = 6; snd.push("phase"); }
      if (k === "chest") { for (let i = 0; i < 26; i++) this.part(e[4], e[5], ["#ffd24a", "#ff8ac2", "#ffffff"][i % 3], 90, 0.9); this.rings.push({ x: e[4], y: e[5], r: 50, life: 0.45, c: e[2] === "evo" ? "#ff5fd2" : "#ffd24a" }); snd.push(e[2] === "evo" ? "evo" : "chest"); }
      if (k === "vacuum") { this.rings.push({ x: e[1], y: e[2], r: 120, life: 0.45, c: "#7ff0ff" }); snd.push("vacuum"); }
      if (k === "splash") { this.rings.push({ x: e[1], y: e[2], r: 150, life: 0.45, c: "#7fd0ff" }); for (let i = 0; i < 40; i++) this.part(e[1] + Math.cos(i) * 60, e[2] + Math.sin(i) * 40, i % 2 ? "#7fd0ff" : "#ffffff", 60, 0.7); snd.push("splash"); }
      if (k === "sync") { this.rings.push({ x: e[1], y: e[2], r: 130, life: 0.45, c: "#ff5fb0" }, { x: e[1], y: e[2], r: 80, life: 0.45, c: "#ffffff" }); for (let i = 0; i < 20; i++) this.part(e[1], e[2], "#ff5fb0", 80, 1); this.shake = 6; snd.push("sync"); }
      if (k === "warn") snd.push(e[1] === "tren" ? "horn" : "warn");
      if (k === "pass") { this.shake = Math.max(this.shake, e[1] === "tren" ? 4 : 1); snd.push(e[1] === "tren" ? "train" : "whoosh"); }
      if (k === "obj") snd.push(["objfail", "objok", "obj"][e[1]]);
      if (k === "summon") this.rings.push({ x: e[1], y: e[2], r: 40, life: 0.5, c: "#b36aff" });
      if (["bus", "boss", "horde", "levelup", "throw", "hairball", "bossdown", "win", "over"].includes(k)) snd.push(k === "boss" ? "boss:" + e[1] : k);
    }
    return snd;
  }
  part(x, y, c, sp, life) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, c, life, max: life }); }

  frame(V, dt) {
    this.t += dt;
    const g = this.bg, bw = this.bw, bh = this.bh;
    const me = V.players[V.local] || Object.values(V.players)[0];
    if (me) { this.cam.x += (me.x - this.cam.x) * Math.min(1, dt * 8); this.cam.y += (me.y - 8 - this.cam.y) * Math.min(1, dt * 8); }
    this.shake = Math.max(0, this.shake - dt * 14);
    let cx = Math.round(Math.max(bw / 2, Math.min(MAP - bw / 2, this.cam.x)) - bw / 2 + (Math.random() - 0.5) * this.shake);
    let cy = Math.round(Math.max(bh / 2, Math.min(MAP - bh / 2, this.cam.y)) - bh / 2 + (Math.random() - 0.5) * this.shake);
    const vis = (x, y, m = 40) => x > cx - m && x < cx + bw + m && y > cy - m && y < cy + bh + m;
    g.fillStyle = "#101018"; g.fillRect(0, 0, bw, bh);
    g.drawImage(this.map.canvas, cx, cy, bw, bh, 0, 0, bw, bh);
    const X = x => Math.round(x - cx), Y = y => Math.round(y - cy);

    // charcos de mate
    for (const [x, y, r, life, big] of V.pools) { if (!vis(x, y)) continue; g.fillStyle = big ? "rgba(140,170,40,.8)" : "rgba(92,122,40,.75)"; g.beginPath(); g.ellipse(X(x), Y(y), r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#b8d86a"; for (let i = 0; i < 4; i++) { const a = this.t * 2 + i * 1.7; g.fillRect(X(x + Math.cos(a) * r * 0.5), Y(y + Math.sin(a * 1.3) * r * 0.3), 1, 1); } }
    // gemas y objetos
    for (let i = 0; i < V.gems.length; i += 3) { const x = V.gems[i], y = V.gems[i + 1], v = V.gems[i + 2]; if (!vis(x, y, 8)) continue; const s = SPR[v >= 5 ? "gem5" : v >= 2 ? "gem2" : "gem1"]; g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h + Math.round(Math.sin(this.t * 5 + x) * 1)); }
    for (const [k, x, y] of V.pickups) {
      if (!vis(x, y)) continue; const s = SPR[PICK_SPR[PICKS[k]]] || SPR.moneda, bob = Math.round(Math.abs(Math.sin(this.t * 4)) * 2);
      if (k >= 2) { g.fillStyle = k === 2 ? "rgba(255,138,194,.35)" : "rgba(127,240,255,.3)"; g.beginPath(); g.ellipse(X(x), Y(y), 9 + Math.sin(this.t * 6), 4, 0, 0, Math.PI * 2); g.fill(); }
      g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h - bob);
    }
    // zonas donde va a caer algo (Linda)
    for (const [x, y, r, pct] of V.zones) {
      if (!vis(x, y)) continue; const k = pct / 100;
      g.fillStyle = `rgba(255,60,80,${0.12 + k * 0.25})`; g.beginPath(); g.ellipse(X(x), Y(y), r * k, r * k * 0.6, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = Math.floor(this.t * 10) % 2 ? "#ff4a5a" : "#ffd0d0"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, r, r * 0.6, 0, 0, Math.PI * 2); g.stroke();
    }
    // aviso de los peligros que van a cruzar
    for (const [k, y, h, x, dir, warn] of V.hz) {
      if (!warn) continue; const on = Math.floor(this.t * 8) % 2;
      g.fillStyle = `rgba(255,70,50,${on ? 0.28 : 0.14})`; g.fillRect(0, Y(y - h), bw, h * 2);
      g.fillStyle = on ? "#ffd24a" : "#ff6a3a";
      for (let sx = ((Math.floor(this.t * 60) * dir) % 24 + 24) % 24 - 24; sx < bw + 24; sx += 24) { const px = sx, py = Y(y); for (let i = 0; i < 4; i++) { g.fillRect(px + dir * i, py - 3 + i, 2, 1); g.fillRect(px + dir * i, py + 3 - i, 2, 1); } }
      const ex = dir > 0 ? 4 : bw - 10, ey = Math.max(8, Math.min(bh - 16, Y(y) - 6));
      g.fillStyle = "#16121c"; g.fillRect(ex - 1, ey - 1, 8, 14); g.fillStyle = on ? "#ff4a5a" : "#ffd24a"; g.fillRect(ex + 2, ey + 1, 2, 7); g.fillRect(ex + 2, ey + 10, 2, 2);
    }
    // pedido de Roro's
    if (V.obj) {
      const [x, y, pct, left] = V.obj, pulse = 1 + Math.sin(this.t * 5) * 0.08;
      g.fillStyle = "rgba(255,95,176,.18)"; g.beginPath(); g.ellipse(X(x), Y(y), 22 * pulse, 13 * pulse, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#ff5fb0"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, 22, 13, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.ellipse(X(x), Y(y), 22, 13, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct / 100); g.stroke();
      const s = SPR.regalo; g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h - Math.round(Math.abs(Math.sin(this.t * 3)) * 3));
      drawNum(g, left, X(x), Y(y) - 22, left <= 8 ? "#ff4a5a" : "#ffffff");
    }
    // marca donde cae la torta
    for (const [x0, y0, x, y, pct, done, r] of V.bombs) if (!done) { g.strokeStyle = "rgba(255,80,80,.7)"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); g.stroke(); }

    // entidades ordenadas por y
    const list = [];
    for (const p of this.map.props) if (vis(p.x, p.y, 50)) list.push([p.y, 0, p]);
    for (const z of V.hz) if (!z[5]) list.push([z[1] + z[2], 6, z]);
    for (const e of V.enemies) if (vis(e.x, e.y)) list.push([e.y, 1, e]);
    for (const [side, p] of Object.entries(V.players)) { list.push([p.y, 2, p, side]); if (p.dg) list.push([p.dg[1], 3, p.dg]); if (p.o) for (const o of p.o) list.push([o[1], 4, o]); }
    for (const b of V.buses) list.push([b[1], 5, b]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, kind, o, side] of list) {
      if (kind === 0) { const s = SPR[o.s]; g.drawImage(o.fl ? s.fl[0] : s.f[0], X(o.x) - (s.w >> 1), Y(o.y) - s.ay); continue; }
      if (kind === 1) { this.drawEnemy(g, o, X, Y); continue; }
      if (kind === 6) { this.drawHazard(g, o, X, Y); continue; }
      if (kind === 2) this.drawPlayer(g, o, side === V.local, X, Y);
      if (kind === 3) { const s = SPR.romero, fr = Math.floor(this.t * 10) % 2; g.drawImage(o[2] < 0 ? s.fl[fr] : s.f[fr], X(o[0]) - (s.w >> 1), Y(o[1]) - s.ay); }
      if (kind === 4) { const s = SPR.juli, fr = Math.floor(this.t * 8) % 2; g.drawImage(s.f[fr], X(o[0]) - (s.w >> 1), Y(o[1]) - s.ay); }
      if (kind === 5) { const s = SPR.bus; g.drawImage(o[2] < 0 ? s.fl[0] : s.f[0], X(o[0]) - (s.w >> 1), Y(o[1]) - s.ay); }
    }
    // proyectiles
    for (let i = 0; i < V.proj.length; i += 4) {
      const k = V.proj[i], x = V.proj[i + 1], y = V.proj[i + 2], a = V.proj[i + 3] / 10; if (!vis(x, y, 10)) continue;
      const s = SPR[k === 0 ? "medialuna" : "rodillo"];
      g.save(); g.translate(X(x), Y(y)); g.rotate(k === 1 ? this.t * 18 : a); g.drawImage(s.f[0], -(s.w >> 1), -(s.h >> 1)); g.restore();
    }
    for (let i = 0; i < V.eproj.length; i += 3) { const s = V.eproj[i + 2] ? SPR.saliva : SPR.hairball; g.drawImage(s.f[0], X(V.eproj[i]) - (s.w >> 1), Y(V.eproj[i + 1]) - (s.h >> 1)); }
    for (const [x0, y0, x, y, pct, done] of V.bombs) {
      if (done) continue; const k = pct / 100, bx = x0 + (x - x0) * k, by = y0 + (y - y0) * k - Math.sin(k * Math.PI) * 30;
      const s = SPR.torta; g.drawImage(s.f[0], X(bx) - (s.w >> 1), Y(by) - s.h);
    }
    // golpes, explosiones y partículas
    for (const s of this.slashes) {
      s.life -= dt; const k = 1 - s.life / 0.16;
      g.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.6})`; g.lineWidth = 2;
      const arc = (dir) => { g.beginPath(); const a0 = dir > 0 ? -1.1 : Math.PI - 1.1; g.arc(X(s.x), Y(s.y) - 6, s.r * (0.6 + k * 0.4), a0, a0 + 2.2); g.stroke(); };
      if (s.both === 2) { g.strokeStyle = `rgba(255,210,74,${0.9 - k * 0.6})`; g.beginPath(); g.ellipse(X(s.x), Y(s.y) - 4, s.r * (0.6 + k * 0.4), s.r * (0.6 + k * 0.4) * 0.7, 0, 0, Math.PI * 2); g.stroke(); }
      else { arc(s.f); if (s.both) arc(-s.f); }
    }
    this.slashes = this.slashes.filter(s => s.life > 0);
    for (const r of this.rings) { r.life -= dt; const k = 1 - r.life / 0.45; g.strokeStyle = r.c; g.globalAlpha = Math.max(0, r.life * 3); g.lineWidth = 2; g.beginPath(); g.ellipse(X(r.x), Y(r.y) - 4, r.r * (0.3 + k), r.r * (0.3 + k) * 0.7, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    this.rings = this.rings.filter(r => r.life > 0);
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.vx *= 0.95; g.fillStyle = p.c; g.globalAlpha = Math.max(0, p.life / p.max); g.fillRect(X(p.x), Y(p.y), 1, 1); }
    g.globalAlpha = 1;
    this.parts = this.parts.filter(p => p.life > 0);
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);

    // noche: oscuridad con huecos de luz
    this.lighting(V, cx, cy);

    // números de daño arriba de todo
    for (const n of this.nums) { n.life -= dt; n.y -= 22 * dt; if (vis(n.x, n.y)) drawNum(g, n.n, X(n.x), Y(n.y), n.c); }
    this.nums = this.nums.filter(n => n.life > 0);
    if (this.nums.length > 80) this.nums.splice(0, this.nums.length - 80);
    // juntos: hilo de corazón entre los dos
    if (V.bond) {
      const ps = Object.values(V.players); if (ps.length === 2) {
        const [a, b] = ps, n = 10;
        for (let i = 1; i < n; i++) { if ((i + Math.floor(this.t * 6)) % 3 === 0) continue; const k = i / n; g.fillStyle = "#ff8ad8"; g.fillRect(X(a.x + (b.x - a.x) * k), Y(a.y + (b.y - a.y) * k) - 8, 1, 1); }
        const mx = X((a.x + b.x) / 2), my = Y((a.y + b.y) / 2) - 12 - Math.round(Math.abs(Math.sin(this.t * 4)) * 2);
        g.fillStyle = "#ff5fb0"; g.fillRect(mx - 2, my, 2, 1); g.fillRect(mx + 1, my, 2, 1); g.fillRect(mx - 2, my + 1, 5, 1); g.fillRect(mx - 1, my + 2, 3, 1); g.fillRect(mx, my + 3, 1, 1);
      }
    }
    if (V.obj) this.edgeArrow(g, X(V.obj[0]), Y(V.obj[1]) - 6, "#ff5fb0");
    // indicadores de la pareja
    for (const [side, p] of Object.entries(V.players)) {
      if (side === V.local) continue;
      const px = X(p.x), py = Y(p.y) - 10;
      if (px < 4 || px > bw - 4 || py < 4 || py > bh - 4) {
        const ax = Math.max(6, Math.min(bw - 6, px)), ay = Math.max(6, Math.min(bh - 6, py));
        g.fillStyle = p.d ? (Math.floor(this.t * 6) % 2 ? "#ff4a5a" : "#ffffff") : (p.c === "thomas" ? "#ffb938" : "#c9a0ff");
        g.fillRect(ax - 2, ay - 2, 5, 5); g.fillStyle = "#16121c"; g.fillRect(ax, ay - 1, 1, 3);
      }
    }
    if (this.hurtFlash > 0) { this.hurtFlash -= dt; g.fillStyle = `rgba(255,40,60,${this.hurtFlash})`; g.fillRect(0, 0, bw, bh); }

    const c = this.ctx; c.imageSmoothingEnabled = false;
    c.drawImage(this.buf, 0, 0, this.bw, this.bh, 0, 0, this.bw * this.s * (this.cv.width / innerWidth / 1), this.bh * this.s * (this.cv.height / innerHeight / 1));
  }

  drawEnemy(g, o, X, Y) {
    const name = ENEMY_NAME[o.type], f = o.f, elite = f & F_ELITE;
    const s = (elite && SPR[name + "E"]) || SPR[name]; if (!s) return;
    const x = X(o.x), y = Y(o.y);
    if (name === "caja") { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x - 6, y, 12, 2); g.drawImage(f & F_FLASH ? s.wh[0] : s.f[0], x - (s.w >> 1), y - s.ay); return; }
    const tele = f & F_TELE, rush = f & F_RUSH;
    const fr = tele ? 0 : Math.floor(this.t * (o.type === 2 || rush ? 12 : 7) + o.id) % 2;
    const img = (f & F_FLASH) || (tele && Math.floor(this.t * 16) % 2) ? s.wh[fr] : o.fx < 0 ? s.fl[fr] : s.f[fr];
    if (elite) { const k = 1 + Math.sin(this.t * 6 + o.id) * 0.15; g.fillStyle = "rgba(255,210,74,.35)"; g.beginPath(); g.ellipse(x, y, s.w * 0.4 * k, 5 * k, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(x - (s.w >> 2), y, s.w >> 1, 2);
    // la carga de Luz: línea roja que marca por dónde va a pasar
    if (tele && name === "luz") {
      const a = o.a / 10; g.strokeStyle = Math.floor(this.t * 12) % 2 ? "rgba(255,74,90,.8)" : "rgba(255,210,210,.6)"; g.lineWidth = 2; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + Math.cos(a) * 150, y - 6 + Math.sin(a) * 150); g.stroke(); g.setLineDash([]);
    }
    if (rush) { const a = o.a / 10; g.fillStyle = "rgba(255,255,255,.5)"; for (let i = 1; i < 4; i++) g.fillRect(Math.round(x - Math.cos(a) * i * 5), Math.round(y - 5 - Math.sin(a) * i * 5), 2, 1); }
    g.drawImage(img, x - (s.w >> 1), y - s.ay + (o.type === 2 ? -6 : 0) - (rush && name === "saltarin" ? 4 : 0));
    if (tele) { const hy = y - s.h - 6; g.fillStyle = "#16121c"; g.fillRect(x - 2, hy - 1, 4, 9); g.fillStyle = Math.floor(this.t * 10) % 2 ? "#ff4a5a" : "#ffd24a"; g.fillRect(x - 1, hy, 2, 5); g.fillRect(x - 1, hy + 6, 2, 1); }
    if (f & F_WET) { g.fillStyle = "#7fd0ff"; const k = Math.floor(this.t * 6 + o.id) % 3; g.fillRect(x - 3 + k * 2, y - s.h + k, 1, 2); }
  }
  drawHazard(g, z, X, Y) {
    const [k, y, h, x, dir, , len] = z, name = HAZ_ID[k], by = Y(y + h);
    const put = (sp, px) => { const s = SPR[sp]; g.drawImage(dir < 0 ? s.fl[0] : s.f[0], Math.round(px - (s.w >> 1)), by - s.h + 1); };
    const back = dir > 0 ? -1 : 1;
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(X(dir > 0 ? x - len : x), by - 1, len, 3);
    if (name === "tren") { put("locomotora", X(x + back * 30)); for (let i = 0; i < 3; i++) put("vagon", X(x + back * (60 + 42 + i * 86))); }
    else if (name === "carritos") for (let i = 0; i < 6; i++) put("carrito", X(x + back * (11 + i * 26)));
    else if (name === "autos") put(["auto", "auto3", "auto2"][Math.abs(y) % 3], X(x + back * 22));
    else put(name, X(x + back * (len >> 1)));
  }
  edgeArrow(g, px, py, col) {
    const bw = this.bw, bh = this.bh;
    if (px >= 6 && px <= bw - 6 && py >= 6 && py <= bh - 6) return;
    const cx = bw / 2, cy = bh / 2, a = Math.atan2(py - cy, px - cx);
    const ax = Math.max(8, Math.min(bw - 8, px)), ay = Math.max(8, Math.min(bh - 8, py));
    g.save(); g.translate(Math.round(ax), Math.round(ay)); g.rotate(a);
    g.fillStyle = "#16121c"; g.fillRect(-5, -4, 9, 9); g.fillStyle = Math.floor(this.t * 4) % 2 ? col : "#ffffff";
    for (let i = 0; i < 4; i++) g.fillRect(-3 + i, -3 + i, 1, 7 - i * 2);
    g.restore();
  }

  drawPlayer(g, p, isMe, X, Y) {
    const s = SPR[p.c];
    const fr = p.m && !p.d ? [1, 2, 3, 0][Math.floor(this.t * 9) % 4] : 0;
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(X(p.x) - 5, Y(p.y), 10, 2);
    if (p.d) {
      // caído: acostado, con anillo de revivir
      g.save(); g.translate(X(p.x), Y(p.y) - 4); g.rotate(-Math.PI / 2); g.drawImage(s.f[0], -(s.w >> 1), -(s.h >> 1)); g.restore();
      g.strokeStyle = "#16121c"; g.lineWidth = 3; g.beginPath(); g.arc(X(p.x), Y(p.y) - 16, 6, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#ff8ad8"; g.lineWidth = 2; g.beginPath(); g.arc(X(p.x), Y(p.y) - 16, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.rv / 2.2)); g.stroke();
      if (Math.floor(this.t * 4) % 2) { g.fillStyle = "#ff4a5a"; g.fillRect(X(p.x), Y(p.y) - 19, 1, 4); g.fillRect(X(p.x), Y(p.y) - 14, 1, 1); }
      return;
    }
    if (p.i && Math.floor(this.t * 20) % 2) return;
    const img = p.f < 0 ? s.fl[fr] : s.f[fr];
    g.drawImage(img, X(p.x) - (s.w >> 1), Y(p.y) - s.ay);
    if (!isMe) { g.fillStyle = p.c === "thomas" ? "#ffb938" : "#c9a0ff"; g.fillRect(X(p.x) - 1, Y(p.y) - s.h - 3, 3, 2); }
    // barra de vida chiquita
    const w = 12, k = Math.max(0, p.hp / p.mh);
    g.fillStyle = "#16121c"; g.fillRect(X(p.x) - w / 2 - 1, Y(p.y) + 3, w + 2, 3);
    g.fillStyle = k > 0.5 ? "#57e3a0" : k > 0.25 ? "#ffcf3a" : "#ff4a5a"; g.fillRect(X(p.x) - w / 2, Y(p.y) + 4, Math.round(w * k), 1);
  }

  lighting(V, cx, cy) {
    const lg = this.lg, bw = this.bw, bh = this.bh, [r, gC, b, a] = THEMES[this.theme].night;
    lg.globalCompositeOperation = "source-over";
    lg.clearRect(0, 0, bw, bh);
    lg.fillStyle = `rgba(${r},${gC},${b},${a})`; lg.fillRect(0, 0, bw, bh);
    lg.globalCompositeOperation = "destination-out";
    const hole = (x, y, rad, k = 1) => {
      const X = x - cx, Y = y - cy; if (X < -rad || X > bw + rad || Y < -rad || Y > bh + rad) return;
      const gr = lg.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(0.6, `rgba(0,0,0,${k * 0.6})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      lg.fillStyle = gr; lg.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
    };
    const flick = Math.sin(this.t * 13) > 0.96 ? 0.7 : 1;
    this.map.lights.forEach((L, i) => hole(L.x, L.y, L.r, i === 3 ? flick : 1));
    for (const p of Object.values(V.players)) hole(p.x, p.y - 6, 58, 0.95);
    for (const [x, y] of V.pools) hole(x, y, 22, 0.5);
    for (const r of this.rings) hole(r.x, r.y, r.r * 1.3, Math.min(1, r.life * 3));
    for (let i = 0; i < V.gems.length; i += 9) hole(V.gems[i], V.gems[i + 1], 8, 0.5);
    for (const [k, x, y] of V.pickups) if (k >= 2) hole(x, y - 4, 26, 0.8);
    for (const [x, y, r] of V.zones) hole(x, y, r, 0.5);
    if (V.obj) hole(V.obj[0], V.obj[1] - 6, 40, 0.9);
    for (const z of V.hz) { if (z[5]) continue; const cx0 = z[4] > 0 ? z[3] + 30 : z[3] - 30; hole(cx0, z[1], 60, 0.9); }
    for (let i = 0; i < V.enemies.length; i++) { const e = V.enemies[i]; if (e.f & (F_TELE | F_ELITE)) hole(e.x, e.y - 6, 22, 0.6); }
    this.bg.drawImage(this.lc, 0, 0);
    // tinte cálido de los faroles
    const g = this.bg; g.globalCompositeOperation = "lighter";
    for (const L of this.map.lights) { const X = L.x - cx, Y = L.y - cy; if (X < -L.r || X > bw + L.r || Y < -L.r || Y > bh + L.r) continue; const gr = g.createRadialGradient(X, Y, 0, X, Y, L.r * 0.7); gr.addColorStop(0, L.c + "38"); gr.addColorStop(1, L.c + "00"); g.fillStyle = gr; g.fillRect(X - L.r, Y - L.r, L.r * 2, L.r * 2); }
    g.globalCompositeOperation = "source-over";
  }
}
