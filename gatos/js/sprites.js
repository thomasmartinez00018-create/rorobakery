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
// Vista 3/4 mirando a la derecha (el espejo da la izquierda). Lienzo 16x20, pies en y=19.
// Cuadros de cada persona: 0 quieto, 1 paso A, 2 paso cruzado, 3 paso B (la caminata es [1,2,3,0]),
// 4 ataque A, 5 ataque B, 6 esquive. El caído es un sprite aparte: "<id>Caido".
const DK = "#1a1420";
const POSES = {
  idle: { far: 5, near: 9, dy: 0, dx: 0, aF: "down", aN: "down" },
  pasoA: { far: 4, near: 10, dy: 1, dx: 0, aF: "fwd", aN: "back" },
  cruce: { far: 6, near: 8, dy: 0, dx: 0, liftF: 1, aF: "down", aN: "down" },
  pasoB: { far: 9, near: 5, dy: 1, dx: 0, aF: "back", aN: "fwd" },
  golpe: { far: 3, near: 9, dy: 1, dx: 1, aF: "guard", aN: "punch" },
  patada: { far: 5, near: "kick", dy: 0, dx: -1, aF: "guard", aN: "guard" },
  cargar: { far: 4, near: 10, dy: 1, dx: -1, aF: "fwd", aN: "up" },
  lanzar: { far: 3, near: 10, dy: 1, dx: 1, aF: "back", aN: "throw" },
  esquive: { far: 2, near: 11, dy: 3, dx: 1, aF: "back", aN: "back" }
};
const WALK = ["idle", "pasoA", "cruce", "pasoB"];

function person(o, pz) {
  const Q = POSES[pz];
  return mk(16, 20, ({ R, P }) => {
    const dy = Q.dy + (o.low || 0), dx = Q.dx;
    const guard = o.guard && (Q.aN === "down" || Q.aN === "fwd" || Q.aN === "back") && pz !== "esquive";
    const aF = guard ? "guard" : Q.aF, aN = guard ? "guard" : Q.aN;
    const skin = o.skin, skinD = o.skinD;
    const hand = o.gloves || skin;
    // pelo largo por detrás (cae sobre la espalda)
    if (o.hair === "largo") { R(3 + dx, 4 + dy, 2, 9, o.hairC); R(5 + dx, 11 + dy, 1, 2, o.hairC); P(3 + dx, 8 + dy, o.hairL); }
    if (o.hair === "coleta") { R(2 + dx, 5 + dy, 2, 2, o.hairC); R(1 + dx, 7 + dy, 2, 3, o.hairC); P(2 + dx, 6 + dy, o.hairL); }
    if (o.cape) { R(3 + dx, 10 + dy, 2, 6, o.cape); P(2 + dx, 14 + dy, o.cape); P(2 + dx, 15 + dy, o.cape); }
    // brazo lejano (detrás del torso)
    const arm = (sx, sy, mode, near) => {
      const sl = o.sleeveless ? skin : (near ? o.shirt : o.shirtD);
      const sk = near ? skin : skinD;
      const hc = o.gloves ? (near ? o.gloves : o.glovesD) : sk;
      const big = !!o.gloves;
      if (mode === "down") { P(sx, sy, sl); P(sx, sy + 1, o.sleeveless ? sk : sl); P(sx, sy + 2, sk); big ? R(sx - (near ? 0 : 1), sy + 3, 2, 2, hc) : P(sx, sy + 3, hc); }
      else if (mode === "fwd") { P(sx, sy, sl); P(sx + 1, sy + 1, o.sleeveless ? sk : sl); P(sx + 1, sy + 2, sk); big ? R(sx + 1, sy + 3, 2, 2, hc) : P(sx + 2, sy + 3, hc); }
      else if (mode === "back") { P(sx, sy, sl); P(sx - 1, sy + 1, o.sleeveless ? sk : sl); P(sx - 1, sy + 2, sk); big ? R(sx - 2, sy + 2, 2, 2, hc) : P(sx - 2, sy + 3, hc); }
      else if (mode === "guard") {
        P(sx, sy, sl); P(sx + 1, sy, o.sleeveless ? sk : sl);
        if (near) { P(sx, sy - 1, o.sleeveless ? sk : sl); R(sx, sy - 3, 2, 2, hc); if (big) P(sx, sy - 3, o.gloveL || hc); }
        else { R(sx + 5, sy - 1, 2, 2, hc); if (big) P(sx + 5, sy - 1, o.gloveL || hc); }
      }
      else if (mode === "punch") { R(sx, sy + 1, 2, 1, sl); R(sx + 2, sy + 1, 1, 1, o.sleeveless ? sk : sl); P(sx + 3, sy + 1, sk); big ? (R(sx + 3, sy, 2, 2, hc), P(sx + 3, sy, o.gloveL || hc)) : R(sx + 3, sy, 1, 2, hc); }
      else if (mode === "up") { P(sx, sy, sl); P(sx - 1, sy - 1, o.sleeveless ? sk : sl); P(sx - 1, sy - 2, sk); P(sx - 1, sy - 3, hc); }
      else if (mode === "throw") { P(sx, sy, sl); P(sx + 1, sy, o.sleeveless ? sk : sl); P(sx + 2, sy - 1, sk); P(sx + 3, sy - 1, hc); P(sx + 4, sy - 2, hc); }
    };
    arm(4 + dx, 10 + dy, aF, false);
    // piernas
    const leg = (x, lift, far) => {
      const pc = far ? o.pantsD : o.pants, sc = far ? skinD : skin;
      let top = 15 + dy, bot = 17 - lift;
      if (top > bot) { top = bot = 18 - lift - 1 + 1; }
      for (let y = top, i = 0; y <= bot; y++, i++) {
        const isShort = o.shorts != null && i >= o.shorts;
        R(x, y, 2, 1, isShort ? sc : pc);
        if (o.stripe && !isShort) P(x + (far ? 0 : 1), y, o.stripe);
      }
      const fy = Math.max(bot + 1, 18 - lift);
      foot(x, fy, far);
    };
    const foot = (x, fy, far) => {
      const sk = far ? skinD : skin;
      if (o.feet === "ojotas") { R(x, fy, 3, 1, sk); P(x + 1, fy, o.shoes); if (fy + 1 <= 19) { R(x, fy + 1, 3, 1, o.shoes); P(x + 2, fy + 1, o.shoeStripe); } }
      else if (o.feet === "descalzo") { R(x, fy, 2, 1, sk); if (fy + 1 <= 19) R(x, fy + 1, 3, 1, sk); }
      else { R(x, fy, 3, 1, far ? o.shoesD || o.shoes : o.shoes); if (fy + 1 <= 19) R(x, fy + 1, 3, 1, o.sole || o.shoes); }
    };
    leg(Q.far, Q.liftF || 0, true);
    if (Q.near === "kick") {
      const th = o.pants, sh = o.shorts != null ? skin : o.pants;
      R(9, 14 + dy, 2, 2, th); R(11, 13 + dy, 3, 2, sh);
      if (o.stripe && o.shorts == null) R(11, 13 + dy, 3, 1, o.stripe);
      if (o.feet === "descalzo" || o.feet === "ojotas") { R(14, 12 + dy, 1, 3, skin); P(15, 12 + dy, skin); if (o.feet === "ojotas") P(14, 14 + dy, o.shoes); }
      else { R(14, 12 + dy, 2, 3, o.shoes); }
    } else leg(Q.near, Q.liftN || 0, false);
    // torso
    const tx = 5 + dx, ty = 10 + dy;
    R(tx, ty, 6, 4, o.shirt); P(tx, ty, o.shirtD); R(tx, ty + 3, 1, 1, o.shirtD);
    if (o.sleeveless) { P(tx, ty, skinD); P(tx + 5, ty, skin); }
    R(tx, ty + 4, 6, 1, o.pants);
    if (o.belt) { R(tx, ty + 4, 6, 1, o.belt); P(tx + 3, ty + 4, o.beltG || o.belt); }
    if (o.shortsWide) {
      const sy = ty + 5; R(tx - 1, sy, 8, Math.min(2, 20 - sy), o.pants); R(tx + 4, sy, 3, Math.min(2, 20 - sy), o.shortsSide);
      if (o.shortsGold) { P(tx + 5, sy, o.shortsGold); P(tx, sy + 1, o.shortsGold); }
    }
    if (o.print) { R(tx + 1, ty + 2, 4, 1, o.print); }
    if (o.trim) { R(tx, ty, 6, 1, o.trim); }
    if (o.apron) {
      R(tx + 1, ty, 4, 1, o.apronL); R(tx + 1, ty + 1, 5, 6, o.apron); R(tx + 2, ty + 3, 2, 2, o.apronL);
      P(tx + 1, ty, o.apronL); if (ty + 7 <= 19) R(tx + 1, ty + 7, 5, 1, o.apron);
    }
    if (o.necklace) { P(tx + 2, ty, o.necklace); P(tx + 4, ty, o.necklace); P(tx + 3, ty + 1, o.necklace); }
    if (o.star) { P(tx + 3, ty + 1, o.star); R(tx + 2, ty + 2, 3, 1, o.star); P(tx + 3, ty + 3, o.star); }
    // cabeza
    const hx = 5 + dx, hy = 3 + dy;
    R(hx, hy, 7, 6, skin); R(hx + 1, hy + 6, 5, 1, skin); P(hx, hy + 5, skinD);
    P(hx + 1, hy + 3, skinD); P(hx + 1, hy + 4, skinD);
    if (o.mask) { R(hx + 1, hy + 2, 6, 2, o.mask); P(hx + 3, hy + 3, "#ffffff"); P(hx + 5, hy + 3, "#ffffff"); P(hx + 7, hy + 2, o.mask); }
    else {
      if (o.brows) { R(hx + 2, hy + 2, 2, 1, o.brows); R(hx + 5, hy + 2, 2, 1, o.brows); P(hx + 3, hy + 4, DK); P(hx + 5, hy + 4, DK); P(hx + 3, hy + 3, o.eyeW || "#f6efe8"); P(hx + 5, hy + 3, o.eyeW || "#f6efe8"); }
      else { P(hx + 3, hy + 3, DK); P(hx + 3, hy + 4, DK); P(hx + 5, hy + 3, DK); P(hx + 5, hy + 4, DK); }
      if (o.lash) { P(hx + 6, hy + 3, DK); }
    }
    P(hx + 2, hy + 5, o.blush || "#ee9a90"); P(hx + 4, hy + 5, o.mouth || "#a85048"); P(hx + 5, hy + 5, o.mouth || "#a85048");
    if (pz === "golpe" || pz === "patada" || pz === "lanzar") { P(hx + 4, hy + 5, DK); P(hx + 5, hy + 5, DK); }
    hair(R, P, o, hx, hy);
    if (o.headgear) {
      const c = o.headgear; R(hx - 1, hy - 2, 8, 2, c); R(hx - 1, hy, 2, 5, c); R(hx + 6, hy, 1, 2, c); P(hx + 1, hy - 3, c); R(hx + 1, hy - 3, 5, 1, c);
      P(hx + 1, hy - 2, o.headgearL); P(hx + 2, hy - 3, o.headgearL); R(hx, hy + 5, 2, 1, c);
    }
    arm(11 + dx, 10 + dy, aN, true);
  });
}

