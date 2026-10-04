// Mapas pregenerados en un canvas de 1024 x 1024, dibujados a partir de fotos reales de cada lugar
// (referencias en gatos-dev/refs/<mapa>/). Vista 3/4 desde el sur: las fachadas miran a cámara,
// por eso los edificios grandes van en la franja de arriba y la zona caminable empieza debajo.
import { MAP } from "./engine.js";
import { SPR } from "./sprites.js";

function seeded(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))).toString(16).padStart(2, "0"); return "#" + f(n >> 16) + f(n >> 8 & 255) + f(n & 255); };
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000;

/* ---------- temas (nombre, subtítulo, oscuridad nocturna [r, g, b, alfa]) ---------- */
export const THEMES = {
  plaza:    { name: "Plaza Mitre", sub: "Para arrancar tranqui", night: [10, 14, 34, 0.7] },
  estacion: { name: "Estación Los Polvorines", sub: "Ojo con el Belgrano Norte", night: [12, 12, 30, 0.66] },
  feria:    { name: "Feria Persa", sub: "Cajones con premios y el fletero", night: [16, 10, 34, 0.58] },
  bielli:   { name: "Team Bielli", sub: "La fila de la entrada en calor", night: [12, 12, 22, 0.34] },
  cancha:   { name: "Cancha del Trueno Verde", sub: "La cortadora del canchero", night: [8, 14, 26, 0.5] },
  tortugas: { name: "Tortugas Open Mall", sub: "Carritos del súper desbocados", night: [10, 16, 38, 0.6] },
  terrazas: { name: "Terrazas de Mayo", sub: "Autos en el estacionamiento", night: [14, 12, 32, 0.62] }
};
// Los dos mapas del modo historia quedan fuera de la lista del menú (no enumerables) hasta que engine.js
// tenga su entrada en MAPS y main.js su costo: así `THEMES[id]` funciona pero el menú no se rompe.
Object.defineProperties(THEMES, {
  abuela: { value: { name: "La casa de la abuela", sub: "San Miguel: el patio de Corbata", night: [16, 12, 30, 0.62] }, enumerable: false },
  roros:  { value: { name: "Roro's Bakery", sub: "La cocina de Rocío", night: [14, 20, 32, 0.4] }, enumerable: false }
});
export const STORY_MAPS = ["abuela", "roros"];

/* ---------- geometría que necesita engine.js (propuesta; la integra quien toca engine.js) ----------
   b: zona caminable [x0, y0, x1, y1]. rails: carriles del tren (centro del peligro, h 22).
   points: lugares con nombre para el modo historia. hz: peligro propuesto para los mapas nuevos. */
export const GEO = {
  plaza:    { b: [12, 204, MAP - 12, MAP - 12] },
  estacion: { b: [12, 100, MAP - 12, MAP - 12], rails: [488, 536] },
  feria:    { b: [12, 202, MAP - 12, MAP - 12] },
  bielli:   { b: [30, 200, MAP - 30, 984] },
  cancha:   { b: [12, 136, MAP - 12, MAP - 136] },
  tortugas: { b: [12, 404, MAP - 12, MAP - 12] },
  terrazas: { b: [12, 240, MAP - 12, MAP - 12] },
  abuela:   { b: [32, 200, 992, 856], hz: "corbata", hzEvery: 24, hzFirst: 30,
              haz: { len: 26, spd: 300, h: 9, dmg: 12, edmg: 120, warn: 1.4 },
              points: { galeria: { x: 512, y: 236 }, cucha: { x: 300, y: 650 }, porton: { x: 512, y: 850 }, limonero: { x: 220, y: 430 } } },
  roros:    { b: [24, 214, 1000, 956], hz: "bandejas", hzEvery: 26, hzFirst: 35,
              haz: { len: 30, spd: 170, h: 10, dmg: 14, edmg: 90, warn: 1.6 },
              points: { horno: { x: 180, y: 226 }, mesaTortas: { x: 800, y: 436 }, isla: { x: 512, y: 392 }, vidriera: { x: 512, y: 610 }, puerta: { x: 512, y: 950 } } }
};

/* ---------- ambiente por mapa (solo datos; lo dibuja render.js) ----------
   particles[]: kind (hoja | polvo | vapor | insecto | chispa | harina | luciernaga | gota), colors, rate (por segundo
     en una pantalla de 230 px), size [min, max] px, vx / vy [min, max] px/s, life [min, max] s, sway (vaivén en px),
     where ("pantalla" en toda la cámara | "luces" cerca de las luces de ese tipo | "zona" dentro de zone [x0, y0, x1, y1]),
     lightKind (con where "luces"), blend ("normal" | "lighter"), alpha.
   tint: gradación de color sobre el cuadro { color, alpha, blend } + vignette (0 a 1).
   light: k (multiplicador de intensidad de todas las luces), flicker { kinds, amount, rate } (qué tipos de luz titilan).
   sound: ambiente sugerido { base, layers, vol } (ids descriptivos para sfx/music). */
export const AMBIENCE = {
  plaza: {
    particles: [
      { kind: "hoja", colors: ["#c8b850", "#a89a3c", "#8a7a3a", "#d8c46a"], rate: 0.6, size: [2, 3], vx: [-14, 10], vy: [8, 18], life: [6, 10], sway: 6, where: "pantalla", blend: "normal", alpha: 0.9 },
      { kind: "insecto", colors: ["#f4f8ff"], rate: 1.2, size: [1, 1], vx: [-10, 10], vy: [-10, 10], life: [1, 2.5], sway: 4, where: "luces", lightKind: "led", blend: "lighter", alpha: 0.8 }
    ],
    tint: { color: "#3a4a8a", alpha: 0.1, blend: "soft-light" }, vignette: 0.25,
    light: { k: 1, flicker: { kinds: [], amount: 0, rate: 0 } },
    sound: { base: "plaza-noche", layers: ["colectivos-lejos-balbin", "grillos", "palomas-arrullo", "campanas-catedral-cada-minuto"], vol: 0.35 }
  },
  estacion: {
    particles: [
      { kind: "polvo", colors: ["#b8b0a0", "#d8d0c0"], rate: 0.8, size: [1, 1], vx: [-6, 6], vy: [-3, 3], life: [3, 6], sway: 2, where: "zona", zone: [0, 466, 1024, 566], blend: "normal", alpha: 0.5 },
      { kind: "insecto", colors: ["#eef6ff"], rate: 1.6, size: [1, 1], vx: [-12, 12], vy: [-12, 12], life: [0.8, 2], sway: 5, where: "luces", lightKind: "tubo", blend: "lighter", alpha: 0.8 }
    ],
    tint: { color: "#2a3a6a", alpha: 0.12, blend: "soft-light" }, vignette: 0.3,
    light: { k: 1, flicker: { kinds: ["tubo"], amount: 0.25, rate: 0.08 } },
    sound: { base: "anden-noche", layers: ["zumbido-tubos", "perro-lejos", "anuncio-anden-1-villa-rosa", "bocina-tren-lejos"], vol: 0.35 }
  },
  feria: {
    particles: [
      { kind: "polvo", colors: ["#d8c8a8", "#f2e6c8"], rate: 1.2, size: [1, 1], vx: [-4, 4], vy: [-2, 4], life: [4, 7], sway: 3, where: "luces", lightKind: "tubo", blend: "lighter", alpha: 0.45 },
      { kind: "vapor", colors: ["#f2f2f2"], rate: 0.6, size: [2, 3], vx: [-3, 3], vy: [-14, -8], life: [1.5, 2.5], sway: 3, where: "zona", zone: [40, 600, 480, 880], blend: "normal", alpha: 0.35 }
    ],
    tint: { color: "#8a5ab0", alpha: 0.08, blend: "soft-light" }, vignette: 0.25,
    light: { k: 1, flicker: { kinds: ["tubo"], amount: 0.3, rate: 0.1 } },
    sound: { base: "galpon-gente", layers: ["cumbia-de-un-puesto", "pochoclera", "pregones", "autos-balbin"], vol: 0.4 }
  },
  bielli: {
    particles: [
      { kind: "polvo", colors: ["#fff6d8", "#f2f2f2"], rate: 1.4, size: [1, 1], vx: [-3, 3], vy: [-2, 2], life: [4, 8], sway: 2, where: "luces", lightKind: "reflector", blend: "lighter", alpha: 0.5 },
      { kind: "gota", colors: ["#cfe6ff"], rate: 0.3, size: [1, 1], vx: [-8, 8], vy: [10, 30], life: [0.4, 0.8], sway: 0, where: "zona", zone: [560, 430, 820, 690], blend: "normal", alpha: 0.7 }
    ],
    tint: { color: "#f2d21e", alpha: 0.05, blend: "soft-light" }, vignette: 0.2,
    light: { k: 1.1, flicker: { kinds: ["tubo"], amount: 0.2, rate: 0.05 } },
    sound: { base: "gimnasio", layers: ["golpes-a-la-bolsa", "soga-saltando", "silbato", "musica-cuarteto-bajita", "ventilador"], vol: 0.4 }
  },
  cancha: {
    particles: [
      { kind: "insecto", colors: ["#f2f8ff"], rate: 2, size: [1, 1], vx: [-14, 14], vy: [-14, 14], life: [0.8, 2], sway: 5, where: "luces", lightKind: "torre", blend: "lighter", alpha: 0.8 },
      { kind: "hoja", colors: ["#6fbf4a", "#4f8a2c"], rate: 0.4, size: [1, 2], vx: [-10, 10], vy: [-4, 6], life: [1, 2], sway: 2, where: "pantalla", blend: "normal", alpha: 0.7 }
    ],
    tint: { color: "#1f6e45", alpha: 0.08, blend: "soft-light" }, vignette: 0.25,
    light: { k: 1, flicker: { kinds: [], amount: 0, rate: 0 } },
    sound: { base: "cancha-noche", layers: ["hinchada-lejos", "grillos", "cortadora-lejos"], vol: 0.35 }
  },
  tortugas: {
    particles: [
      { kind: "gota", colors: ["#bff4f8", "#ffffff"], rate: 3, size: [1, 1], vx: [-10, 10], vy: [-30, -10], life: [0.4, 0.8], sway: 0, where: "zona", zone: [120, 240, 940, 400], blend: "lighter", alpha: 0.7 },
      { kind: "insecto", colors: ["#fff4d0"], rate: 1.2, size: [1, 1], vx: [-10, 10], vy: [-10, 10], life: [1, 2.5], sway: 4, where: "luces", lightKind: "farol", blend: "lighter", alpha: 0.8 }
    ],
    tint: { color: "#2a6a9a", alpha: 0.1, blend: "soft-light" }, vignette: 0.25,
    light: { k: 1, flicker: { kinds: [], amount: 0, rate: 0 } },
    sound: { base: "mall-afuera", layers: ["fuentes-de-agua", "gente-terrazas", "carritos-rodando", "panamericana-lejos"], vol: 0.4 }
  },
  terrazas: {
    particles: [
      { kind: "insecto", colors: ["#eef4ff"], rate: 1.8, size: [1, 1], vx: [-12, 12], vy: [-12, 12], life: [0.8, 2], sway: 5, where: "luces", lightKind: "poste", blend: "lighter", alpha: 0.8 },
      { kind: "polvo", colors: ["#c8c0b0"], rate: 0.5, size: [1, 2], vx: [10, 30], vy: [-2, 2], life: [2, 4], sway: 1, where: "zona", zone: [0, 960, 1024, 1024], blend: "normal", alpha: 0.4 }
    ],
    tint: { color: "#c2188b", alpha: 0.06, blend: "soft-light" }, vignette: 0.3,
    light: { k: 1, flicker: { kinds: ["pantalla"], amount: 0.3, rate: 0.5 } },
    sound: { base: "estacionamiento", layers: ["autos-arrancando", "alarma-de-auto-lejos", "ruta-8", "musica-terrazas"], vol: 0.4 }
  },
  abuela: {
    particles: [
      { kind: "luciernaga", colors: ["#d8ff7a", "#f2ffb0"], rate: 0.8, size: [1, 1], vx: [-6, 6], vy: [-6, 6], life: [2, 4], sway: 8, where: "zona", zone: [32, 300, 992, 850], blend: "lighter", alpha: 0.9 },
      { kind: "insecto", colors: ["#fff0c8"], rate: 1.5, size: [1, 1], vx: [-10, 10], vy: [-10, 10], life: [0.8, 2], sway: 5, where: "luces", lightKind: "foco", blend: "lighter", alpha: 0.8 }
    ],
    tint: { color: "#b8783a", alpha: 0.08, blend: "soft-light" }, vignette: 0.35,
    light: { k: 0.9, flicker: { kinds: ["foco"], amount: 0.1, rate: 0.03 } },
    sound: { base: "barrio-noche", layers: ["grillos", "perros-del-barrio", "tele-de-la-abuela", "cadena-de-corbata"], vol: 0.4 }
  },
  roros: {
    particles: [
      { kind: "vapor", colors: ["#ffffff", "#f2f7f9"], rate: 1.2, size: [2, 4], vx: [-4, 4], vy: [-18, -8], life: [1.2, 2.2], sway: 3, where: "zona", zone: [130, 150, 230, 230], blend: "normal", alpha: 0.4 },
      { kind: "harina", colors: ["#ffffff", "#f2f7f9"], rate: 1, size: [1, 1], vx: [-5, 5], vy: [-2, 6], life: [2, 4], sway: 3, where: "zona", zone: [430, 300, 600, 420], blend: "normal", alpha: 0.7 },
      { kind: "chispa", colors: ["#ffb04a", "#ffd27a"], rate: 0.6, size: [1, 1], vx: [-6, 6], vy: [-20, -8], life: [0.4, 0.8], sway: 1, where: "luces", lightKind: "horno", blend: "lighter", alpha: 0.9 }
    ],
    tint: { color: "#7AAFC4", alpha: 0.08, blend: "soft-light" }, vignette: 0.2,
    light: { k: 1.1, flicker: { kinds: ["horno"], amount: 0.15, rate: 0.5 } },
    sound: { base: "cocina", layers: ["horno-zumbando", "batidora", "timer-del-horno", "radio-bajita"], vol: 0.4 }
  }
};

/* ---------- texto pixel ---------- */
// letra chica de 3x5 (algunas más anchas); acentos y eñe se dibujan una fila arriba
const GL = {
  A: "010 101 111 101 101", B: "110 101 110 101 110", C: "011 100 100 100 011", D: "110 101 101 101 110", E: "111 100 110 100 111",
  F: "111 100 110 100 100", G: "011 100 101 101 011", H: "101 101 111 101 101", I: "111 010 010 010 111", J: "001 001 001 101 010",
  K: "101 101 110 101 101", L: "100 100 100 100 111", M: "10001 11011 10101 10001 10001", N: "1001 1101 1011 1001 1001", O: "010 101 101 101 010",
  P: "110 101 110 100 100", Q: "010 101 101 110 011", R: "110 101 110 101 101", S: "011 100 010 001 110", T: "111 010 010 010 010",
  U: "101 101 101 101 111", V: "101 101 101 101 010", W: "10001 10001 10101 11011 10001", X: "101 101 010 101 101", Y: "101 101 010 010 010", Z: "111 001 010 100 111",
  0: "111 101 101 101 111", 1: "010 110 010 010 111", 2: "111 001 111 100 111", 3: "111 001 111 001 111", 4: "101 101 111 001 001",
  5: "111 100 111 001 111", 6: "111 100 111 101 111", 7: "111 001 010 010 010", 8: "111 101 111 101 111", 9: "111 101 111 001 111",
  ":": "0 1 0 1 0", ",": "0 0 0 1 1", ".": "0 0 0 0 1", "-": "000 000 111 000 000", "/": "001 001 010 100 100", ">": "100 010 001 010 100",
  "!": "1 1 1 0 1", "'": "1 1 0 0 0", "·": "0 0 1 0 0", " ": "00 00 00 00 00", "$": "011 110 010 011 110", "+": "000 010 111 010 000"
};
const ACC = { "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N" };
function ftext(ctx, t, x, y, col, align = "center") {
  t = t.toUpperCase();
  const gl = ch => (GL[ACC[ch] || ch] || GL[" "]).split(" ");
  let w = 0; for (const ch of t) w += gl(ch)[0].length + 1; w -= 1;
  let ox = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  ctx.fillStyle = col;
  for (const ch of t) {
    const rows = gl(ch), cw = rows[0].length;
    rows.forEach((row, ry) => { for (let i = 0; i < row.length; i++) if (row[i] === "1") ctx.fillRect(ox + i, y + ry, 1, 1); });
    if (ch === "Ñ") { ctx.fillRect(ox, y - 2, 2, 1); ctx.fillRect(ox + 2, y - 1, 2, 1); }
    else if (ACC[ch]) { ctx.fillRect(ox + cw - 2, y - 2, 1, 1); ctx.fillRect(ox + cw - 1, y - 3, 1, 1); }
    ox += cw + 1;
  }
  return w;
}
// texto con fuente del sistema pero sin suavizado (umbral de alfa), para que quede pixel
function crispText(ctx, t, x, y, col, size, o = {}) {
  const font = `${o.style || ""} ${o.weight || "bold"} ${size}px ${o.font || "Arial, Helvetica, sans-serif"}`;
  const c = document.createElement("canvas"), cg = c.getContext("2d");
  cg.font = font; const w = Math.ceil(cg.measureText(t).width) + 4, h = Math.ceil(size * 1.6) + 2;
  c.width = w; c.height = h; cg.font = font; cg.textBaseline = "middle"; cg.fillStyle = "#000"; cg.fillText(t, 2, h / 2);
  const d = cg.getImageData(0, 0, w, h), a = d.data, [R, G, B] = rgb(col), th = o.th || 110;
  for (let i = 0; i < a.length; i += 4) { const on = a[i + 3] >= th; a[i] = R; a[i + 1] = G; a[i + 2] = B; a[i + 3] = on ? 255 : 0; }
  cg.putImageData(d, 0, 0);
  const ax = o.align === "left" ? 0 : o.align === "right" ? 1 : 0.5, X = Math.round(x - 2 - (w - 4) * ax), Y = Math.round(y - h / 2);
  if (o.shadow) { const s = document.createElement("canvas"); s.width = w; s.height = h; const sg = s.getContext("2d"); sg.drawImage(c, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = o.shadow; sg.fillRect(0, 0, w, h); ctx.drawImage(s, X + 1, Y + 1); }
  ctx.drawImage(c, X, Y);
  return w - 4;
}
// relleno de polígono por líneas (sin suavizado)
function polyFill(ctx, pts, col, pat) {
  let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  if (col) ctx.fillStyle = col;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) * (bx - ax) / (by - ay)); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i]), b = Math.round(xs[i + 1]); if (b > a) { if (pat) pat(a, b, y); else ctx.fillRect(a, y, b - a, 1); } }
  }
}
const bandPts = (x0, y0, x1, y1, w) => { const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * w / 2, ny = (x1 - x0) / L * w / 2; return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]; };
// la M de Terrazas de Mayo: magenta, violeta, amarillo, verde y negro
function drawM(ctx, ox, oy, s) {
  const P = pts => pts.map(([x, y]) => [ox + x * s, oy + y * s]);
  polyFill(ctx, P([[0, 50], [0, 8], [12, 2], [12, 44]]), "#c2188b");
  polyFill(ctx, P([[0, 22], [12, 16], [12, 24], [0, 30]]), "#6a2c91");
  polyFill(ctx, P([[0, 38], [12, 32], [12, 38], [0, 44]]), "#f2d300");
  polyFill(ctx, P([[12, 2], [30, 26], [30, 44], [12, 20]]), "#6a2c91");
  polyFill(ctx, P([[12, 10], [30, 34], [30, 38], [12, 14]]), "#c2188b");
  polyFill(ctx, P([[30, 26], [48, 8], [48, 30], [30, 44]]), "#f2d300");
  polyFill(ctx, P([[48, 8], [58, 2], [58, 50], [48, 50]]), "#f2d300");
  polyFill(ctx, P([[44, 0], [58, 0], [58, 12], [48, 12]]), "#7cc242");
  polyFill(ctx, P([[12, 2], [14, 2], [30, 24], [30, 27]]), "#1a1a1a");
  polyFill(ctx, P([[46, 30], [48, 30], [48, 50], [46, 50]]), "#1a1a1a");
}

