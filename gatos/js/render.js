// Render 2D pixel art: mapa pregenerado, entidades ordenadas por altura, luces nocturnas y efectos.
import { SPR } from "./sprites.js";
import { MAP, ENEMY_NAME, HAZ_ID, PICKS, ALLY, F_FLASH, F_TELE, F_ELITE, F_RUSH, F_WET, F_LEFT, F_DOWN } from "./engine.js";
import { THEMES, AMBIENCE, buildMap } from "./maps.js";
export { THEMES };

/* ---------- números en pixel ---------- */
const DIG = ["111101101101111", "010110010010111", "111001111100111", "111001111001111", "101101111001001", "111100111001111", "111100111101111", "111001010010010", "111101111101111", "111101111001111"];
// los diez dígitos se dibujan una vez por color (con su sombra) y después se copian con un drawImage por dígito
const digitSheets = new Map();
function digitSheet(col) {
  let c = digitSheets.get(col); if (c) return c;
  c = document.createElement("canvas"); c.width = 40; c.height = 6;
  const g = c.getContext("2d");
  for (const [fill, off] of [["#16121c", 1], [col, 0]]) {
    g.fillStyle = fill;
    DIG.forEach((bits, d) => { for (let i = 0; i < 15; i++) if (bits[i] === "1") g.fillRect(d * 4 + (i % 3) + off, Math.floor(i / 3) + off, 1, 1); });
  }
  digitSheets.set(col, c);
  return c;
}
function drawNum(g, n, x, y, col, sc = 1) {
  const s = String(n), sheet = digitSheet(col);
  const w = (s.length * 4 - 1) * sc;
  let ox = Math.round(x - w / 2); const oy = Math.round(y - (sc - 1) * 3);
  for (let i = 0; i < s.length; i++) {
    const d = s.charCodeAt(i) - 48;
    if (d >= 0 && d <= 9) g.drawImage(sheet, d * 4, 0, 4, 6, ox, oy, 4 * sc, 6 * sc);
    ox += 4 * sc;
  }
}
// letras de 3x5 para los indicadores (T de Thomas, R de Rocío, ! de caído)
const GLY = { T: "111010010010010", R: "110101110101101", "!": "010010010000010" };
function glyph(g, ch, x, y, col) { const b = GLY[ch]; g.fillStyle = col; for (let i = 0; i < 15; i++) if (b[i] === "1") g.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1); }
// flecha pixelada en una de 8 direcciones (0 = derecha, en sentido horario), con la base a `d` px del centro
const DIR8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
function pixArrow(g, x, y, o, col, d) {
  const [dx, dy] = DIR8[o];
  for (const [c, grow] of [["#16121c", 1], [col, 0]]) {
    g.fillStyle = c;
    if (dx && dy) { // diagonal: triángulo rectángulo con la punta hacia afuera
      const tx = x + dx * (d + 3), ty = y + dy * (d + 3), n = 3 + grow;
      for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) g.fillRect(tx - dx * i + (grow ? dx : 0), ty - dy * j + (grow ? dy : 0), 1, 1);
    } else for (let i = -grow; i <= 3 + grow; i++) { // recto: cuatro filas que se angostan hacia la punta
      const u = d + 3 - i, w = Math.max(0, i) + grow;
      if (dx) g.fillRect(x + dx * u, y - w, 1, w * 2 + 1); else g.fillRect(x - w, y + dy * u, w * 2 + 1, 1);
    }
  }
}
const MATE = c => c && c.startsWith("thomas") ? "#ffb938" : "#c9a0ff";
// huecos de luz y tintes: degradés pre-dibujados una vez por radio (antes, un createRadialGradient por luz y por cuadro)
const holeSprites = new Map(), tintSprites = new Map();
function holeSprite(rad) {
  rad = Math.max(1, Math.round(rad));
  let c = holeSprites.get(rad); if (c) return c;
  if (holeSprites.size > 300) holeSprites.clear();
  c = document.createElement("canvas"); c.width = c.height = rad * 2;
  const g = c.getContext("2d"), gr = g.createRadialGradient(rad, rad, 0, rad, rad, rad);
  gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.6, "rgba(0,0,0,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, rad * 2, rad * 2);
  holeSprites.set(rad, c);
  return c;
}
function tintSprite(col, r) {
  const k = col + r; let c = tintSprites.get(k); if (c) return c;
  if (tintSprites.size > 100) tintSprites.clear();
  const rr = Math.max(1, Math.ceil(r * 0.7));
  c = document.createElement("canvas"); c.width = c.height = rr * 2;
  const g = c.getContext("2d"), gr = g.createRadialGradient(rr, rr, 0, rr, rr, r * 0.7);
  gr.addColorStop(0, col + "38"); gr.addColorStop(1, col + "00");
  g.fillStyle = gr; g.fillRect(0, 0, rr * 2, rr * 2);
  tintSprites.set(k, c);
  return c;
}