function hair(R, P, o, hx, hy) {
  const c = o.hairC, l = o.hairL;
  if (o.hair === "rulos") {
    // volumen arriba, costados cortos con degradé, rulos que caen sobre la frente
    [[1, -3], [2, -3], [4, -3], [5, -3]].forEach(([x, y]) => P(hx + x, hy + y, c));
    R(hx, hy - 2, 7, 1, c); R(hx - 1, hy - 1, 9, 1, c); R(hx - 1, hy, 8, 1, c);
    P(hx, hy - 3, c); P(hx + 6, hy - 2, c);
    P(hx + 7, hy - 1, c); P(hx + 7, hy - 2, c); P(hx - 1, hy - 2, c); P(hx + 3, hy + 1, c);
    R(hx - 1, hy + 1, 2, 1, c); P(hx, hy + 2, c); P(hx, hy + 3, o.fade);
    [[1, -2], [4, -2], [0, -1], [3, -1], [6, -1], [2, 0], [5, 0]].forEach(([x, y]) => P(hx + x, hy + y, l));
  } else if (o.hair === "largo") {
    R(hx + 1, hy - 2, 5, 1, c); R(hx, hy - 1, 7, 1, c); R(hx - 1, hy, 8, 1, c);
    R(hx - 1, hy + 1, 4, 1, c); R(hx - 1, hy + 2, 2, 3, c); P(hx + 6, hy + 1, c);
    P(hx + 2, hy - 1, l); P(hx + 4, hy - 2, l); P(hx + 1, hy, l);
  } else if (o.hair === "coleta") {
    R(hx + 1, hy - 2, 5, 1, c); R(hx, hy - 1, 7, 1, c); R(hx - 1, hy, 8, 1, c); R(hx - 1, hy + 1, 3, 1, c); R(hx - 1, hy + 2, 2, 2, c);
    P(hx + 3, hy - 1, l);
  } else if (o.hair === "corto") {
    R(hx, hy - 2, 7, 1, c); R(hx - 1, hy - 1, 8, 2, c); R(hx - 1, hy + 1, 2, 2, c); P(hx + 3, hy + 1, c); P(hx + 5, hy + 1, c);
    P(hx + 2, hy - 2, l); P(hx + 4, hy - 1, l);
  }
}

// caído: boca arriba, la cabeza a la izquierda
function fallen(o) {
  return mk(22, 9, ({ R, P }) => {
    const sk = o.skin;
    // piernas y pies
    R(14, 3, 6, 2, o.shorts != null ? o.pants : o.pants); R(14, 5, 6, 2, o.pantsD);
    if (o.shorts != null) { R(17, 3, 3, 4, sk); }
    if (o.stripe && o.shorts == null) { R(14, 4, 6, 1, o.stripe); }
    const ft = o.feet === "descalzo" ? sk : o.shoes;
    R(20, 2, 2, 2, ft); R(20, 5, 2, 2, ft); if (o.feet === "ojotas") { P(20, 2, sk); P(20, 5, sk); }
    // torso
    R(8, 2, 6, 5, o.shirt); R(8, 6, 6, 1, o.shirtD);
    if (o.apron) { R(9, 2, 5, 5, o.apron); R(10, 3, 2, 2, o.apronL); }
    if (o.print) R(10, 4, 1, 2, o.print);
    if (o.star) { R(10, 3, 1, 3, o.star); P(9, 4, o.star); P(11, 4, o.star); }
    if (o.necklace) { P(8, 3, o.necklace); P(8, 5, o.necklace); }
    // brazos tirados
    const hc = o.gloves || sk;
    R(9, 0, 3, 2, o.sleeveless ? sk : o.shirt); R(12, 0, 2, 1, hc);
    R(9, 7, 3, 1, o.sleeveless ? sk : o.shirtD); R(12, 7, 2, 2, hc);
    if (o.cape) { R(8, 7, 7, 1, o.cape); }
    // cabeza (cara hacia arriba: la vemos de costado)
    R(2, 1, 6, 7, sk); P(2, 1, "rgba(0,0,0,0)");
    const c = o.headgear || o.hairC;
    if (o.hair === "rulos") { R(0, 1, 3, 6, c); P(1, 0, c); P(-1, 2, c); P(-1, 5, c); P(0, 7, c); P(1, 3, o.hairL); P(0, 5, o.hairL); }
    else if (o.hair === "largo") { R(0, 1, 3, 7, c); R(-1, 2, 1, 5, c); R(3, 0, 3, 1, c); R(3, 8, 5, 1, c); P(1, 3, o.hairL); }
    else { R(0, 1, 3, 6, c); P(1, 3, o.hairL || c); }
    if (o.mask) { R(4, 2, 2, 5, o.mask); }
    // ojos cerrados y boca
    R(4, 3, 2, 1, DK); R(4, 5, 2, 1, DK); P(6, 4, o.mouth || "#a85048");
    if (o.brows) { P(3, 3, o.brows); P(3, 5, o.brows); }
  });
}

