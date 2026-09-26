// Mapas pregenerados en un canvas de 1024 x 1024, inspirados en lugares reales de la zona.
import { MAP } from "./engine.js";

function seeded(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))).toString(16).padStart(2, "0"); return "#" + f(n >> 16) + f(n >> 8 & 255) + f(n & 255); };

export const THEMES = {
  plaza:    { name: "Plaza Mitre", sub: "Para arrancar tranqui", night: [10, 12, 32, 0.74] },
  estacion: { name: "Estación Los Polvorines", sub: "Ojo con el Belgrano Norte", night: [14, 10, 30, 0.66] },
  feria:    { name: "Feria Persa", sub: "Cajones con premios y el fletero", night: [16, 10, 34, 0.58] },
  bielli:   { name: "Team Bielli", sub: "La fila de la entrada en calor", night: [12, 12, 22, 0.4] },
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
    // Feria Persa de San Miguel (Av. Balbín): el castillo de colores, el paredón azul con reja blanca y el galpón con pasillos
    g.fillStyle = "#86878a"; g.fillRect(0, 0, MAP, MAP); noise(["#7e7f82", "#8f9093", "#8a8b8e"], 16000);
    sky(120);
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
    g.fillStyle = "#16306a"; g.font = "italic bold 19px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Feria Persa", 522, 98);
    g.fillStyle = "#f2f2f2"; g.font = "italic bold 19px Georgia"; g.fillText("Feria Persa", 521, 97);
    lights.push({ x: 512, y: 150, r: 90, c: "#ffcf7a" }, { x: 512, y: 94, r: 70, c: "#9ad8ff" });
    // paredón azul con reja blanca y el pasto de adelante
    g.fillStyle = "#2d4fb0"; g.fillRect(0, 184, MAP, 12); g.fillStyle = "#1f3a8a"; g.fillRect(0, 194, MAP, 2);
    g.fillStyle = "#f2f2f2"; g.fillRect(0, 176, MAP, 1); for (let x = 0; x < MAP; x += 3) g.fillRect(x, 176, 1, 8);
    for (let x = 0; x < MAP; x += 128) { g.fillStyle = "#2d4fb0"; g.fillRect(x, 172, 10, 24); }
    g.fillStyle = "#4a8a3a"; g.fillRect(0, 196, MAP, 22); noise(["#3f7a32", "#5a9a48"], 2500, 0, 196, MAP, 22);
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
    for (let y = 260; y < 940; y += 130) for (let x = 110; x < MAP; x += 200) { g.fillStyle = "#dfe8f0"; g.fillRect(x - 12, y - 64, 24, 2); lights.push({ x, y: y - 40, r: 84, c: "#e6f0ff" }); }
    // Av. Balbín
    road(MAP - 58, 58); tiles(0, MAP - 76, MAP, 18, "#a39e92", "#8f8a7e", 9);
    text("AV. BALBÍN", 150, MAP - 16, "rgba(240,240,240,.35)", 12);
    for (let x = 60; x < MAP; x += 170) { props.push({ s: "farol", x, y: MAP - 60 }); lights.push({ x, y: MAP - 86, r: 60, c: "#ffd98a" }); if (x + 85 < MAP) props.push({ s: "arbol", x: x + 85, y: MAP - 60 }); }
  } else if (theme === "bielli") {
    // Team Bielli (9 de Julio 2340, Los Polvorines): encastrables amarillos y negros, bolsas, el ring y las banderas
    g.fillStyle = "#6f7378"; g.fillRect(0, 0, MAP, MAP); noise(["#676b70", "#777b80"], 9000);
    for (let y = 200; y < 990; y += 32) for (let x = 24; x < 1000; x += 32) {
      const yel = ((x - 24) / 32 + (y - 200) / 32) % 2 === 0;
      g.fillStyle = yel ? "#f2d21e" : "#1c1c20"; g.fillRect(x, y, 32, 32);
      g.fillStyle = yel ? "#1c1c20" : "#f2d21e"; g.fillRect(x + 12, y, 8, 3); g.fillRect(x, y + 12, 3, 8);
      g.fillStyle = yel ? "#e0c010" : "#26262b"; g.fillRect(x + 3, y + 29, 29, 3);
    }
    // pared blanca con techo de chapa
    g.fillStyle = "#3a3e46"; g.fillRect(0, 0, MAP, 58); g.fillStyle = "#4a4e56"; for (let x = 0; x < MAP; x += 12) g.fillRect(x, 0, 5, 58);
    g.fillStyle = "#e8e6df"; g.fillRect(0, 58, MAP, 130); g.fillStyle = "#cfcdc6"; g.fillRect(0, 176, MAP, 12);
    // banderines de países
    const flags = [["#74acdf", "#ffffff"], ["#c8102e", "#ffffff"], ["#009b3a", "#fedf00"], ["#002868", "#bf0a30"], ["#ffffff", "#bc002d"], ["#000000", "#dd0000"], ["#ff9933", "#138808"], ["#0038a8", "#ce1126"]];
    for (let x = 4, i = 0; x < MAP; x += 20, i++) { const [a, b] = flags[i % flags.length], y = 64 + Math.round(Math.sin(x / 60) * 3); g.fillStyle = "#5a5a5a"; g.fillRect(x, y, 20, 1); g.fillStyle = a; g.fillRect(x + 2, y + 1, 14, 5); g.fillStyle = b; g.fillRect(x + 2, y + 6, 14, 4); }
    // banners del team
    [[150, "TEAM BIELLI"], [512, "TEAM BIELLI"], [870, "KICK BOXING"]].forEach(([x, t]) => {
      g.fillStyle = "#1c1c20"; g.fillRect(x - 90, 84, 180, 52); g.fillStyle = "#f2d21e"; g.fillRect(x - 86, 88, 172, 3); g.fillRect(x - 86, 129, 172, 3);
      for (let k = 0; k < 16; k++) { const an = k / 16 * Math.PI * 2; g.fillStyle = "#f2d21e"; g.fillRect(Math.round(x - 65 + Math.cos(an) * 15), Math.round(109 + Math.sin(an) * 15), 3, 3); } disc(x - 64, 110, 12, "#f2d21e"); disc(x - 64, 110, 9, "#1c1c20"); text("B", x - 64, 111, "#f2d21e", 14);
      text(t, x + 14, 111, "#f2d21e", 19);
    });
    [[330, 110], [700, 110]].forEach(([x, y]) => { g.fillStyle = "#6b4a2f"; g.fillRect(x - 22, y - 16, 44, 32); g.fillStyle = "#b8c4d0"; g.fillRect(x - 19, y - 13, 38, 26); g.fillStyle = "#1c1c20"; g.fillRect(x - 6, y - 8, 12, 16); });
    [[420, 150], [980, 150], [40, 150]].forEach(([x, y]) => { disc(x, y, 11, "#5a5e66"); disc(x, y, 8, "#c9ced4"); g.fillStyle = "#5a5e66"; g.fillRect(x - 1, y - 7, 2, 14); g.fillRect(x - 7, y - 1, 14, 2); });
    // bolsas colgadas frente a la pared
    for (let x = 70; x < MAP; x += 96) props.push({ s: "bolsa", x: x + (x % 3) * 6, y: 232 });
    for (let x = 90; x < 400; x += 96) props.push({ s: "bolsa", x, y: 820 });
    // ring
    const rx = 560, ry = 440, rs = 260;
    g.fillStyle = "#2b2f3a"; g.fillRect(rx - 8, ry - 8, rs + 16, rs + 16);
    g.fillStyle = "#50607a"; g.fillRect(rx, ry, rs, rs); noise(["#4a5a72", "#566680"], 1200, rx, ry, rs, rs);
    text("TEAM BIELLI", rx + rs / 2, ry + rs / 2, "rgba(242,210,30,.35)", 26);
    [["#f2f2f2", 6], ["#d8323a", 12], ["#2d4fb0", 18]].forEach(([c, o]) => { g.fillStyle = c; g.fillRect(rx + 4, ry + o, rs - 8, 1); g.fillRect(rx + 4, ry + rs - o, rs - 8, 1); g.fillRect(rx + o - 2, ry + 4, 1, rs - 8); g.fillRect(rx + rs - o + 2, ry + 4, 1, rs - 8); });
    g.fillStyle = "#d8d8d4"; g.fillRect(rx - 26, ry + rs - 40, 18, 36); g.fillStyle = "#9a9a96"; for (let k = 0; k < 4; k++) g.fillRect(rx - 26, ry + rs - 36 + k * 9, 18, 2);
    [[rx, ry + 4, "rpost"], [rx + rs, ry + 4, "bpost"], [rx, ry + rs, "bpost"], [rx + rs, ry + rs, "rpost"]].forEach(([x, y, s]) => props.push({ s, x, y }));
    for (let i = 0; i < 6; i++) props.push({ s: "silla", x: rx + 24 + i * 40, y: ry + rs + 44 });
    for (let i = 0; i < 4; i++) props.push({ s: "silla", x: rx - 44, y: ry + 30 + i * 44 });
    // tubos de luz
    for (let y = 250; y < MAP; y += 180) for (let x = 120; x < MAP; x += 240) lights.push({ x, y, r: 130, c: "#eef4ff" });
    lights.push({ x: rx + rs / 2, y: ry + rs / 2, r: 170, c: "#fff6d8" });
    g.fillStyle = "#6f7378"; g.fillRect(0, 990, MAP, 34); g.fillStyle = "#3a3e46"; g.fillRect(470, 1000, 84, 24); text("9 DE JULIO 2340", 512, 994, "rgba(240,240,240,.5)", 10);
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
