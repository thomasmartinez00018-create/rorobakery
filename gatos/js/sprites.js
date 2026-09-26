// Pixel art generado por código: cada sprite se dibuja pixel a pixel y recibe un contorno automático.
const OUT = [22, 18, 28];

function mk(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w + 2; c.height = h + 2;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.translate(1, 1);
  const api = {
    R: (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), ww, hh); },
    P: (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    E: (cx, cy, rx, ry, col) => { g.fillStyle = col; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1); } },
    clear: (x, y, ww, hh) => g.clearRect(x, y, ww, hh),
    g
  };
  draw(api);
  outline(c);
  return c;
}
function outline(c) {
  const g = c.getContext("2d"), w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h), a = d.data, src = new Uint8ClampedArray(a);
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 20;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] > 20) continue;
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { a[i] = OUT[0]; a[i + 1] = OUT[1]; a[i + 2] = OUT[2]; a[i + 3] = 255; }
  }
  g.putImageData(d, 0, 0);
}
function flipped(c) { const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const g = o.getContext("2d"); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function white(c) { const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const g = o.getContext("2d"); g.drawImage(c, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height); return o; }
function scaled(c, s) { const o = document.createElement("canvas"); o.width = c.width * s; o.height = c.height * s; const g = o.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o; }

/* ---------- personas ---------- */
function human(o, f) {
  return mk(16, 20, ({ R, P }) => {
    const L = [0, 1, 0, -1][f];
    const ll = 4 - (L > 0 ? 1 : 0), rl = 4 - (L < 0 ? 1 : 0);
    R(5, 14, 2, ll, o.pants); R(9, 14, 2, rl, o.pants);
    if (o.stripe) { R(5, 14, 1, ll, o.stripe); R(10, 14, 1, rl, o.stripe); }
    R(4, 14 + ll, 3, 1, o.shoes); R(9, 14 + rl, 3, 1, o.shoes);
    if (o.shoeStripe) { P(5, 14 + ll, o.shoeStripe); P(10, 14 + rl, o.shoeStripe); }
    R(4, 9, 8, 5, o.shirt);
    if (o.print) R(6, 11, 4, 1, o.print);
    if (o.necklace) { P(6, 9, o.necklace); P(9, 9, o.necklace); P(7, 10, o.necklace); P(8, 10, o.necklace); }
    const arm = o.sleeveless ? o.skin : o.shirt;
    const la = L > 0 ? 1 : 0, ra = L < 0 ? 1 : 0;
    R(3, 9 + la, 1, 3, arm); R(12, 9 + ra, 1, 3, arm);
    if (!o.sleeveless) { R(3, 11 + la, 1, 1, o.skin); R(12, 11 + ra, 1, 1, o.skin); }
    P(3, 12 + la, o.skin); P(12, 12 + ra, o.skin);
    R(4, 2, 8, 7, o.skin); R(5, 1, 6, 1, o.skin);
    R(6, 5, 1, 2, "#1a1420"); R(9, 5, 1, 2, "#1a1420");
    P(5, 7, "#f19a9a"); P(10, 7, "#f19a9a"); R(7, 7, 2, 1, "#b8574c");
    if (o.hair === "rulos") {
      R(4, 0, 8, 3, o.hairC); R(3, 1, 10, 3, o.hairC);
      [[2, 2], [13, 2], [3, 0], [12, 0], [6, -1], [9, -1]].forEach(([x, y]) => P(x, y, o.hairC));
      R(4, 3, 8, 1, o.hairC); [[4, 4], [6, 4], [9, 4], [11, 4]].forEach(([x, y]) => P(x, y, o.hairC));
      R(3, 3, 1, 3, o.hairC); R(12, 3, 1, 3, o.hairC);
      P(5, 1, o.hairL); P(9, 0, o.hairL); P(11, 2, o.hairL);
    } else {
      R(4, 0, 8, 2, o.hairC); R(3, 1, 10, 3, o.hairC);
      R(4, 3, 3, 1, o.hairC); R(9, 3, 3, 1, o.hairC); P(7, 2, o.skin);
      R(2, 3, 2, 9, o.hairC); R(12, 3, 2, 9, o.hairC);
      P(5, 1, o.hairL); P(10, 1, o.hairL); P(2, 6, o.hairL);
    }
  });
}
const THOMAS = { skin: "#e8b48e", hair: "rulos", hairC: "#1e1612", hairL: "#3a2a20", shirt: "#17191f", print: "#dcdcdc", sleeveless: true, pants: "#8b8e96", stripe: "#e9e9e9", shoes: "#2a4fb0", shoeStripe: "#ffffff" };
const ROCIO = { skin: "#f0c4a2", hair: "largo", hairC: "#2b1a13", hairL: "#4a2f22", shirt: "#c7b3ea", necklace: "#e9edf2", pants: "#1d1d24", shoes: "#f2f2f2" };

/* ---------- gatos ---------- */
function cat(o, f) {
  return mk(18, 15, ({ R, P, E, g }) => {
    g.translate(0, 2);
    const up = f % 2;
    R(4, 10, 1, 2 - up, o.fur); R(6, 10, 1, 2 - (1 - up), o.fur); R(11, 10, 1, 2 - (1 - up), o.fur); R(13, 10, 1, 2 - up, o.fur);
    if (o.paws) { P(4, 11 - up, o.paws); P(6, 11 - (1 - up), o.paws); P(11, 11 - (1 - up), o.paws); P(13, 11 - up, o.paws); }
    E(8.5, 7.5, o.fat ? 6 : 5.2, o.fat ? 3.6 : 3, o.fur);
    if (o.belly) E(8.5, 9, 3.2, 1.6, o.belly);
    if (o.stripe) [5, 7, 9, 11].forEach(x => R(x, 5, 1, 2, o.stripe));
    if (o.patch) E(6, 6.5, 2.2, 1.6, o.patch);
    if (o.patch2) E(10.5, 8, 2, 1.4, o.patch2);
    const tailUp = f % 2 ? 0 : 1;
    R(2, 4 + tailUp, 1, 4, o.fur); P(1, 3 + tailUp, o.fur); P(1, 2 + tailUp, o.tip || o.fur);
    if (o.fluffy) { R(1, 5 + tailUp, 1, 3, o.fur); }
    R(12, 2, 5, 5, o.fur); R(11, 3, 1, 3, o.fur);
    P(12, 1, o.fur); P(16, 1, o.fur); P(12, 0, o.fur); P(16, 0, o.fur);
    P(12, 1, o.inner || "#f0a0a0"); P(16, 1, o.inner || "#f0a0a0");
    if (o.bib) { R(13, 5, 3, 2, o.bib); R(11, 6, 3, 2, o.bib); }
    if (o.blaze) R(14, 2, 1, 3, o.blaze);
    if (o.patch) { R(12, 2, 2, 2, o.patch); P(12, 0, o.patch); }
    if (o.patch2) { R(15, 1, 2, 2, o.patch2); P(16, 0, o.patch2); }
    if (o.face) { R(13, 3, 4, 3, o.face); P(12, 0, o.face); P(16, 0, o.face); }
    P(13, 3, o.eye); P(16, 3, o.eye);
    P(17, 4, "#e88a8a");
    if (o.grumpy) { P(12, 2, "#1a1420"); P(13, 2, "#1a1420"); P(15, 2, "#1a1420"); P(16, 2, "#1a1420"); }
    if (o.crown) { R(12, -1, 5, 1, "#f2c230"); P(12, -2, "#f2c230"); P(14, -2, "#f2c230"); P(16, -2, "#f2c230"); P(14, -1, "#e0483c"); }
  });
}
const CATS = {
  gato: { fur: "#8d8f98", stripe: "#6b6d76", eye: "#f2d24a", paws: "#c9ccd4" },
  negro: { fur: "#2b2833", eye: "#9dff6a", inner: "#6a3b4a" },
  gordo: { fur: "#e08a3a", stripe: "#b8662a", belly: "#f4d0a4", eye: "#6ad14a", fat: true },
  juli: { fur: "#8a8d96", bib: "#f4f4f4", blaze: "#f4f4f4", paws: "#f4f4f4", eye: "#bcd25a", fluffy: true },
  luz: { fur: "#8d8170", stripe: "#4a3f34", belly: "#d19356", eye: "#e0a53a", grumpy: true },
  linda: { fur: "#8a7a66", stripe: "#3e342b", bib: "#f6f3ee", paws: "#f6f3ee", eye: "#ff5a3a", grumpy: true, fluffy: true, fat: true, crown: true },
  saltarin: { fur: "#e8e2d6", patch: "#e0822e", eye: "#ffd24a", paws: "#ffffff", tip: "#e0822e" },
  escupidor: { fur: "#efe0c4", face: "#4a3326", eye: "#5ab8ff", paws: "#4a3326", tip: "#4a3326", inner: "#4a3326" },
  madre: { fur: "#f4f1ea", patch: "#e0822e", patch2: "#2b2833", eye: "#6ad14a", fat: true }
};

function kitten(f) {
  return mk(11, 9, ({ R, P, E }) => {
    const up = f % 2;
    R(3, 7, 1, 2 - up, "#b7b9c2"); R(7, 7, 1, 2 - (1 - up), "#b7b9c2");
    E(5, 5, 3.4, 2.2, "#b7b9c2"); R(1, 2 + up, 1, 3, "#b7b9c2");
    E(8.5, 3, 2.4, 2.2, "#b7b9c2"); P(7, 0, "#b7b9c2"); P(10, 0, "#b7b9c2"); P(7, 1, "#f0a0a0"); P(10, 1, "#f0a0a0");
    P(8, 3, "#1a1420"); P(10, 3, "#1a1420"); P(9, 4, "#e88a8a"); P(5, 4, "#9a9ca5");
  });
}

function dog(o, f) {
  return mk(15, 12, ({ R, P, E }) => {
    const up = f % 2;
    [[4, up], [6, 1 - up], [10, 1 - up], [12, up]].forEach(([x, u]) => { R(x, 9, 1, 2 - u, o.fur); P(x, 10 - u, o.dark); });
    E(8, 7, 4.8, 2.8, o.fur);
    [[5, 5], [8, 5], [10, 6], [6, 8], [9, 8]].forEach(([x, y]) => P(x, y, o.dark));
    E(12, 3.5, 2.8, 2.8, o.fur); P(11, 2, o.dark); P(13, 4, o.dark);
    R(14, 4, 1, 2, o.fur); P(15, 4, "#1a1420");
    P(13, 3, "#1a1420");
    E(10.5, 5, 1, 1.8, o.dark);
    E(2.5, 4 + up, 1.6, 1.6, o.fur);
  });
}
const ROMERO = { fur: "#b8652f", dark: "#8e4a1f" };

function paloma(f) {
  return mk(12, 9, ({ R, P, E }) => {
    E(6, 5, 4, 2.4, "#8f96a3");
    R(8, 2, 3, 3, "#6e7a8e"); P(11, 3, "#e3a74b"); P(9, 3, "#1a1420");
    P(8, 5, "#4f8a7a"); P(7, 5, "#7a5fa0");
    if (f % 2) R(3, 1, 4, 3, "#747b88"); else R(3, 6, 4, 2, "#747b88");
    R(0, 4, 2, 2, "#6e7a8e");
    P(5, 8, "#d27a5a"); P(7, 8, "#d27a5a");
  });
}

/* ---------- objetos ---------- */
function stall(c1, c2) {
  return mk(34, 30, ({ R, P }) => {
    R(1, 6, 1, 24, "#6b6f78"); R(32, 6, 1, 24, "#6b6f78");
    R(3, 18, 28, 7, "#b8a58a"); R(3, 18, 28, 1, "#d6c6a8"); R(4, 25, 1, 5, "#6b4f33"); R(29, 25, 1, 5, "#6b4f33");
    ["#d22b3a", "#f2f2f2", "#1e1e24", "#7ec8e3", "#f2c230", "#e8a0b4", "#6fae4a"].forEach((c, i) => R(5 + i * 3.6, 15 - (i % 2), 3, 4 + (i % 2), c));
    R(20, 21, 7, 3, "#f2f2f2"); P(22, 22, "#1e1e24"); P(24, 22, "#1e1e24");
    for (let x = 0; x < 34; x += 4) R(x, 0, 4, 7, (x / 4) % 2 ? c2 : c1);
    for (let x = 0; x < 34; x += 4) R(x + 1, 7, 2, 1, (x / 4) % 2 ? c2 : c1);
    R(0, 0, 34, 1, "rgba(255,255,255,.35)");
  });
}
const ITEMS = {
  medialuna: () => mk(8, 6, ({ E, g }) => { E(4, 3, 4, 3, "#e8a23a"); g.globalCompositeOperation = "destination-out"; E(5, 1.5, 3, 2.2, "#000"); g.globalCompositeOperation = "source-over"; E(2.5, 4, 1, 0.8, "#f6c66a"); }),
  rodillo: () => mk(12, 4, ({ R }) => { R(2, 0, 8, 4, "#d6a266"); R(3, 1, 6, 1, "#ecc28a"); R(0, 1, 2, 2, "#8b5a2b"); R(10, 1, 2, 2, "#8b5a2b"); }),
  torta: () => mk(9, 8, ({ R, P }) => { R(1, 3, 7, 4, "#f4a6c6"); R(1, 2, 7, 1, "#ffffff"); P(2, 3, "#ffffff"); P(5, 3, "#ffffff"); R(1, 6, 7, 1, "#c97a9a"); P(4, 0, "#d22b3a"); P(4, 1, "#d22b3a"); }),
  hairball: () => mk(6, 6, ({ E, P }) => { E(3, 3, 3, 3, "#8a7a66"); P(2, 2, "#5e5244"); P(4, 3, "#5e5244"); P(3, 4, "#b8a58a"); }),
  gem1: () => mk(5, 6, ({ R, P }) => { R(1, 1, 3, 4, "#46e0c8"); P(2, 0, "#46e0c8"); P(2, 5, "#2a9f8c"); R(0, 2, 1, 2, "#2a9f8c"); R(4, 2, 1, 2, "#2a9f8c"); P(2, 2, "#e6fffb"); }),
  gem2: () => mk(5, 6, ({ R, P }) => { R(1, 1, 3, 4, "#6a8cff"); P(2, 0, "#6a8cff"); P(2, 5, "#3f5bc2"); R(0, 2, 1, 2, "#3f5bc2"); R(4, 2, 1, 2, "#3f5bc2"); P(2, 2, "#e6ecff"); }),
  gem5: () => mk(7, 8, ({ R, P }) => { R(1, 2, 5, 4, "#ff5fd2"); R(2, 1, 3, 6, "#ff5fd2"); P(3, 0, "#ff5fd2"); P(3, 7, "#b83a95"); R(0, 3, 1, 2, "#b83a95"); R(6, 3, 1, 2, "#b83a95"); P(2, 2, "#ffe0f6"); }),
  alfajor: () => mk(9, 6, ({ R }) => { R(0, 0, 9, 2, "#5a3622"); R(0, 2, 9, 1, "#f0d7a6"); R(0, 3, 9, 2, "#5a3622"); R(1, 0, 3, 1, "#7a4a30"); }),
  moneda: () => mk(6, 6, ({ E, P }) => { E(3, 3, 3, 3, "#f2c230"); P(2, 1, "#fff2b0"); P(3, 3, "#c79520"); P(3, 2, "#c79520"); }),
  bus: () => mk(36, 17, ({ R, E }) => {
    R(0, 2, 36, 11, "#ececec"); R(0, 9, 36, 2, "#c0392b"); R(3, 4, 25, 3, "#2b3a55");
    for (let x = 7; x < 28; x += 5) R(x, 4, 1, 3, "#ececec");
    R(30, 3, 5, 5, "#2b3a55"); R(31, 1, 4, 1, "#f2c230"); R(0, 2, 36, 1, "#d6d6d6");
    E(7, 14, 2.6, 2.6, "#1a1a1a"); E(28, 14, 2.6, 2.6, "#1a1a1a"); E(7, 14, 1, 1, "#9aa0aa"); E(28, 14, 1, 1, "#9aa0aa");
    R(33, 9, 3, 2, "#ffe7a8");
  }),
  arbol: () => mk(24, 32, ({ R, E }) => { R(10, 20, 4, 12, "#6b4a2f"); R(11, 22, 1, 8, "#8a6440"); E(12, 12, 11, 10, "#2f6b3a"); E(9, 9, 6, 5, "#3f8f4a"); E(16, 15, 6, 5, "#24552e"); E(8, 7, 2, 2, "#5aa860"); }),
  jacaranda: () => mk(24, 32, ({ R, E }) => { R(10, 20, 4, 12, "#6b4a2f"); E(12, 12, 11, 10, "#6f4fa8"); E(9, 9, 6, 5, "#8e6bbf"); E(16, 15, 6, 5, "#5a3f8c"); E(8, 7, 2, 2, "#b79be0"); }),
  farol: () => mk(8, 30, ({ R }) => { R(3, 6, 2, 22, "#2d2d33"); R(2, 27, 4, 3, "#2d2d33"); R(1, 2, 6, 4, "#2d2d33"); R(2, 5, 4, 1, "#ffe7a8"); R(3, 0, 2, 2, "#2d2d33"); }),
  mate: () => mk(9, 10, ({ R, E }) => { E(4.5, 6, 4, 3.6, "#8a5a33"); R(2, 2, 5, 2, "#6fae4a"); R(6, 0, 1, 5, "#d6d6d6"); R(3, 5, 1, 2, "#a8743f"); }),
  guante: () => mk(9, 9, ({ R, E }) => { E(4.5, 3.6, 4, 3.4, "#d32f2f"); R(1, 6, 7, 3, "#f2f2f2"); R(2, 2, 2, 1, "#ff6a6a"); }),
  zapa: () => mk(10, 7, ({ R, P }) => { R(1, 1, 5, 3, "#2a4fb0"); R(0, 3, 10, 2, "#2a4fb0"); R(0, 5, 10, 1, "#ffffff"); P(3, 2, "#ffffff"); P(5, 3, "#ffffff"); P(7, 3, "#ffffff"); }),
  termo: () => mk(6, 11, ({ R }) => { R(0, 2, 6, 9, "#f2f2f2"); R(1, 0, 4, 2, "#7fc6c1"); R(1, 4, 4, 3, "#7fc6c1"); R(1, 3, 1, 7, "#ffffff"); }),
  iman: () => mk(9, 9, ({ R }) => { R(0, 0, 3, 7, "#d32f2f"); R(6, 0, 3, 7, "#d32f2f"); R(0, 6, 9, 3, "#d32f2f"); R(0, 0, 3, 2, "#d6d6d6"); R(6, 0, 3, 2, "#d6d6d6"); }),
  corazon: () => mk(9, 8, ({ R }) => { R(1, 0, 3, 2, "#ff4a7a"); R(5, 0, 3, 2, "#ff4a7a"); R(0, 1, 9, 3, "#ff4a7a"); R(1, 4, 7, 1, "#ff4a7a"); R(2, 5, 5, 1, "#ff4a7a"); R(3, 6, 3, 1, "#ff4a7a"); R(4, 7, 1, 1, "#ff4a7a"); R(2, 1, 1, 1, "#ffc0d4"); }),
  caja: () => mk(12, 10, ({ R, P }) => { R(0, 1, 12, 9, "#b07a42"); R(0, 1, 12, 1, "#d19a5a"); R(0, 5, 12, 1, "#8a5a2b"); R(0, 1, 1, 9, "#8a5a2b"); R(11, 1, 1, 9, "#8a5a2b"); R(2, 2, 8, 2, "#e0822e"); P(3, 2, "#6fae4a"); P(6, 3, "#d22b3a"); P(8, 2, "#f2c230"); }),
  regalo: () => mk(11, 10, ({ R, P }) => { R(0, 3, 11, 7, "#ff8ac2"); R(0, 2, 11, 2, "#ffb3d9"); R(5, 2, 1, 8, "#ffffff"); R(0, 5, 11, 1, "#ffffff"); P(3, 0, "#ffffff"); P(4, 1, "#ffffff"); P(7, 0, "#ffffff"); P(6, 1, "#ffffff"); P(2, 7, "#c9407e"); P(8, 8, "#c9407e"); }),
  manguera: () => mk(10, 9, ({ E, P, R }) => { E(5, 5, 4.6, 3.8, "#2f9a4a"); E(5, 5, 2.6, 2, "#1d6a32"); E(5, 5, 1.2, 1, "#2f9a4a"); R(8, 1, 2, 3, "#d6d6d6"); P(9, 0, "#7fd0ff"); P(9, -1, "#7fd0ff"); }),
  saliva: () => mk(5, 5, ({ E, P }) => { E(2.5, 2.5, 2.5, 2.5, "#b8e06a"); P(1, 1, "#effcd0"); P(3, 3, "#7aa83a"); }),
  vagon: () => mk(84, 24, ({ R }) => {
    R(0, 2, 84, 17, "#c8102e"); R(0, 0, 84, 3, "#8a8d8f"); R(0, 12, 84, 2, "#f2f2f2");
    for (let x = 6; x < 78; x += 12) R(x, 5, 8, 5, "#1a2233");
    R(38, 5, 8, 12, "#a50d25"); R(0, 19, 84, 3, "#2b2b2f");
    [8, 22, 62, 76].forEach(x => R(x - 3, 21, 6, 3, "#1a1a1a"));
  }),
  locomotora: () => mk(60, 24, ({ R }) => {
    R(0, 2, 56, 17, "#c8102e"); R(56, 6, 4, 13, "#c8102e"); R(0, 0, 56, 3, "#8a8d8f"); R(0, 12, 60, 2, "#f2f2f2");
    R(46, 5, 10, 6, "#1a2233"); R(57, 8, 3, 3, "#ffe7a8"); R(6, 5, 8, 5, "#1a2233"); R(20, 5, 8, 5, "#1a2233");
    R(0, 19, 60, 3, "#2b2b2f"); [8, 22, 38, 52].forEach(x => R(x - 3, 21, 6, 3, "#1a1a1a"));
  }),
  fletero: () => mk(52, 22, ({ R, E }) => {
    R(0, 2, 38, 15, "#e8e8e8"); R(38, 6, 12, 11, "#f2f2f2"); R(40, 7, 7, 5, "#2b3a55"); R(0, 2, 38, 2, "#cfcfcf");
    R(4, 7, 30, 5, "#2e5fa8"); R(49, 13, 3, 2, "#ffe7a8");
    E(9, 18, 3, 3, "#1a1a1a"); E(42, 18, 3, 3, "#1a1a1a"); E(9, 18, 1, 1, "#9aa0aa"); E(42, 18, 1, 1, "#9aa0aa");
  }),
  cortadora: () => mk(22, 16, ({ R, E, P }) => {
    R(2, 6, 14, 7, "#d23a2a"); R(4, 4, 10, 3, "#2b2b2f"); R(15, 0, 2, 7, "#9aa0aa"); R(13, 0, 6, 1, "#9aa0aa");
    E(4, 13, 2, 2, "#1a1a1a"); E(14, 13, 2, 2, "#1a1a1a"); P(8, 5, "#f2c230"); R(17, 10, 4, 2, "#6fbf4a"); P(21, 9, "#6fbf4a");
  }),
  carrito: () => mk(22, 17, ({ R, E }) => {
    R(2, 2, 16, 9, "#c9ced4"); for (let x = 4; x < 18; x += 3) R(x, 3, 1, 7, "#8e959d"); R(2, 6, 16, 1, "#8e959d");
    R(1, 0, 2, 3, "#e1251b"); R(0, 0, 3, 1, "#e1251b"); R(3, 11, 14, 2, "#8e959d");
    E(5, 15, 1.6, 1.6, "#1a1a1a"); E(16, 15, 1.6, 1.6, "#1a1a1a");
  }),
  auto: () => mk(44, 20, ({ R, E }) => {
    R(0, 7, 44, 8, "#1e4fa1"); R(9, 2, 22, 6, "#1e4fa1"); R(11, 3, 8, 4, "#9cc3d5"); R(21, 3, 8, 4, "#9cc3d5");
    R(0, 10, 44, 1, "#163b7a"); R(42, 8, 2, 2, "#ffe7a8"); R(0, 8, 2, 2, "#e1251b");
    E(9, 16, 3, 3, "#1a1a1a"); E(35, 16, 3, 3, "#1a1a1a"); E(9, 16, 1, 1, "#9aa0aa"); E(35, 16, 1, 1, "#9aa0aa");
  }),
  auto2: () => mk(44, 20, ({ R, E }) => {
    R(0, 7, 44, 8, "#d9d9d6"); R(9, 2, 22, 6, "#d9d9d6"); R(11, 3, 8, 4, "#5a6a7a"); R(21, 3, 8, 4, "#5a6a7a");
    R(0, 10, 44, 1, "#a9a9a6"); E(9, 16, 3, 3, "#1a1a1a"); E(35, 16, 3, 3, "#1a1a1a");
  }),
  auto3: () => mk(44, 20, ({ R, E }) => {
    R(0, 7, 44, 8, "#b8141b"); R(9, 2, 22, 6, "#b8141b"); R(11, 3, 8, 4, "#9cc3d5"); R(21, 3, 8, 4, "#9cc3d5");
    R(0, 10, 44, 1, "#7a0d12"); E(9, 16, 3, 3, "#1a1a1a"); E(35, 16, 3, 3, "#1a1a1a");
  }),
  // mapas: feria persa
  puesto: () => stall("#2e5fa8", "#2e5fa8"),
  puesto2: () => stall("#d22b3a", "#f2f2f2"),
  puesto3: () => stall("#2f9a4a", "#f2f2f2"),
  puesto4: () => stall("#f2c84b", "#e0822e"),
  perchero: () => mk(16, 20, ({ R, P }) => { R(1, 2, 14, 1, "#9aa0aa"); R(1, 2, 1, 18, "#6b6f78"); R(14, 2, 1, 18, "#6b6f78"); ["#d22b3a", "#1e1e24", "#7ec8e3", "#f2f2f2", "#e8a0b4"].forEach((c, i) => { R(2 + i * 2.5, 3, 2, 9, c); P(2 + i * 2.5, 12, c); }); R(0, 19, 16, 1, "#3a3a40"); }),
  parrilla: () => mk(18, 14, ({ R, P }) => { R(1, 4, 16, 6, "#2b2b2f"); for (let x = 2; x < 17; x += 2) R(x, 4, 1, 6, "#4a4a50"); R(3, 5, 5, 2, "#8a3a22"); R(10, 6, 5, 2, "#8a3a22"); P(5, 5, "#c85a32"); R(2, 10, 1, 4, "#2b2b2f"); R(15, 10, 1, 4, "#2b2b2f"); P(7, 2, "#cfcfcf"); P(9, 1, "#cfcfcf"); P(8, 0, "#e6e6e6"); }),
  // tortugas y terrazas
  palmera: () => mk(26, 40, ({ R, E, P }) => {
    for (let y = 14; y < 40; y++) R(12 + Math.round(Math.sin(y / 7) * 1.5), y, 3, 1, y % 3 ? "#8a6a44" : "#6b4f33");
    const leaf = (x0, y0, dx, dy, n) => { for (let i = 0; i < n; i++) { R(x0 + dx * i, y0 + dy * i + (i * i) / 9, 3, 2, i % 2 ? "#3e8e41" : "#2f6d32"); } };
    leaf(13, 12, 1.6, -0.6, 8); leaf(12, 12, -1.6, -0.6, 8); leaf(13, 13, 1.4, 0.5, 7); leaf(11, 13, -1.4, 0.5, 7); leaf(12, 12, 0.2, -1.4, 6);
    E(13, 13, 3, 2.4, "#4aa04d"); P(12, 15, "#8a5a2b"); P(14, 15, "#8a5a2b");
  }),
  sombrilla: () => mk(24, 24, ({ R, E }) => { R(11, 8, 2, 16, "#e8e8e8"); E(12, 7, 12, 6, "#f2f2f2"); for (let i = 0; i < 4; i++) E(3 + i * 6, 7, 2.6, 5, i % 2 ? "#1e4fa1" : "#f2f2f2"); R(4, 20, 16, 2, "#9c6b3f"); R(5, 22, 1, 2, "#6b4a2f"); R(18, 22, 1, 2, "#6b4a2f"); }),
  sombrilla2: () => mk(24, 24, ({ R, E }) => { R(11, 8, 2, 16, "#e8e8e8"); E(12, 7, 12, 6, "#f3e6c8"); for (let i = 0; i < 4; i++) E(3 + i * 6, 7, 2.6, 5, i % 2 ? "#e1251b" : "#f3e6c8"); R(4, 20, 16, 2, "#9c6b3f"); R(5, 22, 1, 2, "#6b4a2f"); R(18, 22, 1, 2, "#6b4a2f"); }),
  calesita: () => mk(46, 40, ({ R, E, P }) => {
    E(23, 34, 22, 6, "#6b4f8a"); E(23, 33, 20, 5, "#c9a0ff");
    for (let i = 0; i < 6; i++) { const x = 5 + i * 7; R(x, 12, 1, 20, "#f2c230"); R(x - 2, 20 + (i % 2) * 3, 5, 4, ["#f2f2f2", "#ff8ac2", "#7ec8e3"][i % 3]); }
    R(21, 8, 4, 26, "#f2c230"); E(23, 9, 22, 6, "#e1251b"); for (let i = 0; i < 6; i++) E(5 + i * 7, 10, 3, 3, i % 2 ? "#f2f2f2" : "#e1251b"); R(22, 0, 2, 4, "#f2c230"); P(23, -1, "#f2f2f2");
  }),
  poste: () => mk(14, 44, ({ R }) => { R(6, 6, 2, 38, "#6b6f78"); R(0, 3, 14, 3, "#6b6f78"); R(1, 5, 4, 1, "#ffe7a8"); R(9, 5, 4, 1, "#ffe7a8"); R(4, 41, 6, 3, "#4a4e56"); }),
  arbolito: () => mk(14, 22, ({ R, E }) => { R(6, 12, 2, 10, "#6b4a2f"); E(7, 7, 6, 6, "#3e8e41"); E(5, 5, 3, 3, "#5aa860"); R(3, 20, 8, 2, "#8a8a84"); }),
  cartel: () => mk(30, 36, ({ R }) => { R(13, 16, 4, 20, "#6b6f78"); R(0, 0, 30, 17, "#1e4fa1"); R(2, 2, 26, 13, "#f2f2f2"); R(4, 4, 8, 9, "#e1251b"); R(14, 4, 12, 3, "#1e4fa1"); R(14, 9, 10, 2, "#1e4fa1"); }),
  torre: () => mk(34, 70, ({ R, E, P }) => {
    R(3, 22, 28, 48, "#e8a0b4"); R(3, 22, 28, 3, "#f3e6c8"); for (let x = 3; x < 31; x += 6) R(x, 18, 4, 4, "#e8a0b4");
    R(13, 40, 8, 14, "#3a2a44"); E(17, 40, 4, 4, "#3a2a44"); R(8, 30, 4, 6, "#3a2a44"); R(22, 30, 4, 6, "#3a2a44");
    E(17, 12, 12, 10, "#3fb8af"); E(14, 9, 5, 4, "#7fe0d8"); R(16, 0, 2, 4, "#f2c84b"); P(17, -1, "#f2c84b");
  }),
  torre2: () => mk(34, 70, ({ R, E, P }) => {
    R(3, 22, 28, 48, "#7ec8e3"); R(3, 22, 28, 3, "#f3e6c8"); for (let x = 3; x < 31; x += 6) R(x, 18, 4, 4, "#7ec8e3");
    R(13, 40, 8, 14, "#3a2a44"); E(17, 40, 4, 4, "#3a2a44"); R(8, 30, 4, 6, "#3a2a44"); R(22, 30, 4, 6, "#3a2a44");
    E(17, 12, 12, 10, "#f2c84b"); E(14, 9, 5, 4, "#fff0a8"); R(16, 0, 2, 4, "#3fb8af"); P(17, -1, "#3fb8af");
  }),
  delantal: () => mk(10, 11, ({ R, P }) => { R(2, 0, 6, 1, "#f2f2f2"); R(1, 1, 1, 2, "#f2f2f2"); R(8, 1, 1, 2, "#f2f2f2"); R(2, 3, 6, 8, "#ff8ac2"); R(1, 4, 8, 7, "#ff8ac2"); R(3, 6, 4, 3, "#ffb3d9"); P(4, 7, "#c9407e"); P(5, 7, "#c9407e"); }),
  vendas: () => mk(10, 9, ({ R, P }) => { R(1, 1, 8, 7, "#f2f2f2"); R(1, 3, 8, 1, "#c9ccd4"); R(1, 5, 8, 1, "#c9ccd4"); R(0, 2, 1, 5, "#e0e0e0"); P(8, 0, "#d32f2f"); R(7, 0, 3, 1, "#d32f2f"); }),
  banco: () => mk(20, 10, ({ R }) => { R(0, 0, 20, 2, "#2f4f3a"); R(0, 4, 20, 2, "#3b6048"); R(1, 6, 1, 4, "#1f1f1f"); R(18, 6, 1, 4, "#1f1f1f"); R(1, 2, 1, 2, "#1f1f1f"); R(18, 2, 1, 2, "#1f1f1f"); })
};

export const SPR = {};
function add(name, frames, anchorY) {
  SPR[name] = { f: frames, fl: frames.map(flipped), wh: frames.map(white), w: frames[0].width, h: frames[0].height, ay: anchorY ?? frames[0].height - 1 };
}
export function buildSprites() {
  add("thomas", [0, 1, 2, 3].map(f => human(THOMAS, f)));
  add("rocio", [0, 1, 2, 3].map(f => human(ROCIO, f)));
  for (const [k, o] of Object.entries(CATS)) {
    const fr = [0, 1].map(f => cat(o, f));
    const s = k === "luz" ? 2 : k === "linda" ? 3 : 1;
    add(k, s > 1 ? fr.map(c => scaled(c, s)) : fr);
  }
  for (const k of ["gato", "negro", "gordo", "saltarin", "escupidor", "madre"]) add(k + "E", SPR[k].f.map(c => scaled(c, 2)));
  add("gatito", [0, 1].map(kitten));
  add("romero", [0, 1].map(f => dog(ROMERO, f)));
  add("paloma", [0, 1].map(paloma));
  for (const [k, fn] of Object.entries(ITEMS)) add(k, [fn()]);
}

// retrato grande para la interfaz
export function portrait(name, scale = 6) {
  const s = SPR[name]; if (!s) return "";
  return scaled(s.f[0], scale).toDataURL();
}