const THOMAS = {
  skin: "#e2b08e", skinD: "#c08a6c", hair: "rulos", hairC: "#1f1714", hairL: "#4a3529", fade: "#7a5a48", brows: "#1f1714",
  shirt: "#17191f", shirtD: "#0f1014", print: "#b9bcc4", sleeveless: true,
  pants: "#8b8e96", pantsD: "#6d7078", stripe: "#eeeeee", feet: "ojotas", shoes: "#1d2a52", shoeStripe: "#ffffff"
};
const THOMAS_BIELLI = {
  ...THOMAS, sleeveless: false, print: null, shirt: "#1b1b22", shirtD: "#101015",
  pants: "#17161b", pantsD: "#17161b", stripe: null, shorts: 1, shortsWide: true, shortsSide: "#c42a30", shortsGold: "#e0a83a", belt: "#c42a30", beltG: "#e0a83a",
  feet: "descalzo", gloves: "#2a2a34", glovesD: "#22222b", gloveL: "#8a8a9a", guard: true
};
const ROCIO = {
  skin: "#f0c4a2", skinD: "#d4a482", hair: "largo", hairC: "#2b1a13", hairL: "#4a2f22", lash: true,
  shirt: "#c7b3ea", shirtD: "#a491cf", necklace: "#e9edf2", pants: "#1d1d24", pantsD: "#121218", shoes: "#f2f2f2", shoesD: "#d6d6dc", sole: "#c9ccd4"
};
const ROCIO_ROROS = { ...ROCIO, apron: "#7aafc4", apronL: "#b8d8e8" };
const MAITENA = {
  skin: "#e2b08e", skinD: "#c08a6c", hair: "coleta", hairC: "#2a1c16", hairL: "#4a3529", lash: true, low: 1,
  shirt: "#1b1b22", shirtD: "#101015", trim: "#f2d21e", pants: "#1b1b22", pantsD: "#1b1b22", shorts: 1, shortsWide: true, shortsSide: "#f2d21e",
  feet: "descalzo", gloves: "#d83a3a", glovesD: "#a82a2a", gloveL: "#ff8a8a", guard: true, headgear: "#f2c21e", headgearL: "#fff0a0"
};
const ALUMNO = { skin: "#d8a07a", skinD: "#b8805c", hair: "rulos", hairC: "#241a14", hairL: "#3a2a20", fade: "#5a4030", shirt: "#1c1c20", shirtD: "#111114", print: "#f2d21e", pants: "#1c1c20", pantsD: "#111114", stripe: "#f2d21e", feet: "descalzo" };
const ALUMNA = { skin: "#e8b48e", skinD: "#c8946e", hair: "largo", hairC: "#3a2418", hairL: "#5a3a28", shirt: "#1c1c20", shirtD: "#111114", print: "#f2d21e", pants: "#1c1c20", pantsD: "#111114", feet: "descalzo" };

// Carmelo: 4 años, más bajito (12x15). Pijama de superhéroe genérico: naranja con estrella, antifaz y capa azul.
const CARMELO = { skin: "#e8b48e", skinD: "#c8946e", hairC: "#3a2618", hairL: "#5a3c28", suit: "#f08a24", suitD: "#c86a14", star: "#ffe14a", cape: "#2b46a8", capeD: "#1e3278", mask: "#2b46a8" };
function kid(o, pz) {
  return mk(12, 15, ({ R, P }) => {
    const step = { idle: [3, 6, 0], pasoA: [2, 7, 1], cruce: [4, 5, 0], pasoB: [6, 3, 1], patadita: [3, "kick", 0], corre: [1, 8, 1] }[pz];
    const [fx, nx, dy] = step;
    // capa (vuela más al correr)
    const flap = pz === "pasoA" || pz === "pasoB" || pz === "corre";
    if (flap) { R(0, 7 + dy, 3, 4, o.cape); P(0, 11 + dy, o.capeD); R(1, 6 + dy, 2, 1, o.cape); }
    else { R(1, 7 + dy, 2, 5, o.cape); P(1, 12, o.capeD); }
    // piernas (enterito con pies)
    const leg = (x, far) => { const c = far ? o.suitD : o.suit; R(x, 12, 2, 1, c); R(x, 13, 3, 1, far ? "#d8b830" : o.star); };
    leg(fx, true);
    if (nx === "kick") { R(7, 10, 3, 2, o.suit); R(10, 10, 1, 2, o.star); }
    else leg(nx, false);
    // cuerpo
    R(3, 8 + dy, 6, 4 - dy, o.suit); P(3, 8 + dy, o.suitD);
    P(5, 8 + dy, o.star); R(4, 9 + dy, 3, 1, o.star); P(5, 10 + dy, o.star);
    // brazos
    R(2, 8 + dy, 1, 2, o.suitD); P(2, 10 + dy, o.skinD);
    if (pz === "patadita") { R(9, 7, 1, 2, o.suit); P(9, 6, o.skin); }
    else { R(9, 8 + dy, 1, 2, o.suit); P(9, 10 + dy, o.skin); }
    // cabeza grande de nene
    const hy = 1 + dy;
    R(3, hy, 7, 7, o.skin); R(2, hy + 1, 1, 5, o.skin); P(3, hy + 6, o.skinD);
    R(2, hy - 1, 8, 2, o.hairC); R(1, hy, 2, 3, o.hairC); P(9, hy, o.hairC); P(4, hy + 1, o.hairC); P(7, hy + 1, o.hairC); P(5, hy - 1, o.hairL); P(8, hy - 1, o.hairL);
    R(4, hy + 3, 6, 2, o.mask); P(6, hy + 4, "#ffffff"); P(8, hy + 4, "#ffffff"); P(3, hy + 3, o.mask);
    P(5, hy + 6, "#ee9a90"); P(8, hy + 6, pz === "patadita" ? DK : "#a85048");
  });
}

