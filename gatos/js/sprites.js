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
    const tailUp = f % 2 ? 0 : 1;
    R(2, 4 + tailUp, 1, 4, o.fur); P(1, 3 + tailUp, o.fur); P(1, 2 + tailUp, o.tip || o.fur);
    if (o.fluffy) { R(1, 5 + tailUp, 1, 3, o.fur); }
    R(12, 2, 5, 5, o.fur); R(11, 3, 1, 3, o.fur);
    P(12, 1, o.fur); P(16, 1, o.fur); P(12, 0, o.fur); P(16, 0, o.fur);
    P(12, 1, o.inner || "#f0a0a0"); P(16, 1, o.inner || "#f0a0a0");
    if (o.bib) { R(13, 5, 3, 2, o.bib); R(11, 6, 3, 2, o.bib); }
    if (o.blaze) R(14, 2, 1, 3, o.blaze);
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
  linda: { fur: "#8a7a66", stripe: "#3e342b", bib: "#f6f3ee", paws: "#f6f3ee", eye: "#ff5a3a", grumpy: true, fluffy: true, fat: true, crown: true }
};

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
  add("romero", [0, 1].map(f => dog(ROMERO, f)));
  add("paloma", [0, 1].map(paloma));
  for (const [k, fn] of Object.entries(ITEMS)) add(k, [fn()]);
}

// retrato grande para la interfaz
export function portrait(name, scale = 6) {
  const s = SPR[name]; if (!s) return "";
  return scaled(s.f[0], scale).toDataURL();
}