/* ---------- sprites de escenografía (se registran en SPR con prefijo m_) ---------- */
const OUT = [22, 18, 28];
function outline(c) {
  const g = c.getContext("2d"), w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h), a = d.data, src = new Uint8ClampedArray(a);
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 20;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (src[i + 3] > 20) continue;
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { a[i] = OUT[0]; a[i + 1] = OUT[1]; a[i + 2] = OUT[2]; a[i + 3] = 255; }
  }
  g.putImageData(d, 0, 0);
}
function mk(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w + 2; c.height = h + 2;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.translate(1, 1);
  draw({
    R: (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); },
    P: (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    E: (cx, cy, rx, ry, col) => { g.fillStyle = col; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1); } },
    T: (t, x, y, col, size, o) => crispText(g, t, x, y, col, size, o),
    F: (t, x, y, col, al) => ftext(g, t, x, y, col, al),
    poly: (pts, col) => polyFill(g, pts, col), g
  });
  outline(c);
  return c;
}
function flipped(c) { const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const g = o.getContext("2d"); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function white(c) { const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const g = o.getContext("2d"); g.drawImage(c, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height); return o; }
// los props anchos se cortan en rebanadas de 96 px para que render.js no los deje de dibujar en el borde de la cámara
const SLICES = {};
function reg(name, c) {
  const one = (k, cv) => { SPR[k] = { f: [cv], fl: [flipped(cv)], wh: [white(cv)], w: cv.width, h: cv.height, ay: cv.height - 1 }; };
  if (c.width <= 104) { one(name, c); return; }
  SLICES[name] = [];
  for (let sx = 0, i = 0; sx < c.width; sx += 96, i++) {
    const sw = Math.min(96, c.width - sx), s = document.createElement("canvas"); s.width = sw; s.height = c.height;
    s.getContext("2d").drawImage(c, sx, 0, sw, c.height, 0, 0, sw, c.height);
    one(`${name}_${i}`, s); SLICES[name].push({ s: `${name}_${i}`, dx: sx + (sw >> 1) - (c.width >> 1) });
  }
}

const NAV = "#1a212c";
const bag = (c, c2, c3, chain) => mk(14, 42 + chain, ({ R, P, E }) => {
  R(6, 0, 2, chain, "#8a8f96"); for (let y = 1; y < chain; y += 3) P(5, y, "#5a5f66");
  R(3, chain - 2, 8, 3, "#3a3a40");
  E(7, chain + 3, 6, 2, c); R(1, chain + 3, 12, 34, c); E(7, chain + 37, 6, 2, c);
  R(1, chain + 3, 3, 34, c2); R(10, chain + 3, 3, 34, c3); R(1, chain + 11, 12, 2, "#e8e8e8"); R(1, chain + 29, 12, 1, c3);
});
const pot = (plant) => mk(14, 16, ({ R, E, P }) => {
  R(3, 10, 8, 6, "#b0583a"); R(2, 9, 10, 2, "#c8704a"); R(9, 10, 2, 6, "#8a4028");
  if (plant === "malvon") { E(7, 6, 6, 4, "#3e7a34"); E(5, 5, 3, 2, "#5a9a48"); E(4, 3, 2.2, 2, "#e02a3a"); E(9, 2, 2.2, 2, "#e02a3a"); E(7, 5, 2, 1.6, "#ff5a6a"); P(3, 2, "#ff8a9a"); }
  else if (plant === "potus") { for (let i = 0; i < 9; i++) { const x = 1 + i * 1.5, y = 8 + Math.round(Math.sin(i) * 3); E(x, y - 3, 2, 1.6, i % 2 ? "#4a9a3a" : "#7ac04a"); } E(7, 5, 4, 3, "#3e8a34"); P(6, 4, "#a8e070"); }
  else if (plant === "helecho") { for (let i = -5; i <= 5; i++) { R(7 + i, 4 + Math.abs(i) * 0.6, 1, 6 - Math.abs(i) * 0.4, i % 2 ? "#2e7a2e" : "#4a9a3a"); } E(7, 5, 3, 2, "#3e8a34"); }
  else { for (let i = -3; i <= 3; i++) R(7 + i * 1.6, 1 + Math.abs(i), 1, 9 - Math.abs(i), i % 2 ? "#5a9a6a" : "#7ab88a"); }
});
const ITEMS = {
  // plaza
  m_platano: () => platano(false), m_platano2: () => platano(true),
  m_palmera_canaria: () => mk(36, 66, ({ R, E, P }) => {
    for (let y = 22; y < 66; y++) { const w = y > 60 ? 8 : 6, x0 = 18 - (w >> 1); R(x0, y, w, 1, "#7a5a3a"); const o = ((y >> 2) % 2) * 2; P(x0 + 1 + o, y, "#5a4028"); P(x0 + 3 - o + 1, y, "#9a7a52"); P(x0 + w - 1, y, "#4e3a26"); }
    E(18, 20, 7, 4, "#8a7040"); E(18, 19, 6, 3, "#6a5a30");
    const n = 16; for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + 0.2, len = Math.sin(a) < 0 ? 13 : 17;
      for (let t = 2; t < len; t++) { const x = 18 + Math.cos(a) * t, y = 15 + Math.sin(a) * t * 0.55 + 0.02 * t * t; R(x, y, 2, 2, t > len - 3 ? "#5aa040" : (i + (t >> 2)) % 2 ? "#3f7a2e" : "#2e5e22"); }
    }
    E(18, 15, 5, 3, "#2a4a1e"); E(17, 13, 3, 2, "#4a8a34");
  }),
  m_cedro: () => mk(44, 60, ({ R, E, P }) => {
    R(20, 50, 4, 10, "#4a3626");
    for (let k = 0; k < 7; k++) { const y = 8 + k * 6.4, rx = 5 + k * 3.1; E(22, y, rx, 4.4, k % 2 ? "#2a4436" : "#34503e"); E(22 - rx * 0.4, y - 1, rx * 0.4, 2, "#46685a"); for (const s of [-1, 1]) { P(22 + s * rx, y + 3, "#243a2e"); P(22 + s * (rx - 1), y + 4, "#243a2e"); } }
    R(21, 0, 2, 6, "#34503e"); P(21, 0, "#46685a");
  }),
  m_farol_led: () => mk(10, 38, ({ R }) => { R(4, 9, 2, 26, "#1c1e24"); R(3, 34, 4, 4, "#1c1e24"); R(1, 0, 8, 2, "#1c1e24"); R(2, 2, 6, 6, "#eaf2ff"); R(4, 2, 2, 6, "#ffffff"); R(2, 2, 1, 6, "#1c1e24"); R(7, 2, 1, 6, "#1c1e24"); R(2, 8, 6, 1, "#1c1e24"); R(4, 9, 2, 1, "#3a3e46"); }),
  m_sarmiento: () => mk(26, 76, ({ R, E, P }) => {
    R(0, 68, 26, 8, "#3a3a40"); R(0, 68, 26, 1, "#55555c"); R(2, 62, 22, 6, "#2a2a30"); R(2, 62, 22, 1, "#46464e");
    R(4, 26, 18, 36, "#1e1e24"); R(4, 26, 3, 36, "#34343c"); R(19, 26, 3, 36, "#121216");
    R(3, 23, 20, 3, "#8a3a30"); R(3, 23, 20, 1, "#b05a48"); R(2, 20, 22, 3, "#2a2a30"); R(2, 20, 22, 1, "#4a4a52");
    R(8, 34, 10, 13, "#7a5a26"); R(9, 35, 8, 11, "#a8843a"); for (let k = 0; k < 3; k++) R(10, 37 + k * 3, 6, 1, "#6a4e1e");
    R(5, 54, 16, 2, "#8a3a30");
    const B = "#43433a", BL = "#5e5e50", BD = "#2c2c24";
    R(9, 17, 3, 3, B); R(14, 17, 3, 3, B); R(9, 7, 8, 11, B); R(8, 11, 1, 7, B); R(17, 9, 1, 9, BD); R(9, 7, 2, 11, BL); R(15, 8, 2, 9, BD);
    E(13, 3.5, 2.6, 3, B); P(12, 2, BL); R(12, 6, 3, 2, B); R(15, 7, 2, 4, B); R(14, 6, 1, 1, BL);
  }),
  m_mastil_ar: () => mastil("ar"), m_mastil_ba: () => mastil("ba"),
  m_banco_plaza: () => mk(22, 12, ({ R }) => { R(0, 0, 22, 2, "#6a6f76"); R(0, 3, 22, 2, "#8a9098"); R(0, 3, 22, 1, "#aab0b8"); R(0, 6, 22, 2, "#7a8088"); R(1, 8, 2, 4, "#3a3e44"); R(19, 8, 2, 4, "#3a3e44"); R(1, 2, 1, 2, "#3a3e44"); R(20, 2, 1, 2, "#3a3e44"); }),
  m_cesto: () => mk(7, 11, ({ R, P }) => { R(0, 2, 7, 9, "#5a6068"); R(0, 2, 7, 1, "#8a9098"); for (let y = 4; y < 10; y += 2) for (let x = 1; x < 6; x += 2) P(x, y, "#3a3e44"); R(1, 0, 5, 2, "#3a3e44"); }),
  m_parada: () => mk(46, 36, ({ R, P, F }) => {
    R(2, 0, 42, 4, "#d8dce0"); R(2, 3, 42, 1, "#9aa0a6"); R(3, 4, 2, 32, "#6a6f76"); R(41, 4, 2, 32, "#6a6f76");
    R(5, 6, 30, 20, "#9cc0d0"); R(6, 7, 2, 18, "#c8e0ec"); R(14, 7, 1, 18, "#c8e0ec"); R(35, 6, 6, 20, "#2a6fb8"); R(36, 8, 4, 6, "#f2d300"); R(36, 16, 4, 8, "#e84a8a");
    R(8, 24, 26, 2, "#8a9098"); R(9, 26, 1, 6, "#4a4e56"); R(32, 26, 1, 6, "#4a4e56");
  }),
  // estación
  m_refugio: () => refugio(0), m_refugio2: () => refugio(1),
  m_refugio_atras: () => mk(104, 40, ({ R }) => {
    R(0, 0, 104, 10, "#9aa2aa"); for (let x = 2; x < 104; x += 6) R(x, 0, 1, 10, "#b8c0c8"); R(0, 9, 104, 2, "#6a727a");
    R(4, 11, 96, 22, "#c9ced3"); R(4, 11, 96, 1, "#e0e4e8"); for (let x = 28; x < 100; x += 24) R(x, 11, 1, 22, "#aab0b8");
    R(0, 4, 3, 36, NAV); R(101, 4, 3, 36, NAV); R(4, 33, 96, 2, "#8a9098");
  }),
  m_cartel_anden1: () => cartelAnden("Andén 1"), m_cartel_anden2: () => cartelAnden("Andén 2"),
  m_poste_led: () => mk(14, 62, ({ R }) => { R(6, 6, 2, 56, "#6b6f78"); R(6, 6, 1, 56, "#8a9098"); R(6, 4, 7, 2, "#6b6f78"); R(9, 4, 5, 3, "#3a3e44"); R(9, 7, 5, 1, "#eaf2ff"); R(4, 59, 6, 3, "#4a4e56"); }),
  m_ladrillo: () => mk(212, 104, ({ R, P, poly, F }) => {
    const B = "#8a5a48", BD = "#6a4234", BL = "#a06a56";
    const brick = (x0, y0, w, h) => { R(x0, y0, w, h, B); for (let y = y0 + 3; y < y0 + h; y += 4) { R(x0, y, w, 1, BD); for (let x = x0 + ((y >> 2) % 2) * 4; x < x0 + w; x += 8) P(x, y - 1, BD), P(x, y - 2, BD); } };
    brick(0, 44, 98, 56); R(0, 38, 98, 6, "#5a5a56"); R(0, 37, 98, 1, "#7a7a76");
    R(0, 46, 98, 5, "#9aa2aa"); R(0, 51, 98, 1, "#5a6068"); for (const x of [4, 48, 92]) R(x, 52, 2, 48, "#6a6f76");
    R(14, 62, 18, 34, "#3a4048"); R(16, 64, 14, 12, "#5a7080"); R(56, 64, 30, 22, "#2a3038"); R(58, 66, 26, 10, "#ffe0a8"); for (let x = 60; x < 84; x += 3) R(x, 66, 1, 10, "#3a3e44");
    brick(98, 30, 114, 70);
    poly([[98, 32], [155, 4], [212, 32]], "#5e6450"); poly([[104, 32], [155, 8], [206, 32]], B);
    for (let k = 0; k < 4; k++) poly([[100 + k * 3, 31 - k], [155, 4 + k * 1.2], [155, 6 + k * 1.2], [102 + k * 3, 33 - k]], k % 2 ? "#6e7460" : "#4e5442");
    R(110, 10, 8, 18, B); R(110, 9, 8, 2, "#5a5a56");
    for (const x of [112, 178]) { R(x - 1, 49, 16, 30, "#d8d0c0"); R(x, 50, 14, 28, "#2a3038"); R(x + 6, 50, 1, 28, "#d8d0c0"); R(x, 62, 14, 1, "#d8d0c0"); R(x + 1, 51, 4, 10, "#ffd9a0"); }
    R(145, 56, 20, 44, "#d8d0c0"); R(147, 58, 16, 42, "#5a3a26"); R(155, 58, 1, 42, "#3a2414");
    R(122, 36, 66, 11, "#f2f2ee"); R(122, 46, 66, 1, "#9a9690"); F("LOS POLVORINES", 155, 39, NAV);
    R(0, 98, 212, 6, "#9a948a"); R(0, 98, 212, 1, "#b8b2a8");
    R(186, 40, 18, 52, "#e8e6e0"); R(188, 44, 14, 30, "#9aa0a6"); for (let y = 46; y < 74; y += 3) R(188, y, 14, 1, "#c8ccd0");
  }),
  m_acceso: () => mk(152, 66, ({ R, T, F }) => {
    R(0, 0, 152, 18, "#1b6ab8"); R(0, 0, 152, 2, "#4a90e0"); R(0, 16, 152, 2, "#0e4a8a"); T("Los Polvorines", 76, 9, "#ffffff", 13);
    R(0, 18, 6, 48, "#e8ecef"); R(146, 18, 6, 48, "#d0d4d8"); R(6, 18, 140, 6, "#f2f4f6"); R(30, 20, 30, 1, "#ffffff"); R(90, 20, 30, 1, "#ffffff");
    R(6, 24, 140, 30, "#dfe3e7"); R(84, 26, 54, 9, "#1a1e24"); T("Boletería", 111, 30, "#ffffff", 10);
    R(86, 36, 50, 13, "#5a7a8a"); R(88, 37, 8, 2, "#a8c8d8"); R(86, 49, 50, 6, "#2a5aa0"); for (let x = 87; x < 136; x += 2) R(x, 50 + (x % 4 ? 0 : 2), 1, 1, "#7aa8e0");
    R(10, 26, 40, 8, "#1a1e24"); F("SALIDA", 30, 28, "#ffffff");
    for (let i = 0; i < 4; i++) { R(14 + i * 16, 44, 6, 12, "#9aa2aa"); R(14 + i * 16, 44, 6, 2, "#c8d0d8"); R(20 + i * 16, 48, 8, 1, "#c8d0d8"); }
    R(6, 55, 140, 11, "#c8c8c4"); R(40, 55, 2, 11, "#f2c200"); R(6, 55, 140, 1, "#a8a8a4");
  }),
  m_cruz: () => mk(18, 40, ({ R }) => { R(8, 14, 2, 26, "#e8e8e8"); for (let y = 16; y < 40; y += 6) R(8, y, 2, 3, "#1c1c20"); for (let k = 0; k < 15; k++) { R(1 + k, k, 3, 2, (k >> 1) % 2 ? "#d8323a" : "#f2f2f2"); R(14 - k, k, 3, 2, (k >> 1) % 2 ? "#d8323a" : "#f2f2f2"); } }),
  m_barrera: () => mk(46, 14, ({ R }) => { R(0, 2, 6, 12, "#e8e8e8"); R(1, 0, 4, 3, "#d8323a"); for (let x = 6; x < 46; x += 6) R(x, 4, 6, 3, (x / 6) % 2 ? "#d8323a" : "#f2f2f2"); }),
  // team bielli
  m_bolsa_roja: () => bag("#c8202a", "#e84a4a", "#8a1218", 16), m_bolsa_negra: () => bag("#1c1c22", "#3e3e46", "#0e0e12", 16),
  m_bolsa_roja_l: () => bag("#c8202a", "#e84a4a", "#8a1218", 44), m_bolsa_negra_l: () => bag("#1c1c22", "#3e3e46", "#0e0e12", 44),
  m_cuerdas: () => mk(86, 32, ({ R, P }) => {
    [["#d8323a", "#ff6a6a", 4], ["#f2f2f2", "#ffffff", 11], ["#2d4fb0", "#5a7ae0", 18]].forEach(([c, l, y]) => { for (let x = 0; x < 86; x++) { const s = Math.round(Math.sin(x / 85 * Math.PI) * 1); R(x, y + s, 1, 2, c); P(x, y + s, l); } });
    for (const x of [28, 57]) R(x, 5, 1, 15, "#e8e8e8");
  }),
  m_poste_ring: () => mk(8, 34, ({ R }) => { R(2, 0, 4, 34, "#1c1c20"); R(1, 2, 6, 20, "#f2d21e"); R(1, 2, 6, 1, "#fff27a"); R(5, 3, 2, 18, "#c8a810"); R(2, 30, 4, 4, "#3a3a40"); }),
  m_neumatico: () => mk(20, 10, ({ E }) => { E(10, 5, 9.5, 4.5, "#1a1a1e"); E(10, 4.5, 5, 2, "#3a3a40"); E(6, 3, 2, 1, "#4a4a52"); }),
  // tortugas
  m_sombrilla_verde: () => mk(24, 26, ({ R, E }) => { R(11, 8, 2, 16, "#e8e8e8"); E(12, 7, 12, 6, "#1e5a3a"); for (let i = 0; i < 4; i++) E(3 + i * 6, 7, 2.6, 5, i % 2 ? "#2a7048" : "#18482e"); E(12, 3, 3, 1.4, "#3a8a5a"); R(4, 20, 16, 2, "#3a3a40"); R(5, 22, 1, 3, "#2a2a30"); R(18, 22, 1, 3, "#2a2a30"); }),
  m_farol_negro: () => mk(8, 34, ({ R, E, P }) => { R(3, 7, 2, 25, "#1e2026"); E(4, 3.5, 3, 3, "#fff6dc"); P(3, 2, "#ffffff"); R(2, 31, 4, 3, "#1e2026"); R(3, 6, 2, 1, "#1e2026"); }),
  m_mesa_terraza: () => mk(26, 14, ({ R, E }) => { E(13, 5, 6, 2.4, "#e8e4dc"); R(12, 7, 2, 6, "#3a3a40"); R(9, 12, 8, 1, "#3a3a40"); R(0, 2, 5, 6, "#5a4a3a"); R(0, 8, 1, 5, "#3a3a40"); R(4, 8, 1, 5, "#3a3a40"); R(21, 2, 5, 6, "#5a4a3a"); R(21, 8, 1, 5, "#3a3a40"); R(25, 8, 1, 5, "#3a3a40"); }),
  // terrazas
  m_M_gigante: () => mk(64, 60, ({ R, g }) => { drawM(g, 2, 2, 1); R(0, 52, 64, 8, "#2a2a2e"); R(0, 52, 64, 1, "#4a4a52"); }),
  m_pantalla: () => mk(40, 38, ({ R, P }) => { R(7, 26, 3, 12, "#4a4e56"); R(30, 26, 3, 12, "#4a4e56"); R(0, 0, 40, 27, "#2a2c32"); R(2, 2, 36, 23, "#1a3a6a"); R(2, 15, 36, 10, "#3a5a3a"); R(8, 11, 18, 6, "#4a8ad8"); R(11, 8, 10, 4, "#4a8ad8"); R(12, 9, 3, 2, "#c8e8ff"); P(11, 17, "#1a1a1a"); P(23, 17, "#1a1a1a"); R(4, 4, 22, 2, "#f2d300"); R(4, 7, 12, 1, "#ffffff"); }),
  m_totem_a: () => totem("A"), m_totem_b: () => totem("B"),
  m_bolardo: () => mk(5, 8, ({ R }) => { R(0, 1, 5, 7, "#8a8f96"); R(0, 1, 5, 1, "#b8bec6"); R(0, 4, 5, 1, "#f2c200"); }),
  // feria persa
  m_cartel_horario: () => mk(104, 62, ({ R, T, F }) => {
    R(12, 40, 3, 22, "#6b6f78"); R(89, 40, 3, 22, "#6b6f78");
    R(0, 0, 104, 42, "#f4f4f0"); R(0, 0, 104, 2, "#ffffff"); R(0, 40, 104, 2, "#c8c8c4");
    T("Feria Persa", 52, 10, "#2d4fb0", 14, { font: "Georgia, 'Times New Roman', serif", style: "italic" });
    F("VIERNES, SÁBADOS,", 52, 20, "#1c2a5a"); F("DOMINGOS Y FERIADOS", 52, 27, "#1c2a5a"); F("DE 10:00 HS A 22:00 HS", 52, 34, "#d8323a");
  }),
  // casa de la abuela
  m_cucha: () => mk(32, 32, ({ R, poly, F, P }) => {
    R(3, 13, 26, 19, "#a8743f"); for (let x = 6; x < 29; x += 4) R(x, 13, 1, 19, "#8a5a2e"); R(25, 13, 4, 19, "#8a5a2e");
    poly([[0, 14], [16, 1], [32, 14]], "#b0503a"); for (let k = 0; k < 3; k++) poly([[3 + k * 3, 13 - k * 2.4], [16, 3 + k * 0.5], [16, 4 + k * 0.5], [4 + k * 3, 14 - k * 2.4]], "#8a3a28");
    R(2, 13, 28, 6, "#f2e6c8"); F("CORBATA", 16, 14, "#2a1a12");
    R(11, 21, 10, 11, "#2a1a12"); R(12, 20, 8, 1, "#2a1a12"); P(11, 21, "#8a5a2e"); P(20, 21, "#8a5a2e");
  }),
  m_limonero: () => mk(34, 42, ({ R, E, P }) => {
    R(15, 26, 4, 16, "#6b4a2f"); R(15, 26, 1, 16, "#8a6440"); R(11, 24, 5, 2, "#6b4a2f");
    E(17, 14, 15, 12, "#2e6028"); E(11, 12, 8, 7, "#3e7a34"); E(22, 10, 8, 7, "#3e7a34"); E(16, 8, 7, 5, "#5a9a48");
    [[8, 14], [13, 20], [20, 16], [25, 12], [17, 6], [11, 8], [24, 20], [6, 18]].forEach(([x, y]) => { R(x, y, 2, 2, "#f2e24a"); P(x, y, "#fff6a0"); });
  }),
  m_tender: () => mk(86, 44, ({ R, P }) => {
    R(2, 4, 3, 40, "#9a9a96"); R(0, 4, 7, 2, "#9a9a96"); R(81, 4, 3, 40, "#9a9a96"); R(79, 4, 7, 2, "#9a9a96");
    for (let x = 4; x < 82; x++) P(x, 6 + Math.round(Math.sin((x - 4) / 78 * Math.PI) * 3), "#d8d8d4");
    const sag = x => 6 + Math.round(Math.sin((x - 4) / 78 * Math.PI) * 3) + 1;
    [[10, 16, 18, "#f2f2ee"], [30, 12, 12, "#d8323a"], [46, 12, 16, "#7ec8e3"], [62, 10, 14, "#2e4a7a"]].forEach(([x, w, h, c]) => { R(x, sag(x + w / 2), w, h, c); R(x, sag(x + w / 2), 2, h, shade(c, 1.1)); R(x + w - 2, sag(x + w / 2), 2, h, shade(c, 0.8)); P(x + 2, sag(x + w / 2) - 1, "#e8c23a"); P(x + w - 3, sag(x + w / 2) - 1, "#e8c23a"); });
    R(32, sag(36) + 3, 8, 2, "#f2f2ee");
  }),
  m_reja: () => mk(96, 30, ({ R, P }) => {
    R(0, 21, 96, 9, "#a8583a"); for (let y = 24; y < 30; y += 3) R(0, y, 96, 1, "#8a4028"); R(0, 20, 96, 2, "#c8c0b0");
    R(0, 4, 96, 1, "#1c1c20"); R(0, 15, 96, 1, "#1c1c20");
    for (let x = 1; x < 96; x += 4) { R(x, 2, 1, 18, "#1c1c20"); P(x, 1, "#3a3a40"); }
  }),
  m_porton: () => mk(64, 34, ({ R, P }) => {
    R(0, 0, 3, 34, "#c8c0b0"); R(61, 0, 3, 34, "#c8c0b0"); R(3, 4, 58, 2, "#1c1c20"); R(3, 30, 58, 2, "#1c1c20"); R(3, 17, 58, 1, "#1c1c20"); R(31, 4, 2, 28, "#1c1c20");
    for (let x = 5; x < 60; x += 4) { R(x, 2, 1, 29, "#2a2a30"); P(x, 1, "#4a4a52"); }
    R(46, 12, 10, 8, "#3a3a40"); R(47, 13, 8, 2, "#5a5a62");
  }),
  m_maceta_malvon: () => pot("malvon"), m_maceta_potus: () => pot("potus"), m_maceta_helecho: () => pot("helecho"), m_maceta_aloe: () => pot("aloe"),
  m_parrilla_l: () => mk(38, 46, ({ R, P, poly }) => {
    const B = "#a8583a", BD = "#8a4028";
    R(13, 0, 12, 18, B); R(12, 0, 14, 2, "#c8c0b0"); poly([[4, 22], [13, 14], [25, 14], [34, 22]], B);
    R(0, 22, 38, 24, B); for (let y = 25; y < 46; y += 4) { R(0, y, 38, 1, BD); for (let x = (y >> 2) % 2 * 4; x < 38; x += 8) P(x, y - 1, BD); }
    R(4, 26, 30, 12, "#2a2220"); for (let x = 5; x < 34; x += 2) R(x, 30, 1, 1, "#7a7a7a"); R(5, 31, 28, 1, "#6a6a6a"); R(8, 34, 22, 3, "#c8401a"); P(12, 35, "#ffb040"); P(22, 34, "#ff8a2a");
    R(0, 38, 38, 3, "#c8c0b0");
  }),
  m_mesa_pl: () => mk(26, 16, ({ R, E }) => { E(13, 4, 12, 4, "#f2f2ee"); E(13, 3, 10, 2.6, "#ffffff"); R(4, 7, 2, 9, "#d8d8d4"); R(20, 7, 2, 9, "#d8d8d4"); R(12, 8, 2, 6, "#c8c8c4"); }),
  m_silla_pl: () => mk(12, 16, ({ R }) => { R(1, 0, 10, 7, "#f2f2ee"); R(2, 1, 8, 1, "#ffffff"); R(0, 7, 12, 3, "#e8e8e4"); R(0, 10, 2, 6, "#d8d8d4"); R(10, 10, 2, 6, "#d8d8d4"); }),
  m_galeria: () => mk(524, 46, ({ R }) => {
    R(0, 0, 524, 8, "#8a8a86"); for (let x = 0; x < 524; x += 3) R(x, 0, 1, 8, "#a8a8a4"); R(0, 8, 524, 2, "#9aa0a6"); R(0, 10, 524, 1, "#6a6f76");
    for (const x of [4, 170, 346, 512]) { R(x, 11, 8, 35, "#ece6d8"); R(x, 11, 2, 35, "#ffffff"); R(x + 6, 11, 2, 35, "#c8c0b0"); R(x - 1, 11, 10, 3, "#d8d0c0"); R(x - 1, 42, 10, 4, "#c8c0b0"); }
  }),
  m_pileta: () => mk(26, 24, ({ R, P }) => { R(0, 8, 26, 16, "#b8b4ac"); R(0, 8, 26, 2, "#d8d4cc"); R(3, 10, 20, 6, "#8a8a84"); R(4, 11, 18, 4, "#7ab0c8"); R(12, 0, 2, 8, "#9aa0a6"); R(12, 0, 6, 2, "#9aa0a6"); P(17, 3, "#7ab0c8"); R(22, 16, 2, 8, "#9a968e"); }),
  m_paraiso: () => mk(32, 46, ({ R, E, P }) => {
    R(14, 26, 4, 20, "#5a4030"); R(14, 26, 1, 20, "#7a5a40"); R(10, 44, 12, 2, "#8a8a84");
    E(16, 15, 15, 12, "#2e5a2a"); E(10, 12, 8, 7, "#3e7034"); E(22, 11, 8, 7, "#3e7034"); E(15, 8, 7, 5, "#5a8a44");
    [[8, 9], [14, 5], [20, 7], [24, 14], [9, 17]].forEach(([x, y]) => P(x, y, "#e8c870"));
  }),
  m_nispero: () => mk(48, 54, ({ R, E, P }) => {
    R(21, 32, 6, 22, "#5a4030"); R(21, 32, 2, 22, "#7a5a40"); R(16, 30, 6, 3, "#5a4030"); R(27, 28, 7, 3, "#5a4030"); R(17, 52, 14, 2, "#4a3426");
    E(24, 18, 23, 16, "#244e22"); E(14, 16, 12, 10, "#2e6028"); E(34, 15, 12, 10, "#2e6028"); E(24, 10, 14, 8, "#3e7a34"); E(16, 9, 6, 4, "#5a9a48"); E(31, 7, 6, 4, "#5a9a48"); E(38, 24, 8, 5, "#1e4420");
    [[10, 18], [18, 24], [30, 20], [36, 12], [22, 6], [40, 22], [14, 12], [28, 26]].forEach(([x, y]) => { R(x, y, 2, 2, "#f2a030"); P(x, y, "#ffd080"); });
  }),
  m_naranjo: () => mk(34, 42, ({ R, E, P }) => {
    R(15, 26, 4, 16, "#6b4a2f"); R(15, 26, 1, 16, "#8a6440");
    E(17, 14, 15, 12, "#285a24"); E(11, 12, 8, 7, "#356e2e"); E(22, 10, 8, 7, "#356e2e"); E(16, 8, 7, 5, "#4a8a3e");
    [[8, 14], [13, 20], [20, 16], [25, 12], [17, 6], [11, 8], [24, 20], [6, 18], [28, 16]].forEach(([x, y]) => { R(x, y, 2, 2, "#f28a1a"); P(x, y, "#ffc060"); });
  }),
  m_cipres: () => mk(16, 54, ({ R, E, P }) => { R(7, 48, 2, 6, "#4a3626"); for (let y = 2; y < 50; y++) { const w = Math.round(Math.sin(Math.min(1, (y + 2) / 14) * Math.PI / 2) * 6 * (1 - Math.max(0, y - 36) / 30)); R(8 - w, y, w * 2, 1, y % 5 ? "#24442c" : "#1c3824"); P(8 - w, y, "#34583c"); } }),
  m_rosal: () => mk(12, 10, ({ E, P }) => { E(6, 6, 6, 4, "#2e5a24"); E(5, 5, 3, 2, "#3e7034"); [[3, 4, "#e0304a"], [7, 3, "#ff7a9a"], [9, 6, "#e0304a"], [5, 7, "#f2f2ee"]].forEach(([x, y, c]) => { P(x, y, c); P(x + 1, y, c); P(x, y - 1, c); }); }),
  m_hamaca: () => mk(44, 40, ({ R, P }) => {
    for (let k = 0; k < 36; k++) { P(4 + k * 0.14, 4 + k, "#c8323a"); P(40 - k * 0.14, 4 + k, "#c8323a"); P(5 + k * 0.14, 4 + k, "#a02830"); P(39 - k * 0.14, 4 + k, "#a02830"); }
    R(4, 2, 36, 3, "#c8323a"); R(4, 2, 36, 1, "#e8585a");
    for (const x of [15, 29]) { R(x - 3, 5, 1, 22, "#9aa0a6"); R(x + 3, 5, 1, 22, "#9aa0a6"); R(x - 4, 27, 9, 2, x < 20 ? "#f2d300" : "#2e9ac8"); }
  }),
  m_pelopincho: () => mk(70, 30, ({ R, P }) => {
    R(0, 4, 70, 26, "#2e6ab8"); R(0, 4, 70, 3, "#5a90d8"); R(0, 27, 70, 3, "#1e4a8a"); R(4, 7, 62, 18, "#5ac8e8"); R(4, 7, 62, 2, "#2e9ac8");
    for (let i = 0; i < 14; i++) R(8 + (i * 17) % 56, 11 + (i * 5) % 12, 5, 1, "#a8ecf8"); for (const x of [0, 34, 68]) R(x, 0, 2, 30, "#c8ced4");
    R(10, 14, 6, 6, "#f2d300"); R(11, 15, 4, 4, "#5ac8e8"); P(52, 18, "#ff6a8a"); P(53, 18, "#ff6a8a");
  }),
  m_huerta: () => mk(64, 22, ({ R, P }) => {
    R(0, 8, 64, 14, "#8a6440"); R(0, 8, 64, 2, "#a87e52"); R(2, 10, 60, 10, "#4a3424"); for (let y = 11; y < 20; y += 3) R(2, y, 60, 1, "#3a2818");
    for (let x = 6; x < 60; x += 9) { R(x, 0, 1, 12, "#b8a070"); R(x - 2, 3, 5, 5, "#3e7a34"); R(x - 1, 2, 3, 3, "#5a9a48"); P(x - 2, 6, "#e0302a"); P(x + 2, 4, "#e0302a"); }
    for (let x = 4; x < 60; x += 6) { R(x, 16, 3, 2, "#5a9a48"); P(x + 1, 15, "#7ac05a"); }
  }),
  m_carretilla: () => mk(28, 16, ({ R, E }) => { R(4, 2, 18, 9, "#3a7a3a"); R(4, 2, 18, 2, "#5a9a5a"); R(6, 4, 14, 3, "#6a5a40"); R(20, 9, 8, 2, "#8a6440"); E(4, 12, 3, 3, "#1a1a1e"); E(4, 12, 1, 1, "#9aa0aa"); R(16, 11, 2, 5, "#5a5a62"); }),
  m_bici: () => mk(30, 18, ({ R, P }) => {
    const wheel = (cx) => { for (let a = 0; a < 6.28; a += 0.25) P(cx + Math.cos(a) * 5, 12 + Math.sin(a) * 5, "#1a1a1e"); P(cx, 12, "#9aa0aa"); };
    wheel(6); wheel(24); for (let k = 0; k < 10; k++) { P(6 + k, 12 - k * 0.6, "#c8202a"); P(14 + k * 0.6, 6 + k * 0.6, "#c8202a"); P(14 + k, 6, "#c8202a"); } R(12, 3, 5, 2, "#1a1a1e"); R(24, 2, 1, 6, "#9aa0aa"); R(22, 2, 5, 1, "#1a1a1e"); R(9, 18 - 18, 1, 1, "#1a1a1e");
  }),
  m_farol_jardin: () => mk(8, 22, ({ R }) => { R(3, 7, 2, 15, "#2a2a30"); R(1, 0, 6, 2, "#2a2a30"); R(1, 2, 6, 5, "#ffe6a8"); R(3, 2, 2, 5, "#fff6d8"); R(1, 7, 6, 1, "#2a2a30"); R(2, 20, 4, 2, "#2a2a30"); }),
  m_ligustro: () => mk(96, 20, ({ R, E, P }) => { R(0, 6, 96, 14, "#2e5a24"); for (let x = 2; x < 96; x += 7) E(x + 3, 7, 5, 4, (x / 7 | 0) % 2 ? "#3e7034" : "#355f2c"); for (let i = 0; i < 30; i++) P((i * 13) % 96, 4 + (i * 7) % 12, "#5a8a44"); R(0, 18, 96, 2, "#1e4018"); }),
  m_manguera_carro: () => mk(16, 16, ({ R, E }) => { R(1, 4, 2, 12, "#3a7a3a"); R(13, 4, 2, 12, "#3a7a3a"); E(8, 8, 6, 6, "#2f9a4a"); E(8, 8, 3, 3, "#1d6a32"); E(8, 8, 1.4, 1.4, "#5aba6a"); R(0, 14, 16, 2, "#2a5a2a"); }),
  // roro's
  m_bolsas_harina: () => mk(30, 22, ({ R, F }) => { for (const [x, y] of [[0, 8], [14, 8], [7, 0]]) { R(x, y, 15, 14, "#f2ece0"); R(x, y, 15, 2, "#ffffff"); R(x + 12, y, 3, 14, "#d8d0c0"); R(x + 2, y + 5, 10, 4, "#7AAFC4"); } F("000", 9, 13, "#1A3A4A"); F("000", 23, 13, "#1A3A4A"); }),
  m_cajas_torta: () => mk(26, 30, ({ R, P }) => { [[0, 18, 26, 12], [2, 8, 22, 10], [5, 0, 16, 8]].forEach(([x, y, w, h], i) => { R(x, y, w, h, i % 2 ? "#ffd0e0" : "#B8D8E8"); R(x, y, w, 2, "#ffffff"); R(x + w / 2 - 1, y, 2, h, i % 2 ? "#e84a8a" : "#7AAFC4"); P(x + w / 2 - 2, y - 1, i % 2 ? "#e84a8a" : "#7AAFC4"); P(x + w / 2 + 1, y - 1, i % 2 ? "#e84a8a" : "#7AAFC4"); }); }),
  m_estanteria: () => mk(44, 56, ({ R, P }) => {
    R(0, 0, 2, 56, "#9aa2aa"); R(42, 0, 2, 56, "#7a828a");
    for (let k = 0; k < 4; k++) { const y = 10 + k * 13; R(0, y, 44, 2, "#c8ced4"); for (let x = 3; x < 41; x += 6) { const c = ["#f2e0b0", "#e8b8c8", "#B8D8E8", "#d8a060", "#ffffff", "#8a5a3a"][(x + k * 3) % 6]; R(x, y - 8, 5, 8, c); R(x, y - 8, 5, 1, "#ffffff"); if (k === 3) R(x, y - 8, 5, 3, "#1A3A4A"); } }
    R(0, 54, 44, 2, "#5a626a");
  }),
  m_camita_juli: () => mk(26, 14, ({ R, E, P }) => { E(13, 8, 13, 6, "#7AAFC4"); E(13, 7, 10, 4, "#ffd0e0"); E(13, 7, 6, 2.6, "#ffe6ee"); P(6, 5, "#ffffff"); E(19, 9, 2, 1.4, "#e84a8a"); }),
  m_amasadora: () => mk(26, 40, ({ R, E }) => { R(2, 22, 22, 18, "#c8ced4"); R(2, 22, 3, 18, "#e8eef2"); R(19, 22, 5, 18, "#9aa2aa"); E(13, 18, 11, 5, "#d8dee2"); E(13, 17, 9, 3.4, "#f6e6c0"); R(19, 0, 5, 18, "#c8ced4"); R(10, 0, 14, 5, "#c8ced4"); R(12, 5, 2, 10, "#9aa2aa"); R(4, 30, 4, 4, "#d8323a"); R(4, 36, 4, 2, "#5aba6a"); }),
  m_exhibidora: () => mk(30, 56, ({ R, P }) => {
    R(0, 0, 30, 56, "#1A3A4A"); R(0, 0, 30, 6, "#7AAFC4"); R(3, 8, 24, 44, "#d8eef6"); R(3, 8, 3, 44, "#ffffff");
    for (let k = 0; k < 4; k++) { const y = 18 + k * 10; R(3, y, 24, 1, "#9ab8c8"); for (let x = 6; x < 26; x += 5) R(x, y - 6, 4, 6, ["#b48ad8", "#5a3020", "#ffc8d8", "#e8b860", "#f2f7f9"][(x + k) % 5]); }
    R(25, 26, 2, 10, "#c8ced4"); P(26, 2, "#ffffff");
  }),
  m_mesa_trabajo: () => mk(76, 40, ({ R, E, P }) => {
    R(0, 18, 76, 6, "#d8b88a"); R(0, 18, 76, 1, "#f2d8aa"); R(0, 24, 76, 2, "#a8885a"); R(3, 26, 3, 14, "#8a6440"); R(70, 26, 3, 14, "#8a6440"); R(3, 36, 70, 2, "#8a6440");
    R(16, 14, 16, 4, "#c8ced4"); R(22, 12, 4, 2, "#9aa2aa"); R(17, 4, 14, 9, "#f2f7f9"); R(17, 4, 14, 2, "#B8D8E8"); for (let x = 17; x < 31; x += 2) P(x, 12, "#7AAFC4"); P(22, 3, "#ffc8d8"); P(25, 3, "#ffc8d8");
    R(40, 12, 3, 6, "#e8eef2"); R(39, 10, 5, 2, "#ff8ab8"); R(46, 15, 12, 3, "#3a3a40"); for (let x = 47; x < 58; x += 3) P(x, 15, "#f2e0b0"); E(66, 15, 5, 2.4, "#e8eef2"); E(66, 14, 3, 1.4, "#b48ad8");
  }),
  m_tacho: () => mk(12, 16, ({ R }) => { R(1, 3, 10, 13, "#7AAFC4"); R(1, 3, 3, 13, "#B8D8E8"); R(0, 1, 12, 3, "#5A8FA4"); R(5, 0, 2, 1, "#5A8FA4"); }),
  m_horno: () => mk(54, 62, ({ R, P, F }) => {
    R(4, 48, 3, 14, "#8a9098"); R(47, 48, 3, 14, "#8a9098"); R(4, 54, 46, 2, "#9aa2aa"); for (let x = 8; x < 46; x += 6) R(x, 52, 4, 2, "#e8a050");
    R(0, 6, 54, 42, "#c8ced4"); R(0, 6, 3, 42, "#e8eef2"); R(48, 6, 6, 42, "#9aa2aa"); R(0, 3, 54, 4, "#9aa2aa"); R(0, 3, 54, 1, "#d8dee2");
    R(5, 12, 34, 2, "#e8eef2"); R(5, 15, 34, 28, "#2a2a30"); R(7, 17, 30, 24, "#ff8a2a"); R(7, 17, 30, 3, "#ffb04a");
    for (const y of [24, 33]) { R(7, y, 30, 1, "#6a3a1a"); for (let x = 9; x < 36; x += 6) { R(x, y - 2, 4, 2, "#f2c070"); P(x + 1, y - 2, "#fff0c0"); } }
    R(41, 12, 11, 32, "#3a3e44"); R(42, 14, 9, 7, "#1a1a1e"); F("180", 46, 15, "#ff5a3a"); for (const y of [26, 33, 40]) { R(44, y, 4, 4, "#f2f2f2"); P(46, y + 1, "#3a3e44"); }
  }),
  m_heladera: () => mk(26, 50, ({ R, P }) => {
    R(0, 0, 26, 50, "#f2f7f9"); R(20, 0, 6, 50, "#c8d8e0"); R(0, 0, 26, 1, "#ffffff"); R(0, 17, 26, 1, "#b8c8d0"); R(21, 4, 2, 10, "#9aa8b0"); R(21, 21, 2, 14, "#9aa8b0");
    R(4, 24, 9, 11, "#fffbe8"); P(6, 27, "#e84a8a"); P(8, 26, "#4a9ad8"); R(6, 30, 5, 1, "#5aa04a"); P(5, 8, "#e84a4a"); P(10, 6, "#f2d300"); P(14, 9, "#4a9ad8"); R(1, 48, 24, 2, "#9aa8b0");
  }),
  m_isla: () => mk(126, 48, ({ R, E, P }) => {
    R(0, 22, 126, 26, "#7AAFC4"); for (let x = 2; x < 124; x += 31) { R(x, 25, 28, 20, "#8FBDCE"); R(x, 25, 28, 1, "#B8D8E8"); R(x + 12, 33, 4, 1, "#1A3A4A"); } R(0, 46, 126, 2, "#5A8FA4");
    R(0, 15, 126, 8, "#f2f7f9"); R(0, 15, 126, 1, "#ffffff"); R(0, 22, 126, 1, "#B8D8E8"); for (let i = 0; i < 6; i++) R(8 + i * 19, 17 + (i % 3), 6, 1, "#dce8ee");
    R(18, 3, 4, 12, "#B8D8E8"); R(14, 1, 16, 5, "#B8D8E8"); R(14, 1, 16, 1, "#dff0f8"); R(13, 13, 18, 3, "#7AAFC4"); E(23, 12, 5, 2.6, "#d8dde2"); P(23, 7, "#9aa2aa");
    E(48, 14, 8, 3, "#e8eef2"); E(48, 13, 6, 2, "#f6e6c0"); E(70, 15, 6, 2, "#ffffff"); P(68, 13, "#ffffff"); P(76, 15, "#f6ead0"); P(78, 16, "#f6ead0");
    R(84, 13, 16, 2, "#d8b88a"); R(82, 13, 2, 2, "#b08a5a"); R(100, 13, 2, 2, "#b08a5a");
    R(104, 12, 20, 4, "#9aa2aa"); for (let x = 106; x < 122; x += 5) { R(x, 11, 4, 2, "#e0a048"); P(x + 1, 11, "#f6c878"); }
  }),
  m_mesa_tortas: () => mk(100, 46, ({ R, E, P, F }) => {
    R(0, 24, 100, 6, "#f2f7f9"); R(0, 24, 100, 1, "#ffffff"); R(0, 30, 100, 8, "#B8D8E8"); for (let x = 0; x < 100; x += 6) E(x + 3, 38, 3, 2, "#B8D8E8"); R(4, 38, 3, 8, "#d8c4a8"); R(93, 38, 3, 8, "#d8c4a8");
    R(9, 22, 20, 2, "#e8eef2"); R(17, 19, 4, 3, "#d8dee2"); R(11, 9, 16, 10, "#b48ad8"); R(11, 9, 16, 2, "#d0a8f0"); for (let x = 11; x < 27; x += 2) P(x, 18, "#ffffff"); for (let x = 12; x < 27; x += 4) { P(x, 13, "#8a4ab0"); P(x + 1, 14, "#8a4ab0"); } P(15, 8, "#8a4ab0"); P(16, 8, "#5aa04a"); P(21, 8, "#8a4ab0"); P(22, 8, "#5aa04a");
    R(36, 12, 18, 11, "#5a3020"); R(36, 12, 18, 2, "#3a1a10"); for (let x = 37; x < 54; x += 3) R(x, 14, 1, 2 + (x % 2) * 2, "#3a1a10"); P(40, 11, "#d8323a"); P(46, 11, "#d8323a"); P(51, 11, "#d8323a"); R(34, 23, 22, 1, "#e8eef2");
    R(62, 14, 18, 9, "#f2f7f9"); R(65, 7, 12, 7, "#ffc8d8"); R(65, 7, 12, 1, "#ffe0ea"); for (let x = 62; x < 80; x += 3) P(x, 14, "#7AAFC4"); P(70, 5, "#ffe066"); P(71, 4, "#ffe066");
    E(89, 21, 8, 3, "#e8eef2"); E(89, 19, 7, 3, "#e8b860"); E(89, 18, 5, 1.6, "#f2cc7a");
  }),
  m_torta_mama: () => mk(28, 24, ({ R, P, F, E }) => {
    E(14, 21, 13, 2.4, "#e8eef2"); R(2, 8, 24, 13, "#ffffff"); R(2, 8, 24, 2, "#ffd0e0"); for (let x = 2; x < 26; x += 2) { P(x, 20, "#ff8ab8"); P(x + 1, 7, "#ff8ab8"); }
    F("MAMÁ", 14, 12, "#e84a8a"); R(13, 1, 1, 6, "#7AAFC4"); P(13, 0, "#ffd24a");
  }),
  m_vidriera: () => mk(132, 46, ({ R, P, E }) => {
    R(0, 26, 132, 20, "#7AAFC4"); R(0, 26, 132, 2, "#B8D8E8"); for (let x = 4; x < 130; x += 32) R(x, 30, 28, 13, "#8FBDCE"); R(0, 44, 132, 2, "#5A8FA4");
    R(0, 24, 132, 2, "#f2f7f9"); R(2, 8, 128, 16, "#d8eef6"); R(2, 15, 128, 1, "#b8d0da"); R(2, 8, 128, 1, "#ffffff");
    for (let x = 6; x < 128; x += 14) { const k = (x / 14 | 0) % 4; if (k === 0) { R(x, 18, 8, 5, "#b48ad8"); R(x, 18, 8, 1, "#d0a8f0"); } else if (k === 1) { for (let i = 0; i < 3; i++) { R(x + i * 3, 21, 3, 2, "#e0a048"); P(x + i * 3 + 1, 21, "#f6c878"); } } else if (k === 2) { R(x, 18, 8, 5, "#5a3020"); P(x + 3, 17, "#d8323a"); } else { E(x + 4, 21, 4, 2, "#e8b860"); } }
    for (let x = 8; x < 128; x += 12) { E(x + 3, 12, 3, 1.6, (x / 12 | 0) % 2 ? "#c89058" : "#f2e0b0"); P(x + 2, 11, "#ffffff"); }
    for (let x = 10; x < 128; x += 26) { R(x, 9, 1, 6, "#ffffff"); R(x + 1, 9, 1, 3, "#ffffff"); }
    R(110, 0, 18, 8, "#1A3A4A"); R(112, 1, 7, 3, "#7AE0A0"); R(120, 2, 6, 5, "#2a5060"); E(96, 6, 3, 2, "#d8b040"); P(96, 3, "#d8b040");
  }),
  m_mesita: () => mk(22, 18, ({ R, E, P }) => { E(11, 4, 10, 3, "#f2f7f9"); E(11, 3.4, 8, 2, "#ffffff"); R(10, 6, 2, 9, "#1A3A4A"); R(6, 15, 10, 2, "#1A3A4A"); R(7, 0, 3, 3, "#ffffff"); P(10, 1, "#ffffff"); P(8, 0, "#7a4a2a"); }),
  m_silla_cafe: () => mk(12, 18, ({ R }) => { R(1, 0, 10, 2, "#5A8FA4"); R(1, 0, 1, 8, "#5A8FA4"); R(10, 0, 1, 8, "#5A8FA4"); R(2, 3, 8, 1, "#5A8FA4"); R(0, 8, 12, 3, "#7AAFC4"); R(1, 11, 1, 7, "#5A8FA4"); R(10, 11, 1, 7, "#5A8FA4"); }),
  m_planta: () => mk(18, 28, ({ R, E, P }) => { R(4, 18, 10, 10, "#f2f7f9"); R(4, 18, 10, 2, "#ffffff"); R(11, 20, 3, 8, "#d8e4ea"); E(6, 10, 5, 4, "#2e7a3e"); E(12, 8, 5, 4, "#3e8a4a"); E(9, 4, 4, 3, "#4a9a5a"); E(9, 14, 6, 3, "#2a6a36"); P(5, 9, "#6ac07a"); P(12, 6, "#6ac07a"); }),
  m_pizarron: () => mk(50, 46, ({ R, F }) => { R(4, 30, 3, 16, "#8a6440"); R(43, 30, 3, 16, "#8a6440"); R(0, 0, 50, 32, "#b08a5a"); R(2, 2, 46, 28, "#2a3a34"); F("HOY", 25, 4, "#f2f2ee"); F("TORTAS", 25, 11, "#B8D8E8"); F("MEDIALUNAS", 25, 17, "#f2f2ee"); F("BUDINES", 25, 23, "#ffc8d8"); }),
  m_carro_bandejas: () => mk(30, 46, ({ R, E, P }) => {
    R(1, 0, 2, 40, "#aab0b8"); R(27, 0, 2, 40, "#8a9098"); R(1, 0, 28, 2, "#c8ced4");
    for (let k = 0; k < 6; k++) { const y = 5 + k * 6; R(3, y, 24, 1, "#9aa2aa"); for (let x = 5; x < 26; x += 5) { R(x, y - 2, 4, 2, k % 2 ? "#e0a048" : "#f2e0b0"); P(x + 1, y - 2, "#fff0c0"); } }
    E(4, 43, 2, 2, "#2a2a30"); E(26, 43, 2, 2, "#2a2a30");
  })
};
function platano(otono) {
  const L = otono ? ["#6a6a2a", "#8a8a34", "#a89a3c", "#c8b850"] : ["#355a24", "#467030", "#5a863a", "#74a046"];
  return mk(34, 46, ({ R, E, P }) => {
    R(15, 26, 5, 20, "#9c9878"); R(15, 26, 2, 20, "#c4bf9c"); R(19, 26, 1, 20, "#77735a");
    [[16, 29], [18, 33], [15, 37], [17, 41], [18, 30], [16, 44]].forEach(([x, y], i) => P(x, y, i % 2 ? "#e2dcc0" : "#6e6a52"));
    R(13, 44, 9, 2, "#8a8668"); R(12, 24, 4, 2, "#9c9878"); R(19, 22, 4, 2, "#9c9878");
    E(17, 16, 16, 12, L[0]); E(10, 15, 9, 8, L[1]); E(24, 14, 9, 8, L[1]); E(17, 10, 11, 8, L[2]); E(12, 11, 5, 4, L[3]); E(21, 7, 5, 3, L[3]); E(26, 19, 6, 4, L[0]); E(9, 20, 5, 3, L[0]);
    for (let i = 0; i < 14; i++) { const x = 4 + (i * 7) % 26, y = 6 + (i * 5) % 18; if ((x - 17) ** 2 / 200 + (y - 15) ** 2 / 110 < 0.9) P(x, y, i % 3 ? L[3] : L[1]); }
  });
}
function mastil(kind) {
  return mk(18, 100, ({ R, P }) => {
    R(3, 2, 3, 96, "#c8ccd2"); R(3, 2, 1, 96, "#eef0f4"); R(3, 0, 3, 2, "#d8a830"); R(1, 96, 7, 4, "#9a9690");
    if (kind === "ar") for (let i = 0; i < 18; i++) { const dy = Math.round(Math.sin(i * 0.5) * 1.4); R(6 + i, 4 + dy, 1, 4, "#74acdf"); R(6 + i, 8 + dy, 1, 4, "#ffffff"); R(6 + i, 12 + dy, 1, 4, "#74acdf"); if (i >= 8 && i <= 9) R(6 + i, 9 + dy, 1, 2, "#f2c230"); }
    else for (let k = 0; k < 22; k++) { const dx = Math.round(Math.sin(k * 0.45) * 1.2); R(6 + dx, 4 + k, 3, 1, "#2f8a3a"); R(9 + dx, 4 + k, 1, 1, k < 8 ? "#f2c230" : "#e05a2a"); R(10 + dx, 4 + k, 3, 1, "#3a6ad8"); }
  });
}
function refugio(v) {
  return mk(104, 58, ({ R, P, T, F }) => {
    R(0, 0, 104, 3, "#2a3038"); R(0, 3, 104, 1, "#c8d0d8");
    R(2, 4, 100, 13, NAV); R(2, 4, 100, 1, "#2e3a4c");
    if (v === 0) T("Los Polvorines", 52, 10, "#ffffff", 10); else T("Andén 1", 52, 10, "#ffffff", 10);
    R(2, 17, 100, 5, "#1b6ab8"); F(v === 0 ? ">> TRENES A VILLA ROSA" : "PRÓX. ING. P. NOGUÉS", 52, 17, "#ffffff");
    R(4, 22, 96, 20, "#dfe3e7"); for (let y = 24; y < 41; y += 3) for (let x = 6; x < 98; x += 3) P(x, y, "#b8c0c8");
    const chev = (cx, cy) => { for (let k = 0; k < 6; k++) { R(cx + k, cy - 6 + k, 2, 2, "#2a56b8"); R(cx + k, cy + 6 - k, 2, 2, "#2a56b8"); } };
    chev(38, 31); chev(48, 31);
    R(0, 4, 3, 54, NAV); R(101, 4, 3, 54, NAV); R(1, 4, 1, 54, "#2e3a4c");
    for (let x = 5; x < 99; x += 8) { R(x, 38, 7, 6, "#1f4fb0"); R(x, 38, 7, 1, "#4a7ae0"); R(x, 44, 7, 3, "#163a86"); }
    for (let x = 12; x < 99; x += 16) R(x, 39, 1, 6, "#aab0b8");
    R(10, 47, 2, 9, "#5a6068"); R(92, 47, 2, 9, "#5a6068"); R(51, 47, 2, 9, "#5a6068");
  });
}
function cartelAnden(t) { return mk(30, 42, ({ R, T }) => { R(14, 14, 2, 28, NAV); R(0, 0, 30, 14, NAV); R(0, 0, 30, 1, "#2e3a4c"); T(t, 15, 7, "#ffffff", 9); R(12, 40, 6, 2, "#3a3e44"); }); }
function totem(l) { return mk(12, 36, ({ R, T, F }) => { R(1, 0, 10, 32, "#5a2d82"); R(1, 0, 10, 1, "#8a5ab8"); R(9, 1, 2, 31, "#40205e"); T(l, 6, 8, "#ffffff", 11); R(3, 15, 6, 1, "#ffffff"); R(3, 32, 6, 4, "#3a3a40"); }); }
function ensureSprites() {
  if (SPR.m_platano) return;
  for (const [k, fn] of Object.entries(ITEMS)) reg(k, fn());
}