/* ---------- gatos de la historia (más detalle que los enemigos comunes) ---------- */
// 18x15 como el gato común. Cuadros 0 y 1 son los extremos del paso (sirven solos como antes);
// la caminata completa es [0,2,1,3].
const LEGOFF = [[-1, 1, -1, 1, 0, 0], [1, -1, 1, -1, 0, 0], [0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 1, 0]];
function cat2(o, f) {
  return mk(18, 15, ({ R, P, E, g }) => {
    g.translate(0, 2);
    const [o1, o2, o3, o4, liftF, liftN] = LEGOFF[f];
    const fd = o.furD, fu = o.fur;
    // patas lejanas
    R(4 + o1, 10, 1, 2 - liftF, fd); R(11 + o3, 10, 1, 2 - liftF, fd);
    // cola (peluda si corresponde), se balancea
    const sw = f === 1 || f === 3 ? 1 : 0;
    if (o.fluffy) { R(2, 4 + sw, 2, 4, fu); R(1, 2 + sw, 2, 3, fu); P(0, 2 + sw, fu); P(1, 1 + sw, o.tip || fu); P(2, 5 + sw, fd); P(1, 3 + sw, o.stripe || fd); }
    else { R(2, 4 + sw, 1, 4, fu); P(1, 3 + sw, fu); P(1, 2 + sw, o.tip || fu); if (o.stripe) P(2, 6 + sw, o.stripe); }
    // cuerpo
    E(8.5, 7.5, o.fat ? 6 : 5.2, o.fat ? 3.5 : 3, fu);
    if (o.belly) E(8.5, 9.4, 4, 1.3, o.belly);
    if (o.stripe) [5, 7, 9].forEach(x => { R(x, 5, 1, 2, o.stripe); P(x + 1, 7, o.stripe); });
    if (o.fluffy) { [[4, 4], [7, 4], [10, 4], [3, 9], [6, 11], [9, 11], [12, 10]].forEach(([x, y]) => P(x, y, fu)); P(5, 11, fu); }
    // patas cercanas
    R(6 + o2, 10, 1, 2 - liftN, fu); R(13 + o4, 10, 1, 2 - liftN, fu);
    if (o.paws) { P(6 + o2, 11 - liftN, o.paws); P(13 + o4, 11 - liftN, o.paws); P(4 + o1, 11 - liftF, o.paws); P(11 + o3, 11 - liftF, o.paws); }
    // cabeza
    E(14.2, 4.6, 3, 2.8, fu); R(12, 3, 5, 4, fu);
    P(12, 0, fu); R(12, 1, 2, 1, fu); P(16, 0, fu); R(15, 1, 2, 1, fu); P(13, 1, o.inner || "#f0a0a0");
    if (o.ruff) { R(11, 5, 2, 4, o.ruff); P(10, 6, o.ruff); P(12, 8, o.ruff); P(13, 8, o.ruff); }
    if (o.bib) { R(13, 6, 3, 2, o.bib); R(12, 7, 2, 2, o.bib); P(14, 8, o.bib); }
    if (o.blaze) { P(14, 1, o.blaze); P(14, 2, o.blaze); P(15, 3, o.blaze); }
    if (o.muzzle) { R(15, 5, 2, 2, o.muzzle); P(17, 5, o.muzzle); }
    if (o.stripe) { P(13, 2, o.stripe); P(15, 2, o.stripe); P(12, 4, o.stripe); }
    
    // ojos, nariz
    P(14, 4, o.eye); P(16, 4, o.eye);
    if (o.grumpy) { P(13, 3, DK); P(14, 3, DK); P(16, 3, DK); P(15, 2, o.stripe || DK); }
    P(17, 5, "#e88a8a");
    if (o.stache) { P(15, 6, o.stache); P(16, 6, o.stache); P(17, 6, o.stache); P(14, 5, o.stache); P(18, 5, o.stache); }
    if (o.crown) { R(12, -1, 5, 1, "#f2c230"); P(12, -2, "#f2c230"); P(14, -2, "#f2c230"); P(16, -2, "#f2c230"); P(14, -1, "#e0483c"); }
    if (o.mini) { R(13, 0, 3, 1, "#f2c230"); P(13, -1, "#f2c230"); P(15, -1, "#f2c230"); P(14, 0, "#4ac8ff"); }
  });
}
const CATS2 = {
  juli: { fur: "#8a8d96", furD: "#6f727b", bib: "#f4f4f4", blaze: "#f4f4f4", muzzle: "#f4f4f4", paws: "#f4f4f4", eye: "#7ed957", fluffy: true, tip: "#f4f4f4" },
  luz: { fur: "#8d8170", furD: "#6e6355", stripe: "#3e342b", belly: "#e08a3a", eye: "#e0a53a", grumpy: true },
  linda: { fur: "#8a7a66", furD: "#6c5e4d", stripe: "#3e342b", bib: "#f6f3ee", ruff: "#a8987f", paws: "#f6f3ee", eye: "#ff5a3a", grumpy: true, fluffy: true, fat: true, crown: true },
  gataLinda: { fur: "#8a7a66", furD: "#6c5e4d", stripe: "#3e342b", bib: "#f6f3ee", ruff: "#a8987f", paws: "#f6f3ee", eye: "#ff8a3a", grumpy: true, fluffy: true, fat: true }
};
CATS2.juliano = { ...CATS2.juli, mini: true, stache: "#2b2833" };

// gatitos de Juli (el Chema y Amanda): iguales a Juli pero chiquitos y con cara medio boba.
// 12x10, cuatro cuadros, caminata [0,2,1,3]
function kitten2(o, f) {
  return mk(12, 10, ({ R, P, E }) => {
    const [o1, o2, o3, o4, lF, lN] = LEGOFF[f];
    const c = o.fur, d = o.furD, w = o.white;
    R(3 + o1, 7, 1, 2 - lF, d); R(8 + o3, 7, 1, 2 - lF, d); P(3 + o1, 8 - lF, w); P(8 + o3, 8 - lF, w);
    const sw = f === 1 || f === 3 ? 1 : 0;
    R(1, 2 + sw, 2, 3, c); P(0, 1 + sw, c); P(1, 1 + sw, w);
    E(5.5, 5.3, 3.6, 2.2, c); P(3, 3, c); P(6, 3, c);
    E(7.4, 6.4, 1.6, 1, w);
    R(4 + o2, 7, 1, 2 - lN, c); R(9 + o4, 7, 1, 2 - lN, c); P(4 + o2, 8 - lN, w); P(9 + o4, 8 - lN, w);
    E(9, 3.2, 2.6, 2.4, c); P(7, 0, c); P(11, 0, c); P(7, 1, "#f0a0a0"); P(11, 1, c);
    P(9, 1, w); P(9, 2, w); R(9, 4, 3, 2, w);
    // cara boba: ojos grandes y desparejos, lengüita afuera
    const ry = o.cross ? 3 : 2;
    P(8, 2, o.eye); P(8, 3, DK); P(10, ry, o.eye); P(10, ry + 1, DK);
    P(11, 4, "#e88a8a"); if (o.tongue) P(10, 6, "#ff7a9a");
  });
}
const JULI_KIT = { fur: "#8a8d96", furD: "#6f727b", white: "#f4f4f4", eye: "#7ed957" };
const KITTENS = { chema: { ...JULI_KIT, tongue: true }, amanda: { ...JULI_KIT, cross: true } };

/* ---------- perros ---------- */
// caniche: 17x13, cuatro cuadros, caminata [0,2,1,3]
function poodle(o, f) {
  return mk(17, 13, ({ R, P, E }) => {
    const [o1, o2, o3, o4, lF, lN] = LEGOFF[f];
    const c = o.fur, d = o.dark, l = o.light;
    // patas lejanas
    R(4 + o1, 8, 1, 3 - lF, d); R(10 + o3, 8, 1, 3 - lF, d); R(3 + o1, 10 - lF, 2, 1, d); R(10 + o3, 10 - lF, 2, 1, d);
    // cola pompón
    const sw = f === 1 || f === 3 ? 1 : 0;
    P(3, 5, c); P(2, 4, c); E(1.6, 2.6 + sw * 0.5, 1.6, 1.5, c); P(1, 2 + sw, l);
    // cuerpo con rulos
    E(7.5, 6.6, 4.4, 2.6, c);
    [[5, 5], [8, 4], [10, 6], [6, 7], [9, 8], [4, 7]].forEach(([x, y]) => P(x, y, d));
    [[6, 4], [9, 5], [7, 6]].forEach(([x, y]) => P(x, y, l));
    // patas cercanas
    R(6 + o2, 8, 1, 3 - lN, c); R(12 + o4, 8, 1, 3 - lN, c); R(6 + o2, 10 - lN, 2, 1, c); R(12 + o4, 10 - lN, 2, 1, c);
    // cabeza: copete, oreja colgante, hocico
    E(12.5, 3.6, 2.6, 2.4, c); E(12, 1, 2.2, 1.6, c); P(11, 0, l); P(13, 0, d);
    R(10, 3, 2, 4, d); P(11, 7, d); P(10, 4, c);
    R(14, 4, 2, 2, l); P(16, 4, DK); P(15, 5, l);
    P(13, 3, DK);
    if (o.bow) { R(11, -1, 1, 2, o.bow); R(13, -1, 1, 2, o.bow); P(12, 0, o.bowD); if (o.boss) { P(10, -2, o.bow); P(14, -2, o.bow); R(10, -1, 1, 2, o.bow); R(14, -1, 1, 2, o.bow); } }
    if (o.boss) { P(12, 2, DK); P(13, 2, DK); P(13, 3, "#ff3a6a"); }
    if (o.beret) { R(10, -1, 5, 2, o.beret); P(15, 0, o.beret); P(12, -2, o.beret); P(11, -1, o.beretL); }
    if (o.stache) { P(14, 6, o.stache); P(15, 6, o.stache); P(16, 5, o.stache); P(13, 6, o.stache); }
  });
}
const ROMERO = { fur: "#b8652f", dark: "#8e4a1f", light: "#d68548" };
const GOMEGHOOO = { ...ROMERO, beret: "#22222c", beretL: "#40404e", stache: "#2a1a12" };
const CANICHE = { fur: "#efe5d3", dark: "#cdbfa5", light: "#fffaf0", bow: "#ff5fa0", bowD: "#c83a78" };
const CANICHE_BOSS = { ...CANICHE, boss: true, dark: "#c4b495" };