/* ---------- partículas en pool fijo (arrays tipados, sin crear objetos por cuadro) ---------- */
// paleta: cada color se guarda una vez y las partículas llevan su índice
const PAL = [], PALI = new Map();
function ci(col) { let i = PALI.get(col); if (i === undefined) { if (PAL.length >= 255) return 0; i = PAL.length; PAL.push(col); PALI.set(col, i); } return i; }
class Pool {
  constructor(n) {
    this.n = n; this.i = 0;
    for (const k of ["x", "y", "vx", "vy", "life", "max", "gr", "a", "ph", "sw"]) this[k] = new Float32Array(n);
    for (const k of ["c", "s", "k", "b"]) this[k] = new Uint8Array(n);
  }
  // si está lleno se pisa la más vieja
  take() { const i = this.i; this.i = i + 1 === this.n ? 0 : i + 1; return i; }
  clear() { this.life.fill(0); }
  count() { let n = 0; for (let i = 0; i < this.n; i++) if (this.life[i] > 0) n++; return n; }
}
/* ---------- calidad: Alta (todo) o Ahorro (sin postproceso ni partículas de ambiente, la mitad de partículas de efectos) ---------- */
const Q_KEY = "gdl-calidad";
function loadQuality() {
  try { const v = localStorage.getItem(Q_KEY); if (v === "alta" || v === "ahorro") return v; } catch (e) {}
  // sin preferencia guardada: los celus que avisan poca memoria (2 GB o menos) arrancan en Ahorro
  const mem = typeof navigator !== "undefined" ? navigator.deviceMemory : 0;
  return mem && mem <= 2 ? "ahorro" : "alta";
}
const FX_N = 600, AMB_N = 220;
// ambiente: tipo de partícula -> número (para el array tipado)
const AK = { hoja: 0, polvo: 1, vapor: 2, insecto: 3, chispa: 4, harina: 5, luciernaga: 6, gota: 7 };
const AMB_SCREEN = 230 * 230; // las tasas de AMBIENCE son por segundo en una pantalla de 230 px
const AMB_DENS = 2;           // en el celu, con la tasa tal cual, las partículas casi no se leían
const noise1 = n => ((Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 1000) / 1000;
const rnd = (r) => r[0] + Math.random() * (r[1] - r[0]);
// golpes de la misma tanda al mismo gato: un solo número (mapa reutilizado entre llamadas)
const SAME = new Map();

// color del número: crítico ámbar (más grande), crítico muy fuerte naranja; golpes chicos un poco apagados
const numCol = (n, crit) => crit ? (n >= 100 ? "#ff8a3a" : "#ffd24a") : n < 5 ? "#c8cad8" : "#ffffff";
/* ---------- postproceso barato: todo precalculado ---------- */
// gradación de color por mapa: se hornea UNA vez en el piso y en los objetos del mapa al cargarlo (cero costo por cuadro).
// Encima va el tinte de AMBIENCE en modo soft-light. sat: saturación, con: contraste, lift: color que levanta las sombras.
const GRADE = {
  plaza:    { sat: 1.06, con: 1.05, lift: [4, 8, 22] },
  estacion: { sat: 0.94, con: 1.07, lift: [4, 6, 20] },
  feria:    { sat: 1.10, con: 1.04, lift: [14, 4, 22] },
  bielli:   { sat: 1.08, con: 1.08, lift: [8, 5, 0] },
  cancha:   { sat: 1.06, con: 1.05, lift: [0, 10, 14] },
  tortugas: { sat: 1.06, con: 1.04, lift: [0, 8, 22] },
  terrazas: { sat: 1.08, con: 1.06, lift: [16, 4, 20] },
  abuela:   { sat: 1.00, con: 1.04, lift: [14, 8, 0] },
  roros:    { sat: 1.04, con: 1.03, lift: [0, 6, 12] }
};
const softLight = (b, s) => s <= 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * ((b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b)) - b);
function gradeLut(theme) {
  const G = GRADE[theme] || { sat: 1, con: 1, lift: [0, 0, 0] }, A = AMBIENCE[theme], lut = new Uint8ClampedArray(768);
  const tint = A && A.tint ? hexRgb(A.tint.color).map(v => v / 255) : null, ta = A && A.tint ? Math.min(1, A.tint.alpha * 1.5) : 0;
  for (let ch = 0; ch < 3; ch++) for (let v = 0; v < 256; v++) {
    let b = v / 255;
    if (tint) b += (softLight(b, tint[ch]) - b) * ta;
    b = (b - 0.5) * G.con + 0.5;
    b += G.lift[ch] / 255 * (1 - b) * (1 - b);
    lut[ch * 256 + v] = Math.round(b * 255);
  }
  return { lut, sat: G.sat };
}
function gradeCanvas(src, gr) {
  const w = src.width, h = src.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, w, h), a = d.data, L = gr.lut, sat = gr.sat;
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    let r = L[a[i]], gg = L[256 + a[i + 1]], b = L[512 + a[i + 2]];
    if (sat !== 1) { const l = r * 0.299 + gg * 0.587 + b * 0.114; r = l + (r - l) * sat; gg = l + (gg - l) * sat; b = l + (b - l) * sat; }
    a[i] = r; a[i + 1] = gg; a[i + 2] = b;
  }
  g.putImageData(d, 0, 0);
  return c;
}
// brillo falso (bloom): discos escalonados pre-dibujados por color y radio, que se suman con "lighter"
const glowSprites = new Map();
function glowSprite(col, r) {
  const k = col + r; let c = glowSprites.get(k); if (c) return c;
  if (glowSprites.size > 160) glowSprites.clear();
  c = document.createElement("canvas"); c.width = c.height = r * 2 + 1;
  const g = c.getContext("2d"), [R, G, B] = hexRgb(col);
  for (const [f, a] of [[1, 0.10], [0.68, 0.14], [0.4, 0.2]]) {
    const rr = Math.max(1, Math.round(r * f)); g.fillStyle = `rgba(${R},${G},${B},${a})`;
    for (let y = -rr; y <= rr; y++) { const w = Math.floor(Math.sqrt(rr * rr - y * y)); g.fillRect(r - w, r + y, w * 2 + 1, 1); }
  }
  glowSprites.set(k, c);
  return c;
}
// sombras de contacto suaves: elipse de dos tonos por ancho
const shadowSprites = new Map();
function shadowSprite(w) {
  w = Math.max(4, Math.min(48, w | 0)); let c = shadowSprites.get(w); if (c) return c;
  c = document.createElement("canvas"); c.width = w; c.height = 4; const g = c.getContext("2d");
  const row = (y, f, a) => { const ww = Math.max(2, Math.round(w * f)); g.fillStyle = `rgba(8,6,18,${a})`; g.fillRect((w - ww) >> 1, y, ww, 1); };
  row(0, 0.6, 0.14); row(1, 1, 0.26); row(1, 0.7, 0.14); row(2, 0.9, 0.3); row(3, 0.5, 0.14);
  shadowSprites.set(w, c);
  return c;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const INK = "#0b0d1c";
const hexRgb = h => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const FUR = { 0: "#8d8f98", 1: "#2b2833", 2: "#8f96a3", 3: "#e08a3a", 4: "#8d8170", 5: "#8a7a66", 6: "#e0822e", 7: "#efe0c4", 8: "#f4f1ea", 9: "#b7b9c2", 10: "#b07a42" };
const PICK_SPR = { alfajor: "alfajor", moneda: "moneda", caja: "regalo", iman: "iman", manguera: "manguera" };
// aliados sin sprite propio todavía: se dibujan con uno parecido (y una marca verde arriba)
const ALLY_FALLBACK = { humano: "alumno", perro: "romero", gato: "gato" };

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.buf = document.createElement("canvas"); this.bg = this.buf.getContext("2d");
    this.lc = document.createElement("canvas"); this.lg = this.lc.getContext("2d");
    this.fx = new Pool(FX_N); this.nums = []; this.numFree = []; this.slashes = []; this.rings = [];
    // muertes con "pop": pocas a la vez, objetos reutilizados
    this.pops = Array.from({ length: 24 }, () => ({ life: 0, x: 0, y: 0, s: null, big: 0 })); this.popI = 0;
    // animación de cada jugador (acción en curso, esquive, estela) y de cada aliado
    this.pst = {}; this.ast = new Map();
    this.lastP = null; this.lastA = null; this.bossXY = [];
    // hit-stop: cuadros de render que se congelan (la simulación sigue)
    this.stopF = 0; this.stopAt = -9;
    // ambiente del mapa (AMBIENCE): partículas en su propio pool, luces que titilan y la capa de noche con viñeta
    this.amb = new Pool(AMB_N); this.em = []; this.ambCfg = null; this.ambWarm = false; this.tmpL = new Array(16);
    this.nightC = document.createElement("canvas"); this.nightKey = "";
    this.q = loadQuality();
    // bloom: lista de brillos del cuadro (coordenadas del mundo), dibujados juntos al final
    this.glN = 0; this.glX = new Float32Array(128); this.glY = new Float32Array(128); this.glR = new Uint8Array(128); this.glC = new Uint8Array(128); this.glA = new Float32Array(128);
    this.mapG = null; this.propG = new Map();
    // transición de pantalla: canvas propio encima de todo (también tapa la interfaz), en bloques grandes
    this.wc = document.createElement("canvas"); this.wc.className = "wipe"; this.wx = this.wc.getContext("2d"); this.wp = null; this.wRaf = 0;
    document.body.appendChild(this.wc);
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
  get hi() { return this.q === "alta"; }
  // la elige la pausa y queda guardada en el celu
  setQuality(q) {
    q = q === "ahorro" ? "ahorro" : "alta";
    try { localStorage.setItem(Q_KEY, q); } catch (e) {}
    if (q === this.q) return;
    this.q = q; this.nightKey = ""; this.glN = 0; this.amb.clear(); this.ambWarm = true;
    if (this.map && this.hi) this.grade();
  }
  setMap(theme) {
    this.theme = theme; this.map = buildMap(theme);
    const A = this.ambCfg = AMBIENCE[theme] || null;
    // emisores: colores a índices de paleta y, si salen de las luces, la lista de luces de ese tipo
    this.em = A ? (A.particles || []).map(p => ({ ...p, acc: 0, k: AK[p.kind] ?? 1, ci: p.colors.map(ci), lit: p.where === "luces" ? this.map.lights.filter(L => L.kind === p.lightKind) : null, nv: 0, zx0: 0, zy0: 0, zx1: 0, zy1: 0 })) : [];
    // cada luz: intensidad (su k por el k del mapa), si titila y una semilla propia
    const LK = A && A.light ? A.light : { k: 1, flicker: { kinds: [], amount: 0, rate: 0 } }, fk = (LK.flicker && LK.flicker.kinds) || [];
    this.map.lights.forEach((L, i) => { L.kk = (L.k ?? 1) * (LK.k ?? 1); L.fl = fk.includes(L.kind); L.seed = i * 7919 + 13; L.now = L.kk; });
    this.flk = LK.flicker || { amount: 0, rate: 0 };
    this.amb.clear(); this.ambWarm = true; this.nightKey = ""; this.ambDim = 1;
    this.mapG = null; this.propG.clear(); this.grade();
  }
  // gradación horneada (solo en calidad Alta): el piso y cada objeto distinto del mapa, una vez
  grade() {
    if (!this.hi || this.mapG) return;
    const gr = gradeLut(this.theme);
    this.mapG = gradeCanvas(this.map.canvas, gr);
    for (const p of this.map.props) {
      if (this.propG.has(p.s)) continue; const s = SPR[p.s]; if (!s) continue;
      this.propG.set(p.s, { f: gradeCanvas(s.f[0], gr), fl: gradeCanvas(s.fl[0], gr) });
    }
  }
  glow(x, y, r, col, a = 1) {
    const i = this.glN; if (!this.hi || i >= 128 || a <= 0.03) return;
    this.glX[i] = x; this.glY[i] = y; this.glR[i] = Math.max(2, Math.min(60, Math.round(r / 2) * 2)); this.glC[i] = ci(col); this.glA[i] = Math.min(1, a); this.glN = i + 1;
  }
  drawGlows(g, cx, cy) {
    const n = this.glN; this.glN = 0; if (!n) return;
    const bw = this.bw, bh = this.bh;
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const r = this.glR[i], x = Math.round(this.glX[i] - cx), y = Math.round(this.glY[i] - cy);
      if (x < -r || y < -r || x > bw + r || y > bh + r) continue;
      g.globalAlpha = this.glA[i]; g.drawImage(glowSprite(PAL[this.glC[i]], r), x - r, y - r);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  shadow(g, x, y, w, a) {
    if (this.hi) { const s = shadowSprite(w); g.drawImage(s, x - (s.width >> 1), y - 1); }
    else { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(x - (w >> 1), y, w, 2); }
  }

  /* ---------- transición pixelada entre pantallas ----------
     "iris": se abre un círculo desde tu personaje (entrar a jugar o a un capítulo)
     "cierre": el círculo se cierra sobre tu personaje y queda negro (fin de la partida, hasta los resultados)
     "mosaico": la pantalla se destapa en bloques con orden de matriz Bayer (menú, resultados) */
  wipe(kind) {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const B = 6, cw = Math.ceil(innerWidth / B), ch = Math.ceil(innerHeight / B), c = this.wc;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    this.wp = { kind, t: 0, dur: kind === "cierre" ? 1.2 : kind === "mosaico" ? 0.42 : kind === "capitulo" ? 0.8 : 0.55 };
    c.style.display = "block";
    if (!this.wRaf) {
      let last = performance.now();
      const step = now => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; this.wRaf = this.wipeStep(dt) ? requestAnimationFrame(step) : 0; };
      this.wRaf = requestAnimationFrame(step);
    }
    this.wipeStep(0);
  }
  wipeStep(dt) {
    const w = this.wp, c = this.wc, x = this.wx;
    if (!w) { c.style.display = "none"; return false; }
    w.t += dt;
    const k = Math.min(1, w.t / w.dur), cw = c.width, ch = c.height;
    x.clearRect(0, 0, cw, ch); x.fillStyle = INK;
    if (w.kind === "mosaico") {
      const S = 3;
      for (let by = 0, ny = Math.ceil(ch / S); by < ny; by++) for (let bx = 0, nx = Math.ceil(cw / S); bx < nx; bx++) if (BAYER[(by & 3) * 4 + (bx & 3)] / 16 >= k) x.fillRect(bx * S, by * S, S, S);
    } else {
      // iris: círculo en píxeles grandes (una fila a la vez), con borde de color
      const open = w.kind !== "cierre", e = open ? 1 - (1 - k) ** 3 : (1 - k) ** 2;
      const ox = cw / 2, oy = ch / 2 + 1, R = e * Math.hypot(cw, ch) * 0.56, edge = w.kind === "capitulo" ? "#ff5fb0" : "#ffb938";
      for (let y = 0; y < ch; y++) {
        const dy = y + 0.5 - oy, d = R * R - dy * dy;
        if (d <= 0) { x.fillRect(0, y, cw, 1); continue; }
        const half = Math.sqrt(d), a = Math.max(0, Math.round(ox - half)), b = Math.min(cw, Math.round(ox + half));
        x.fillRect(0, y, a, 1); x.fillRect(b, y, cw - b, 1);
        if (R > 1 && k < 1) { x.fillStyle = edge; x.fillRect(a - 1, y, 1, 1); x.fillRect(b, y, 1, 1); x.fillStyle = INK; }
      }
    }
    if (w.kind === "cierre") { if (w.t > w.dur + 4) { this.wp = null; c.style.display = "none"; return false; } return true; }
    if (k >= 1) { this.wp = null; x.clearRect(0, 0, cw, ch); c.style.display = "none"; return false; }
    return true;
  }

  /* efectos a partir de los eventos de la simulación */
  events(ev, localSide) {
    const snd = [];
    SAME.clear(); // golpes al mismo gato en el mismo lote: un solo número con la suma
    for (const e of ev) {
      const k = e[0];
      if (k === "hit") {
        const key = e[1] * 4096 + e[2], prev = SAME.get(key);
        if (prev) { prev.n += e[3]; if (e[4]) prev.big = 1; prev.c = numCol(prev.n, prev.big); }
        else SAME.set(key, this.num(e[1], e[2], e[3], e[4]));
        for (let i = 0; i < 3; i++) this.part(e[1], e[2] + 6, "#ffffff", 40, 0.2); snd.push("hit");
        // hit-stop corto en críticos (más largo si el golpe es a una jefa), con un respiro entre uno y otro
        if (e[4]) { const boss = this.nearBoss(e[1], e[2] + 8); if (this.t - this.stopAt > (boss ? 0.6 : 1.1)) this.hitStop(boss ? 3 : 2); }
      }
      if (k === "die") {
        const col = FUR[e[3]] || "#888", name = ENEMY_NAME[e[3]], big = e[3] === 4 || e[3] === 5;
        // "pop": la silueta se infla y se apaga, y vuela pelo del color del gato
        if (name !== "caja") this.pop(e[1], e[2], SPR[name], big);
        for (let i = 0; i < (big ? 30 : 10); i++) this.part(e[1], e[2] - 4, col, big ? 110 : 75, 0.5, i % 4 ? 1 : 2, 160);
        this.part(e[1], e[2] - 4, "#ffffff", 20, 0.3); snd.push("die");
      }
      if (k === "slash") { this.slashes.push({ x: e[1], y: e[2], f: e[3], r: e[4], both: e[5], life: 0.16 }); this.actAt(e[1], e[2], "slash", e[3]); }
      if (k === "throw") this.actAt(e[1], e[2], "throw", 0);
      if (k === "boom") { this.rings.push({ x: e[1], y: e[2], r: e[3], life: 0.3, c: "#ffb04a" }); for (let i = 0; i < 16; i++) this.part(e[1], e[2], i % 2 ? "#ffcf5a" : "#ff6a3a", 110, 0.5); this.shake = Math.max(this.shake, 2); snd.push("boom"); }
      if (k === "ultT" || k === "ultR") { this.rings.push({ x: e[1], y: e[2], r: 80, life: 0.45, c: k === "ultT" ? "#ffffff" : "#ff8ad8" }); this.shake = 5; this.hitStop(2); this.actAt(e[1], e[2], "ult", 0); snd.push("ult"); }
      if (k === "hurt") { if (e[3] === localSide) { this.shake = Math.max(this.shake, 3); this.hurtFlash = 0.25; } snd.push(e[3] === localSide ? "hurt" : ""); }
      if (k === "down") { for (let i = 0; i < 20; i++) this.part(e[1], e[2], "#ff4a5a", 60, 0.8); snd.push("down"); }
      if (k === "revive") { for (let i = 0; i < 18; i++) this.part(e[1], e[2], "#ff8ad8", 50, 0.9); snd.push("revive"); }
      if (k === "heal") { for (let i = 0; i < 10; i++) this.part(e[1], e[2], "#6aff9a", 40, 0.7); snd.push("heal"); }
      if (k === "coin") snd.push("coin");
      if (k === "gem") snd.push(e[1] === localSide ? "gem" : "");
      if (k === "bite") this.part(e[1], e[2], "#ffffff", 30, 0.2);
      if (k === "charge") this.rings.push({ x: e[1], y: e[2], r: 30, life: 0.3, c: "#ff5a3a" });
      if (k === "dash") { for (let i = 0; i < 8; i++) this.part(e[1], e[2], "#d8d2c4", 40, 0.35); const st = this.ps(e[3]); st.dash = 0.3; st.land = 0; st.tn = 0; snd.push(e[3] === localSide ? "dash" : ""); }
      if (k === "elite") { this.rings.push({ x: e[1], y: e[2], r: 50, life: 0.45, c: "#ffd24a" }); snd.push("elite"); }
      if (k === "spit") snd.push("spit");
      if (k === "zones") snd.push("zones");
      if (k === "zone") { this.rings.push({ x: e[1], y: e[2], r: e[3] * 1.4, life: 0.35, c: "#ff4a5a" }); for (let i = 0; i < 12; i++) this.part(e[1], e[2], i % 2 ? "#ff4a5a" : "#8a7a66", 90, 0.5); this.shake = Math.max(this.shake, 2); snd.push("boom"); }
      if (k === "phase") { this.rings.push({ x: e[2], y: e[3], r: 120, life: 0.45, c: "#b36aff" }); this.shake = 6; this.hitStop(3); snd.push("phase"); }
      if (k === "chest") { for (let i = 0; i < 26; i++) this.part(e[4], e[5], ["#ffd24a", "#ff8ac2", "#ffffff"][i % 3], 90, 0.9); this.rings.push({ x: e[4], y: e[5], r: 50, life: 0.45, c: e[2] === "evo" ? "#ff5fd2" : "#ffd24a" }); snd.push(e[2] === "evo" ? "evo" : "chest"); }
      if (k === "vacuum") { this.rings.push({ x: e[1], y: e[2], r: 120, life: 0.45, c: "#7ff0ff" }); snd.push("vacuum"); }
      if (k === "splash") { this.rings.push({ x: e[1], y: e[2], r: 150, life: 0.45, c: "#7fd0ff" }); for (let i = 0; i < 40; i++) this.part(e[1] + Math.cos(i) * 60, e[2] + Math.sin(i) * 40, i % 2 ? "#7fd0ff" : "#ffffff", 60, 0.7); snd.push("splash"); }
      if (k === "sync") { this.rings.push({ x: e[1], y: e[2], r: 130, life: 0.45, c: "#ff5fb0" }, { x: e[1], y: e[2], r: 80, life: 0.45, c: "#ffffff" }); for (let i = 0; i < 20; i++) this.part(e[1], e[2], "#ff5fb0", 80, 1); this.shake = 6; this.hitStop(3); snd.push("sync"); }
      if (k === "warn") snd.push(e[1] === "tren" ? "horn" : "warn");
      if (k === "pass") { this.shake = Math.max(this.shake, e[1] === "tren" ? 4 : 1); snd.push(e[1] === "tren" ? "train" : "whoosh"); }
      if (k === "obj") snd.push(["objfail", "objok", "obj"][e[1]]);
      if (k === "summon") this.rings.push({ x: e[1], y: e[2], r: 40, life: 0.5, c: "#b36aff" });
      if (k === "boss" || k === "bossdown") this.hitStop(3);
      if (["bus", "boss", "horde", "levelup", "throw", "hairball", "bossdown", "win", "over"].includes(k)) snd.push(k === "boss" ? "boss:" + e[1] : k);
    }
    return snd;
  }
  part(x, y, c, sp, life, size = 1, grav = 120) {
    if (this.q === "ahorro" && Math.random() < 0.5) return;
    const P = this.fx, i = P.take(), a = Math.random() * 6.2832, v = sp * (0.3 + Math.random() * 0.7);
    P.x[i] = x; P.y[i] = y; P.vx[i] = Math.cos(a) * v; P.vy[i] = Math.sin(a) * v - 20; P.life[i] = P.max[i] = life; P.c[i] = ci(c); P.s[i] = size; P.gr[i] = grav;
  }
  clearFx() { this.fx.clear(); this.nums.length = 0; this.rings.length = 0; this.slashes.length = 0; for (const p of this.pops) p.life = 0; }
  fxCount() { return this.fx.count(); }
  // número de daño: objetos reutilizados; el crítico es más grande y de color
  num(x, y, n, crit) {
    if (this.nums.length >= 30) this.numFree.push(this.nums.shift());
    const o = this.numFree.pop() || {};
    o.x = x + ((Math.random() * 7) | 0) - 3; o.y = y; o.n = n; o.big = crit ? 1 : 0; o.c = numCol(n, o.big); o.max = o.life = crit ? 0.8 : 0.6;
    this.nums.push(o); return o;
  }
  pop(x, y, s, big) { if (!s) return; const p = this.pops[this.popI]; this.popI = (this.popI + 1) % this.pops.length; p.x = x; p.y = y; p.s = s; p.big = big ? 1 : 0; p.life = 0.16; if (big) this.shake = Math.max(this.shake, 4); }
  hitStop(n) { if (n > this.stopF) this.stopF = n; this.stopAt = this.t; }
  nearBoss(x, y) { const b = this.bossXY; for (let i = 0; i < b.length; i += 2) if (Math.abs(b[i] - x) < 26 && Math.abs(b[i + 1] - y) < 30) return true; return false; }
  // estado de animación de un jugador
  ps(side) { return this.pst[side] || (this.pst[side] = { act: 0, kind: "", alt: 0, f: 1, dash: 0, land: 0, tx: new Float32Array(4), ty: new Float32Array(4), tn: 0 }); }
  // "slash" y "throw" no dicen quién pegó: se le asigna al jugador (o aliado) que está en ese punto
  actAt(x, y, kind, face) {
    let best = null, bd = 18 * 18, ally = false;
    if (this.lastP) for (const side in this.lastP) { const p = this.lastP[side], d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = side; } }
    if (this.lastA) for (const a of this.lastA) { const d = (a.x - x) ** 2 + (a.y - y) ** 2; if (d < bd) { bd = d; best = a.id; ally = true; } }
    if (best === null) return;
    if (ally) { this.ast.set(best, this.t); return; }
    const st = this.ps(best); st.kind = kind; st.alt ^= 1; st.act = kind === "throw" ? 0.2 : kind === "ult" ? 0.3 : 0.16; if (face) st.f = face;
  }

  frame(V, dt) {
    // hit-stop: se repite el cuadro anterior (el canvas ya lo tiene) y la simulación sigue su curso
    if (this.stopF > 0) { this.stopF--; return; }
    this.t += dt;
    this.lastP = V.players; this.lastA = V.allies || null; this.bossXY.length = 0;
    const g = this.bg, bw = this.bw, bh = this.bh;
    const me = V.players[V.local] || Object.values(V.players)[0];
    // V.cam (opcional, lo manda el anfitrión): la cámara va a ese punto más despacio; si no viene, sigue al jugador
    const focus = V.cam ? { x: V.cam[0], y: V.cam[1] } : me, ck = Math.min(1, dt * (V.cam ? 4 : 8));
    // al cambiar de mapa la cámara salta directo (el ambiente se precalienta donde vas a estar)
    if (focus && this.ambWarm) { this.cam.x = focus.x; this.cam.y = focus.y - 8; }
    if (focus) { this.cam.x += (focus.x - this.cam.x) * ck; this.cam.y += (focus.y - 8 - this.cam.y) * ck; }
    this.shake = Math.max(0, this.shake - dt * 14);
    let cx = Math.round(Math.max(bw / 2, Math.min(MAP - bw / 2, this.cam.x)) - bw / 2 + (Math.random() - 0.5) * this.shake);
    let cy = Math.round(Math.max(bh / 2, Math.min(MAP - bh / 2, this.cam.y)) - bh / 2 + (Math.random() - 0.5) * this.shake);
    const vis = (x, y, m = 40) => x > cx - m && x < cx + bw + m && y > cy - m && y < cy + bh + m;
    g.fillStyle = "#101018"; g.fillRect(0, 0, bw, bh);
    const hi = this.hi; if (hi && !this.mapG) this.grade();
    g.drawImage(hi && this.mapG ? this.mapG : this.map.canvas, cx, cy, bw, bh, 0, 0, bw, bh);
    const X = x => Math.round(x - cx), Y = y => Math.round(y - cy);

    // charcos de mate
    for (const [x, y, r, life, big] of V.pools) { if (!vis(x, y)) continue; g.fillStyle = big ? "rgba(140,170,40,.8)" : "rgba(92,122,40,.75)"; g.beginPath(); g.ellipse(X(x), Y(y), r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#b8d86a"; for (let i = 0; i < 4; i++) { const a = this.t * 2 + i * 1.7; g.fillRect(X(x + Math.cos(a) * r * 0.5), Y(y + Math.sin(a * 1.3) * r * 0.3), 1, 1); } }
    // gemas y objetos
    for (let i = 0; i < V.gems.length; i += 3) { const x = V.gems[i], y = V.gems[i + 1], v = V.gems[i + 2]; if (!vis(x, y, 8)) continue; const s = SPR[v >= 5 ? "gem5" : v >= 2 ? "gem2" : "gem1"]; if (v >= 5) this.glow(x, y - 4, 6, "#ff5fd2", 0.4); g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h + Math.round(Math.sin(this.t * 5 + x) * 1)); }
    for (const [k, x, y, blink] of V.pickups) {
      if (!vis(x, y) || (blink && Math.floor(this.t * 8) % 2)) continue; const s = SPR[PICK_SPR[PICKS[k]]] || SPR.moneda, bob = Math.round(Math.abs(Math.sin(this.t * 4)) * 2);
      if (k >= 2) { this.glow(x, y - 4, 12, k === 2 ? "#ff8ac2" : "#7ff0ff", 0.45 + Math.sin(this.t * 5) * 0.12); g.fillStyle = k === 2 ? "rgba(255,138,194,.35)" : "rgba(127,240,255,.3)"; g.beginPath(); g.ellipse(X(x), Y(y), 9 + Math.sin(this.t * 6), 4, 0, 0, Math.PI * 2); g.fill(); }
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
      const [x, y, pct, left] = V.obj, pulse = 1 + Math.sin(this.t * 5) * 0.08; this.glow(x, y - 6, 18, "#ff5fb0", 0.35 * pulse);
      g.fillStyle = "rgba(255,95,176,.18)"; g.beginPath(); g.ellipse(X(x), Y(y), 22 * pulse, 13 * pulse, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#ff5fb0"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, 22, 13, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.ellipse(X(x), Y(y), 22, 13, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct / 100); g.stroke();
      const s = SPR.regalo; g.drawImage(s.f[0], X(x) - (s.w >> 1), Y(y) - s.h - Math.round(Math.abs(Math.sin(this.t * 3)) * 3));
      drawNum(g, left, X(x), Y(y) - 22, left <= 8 ? "#ff4a5a" : "#ffffff");
    }
    // objetivo del modo historia
    if (V.goal) this.drawGoalFloor(g, V, X, Y, vis);
    // marca donde cae la torta
    for (const [x0, y0, x, y, pct, done, r] of V.bombs) if (!done) { g.strokeStyle = "rgba(255,80,80,.7)"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x) + 0.5, Y(y) + 0.5, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); g.stroke(); }

    // entidades ordenadas por y
    const list = [];
    for (const p of this.map.props) if (vis(p.x, p.y, 50)) list.push([p.y, 0, p]);
    for (const z of V.hz) if (!z[5]) list.push([z[1] + z[2], 6, z]);
    for (const e of V.enemies) { if (e.type === 4 || e.type === 5) this.bossXY.push(e.x, e.y); if (vis(e.x, e.y)) list.push([e.y, 1, e]); }
    if (V.allies) for (const a of V.allies) if (vis(a.x, a.y)) list.push([a.y, 7, a]);
    for (const [side, p] of Object.entries(V.players)) { list.push([p.y, 2, p, side]); if (p.dg) list.push([p.dg[1], 3, p.dg]); if (p.o) for (const o of p.o) list.push([o[1], 4, o]); }
    for (const b of V.buses) list.push([b[1], 5, b]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, kind, o, side] of list) {
      if (kind === 0) { const s = SPR[o.s], q = hi && this.propG.get(o.s); g.drawImage(q ? (o.fl ? q.fl : q.f) : o.fl ? s.fl[0] : s.f[0], X(o.x) - (s.w >> 1), Y(o.y) - s.ay); continue; }
      if (kind === 1) { this.drawEnemy(g, o, X, Y); continue; }
      if (kind === 6) { this.drawHazard(g, o, X, Y); continue; }
      if (kind === 7) { this.drawAlly(g, o, X, Y); continue; }
      if (kind === 2) this.drawPlayer(g, o, side, side === V.local, X, Y, dt);
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
    for (let i = 0; i < V.eproj.length; i += 3) { const sal = V.eproj[i + 2], s = sal ? SPR.saliva : SPR.hairball; g.drawImage(s.f[0], X(V.eproj[i]) - (s.w >> 1), Y(V.eproj[i + 1]) - (s.h >> 1)); this.glow(V.eproj[i], V.eproj[i + 1], 7, sal ? "#b6ff7a" : "#ff5a5a", 0.6); }
    for (const [x0, y0, x, y, pct, done] of V.bombs) {
      if (done) continue; const k = pct / 100, bx = x0 + (x - x0) * k, by = y0 + (y - y0) * k - Math.sin(k * Math.PI) * 30;
      const s = SPR.torta; g.drawImage(s.f[0], X(bx) - (s.w >> 1), Y(by) - s.h);
    }
    // golpes, explosiones y partículas
    for (const s of this.slashes) {
      s.life -= dt; const k = 1 - s.life / 0.16;
      g.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.6})`; g.lineWidth = 2;
      const arc = (dir) => { g.beginPath(); const a0 = dir > 0 ? -1.1 : Math.PI - 1.1; g.arc(X(s.x), Y(s.y) - 6, s.r * (0.6 + k * 0.4), a0, a0 + 2.2); g.stroke(); };
      if (s.both === 2) { this.glow(s.x, s.y - 4, s.r * 0.5, "#ffd24a", 0.6 - k * 0.5); g.strokeStyle = `rgba(255,210,74,${0.9 - k * 0.6})`; g.beginPath(); g.ellipse(X(s.x), Y(s.y) - 4, s.r * (0.6 + k * 0.4), s.r * (0.6 + k * 0.4) * 0.7, 0, 0, Math.PI * 2); g.stroke(); }
      else { arc(s.f); if (s.both) arc(-s.f); }
    }
    this.slashes = this.slashes.filter(s => s.life > 0);
    for (const r of this.rings) { this.glow(r.x, r.y - 4, Math.min(44, r.r * 0.5), r.c, r.life * 2.2); r.life -= dt; const k = 1 - r.life / 0.45; g.strokeStyle = r.c; g.globalAlpha = Math.max(0, r.life * 3); g.lineWidth = 2; g.beginPath(); g.ellipse(X(r.x), Y(r.y) - 4, r.r * (0.3 + k), r.r * (0.3 + k) * 0.7, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    this.rings = this.rings.filter(r => r.life > 0);
    this.drawPops(g, dt, X, Y);
    this.drawFx(g, dt, cx, cy);
    // ambiente del mapa (en Ahorro no se mueve ni se dibuja)
    const amb = this.hi && this.em.length;
    if (amb) {
      if (this.ambWarm) { this.ambWarm = false; for (let i = 0; i < 40; i++) this.ambStep(0.1, cx, cy); }
      this.ambStep(dt, cx, cy);
    }

    // noche: oscuridad con huecos de luz
    this.lighting(V, cx, cy);
    // las del ambiente van encima de la noche: las normales un poco apagadas, las que brillan con suma de luz
    if (amb) { this.ambDim = 1 - THEMES[this.theme].night[3] * 0.45; this.ambDraw(g, 0, cx, cy); this.ambDraw(g, 1, cx, cy); }
    this.drawGlows(g, cx, cy);

    // números de daño arriba de todo
    { let j = 0; const ns = this.nums;
      // normales: chicos, suben y se apagan; críticos: el doble de grandes, de color, con un golpe de escala al salir y brillo
      for (let i = 0; i < ns.length; i++) {
        const n = ns[i]; n.life -= dt; if (n.life <= 0) { this.numFree.push(n); continue; } ns[j++] = n;
        if (!vis(n.x, n.y)) continue;
        const k = 1 - n.life / n.max, rise = (1 - (1 - k) * (1 - k)) * (n.big ? 16 : 13), y = Y(n.y) - rise, x = X(n.x);
        g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        if (n.big) { if (k < 0.5) this.glow(n.x, n.y - rise, 10, n.c, 0.45 * (1 - k)); drawNum(g, n.n, x, y, n.c, k < 0.1 ? 3 : 2); }
        else drawNum(g, n.n, x, y, n.c);
      }
      g.globalAlpha = 1; ns.length = j; }
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
    if (V.goal) this.goalArrows(g, V, X, Y);
    // indicador de la pareja fuera de cámara: insignia con su inicial y una flecha hacia donde está
    for (const side in V.players) { if (side !== V.local) this.mateBadge(g, V.players[side], X, Y); }
    // poca vida: viñeta roja que late como un corazón (más fuerte cuanto menos vida queda)
    const mine = V.players[V.local];
    if (mine && !mine.d && mine.mh > 0 && mine.hp / mine.mh < 0.3) {
      const sev = 1 - mine.hp / mine.mh / 0.3, beat = Math.pow(Math.max(0, Math.sin(this.t * 5.2)), 6);
      g.globalAlpha = Math.min(1, 0.35 + sev * 0.4 + beat * 0.25); g.drawImage(this.redLayer(), 0, 0); g.globalAlpha = 1;
    }
    if (this.hurtFlash > 0) { this.hurtFlash -= dt; g.globalAlpha = Math.min(1, this.hurtFlash * 3); g.drawImage(this.redLayer(), 0, 0); g.globalAlpha = 1; }

    const c = this.ctx; c.imageSmoothingEnabled = false;
    c.drawImage(this.buf, 0, 0, this.bw, this.bh, 0, 0, this.bw * this.s * (this.cv.width / innerWidth / 1), this.bh * this.s * (this.cv.height / innerHeight / 1));
  }

  // partículas de efectos (pool fijo): se mueven y se dibujan en la misma pasada
  drawFx(g, dt, cx, cy) {
    const P = this.fx, bw = this.bw, bh = this.bh, fr = Math.pow(0.95, dt * 60);
    let lastC = -1;
    for (let i = 0; i < P.n; i++) {
      let l = P.life[i]; if (l <= 0) continue;
      l -= dt; P.life[i] = l; if (l <= 0) continue;
      P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.vy[i] += P.gr[i] * dt; P.vx[i] *= fr;
      const px = Math.round(P.x[i] - cx), py = Math.round(P.y[i] - cy);
      if (px < -2 || py < -2 || px > bw + 2 || py > bh + 2) continue;
      if (P.c[i] !== lastC) { lastC = P.c[i]; g.fillStyle = PAL[lastC]; }
      g.globalAlpha = l / P.max[i]; const sz = P.s[i]; g.fillRect(px, py, sz, sz);
    }
    g.globalAlpha = 1;
  }
  // muerte de un gato: la silueta blanca se infla y se desvanece, con un aro que se abre
  drawPops(g, dt, X, Y) {
    for (const p of this.pops) {
      if (p.life <= 0) continue;
      p.life -= dt; if (p.life <= 0) continue;
      const k = 1 - p.life / 0.16, s = p.s, sc = 1 + k * (p.big ? 0.6 : 0.45), w = Math.round(s.w * sc), h = Math.round(s.h * sc);
      const x = X(p.x), y = Y(p.y);
      g.globalAlpha = 1 - k; g.drawImage(s.wh[0], x - (w >> 1), y - Math.round(s.ay * sc), w, h);
      g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.beginPath(); const r = 3 + k * (p.big ? 22 : 10); g.ellipse(x + 0.5, y - (s.h >> 1) + 0.5, r, r * 0.7, 0, 0, 6.2832); g.stroke();
    }
    g.globalAlpha = 1;
  }
  drawEnemy(g, o, X, Y) {
    const name = ENEMY_NAME[o.type], f = o.f, elite = f & F_ELITE;
    const s = (elite && SPR[name + "E"]) || SPR[name]; if (!s) return;
    const x = X(o.x), y = Y(o.y);
    if (name === "caja") { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x - 6, y, 12, 2); g.drawImage(f & F_FLASH ? s.wh[0] : s.f[0], x - (s.w >> 1), y - s.ay); return; }
    const tele = f & F_TELE, rush = f & F_RUSH;
    const cyc = s.anim && s.anim.caminar, n = cyc ? cyc.length : 2, step = Math.floor(this.t * (o.type === 2 || rush ? 12 : 7) * (n > 2 ? 1.6 : 1) + o.id) % n;
    const fr = tele ? 0 : cyc ? cyc[step] : step;
    const img = (f & F_FLASH) || (tele && Math.floor(this.t * 16) % 2) ? s.wh[fr] : o.fx < 0 ? s.fl[fr] : s.f[fr];
    if (elite) { const k = 1 + Math.sin(this.t * 6 + o.id) * 0.15; g.fillStyle = "rgba(255,210,74,.35)"; g.beginPath(); g.ellipse(x, y, s.w * 0.4 * k, 5 * k, 0, 0, Math.PI * 2); g.fill(); }
    // sombra suave solo para jefas y élites (con 200 gatos en pantalla, el rectángulo de siempre es bastante más barato)
    if (elite || o.type === 4 || o.type === 5) this.shadow(g, x, y, Math.round(s.w * 0.62), 0.28);
    else { g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(x - (s.w >> 2), y, s.w >> 1, 2); }
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
  drawAlly(g, o, X, Y) {
    const name = ENEMY_NAME[o.type], cfg = ALLY[name], f = o.f;
    const s = SPR[name] || SPR[ALLY_FALLBACK[cfg ? cfg.kind : "gato"]]; if (!s) return;
    const x = X(o.x), y = Y(o.y), n = s.f.length;
    this.shadow(g, x, y, Math.round(s.w * 0.62), 0.28);
    if (f & F_DOWN) {
      g.save(); g.globalAlpha = 0.6; g.translate(x, y - 4); g.rotate(-Math.PI / 2); g.drawImage(s.f[0], -(s.w >> 1), -(s.h >> 1)); g.restore();
      return;
    }
    const tele = f & F_TELE, rush = f & F_RUSH;
    const A = s.anim, cyc = A && A.caminar, at = this.ast.get(o.id);
    const fr = tele ? 0 : at !== undefined && this.t - at < 0.18 && A && A.ataque ? A.ataque[0] : cyc ? cyc[Math.floor(this.t * (rush ? 14 : 8) + o.id) % cyc.length] : Math.floor(this.t * (rush ? 14 : 8) + o.id) % n;
    const img = (f & F_FLASH) || (tele && Math.floor(this.t * 16) % 2) ? s.wh[fr] : f & F_LEFT ? s.fl[fr] : s.f[fr];
    if (rush) { const a = o.a / 10; g.fillStyle = "rgba(127,255,170,.6)"; for (let i = 1; i < 4; i++) g.fillRect(Math.round(x - Math.cos(a) * i * 5), Math.round(y - 5 - Math.sin(a) * i * 5), 2, 1); }
    g.drawImage(img, x - (s.w >> 1), y - s.ay);
    // marca de aliado: rombito verde arriba de la cabeza
    const hy = y - s.h - 4 - Math.round(Math.abs(Math.sin(this.t * 3 + o.id)) * 1);
    g.fillStyle = "#16121c"; g.fillRect(x - 2, hy - 1, 5, 4); g.fillStyle = tele ? (Math.floor(this.t * 10) % 2 ? "#ff4a5a" : "#ffd24a") : "#57e3a0"; g.fillRect(x - 1, hy, 3, 2); g.fillRect(x, hy - 1, 1, 4);
  }
  // lo que se defiende, a dónde hay que llegar y los rastros, dibujado en el piso
  drawGoalFloor(g, V, X, Y, vis) {
    const G = V.goal, pulse = 1 + Math.sin(this.t * 5) * 0.08;
    if (G.x !== null && G.r) {
      const x = X(G.x), y = Y(G.y), r = G.r;
      g.fillStyle = G.fl ? "rgba(255,74,90,.35)" : "rgba(87,227,160,.16)"; g.beginPath(); g.ellipse(x, y, r * pulse, r * 0.6 * pulse, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#16121c"; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, r + 3, (r + 3) * 0.6, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = G.hp > 50 ? "#57e3a0" : G.hp > 25 ? "#ffcf3a" : "#ff4a5a"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, r + 3, (r + 3) * 0.6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (G.hp || 0) / 100); g.stroke();
    }
    if (G.a !== null && G.k === "protect" && V.allies) { const a = V.allies.find(q => q.id === G.a); if (a) { g.strokeStyle = "rgba(87,227,160,.8)"; g.lineWidth = 1; g.beginPath(); g.ellipse(X(a.x) + 0.5, Y(a.y) + 0.5, 12 * pulse, 7 * pulse, 0, 0, Math.PI * 2); g.stroke(); } }
    if (G.to) {
      const x = X(G.to[0]), y = Y(G.to[1]), r = G.r || 24;
      g.strokeStyle = Math.floor(this.t * 4) % 2 ? "#57e3a0" : "#ffffff"; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.ellipse(x + 0.5, y + 0.5, r * pulse, r * 0.6 * pulse, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#16121c"; g.fillRect(x - 1, y - 18, 3, 18); g.fillStyle = "#57e3a0"; g.fillRect(x + 2, y - 18, 7, 5);
    }
    if (G.pts) for (const [px, py] of G.pts) {
      if (!vis(px, py)) continue; const x = X(px), y = Y(py), b = Math.floor(this.t * 6 + px) % 3;
      g.fillStyle = "rgba(255,210,74,.3)"; g.beginPath(); g.ellipse(x, y, 7 + b, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffd24a"; g.fillRect(x - 3, y - 1, 2, 2); g.fillRect(x + 1, y - 1, 2, 2); g.fillRect(x - 1, y + 1, 2, 2); g.fillRect(x - 1, y - 4 - b, 1, 1);
    }
  }
  goalArrows(g, V, X, Y) {
    const G = V.goal;
    if (G.x !== null && G.r) this.edgeArrow(g, X(G.x), Y(G.y) - 6, "#57e3a0");
    if (G.to) this.edgeArrow(g, X(G.to[0]), Y(G.to[1]) - 6, "#57e3a0");
    if (G.a !== null && V.allies) { const a = V.allies.find(q => q.id === G.a); if (a) this.edgeArrow(g, X(a.x), Y(a.y) - 6, "#7fffaa"); }
    if (G.pts && G.pts.length) {
      const me = V.players[V.local] || Object.values(V.players)[0]; let best = G.pts[0], bd = Infinity;
      if (me) for (const q of G.pts) { const d = (q[0] - me.x) ** 2 + (q[1] - me.y) ** 2; if (d < bd) { bd = d; best = q; } }
      this.edgeArrow(g, X(best[0]), Y(best[1]) - 4, "#ffd24a");
    }
  }
  drawHazard(g, z, X, Y) {
    const [k, y, h, x, dir, , len] = z, name = HAZ_ID[k], by = Y(y + h);
    const put = (sp, px) => { const s = SPR[sp]; g.drawImage(dir < 0 ? s.fl[0] : s.f[0], Math.round(px - (s.w >> 1)), by - s.h + 1); };
    const back = dir > 0 ? -1 : 1;
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(X(dir > 0 ? x - len : x), by - 1, len, 3);
    if (name === "tren") { put("locomotora", X(x + back * 30)); for (let i = 0; i < 3; i++) put("vagon", X(x + back * (60 + 42 + i * 86))); }
    else if (name === "carritos") for (let i = 0; i < 6; i++) put("carrito", X(x + back * (11 + i * 26)));
    else if (name === "trote") for (let i = 0; i < 5; i++) { const s = SPR[i % 2 ? "alumna" : "alumno"], fr = Math.floor(this.t * 10 + i) % 4; g.drawImage(dir < 0 ? s.fl[fr] : s.f[fr], Math.round(X(x + back * (10 + i * 23)) - (s.w >> 1)), by - s.h + 1); }
    else if (name === "autos") put(["auto", "auto3", "auto2"][Math.abs(y) % 3], X(x + back * 22));
    else put(name, X(x + back * (len >> 1)));
  }
  // viñeta roja precalculada (para poca vida y para el golpe recibido)
  redLayer() {
    const bw = this.bw, bh = this.bh;
    if (this.redC && this.redC.width === bw && this.redC.height === bh) return this.redC;
    const c = this.redC || (this.redC = document.createElement("canvas")); c.width = bw; c.height = bh;
    const g = c.getContext("2d"), cx = bw / 2, cy = bh / 2, gr = g.createRadialGradient(cx, cy, Math.min(bw, bh) * 0.3, cx, cy, Math.hypot(bw, bh) * 0.55);
    gr.addColorStop(0, "rgba(220,20,50,0)"); gr.addColorStop(0.55, "rgba(220,20,50,0.18)"); gr.addColorStop(1, "rgba(200,10,40,0.7)");
    g.fillStyle = gr; g.fillRect(0, 0, bw, bh);
    return c;
  }
  mateBadge(g, p, X, Y) {
    const bw = this.bw, bh = this.bh, s = this.s || 2;
    // margen para no quedar debajo del HUD (arriba: tiempo y vidas; abajo: botones y armas)
    const top = Math.ceil(78 / s), bot = Math.ceil(118 / s);
    const px = X(p.x), py = Y(p.y) - 10;
    if (px >= 4 && px <= bw - 4 && py >= top - 6 && py <= bh - bot + 6) return;
    // la insignia queda adentro y la flecha (que sale 11 px hacia la pareja) siempre entra en pantalla
    const ax = Math.round(Math.max(15, Math.min(bw - 16, px))), ay = Math.round(Math.max(top + 8, Math.min(bh - bot - 8, py)));
    const col = p.d ? (Math.floor(this.t * 6) % 2 ? "#ff4a5a" : "#ffffff") : MATE(p.c);
    const a = Math.atan2(py - ay, px - ax), pulse = p.d ? Math.round(Math.abs(Math.sin(this.t * 6))) : 0;
    // flecha de píxeles en 8 direcciones (rotar el canvas la dejaba borrosa)
    pixArrow(g, ax, ay, Math.round(a / (Math.PI / 4)) & 7, col, 7);
    // insignia con la inicial (o un ! titilando si está caído)
    const r = 5 + pulse;
    g.fillStyle = "#16121c"; g.fillRect(ax - r - 1, ay - r - 1, r * 2 + 3, r * 2 + 3);
    g.fillStyle = col; g.fillRect(ax - r, ay - r, r * 2 + 1, r * 2 + 1);
    g.fillStyle = "#16121c"; g.fillRect(ax - r + 1, ay - r + 1, r * 2 - 1, r * 2 - 1);
    glyph(g, p.d ? "!" : p.c.startsWith("thomas") ? "T" : "R", ax - 1, ay - 2, col);
  }
  edgeArrow(g, px, py, col) {
    const bw = this.bw, bh = this.bh;
    if (px >= 6 && px <= bw - 6 && py >= 6 && py <= bh - 6) return;
    const cx = bw / 2, cy = bh / 2, a = Math.atan2(py - cy, px - cx);
    const ax = Math.round(Math.max(9, Math.min(bw - 10, px))), ay = Math.round(Math.max(9, Math.min(bh - 10, py)));
    pixArrow(g, ax, ay, Math.round(a / (Math.PI / 4)) & 7, Math.floor(this.t * 4) % 2 ? col : "#ffffff", -2);
  }

  drawPlayer(g, p, side, isMe, X, Y, dt) {
    const s = SPR[p.c]; if (!s) return;
    const A = s.anim, st = this.ps(side), x = X(p.x), y = Y(p.y);
    st.act = Math.max(0, st.act - dt);
    const wasDash = st.dash > 0; st.dash = Math.max(0, st.dash - dt); if (wasDash && st.dash <= 0) st.land = 0.09; st.land = Math.max(0, st.land - dt);
    this.shadow(g, x, y, p.d ? 18 : 12, 0.35);
    if (p.d) {
      // caído: el sprite propio de caído (boca arriba) si existe; si no, el de parado acostado
      const cs = A && A.caido && SPR[A.caido];
      if (cs) g.drawImage(p.f < 0 ? cs.fl[0] : cs.f[0], x - (cs.w >> 1), y - cs.h + 2);
      else { g.save(); g.translate(x, y - 4); g.rotate(-Math.PI / 2); g.drawImage(s.f[0], -(s.w >> 1), -(s.h >> 1)); g.restore(); }
      g.strokeStyle = "#16121c"; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 16, 6, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#ff8ad8"; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 16, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.rv / 2.2)); g.stroke();
      if (Math.floor(this.t * 4) % 2) { g.fillStyle = "#ff4a5a"; g.fillRect(x, y - 19, 1, 4); g.fillRect(x, y - 14, 1, 1); }
      return;
    }
    // cuadro: esquive > golpe/lanzamiento > caminar > quieto
    let fr = 0, sq = 0, bob = 0, face = p.f;
    if (st.dash > 0 && A && A.esquive) fr = A.esquive[0];
    else if (st.act > 0 && A && A.ataque) {
      const at = A.ataque;
      fr = st.kind === "throw" ? at[st.act > 0.13 ? 0 : 1] : st.kind === "ult" ? at[st.act > 0.15 ? 0 : 1] : at[st.alt % at.length];
      if (st.kind === "slash") face = st.f;
    } else if (p.m) {
      const cyc = A ? A.caminar : [1, 2, 3, 0], i = Math.floor(this.t * 9) % cyc.length;
      fr = cyc[i];
      // squash al apoyar el pie (pasos) y un píxel arriba al cruzar las piernas
      if (i === 0 || i === 2) sq = 1; else if (i === 1) bob = 1;
    } else if (A) fr = A.quieto[0];
    if (st.land > 0) sq = 2;
    if (fr >= s.f.length) fr = 0;
    // estela del esquive: tres siluetas que se apagan
    if (st.dash > 0) {
      const n = st.tn & 3; st.tx[n] = p.x; st.ty[n] = p.y; st.tn++;
      for (let k = 1; k < Math.min(4, st.tn); k++) { const j = (st.tn - 1 - k) & 3; g.globalAlpha = 0.45 - k * 0.12; g.drawImage(s.wh[fr], X(st.tx[j]) - (s.w >> 1), Y(st.ty[j]) - s.ay); }
      g.globalAlpha = 1;
    }
    // especial listo: anillo de puntos que gira alrededor de los pies (la mitad de atrás va antes del sprite)
    const ult = p.u >= 1 && (isMe ? 1 : 0.55);
    if (ult) this.ultRing(g, x, y, MATE(p.c), ult, 0);
    const img = face < 0 ? s.fl[fr] : s.f[fr], dw = s.w + sq, dh = s.h - sq;
    const dx = x - (dw >> 1), dy = y - s.ay + sq - bob;
    g.drawImage(img, dx, dy, dw, dh);
    if (ult) { this.ultRing(g, x, y, MATE(p.c), ult, 1); if (isMe) this.glow(p.x, p.y - 4, 16, MATE(p.c), 0.3 + 0.15 * Math.sin(this.t * 6)); }
    // invulnerable: el sprite no desaparece; titila un velo blanco suave
    if (p.i && st.dash <= 0 && Math.floor(this.t * 12) % 2) { g.globalAlpha = 0.55; g.drawImage(s.wh[fr], dx, dy, dw, dh); g.globalAlpha = 1; }
    // tu pareja: flechita de su color arriba de la cabeza, con contorno para que se lea sobre cualquier piso
    if (!isMe) {
      const hy = y - s.h - 6 - Math.round(Math.abs(Math.sin(this.t * 4))); g.fillStyle = "#16121c"; g.fillRect(x - 3, hy - 1, 7, 4); g.fillRect(x - 1, hy + 3, 3, 1);
      g.fillStyle = MATE(p.c); g.fillRect(x - 2, hy, 5, 1); g.fillRect(x - 1, hy + 1, 3, 1); g.fillRect(x, hy + 2, 1, 1);
    }
    // barra de vida chiquita
    const w = 12, k = Math.max(0, p.hp / p.mh);
    g.fillStyle = "#16121c"; g.fillRect(x - w / 2 - 1, y + 3, w + 2, 3);
    g.fillStyle = k > 0.5 ? "#57e3a0" : k > 0.25 ? "#ffcf3a" : "#ff4a5a"; g.fillRect(x - w / 2, y + 4, Math.round(w * k), 1);
  }

  // intensidad de una luz en este cuadro: su k y, si su tipo titila, bajones cortos al azar más un vaivén suave
  lightK(L) {
    let k = L.kk;
    if (L.fl) { const F = this.flk; if (noise1(Math.floor(this.t * 14) + L.seed) < F.rate) k *= 1 - F.amount; else k *= 1 - F.amount * 0.2 * (0.5 + 0.5 * Math.sin(this.t * 6 + L.seed)); }
    return k;
  }
  // oscuridad de la noche con el tinte del mapa y la viñeta, dibujada una vez por mapa y tamaño de pantalla
  nightLayer() {
    const bw = this.bw, bh = this.bh, A = this.ambCfg, key = this.theme + "|" + bw + "|" + bh + "|" + this.q;
    if (key === this.nightKey) return this.nightC;
    this.nightKey = key;
    const c = this.nightC; c.width = bw; c.height = bh; const g = c.getContext("2d");
    let [r, gC, b, a] = THEMES[this.theme].night;
    if (A && A.tint && this.hi) { const t = hexRgb(A.tint.color), m = Math.min(0.5, A.tint.alpha * 2.5); r = Math.round(r + (t[0] - r) * m * 0.35); gC = Math.round(gC + (t[1] - gC) * m * 0.35); b = Math.round(b + (t[2] - b) * m * 0.35); }
    g.clearRect(0, 0, bw, bh); g.fillStyle = `rgba(${r},${gC},${b},${a})`; g.fillRect(0, 0, bw, bh);
    const v = A && this.hi ? A.vignette || 0 : 0;
    if (v > 0) {
      const cx = bw / 2, cy = bh * 0.47, R0 = Math.min(bw, bh) * 0.38, R1 = Math.hypot(bw, bh) * 0.58;
      const gr = g.createRadialGradient(cx, cy, R0, cx, cy, R1);
      gr.addColorStop(0, "rgba(4,4,12,0)"); gr.addColorStop(0.6, `rgba(4,4,12,${(v * 0.45).toFixed(3)})`); gr.addColorStop(1, `rgba(4,4,12,${Math.min(0.9, v * 1.4).toFixed(3)})`);
      g.fillStyle = gr; g.fillRect(0, 0, bw, bh);
    }
    return c;
  }
  ultRing(g, x, y, col, a, front) {
    const n = 14, rot = this.t * 2.4;
    g.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const ang = rot + i / n * 6.2832, sn = Math.sin(ang); if ((sn > 0) !== !!front) continue;
      const px = Math.round(x + Math.cos(ang) * 11), py = Math.round(y + 1 + sn * 5);
      g.fillStyle = "#16121c"; g.fillRect(px - 1, py, 3, 2); g.fillStyle = (i + Math.floor(this.t * 10)) % 3 ? col : "#ffffff"; g.fillRect(px, py, 2, 1);
    }
    g.globalAlpha = 1;
  }
  lighting(V, cx, cy) {
    const lg = this.lg, bw = this.bw, bh = this.bh;
    // "copy" reemplaza el cuadro anterior entero: noche + tinte + viñeta en un solo drawImage
    lg.globalCompositeOperation = "copy"; lg.globalAlpha = 1;
    lg.drawImage(this.nightLayer(), 0, 0);
    lg.globalCompositeOperation = "destination-out";
    const hole = (x, y, rad, k = 1) => {
      const X = x - cx, Y = y - cy; if (X < -rad || X > bw + rad || Y < -rad || Y > bh + rad || k <= 0) return;
      const s = holeSprite(rad), h = s.width >> 1;
      lg.globalAlpha = Math.min(1, k); lg.drawImage(s, X - h, Y - h);
    };
    const lights = this.map.lights;
    // k < 1 achica un poco el radio y aclara menos (con el k crudo como alfa, los mapas con luces bajas quedaban barrosos)
    for (let i = 0; i < lights.length; i++) { const L = lights[i], k = L.now = this.lightK(L); hole(L.x, L.y, k > 1 ? L.r * (1 + (k - 1) * 0.6) : L.r * (0.8 + 0.2 * k), 0.35 + 0.65 * k); }
    for (const p of Object.values(V.players)) hole(p.x, p.y - 6, 58, 0.95);
    for (const [x, y] of V.pools) hole(x, y, 22, 0.5);
    for (const r of this.rings) hole(r.x, r.y, r.r * 1.3, Math.min(1, r.life * 3));
    for (const [k, x, y] of V.pickups) if (k >= 2) hole(x, y - 4, 26, 0.8);
    for (const [x, y, r] of V.zones) hole(x, y, r, 0.5);
    if (V.obj) hole(V.obj[0], V.obj[1] - 6, 40, 0.9);
    for (const z of V.hz) { if (z[5]) continue; const cx0 = z[4] > 0 ? z[3] + 30 : z[3] - 30; hole(cx0, z[1], 60, 0.9); }
    for (let i = 0; i < V.enemies.length; i++) { const e = V.enemies[i]; if (e.f & (F_TELE | F_ELITE)) hole(e.x, e.y - 6, 22, 0.6); }
    if (V.allies) for (const a of V.allies) hole(a.x, a.y - 6, 30, 0.8);
    if (V.goal) { const G = V.goal; if (G.x !== null && G.r) hole(G.x, G.y, G.r * 2.2, 0.9); if (G.to) hole(G.to[0], G.to[1] - 8, 34, 0.8); if (G.pts) for (const [x, y] of G.pts) hole(x, y, 18, 0.7); }
    lg.globalAlpha = 1;
    this.bg.drawImage(this.lc, 0, 0);
    // tinte de color de cada luz (aditivo), con su intensidad del cuadro
    const g = this.bg; g.globalCompositeOperation = "lighter";
    for (const L of lights) { const X = L.x - cx, Y = L.y - cy; if (X < -L.r || X > bw + L.r || Y < -L.r || Y > bh + L.r) continue; const s = tintSprite(L.c, L.r), h = s.width >> 1; g.globalAlpha = Math.min(1, L.now); g.drawImage(s, X - h, Y - h); }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }

  /* ---------- ambiente: partículas del mapa (hojas, polvo, vapor, harina, chispas, insectos, luciérnagas, gotas) ---------- */
  ambStep(dt, cx, cy) {
    const bw = this.bw, bh = this.bh, va = bw * bh / AMB_SCREEN;
    for (const e of this.em) {
      let rate;
      if (e.lit) {
        let n = 0;
        for (const L of e.lit) if (L.x > cx - 24 && L.x < cx + bw + 24 && L.y > cy - 24 && L.y < cy + bh + 24) { if (n < 16) this.tmpL[n++] = L; }
        e.nv = n; rate = e.rate * n;
      } else if (e.where === "zona" && e.zone) {
        const z = e.zone; e.zx0 = Math.max(z[0], cx - 8); e.zx1 = Math.min(z[2], cx + bw + 8); e.zy0 = Math.max(z[1], cy - 8); e.zy1 = Math.min(z[3], cy + bh + 8);
        if (e.zx1 <= e.zx0 || e.zy1 <= e.zy0) { e.acc = 0; continue; }
        rate = e.rate * Math.max(0.35, Math.min(2, (e.zx1 - e.zx0) * (e.zy1 - e.zy0) / AMB_SCREEN));
      } else rate = e.rate * va;
      if (!rate) continue;
      e.acc += rate * dt * AMB_DENS;
      for (let guard = 0; e.acc >= 1 && guard < 6; guard++) { e.acc -= 1; this.ambSpawn(e, cx, cy); }
      if (e.acc > 6) e.acc = 0;
    }
    // movimiento
    const P = this.amb, t = this.t;
    for (let i = 0; i < P.n; i++) {
      let l = P.life[i]; if (l <= 0) continue;
      l -= dt; P.life[i] = l; if (l <= 0) continue;
      const k = P.k[i];
      if (k === 3) { P.vx[i] = Math.max(-18, Math.min(18, P.vx[i] + (Math.random() - 0.5) * 160 * dt)); P.vy[i] = Math.max(-18, Math.min(18, P.vy[i] + (Math.random() - 0.5) * 160 * dt)); }
      else if (k === 7) P.vy[i] += 150 * dt;
      P.x[i] += (P.vx[i] + Math.sin(t * 2.2 + P.ph[i]) * P.sw[i] * 1.6) * dt; P.y[i] += P.vy[i] * dt;
    }
  }
  ambSpawn(e, cx, cy) {
    const P = this.amb, i = P.take(), R = Math.random;
    let x, y;
    if (e.lit) { const L = this.tmpL[(R() * e.nv) | 0]; x = L.x + (R() - 0.5) * L.r * 0.9; y = L.y + (R() - 0.5) * L.r * 0.6 - 4; }
    else if (e.where === "zona" && e.zone) { x = e.zx0 + R() * (e.zx1 - e.zx0); y = e.zy0 + R() * (e.zy1 - e.zy0); }
    else { x = cx - 8 + R() * (this.bw + 16); y = cy - 12 + R() * (this.bh + 16); }
    P.x[i] = x; P.y[i] = y; P.vx[i] = rnd(e.vx); P.vy[i] = rnd(e.vy); P.life[i] = P.max[i] = rnd(e.life);
    P.s[i] = Math.round(rnd(e.size)); P.c[i] = e.ci[(R() * e.ci.length) | 0]; P.k[i] = e.k; P.b[i] = e.blend === "lighter" ? 1 : 0;
    P.a[i] = e.alpha ?? 1; P.ph[i] = R() * 6.2832; P.sw[i] = e.sway || 0;
  }
  // pass 0: partículas normales (atenuadas según lo oscura que es la noche del mapa); pass 1: las que brillan (suma de luz)
  ambDraw(g, pass, cx, cy) {
    const P = this.amb, bw = this.bw, bh = this.bh, t = this.t;
    let lastC = -1;
    if (pass) g.globalCompositeOperation = "lighter";
    for (let i = 0; i < P.n; i++) {
      const l = P.life[i]; if (l <= 0 || P.b[i] !== pass) continue;
      const x = Math.round(P.x[i] - cx), y = Math.round(P.y[i] - cy); if (x < -4 || y < -4 || x > bw + 4 || y > bh + 4) continue;
      const k = P.k[i], m = P.max[i], ph = P.ph[i];
      let a = P.a[i] * Math.min(1, l * 2, (m - l) * 3) * (pass ? 1 : this.ambDim), w = P.s[i], h = w;
      switch (k) {
        case 0: if (Math.sin(t * 5 + ph) > 0) { h = Math.max(1, w - 1); } else { w = Math.max(1, w - 1); } break; // hoja que gira
        case 1: case 5: a *= 0.6 + 0.4 * Math.sin(t * 3 + ph); break; // polvo y harina que titilan
        case 2: w = h = P.s[i] + Math.round((1 - l / m) * 3); a *= l / m; break; // vapor que crece y se disuelve
        case 3: if (Math.sin(t * 24 + ph) < -0.4) continue; break; // insecto que parpadea al pasar por la luz
        case 6: a *= 0.25 + 0.75 * Math.max(0, Math.sin(t * 2.6 + ph)); if (a > 0.5) this.glow(P.x[i], P.y[i], 5, PAL[P.c[i]], a * 0.6); break; // luciérnaga
        case 7: h = 2; break; // gota
      }
      if (a <= 0.02) continue;
      if (P.c[i] !== lastC) { lastC = P.c[i]; g.fillStyle = PAL[lastC]; }
      g.globalAlpha = a; g.fillRect(x, y, w, h);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  glow() {}
}