/* ---------- construcción de cada mapa ---------- */
export function buildMap(theme) {
  ensureSprites();
  const c = document.createElement("canvas"); c.width = MAP; c.height = MAP;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const r = seeded(theme.length * 977 + 13);
  const props = [], lights = [];
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P1 = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const noise = (cols, n, x0 = 0, y0 = 0, w = MAP, h = MAP, size = 1) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x0 + Math.floor(r() * w), y0 + Math.floor(r() * h), size, size); } };
  const tiles = (x, y, w, h, base, line, step = 8, var2) => {
    g.fillStyle = base; g.fillRect(x, y, w, h);
    for (let ty = y; ty < y + h; ty += step) for (let tx = x; tx < x + w; tx += step) if (var2 && r() < 0.12) { g.fillStyle = var2; g.fillRect(tx + 1, ty + 1, step - 1, step - 1); }
    g.fillStyle = line;
    for (let tx = x; tx <= x + w; tx += step) g.fillRect(tx, y, 1, h);
    for (let ty = y; ty <= y + h; ty += step) g.fillRect(x, ty, w, 1);
  };
  const disc = (cx, cy, rad, col, ry = rad) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.floor(rad * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } };
  const text = (t, x, y, col, size = 16, font = "Arial") => { g.fillStyle = col; g.font = `bold ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y); };
  const T = (t, x, y, col, size, o) => crispText(g, t, x, y, col, size, o);
  const F = (t, x, y, col, al) => ftext(g, t, x, y, col, al);
  const poly = (pts, col, pat) => polyFill(g, pts, col, pat);
  // patrón de baldosas para rellenar polígonos (cada baldosa con su leve variación)
  const tilePat = (cols, joint, step = 8, ox = 0, oy = 0) => (a, b, y) => {
    if (((y - oy) % step + step) % step === 0) { g.fillStyle = joint; g.fillRect(a, y, b - a, 1); return; }
    const ty = Math.floor((y - oy) / step);
    for (let x = a; x < b;) { const tx = Math.floor((x - ox) / step), end = Math.min(b, ox + (tx + 1) * step); g.fillStyle = cols[hash(tx, ty) % cols.length]; g.fillRect(x, y, end - x, 1); x = end; }
    g.fillStyle = joint; for (let x = ox + Math.ceil((a - ox) / step) * step; x < b; x += step) g.fillRect(x, y, 1, 1);
  };
  const street = () => {
    g.fillStyle = "#2f3138"; g.fillRect(0, 0, MAP, 56); g.fillRect(0, MAP - 56, MAP, 56); g.fillRect(0, 0, 56, MAP); g.fillRect(MAP - 56, 0, 56, MAP);
    g.fillStyle = "#d8c46a"; for (let i = 60; i < MAP - 60; i += 24) { g.fillRect(i, 27, 12, 2); g.fillRect(i, MAP - 29, 12, 2); g.fillRect(27, i, 2, 12); g.fillRect(MAP - 29, i, 2, 12); }
    tiles(56, 56, MAP - 112, 22, "#a39e92", "#8f8a7e", 11); tiles(56, MAP - 78, MAP - 112, 22, "#a39e92", "#8f8a7e", 11);
    tiles(56, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11); tiles(MAP - 78, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11);
  };
  const road = (y, h) => { g.fillStyle = "#34353b"; g.fillRect(0, y, MAP, h); noise(["#3c3d44", "#2c2d33"], 3000, 0, y, MAP, h); g.fillStyle = "#d8c46a"; for (let i = 0; i < MAP; i += 24) g.fillRect(i, y + (h >> 1) - 1, 12, 2); };
  const asphalt = (x, y, w, h, base = "#3a3c40") => { R(x, y, w, h, base); noise([shade(base, 1.12), shade(base, 0.88)], Math.round(w * h / 18), x, y, w, h); };
  const sky = h => { g.fillStyle = "#151733"; g.fillRect(0, 0, MAP, h); noise(["#ffffff", "#c9d4ff", "#8a90c0"], 120, 0, 0, MAP, h * 0.7); };
  const nightSky = h => { [["#0e1230", 0], ["#141a3c", 0.4], ["#1c2450", 0.7], ["#262c58", 0.88]].forEach(([c0, k]) => R(0, Math.round(h * k), MAP, h - Math.round(h * k), c0)); noise(["#ffffff", "#c9d4ff", "#8a90c0"], 70, 0, 0, MAP, h * 0.5); };
  const free = (x, y, pad = 18) => props.every(p => Math.abs(p.x - x) > pad || Math.abs(p.y - y) > pad);
  const shadow = (x, y, rx, ry = Math.max(2, rx >> 2)) => { g.fillStyle = "rgba(0,0,0,.22)"; for (let k = -ry; k <= ry; k++) { const w = Math.floor(rx * Math.sqrt(1 - (k * k) / (ry * ry))); g.fillRect(x - w, y + k, w * 2 + 1, 1); } };
  const put = (s, x, y, o = {}) => {
    x = Math.round(x); y = Math.round(y);
    if (o.sh) shadow(x, y, o.sh);
    if (SLICES[s]) SLICES[s].forEach(q => props.push({ s: q.s, x: x + q.dx, y })); else props.push(o.fl ? { s, x, y, fl: true } : { s, x, y });
  };
  const light = (x, y, rad, col, kind, k) => { const L = { x: Math.round(x), y: Math.round(y), r: rad, c: col }; if (kind) L.kind = kind; if (k !== undefined) L.k = k; lights.push(L); };
  const crosswalk = (x, y, w, h, vertical) => { g.fillStyle = "#e8e8e2"; if (vertical) for (let k = 0; k < h; k += 6) g.fillRect(x, y + k, w, 3); else for (let k = 0; k < w; k += 6) g.fillRect(x + k, y, 3, h); };
  // frente de local con piso alto, toldo y vidriera iluminada
  const front = (x0, x1, base, h, i, pal) => {
    const col = pal[i % pal.length], top = base - h, aw = ["#c8323a", "#2e5fa8", "#2f8a4a", "#e8a030", "#8a3a8a"][i % 5];
    R(x0, top, x1 - x0, h, col); R(x0, top, x1 - x0, 3, shade(col, 1.12)); R(x0, top + 3, x1 - x0, 1, shade(col, 0.78)); R(x1 - 2, top, 2, h, shade(col, 0.85));
    for (let x = x0 + 8; x + 12 < x1 - 4; x += 20) { R(x, top + 10, 11, 14, "#252a38"); R(x - 1, top + 9, 13, 1, shade(col, 1.15)); if (r() < 0.45) R(x + 1, top + 11, 9, 12, "#ffd9a0"); R(x + 5, top + 10, 1, 14, "#1a1e28"); R(x, top + 24, 11, 1, shade(col, 0.75)); }
    R(x0 + 3, base - 30, x1 - x0 - 6, 30, "#2a2e38"); R(x0 + 5, base - 25, x1 - x0 - 10, 23, "#ffe2b0"); for (let x = x0 + 5; x < x1 - 5; x += 18) R(x, base - 25, 1, 23, "#5a5048");
    for (let x = x0 + 2; x < x1 - 2; x += 6) R(x, base - 34, Math.min(6, x1 - 2 - x), 7, ((x - x0) / 6 | 0) % 2 ? aw : "#f2f2ee");
    R(x0 + 2, base - 27, x1 - x0 - 4, 1, shade(aw, 0.6));
    light((x0 + x1) / 2, base - 8, 46, "#ffd9a0", "vidriera", 0.7);
  };

  if (theme === "plaza") {
    // Plaza Bartolomé Mitre (San Miguel), renovada en 2020. Enderezada para la vista 3/4: la catedral San Miguel
    // Arcángel arriba, mirando a la plaza por Belgrano; Av. Balbín abajo; Sarmiento a la izquierda y Perón a la derecha.
    const cx = 512, cy = 616;
    nightSky(160);
    [[0, 120, 96], [120, 246, 80], [246, 380, 104], [644, 772, 90], [772, 900, 108], [900, 1024, 84]].forEach(([x0, x1, h], i) => front(x0, x1, 200, h, i, ["#c9b8a0", "#b8a48c", "#d6c8b0", "#a89c8c", "#c2b29a", "#d0c0a8"]));
    // la catedral: fachada crema, torre con reloj y aguja de pizarra
    const C = "#c6ae83", CL = "#dcc8a0", CS = "#a8916a", CD = "#8a7552", W = "#6b3a1e", WD = "#4a2812", base = 200;
    poly([[cx - 122, base], [cx - 122, base - 50], [cx - 42, base - 82], [cx - 42, base]], C);
    poly([[cx + 42, base], [cx + 42, base - 82], [cx + 122, base - 50], [cx + 122, base]], C);
    poly([[cx + 90, base], [cx + 90, base - 63], [cx + 122, base - 50], [cx + 122, base]], CS);
    R(cx - 42, base - 104, 84, 104, C); R(cx + 30, base - 104, 12, 104, CS);
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 80; k++) { const x = s < 0 ? cx - 122 + k : cx + 122 - k, y = base - 50 - k * 32 / 80; R(x, y - 2, 1, 3, CL); if (k % 7 === 3) { P1(x, y + 3, CD); P1(x + 1, y + 2, CD); P1(x + 2, y + 2, CD); P1(x + 3, y + 3, CD); P1(x, y + 4, CD); P1(x + 3, y + 4, CD); } }
      R(cx + s * 122 - (s > 0 ? 5 : 0), base - 52, 5, 52, s < 0 ? CL : CS);
      R(cx + s * 80 - 9, base - 66, 18, 2, CL);
      const wx = cx + s * 80; R(wx - 6, base - 62, 12, 16, CL); R(wx - 5, base - 60, 10, 14, "#34465a"); disc(wx, base - 60, 5, "#34465a", 3); R(wx, base - 60, 1, 14, "#22303e"); P1(wx - 3, base - 57, "#5a7894");
      poly([[wx - 14, base - 30], [wx, base - 40], [wx + 14, base - 30]], CL); R(wx - 11, base - 30, 22, 30, CL); R(wx - 8, base - 24, 16, 24, W); disc(wx, base - 24, 8, W, 5); R(wx - 8, base - 24, 16, 1, W);
      for (let x = wx - 6; x < wx + 8; x += 4) R(x, base - 26, 1, 26, WD); R(wx - 8, base - 2, 16, 2, WD);
    }
    R(cx - 44, base - 107, 88, 3, CL); R(cx - 44, base - 104, 88, 1, CD);
    for (let x = cx - 40; x < cx + 38; x += 7) { P1(x, base - 99, CD); P1(x + 1, base - 100, CD); P1(x + 2, base - 100, CD); P1(x + 3, base - 99, CD); R(x, base - 98, 1, 2, CD); R(x + 3, base - 98, 1, 2, CD); }
    R(cx - 44, base - 100, 5, 100, CL); R(cx + 39, base - 100, 5, 100, CS);
    R(cx - 122, base - 44, 244, 2, CL); R(cx - 122, base - 42, 244, 1, CD);
    // ventanal y portal central
    R(cx - 12, base - 86, 24, 34, CL); disc(cx, base - 86, 12, CL, 9);
    R(cx - 10, base - 84, 20, 30, "#34465a"); disc(cx, base - 84, 10, "#34465a", 8); R(cx - 1, base - 92, 1, 38, "#22303e"); R(cx - 10, base - 70, 20, 1, "#22303e"); P1(cx - 6, base - 80, "#5a7894"); P1(cx + 4, base - 66, "#5a7894");
    poly([[cx - 28, base - 36], [cx, base - 52], [cx + 28, base - 36]], CL); poly([[cx - 22, base - 37], [cx, base - 48], [cx + 22, base - 37]], C);
    R(cx - 18, base - 36, 36, 36, CL); R(cx - 16, base - 34, 2, 34, CS); R(cx + 14, base - 34, 2, 34, CS);
    R(cx - 12, base - 28, 24, 28, W); disc(cx, base - 28, 12, W, 7); R(cx - 12, base - 28, 24, 1, W);
    for (let x = cx - 9; x < cx + 12; x += 4) R(x, base - 30, 1, 30, WD); R(cx, base - 34, 1, 34, WD); R(cx - 12, base - 2, 24, 2, WD);
    // torre: campanario, reloj y aguja
    const tx = cx - 21;
    R(tx, base - 152, 42, 48, C); R(tx, base - 152, 3, 48, CL); R(tx + 36, base - 152, 6, 48, CS);
    R(cx - 12, base - 126, 24, 22, CL); disc(cx, base - 115, 9, CD); disc(cx, base - 115, 8, "#f4f0e4");
    R(cx, base - 121, 1, 6, "#2a2620"); R(cx, base - 115, 5, 1, "#2a2620"); for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) P1(cx + dx, base - 115 + dy, "#5a5248");
    for (const s of [-1, 1]) { const ax = cx + s * 8; R(ax - 4, base - 148, 8, 18, "#2a2620"); disc(ax, base - 148, 4, "#2a2620", 3); R(ax - 5, base - 130, 10, 2, CL); }
    R(cx - 2, base - 148, 4, 18, C);
    R(tx - 3, base - 156, 48, 4, CL); R(tx - 3, base - 152, 48, 1, CD);
    R(tx - 3, base - 162, 5, 6, C); R(tx + 40, base - 162, 5, 6, CS);
    for (let y = 4; y <= base - 156; y++) { const hw = Math.round(19 * (y - 4) / (base - 160)); R(cx - hw, y, hw * 2 + 1, 1, "#4c4640"); R(cx + Math.round(hw * 0.4), y, Math.max(1, hw - Math.round(hw * 0.4) + 1), 1, "#3a3430"); P1(cx - Math.round(hw * 0.35), y, "#6a625a"); }
    for (const s of [-1, 1]) poly([[cx + s * 5, 30], [cx + s * 8, 24], [cx + s * 11, 30]], "#6a625a");
    R(cx, 0, 1, 5, "#c8c0a8"); R(cx - 1, 1, 3, 1, "#c8c0a8");
    noise([CS, "#b89f76"], 140, cx - 120, base - 98, 240, 96);
    light(cx, base - 30, 120, "#ffd9a0", "reflector", 0.8); light(cx, base - 115, 22, "#fff4d8", "reloj");
    // vereda de enfrente, escalinata, Belgrano y vereda de la plaza
    tiles(0, 200, MAP, 14, "#b9b1a4", "#a49c90", 7);
    R(cx - 60, 200, 120, 3, "#e0d6c2"); R(cx - 64, 203, 128, 3, "#c4baa4"); for (let x = cx - 64; x <= cx + 64; x += 16) { R(x, 206, 2, 6, "#3a3a40"); if (x < cx + 64) for (let k = 2; k < 16; k += 2) P1(x + k, 208 + Math.round(Math.sin(k / 16 * Math.PI) * 2), "#5a5a62"); }
    asphalt(0, 214, MAP, 46, "#3f4140"); for (let x = 8; x < MAP; x += 26) R(x, 236, 12, 2, "#d8d0b0");
    crosswalk(50, 216, 4, 42, true); crosswalk(964, 216, 4, 42, true); crosswalk(cx - 40, 216, 80, 42);
    tiles(0, 260, MAP, 14, "#a39998", "#948a89", 7);
    // calles laterales y Av. Balbín (doble mano)
    asphalt(0, 274, 40, 750, "#3f4140"); asphalt(984, 274, 40, 750, "#3f4140");
    tiles(40, 274, 14, 684, "#a39998", "#948a89", 7); tiles(970, 274, 14, 684, "#a39998", "#948a89", 7);
    tiles(40, 944, 944, 14, "#a39998", "#948a89", 7);
    asphalt(0, 958, MAP, 66, "#3a3c3e"); R(0, 989, MAP, 1, "#e8c23a"); R(0, 992, MAP, 1, "#e8c23a"); for (let x = 0; x < MAP; x += 30) { R(x, 972, 14, 1, "#e8e8e2"); R(x + 15, 1008, 14, 1, "#e8e8e2"); }
    crosswalk(2, 960, 36, 4); crosswalk(986, 960, 36, 4);
    // césped
    R(54, 274, 916, 670, "#5a8630"); noise(["#4e7a28", "#669434", "#527e2a", "#72a03c"], 30000, 54, 274, 916, 670);
    // senderos de baldosa gris rosada en diagonal, de cada esquina al centro, con cordón de hormigón
    const corners = [[60, 280], [964, 280], [60, 938], [964, 938]];
    const baldosa = tilePat(["#a39998", "#a89e9c", "#9d9392"], "#8e8483", 6);
    corners.forEach(([x, y]) => poly(bandPts(x, y, cx, cy, 36), "#c9c3b8"));
    poly([[cx - 32, 274], [cx + 32, 274], [cx + 32, cy - 60], [cx - 32, cy - 60]], "#c9c3b8");
    corners.forEach(([x, y]) => poly(bandPts(x, y, cx, cy, 30), null, baldosa));
    poly([[cx - 29, 274], [cx + 29, 274], [cx + 29, cy - 60], [cx - 29, cy - 60]], null, tilePat(["#d7c4af", "#dccab6", "#d0bea9"], "#c5b5a2", 12, cx - 29, 274));
    // explanada escalonada de borde rojo con los dos mástiles
    R(552, 314, 104, 62, "#b0503e"); R(552, 374, 104, 2, "#8a3a2e"); R(556, 318, 96, 54, "#c5b9b0"); R(560, 322, 88, 46, "#d7c4af"); R(560, 322, 88, 1, "#e8dccc"); R(564, 326, 80, 38, "#e2d2be");
    put("m_mastil_ar", 586, 352); put("m_mastil_ba", 626, 352);
    light(586, 344, 26, "#fff4d8", "reflector", 0.6); light(626, 344, 26, "#fff4d8", "reflector", 0.6);
    // el centro: anillo de baldosa clara, estrella de 8 puntas terracota y el cantero con Sarmiento
    disc(cx, cy, 114, "#c9c3b8", 84); disc(cx, cy, 111, "#d7c4af", 81);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) for (let t = 92; t < 111; t++) P1(cx + Math.cos(a) * t, cy + Math.sin(a) * t * 0.73, "#c5b5a2");
    for (let a = 0; a < Math.PI * 2; a += 0.004) P1(cx + Math.cos(a) * 100, cy + Math.sin(a) * 73, "#c5b5a2");
    const star = (R0, R1, col) => { const pts = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? R1 : R0; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.74]); } poly(pts, col); };
    star(92, 60, "#c27464"); star(89, 57, "#a8584a");
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2; for (let t = 32; t < 88; t++) P1(cx + Math.cos(a) * t, cy + Math.sin(a) * t * 0.74, "#8f4a3e"); }
    star(50, 40, "#b8604e");
    disc(cx, cy, 33, "#c9c3b8", 24); disc(cx, cy, 31, "#4a3424", 22); noise(["#5e4430", "#3a2818", "#6a4c34"], 500, cx - 30, cy - 21, 60, 42);
    for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, d = 12 + r() * 16, x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d * 0.7); R(x, y - 3, 1, 4, "#c8b070"); P1(x - 1, y - 2, "#a89058"); P1(x + 1, y - 3, "#d8c088"); }
    put("m_sarmiento", cx, cy + 6, { sh: 14 });
    for (const [dx, dy] of [[-18, 14], [18, 14], [-18, -2], [18, -2]]) light(cx + dx, cy + dy, 22, "#ffe2b0", "reflector", 0.7);
    // árboles: plátanos casi todos, palmeras canarias y el cedro grande
    const segD = (x, y, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - x0 - t * dx, y - y0 - t * dy); };
    const onPath = (x, y, pad) => corners.some(([x0, y0]) => segD(x, y, x0, y0, cx, cy) < 18 + pad) || ((x - cx) / (116 + pad)) ** 2 + ((y - cy) / (86 + pad)) ** 2 < 1 || (Math.abs(x - cx) < 34 + pad && y < cy) || (x > 544 - pad && x < 664 + pad && y > 306 - pad && y < 384 + pad);
    put("m_cedro", 250, 700, { sh: 18 });
    [[300, 470], [740, 470], [700, 780], [330, 820], [180, 560], [860, 620], [420, 380]].forEach(([x, y]) => { if (!onPath(x, y, 8)) put("m_palmera_canaria", x, y, { sh: 10 }); });
    for (let x = 96; x < 940; x += 66) for (const y of [298, 924]) if (!onPath(x, y, 10) && free(x, y, 26)) put(r() < 0.25 ? "m_platano2" : "m_platano", x + Math.round(r() * 8), y, { sh: 14 });
    for (let y = 360; y < 900; y += 74) for (const x of [78, 946]) if (!onPath(x, y, 10) && free(x, y, 26)) put(r() < 0.25 ? "m_platano2" : "m_platano", x, y, { sh: 14 });
    for (let i = 0; i < 400; i++) { const x = 110 + r() * 804, y = 330 + r() * 580; if (!onPath(x, y, 16) && free(x, y, 34)) put(r() < 0.2 ? "m_platano2" : "m_platano", x, y, { sh: 14 }); if (props.length > 104) break; }
    // faroles LED negros a lo largo de los senderos y alrededor del centro
    corners.forEach(([x0, y0]) => [0.18, 0.42, 0.66].forEach((t, k) => { const x = x0 + (cx - x0) * t, y = y0 + (cy - y0) * t, L = Math.hypot(cx - x0, cy - y0), nx = -(cy - y0) / L, ny = (cx - x0) / L, s = k % 2 ? 1 : -1; put("m_farol_led", x + nx * 24 * s, y + ny * 24 * s); light(x + nx * 24 * s, y + ny * 24 * s - 32, 66, "#e6efff", "led"); }));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = cx + Math.cos(a) * 126, y = cy + Math.sin(a) * 93; if (Math.abs(x - cx) < 40 && y < cy) continue; put("m_farol_led", x, y); light(x, y - 32, 62, "#e6efff", "led"); }
    for (let x = 120; x < 920; x += 160) { put("m_farol_led", x, 270); light(x, 238, 60, "#e6efff", "led"); put("m_farol_led", x + 40, 952); light(x + 40, 920, 60, "#e6efff", "led"); }
    for (let y = 400; y < 900; y += 170) for (const x of [48, 976]) { put("m_farol_led", x, y); light(x, y - 32, 60, "#e6efff", "led"); }
    // bancos y cestos al costado de los senderos
    corners.forEach(([x0, y0]) => [0.3, 0.54].forEach(t => { const x = x0 + (cx - x0) * t, y = y0 + (cy - y0) * t, L = Math.hypot(cx - x0, cy - y0), nx = -(cy - y0) / L, ny = (cx - x0) / L; for (const s of [-1, 1]) if (free(x + nx * 26 * s, y + ny * 26 * s, 12)) put("m_banco_plaza", x + nx * 26 * s, y + ny * 26 * s); put("m_cesto", x + nx * 30, y + ny * 30 + 12); }));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = cx + Math.cos(a) * 124, y = cy + Math.sin(a) * 92 + 4; if (Math.abs(x - cx) < 40 && y < cy) continue; put("m_banco_plaza", x, y); }
    // Balbín: parada y colectivos
    put("m_parada", 300, 956); put("bus", 230, 1002); put("bus", 760, 1018, { fl: true }); put("bus", 820, 978, { fl: true });
    for (let x = 140; x < MAP; x += 300) { put("farol", x, 956); light(x, 930, 80, "#ffc27a", "sodio"); }
  } else if (theme === "estacion") {
    // Estación Los Polvorines (Belgrano Norte), renovada en 2021: dos vías juntas en el medio con un andén a cada lado,
    // refugios azules con los >> y asientos azules, el edificio viejo de ladrillo y el acceso con boletería.
    nightSky(70);
    const casas = ["#d8cbb0", "#c9a98a", "#e2d6c0", "#b9c4c8", "#d4b8a0", "#e8e0c8", "#a8b8a0"];
    for (let x = 0, i = 0; x < MAP; i++) {
      const w = 70 + Math.floor(r() * 60), h = 40 + Math.floor(r() * 30), col = casas[i % casas.length], top = 92 - h, x1 = Math.min(MAP, x + w);
      R(x, top, x1 - x, h, col); R(x, top - 3, x1 - x, 3, shade(col, 0.82)); R(x1 - 2, top, 2, h, shade(col, 0.8));
      if (r() < 0.7) { const tx = x + 10 + Math.floor(r() * (w - 30)); R(tx, top - 15, 14, 12, "#1c1c22"); R(tx, top - 15, 14, 2, "#3a3a44"); R(tx + 2, top - 3, 2, 3, "#5a5a62"); R(tx + 10, top - 3, 2, 3, "#5a5a62"); }
      const door = x + 8 + Math.floor(r() * (w - 30)); R(door, 92 - 26, 12, 26, r() < 0.5 ? "#5a3a26" : "#6a6f76");
      for (let wx = x + 6; wx + 14 < x1 - 4; wx += 26) { if (Math.abs(wx - door) < 16) continue; R(wx, 92 - 30, 14, 14, "#2a3040"); if (r() < 0.5) R(wx + 1, 92 - 29, 12, 12, "#ffd9a0"); for (let k = 1; k < 14; k += 3) R(wx + k, 92 - 30, 1, 14, "#16181e"); }
      if (r() < 0.3) { R(x + 4, 92 - 40, w - 8, 6, "#2e5fa8"); for (let k = x + 4; k < x1 - 4; k += 8) R(k, 92 - 34, 4, 2, "#f2f2ee"); }
      x = x1;
    }
    tiles(0, 92, MAP, 12, "#b9b1a4", "#a49c90", 6);
    asphalt(0, 104, MAP, 46, "#3a3c40");
    tiles(0, 150, MAP, 12, "#b9b1a4", "#a49c90", 6);
    R(0, 162, MAP, 134, "#4f7a2c"); noise(["#46702a", "#5a8634", "#3e6626", "#6a9238"], 14000, 0, 162, MAP, 134);
    poly(bandPts(150, 162, 260, 296, 12), "#8a7a5a"); poly(bandPts(860, 162, 820, 296, 12), "#8a7a5a"); noise(["#7a6a4a", "#9a8a6a"], 600, 150, 162, 720, 134);
    for (let x = 60; x < MAP; x += 130) { put(r() < 0.5 ? "m_paraiso" : "arbol", x + Math.floor(r() * 40), 156, { sh: 12 }); }
    for (let i = 0; i < 9; i++) { const x = 40 + r() * 940, y = 200 + r() * 80; if (free(x, y, 40)) put(r() < 0.5 ? "m_paraiso" : "arbol", x, y, { sh: 12 }); }
    for (let x = 90; x < MAP; x += 260) { put("farol", x, 160); light(x, 134, 64, "#ffc27a", "sodio"); }
    // cerramiento perimetral de rejas, con accesos
    const fence = (y, gaps) => { for (let x = 0; x < MAP; x++) { if (gaps.some(([a, b]) => x >= a && x < b)) continue; if (x % 3 === 0) R(x, y, 1, 10, "#2e3a34"); if (x % 32 === 0) R(x, y - 2, 2, 12, "#1c2620"); P1(x, y + 1, "#3e4a44"); P1(x, y + 8, "#3e4a44"); } };
    // andén 1 (arriba): a Villa Rosa
    poly([[0, 306], [MAP, 306], [MAP, 456], [0, 456]], null, tilePat(["#e6e6e2", "#e0e0dc", "#ebebe7"], "#d0d0ca", 32));
    for (let x = 0; x < MAP; x += 4) for (let y = 440; y < 448; y += 3) P1(x + (y % 2) * 2, y, "#d8b000"); R(0, 438, MAP, 1, "#f2c200"); R(0, 448, MAP, 1, "#f2c200");
    R(0, 450, MAP, 6, "#f2c200"); R(0, 455, MAP, 1, "#c89e00"); R(0, 456, MAP, 12, "#6e6e6a"); R(0, 456, MAP, 1, "#9a9a96"); noise(["#5e5e5a", "#7a7a76"], 900, 0, 457, MAP, 11);
    fence(298, [[130, 180], [830, 880]]);
    // las dos vías juntas (carriles del tren en y = 488 y y = 536)
    R(0, 468, MAP, 96, "#81807f"); noise(["#6f6e6c", "#929190", "#a19f9a", "#76746f"], 22000, 0, 468, MAP, 96);
    for (const L of [488, 536]) {
      for (let x = 0; x < MAP; x += 10) { R(x, L - 1, 5, 22, "#9d9b94"); R(x, L - 1, 5, 1, "#b8b6ae"); R(x + 4, L - 1, 1, 22, "#7e7c76"); }
      for (const ry of [L + 3, L + 16]) { R(0, ry, MAP, 2, "#8f8c89"); R(0, ry, MAP, 1, "#d0cec8"); R(0, ry + 2, MAP, 1, "#4a4846"); }
    }
    // paso peatonal con laberinto, cruz de San Andrés y barreras
    R(40, 468, 36, 96, "#5a5a56"); for (let y = 470; y < 564; y += 6) R(40, y, 36, 1, "#4a4a46"); R(40, 468, 2, 96, "#f2c200"); R(74, 468, 2, 96, "#f2c200");
    // andén 2 (abajo): a Retiro
    poly([[0, 564], [MAP, 564], [MAP, 700], [0, 700]], null, tilePat(["#e6e6e2", "#e0e0dc", "#ebebe7"], "#d0d0ca", 32, 0, 564));
    R(0, 564, MAP, 6, "#f2c200"); R(0, 564, MAP, 1, "#fff27a"); for (let x = 0; x < MAP; x += 4) for (let y = 574; y < 582; y += 3) P1(x + (y % 2) * 2, y, "#d8b000"); R(0, 572, MAP, 1, "#f2c200"); R(0, 582, MAP, 1, "#f2c200");
    R(40, 306, 36, 150, "#c8c8c2"); R(40, 584, 36, 116, "#c8c8c2"); for (let y = 310; y < 456; y += 8) R(40, y, 36, 1, "#b0b0aa"); for (let y = 588; y < 700; y += 8) R(40, y, 36, 1, "#b0b0aa");
    put("m_cruz", 30, 466); put("m_cruz", 88, 588); put("m_barrera", 104, 300); put("m_barrera", 18, 712, { fl: true });
    // edificio histórico de ladrillo y refugios azules del andén 1
    put("m_ladrillo", 190, 410);
    light(150, 366, 44, "#ffd08a", "farol"); light(70, 370, 40, "#ffd08a", "farol");
    [360, 464, 568, 672, 776, 880].forEach((x, i) => { put(i % 3 === 0 ? "m_refugio" : "m_refugio2", x, 436); light(x, 420, 62, "#eaf4ff", "tubo"); });
    put("m_cartel_anden1", 296, 444); put("m_cartel_anden1", 944, 444);
    for (let x = 60; x < MAP; x += 140) { put("m_poste_led", x, 312); light(x + 4, 306, 80, "#e8f0ff", "led"); }
    put("m_cesto", 300, 444); put("m_cesto", 960, 446);
    // andén 2: refugios vistos de atrás y el acceso con boletería
    [210, 314, 418].forEach(x => { put("m_refugio_atras", x, 640); light(x, 600, 58, "#eaf4ff", "tubo"); });
    put("m_cartel_anden2", 540, 640);
    put("m_acceso", 820, 704); light(820, 670, 84, "#f0f6ff", "tubo"); light(820, 652, 40, "#9ad0ff", "cartel");
    for (let x = 120; x < MAP; x += 160) { if (Math.abs(x - 820) < 90) continue; put("m_poste_led", x, 694); light(x + 4, 688, 80, "#e8f0ff", "led"); }
    fence(702, [[736, 904]]);
    // playón de estacionamiento y la calle
    asphalt(0, 712, MAP, 220, "#45474a");
    for (const y0 of [736, 840]) { R(20, y0 + 30, MAP - 40, 2, "#d8d8d2"); for (let x = 20; x <= MAP - 20; x += 50) { R(x, y0, 2, 30, "#d8d8d2"); R(x, y0 + 32, 2, 30, "#d8d8d2"); } for (let x = 20; x < MAP - 60; x += 50) for (const dy of [26, 60]) if (r() < 0.6) put(["auto", "auto2", "auto3", "auto2"][Math.floor(r() * 4)], x + 26, y0 + dy, { fl: r() < 0.5 }); }
    for (let x = 100; x < MAP; x += 240) { put("poste", x, 806); light(x, 770, 96, "#ffe0b0", "sodio"); }
    tiles(0, 932, MAP, 12, "#b9b1a4", "#a49c90", 6);
    asphalt(0, 944, MAP, 80, "#3a3c40"); for (let x = 10; x < MAP; x += 26) R(x, 983, 12, 2, "#d8d0b0");
    put("bus", 300, 1004); put("auto2", 700, 1012, { fl: true });
    for (let x = 60; x < MAP; x += 280) { put("farol", x, 944); light(x, 918, 64, "#ffc27a", "sodio"); }
  } else if (theme === "feria") {
    // Feria Persa de San Miguel (Av. Balbín): el castillo de colores, el paredón azul con reja blanca y el galpón con pasillos
    g.fillStyle = "#86878a"; g.fillRect(0, 0, MAP, MAP); noise(["#7e7f82", "#8f9093", "#8a8b8e"], 16000);
    sky(120);
    // el techo de chapa oxidada del galpón asoma detrás de las murallas
    for (let x = 0; x < MAP; x++) { const top = 70 + Math.round(Math.sin(x / 90) * 2); const rust = hash(x >> 4, 1) % 3; R(x, top, 1, 40, x % 3 === 0 ? "#5e4232" : rust === 0 ? "#8a8f93" : rust === 1 ? "#7a5a44" : "#8a6448"); if (hash(x, 7) % 9 === 0) R(x, top + 6 + hash(x, 3) % 20, 1, 4, "#a8704a"); }
    R(0, 70, MAP, 1, "#a8a8a4");
    // murallas con almenas: cada tramo de un color, como en la foto
    const walls = [[0, 90, "#e57a8a"], [90, 170, "#8f86d8"], [170, 250, "#d8323a"], [250, 330, "#2d4fb0"], [330, 420, "#d8323a"], [420, 500, "#8f86d8"], [500, 610, "#1f6e45"], [610, 700, "#d8323a"], [700, 790, "#f2c83a"], [790, 880, "#e57a8a"], [880, 960, "#8f86d8"], [960, 1024, "#3fb8af"]];
    walls.forEach(([x0, x1, col], i) => {
      const top = 104 + (i % 3) * 8;
      g.fillStyle = col; g.fillRect(x0, top, x1 - x0, 184 - top);
      g.fillStyle = shade(col, 0.86); g.fillRect(x0, top, 3, 184 - top);
      for (let x = x0 + 2; x < x1 - 4; x += 12) { g.fillStyle = col; g.fillRect(x, top - 8, 7, 8); g.fillStyle = shade(col, 1.15); g.fillRect(x, top - 8, 7, 1); }
      for (let x = x0 + 16; x < x1 - 16; x += 36) { g.fillStyle = "#2a2233"; g.fillRect(x, top + 22, 8, 12); disc(x + 4, top + 22, 4, "#2a2233", 3); }
    });
    // rosetón blanco del tramo verde
    disc(556, 138, 14, "#f2f2f2"); disc(556, 138, 11, "#3a6ad8"); for (let a = 0; a < 6.28; a += 0.52) { g.fillStyle = "#f2f2f2"; g.fillRect(Math.round(556 + Math.cos(a) * 7), Math.round(138 + Math.sin(a) * 7), 2, 2); } disc(556, 138, 3, "#f2f2f2");
    // torres: cilindros con cúpula de cebolla, punta de cono o almenas
    const onion = (x, y, w, col) => { disc(x, y, Math.round(w * 0.62), col, Math.round(w * 0.5)); disc(x - Math.round(w * 0.2), y - Math.round(w * 0.18), Math.round(w * 0.16), shade(col, 1.35), Math.round(w * 0.12)); g.fillStyle = col; for (let k = 0; k < Math.round(w * 0.5); k++) g.fillRect(x - Math.max(0, Math.round((w * 0.5 - k) * 0.25)), y - Math.round(w * 0.5) - k, Math.max(1, Math.round((w * 0.5 - k) * 0.5)), 1); g.fillStyle = "#f2c83a"; g.fillRect(x, y - w - 4, 1, 5); };
    const cone = (x, y, w, h, col) => { for (let k = 0; k < h; k++) { const ww = Math.round(w / 2 * (1 - k / h)); g.fillStyle = k % 7 ? col : shade(col, 0.85); g.fillRect(x - ww, y - k, ww * 2 + 1, 1); } g.fillStyle = shade(col, 0.8); for (let k = 0; k < h; k++) { const ww = Math.round(w / 2 * (1 - k / h)); g.fillRect(x + Math.round(ww * 0.4), y - k, Math.max(1, ww - Math.round(ww * 0.4)), 1); } };
    const tower = (x, w, topY, col, cap, capCol, white) => {
      g.fillStyle = col; g.fillRect(x - w / 2, topY, w, 186 - topY);
      g.fillStyle = shade(col, 0.78); g.fillRect(x + w / 2 - Math.round(w * 0.28), topY, Math.round(w * 0.28), 186 - topY);
      g.fillStyle = shade(col, 1.12); g.fillRect(x - w / 2 + 2, topY, 2, 186 - topY);
      const tc = white ? "#f2f2f2" : shade(col, 1.05);
      g.fillStyle = tc; g.fillRect(x - w / 2 - 2, topY - 4, w + 4, 6); for (let k = x - w / 2 - 2; k < x + w / 2; k += 8) g.fillRect(k, topY - 10, 5, 7);
      g.fillStyle = "#2a2233"; g.fillRect(x - 2, topY + 18, 4, 9); if (186 - topY > 70) g.fillRect(x - 2, topY + 48, 4, 9);
      if (cap === "onion") onion(x, topY - 14, w, capCol);
      if (cap === "cone") cone(x, topY - 8, w + 2, Math.round(w * 1.6), capCol);
    };
    [[22, 30, 58, "#1f6e45", "cone", "#e8c23a"], [120, 26, 70, "#2d4fb0", "onion", "#e0a8c8"], [206, 34, 44, "#8f86d8", "cone", "#e86aa0"], [292, 28, 64, "#3fb8af", "onion", "#3a6ad8"], [372, 40, 30, "#f2c83a", "cone", "#3fb8af", true], [452, 26, 52, "#e57a8a", "onion", "#efe6d0"], [640, 44, 60, "#f2c83a", "onion", "#2d6fb8", true], [728, 30, 40, "#e57a8a", "cone", "#b8a8e8"], [812, 38, 56, "#e57a8a", "onion", "#c8323a"], [900, 30, 26, "#8f86d8", "cone", "#b8a8e8", true], [986, 30, 66, "#2d4fb0", "onion", "#3fb8af"]].forEach(a => tower(...a));
    // portón con el cartel de la alfombra mágica
    g.fillStyle = "#1c2a5a"; g.fillRect(470, 120, 84, 66); disc(512, 120, 42, "#1c2a5a", 22); g.fillStyle = "#ffcf7a"; g.fillRect(482, 150, 60, 36);
    g.fillStyle = "#2d4fb0"; g.fillRect(430, 74, 164, 40); g.fillStyle = "#7ec8f0"; g.fillRect(433, 77, 158, 34); g.fillStyle = "#b8e2f8"; g.fillRect(433, 77, 158, 10);
    g.fillStyle = "#f2f2f2"; g.fillRect(452, 82, 22, 4); g.fillRect(456, 80, 12, 2); g.fillStyle = "#e1251b"; g.fillRect(454, 86, 18, 1);
    T("Feria Persa", 523, 98, "#16306a", 19, { font: "Georgia, 'Times New Roman', serif", style: "italic" }); T("Feria Persa", 522, 97, "#f2f2f2", 19, { font: "Georgia, 'Times New Roman', serif", style: "italic" });
    light(512, 150, 90, "#ffcf7a", "porton"); light(512, 94, 70, "#9ad8ff", "cartel");
    // paredón azul con reja blanca y el pasto de adelante
    g.fillStyle = "#2d4fb0"; g.fillRect(0, 184, MAP, 12); g.fillStyle = "#1f3a8a"; g.fillRect(0, 194, MAP, 2);
    g.fillStyle = "#f2f2f2"; g.fillRect(0, 176, MAP, 1); for (let x = 0; x < MAP; x += 3) g.fillRect(x, 176, 1, 8);
    for (let x = 0; x < MAP; x += 128) { g.fillStyle = "#2d4fb0"; g.fillRect(x, 172, 10, 24); }
    g.fillStyle = "#4a8a3a"; g.fillRect(0, 196, MAP, 22); noise(["#3f7a32", "#5a9a48"], 2500, 0, 196, MAP, 22);
    // el cartel blanco con el horario, al lado del portón
    put("m_cartel_horario", 668, 214); light(668, 180, 60, "#fff4d8", "cartel", 0.8);
    // las paredes laterales del galpón, de chapa oxidada
    for (const x0 of [0, MAP - 10]) for (let y = 218; y < MAP - 76; y++) { R(x0, y, 10, 1, y % 4 ? "#7a5a44" : "#5e4232"); if (hash(x0, y >> 3) % 5 === 0) R(x0 + 2, y, 3, 1, "#a8704a"); }
    // adentro: piso gris con líneas amarillas y flechas
    const dash = (x0, y0, x1, y1) => { g.fillStyle = "#e8c23a"; const n = Math.hypot(x1 - x0, y1 - y0) / 14; for (let i = 0; i < n; i++) { const k = i / n; g.fillRect(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), x1 === x0 ? 2 : 7, x1 === x0 ? 7 : 2); } };
    const arrow = (x, y, dx) => { g.fillStyle = "#e8c23a"; g.fillRect(x - 6 * dx, y, 10, 2); for (let i = 0; i < 4; i++) g.fillRect(x + 4 * dx - i * dx, y - 3 + i, 1, 8 - i * 2); };
    dash(512, 224, 512, 940);
    const rows = [300, 430, 560, 690, 820];
    rows.forEach((y, ri) => {
      dash(40, y + 50, 490, y + 50); dash(534, y + 50, 990, y + 50);
      arrow(260, y + 62, ri % 2 ? 1 : -1); arrow(760, y + 38, ri % 2 ? -1 : 1);
      for (let x = 64; x < MAP - 40; x += 38) {
        if (Math.abs(x - 512) < 50 || (x % 190) < 24) continue;
        const food = ri >= 3 && x < 480;
        if (food) { if ((x / 38 | 0) % 2 === 0) props.push({ s: "mesa", x, y: y - 6 }); continue; }
        const k = r();
        props.push({ s: k < 0.12 ? "golosinas" : k < 0.2 ? "maniqui" : ["local", "local2", "local3", "local4"][Math.floor(r() * 4)], x, y });
      }
    });
    // patio de comidas con techo de chapa
    g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(40, 620, 440, 260); g.fillStyle = "#6a6b6e"; for (let x = 40; x < 480; x += 10) g.fillRect(x, 620, 1, 3);
    props.push({ s: "golosinas", x: 120, y: 612 }, { s: "golosinas", x: 400, y: 612 });
    // tubos de luz del galpón
    for (let y = 260; y < 940; y += 130) for (let x = 110; x < MAP; x += 200) { g.fillStyle = "#dfe8f0"; g.fillRect(x - 12, y - 64, 24, 2); light(x, y - 40, 84, "#e6f0ff", "tubo"); }
    // Av. Balbín, con la hilera de autos estacionados contra el cordón
    road(MAP - 58, 58); tiles(0, MAP - 76, MAP, 18, "#a39e92", "#8f8a7e", 9);
    text("AV. BALBÍN", 150, MAP - 16, "rgba(240,240,240,.35)", 12);
    for (let x = 60; x < MAP; x += 170) { props.push({ s: "farol", x, y: MAP - 60 }); light(x, MAP - 86, 60, "#ffd98a", "sodio"); if (x + 85 < MAP) props.push({ s: "arbol", x: x + 85, y: MAP - 60 }); }
    for (let x = 30; x < MAP - 30; x += 52) if (r() < 0.8) put(["auto2", "auto", "auto3", "auto2", "auto"][Math.floor(r() * 5)], x + Math.floor(r() * 6), MAP - 36, { fl: r() < 0.3 });
  } else if (theme === "bielli") {
    // Team Bielli (9 de Julio 2340, Los Polvorines): piso encastrable amarillo y negro, pared blanca con la franja
    // de cinta de peligro, el octógono amarillo "Sangre de Campeón", bolsas rojas y negras y el ring de lona azul.
    R(0, 0, MAP, MAP, "#6f7378");
    // techo de tela blanca drapeada
    R(0, 0, MAP, 46, "#e6e3dc");
    for (let x = 0; x < MAP; x++) { const k = Math.sin(x / 40 * Math.PI); R(x, 0, 1, 40, k > 0.6 ? "#f4f2ec" : k < -0.6 ? "#cfcbc2" : "#e2dfd8"); const sag = 40 + Math.round(Math.abs(Math.sin(x / 80 * Math.PI)) * 6); R(x, sag - 2, 1, 2, "#c4c0b6"); }
    for (let x = 60; x < MAP; x += 160) { R(x - 14, 16, 28, 3, "#ffffff"); R(x - 14, 19, 28, 1, "#c8d0d8"); light(x, 30, 70, "#eef4ff", "tubo", 0.6); }
    // banderines de países
    const flags = [["#74acdf", "#ffffff"], ["#c8102e", "#ffffff"], ["#009b3a", "#fedf00"], ["#002868", "#bf0a30"], ["#ffffff", "#bc002d"], ["#000000", "#dd0000"], ["#ff9933", "#138808"], ["#0038a8", "#ce1126"]];
    // franja pintada de amarillo, cinta de peligro y pared blanca
    R(0, 46, MAP, 22, "#e8c832"); noise(["#dcbc2a", "#f0d040"], 1500, 0, 46, MAP, 22);
    for (let y = 68; y < 75; y++) for (let x = 0; x < MAP; x++) if (((x + y) >> 2) % 2) P1(x, y, "#1c1c20"); else P1(x, y, "#f2d21e");
    R(0, 75, MAP, 113, "#ecebe6"); noise(["#e2e1dc", "#f4f3ee"], 3000, 0, 75, MAP, 113);
    for (let x = 4, i = 0; x < MAP; x += 20, i++) { const [a, b] = flags[i % flags.length], y = 50 + Math.round(Math.sin(x / 60) * 3); R(x, y, 20, 1, "#5a5a5a"); R(x + 2, y + 1, 14, 5, a); R(x + 2, y + 6, 14, 4, b); }
    R(0, 182, MAP, 8, "#cfcdc6"); R(0, 190, MAP, 2, "#9a9890"); R(0, 192, MAP, 4, "#3a3a40");
    // el logo: octógono amarillo con las dos siluetas pateando
    const oct = (cx, cy, rad, col) => { const pts = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } poly(pts, col); };
    const LX = 512, LY = 128;
    oct(LX, LY, 57, "#1c1c20"); oct(LX, LY, 54, "#fff200"); oct(LX, LY, 39, "#1c1c20"); oct(LX, LY, 37, "#fff200");
    T("Team Bielli", LX, LY - 44, "#1c1c20", 12, { font: "Impact, 'Arial Black', sans-serif", weight: "normal" });
    // "SANGRE DE CAMPEÓN" en arco por la franja de abajo, letra por letra, como en el logo
    { const tx = "SANGRE DE CAMPEÓN", ws = [...tx].map(ch => (GL[ACC[ch] || ch] || GL[" "]).split(" ")[0].length + 1), tot = ws.reduce((a, b) => a + b, 0) - 1, rad = 46; let acc = 0;
      [...tx].forEach((ch, i) => { const a = Math.PI / 2 + (tot / 2 - acc - ws[i] / 2) / rad; ftext(g, ch, LX + Math.cos(a) * rad, Math.round(LY + Math.sin(a) * rad - 2), "#1c1c20"); acc += ws[i]; }); }
    { const lt = (tx, a0, a1) => [...tx].forEach((ch, i) => { const a = a0 + (a1 - a0) * i / (tx.length - 1); ftext(g, ch, LX + Math.cos(a) * 46, Math.round(LY + Math.sin(a) * 46 - 2), "#1c1c20"); }); lt("FULL", Math.PI * 1.22, Math.PI * 1.06); lt("KICK", -Math.PI * 0.22, -Math.PI * 0.06); }
    const KB = "#1c1c20";
    // izquierda: guardia arriba y rodilla levantada
    disc(LX - 12, LY - 20, 3, KB); R(LX - 15, LY - 17, 6, 11, KB); R(LX - 17, LY - 22, 2, 7, KB); R(LX - 9, LY - 23, 2, 7, KB); disc(LX - 16, LY - 23, 2, KB); disc(LX - 8, LY - 24, 2, KB);
    R(LX - 15, LY - 6, 3, 18, KB); R(LX - 12, LY - 7, 8, 3, KB); R(LX - 6, LY - 7, 3, 9, KB);
    // derecha: patada alta hacia la izquierda
    disc(LX + 12, LY - 22, 3, KB); poly([[LX + 8, LY - 18], [LX + 15, LY - 18], [LX + 16, LY - 6], [LX + 10, LY - 6]], KB); R(LX + 4, LY - 22, 2, 6, KB); disc(LX + 4, LY - 23, 2, KB); R(LX + 15, LY - 18, 4, 2, KB); disc(LX + 19, LY - 18, 2, KB);
    poly([[LX + 10, LY - 8], [LX + 13, LY - 8], [LX - 2, LY - 14], [LX - 2, LY - 11]], KB); R(LX + 12, LY - 6, 3, 18, KB);
    F("K-1", LX + 2, LY + 12, KB);
    // banners del team y cuadros negros
    [[180, "TEAM BIELLI"], [844, "KICK BOXING"]].forEach(([x, t]) => { R(x - 70, 92, 140, 38, "#1c1c20"); R(x - 66, 95, 132, 2, "#f2d21e"); R(x - 66, 125, 132, 2, "#f2d21e"); T(t, x, 111, "#f2d21e", 16, { font: "Impact, 'Arial Black', sans-serif", weight: "normal" }); });
    for (const x of [300, 380, 640, 720, 960]) { R(x - 12, 96, 24, 32, "#3a3a40"); R(x - 10, 98, 20, 28, "#1c1c20"); disc(x, 106, 2, "#f2f2f2"); R(x - 2, 108, 4, 8, "#f2f2f2"); R(x - 4, 116, 2, 6, "#f2f2f2"); R(x + 2, 112, 6, 2, "#f2f2f2"); R(x - 8, 120, 16, 2, "#f2d21e"); }
    R(976, 160, 8, 16, "#d8323a"); R(976, 160, 8, 2, "#1c1c20"); R(974, 156, 6, 3, "#1c1c20");
    disc(424, 100, 10, "#3a3e46"); disc(424, 100, 8, "#c9ced4"); R(423, 92, 2, 16, "#5a5e66"); R(416, 99, 16, 2, "#5a5e66");
    // piso de encastrables amarillos y negros (con los dientes de cada placa)
    for (let y = 196; y < 1000; y += 32) for (let x = 24; x < 1000; x += 32) {
      const yel = (((x - 24) >> 5) + ((y - 196) >> 5)) % 2 === 0, c0 = yel ? "#f2d21e" : "#1c1c20", c1 = yel ? "#1c1c20" : "#f2d21e";
      R(x, y, 32, 32, c0); R(x, y, 32, 1, yel ? "#fff27a" : "#2e2e34"); R(x, y + 31, 32, 1, yel ? "#c8a810" : "#101014");
      if (x + 32 < 1000) for (let k = 4; k < 32; k += 8) R(x + 30, y + k, 4, 4, ((k >> 3) % 2) ? c0 : c1);
      if (y + 32 < 1000) for (let k = 4; k < 32; k += 8) R(x + k, y + 30, 4, 4, ((k >> 3) % 2) ? c0 : c1);
    }
    R(20, 196, 4, 804, "#1c1c20"); R(1000, 196, 4, 804, "#1c1c20");
    for (let i = 0; i < 10; i++) { const x = 60 + r() * 400, y = 300 + r() * 600; disc(Math.round(x), Math.round(y), 5, i % 2 ? "#6ad04a" : "#f2d21e", 3); disc(Math.round(x), Math.round(y), 2, "#2a2a30", 1); }
    // el ring de lona azul francia
    const rx = 560, ry = 430, rs = 260;
    R(rx - 6, ry - 6, rs + 12, rs + 12, "#1c1c20");
    R(rx, ry, rs, rs, "#2f45a8"); noise(["#3a55c0", "#263a90", "#3449b0"], 3000, rx, ry, rs, rs);
    for (let y = ry; y < ry + rs; y += 52) R(rx, y, rs, 1, "#263a90");
    oct(rx + rs / 2, ry + rs / 2, 46, "#3a52b8"); oct(rx + rs / 2, ry + rs / 2, 34, "#2f45a8"); T("TEAM BIELLI", rx + rs / 2, ry + rs / 2, "#4a62c8", 14, { font: "Impact, 'Arial Black', sans-serif", weight: "normal" });
    R(rx - 6, ry + rs + 6, rs + 12, 14, "#141a3a"); R(rx - 6, ry + rs + 6, rs + 12, 1, "#3a4a8a"); T("TEAM BIELLI · SANGRE DE CAMPEÓN", rx + rs / 2, ry + rs + 13, "#f2d21e", 9);
    for (const x of [rx - 4, rx + rs + 2]) { R(x, ry - 30, 4, 30, "#1c1c20"); R(x - 1, ry - 28, 6, 20, "#f2d21e"); }
    [["#d8323a", 24], ["#f2f2f2", 17], ["#2d4fb0", 10]].forEach(([col, h]) => { R(rx, ry - h, rs, 2, col); R(rx - 2, ry - h, 2, rs, col); R(rx + rs, ry - h, 2, rs, col); });
    put("m_poste_ring", rx - 2, ry + rs + 4); put("m_poste_ring", rx + rs + 2, ry + rs + 4);
    for (let k = 0; k < 3; k++) put("m_cuerdas", rx + 44 + k * 86, ry + rs + 4);
    R(rx - 30, ry + rs - 44, 18, 40, "#d8d8d4"); for (let k = 0; k < 4; k++) R(rx - 30, ry + rs - 40 + k * 10, 18, 2, "#9a9a96");
    for (let i = 0; i < 6; i++) put("silla", rx + 24 + i * 42, ry + rs + 48);
    for (let i = 0; i < 4; i++) put("silla", rx - 44, ry + 30 + i * 44);
    // bolsas rojas y negras colgadas de las ménsulas de la pared, y la estructura del fondo
    const bags = [60, 124, 252, 330, 410, 620, 700, 776, 940];
    bags.forEach((x, i) => { R(x - 1, 150, 3, 10, "#2a2a30"); R(x - 1, 150, 10, 3, "#2a2a30"); put(i % 2 ? "m_bolsa_negra" : "m_bolsa_roja", x + 6, 218); });
    R(70, 760, 300, 4, "#2a2a30"); R(70, 760, 4, 100, "#2a2a30"); R(366, 760, 4, 100, "#2a2a30");
    [110, 180, 250, 320].forEach((x, i) => put(i % 2 ? "m_bolsa_roja_l" : "m_bolsa_negra_l", x, 850));
    put("m_neumatico", 200, 260); put("m_neumatico", 222, 268); put("m_neumatico", 880, 920);
    // tubos de luz y reflectores sobre el ring
    for (let y = 280; y < MAP; y += 180) for (let x = 120; x < MAP; x += 240) { if (x > rx - 40 && x < rx + rs + 40 && y > ry - 40 && y < ry + rs + 40) continue; light(x, y, 130, "#eef4ff", "tubo"); }
    light(rx + rs / 2, ry + rs / 2, 180, "#fff6e0", "reflector", 1.1); light(rx + 60, ry + 60, 90, "#fff6e0", "reflector"); light(rx + rs - 60, ry + rs - 60, 90, "#fff6e0", "reflector");
    R(0, 1000, MAP, 24, "#3a3e46"); R(470, 1004, 84, 20, "#5a3a26"); R(470, 1004, 84, 2, "#7a5a40"); T("9 DE JULIO 2340", 512, 1012, "#f2f2f2", 9); light(512, 1012, 50, "#ffe2b0", "foco", 0.7);
  } else if (theme === "cancha") {
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
    noise(["#0b8a3e", "#f4f4f4", "#e8c23a", "#1e1e24"], 900, 0, 10, MAP, 100, 2); noise(["#0b8a3e", "#f4f4f4", "#e8c23a", "#1e1e24"], 900, 0, MAP - 118, MAP, 100, 2);
    g.fillStyle = "#0b8a3e"; g.fillRect(0, 128, MAP, 3); g.fillRect(0, MAP - 131, MAP, 3);
    [[140, 150], [MAP - 140, 150], [140, MAP - 150], [MAP - 140, MAP - 150]].forEach(([x, y]) => { props.push({ s: "farol", x, y }); light(x, y - 26, 190, "#e6eeff", "torre"); });
    for (let i = 0; i < 10; i++) props.push({ s: "banco", x: 200 + i * 70, y: 160 });
  } else if (theme === "tortugas") {
    // Tortugas Open Mall (Panamericana, ramal Pilar km 36,5): el mall en V con la cúpula elíptica de vidrio en el vértice,
    // la torre blanca reticulada junto al acceso del Starbucks, el lago turquesa con puentes de madera y el estacionamiento.
    nightSky(150);
    // cúpula elíptica del patio de comidas, detrás del techo
    disc(560, 104, 126, "#e8eef2", 40); disc(560, 104, 122, "#1e4a7a", 37); disc(560, 98, 110, "#2f6fa8", 28); disc(540, 90, 60, "#4f8fc8", 12);
    for (let a = 0.15; a < Math.PI; a += 0.2) { for (let t = 0; t < 120; t++) P1(560 + Math.cos(a) * t, 104 - Math.sin(a) * t * 0.31, "#a8d0ee"); }
    for (const rx of [40, 80, 110]) for (let a = Math.PI; a < Math.PI * 2; a += 0.004) P1(560 + Math.cos(a) * rx, 104 + Math.sin(a) * rx * 0.32, "#8ab8dc");
    light(560, 96, 120, "#9ad0ff", "cupula", 0.6);
    // tambores grises en las puntas de la V
    for (const [x, w] of [[44, 56], [984, 56]]) { const b = x < 512 ? 296 : 290; R(x - w / 2, b - 150, w, 150, "#9aa0a6"); R(x + w / 2 - 14, b - 150, 14, 150, "#7a8086"); R(x - w / 2, b - 150, 4, 150, "#b8bec4"); disc(x, b - 150, w / 2, "#c8ced4", 8); for (let y = b - 140; y < b; y += 12) R(x - w / 2, y, w, 1, "#8a9096"); }
    // las dos alas de la V: piedra laja, pérgola de madera y vidrieras (cada columna se pinta a su altura)
    const baseY = x => Math.round(x < 430 ? 214 + (430 - x) * 0.2 : x > 630 ? 214 + (x - 630) * 0.2 : 214);
    const stone = ["#b8ab9b", "#a89a88", "#c8bcac", "#9a8c7a", "#beb2a2"];
    for (let x = 16; x < 1008; x++) {
      const b = baseY(x), H = x >= 430 && x <= 630 ? 116 : 104, mid = x >= 430 && x <= 630;
      for (let v = 0; v < H; v++) {
        const y = b - v; let col;
        if (v < 32) col = (x % 18 === 0 || v === 31) ? "#4a4038" : (v < 28 ? (mid ? "#ffe8c0" : (hash(x >> 4, 2) % 3 ? "#ffe2b0" : "#9cc8d8")) : "#5a5048");
        else if (v < 42) col = (x % 9 < 2) ? "#d8a868" : v < 34 ? "#7a4a20" : "#b07a42";
        else if (v >= H - 7) col = v === H - 7 ? "#8a8070" : "#e6dcc8";
        else col = mid ? (v % 24 === 0 ? "#bfb39d" : "#cfc3ad") : ((v + ((x >> 3) % 2) * 3) % 6 === 0 || (x + (v >> 2) * 5) % 11 === 0 ? "#8a7c6a" : stone[hash(x >> 2, (v + ((x >> 3) % 2) * 2) >> 2) % stone.length]);
        P1(x, y, col);
      }
    }
    // acceso del Starbucks en el vértice y la torre blanca reticulada
    R(452, 140, 96, 74, "#3a3430"); R(456, 146, 88, 60, "#ffe2b0"); for (let x = 456; x < 544; x += 11) R(x, 146, 1, 60, "#5a5048"); R(452, 132, 96, 8, "#cfc3ad");
    T("STARBUCKS COFFEE", 500, 124, "#eef2ea", 9); disc(560, 168, 9, "#1e5a3a"); disc(560, 168, 7, "#eef2ea"); disc(560, 168, 5, "#1e5a3a");
    for (let k = 0; k < 6; k++) R(580 + k * 4, 214 - k * 10, 18, 3, "#9aa2aa");
    const tw = 412;
    R(tw - 22, 150, 44, 66, "#b8562a"); R(tw + 10, 150, 12, 66, "#8a3a1a"); R(tw - 22, 150, 4, 66, "#d0703a");
    R(tw - 22, 98, 44, 52, "#dfe8ee"); for (let y = 98; y < 150; y += 6) R(tw - 22, y, 44, 2, "#c8d4dc"); for (let x = tw - 22; x < tw + 22; x += 8) R(x, 98, 1, 52, "#9aa8b4"); R(tw + 12, 98, 10, 52, "#b8c4cc");
    R(tw - 22, 16, 44, 82, "#5a7898"); R(tw - 18, 16, 20, 82, "#7a98b8");
    for (let y = 16; y < 98; y++) for (let x = tw - 22; x < tw + 22; x++) { const u = Math.asin(Math.max(-1, Math.min(1, (x - tw + 0.5) / 22))) * 14; if (((Math.round(u + y * 0.5) % 6) + 6) % 6 === 0 || ((Math.round(u - y * 0.5) % 6) + 6) % 6 === 0 || y % 8 === 0) P1(x, y, x > tw + 12 ? "#c8d8e8" : "#ffffff"); }
    disc(tw, 16, 22, "#ffffff", 5); disc(tw, 16, 19, "#5a7898", 3);
    light(tw, 60, 130, "#f4f8ff", "torre", 0.9);
    // carteles de las tiendas sobre las alas
    const sign = (x, t, bg, fg, size = 10) => { const y = baseY(x) - 74, w = t.length * size * 0.62 + 12; R(x - w / 2, y - 8, w, 16, bg); T(t, x, y, fg, size); light(x, y + 10, 50, "#ffe2b0", "cartel", 0.6); };
    sign(130, "COTO", "#ffffff", "#e1251b", 12); sign(270, "FREDDO", "#f2ece0", "#2a3a6a"); sign(740, "CINEMARK", "#b8141b", "#ffffff"); sign(880, "SODIMAC", "#e30613", "#ffffff");
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; disc(Math.round(330 + Math.cos(a) * 9), Math.round(baseY(330) - 70 + Math.sin(a) * 9), 1, ["#e1251b", "#f2c230", "#2f9a4a", "#2e5fa8"][i % 4]); }
    T("TORTUGAS", 368, baseY(368) - 74, "#3a3430", 9); F("OPEN MALL", 368, baseY(368) - 66, "#3a3430");
    // vereda de piedra entre el mall y el lago
    poly([[0, 300], [0, 400], [MAP, 400], [MAP, 293], [630, 214], [430, 214]], null, tilePat(["#c8c6c0", "#d0cec8", "#c0beb8"], "#aeaca6", 10));
    for (const [x, y] of [[470, 232], [520, 236], [612, 236]]) { put("m_sombrilla_verde", x, y); }
    // el lago turquesa de forma libre, con islas de pasto, rocas blancas, puentes de madera y chorros
    const lake = [[90, 352], [140, 312], [230, 296], [330, 272], [420, 246], [512, 240], [600, 244], [690, 266], [790, 284], [880, 300], [940, 322], [920, 352], [850, 374], [770, 368], [700, 390], [620, 394], [560, 382], [500, 394], [440, 388], [380, 392], [320, 376], [250, 386], [190, 372], [130, 376]];
    poly(lake.map(([x, y]) => [x, y + 3]), "#e8e8e0");
    poly(lake, "#3ec1d3"); poly(lake.map(([x, y]) => [512 + (x - 512) * 0.8, 318 + (y - 318) * 0.6]), "#2fa9c4");
    noise(["#7fe0ea", "#5ad0e0"], 1400, 100, 250, 840, 140);
    for (let i = 0; i < 70; i++) { const x = 120 + r() * 800, y = 270 + r() * 110; R(x, y, 6 + r() * 10, 1, "#9ff0f6"); }
    lake.forEach(([x, y], i) => { if (y > 330) { for (let k = 0; k < 3; k++) disc(Math.round(x + (k - 1) * 9 + r() * 4), y + 2, 4, k % 2 ? "#f2f2ea" : "#d8d8d0", 3); } });
    const island = (pts) => { poly(pts.map(([x, y]) => [x, y + 2]), "#e8e8e0"); poly(pts, "#5f9a3a"); noise(["#4e8a2e", "#6faa48"], 160, Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), 80, 30); };
    island([[250, 330], [300, 318], [340, 326], [330, 344], [270, 346]]);
    island([[660, 304], [740, 300], [780, 318], [760, 338], [680, 336]]);
    // la carpa blanca sobre la isla
    R(694, 314, 56, 16, "#9cc8d8"); for (let x = 694; x < 750; x += 8) R(x, 314, 1, 16, "#e8eef2"); poly([[688, 316], [722, 296], [756, 316]], "#f4f4f0"); for (let k = 0; k < 4; k++) poly([[700 + k * 12, 316], [722, 297], [723, 297], [702 + k * 12, 316]], "#d8d8d0"); R(686, 315, 72, 2, "#c8c8c0");
    light(722, 320, 50, "#fff4d8", "farol", 0.7);
    const bridge = (pts, w) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; poly(bandPts(x0, y0, x1, y1, w + 4), "#3a2a1a"); poly(bandPts(x0, y0, x1, y1, w), "#a0632b"); const n = Math.hypot(x1 - x0, y1 - y0); for (let t = 0; t < n; t += 4) { const k = t / n, px = x0 + (x1 - x0) * k, py = y0 + (y1 - y0) * k, L = n || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L; for (let s = -w / 2 + 1; s < w / 2; s++) P1(px + nx * s, py + ny * s, "#7a4a20"); for (const s of [-w / 2, w / 2 - 1]) P1(px + nx * s, py + ny * s, "#d8c8a8"); if (t % 12 === 0) for (const s of [-w / 2, w / 2 - 1]) { P1(px + nx * s, py + ny * s - 1, "#3a2a1a"); P1(px + nx * s, py + ny * s - 2, "#3a2a1a"); } } } };
    bridge([[512, 404], [470, 344], [512, 290], [512, 240]], 16); bridge([[210, 404], [240, 300]], 14); bridge([[820, 404], [800, 300]], 14);
    for (const [x, y] of [[380, 322], [600, 330], [880, 330], [160, 340]]) { disc(x, y + 2, 8, "#9ff0f6", 3); for (let k = 0; k < 18; k++) R(x - 1 + (k % 3) - 1, y - k, 2, 1, k % 3 ? "#e8fbff" : "#bff4f8"); light(x, y - 4, 46, "#7fe8f0", "agua", 0.7); }
    // boulevard gastronómico y estacionamiento
    R(0, 400, MAP, 4, "#e8e8e0"); poly([[0, 404], [MAP, 404], [MAP, 528], [0, 528]], null, tilePat(["#c8c6c0", "#d0cec8", "#c0beb8"], "#aeaca6", 12, 0, 404));
    for (let x = 30; x < 470; x += 60) { put("m_mesa_terraza", x, 446); put("m_sombrilla_verde", x + 30, 486); }
    for (let x = 60; x < MAP; x += 120) { put("m_farol_negro", x, 418); light(x, 386, 56, "#ffe6b8", "farol"); put("m_farol_negro", x + 60, 520); light(x + 60, 488, 56, "#ffe6b8", "farol"); }
    for (let x = 560; x < MAP; x += 90) { R(x, 456, 40, 14, "#3e7a34"); noise(["#4e8a3e", "#2e6028"], 80, x, 456, 40, 14); put("palmera", x + 20, 466); light(x + 20, 444, 40, "#ffd98a", "farol", 0.6); }
    for (let x = 520; x < MAP; x += 140) put("banco", x, 500);
    R(0, 528, MAP, 4, "#f2c200"); asphalt(0, 532, MAP, 492, "#3e4042");
    const rowsY = [560, 690, 820, 950];
    rowsY.forEach(y0 => { R(20, y0 + 30, MAP - 40, 2, "#e8e8e0"); for (let x = 20; x <= MAP - 20; x += 52) { R(x, y0, 2, 30, "#e8e8e0"); R(x, y0 + 32, 2, 30, "#e8e8e0"); } for (let x = 20; x < MAP - 60; x += 52) for (const dy of [26, 60]) if (r() < 0.55 && y0 + dy < 1016) put(["auto", "auto2", "auto3", "auto2"][Math.floor(r() * 4)], x + 27, y0 + dy, { fl: r() < 0.5 }); });
    for (const y of [646, 776, 906]) for (let x = 80; x < MAP; x += 200) { R(x - 22, y - 6, 44, 10, "#f2c200"); R(x - 20, y - 4, 40, 6, "#4e8a2e"); put("palmera", x, y + 2); }
    for (let x = 180; x < MAP; x += 300) for (const y of [640, 900]) { put("poste", x, y); light(x, y - 40, 94, "#e6eeff", "poste"); }
    for (let i = 0; i < 6; i++) put("carrito", 900 + i * 6, 772 - i * 1);
  } else if (theme === "terrazas") {
    // Terrazas de Mayo (Ruta 8 y Av. Lemos): fachada salmón con la M de colores y los logos de Carrefour, Cinemark y
    // Sodimac apilados, las terrazas gastronómicas del primer piso con toldos rojos, el estacionamiento y la M de la rotonda.
    nightSky(70);
    const base = 236;
    // tramo rayado (izquierda)
    const stripes = ["#7d7f7c", "#6b6f4a", "#c9bfa8", "#8a8c6a", "#b8b09a"];
    for (let x = 0, i = 0; x < 300; i++) { const w = 14 + (hash(i, 5) % 10); R(x, 40, Math.min(w, 300 - x), base - 40, stripes[i % stripes.length]); R(x, 40, 1, base - 40, shade(stripes[i % stripes.length], 0.85)); x += w; }
    // gran paño salmón con juntas en zigzag
    R(300, 34, 430, base - 34, "#d9a088"); R(300, 34, 430, 3, "#e8b8a0");
    for (let x = 300; x < 730; x += 26) { let y = 40; let xx = x; while (y < 150) { const ny = y + 10 + (hash(x, y) % 14), nx = xx + ((hash(y, x) % 7) - 3); for (let k = 0; k < ny - y; k++) P1(Math.round(xx + (nx - xx) * k / (ny - y)), y + k, "#c88e78"); y = ny; xx = nx; } }
    for (let y = 70; y < 150; y += 38) R(300, y, 430, 1, "#c88e78");
    // la M y "terrazas de mayo shopping"
    drawM(g, 330, 50, 1.1);
    T("terrazas", 448, 66, "#3a3a3a", 15); T("de mayo", 444, 86, "#3a3a3a", 15); T("shopping", 436, 104, "#3a3a3a", 11);
    // logos apilados: Carrefour, Cinemark, Sodimac
    R(590, 54, 110, 22, "#d9a088"); T("Carrefour", 630, 64, "#1e4fa1", 13); poly([[674, 58], [684, 64], [674, 70]], "#e1251b"); poly([[688, 58], [680, 64], [688, 70]], "#1e4fa1");
    T("CINEMARK", 640, 90, "#b8141b", 13);
    R(596, 104, 12, 10, "#2e5fa8"); poly([[594, 105], [602, 98], [610, 105]], "#e1251b"); R(598, 108, 3, 3, "#f2d300"); R(603, 108, 3, 3, "#7cc242"); T("SODIMAC", 650, 110, "#e30613", 13);
    light(400, 80, 70, "#ff9ad8", "cartel", 0.6); light(640, 86, 70, "#ffd0c0", "cartel", 0.6);
    // terrazas gastronómicas del primer piso: toldos rojos, baranda de vidrio y mesas
    R(0, 150, 560, 40, "#5a4a44"); R(0, 156, 560, 26, "#ffcf9a"); for (let x = 8; x < 560; x += 22) { R(x, 166, 10, 3, "#8a5a3a"); R(x + 2, 160, 3, 6, "#3a2a2a"); R(x + 7, 161, 3, 5, "#2a2a3a"); }
    for (let x = 0; x < 560; x += 4) R(x, 140, 4, 12, ((x >> 2) % 2) ? "#b8323c" : "#a02a34"); R(0, 152, 560, 2, "#7a1e26"); for (let x = 0; x < 560; x += 8) R(x, 152, 4, 3, "#b8323c");
    R(0, 178, 560, 12, "#a8d0d8"); R(0, 178, 560, 1, "#e8f6fa"); for (let x = 0; x < 560; x += 20) R(x, 178, 1, 12, "#6a8a94"); R(0, 190, 560, 4, "#4a4e56");
    for (let x = 40; x < 560; x += 80) light(x, 172, 60, "#ffcf9a", "terraza");
    // planta baja: vidrieras, acceso A con su tótem violeta
    R(0, 194, 730, base - 194, "#3a3a40"); for (let x = 6; x < 724; x += 30) { R(x, 200, 26, base - 204, hash(x, 9) % 3 ? "#ffe2b0" : "#9cc8d8"); R(x + 13, 200, 1, base - 204, "#5a5048"); }
    // acceso principal: alero plano gigante de canto rojo sobre columnas inclinadas
    R(730, 60, 294, base - 60, "#c9bfa8"); for (let x = 730; x < MAP; x += 36) { R(x, 60, 18, 90, "#a8483a"); R(x + 18, 60, 10, 90, "#d8d0c0"); }
    R(760, 150, 230, base - 150, "#ffe8c0"); for (let x = 760; x < 990; x += 16) R(x, 150, 1, base - 150, "#6a5a48"); R(760, 176, 230, 1, "#6a5a48");
    poly([[720, 122], [1010, 116], [1024, 134], [740, 142]], "#e8e8e4"); poly([[740, 142], [1024, 134], [1024, 140], [740, 148]], "#d0482c");
    for (let x = 750; x < 1010; x += 10) P1(x, 128 + (x - 750) * 0.0, "#c8c8c4");
    for (const x of [790, 880, 960]) poly([[x, base], [x + 3, base], [x + 12, 146], [x + 9, 146]], "#5a5e66");
    light(870, 190, 110, "#fff0d0", "acceso");
    // vereda, calle de acceso con cordón amarillo y bolardos
    tiles(0, base, MAP, 16, "#c8c4ba", "#b6b2a8", 8);
    put("m_totem_a", 150, base + 14); put("m_totem_b", 940, base + 14);
    for (let x = 20; x < MAP; x += 40) put("m_bolardo", x, base + 16);
    R(0, base + 16, MAP, 3, "#f2c200"); asphalt(0, base + 19, MAP, 726, "#45474a");
    for (let x = 10; x < MAP; x += 30) R(x, base + 40, 16, 2, "#e8e8e8");
    // estacionamiento: filas de cocheras con autos, islas con árboles y postes de luz
    const strip = y0 => {
      g.fillStyle = "#e8e8e8"; g.fillRect(40, y0, MAP - 80, 2); g.fillRect(40, y0 + 60, MAP - 80, 2);
      for (let x = 40; x <= MAP - 40; x += 56) { g.fillRect(x, y0, 2, 28); g.fillRect(x, y0 + 34, 2, 28); }
      g.fillStyle = "#6a6a66"; g.fillRect(40, y0 + 28, MAP - 80, 6);
      for (let x = 40; x < MAP - 60; x += 56) for (const dy of [26, 60]) if (r() < 0.6) props.push({ s: ["auto", "auto2", "auto3", "auto2"][Math.floor(r() * 4)], x: x + 29, y: y0 + dy, fl: r() < 0.5 });
      for (let x = 96; x < MAP - 60; x += 224) { props.push({ s: "poste", x, y: y0 + 32 }); light(x, y0 - 6, 94, "#e6eeff", "poste"); }
      props.push({ s: "arbolito", x: 26, y: y0 + 34 }); props.push({ s: "arbolito", x: MAP - 26, y: y0 + 34 });
    };
    [310, 460, 610, 760].forEach(strip);
    for (const y of [400, 550, 700]) for (let x = 120; x < MAP; x += 260) { R(x - 30, y - 6, 60, 12, "#f2c200"); R(x - 28, y - 4, 56, 8, "#3e7a34"); put("arbolito", x - 14, y + 4); put("arbolito", x + 14, y + 4); }
    for (let i = 0; i < 5; i++) put("carrito", 560 + i * 6, 412 - i);
    // la rotonda de la entrada con la M gigante entre flores fucsia, y la pantalla LED
    asphalt(640, 850, 384, 112, "#45474a");
    disc(850, 900, 66, "#f2c200", 42); disc(850, 900, 62, "#4e8a2e", 38); noise(["#5e9a3a", "#3e7a24"], 1200, 790, 864, 120, 72);
    for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, d = 40 + r() * 18, x = 850 + Math.cos(a) * d, y = 900 + Math.sin(a) * d * 0.62; disc(Math.round(x), Math.round(y), 2, i % 3 ? "#e02a9a" : "#ff6ac8", 1); }
    put("m_M_gigante", 850, 912, { sh: 30 }); light(850, 884, 70, "#ff5fc8", "M", 0.8); light(820, 900, 40, "#f2d300", "M", 0.5);
    put("m_pantalla", 720, 900); light(720, 878, 50, "#9ad0ff", "pantalla", 0.8);
    road(962, 62); text("RUTA 8", 120, 1004, "rgba(240,240,240,.35)", 12); text("AV. LEMOS", 420, 1004, "rgba(240,240,240,.25)", 10);
    for (let x = 60; x < MAP; x += 240) { put("farol", x, 962); light(x, 936, 80, "#ffb870", "sodio"); }
  } else if (theme === "abuela") {
    // La casa de la abuela en San Miguel: frente de revoque con techo de tejas, galería con columnas, el jardín con la
    // cucha de Corbata, el limonero, el tender, la parrilla de ladrillo, la reja con el portón y la vereda de vainillas.
    nightSky(40);
    for (let x = 0; x < MAP; x += 140) { const h = 20 + hash(x, 1) % 20; R(x, 40 - h, 130, h + 8, ["#5a4a44", "#4a4a52", "#5a5048"][hash(x, 2) % 3]); }
    // la casa
    const H0 = 120, H1 = 904;
    R(H0, 40, H1 - H0, 40, "#a8483a"); for (let y = 42; y < 80; y += 5) for (let x = H0 + ((y / 5 | 0) % 2) * 6; x < H1; x += 12) { R(x, y, 11, 4, "#b8543e"); R(x, y + 3, 11, 1, "#8a3a2e"); }
    R(H0 - 6, 78, H1 - H0 + 12, 4, "#8a3a2e"); R(H0 - 6, 76, H1 - H0 + 12, 2, "#c8604a");
    R(H0, 82, H1 - H0, 114, "#ece2c8"); noise(["#e2d8be", "#f4ead2", "#d8ceb4"], 2500, H0, 82, H1 - H0, 114); R(H1 - 4, 82, 4, 114, "#d0c6ac");
    R(H0, 178, H1 - H0, 18, "#9a8a78"); for (let x = H0; x < H1; x += 16) R(x, 178, 1, 18, "#8a7a68"); R(H0, 178, H1 - H0, 1, "#b8a890");
    const win = (x, y) => { R(x - 2, y - 2, 40, 44, "#c8bea4"); R(x, y, 36, 40, "#2a3040"); R(x + 2, y + 2, 32, 36, "#ffd9a0"); R(x + 17, y, 2, 40, "#3a3226"); R(x, y + 18, 36, 2, "#3a3226"); for (let k = x + 3; k < x + 36; k += 5) R(k, y, 1, 40, "#1c1c20"); R(x - 10, y, 9, 40, "#3a6a4a"); R(x + 37, y, 9, 40, "#3a6a4a"); for (let k = y + 2; k < y + 40; k += 3) { R(x - 10, k, 9, 1, "#2e5a3e"); R(x + 37, k, 9, 1, "#2e5a3e"); } R(x - 4, y + 40, 44, 3, "#c8bea4"); light(x + 18, y + 40, 44, "#ffd9a0", "ventana", 0.7); };
    win(250, 104); win(700, 104); win(380, 104);
    R(490, 100, 44, 80, "#c8bea4"); R(494, 104, 36, 76, "#6b3a1e"); for (let y = 108; y < 150; y += 10) for (let x = 498; x < 528; x += 10) R(x, y, 8, 8, "#ffd9a0"); R(494, 150, 36, 30, "#5a2e16"); R(526, 156, 2, 6, "#d8b040");
    R(560, 120, 14, 10, "#2a5aa0"); F("1420", 567, 123, "#ffffff");
    R(452, 128, 8, 12, "#1c1c20"); R(453, 129, 6, 8, "#ffe8b0"); light(456, 136, 60, "#ffd08a", "foco");
    // galería: piso de cerámico rojo
    poly([[252, 196], [776, 196], [776, 270], [252, 270]], null, tilePat(["#a8483a", "#b0503e", "#9e4436"], "#7a3428", 12, 252, 196));
    R(252, 196, 524, 8, "rgba(0,0,0,.18)"); R(252, 268, 524, 4, "#c8c0b0");
    put("m_galeria", 514, 270); light(512, 232, 110, "#ffcf80", "foco");
    put("m_maceta_malvon", 268, 220); put("m_maceta_helecho", 290, 216); put("m_maceta_potus", 760, 220); put("m_maceta_aloe", 740, 222);
    put("m_silla_pl", 640, 230); put("m_silla_pl", 664, 232); put("m_mesa_pl", 380, 238);
    // jardín: césped con partes gastadas, sendero de lajas, canteros y medianeras con enredadera
    R(28, 196, 224, 74, "#5a8a34"); R(776, 196, 220, 74, "#5a8a34");
    R(28, 270, 968, 590, "#5a8a34"); noise(["#4e7e2c", "#669838", "#527e2e", "#6a9a3a"], 26000, 28, 196, 968, 664);
    for (let i = 0; i < 14; i++) { const x = 80 + r() * 860, y = 300 + r() * 520; for (let k = 0; k < 60; k++) P1(x + (r() - 0.5) * 40, y + (r() - 0.5) * 20, "#8a7a50"); }
    for (let y = 276, i = 0; y < 858; y += 22, i++) { const x = 512 + Math.round(Math.sin(i * 1.3) * 6); disc(x - 9, y, 9, "#b8b0a0", 5); disc(x + 10, y + 10, 8, "#aaa292", 5); P1(x - 12, y - 2, "#d0c8b8"); }
    for (const x0 of [0, 996]) { R(x0, 0, 28, 860, "#c8bca8"); R(x0 + (x0 ? 0 : 24), 0, 4, 860, "#a89c88"); for (let y = 40; y < 860; y += 7) if (hash(x0, y) % 3) disc(x0 + 14 + (hash(y, x0) % 10) - 5, y, 6, hash(y, 3) % 2 ? "#3e6a2e" : "#2e5a24", 4); }
    R(28, 286, 220, 14, "#6a4a30"); R(776, 286, 220, 14, "#6a4a30");
    for (let x = 40; x < 240; x += 18) put(["m_maceta_malvon", "m_maceta_helecho", "m_maceta_aloe"][(x / 18 | 0) % 3], x, 298);
    for (let x = 790; x < 990; x += 22) put(["m_maceta_potus", "m_maceta_malvon"][(x / 22 | 0) % 2], x, 298);
    put("m_limonero", 220, 440, { sh: 14 }); put("m_paraiso", 840, 470, { sh: 14 });
    put("m_tender", 760, 620); put("m_pileta", 70, 380);
    put("m_parrilla_l", 950, 360, { sh: 16 }); light(950, 346, 40, "#ff8a3a", "brasas", 0.6);
    put("m_cucha", 300, 660, { sh: 16 }); put("m_farol_jardin", 336, 640); light(336, 622, 70, "#ffe6a8", "foco", 0.8); disc(330, 664, 4, "#7a8088", 2); disc(330, 663, 3, "#7ab0c8", 1); R(270, 668, 6, 2, "#f2f2ea"); P1(269, 667, "#f2f2ea"); P1(276, 667, "#f2f2ea");
    disc(600, 560, 3, "#d8323a"); P1(599, 559, "#ffffff");
    put("m_mesa_pl", 640, 380); put("m_silla_pl", 616, 382); put("m_silla_pl", 664, 384);
    for (let i = 0; i < 8; i++) { const x = 100 + r() * 820, y = 720 + r() * 120; if (Math.abs(x - 512) > 40 && free(x, y, 30)) put(["m_maceta_malvon", "m_maceta_helecho"][i % 2], x, y); }
    // la pista de tierra que Corbata gastó corriendo alrededor de su cucha, y canteros de rosales en el sendero
    for (let a = 0; a < Math.PI * 2; a += 0.01) for (let w = -4; w <= 4; w++) if (r() < 0.55) P1(300 + Math.cos(a) * (92 + w), 650 + Math.sin(a) * (52 + w * 0.6), r() < 0.5 ? "#8a7a50" : "#9a8a5e");
    for (const [x, y] of [[220, 430], [380, 530], [650, 490], [880, 630]]) { disc(x, y + 2, 26, "#4a3424", 9); noise(["#5e4430", "#3a2818"], 120, x - 24, y - 6, 48, 16); }
    put("m_naranjo", 380, 530, { sh: 14 }); put("m_naranjo", 650, 490, { sh: 14 }); put("m_nispero", 880, 640, { sh: 22 });
    for (let y = 330; y < 850; y += 34) { if (Math.abs(y - 420) < 20 || Math.abs(y - 600) < 20 || Math.abs(y - 770) < 20) continue; put("m_rosal", 482, y); put("m_rosal", 544, y + 16); }
    for (let y = 360; y < 840; y += 70) { put("m_cipres", 52, y); put("m_cipres", 972, y + 30); }
    put("m_hamaca", 660, 700, { sh: 20 });
    put("m_nispero", 150, 610, { sh: 22 }); put("m_pelopincho", 830, 790); put("m_huerta", 160, 826); put("m_huerta", 236, 826);
    put("m_carretilla", 330, 800); put("m_bici", 706, 300); put("m_manguera_carro", 104, 400);
    put("m_maceta_malvon", 400, 300); put("m_maceta_malvon", 624, 300); put("m_maceta_aloe", 380, 300); put("m_maceta_helecho", 646, 300);
    for (const [x, y] of [[476, 420], [550, 600], [476, 770]]) { put("m_farol_jardin", x, y); light(x, y - 18, 64, "#ffe6a8", "foco", 0.8); }
    // guirnalda de lamparitas desde la galería hasta el níspero y el paraíso
    for (const [x0, y0, x1, y1] of [[262, 250, 150, 560], [766, 250, 840, 430], [512, 268, 660, 660]]) { const n = Math.hypot(x1 - x0, y1 - y0); for (let t = 0; t <= n; t++) { const k = t / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 18; P1(x, y, "#2a2a30"); if (t % 26 === 0) { R(x - 1, y + 1, 3, 3, "#ffd27a"); P1(x, y + 1, "#fff6d0"); if (t % 52 === 0) light(x, y + 2, 34, "#ffd27a", "guirnalda", 0.7); } } }
    light(40, 660, 110, "#fff0d0", "reflector", 0.7); light(130, 186, 150, "#fff0d0", "reflector", 0.8); light(894, 186, 150, "#fff0d0", "reflector", 0.8);
    // la reja con el portón, la vereda de vainillas y la calle
    for (let x = 28 + 48; x < 996; x += 96) { if (Math.abs(x - 512) < 60) continue; put("m_reja", x, 872); }
    put("m_reja", 432 - 48 + 4, 872); put("m_porton", 512, 874);
    poly([[0, 874], [MAP, 874], [MAP, 934], [0, 934]], null, tilePat(["#e0c890", "#d8c088", "#e6d098"], "#c8b078", 8, 0, 874));
    for (let x = 0; x < MAP; x += 8) for (let y = 876; y < 934; y += 4) P1(x + 3, y + 1, "#c8b078");
    R(0, 934, MAP, 4, "#9a9690"); asphalt(0, 938, MAP, 86, "#3a3c40");
    R(160, 904, 30, 24, "#6a4a30"); put("m_paraiso", 175, 922, { sh: 12 }); R(840, 904, 30, 24, "#6a4a30"); put("m_paraiso", 855, 922, { sh: 12 });
    put("auto2", 700, 1000); put("farol", 380, 934); light(380, 908, 110, "#ffb870", "sodio");
  } else if (theme === "roros") {
    // Roro's Bakery: la cocina de Rocío (azulejos crema y celeste, horno, mesada, isla y mesa de tortas) y el local
    // con la vidriera de tortas y medialunas, mesitas, pizarrón y la puerta a la calle. Paleta de la marca.
    const CR = "#F2F7F9", C1 = "#7AAFC4", C2 = "#B8D8E8", MO = "#1A3A4A";
    R(0, 0, MAP, 30, "#EAF2F6"); R(0, 28, MAP, 2, "#d0dde4");
    for (let y = 30; y < 196; y += 10) for (let x = 0; x < MAP; x += 10) { const band = y >= 120 && y < 130; R(x, y, 10, 10, band ? C2 : ((x + y) / 10) % 2 ? CR : "#EAF2F6"); R(x, y, 10, 1, "#d0dde4"); R(x, y, 1, 10, "#d0dde4"); }
    // estantes con frascos, utensilios colgados, ventana al patio, el logo y el reloj
    for (const [x0, x1, y] of [[40, 340, 70], [680, 980, 70]]) { R(x0, y, x1 - x0, 4, "#c8a878"); R(x0, y + 4, x1 - x0, 2, "#9a7a50"); for (let x = x0 + 6; x < x1 - 10; x += 16) { const c0 = ["#f2e0b0", "#e8b8c8", C2, "#d8c098", "#ffffff"][hash(x, y) % 5]; R(x, y - 14, 10, 14, "#e8f4f8"); R(x + 1, y - 10, 8, 9, c0); R(x + 1, y - 16, 8, 3, MO); } }
    R(380, 100, 260, 2, "#9aa2aa"); for (let x = 392; x < 630; x += 22) { R(x, 102, 1, 6, "#9aa2aa"); R(x - 2, 108, 5, 14, ["#c8ced4", "#d8b88a", "#c8ced4", C1][(x / 22 | 0) % 4]); }
    R(744, 96, 70, 56, "#ffffff"); R(748, 100, 62, 48, "#2a4a3a"); noise(["#3e6a3e", "#2e5a2e", "#4a7a4a"], 300, 748, 100, 62, 48); R(778, 100, 2, 48, "#ffffff"); R(748, 123, 62, 2, "#ffffff"); R(744, 150, 70, 4, "#e0e8ec");
    disc(512, 52, 30, MO, 20); disc(512, 52, 28, C2, 18); disc(512, 52, 25, CR, 16);
    T("Roro's", 512, 48, MO, 18, { font: "Georgia, 'Times New Roman', serif", style: "italic" }); F("BAKERY", 512, 60, C1);
    disc(940, 40, 9, "#ffffff"); disc(940, 40, 8, C1); disc(940, 40, 6, "#ffffff"); R(940, 35, 1, 5, MO); R(940, 40, 4, 1, MO);
    light(512, 52, 60, "#fff4e0", "cartel", 0.6);
    // mesada contra la pared: anafe, bacha y alacenas
    R(0, 170, MAP, 8, CR); R(0, 170, MAP, 1, "#ffffff"); R(0, 178, MAP, 30, C1); for (let x = 4; x < MAP; x += 52) { R(x, 181, 48, 24, "#8FBDCE"); R(x + 22, 190, 6, 1, MO); } R(0, 206, MAP, 4, "#5A8FA4");
    R(380, 168, 70, 6, "#2a2a30"); for (const x of [392, 420, 438]) { disc(x, 171, 5, "#3a3a40", 2); disc(x, 171, 3, "#1a1a1e", 1); }
    R(700, 166, 64, 10, "#c8ced4"); R(704, 168, 56, 6, "#8a9aa4"); R(728, 152, 3, 16, "#c8ced4"); R(728, 152, 10, 3, "#c8ced4");
    // piso de la cocina: damero crema y celeste
    for (let y = 210; y < 600; y += 16) for (let x = 0; x < MAP; x += 16) { R(x, y, 16, 16, (((x + y) >> 4) % 2) ? C2 : CR); R(x, y, 16, 1, "#d0dde4"); }
    put("m_heladera", 64, 222, { sh: 14 }); put("m_horno", 180, 228, { sh: 24 });
    light(180, 210, 74, "#ff9a40", "horno"); light(64, 200, 30, "#e8f6ff", "heladera", 0.5);
    put("m_isla", 512, 400, { sh: 56 }); put("m_mesa_tortas", 800, 444, { sh: 46 });
    put("m_carro_bandejas", 270, 470, { sh: 12 }); put("m_torta_mama", 330, 178);
    put("m_estanteria", 34, 360); put("m_estanteria", 34, 470); put("m_bolsas_harina", 110, 540); put("m_cajas_torta", 984, 320); put("m_cajas_torta", 984, 520); put("m_cajas_torta", 958, 524);
    for (const [x, y, w, h] of [[444, 384, 136, 30], [646, 292, 90, 18], [744, 428, 112, 26], [128, 226, 104, 14]]) { R(x, y, w, h, "#8FBDCE"); R(x + 2, y + 2, w - 4, h - 4, "#a8cede"); for (let k = x + 4; k < x + w - 4; k += 6) R(k, y + 3, 1, h - 6, "#8FBDCE"); }
    put("m_mesa_trabajo", 300, 410, { sh: 34 }); put("m_bolsas_harina", 150, 300); put("m_cajas_torta", 900, 250); put("m_tacho", 880, 540);
    R(0, 300, 6, 120, "#5A8FA4"); R(0, 306, 4, 108, "#8a6440"); P1(3, 360, "#d8b040");
    put("m_camita_juli", 254, 240); put("m_amasadora", 330, 310, { sh: 12 }); put("m_mesa_trabajo", 690, 300, { sh: 34 }); put("m_tacho", 624, 232);
    light(690, 270, 90, "#ffe6c0", "colgante");
    for (const [x, y, rad] of [[512, 330, 130], [800, 386, 96], [300, 300, 90]]) { R(x - 1, 0, 2, 20, MO); light(x, y, rad, "#ffe6c0", "colgante"); }
    // la vidriera: mostrador con tortas y medialunas, con paso a los costados
    R(150, 586, 724, 14, "rgba(0,0,0,.12)");
    put("m_vidriera", 238, 598); put("m_vidriera", 372, 598); put("m_vidriera", 652, 598); put("m_vidriera", 786, 598);
    R(436, 562, 152, 36, C1); R(436, 562, 152, 4, CR); R(436, 596, 152, 2, "#5A8FA4"); for (let x = 440; x < 584; x += 36) R(x, 570, 32, 22, "#8FBDCE");
    light(312, 584, 80, "#e8f6ff", "vidriera", 0.8); light(718, 584, 80, "#e8f6ff", "vidriera", 0.8);
    // el local: piso de madera clara, mesitas, plantas y pizarrón
    for (let y = 600; y < 960; y += 8) { R(0, y, MAP, 8, hash(0, y) % 2 ? "#e2c8a0" : "#d8bc92"); R(0, y + 7, MAP, 1, "#b89a70"); for (let x = (y * 7) % 90; x < MAP; x += 90) R(x, y, 1, 7, "#b89a70"); }
    R(0, 600, 24, 360, "#EAF2F6"); R(1000, 600, 24, 360, "#EAF2F6");
    for (const [x, y] of [[220, 760], [400, 860], [640, 760], [820, 860]]) { put("m_mesita", x, y); put("m_silla_cafe", x - 16, y + 2); put("m_silla_cafe", x + 16, y + 2, { fl: true }); }
    R(380, 690, 264, 180, "#B8D8E8"); R(386, 696, 252, 168, "#F2F7F9"); R(392, 702, 240, 156, "#B8D8E8"); for (let x = 392; x < 632; x += 12) { P1(x + 6, 708, "#ffffff"); P1(x + 6, 851, "#ffffff"); }
    T("Roro's", 512, 780, "#7AAFC4", 22, { font: "Georgia, 'Times New Roman', serif", style: "italic" }); F("BAKERY", 512, 796, "#7AAFC4");
    R(24, 860, 8, 90, "#7AAFC4"); for (let y = 864; y < 946; y += 14) R(26, y, 4, 10, ["#ffd0e0", "#B8D8E8", "#f2f7f9"][(y / 14 | 0) % 3]);
    for (const y of [660, 720]) { R(1000, y, 24, 3, "#c8a878"); for (let k = 0; k < 3; k++) { R(1003 + k * 7, y - 9, 5, 9, "#e8f4f8"); R(1004 + k * 7, y - 6, 3, 5, ["#e0a048", "#5a3020", "#f2e0b0"][k]); } }
    put("m_mesita", 820, 660); put("m_silla_cafe", 804, 662); put("m_silla_cafe", 836, 662, { fl: true });
    put("m_exhibidora", 980, 770); put("m_exhibidora", 44, 820); light(980, 740, 50, "#e8f6ff", "heladera", 0.6); light(44, 790, 50, "#e8f6ff", "heladera", 0.6);
    put("m_planta", 50, 640); put("m_planta", 974, 640); put("m_planta", 60, 930); put("m_planta", 964, 930);
    put("m_pizarron", 140, 660);
    for (const [x, y] of [[300, 700], [720, 700], [512, 820]]) light(x, y, 110, "#ffe6c0", "colgante");
    // la vidriera a la calle y la puerta
    R(0, 960, MAP, 64, "#d8e8f0"); R(0, 960, MAP, 4, "#ffffff"); for (let x = 0; x < MAP; x += 128) R(x, 960, 4, 64, MO);
    noise(["#c8dce6", "#e8f4f8"], 600, 0, 966, MAP, 58); R(480, 960, 64, 64, "#b8d0dc"); R(480, 960, 3, 64, MO); R(541, 960, 3, 64, MO); R(534, 990, 3, 8, "#d8b040");
    R(472, 944, 80, 14, "#5A8FA4"); T("Roro's", 512, 951, CR, 10, { font: "Georgia, 'Times New Roman', serif", style: "italic" });
    light(512, 1000, 80, "#e8f0ff", "calle", 0.7);
  }
  return { canvas: c, props: props.map(p => ({ ...p, x: Math.round(p.x), y: Math.round(p.y) })), lights };
}