// Corbata: perro negro de pelo corto con pecho blanco. 20x14, caminata [0,2,1,3]
function corbata(f) {
  return mk(20, 14, ({ R, P, E }) => {
    const [o1, o2, o3, o4, lF, lN] = LEGOFF[f];
    const c = "#2c2833", d = "#1f1c25", l = "#4a4554", w = "#f2ece0";
    R(5 + o1, 9, 2, 3 - lF, d); R(13 + o3, 9, 2, 3 - lF, d);
    const sw = f === 1 || f === 3 ? 1 : 0;
    R(2, 3 + sw, 1, 3, c); P(1, 2 + sw, c); P(3, 6, c);
    E(9.5, 7, 5.8, 2.8, c); R(5, 5, 8, 1, l);
    R(7 + o2, 9, 2, 3 - lN, c); R(15 + o4, 9, 2, 3 - lN, c);
    // pecho blanco en forma de corbata
    R(14, 6, 2, 2, w); P(15, 8, w); P(14, 9, w);
    E(16, 3.6, 2.8, 2.6, c); R(18, 3, 2, 3, c); P(20, 4, DK); R(18, 5, 2, 1, l);
    R(14, 1, 2, 4, d); P(14, 5, d);
    P(17, 2, "#8a5a2b"); P(17, 3, "#8a5a2b"); P(16, 1, l);
  });
}

/* ---------- gatos enemigos ---------- */
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
function booth(back) {
  return mk(34, 30, ({ R, P }) => {
    R(0, 0, 34, 18, back); R(0, 0, 34, 2, "#6b6f78"); R(0, 0, 1, 30, "#6b6f78"); R(33, 0, 1, 30, "#6b6f78");
    R(2, 3, 30, 1, "#9aa0aa");
    ["#d8323a", "#1e1e24", "#7ec8e3", "#f2f2f2", "#f2c230", "#e8a0b4", "#6fae4a", "#2b3a6a"].forEach((c, i) => { const x = 2 + i * 4; R(x, 4, 3, 7, c); R(x - 1, 4, 5, 2, c); });
    R(2, 13, 30, 1, "#b8a58a"); for (let x = 3; x < 31; x += 3) R(x, 11, 2, 2, ["#f2f2f2", "#7ec8e3", "#e8a0b4", "#f2c230"][x % 4]);
    R(2, 18, 30, 11, "#b8dcea"); R(2, 18, 30, 1, "#ffffff"); R(2, 28, 30, 1, "#6b6f78"); R(17, 18, 1, 11, "#8ea8b8");
    for (let x = 4; x < 30; x += 5) R(x, 22 + (x % 3), 3, 2, ["#f2c230", "#d8323a", "#f2f2f2"][x % 3]);
    P(5, 19, "#ffffff"); P(6, 20, "#ffffff");
  });
}
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
  guante: () => mk(9, 9, ({ R, E, P }) => { E(4.5, 3.6, 4, 3.4, "#2a2a34"); R(1, 6, 7, 3, "#f2f2f2"); R(2, 2, 2, 1, "#8a8a9a"); P(2, 3, "#5a5a68"); R(1, 7, 7, 1, "#c42a30"); }),
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
  local: () => booth("#f2f2f2"),
  local2: () => booth("#e8a0c8"),
  local3: () => booth("#8f86d8"),
  local4: () => booth("#7ec8e3"),
  golosinas: () => mk(34, 30, ({ R, P }) => {
    R(0, 0, 34, 9, "#d8323a"); R(2, 2, 30, 5, "#f2c83a"); for (let x = 4; x < 30; x += 4) P(x, 4, "#d8323a");
    R(1, 9, 1, 21, "#1c1c20"); R(32, 9, 1, 21, "#1c1c20");
    for (let y = 11; y < 20; y += 4) for (let x = 3; x < 22; x += 4) { R(x, y, 3, 3, ["#c8a060", "#e8d8a8", "#b87838", "#f0a0c0"][(x + y) % 4]); }
    R(2, 21, 21, 8, "#8a5a2b"); R(2, 21, 21, 1, "#b07a42");
    R(24, 12, 8, 8, "#d8323a"); R(25, 13, 6, 5, "#e8f4ff"); for (let x = 25; x < 31; x += 2) P(x, 16, "#f6e6a0"); R(24, 20, 8, 9, "#b8141b"); R(26, 10, 4, 2, "#f2c83a");
  }),
  maniqui: () => mk(10, 22, ({ R, E }) => { E(5, 2.5, 2.5, 2.5, "#f2f2f2"); R(4, 5, 2, 1, "#f2f2f2"); R(2, 6, 6, 7, "#d8323a"); R(1, 6, 1, 5, "#d8323a"); R(8, 6, 1, 5, "#d8323a"); R(3, 13, 4, 5, "#2b3a6a"); R(4, 18, 2, 2, "#6b6f78"); R(2, 20, 6, 2, "#4a4e56"); }),
  mesa: () => mk(22, 14, ({ R }) => { R(3, 4, 16, 2, "#b8bec6"); R(4, 6, 14, 1, "#8e959d"); R(10, 7, 2, 6, "#6b6f78"); R(7, 12, 8, 1, "#6b6f78"); R(0, 5, 3, 1, "#1c1c20"); R(0, 0, 1, 12, "#1c1c20"); R(2, 6, 1, 6, "#1c1c20"); R(19, 5, 3, 1, "#1c1c20"); R(21, 0, 1, 12, "#1c1c20"); R(19, 6, 1, 6, "#1c1c20"); }),
  bolsa: () => mk(12, 34, ({ R, E, P }) => { R(5, 0, 2, 5, "#6b6f78"); E(6, 7, 5, 2, "#1c1c20"); R(1, 7, 10, 24, "#1c1c20"); R(1, 7, 10, 5, "#f2d21e"); R(1, 18, 10, 2, "#f2d21e"); E(6, 31, 5, 2, "#1c1c20"); R(2, 12, 1, 17, "#3a3a40"); P(6, 23, "#f2d21e"); P(5, 24, "#f2d21e"); P(7, 24, "#f2d21e"); }),
  rpost: () => mk(8, 30, ({ R }) => { R(2, 0, 4, 30, "#9aa0aa"); R(1, 2, 6, 20, "#d8323a"); R(1, 2, 6, 2, "#ff6a6a"); }),
  bpost: () => mk(8, 30, ({ R }) => { R(2, 0, 4, 30, "#9aa0aa"); R(1, 2, 6, 20, "#2d4fb0"); R(1, 2, 6, 2, "#6a8cff"); }),
  silla: () => mk(10, 14, ({ R }) => { R(1, 0, 8, 6, "#f2f2f2"); R(1, 6, 8, 3, "#e0e0e0"); R(1, 9, 1, 5, "#d0d0d0"); R(8, 9, 1, 5, "#d0d0d0"); R(2, 1, 6, 1, "#ffffff"); }),
  banco: () => mk(20, 10, ({ R }) => { R(0, 0, 20, 2, "#2f4f3a"); R(0, 4, 20, 2, "#3b6048"); R(1, 6, 1, 4, "#1f1f1f"); R(18, 6, 1, 4, "#1f1f1f"); R(1, 2, 1, 2, "#1f1f1f"); R(18, 2, 1, 2, "#1f1f1f"); })
};


