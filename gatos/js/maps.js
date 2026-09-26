// Mapas pregenerados en un canvas de 1024 x 1024, inspirados en lugares reales de la zona.
import { MAP } from "./engine.js";

function seeded(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))).toString(16).padStart(2, "0"); return "#" + f(n >> 16) + f(n >> 8 & 255) + f(n & 255); };

export const THEMES = {
  plaza:    { name: "Plaza Mitre", sub: "Para arrancar tranqui", night: [10, 12, 32, 0.74] },
  estacion: { name: "Estación Los Polvorines", sub: "Ojo con el Belgrano Norte", night: [14, 10, 30, 0.66] },
  feria:    { name: "Feria Persa", sub: "Cajones con premios y el fletero", night: [16, 10, 34, 0.62] },
  cancha:   { name: "Cancha del Trueno Verde", sub: "La cortadora del canchero", night: [8, 14, 26, 0.5] },
  tortugas: { name: "Tortugas Open Mall", sub: "Carritos del súper desbocados", night: [10, 14, 36, 0.56] },
  terrazas: { name: "Terrazas de Mayo", sub: "Autos en el estacionamiento", night: [12, 12, 30, 0.6] }
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
  const disc = (cx, cy, rad, col, ry = rad) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.floor(rad * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } };
  const text = (t, x, y, col, size = 16, font = "Arial") => { g.fillStyle = col; g.font = `bold ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y); };
  const street = () => {
    g.fillStyle = "#2f3138"; g.fillRect(0, 0, MAP, 56); g.fillRect(0, MAP - 56, MAP, 56); g.fillRect(0, 0, 56, MAP); g.fillRect(MAP - 56, 0, 56, MAP);
    g.fillStyle = "#d8c46a"; for (let i = 60; i < MAP - 60; i += 24) { g.fillRect(i, 27, 12, 2); g.fillRect(i, MAP - 29, 12, 2); g.fillRect(27, i, 2, 12); g.fillRect(MAP - 29, i, 2, 12); }
    tiles(56, 56, MAP - 112, 22, "#a39e92", "#8f8a7e", 11); tiles(56, MAP - 78, MAP - 112, 22, "#a39e92", "#8f8a7e", 11);
    tiles(56, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11); tiles(MAP - 78, 56, 22, MAP - 112, "#a39e92", "#8f8a7e", 11);
  };
  const road = (y, h) => { g.fillStyle = "#34353b"; g.fillRect(0, y, MAP, h); noise(["#3c3d44", "#2c2d33"], 3000, 0, y, MAP, h); g.fillStyle = "#d8c46a"; for (let i = 0; i < MAP; i += 24) g.fillRect(i, y + (h >> 1) - 1, 12, 2); };
  const sky = h => { g.fillStyle = "#151733"; g.fillRect(0, 0, MAP, h); noise(["#ffffff", "#c9d4ff", "#8a90c0"], 120, 0, 0, MAP, h * 0.7); };
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
    // cartel de la estación
    g.fillStyle = "#1d2a44"; g.fillRect(420, 206, 184, 30); g.fillStyle = "#ffffff"; g.fillRect(423, 209, 178, 24);
    text("LOS POLVORINES", 512, 222, "#1d2a44");
    g.fillStyle = "#1d2a44"; g.fillRect(420, 790, 184, 30); g.fillStyle = "#ffffff"; g.fillRect(423, 793, 178, 24);
    text("BELGRANO NORTE", 512, 806, "#c8102e", 14);
    // refugios del andén
    [[180, 200], [760, 200], [300, 820], [700, 820]].forEach(([x, y]) => { g.fillStyle = "#c9ced4"; g.fillRect(x - 60, y - 20, 120, 34); g.fillStyle = "#aeb4ba"; g.fillRect(x - 60, y + 10, 120, 4); });
    street();
    for (let x = 120; x < MAP - 100; x += 120) [[x, 250], [x, 770], [x, 420], [x, 600]].forEach(([px, py], i) => { if (i > 1 && (px % 240)) return; props.push({ s: "farol", x: px, y: py }); lights.push({ x: px, y: py - 26, r: 70, c: "#ffd2a0" }); });
    for (let i = 0; i < 12; i++) props.push({ s: "banco", x: 140 + i * 70, y: i % 2 ? 460 : 580 });
    for (let i = 0; i < 26; i++) { const x = 90 + r() * (MAP - 180), y = r() < 0.5 ? 100 + r() * 90 : 860 + r() * 70; if (free(x, y, 26)) props.push({ s: "arbol", x, y }); }
  } else if (theme === "feria") {
    // Feria Persa de San Miguel: el viejo castillo de Balbín, con torres de colores y cúpulas
    tiles(0, 0, MAP, MAP, "#8c8c88", "#7e7e7a", 16, "#96968f");
    noise(["#7a7a76", "#a0a09a", "#85857f"], 14000);
    road(MAP - 58, 58); tiles(0, MAP - 76, MAP, 18, "#a39e92", "#8f8a7e", 9);
    text("AV. BALBÍN", 150, MAP - 16, "rgba(240,240,240,.35)", 12);
    sky(80);
    const cols = ["#e8a0b4", "#7ec8e3", "#f2c84b", "#e8a0b4", "#7ec8e3", "#f2c84b"];
    for (let i = 0; i < 6; i++) {
      const x0 = Math.round(i * MAP / 6), w = Math.ceil(MAP / 6), col = cols[i];
      g.fillStyle = col; g.fillRect(x0, 78, w, 104);
      g.fillStyle = shade(col, 0.82); for (let y = 86; y < 176; y += 8) for (let x = x0 + ((y / 8) % 2) * 6; x < x0 + w; x += 12) g.fillRect(x, y, 10, 1);
      for (let x = x0 + 4; x < x0 + w - 6; x += 16) { g.fillStyle = col; g.fillRect(x, 66, 9, 12); g.fillStyle = shade(col, 1.12); g.fillRect(x, 66, 9, 2); }
      for (let x = x0 + 20; x < x0 + w - 20; x += 44) { g.fillStyle = "#3a2a44"; g.fillRect(x, 112, 14, 26); disc(x + 7, 112, 7, "#3a2a44", 6); g.fillStyle = "#ffcf7a"; if (r() < 0.6) g.fillRect(x + 3, 116, 8, 18); }
    }
    g.fillStyle = "#f3e6c8"; g.fillRect(0, 174, MAP, 8); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, 182, MAP, 8);
    // portón con el cartel
    g.fillStyle = "#2a2030"; g.fillRect(452, 120, 120, 62); disc(512, 120, 60, "#2a2030", 34);
    g.fillStyle = "#6a4020"; g.fillRect(470, 150, 84, 32);
    g.fillStyle = "#f3e6c8"; g.fillRect(420, 84, 184, 26); g.fillStyle = "#c8102e"; g.fillRect(422, 86, 180, 22);
    text("FERIA PERSA", 512, 98, "#fff4d0", 17);
    lights.push({ x: 512, y: 150, r: 90, c: "#ffcf7a" });
    // torres con cúpulas
    [[64, "#e8a0b4", "#3fb8af"], [300, "#f2c84b", "#e8a0b4"], [724, "#7ec8e3", "#f2c84b"], [960, "#e8a0b4", "#3fb8af"]].forEach(([x, col, dome]) => {
      g.fillStyle = col; g.fillRect(x - 32, 34, 64, 150); g.fillStyle = shade(col, 0.8); g.fillRect(x + 20, 34, 12, 150);
      for (let k = x - 32; k < x + 32; k += 11) { g.fillStyle = col; g.fillRect(k, 26, 7, 9); }
      disc(x, 22, 30, dome, 24); disc(x - 8, 12, 12, shade(dome, 1.35), 8); g.fillStyle = "#f2c84b"; g.fillRect(x - 1, -6, 3, 10);
      g.fillStyle = "#3a2a44"; g.fillRect(x - 6, 70, 12, 20); disc(x, 70, 6, "#3a2a44", 5); g.fillStyle = "#ffcf7a"; g.fillRect(x - 3, 73, 6, 15);
      g.fillStyle = "#3a2a44"; g.fillRect(x - 6, 120, 12, 22); g.fillStyle = "#ffcf7a"; g.fillRect(x - 3, 124, 6, 16);
      lights.push({ x, y: 90, r: 60, c: "#ffcf7a" });
    });
    // puestos en hileras, con pasillo central
    const rows = [280, 400, 520, 640, 760, 880];
    rows.forEach((y, ri) => {
      for (let x = 70; x < MAP - 40; x += 76) {
        if (Math.abs(x - 512) < 64) continue;
        const k = r();
        if (k < 0.12) continue;
        if (k < 0.22) { props.push({ s: "perchero", x: x + r() * 10, y }); continue; }
        if (k < 0.27) { props.push({ s: "parrilla", x, y }); lights.push({ x, y: y - 8, r: 54, c: "#ff9a4a" }); continue; }
        props.push({ s: ["puesto", "puesto2", "puesto3", "puesto4"][Math.floor(r() * 4)], x, y });
      }
      // guirnalda de lamparitas sobre el pasillo
      const gy = y - 58;
      for (let x = 0; x < MAP; x += 6) { const sag = Math.sin((x % 128) / 128 * Math.PI) * 10; g.fillStyle = "#2a2a30"; g.fillRect(x, Math.round(gy + sag), 6, 1); if (x % 12 === 0) { g.fillStyle = ["#ffd24a", "#ff5fb0", "#7fe0ff", "#9dff6a"][(x / 12 + ri) % 4]; g.fillRect(x, Math.round(gy + sag) + 1, 2, 2); } }
      for (let x = 64; x < MAP; x += 256) lights.push({ x: x + (ri % 2) * 128, y: gy + 8, r: 58, c: ["#ffd98a", "#ff9ad0", "#9ae8ff"][ri % 3] });
    });
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
    [[140, 150], [MAP - 140, 150], [140, MAP - 150], [MAP - 140, MAP - 150]].forEach(([x, y]) => { props.push({ s: "farol", x, y }); lights.push({ x, y: y - 26, r: 190, c: "#e6eeff" }); });
    for (let i = 0; i < 10; i++) props.push({ s: "banco", x: 200 + i * 70, y: 160 });
  } else if (theme === "tortugas") {
    // Tortugas Open Mall: paseo a cielo abierto, palmeras, cúpulas de vidrio y el boulevard sobre el agua
    tiles(0, 0, MAP, MAP, "#c9bba0", "#b8aa90", 16, "#d3c6ad");
    noise(["#bfb196", "#d6c9b0"], 9000);
    tiles(448, 176, 128, 600, "#b7a88c", "#a89a7f", 16, "#c2b397");
    tiles(0, 468, MAP, 104, "#b7a88c", "#a89a7f", 16, "#c2b397");
    sky(70);
    [[260, 72], [764, 72]].forEach(([x, y]) => { disc(x, y, 118, "#8fbfd6", 58); g.fillStyle = "#151733"; g.fillRect(x - 120, y, 240, 60); disc(x, y, 112, "#bfe3f0", 54); g.fillStyle = "#151733"; g.fillRect(x - 120, y + 1, 240, 60); g.fillStyle = "#7aa6bd"; for (let k = -100; k <= 100; k += 20) g.fillRect(x + k, y - Math.round(54 * Math.sqrt(1 - (k / 112) ** 2)), 1, Math.round(54 * Math.sqrt(1 - (k / 112) ** 2))); lights.push({ x, y: y + 20, r: 110, c: "#bfe3f0" }); });
    g.fillStyle = "#cdbd9f"; g.fillRect(0, 62, MAP, 14); g.fillStyle = "#e6d7bc"; g.fillRect(0, 76, MAP, 96);
    const shops = [["COTO", "#e1251b", "#ffffff"], ["CINEMARK", "#b8141b", "#ffffff"], ["HELADOS", "#ff8ac2", "#ffffff"], ["DEPORTES", "#1e1e24", "#f2c230"], ["SODIMAC", "#e30613", "#ffffff"], ["CAFÉ", "#6b4a2f", "#f3e6c8"], ["JUGUETES", "#2e5fa8", "#ffffff"], ["LIBROS", "#2f6d32", "#ffffff"]];
    shops.forEach(([t, bg, fg], i) => {
      const x = i * 128 + 8;
      g.fillStyle = bg; g.fillRect(x + 6, 84, 104, 20); text(t, x + 58, 94, fg, 13);
      g.fillStyle = "#5a5048"; g.fillRect(x + 4, 110, 108, 62); g.fillStyle = "#9fcbe0"; g.fillRect(x + 7, 113, 102, 59);
      g.fillStyle = "#ffe7a8"; g.fillRect(x + 10, 150, 96, 20); g.fillStyle = "#5a5048"; for (let k = x + 40; k < x + 110; k += 34) g.fillRect(k, 113, 2, 59);
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x + 12, 116, 12, 2);
      lights.push({ x: x + 58, y: 178, r: 70, c: "#ffe2a8" });
    });
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 172, MAP, 6);
    // fuente con cascada en el cruce
    disc(512, 520, 58, "#a89a7f"); disc(512, 520, 52, "#e6d7bc"); disc(512, 520, 46, "#2f7fa8"); disc(512, 520, 40, "#4fa3c7");
    for (let a = 0; a < Math.PI * 2; a += 0.2) { g.fillStyle = "#e8f6ff"; g.fillRect(Math.round(512 + Math.cos(a) * 24), Math.round(520 + Math.sin(a) * 20), 2, 2); }
    disc(512, 520, 14, "#e6d7bc"); disc(512, 518, 8, "#bfe3f0"); noise(["#9fe0ff", "#ffffff"], 160, 470, 482, 84, 76);
    lights.push({ x: 512, y: 520, r: 96, c: "#7fd0ff" });
    // palmeras con luz desde abajo
    for (let y = 230; y < 760; y += 88) for (const x of [424, 600]) { if (Math.abs(y - 520) < 70) continue; props.push({ s: "palmera", x, y }); lights.push({ x, y: y - 20, r: 44, c: "#ffd98a" }); }
    for (let x = 90; x < MAP; x += 110) for (const y of [462, 580]) { if (Math.abs(x - 512) < 120) continue; props.push({ s: "palmera", x, y }); }
    props.push({ s: "calesita", x: 220, y: 720 }); lights.push({ x: 220, y: 700, r: 90, c: "#ff9ad0" });
    props.push({ s: "calesita", x: 820, y: 330 }); lights.push({ x: 820, y: 310, r: 90, c: "#ffe27a" });
    for (let i = 0; i < 14; i++) { const x = 80 + r() * (MAP - 160), y = 230 + r() * 200; if (Math.abs(x - 512) > 90 && free(x, y, 40)) props.push({ s: "banco", x, y }); }
    // deck de madera de las terrazas y el lago
    g.fillStyle = "#9c6b3f"; g.fillRect(0, 780, MAP, 92); g.fillStyle = "#86592f"; for (let y = 784; y < 872; y += 6) g.fillRect(0, y, MAP, 1);
    g.fillStyle = "#b07e4e"; for (let i = 0; i < 400; i++) g.fillRect(Math.floor(r() * MAP), 781 + Math.floor(r() * 14) * 6, 20, 1);
    g.fillStyle = "#e6d7bc"; g.fillRect(0, 870, MAP, 6);
    g.fillStyle = "#2f7fa8"; g.fillRect(0, 876, MAP, MAP - 876); noise(["#4fa3c7", "#3a90b8", "#7fc3e6"], 3200, 0, 880, MAP, MAP - 880, 2);
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,226,168,.5)"; g.fillRect(Math.floor(r() * MAP), 890 + Math.floor(r() * 120), 10 + Math.floor(r() * 16), 1); }
    for (let x = 60; x < MAP; x += 96) { props.push({ s: r() < 0.5 ? "sombrilla" : "sombrilla2", x: x + r() * 20, y: 842 }); lights.push({ x, y: 830, r: 50, c: "#ffd98a" }); }
  } else if (theme === "terrazas") {
    // Terrazas de Mayo: el "Carrefour de Ruta 8 y 202", el patio de comidas y el estacionamiento gigante
    g.fillStyle = "#505050"; g.fillRect(0, 0, MAP, MAP); noise(["#484848", "#5a5a5a", "#555555"], 22000);
    sky(40);
    g.fillStyle = "#b8b8b4"; g.fillRect(0, 40, MAP, 52); for (let x = 30; x < MAP; x += 120) { g.fillStyle = "#9a9a96"; g.fillRect(x, 50, 26, 16); g.fillStyle = "#7a7a76"; g.fillRect(x + 4, 54, 18, 2); }
    g.fillStyle = "#d9d9d6"; g.fillRect(0, 92, MAP, 122); g.fillStyle = "#c4c4c0"; for (let x = 0; x < MAP; x += 32) g.fillRect(x, 92, 1, 122); g.fillRect(0, 150, MAP, 1);
    g.fillStyle = "#a9a9a5"; g.fillRect(0, 204, MAP, 10);
    // entrada de vidrio y cartel
    g.fillStyle = "#6b7f8a"; g.fillRect(428, 138, 168, 76); g.fillStyle = "#9cc3d5"; g.fillRect(432, 142, 160, 72); g.fillStyle = "#6b7f8a"; for (let x = 452; x < 592; x += 20) g.fillRect(x, 142, 2, 72);
    g.fillStyle = "#ffe7a8"; g.fillRect(470, 184, 84, 30);
    g.fillStyle = "#ffffff"; g.fillRect(380, 98, 264, 34); g.fillStyle = "#1e4fa1"; g.fillRect(380, 128, 264, 4);
    text("TERRAZAS DE MAYO", 512, 115, "#1e4fa1", 20);
    g.fillStyle = "#ffffff"; g.fillRect(90, 104, 200, 40); g.fillStyle = "#1e4fa1"; g.fillRect(90, 138, 200, 6); g.fillStyle = "#e1251b"; g.fillRect(90, 104, 200, 5);
    text("CARREFOUR", 190, 124, "#1e4fa1", 20);
    g.fillStyle = "#b8141b"; g.fillRect(700, 104, 150, 34); text("CINEMARK", 775, 121, "#ffffff", 17);
    g.fillStyle = "#1e1e24"; g.fillRect(866, 104, 126, 34); text("BOWLING", 938, 121, "#ffd24a", 15);
    g.fillStyle = "#f2f2f2"; g.fillRect(874, 110, 6, 22); disc(877, 110, 3, "#f2f2f2"); g.fillStyle = "#e1251b"; g.fillRect(874, 114, 6, 2);
    for (let i = 0; i < 26; i++) { g.fillStyle = ["#ff5fb0", "#ffd24a", "#7fe0ff", "#9dff6a"][i % 4]; g.fillRect(310 + i * 3, 160 + Math.round(Math.sin(i) * 3), 2, 2); }
    text("NEVERLAND", 350, 180, "#ff8ad8", 12);
    lights.push({ x: 512, y: 200, r: 110, c: "#ffe7a8" }, { x: 190, y: 150, r: 80, c: "#9ab8ff" }, { x: 775, y: 150, r: 70, c: "#ff8a8a" }, { x: 350, y: 175, r: 70, c: "#ff9ad0" });
    // terrazas del patio de comidas
    tiles(0, 214, MAP, 86, "#c8c4ba", "#b6b2a8", 12, "#d2cec4");
    g.fillStyle = "#3e8e41"; for (let x = 0; x < MAP; x += 64) g.fillRect(x + 4, 294, 52, 6);
    for (let x = 60; x < MAP; x += 84) { if (Math.abs(x - 512) < 90) continue; props.push({ s: r() < 0.5 ? "sombrilla" : "sombrilla2", x: x + r() * 14, y: 268 }); }
    // estacionamiento: filas de cocheras con autos
    const strip = y0 => {
      g.fillStyle = "#e8e8e8"; g.fillRect(40, y0, MAP - 80, 2); g.fillRect(40, y0 + 60, MAP - 80, 2);
      for (let x = 40; x <= MAP - 40; x += 56) { g.fillRect(x, y0, 2, 28); g.fillRect(x, y0 + 34, 2, 28); }
      g.fillStyle = "#6a6a66"; g.fillRect(40, y0 + 28, MAP - 80, 6);
      for (let x = 40; x < MAP - 60; x += 56) for (const dy of [26, 60]) if (r() < 0.55) props.push({ s: ["auto", "auto2", "auto3", "auto2"][Math.floor(r() * 4)], x: x + 29, y: y0 + dy, fl: r() < 0.5 });
      for (let x = 96; x < MAP - 60; x += 224) { props.push({ s: "poste", x, y: y0 + 32 }); lights.push({ x, y: y0 - 6, r: 92, c: "#e6eeff" }); }
      props.push({ s: "arbolito", x: 30, y: y0 + 34 }); props.push({ s: "arbolito", x: MAP - 30, y: y0 + 34 });
    };
    [360, 520, 680, 840].forEach(strip);
    for (let i = 0; i < 6; i++) { g.fillStyle = "#e8e8e8"; const x = 120 + i * 150; g.fillRect(x, 440, 18, 2); g.fillRect(x + 12, 436, 2, 10); }
    road(962, 62); text("RUTA 8", 120, 1004, "rgba(240,240,240,.35)", 12);
  }
  return { canvas: c, props: props.map(p => ({ ...p, x: Math.round(p.x), y: Math.round(p.y) })), lights };
}
