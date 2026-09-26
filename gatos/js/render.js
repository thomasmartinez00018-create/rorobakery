// Render 2D pixel art: mapa pregenerado, entidades ordenadas por altura, luces nocturnas y efectos.
import { SPR } from "./sprites.js";
import { MAP, ENEMY_NAME } from "./engine.js";

function seeded(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- mapas ---------- */
export const THEMES = {
  plaza: { name: "Plaza Mitre", night: [10, 12, 32, 0.74] },
  estacion: { name: "Estación Los Polvorines", night: [14, 10, 30, 0.66] },
  cancha: { name: "Cancha del Trueno Verde", night: [8, 14, 26, 0.5] }
};

export function buildMap(theme) {
  const c = document.createElement("canvas"); c.width = MAP; c.height = MAP;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const r = seeded(theme.length * 977 + 13);
  const props = [], lights = [];
  const noise = (cols, n, x0 = 0, y0 = 0, w = MAP, h = MAP, size = 1) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x0 + Math.floor(r() * w), y0 + Math.floor(r() * h), size, size); } };
  const tiles = (x, y, w, h, base, line, step = 8, var2) => {
    g.fillStyle = base; g.fillRect(x, y, w, h);
    for (let ty = y; ty < y + h; ty += step) for (let tx = x; tx < x + w; tx += step) if (var2 && r() < 0.12) { g.fillStyle = var2; g.fillRect(tx + 1, ty + 1, step - 1, step - 1); }
    g.fillStyle = line;
    for (let tx = x; tx <= x + w; tx += step) g.fillRect(tx, y, 1, h);
    for (let ty = y; ty <= y + h; ty += step) g.fillRect(x, ty, w, 1);
  };
  const disc = (cx, cy, rad, col) => { g.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.floor(Math.sqrt(rad * rad - y * y)); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } };
  const street = () => {
    g.fillStyle = "#2f3138"; g.fillRect(0, 0, MAP, 56); g.fillRect(0, MAP - 56, MAP, 56); g.fillRect(0, 0, 56, MAP); g.fillRect(MAP - 56, 0, 56, MAP);
    g.fillStyle = "#d8c46a"; for (let i = 60; i < MAP - 60; i += 24) { g.fillRect(i, 27, 12, 2); g.fillRect(i, MAP - 29, 12, 2); g.fillRect(27, i, 2, 12); g.fillRect(MAP - 29, i, 2, 12); }
    tiles(56, 56, MAP - 112, 22, "#a39e92", "#8f8a7e", 11); tiles(56, MAP - 78, MAP - 112, 22, "#a39e92", "#8f8a7e", 11);
    tiles(56, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11); tiles(MAP - 78, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11);
  };
  const free = (x, y, pad = 18) => props.every(p => Math.abs(p.x - x) > pad || Math.abs(p.y - y) > pad);

  if (theme === "plaza") {
    g.fillStyle = "#2d5631"; g.fillRect(0, 0, MAP, MAP);
    noise(["#27492b", "#35633a", "#2a4f2e"], 26000);
    noise(["#e8c23a", "#d85a8a", "#f2f2f2"], 500, 80, 80, MAP - 160, MAP - 160);
    const cx = MAP / 2, cy = MAP / 2;
    tiles(cx - 22, 78, 44, MAP - 156, "#8b877f", "#7b776f", 8, "#97938a");
    tiles(78, cy - 22, MAP - 156, 44, "#8b877f", "#7b776f", 8, "#97938a");
    for (let a = 0; a < Math.PI * 2; a += 0.004) { const x = cx + Math.cos(a) * 96, y = cy + Math.sin(a) * 96; g.fillStyle = "#8b877f"; g.fillRect(Math.round(x) - 11, Math.round(y) - 11, 22, 22); }
    disc(cx, cy, 44, "#8b877f");
    disc(cx, cy, 34, "#b9b4aa"); disc(cx, cy, 28, "#2f6d94"); disc(cx, cy, 24, "#3e7ea6");
    noise(["#7fc3e6", "#5aa6cf"], 90, cx - 20, cy - 20, 40, 40);
    disc(cx, cy, 6, "#b9b4aa"); disc(cx, cy, 3, "#d9d4ca");
    lights.push({ x: cx, y: cy, r: 70, c: "#7fd0ff" });
    street();
    for (let i = 0; i < 70; i++) { const x = 90 + r() * (MAP - 180), y = 90 + r() * (MAP - 180); if (Math.abs(x - cx) < 40 || Math.abs(y - cy) < 40 || Math.hypot(x - cx, y - cy) < 130) continue; if (!free(x, y, 26)) continue; props.push({ s: r() < 0.35 ? "jacaranda" : "arbol", x, y }); }
    for (let t = 110; t < MAP - 100; t += 110) { [[cx - 30, t], [cx + 30, t], [t, cy - 30], [t, cy + 30]].forEach(([x, y]) => { if (Math.hypot(x - cx, y - cy) < 60) return; props.push({ s: "farol", x, y }); lights.push({ x, y: y - 26, r: 64, c: "#ffd98a" }); }); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; props.push({ s: "banco", x: cx + Math.cos(a) * 122, y: cy + Math.sin(a) * 122 }); }
  } else if (theme === "estacion") {
    tiles(0, 0, MAP, MAP, "#8f8b84", "#807c75", 16, "#99958d");
    noise(["#7a766f", "#a19d95"], 9000);
    const rails = y => {
      g.fillStyle = "#5f584f"; g.fillRect(0, y, MAP, 70); noise(["#6f685e", "#4f4940", "#7d766c"], 9000, 0, y, MAP, 70);
      g.fillStyle = "#7a716a"; for (let x = 0; x < MAP; x += 12) g.fillRect(x, y + 12, 5, 46);
      g.fillStyle = "#b8bec6"; g.fillRect(0, y + 20, MAP, 3); g.fillRect(0, y + 46, MAP, 3);
      g.fillStyle = "#f2c200"; g.fillRect(0, y - 8, MAP, 4); g.fillRect(0, y + 74, MAP, 4);
    };
    rails(300); rails(640);
    // tren rojo del Belgrano Norte parado
    g.fillStyle = "#c8102e"; g.fillRect(90, 648, 420, 40); g.fillStyle = "#8a8d8f"; g.fillRect(90, 644, 420, 6);
    g.fillStyle = "#1a2233"; for (let x = 104; x < 500; x += 26) g.fillRect(x, 656, 16, 10);
    g.fillStyle = "#a50d25"; g.fillRect(250, 656, 14, 30); g.fillRect(420, 656, 14, 30);
    // cartel de la estación
    g.fillStyle = "#1d2a44"; g.fillRect(420, 206, 184, 30); g.fillStyle = "#ffffff"; g.fillRect(423, 209, 178, 24);
    g.fillStyle = "#1d2a44"; g.font = "bold 16px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LOS POLVORINES", 512, 222);
    // refugios del andén
    [[180, 200], [760, 200], [300, 820], [700, 820]].forEach(([x, y]) => { g.fillStyle = "#c9ced4"; g.fillRect(x - 60, y - 20, 120, 34); g.fillStyle = "#aeb4ba"; g.fillRect(x - 60, y + 10, 120, 4); });
    street();
    for (let x = 120; x < MAP - 100; x += 120) [[x, 250], [x, 770], [x, 420], [x, 600]].forEach(([px, py], i) => { if (i > 1 && (px % 240)) return; props.push({ s: "farol", x: px, y: py }); lights.push({ x: px, y: py - 26, r: 70, c: "#ffd2a0" }); });
    for (let i = 0; i < 12; i++) props.push({ s: "banco", x: 140 + i * 70, y: i % 2 ? 460 : 580 });
    for (let i = 0; i < 26; i++) { const x = 90 + r() * (MAP - 180), y = r() < 0.5 ? 100 + r() * 90 : 860 + r() * 70; if (free(x, y, 26)) props.push({ s: "arbol", x, y }); }
  } else {
    for (let x = 0; x < MAP; x += 32) { g.fillStyle = (x / 32) % 2 ? "#3f8f3a" : "#469e40"; g.fillRect(x, 0, 32, MAP); }
    noise(["#3a8534", "#4fa848"], 14000);
    g.fillStyle = "#f4f4f4";
    const L = (x, y, w, h) => g.fillRect(x, y, w, h);
    L(120, 180, MAP - 240, 3); L(120, MAP - 183, MAP - 240, 3); L(120, 180, 3, MAP - 360); L(MAP - 123, 180, 3, MAP - 360); L(MAP / 2 - 1, 180, 3, MAP - 360);
    for (let a = 0; a < Math.PI * 2; a += 0.01) g.fillRect(Math.round(MAP / 2 + Math.cos(a) * 80), Math.round(MAP / 2 + Math.sin(a) * 80), 2, 2);
    L(120, MAP / 2 - 110, 110, 3); L(120, MAP / 2 + 107, 110, 3); L(227, MAP / 2 - 110, 3, 220);
    L(MAP - 230, MAP / 2 - 110, 110, 3); L(MAP - 230, MAP / 2 + 107, 110, 3); L(MAP - 230, MAP / 2 - 110, 3, 220);
    const stands = (y, dir) => { for (let i = 0; i < 5; i++) { g.fillStyle = "#a8a8a3"; g.fillRect(0, y + i * 22 * dir, MAP, 20); g.fillStyle = "#0b8a3e"; g.fillRect(0, y + i * 22 * dir + (dir > 0 ? 0 : 18), MAP, 3); } };
    stands(10, 1); stands(MAP - 30, -1);
    g.fillStyle = "#0b8a3e"; g.fillRect(0, 128, MAP, 3); g.fillRect(0, MAP - 131, MAP, 3);
    [[140, 150], [MAP - 140, 150], [140, MAP - 150], [MAP - 140, MAP - 150]].forEach(([x, y]) => { props.push({ s: "farol", x, y }); lights.push({ x, y: y - 26, r: 190, c: "#e6eeff" }); });
    for (let i = 0; i < 10; i++) props.push({ s: "banco", x: 200 + i * 70, y: 160 });
  }
  return { canvas: c, props: props.map(p => ({ ...p, x: Math.round(p.x), y: Math.round(p.y) })), lights };
}

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