export const SPR = {};
// anim: nombre de animación -> índices de cuadro (y "caido" -> id del sprite de caído)
function add(name, frames, anchorY, anim) {
  SPR[name] = { f: frames, fl: frames.map(flipped), wh: frames.map(white), w: frames[0].width, h: frames[0].height, ay: anchorY ?? frames[0].height - 1, anim: anim || null };
}
const PERSONA_ANIM = (id, a, b) => ({ quieto: [0], caminar: [1, 2, 3, 0], [a]: [4], [b]: [5], ataque: [4, 5], esquive: [6], caido: id + "Caido" });
const BICHO_ANIM = { quieto: [0], caminar: [0, 2, 1, 3] };
export function buildSprites() {
  const persona = (id, o, atk, nA, nB) => {
    add(id, [...WALK, ...atk, "esquive"].map(p => person(o, p)), undefined, PERSONA_ANIM(id, nA, nB));
    add(id + "Caido", [fallen(o)]);
  };
  persona("thomas", THOMAS, ["golpe", "patada"], "golpe", "patada");
  persona("thomasBielli", THOMAS_BIELLI, ["golpe", "patada"], "golpe", "patada");
  persona("rocio", ROCIO, ["cargar", "lanzar"], "cargar", "lanzar");
  persona("rocioRoros", ROCIO_ROROS, ["cargar", "lanzar"], "cargar", "lanzar");
  persona("maitena", MAITENA, ["golpe", "patada"], "golpeFuerte", "patada");
  add("carmelo", ["idle", "pasoA", "cruce", "pasoB", "patadita"].map(p => kid(CARMELO, p)), undefined, { quieto: [0], caminar: [1, 2, 3, 0], patadita: [4], ataque: [4] });
  add("alumno", WALK.map(p => person(ALUMNO, p)));
  add("alumna", WALK.map(p => person(ALUMNA, p)));
  // enemigos comunes
  for (const [k, o] of Object.entries(CATS)) add(k, [0, 1].map(f => cat(o, f)));
  for (const k of ["gato", "negro", "gordo", "saltarin", "escupidor", "madre"]) add(k + "E", SPR[k].f.map(c => scaled(c, 2)));
  // gatos de la historia (cuadros 0 y 1 = extremos del paso, compatibles con el uso viejo de 2 cuadros)
  const SC = { luz: 2, linda: 3, gataLinda: 2 };
  for (const [k, o] of Object.entries(CATS2)) { const fr = [0, 1, 2, 3].map(f => cat2(o, f)); const s = SC[k] || 1; add(k, s > 1 ? fr.map(c => scaled(c, s)) : fr, undefined, BICHO_ANIM); }
  for (const [k, o] of Object.entries(KITTENS)) add(k, [0, 1, 2, 3].map(f => kitten2(o, f)), undefined, BICHO_ANIM);
  add("gatito", [0, 1].map(kitten));
  add("romero", [0, 1, 2, 3].map(f => poodle(ROMERO, f)), undefined, BICHO_ANIM);
  add("gomeghooo", [0, 1, 2, 3].map(f => poodle(GOMEGHOOO, f)), undefined, BICHO_ANIM);
  add("caniche", [0, 1, 2, 3].map(f => poodle(CANICHE, f)), undefined, BICHO_ANIM);
  add("canicheBoss", [0, 1, 2, 3].map(f => scaled(poodle(CANICHE_BOSS, f), 3)), undefined, BICHO_ANIM);
  add("corbata", [0, 1, 2, 3].map(corbata), undefined, BICHO_ANIM);
  add("paloma", [0, 1].map(paloma));
  for (const [k, fn] of Object.entries(ITEMS)) add(k, [fn()]);
}

// retrato grande para la interfaz (memorizado por nombre y escala)
const _por = {};
export function portrait(name, scale = 6) {
  const k = name + "@" + scale; if (_por[k]) return _por[k];
  const s = SPR[name]; if (!s) return "";
  return (_por[k] = scaled(s.f[0], scale).toDataURL());
}

/* ---------- retratos de diálogo 32x32 (de frente) ---------- */
const W = "#ffffff";
function eyes2(R, P, y, col, opt = {}) {
  // ojos de persona: 2x3 con brillo
  const lx = opt.lx ?? 10, rx = opt.rx ?? 18, h = opt.h ?? 3;
  R(lx, y, 2, h, col); R(rx, y, 2, h, col); P(lx, y, W); P(rx, y, W);
}
function bust(o) {
  return mk(30, 30, ({ R, P, E }) => {
    const sk = o.skin, sd = o.skinD;
    if (o.cape) { R(1, 21, 28, 9, o.cape); R(1, 21, 28, 1, o.capeD); }
    if (o.hair === "largo") { E(15, 12, 10.5, 10, o.hairC); R(4, 12, 22, 18, o.hairC); }
    if (o.headgear) E(15, 12.5, 10.5, 11, o.headgear);
    // torso y cuello
    E(15, 31, 13.5, 8, o.shirt); R(2, 26, 26, 4, o.shirt);
    if (o.sleeveless) { E(3.5, 28, 3, 4, sk); E(26.5, 28, 3, 4, sk); R(6, 24, 1, 6, o.shirtD); R(23, 24, 1, 6, o.shirtD); }
    R(12, 19, 6, 5, sd); R(12, 23, 6, 1, o.shirtD);
    if (o.print) { R(10, 27, 10, 1, o.print); P(12, 27, o.shirt); P(15, 27, o.shirt); P(18, 27, o.shirt); }
    if (o.trim) { R(9, 23, 12, 1, o.trim); }
    if (o.apron) { R(9, 24, 12, 6, o.apron); R(9, 22, 2, 2, o.apron); R(19, 22, 2, 2, o.apron); R(12, 26, 6, 3, o.apronL); R(9, 24, 12, 1, o.apronL); }
    if (o.star) { R(14, 24, 2, 6, o.star); R(11, 26, 8, 2, o.star); P(12, 28, o.star); P(17, 28, o.star); P(13, 29, o.star); P(16, 29, o.star); }
    if (o.necklace) { [[10, 22], [11, 23], [12, 24], [13, 25], [16, 25], [17, 24], [18, 23], [19, 22]].forEach(([x, y]) => P(x, y, o.necklace)); R(14, 25, 2, 2, o.necklace); P(14, 26, "#b8c4d4"); }
    // cara
    E(7, 14, 1.6, 2.2, sk); E(23, 14, 1.6, 2.2, sk); P(7, 14, sd); P(23, 14, sd);
    if (o.headgear) { E(15, 14.5, 6.6, 7.8, sk); }
    else E(15, 13, 7.6, 8.6, sk);
    R(10, 21, 10, 1, sd);
    // ojos, cejas, nariz, boca
    if (o.mask) {
      R(7, 11, 16, 5, o.mask); P(6, 12, o.mask); P(23, 12, o.mask); P(5, 11, o.mask); P(24, 11, o.mask);
      R(10, 12, 3, 3, W); R(17, 12, 3, 3, W); R(11, 13, 2, 2, DK); R(18, 13, 2, 2, DK); P(10, 12, W);
    } else {
      eyes2(R, P, 13, DK, { h: o.kid ? 4 : 3 });
      if (o.lash) { P(9, 13, DK); P(20, 13, DK); }
      if (o.brows) { R(9, 10, 4, 2, o.brows); R(17, 10, 4, 2, o.brows); P(8, 11, o.brows); P(21, 11, o.brows); }
      else { R(9, 11, 4, 1, o.browC || o.hairC); R(17, 11, 4, 1, o.browC || o.hairC); }
    }
    P(15, 16, sd); P(14, 17, sd); P(16, 17, sd);
    R(9, 17, 2, 1, o.blush || "#ee9a90"); R(19, 17, 2, 1, o.blush || "#ee9a90");
    const m = o.mouth || "#a85048";
    if (o.grit) { R(12, 19, 6, 2, m); R(13, 19, 4, 1, W); }
    else { R(13, 19, 4, 1, m); P(12, 18, m); P(17, 18, m); if (o.teeth) R(13, 19, 4, 1, W), R(13, 20, 4, 1, m); }
    // pelo
    const c = o.hairC, l = o.hairL;
    if (o.hair === "rulos") {
      E(15, 5.5, 9.4, 4.8, c);
      [[7, 5.5], [9.5, 3.2], [13, 2.4], [17, 2.4], [20.5, 3.2], [23, 5.5]].forEach(([x, y]) => E(x, y, 2.6, 2.3, c));
      R(6, 6, 2, 6, c); R(22, 6, 2, 5, c); P(6, 12, o.fade); P(7, 12, o.fade); P(22, 11, o.fade); P(23, 11, o.fade);
      [[9, 9], [10, 10], [13, 9], [14, 10], [18, 9], [17, 10], [21, 9]].forEach(([x, y]) => P(x, y, c));
      R(8, 8, 15, 1, c);
      [[9, 3], [12, 2], [16, 2], [19, 3], [22, 5], [7, 5], [11, 5], [15, 4], [19, 5], [13, 7], [17, 7], [9, 7], [21, 7], [10, 3], [14, 2], [18, 3]].forEach(([x, y]) => P(x, y, l));
    } else if (o.hair === "largo") {
      E(15, 6, 9, 5, c); R(6, 6, 3, 10, c); R(21, 6, 3, 9, c);
      // flequillo de costado
      for (let y = 5; y <= 10; y++) R(8, y, Math.max(0, 14 - (y - 5) * 2), 1, c);
      R(4, 18, 4, 12, c); R(22, 18, 4, 12, c); P(5, 22, l); P(24, 22, l); P(23, 26, l);
      [[10, 3], [13, 2], [17, 2], [20, 4], [11, 6], [7, 12]].forEach(([x, y]) => P(x, y, l));
    } else if (o.hair === "corto") {
      E(15, 6, 8.6, 4.4, c); R(7, 6, 2, 5, c); R(21, 6, 2, 5, c); R(9, 8, 12, 1, c); P(11, 9, c); P(15, 9, c); P(19, 9, c); P(15, 1, c); P(16, 0, c);
      P(11, 4, l); P(16, 3, l); P(19, 5, l);
    }
    if (o.headgear) {
      const h = o.headgear, hl = o.headgearL; R(9, 4, 12, 3, h); R(7, 6, 3, 9, h); R(20, 6, 3, 9, h); P(10, 7, h); P(19, 7, h);
      R(10, 2, 10, 1, hl); P(9, 3, hl); R(8, 8, 1, 5, hl); R(10, 7, 10, 1, o.hairC); P(12, 8, o.hairC); P(17, 8, o.hairC);
    }
    if (o.gloves) {
      E(5, 25, 4.6, 4.6, o.gloves); E(25, 25, 4.6, 4.6, o.gloves); P(3, 22, o.gloveL); P(4, 22, o.gloveL); P(23, 22, o.gloveL); P(24, 22, o.gloveL);
      R(2, 28, 7, 2, o.cuff || o.glovesD); R(22, 28, 7, 2, o.cuff || o.glovesD);
    }
  });
}