const FUR = { 0: "#8d8f98", 1: "#2b2833", 2: "#8f96a3", 3: "#e08a3a", 4: "#8d8170", 5: "#8a7a66" };

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
    for (const [x, y, r, life] of V.pools) { if (!vis(x, y)) continue; g.fillStyle = "rgba(92,122,40,.75)"; g.beginPath(); g.ellipse(X(x), Y(y), r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#b8d86a"; for (let i = 0; i < 4; i++) { const a = this.t * 2 + i * 1.7; g.fillRect(X(x + Math.cos(a) * r * 0.5), Y(y + Math.sin(a * 1.3) * r * 0.3), 1, 1); } }
    // gemas y objetos
    for (let i = 0; i < V.gems.length; i += 3) { const x = V.gems[i], y = V.gems[i + 1], v = V.gems[i + 2]; if (!vis(x, y, 8)) continue; const s = SPR[v >= 5 ? "gem5" : v >= 2 ? "gem2" : "gem1"]; g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h + Math.round(Math.sin(this.t * 5 + x) * 1)); }
    for (const [k, x, y] of V.pickups) { if (!vis(x, y)) continue; const s = SPR[k === 0 ? "alfajor" : "moneda"]; g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h - Math.round(Math.abs(Math.sin(this.t * 4)) * 2)); }
    // marca donde cae la torta
    for (const [x0, y0, x, y, pct, done, r] of V.bombs) if (!done) { g.strokeStyle = "rgba(255,80,80,.7)"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); g.stroke(); }

    // entidades ordenadas por y
    const list = [];
    for (const p of this.map.props) if (vis(p.x, p.y, 40)) list.push([p.y, 0, p]);
    for (const e of V.enemies) if (vis(e.x, e.y)) list.push([e.y, 1, e]);
    for (const [side, p] of Object.entries(V.players)) { list.push([p.y, 2, p, side]); if (p.dg) list.push([p.dg[1], 3, p.dg]); if (p.o) for (const o of p.o) list.push([o[1], 4, o]); }
    for (const b of V.buses) list.push([b[1], 5, b]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, kind, o, side] of list) {
      if (kind === 0) { const s = SPR[o.s]; g.drawImage(s.f[0], X(o.x) - (s.w >> 1), Y(o.y) - s.ay); continue; }
      if (kind === 1) {
        const name = ENEMY_NAME[o.type], s = SPR[name]; if (!s) continue;
        const fr = Math.floor(this.t * (o.type === 2 ? 12 : 7) + o.id) % 2;
        const faceL = o.fx < 0;
        const img = o.flash ? s.wh[fr] : faceL ? s.fl[fr] : s.f[fr];
        g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(X(o.x) - (s.w >> 2), Y(o.y), s.w >> 1, 2);
        g.drawImage(img, X(o.x) - (s.w >> 1), Y(o.y) - s.ay + (o.type === 2 ? -6 : 0));
        if (o.charge) { g.fillStyle = "#ff5a3a"; g.fillRect(X(o.x) - 1, Y(o.y) - s.h - 4, 2, 3); }
        continue;
      }
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
    for (let i = 0; i < V.eproj.length; i += 2) { const s = SPR.hairball; g.drawImage(s.f[0], X(V.eproj[i]) - 3, Y(V.eproj[i + 1]) - 3); }
    for (const [x0, y0, x, y, pct, done] of V.bombs) {
      if (done) continue; const k = pct / 100, bx = x0 + (x - x0) * k, by = y0 + (y - y0) * k - Math.sin(k * Math.PI) * 30;
      const s = SPR.torta; g.drawImage(s.f[0], X(bx) - (s.w >> 1), Y(by) - s.h);
    }
    // golpes, explosiones y partículas
    for (const s of this.slashes) {
      s.life -= dt; const k = 1 - s.life / 0.16;
      g.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.6})`; g.lineWidth = 2;
      const arc = (dir) => { g.beginPath(); const a0 = dir > 0 ? -1.1 : Math.PI - 1.1; g.arc(X(s.x), Y(s.y) - 6, s.r * (0.6 + k * 0.4), a0, a0 + 2.2); g.stroke(); };
      arc(s.f); if (s.both) arc(-s.f);
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
    this.bg.drawImage(this.lc, 0, 0);
    // tinte cálido de los faroles
    const g = this.bg; g.globalCompositeOperation = "lighter";
    for (const L of this.map.lights) { const X = L.x - cx, Y = L.y - cy; if (X < -L.r || X > bw + L.r || Y < -L.r || Y > bh + L.r) continue; const gr = g.createRadialGradient(X, Y, 0, X, Y, L.r * 0.7); gr.addColorStop(0, L.c + "38"); gr.addColorStop(1, L.c + "00"); g.fillStyle = gr; g.fillRect(X - L.r, Y - L.r, L.r * 2, L.r * 2); }
    g.globalCompositeOperation = "source-over";
  }
}