function catFace(o) {
  return mk(30, 30, ({ R, P, E }) => {
    const c = o.fur, d = o.furD, kit = o.kit;
    const hcx = 15, hcy = kit ? 18 : 17, rx = kit ? 9.6 : 11.4, ry = kit ? 8.6 : 9.4;
    if (o.ruff) { E(15, 19, 14.4, 10.6, o.ruff); [[1, 16], [0, 20], [1, 24], [28, 16], [29, 20], [28, 24], [5, 28], [24, 28]].forEach(([x, y]) => P(x, y, o.ruff)); }
    // orejas
    const ear = (side) => {
      const ex = kit ? 7 : 6, top = kit ? 3 : 2;
      for (let k = 0; k < 8; k++) {
        const x0 = ex - (k >> 2), x1 = ex + 1 + k; const y = top + k;
        for (let x = x0; x <= x1; x++) P(side ? 29 - x : x, y, c);
        if (k >= 2 && k <= 6) for (let x = x0 + 2; x <= x1 - 2; x++) P(side ? 29 - x : x, y, o.inner || "#f0a0a0");
      }
    };
    ear(0); ear(1);
    if (o.earC) { for (let k = 0; k < 3; k++) { P((kit ? 7 : 6) + k, (kit ? 3 : 2) + k, o.earC); P(29 - ((kit ? 7 : 6) + k), (kit ? 3 : 2) + k, o.earC); } }
    // cabeza
    E(hcx, hcy, rx, ry, c);
    if (o.fluffy) { const L = Math.round(hcx - rx), Rr = Math.round(hcx + rx) - 1; [[L - 1, hcy], [L - 2, hcy + 2], [L - 1, hcy + 4], [Rr + 1, hcy], [Rr + 2, hcy + 2], [Rr + 1, hcy + 4]].forEach(([x, y]) => P(x, y, c)); }
    if (o.bib) E(15, 29.5, 8, 3, o.bib);
    if (o.belly) E(15, 29.5, 9, 3, o.belly);
    if (o.blaze) { R(14, hcy - 9, 2, 6, o.blaze); R(13, hcy - 3, 4, 3, o.blaze); }
    if (o.stripe) { R(11, hcy - 8, 1, 3, o.stripe); R(15, hcy - 9, 1, 4, o.stripe); R(19, hcy - 8, 1, 3, o.stripe); P(12, hcy - 5, o.stripe); P(18, hcy - 5, o.stripe); R(4, hcy, 3, 1, o.stripe); R(23, hcy, 3, 1, o.stripe); R(5, hcy + 2, 2, 1, o.stripe); R(23, hcy + 2, 2, 1, o.stripe); }
    if (o.muzzle) E(15, hcy + 5, kit ? 4 : 5, 2.8, o.muzzle);
    // ojos
    const ey = hcy - 2, es = kit ? 5 : 4;
    const eye = (x, y, s) => {
      R(x, y, s, s, o.eye); P(x, y, c); P(x + s - 1, y, c); P(x, y + s - 1, c); P(x + s - 1, y + s - 1, c);
      R(x + (s >> 1) - (s > 4 ? 1 : 0), y, s > 4 ? 2 : 1, s, DK); P(x + 1, y + 1, W);
    };
    const lx = kit ? 8 : 9, rxx = kit ? 17 : 17;
    eye(lx, ey - (o.cross ? 1 : 0), es); eye(rxx, ey + (o.cross ? 2 : 0), o.cross ? es - 2 : es);
    if (o.grumpy) { R(lx, ey, es, 1, d); R(rxx, ey, es, 1, d); P(lx, ey - 2, DK); P(lx + 1, ey - 2, DK); P(lx + 2, ey - 1, DK); P(lx + 3, ey - 1, DK); P(rxx + 3, ey - 2, DK); P(rxx + 2, ey - 2, DK); P(rxx + 1, ey - 1, DK); P(rxx, ey - 1, DK); }
    // nariz y boca
    const ny = hcy + 3;
    R(14, ny, 3, 1, "#e8868e"); P(15, ny + 1, "#e8868e");
    P(15, ny + 2, DK); P(14, ny + 3, DK); P(13, ny + 3, DK); P(16, ny + 3, DK); P(17, ny + 3, DK);
    if (o.tongue) { R(14, ny + 4, 2, 2, "#ff7a9a"); P(14, ny + 5, "#e85a7a"); }
    // bigotes
    [[4, ny], [6, ny + 1], [8, ny + 1], [25, ny], [23, ny + 1], [21, ny + 1], [5, ny + 3], [7, ny + 2], [24, ny + 3], [22, ny + 2]].forEach(([x, y]) => P(x, y, o.whisk || "#e8e8ee"));
    if (o.stache) { R(11, ny + 2, 3, 1, o.stache); R(16, ny + 2, 3, 1, o.stache); P(10, ny + 1, o.stache); P(19, ny + 1, o.stache); P(9, ny, o.stache); P(20, ny, o.stache); }
    if (o.crown) { R(11, 3, 8, 3, "#f2c230"); P(11, 2, "#f2c230"); P(14, 1, "#f2c230"); P(15, 1, "#f2c230"); P(18, 2, "#f2c230"); P(14, 4, "#4ac8ff"); P(15, 4, "#4ac8ff"); R(11, 5, 8, 1, "#c79520"); P(12, 3, "#fff2b0"); }
    if (o.bigCrown) { R(9, 1, 12, 4, "#f2c230"); P(9, 0, "#f2c230"); P(12, 0, "#f2c230"); P(15, 0, "#f2c230"); P(17, 0, "#f2c230"); P(20, 0, "#f2c230"); P(14, 2, "#e0483c"); P(15, 2, "#e0483c"); R(9, 4, 12, 1, "#c79520"); }
  });
}
const FACES = {
  juli: { fur: "#8a8d96", furD: "#6f727b", bib: "#f4f4f4", blaze: "#f4f4f4", muzzle: "#f4f4f4", eye: "#7ed957", fluffy: true },
  luz: { fur: "#8d8170", furD: "#6e6355", stripe: "#3e342b", belly: "#e08a3a", eye: "#e0a53a", grumpy: true, muzzle: "#b8ab98" },
  linda: { fur: "#8a7a66", furD: "#6c5e4d", stripe: "#3e342b", ruff: "#b0a088", bib: "#f6f3ee", muzzle: "#f6f3ee", eye: "#ff6a3a", grumpy: true, fluffy: true }
};
FACES.juliano = { ...FACES.juli, crown: true, stache: "#2b2833" };
FACES.chema = { ...FACES.juli, kit: true, tongue: true, fluffy: false };
FACES.amanda = { ...FACES.juli, kit: true, cross: true, fluffy: false, tongue: false };
FACES.lindaJefa = { ...FACES.linda, bigCrown: true };

function dogFace(o) {
  return mk(30, 30, ({ R, P, E }) => {
    const c = o.fur, d = o.dark, l = o.light;
    if (o.poodle) {
      E(6, 18, 3.6, 7.5, d); E(24, 18, 3.6, 7.5, d); [[4, 13], [6, 15], [5, 19], [7, 22], [24, 14], [23, 18], [25, 21]].forEach(([x, y]) => P(x, y, c));
      E(15, 16, 8.4, 8.4, c);
      E(15, 7, 8, 5.5, c); [[10, 5], [13, 3], [17, 4], [20, 6], [12, 8], [16, 7], [19, 9], [9, 8]].forEach(([x, y]) => P(x, y, d)); [[11, 4], [15, 3], [18, 6], [14, 6]].forEach(([x, y]) => P(x, y, l));
      E(15, 29, 7, 3, c);
      E(15, 21, 4.6, 3.6, l); R(13, 18, 4, 2, DK); P(13, 18, "#5a5a66");
      R(10, 14, 3, 3, DK); R(18, 14, 3, 3, DK); P(10, 14, W); P(18, 14, W);
      R(14, 23, 2, 1, DK);
      if (o.tongue) R(14, 24, 2, 2, "#ff7a9a");
      if (o.bow) { R(8, 1, 4, 5, o.bow); R(18, 1, 4, 5, o.bow); R(12, 2, 6, 3, o.bowD); P(9, 2, "#ffb3d0"); P(19, 2, "#ffb3d0"); if (o.boss) { P(7, 0, o.bow); P(22, 0, o.bow); R(7, 1, 1, 5, o.bow); R(22, 1, 1, 5, o.bow); } }
      if (o.boss) { R(9, 12, 4, 1, DK); P(12, 13, DK); R(17, 12, 4, 1, DK); P(17, 13, DK); P(11, 15, "#ff3a6a"); P(19, 15, "#ff3a6a"); R(13, 23, 4, 1, DK); P(12, 22, DK); P(17, 22, DK); }
      if (o.beret) { E(14, 4, 10, 3.4, o.beret); P(14, 0, o.beret); P(15, 0, o.beret); R(6, 5, 16, 1, o.beretD); P(9, 3, o.beretL); P(10, 2, o.beretL); }
      if (o.stache) { R(10, 21, 4, 1, o.stache); R(16, 21, 4, 1, o.stache); P(9, 20, o.stache); P(20, 20, o.stache); P(8, 19, o.stache); P(21, 19, o.stache); }
    } else {
      // Corbata
      E(5, 14, 3.4, 7, d); E(25, 14, 3.4, 7, d);
      E(15, 14, 9, 8.6, c); R(4, 24, 22, 6, c); E(15, 25, 10, 4, c);
      R(13, 23, 4, 2, W); R(14, 25, 2, 2, W); R(13, 27, 4, 3, W); P(12, 29, W); P(17, 29, W); R(13, 23, 4, 1, "#d8d2c6");
      E(15, 19, 5.4, 4, l); R(13, 16, 4, 3, DK); P(13, 16, "#6a6a76");
      R(10, 12, 3, 3, "#8a5a2b"); R(17, 12, 3, 3, "#8a5a2b"); R(11, 13, 1, 2, DK); R(18, 13, 1, 2, DK); P(10, 12, W); P(17, 12, W);
      P(10, 10, l); P(11, 10, l); P(18, 10, l); P(19, 10, l);
      R(14, 21, 2, 1, DK); R(14, 22, 2, 2, "#ff7a9a");
    }
  });
}
const DOGFACES = {
  romero: { poodle: true, fur: "#b8652f", dark: "#8e4a1f", light: "#d68548" },
  caniche: { poodle: true, fur: "#efe5d3", dark: "#cdbfa5", light: "#fffaf0", bow: "#ff5fa0", bowD: "#c83a78" },
  corbata: { fur: "#2c2833", dark: "#1f1c25", light: "#4a4554" }
};
DOGFACES.corbata.fur = "#2c2833";
DOGFACES.gomeghooo = { ...DOGFACES.romero, beret: "#22222c", beretD: "#15151c", beretL: "#40404e", stache: "#2a1a12" };
DOGFACES.canicheBoss = { ...DOGFACES.caniche, boss: true };

// el comisario: solo una voz por teléfono
function telefono() {
  return mk(30, 30, ({ R, P, E }) => {
    const c = "#c8262e", d = "#8e1a20", l = "#ff6a6a";
    R(5, 16, 20, 12, c); R(4, 20, 22, 8, c); R(4, 27, 22, 2, d); R(6, 16, 18, 1, l);
    E(15, 22, 5, 4.6, "#f2ece0"); E(15, 22, 1.6, 1.6, d);
    [[12, 19], [15, 18], [18, 19], [19, 22], [18, 25], [11, 22], [12, 25]].forEach(([x, y]) => P(x, y, "#3a3a44"));
    R(4, 10, 22, 3, c); R(3, 8, 6, 6, c); R(21, 8, 6, 6, c); R(4, 13, 4, 2, d); R(22, 13, 4, 2, d); R(5, 9, 18, 1, l);
    R(13, 13, 4, 3, d);
    // timbre sonando
    [[0, 3], [1, 2], [2, 1], [29, 3], [28, 2], [27, 1], [0, 8], [1, 7], [29, 8], [28, 7]].forEach(([x, y]) => P(x, y, "#ffd24a"));
    R(1, 5, 1, 1, "#ffd24a"); R(28, 5, 1, 1, "#ffd24a");
  });
}

const PORTRAIT_FN = {
  thomas: () => bust({ ...THOMAS, fade: "#7a5a48", mouth: "#b0544a", teeth: true }),
  thomasBielli: () => bust({ ...THOMAS_BIELLI, sleeveless: false, fade: "#7a5a48", mouth: "#b0544a", gloves: "#1f1f26", glovesD: "#15151a", gloveL: "#4a4a56", cuff: "#c42a30" }),
  rocio: () => bust({ ...ROCIO }),
  rocioRoros: () => bust({ ...ROCIO_ROROS }),
  carmelo: () => bust({ skin: CARMELO.skin, skinD: CARMELO.skinD, hair: "corto", hairC: CARMELO.hairC, hairL: CARMELO.hairL, shirt: CARMELO.suit, shirtD: CARMELO.suitD, star: CARMELO.star, cape: CARMELO.cape, capeD: CARMELO.capeD, mask: CARMELO.mask, kid: true }),
  maitena: () => bust({ ...MAITENA, hair: null, grit: true, browC: "#2a1c16" }),
  juli: () => catFace(FACES.juli),
  juliano: () => catFace(FACES.juliano),
  chema: () => catFace(FACES.chema),
  amanda: () => catFace(FACES.amanda),
  luz: () => catFace(FACES.luz),
  linda: () => catFace(FACES.linda),
  lindaJefa: () => catFace(FACES.lindaJefa),
  romero: () => dogFace(DOGFACES.romero),
  gomeghooo: () => dogFace(DOGFACES.gomeghooo),
  caniche: () => dogFace(DOGFACES.caniche),
  canicheBoss: () => dogFace(DOGFACES.canicheBoss),
  corbata: () => dogFace(DOGFACES.corbata),
  comisario: telefono
};
export const PORTRAIT_IDS = Object.keys(PORTRAIT_FN);
const _pc = {}, _pu = {};
// canvas 32x32 del retrato (memorizado)
export function dialogCanvas(id) {
  if (!PORTRAIT_FN[id]) return null;
  return _pc[id] || (_pc[id] = PORTRAIT_FN[id]());
}
// dataURL del retrato de diálogo, ampliado sin suavizar; se calcula una sola vez por id y escala
export function dialogPortrait(id, scale = 3) {
  const k = id + "@" + scale;
  if (_pu[k] != null) return _pu[k];
  const c = dialogCanvas(id);
  return (_pu[k] = c ? (scale === 1 ? c : scaled(c, scale)).toDataURL() : "");
}
