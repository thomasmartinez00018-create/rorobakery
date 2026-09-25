// Personajes toon: Thomas, Rocío, las mascotas y los sospechosos. Todo con primitivas y contorno negro.
import * as THREE from "three";

let GRAD = null;
function gradient() {
  if (GRAD) return GRAD;
  GRAD = new THREE.DataTexture(new Uint8Array([70, 150, 215, 255]), 4, 1, THREE.RedFormat);
  GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
  GRAD.needsUpdate = true;
  return GRAD;
}
const mats = new Map();
export function toon(color, extra) {
  const key = String(color) + (extra ? JSON.stringify(Object.keys(extra)) + (extra.map ? extra.map.uuid : "") + (extra.emissive || "") : "");
  if (!extra && mats.has(key)) return mats.get(key);
  const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: gradient() }, extra || {}));
  if (!extra) mats.set(key, m);
  return m;
}
export const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x17131c, side: THREE.BackSide });

export function mesh(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, color instanceof THREE.Material ? color : toon(color, o.mat));
  m.castShadow = o.shadow !== false;
  m.receiveShadow = !!o.receive;
  if (o.outline !== false) {
    const ol = new THREE.Mesh(geo, OUTLINE);
    ol.scale.setScalar(o.ol || 1.07);
    ol.raycast = () => {};
    m.add(ol);
  }
  return m;
}
const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export { canvasTex };

const tabbyCache = {};
function tabbyTex(base, stripe) {
  const k = base + stripe;
  if (tabbyCache[k]) return tabbyCache[k];
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // manchas suaves + rayas atigradas onduladas que rodean el cuerpo
    for (let i = 0; i < 120; i++) { g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 10, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = stripe; g.lineCap = "round"; g.globalAlpha = 0.75;
    for (let i = 0; i < 11; i++) {
      const y = 12 + i * 22; g.lineWidth = 4 + (i % 3) * 2;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x / 18 + i) * 5; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return tabbyCache[k] = t;
}

/* ---------------- humanos ---------------- */
export function human(o) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const skin = o.skin || "#e8b893";

  // piernas y calzado
  const legGeo = new THREE.CapsuleGeometry(0.105, 0.34, 4, 10);
  const legs = [];
  [-0.12, 0.12].forEach((x, i) => {
    const pivot = at(new THREE.Group(), x, 0.52, 0);
    const leg = at(mesh(legGeo, o.pants || "#555"), 0, -0.24, 0);
    pivot.add(leg);
    if (o.pantStripe) { const st = at(mesh(new THREE.BoxGeometry(0.02, 0.44, 0.05), o.pantStripe, { outline: false }), (i ? 1 : -1) * 0.105, -0.24, 0); pivot.add(st); }
    if (o.shorts) { leg.material = toon(skin); const sh = at(mesh(new THREE.CylinderGeometry(0.125, 0.12, 0.2, 10), o.pants), 0, -0.02, 0); pivot.add(sh); }
    const shoe = at(mesh(new THREE.BoxGeometry(0.17, 0.08, 0.28), o.shoes || "#eee"), 0, -0.5, 0.05);
    pivot.add(shoe);
    if (o.shoeStripe) for (let s = 0; s < 3; s++) pivot.add(at(mesh(new THREE.BoxGeometry(0.18, 0.02, 0.03), o.shoeStripe, { outline: false }), 0, -0.455, -0.02 + s * 0.07));
    body.add(pivot); legs.push(pivot);
  });

  // torso
  const torso = at(mesh(new THREE.CapsuleGeometry(0.27, 0.3, 6, 14), o.shirt || "#333"), 0, 0.82, 0);
  torso.scale.set(1, 1, 0.78);
  body.add(torso);
  if (o.print) {
    const tex = canvasTex(256, 96, (c, w, h) => { c.fillStyle = "#fff"; c.font = "900 58px Georgia, serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(o.print, w / 2, h / 2 + 4); });
    const pl = at(new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12), new THREE.MeshBasicMaterial({ map: tex, transparent: true })), 0, 0.88, 0.215);
    body.add(pl);
  }
  if (o.necklace) {
    const nk = at(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 24, Math.PI), toon("#dfe3ea")), 0, 1.05, 0.1);
    nk.rotation.set(Math.PI * 0.62, 0, Math.PI); body.add(nk);
  }

  // brazos (pivote en el hombro)
  const arms = [];
  [-1, 1].forEach(s => {
    const p = at(new THREE.Group(), s * 0.34, 1.0, 0);
    const bare = !o.sleeves || o.sleeves === "none" || o.sleeves === "short";
    const arm = at(mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 8), bare ? skin : o.shirt), 0, -0.24, 0);
    p.add(arm);
    if (o.sleeves === "short") p.add(at(mesh(new THREE.CapsuleGeometry(0.095, 0.06, 4, 8), o.shirt), 0, -0.06, 0));
    p.add(at(mesh(new THREE.SphereGeometry(0.075, 10, 8), skin), 0, -0.47, 0));
    p.rotation.z = s * 0.1;
    body.add(p); arms.push(p);
  });

  // cabeza
  const head = at(new THREE.Group(), 0, 1.42, 0);
  body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.36, 22, 16), skin));
  [-1, 1].forEach(s => head.add(at(mesh(new THREE.SphereGeometry(0.07, 10, 8), skin), s * 0.35, -0.02, 0)));
  const eyes = [];
  [-1, 1].forEach(s => {
    const e = at(new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), toon("#1a1512")), s * 0.12, 0.01, 0.315);
    e.scale.z = 0.6; head.add(e); eyes.push(e);
    const shine = at(new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })), 0.012, 0.018, 0.035);
    e.add(shine);
    const brow = at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.02), toon(o.hairColor || "#222")), s * 0.12, 0.1, 0.33);
    brow.rotation.z = -s * 0.08; head.add(brow);
  });
  const mouth = at(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 6, 16, Math.PI), toon("#7a3b34")), 0, -0.12, 0.33);
  mouth.rotation.z = Math.PI; head.add(mouth);
  [-1, 1].forEach(s => { const bl = at(new THREE.Mesh(new THREE.CircleGeometry(0.045, 14), new THREE.MeshBasicMaterial({ color: 0xff8a80, transparent: true, opacity: 0.35 })), s * 0.2, -0.07, 0.3); bl.rotation.y = s * 0.5; head.add(bl); });

  hairFor(head, o.hair || "corto", o.hairColor || "#221a15");

  g.userData = { kind: "human", body, head, arms, legs, eyes, mouth, phase: Math.random() * 10, blinkAt: 1 + Math.random() * 3 };
  if (o.height) g.scale.setScalar(o.height);
  return g;
}

function hairFor(head, style, color) {
  const hm = color;
  const cap = (theta = 0.55) => {
    const m = mesh(new THREE.SphereGeometry(0.385, 22, 14, 0, Math.PI * 2, 0, Math.PI * theta), hm, { ol: 1.04 });
    m.position.y = 0.035; m.rotation.x = -0.18; return m;
  };
  if (style === "pelado") return;
  if (style === "gorra") {
    const c = mesh(new THREE.SphereGeometry(0.39, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), "#c0392b", { ol: 1.04 });
    c.position.y = 0.06; head.add(c);
    head.add(at(mesh(new THREE.BoxGeometry(0.4, 0.03, 0.26), "#c0392b"), 0, 0.14, 0.38));
    return;
  }
  head.add(cap(style === "corto" ? 0.5 : 0.56));
  if (style === "rulos") {
    const pts = [[-0.2, 0.28, 0.18], [-0.05, 0.32, 0.21], [0.1, 0.31, 0.2], [0.22, 0.26, 0.15], [-0.26, 0.2, 0.05], [0.28, 0.2, 0.03], [-0.12, 0.35, 0.05], [0.08, 0.37, 0.02], [0.0, 0.33, -0.15], [-0.18, 0.3, -0.12], [0.2, 0.3, -0.1], [-0.1, 0.24, 0.27], [0.05, 0.25, 0.28]];
    pts.forEach(p => head.add(at(mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.025, 10, 8), hm, { ol: 1.1 }), p[0], p[1], p[2])));
  }
  if (style === "largo" || style === "rodete") {
    const back = at(mesh(new THREE.CapsuleGeometry(0.3, style === "largo" ? 0.5 : 0.1, 6, 14), hm), 0, style === "largo" ? -0.28 : -0.02, -0.14);
    back.scale.set(1.12, 1, 0.62); head.add(back);
    if (style === "largo") [-1, 1].forEach(s => { const st = at(mesh(new THREE.CapsuleGeometry(0.08, 0.42, 4, 8), hm), s * 0.3, -0.22, 0.1); st.rotation.z = s * 0.08; head.add(st); });
    if (style === "rodete") head.add(at(mesh(new THREE.SphereGeometry(0.17, 14, 12), hm), 0, 0.36, -0.2));
    const part = at(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.3), toon("#e9c6a8")), 0.03, 0.4, 0.12);
    part.rotation.x = -0.4; head.add(part);
  }
}

export function thomas() {
  return human({ skin: "#e6b48f", hair: "rulos", hairColor: "#1c1411", shirt: "#15171c", sleeves: "none", print: "FOREVER", pants: "#8b8e95", pantStripe: "#f1f1f1", shoes: "#1f3c88", shoeStripe: "#ffffff" });
}
export function rocio() {
  return human({ skin: "#efc3a2", hair: "largo", hairColor: "#2a1a13", shirt: "#c8b4ea", sleeves: "short", necklace: true, pants: "#1d1d22", shoes: "#f3f3f3", height: 0.95 });
}
export function suspect(look) {
  return human({ skin: look.skin, hair: look.hair, hairColor: look.hairColor, shirt: look.shirt, sleeves: "short", pants: look.pants, shoes: "#3a3a3a", height: look.height });
}

/* ---------------- gatos ---------------- */
export function cat(o) {
  const g = new THREE.Group();
  const furMat = o.tabby ? toon("#ffffff", { map: tabbyTex(o.fur, o.stripe) }) : toon(o.fur);
  const s = o.fluffy ? 1.08 : 1;
  const body = at(mesh(new THREE.SphereGeometry(0.3 * s, 18, 14), furMat), 0, 0.33, 0);
  body.scale.set(1, 0.86, 1.4); g.add(body);
  if (o.belly) { const b = at(mesh(new THREE.SphereGeometry(0.24, 14, 10), o.belly, { outline: false }), 0, 0.24, 0.05); b.scale.set(1, 0.7, 1.3); g.add(b); }
  if (o.bib) { const b = at(mesh(new THREE.SphereGeometry(0.2, 14, 12), o.bib, { outline: false }), 0, 0.38, 0.3); b.scale.set(1, 1.15, 0.62); g.add(b); }

  const legs = [];
  [[-0.14, 0.26], [0.14, 0.26], [-0.14, -0.26], [0.14, -0.26]].forEach(([x, z]) => {
    const l = at(mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.24, 8), furMat), x, 0.12, z); g.add(l); legs.push(l);
    g.add(at(mesh(new THREE.SphereGeometry(0.07, 10, 8), o.paws || o.fur, { ol: 1.1 }), x, 0.03, z + 0.03));
  });

  const head = at(new THREE.Group(), 0, 0.64, 0.4); g.add(head);
  const hs = o.fluffy ? 1.1 : 1;
  const skull = mesh(new THREE.SphereGeometry(0.24 * hs, 20, 16), furMat); head.add(skull);
  if (o.fluffy) [-1, 1].forEach(sd => { const ch = at(mesh(new THREE.SphereGeometry(0.13, 10, 8), furMat, { outline: false }), sd * 0.2, -0.1, 0.02); ch.scale.set(1, 0.8, 0.8); head.add(ch); });
  if (o.blaze) { const bz = at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), toon(o.blaze)), 0, 0.02, 0.2 * hs); bz.scale.set(0.45, 1.3, 0.4); head.add(bz); }
  const muz = at(mesh(new THREE.SphereGeometry(0.1, 14, 10), o.muzzle || o.bib || o.fur, { outline: false }), 0, -0.08, 0.19 * hs);
  muz.scale.set(1.25, 0.72, 0.7); head.add(muz);
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), toon("#e89a9a")), 0, -0.04, 0.26 * hs));
  [-1, 1].forEach(sd => {
    const ear = at(mesh(new THREE.ConeGeometry(0.085, 0.17, 4), furMat), sd * 0.14, 0.2 * hs, -0.01);
    ear.rotation.set(-0.1, sd * 0.4, sd * -0.35); head.add(ear);
    const inner = at(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), toon("#f0a8a8")), 0, -0.02, 0.03); ear.add(inner);
  });
  const eyes = [];
  [-1, 1].forEach(sd => {
    const e = at(new THREE.Mesh(new THREE.SphereGeometry(o.glow ? 0.058 : 0.05, 12, 10), o.glow ? toon(o.eyes, { emissive: o.eyes, emissiveIntensity: 1.6 }) : toon(o.eyes)), sd * 0.09, 0.035, 0.205 * hs);
    e.scale.z = 0.55; head.add(e); eyes.push(e);
    const pupil = at(new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.07, 0.01), toon("#0d0b0a")), 0, 0, 0.045); e.add(pupil);
    if (o.grumpy) {
      const lid = at(new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), furMat), sd * 0.09, 0.04, 0.205 * hs);
      lid.rotation.x = 0.95; lid.scale.z = 0.62; head.add(lid);
      const br = at(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.02), toon("#2a2019")), sd * 0.09, 0.105, 0.22 * hs); br.rotation.z = sd * 0.42; head.add(br);
    }
  });
  const wh = new THREE.MeshBasicMaterial({ color: 0xf3f3f3 });
  [-1, 1].forEach(sd => [0, 1].forEach(k => { const w = at(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.004, 0.004), wh), sd * 0.16, -0.07 - k * 0.025, 0.2 * hs); w.rotation.z = sd * (0.12 - k * 0.2); head.add(w); }));

  // cola: cadena de segmentos
  const tail = at(new THREE.Group(), 0, 0.42, -0.4); g.add(tail);
  let prev = tail; const segs = [];
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group(); seg.position.set(0, i ? 0.085 : 0, i ? -0.02 : 0);
    const rr = (o.fluffy ? 0.1 : 0.055) * (1 - i * 0.05);
    seg.add(mesh(new THREE.SphereGeometry(rr, 10, 8), i === 6 && o.tailTip ? toon(o.tailTip) : furMat, { ol: 1.12 }));
    prev.add(seg); prev = seg; segs.push(seg);
  }
  tail.rotation.x = -0.7;
  g.userData = { kind: "cat", head, eyes, tail: segs, legs, phase: Math.random() * 10, blinkAt: 2 + Math.random() * 3, body };
  if (o.scale) g.scale.setScalar(o.scale);
  return g;
}

export const juli = () => cat({ fur: "#80838c", bib: "#f4f4f4", blaze: "#f4f4f4", muzzle: "#f4f4f4", paws: "#f4f4f4", eyes: "#b9cf5a", fluffy: true, scale: 0.9 });
export const lindaGata = (glow) => cat({ fur: "#8a7a66", stripe: "#3e342b", tabby: true, bib: "#f6f3ee", muzzle: "#f6f3ee", paws: "#f6f3ee", eyes: "#c7cf6a", fluffy: true, grumpy: true, glow, scale: 1.05 });
export const luz = () => cat({ fur: "#8d8170", stripe: "#3a3129", tabby: true, belly: "#d19356", muzzle: "#efe6da", eyes: "#e0a53a", grumpy: true, scale: 0.9 });

/* ---------------- perros ---------------- */
function shade(hex, k) {
  const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return "#" + c.getHexString();
}
export function poodle(o) {
  const g = new THREE.Group();
  const col = o.color;
  const blob = (x, y, z, r, k = 0) => at(mesh(new THREE.SphereGeometry(r, 10, 8), shade(col, k), { ol: 1.09 }), x, y, z);
  const body = new THREE.Group(); g.add(body);
  [[0, 0.36, 0], [0.12, 0.38, 0.12], [-0.12, 0.38, 0.12], [0.12, 0.36, -0.12], [-0.12, 0.36, -0.12], [0, 0.46, 0.05], [0, 0.44, -0.12], [0, 0.3, 0.16], [0, 0.3, -0.18]]
    .forEach((p, i) => body.add(blob(p[0], p[1], p[2], 0.14, (i % 3 - 1) * 0.03)));
  const legs = [];
  [[-0.11, 0.18], [0.11, 0.18], [-0.11, -0.2], [0.11, -0.2]].forEach(([x, z]) => {
    const l = at(new THREE.Group(), x, 0.26, z);
    l.add(at(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 8), col), 0, -0.1, 0));
    l.add(blob(0, -0.2, 0.02, 0.075, -0.03));
    g.add(l); legs.push(l);
  });
  const head = at(new THREE.Group(), 0, 0.62, 0.26); g.add(head);
  [[0, 0.02, 0], [0.09, 0.07, -0.02], [-0.09, 0.07, -0.02], [0, 0.13, -0.03], [0.08, -0.03, 0.02], [-0.08, -0.03, 0.02]].forEach((p, i) => head.add(blob(p[0], p[1], p[2], 0.12, (i % 2) * 0.04)));
  const snout = at(mesh(new THREE.SphereGeometry(0.075, 12, 10), shade(col, -0.02)), 0, -0.04, 0.13); snout.scale.set(1, 0.8, 1.2); head.add(snout);
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), toon("#141011")), 0, -0.02, 0.21));
  const eyes = [];
  [-1, 1].forEach(s => { const e = at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), toon("#120e0d")), s * 0.065, 0.04, 0.12); head.add(e); eyes.push(e); });
  const ears = [];
  [-1, 1].forEach(s => { const ear = at(new THREE.Group(), s * 0.14, 0.04, -0.01); ear.add(blob(0, -0.04, 0, 0.07, -0.04)); ear.add(blob(0, -0.12, 0, 0.065, -0.05)); head.add(ear); ears.push(ear); });
  const tail = at(new THREE.Group(), 0, 0.46, -0.28); tail.add(blob(0, 0.08, -0.03, 0.08)); g.add(tail);
  g.userData = { kind: "dog", head, eyes, legs, tail: [tail], ears, phase: Math.random() * 10, blinkAt: 2 };
  if (o.scale) g.scale.setScalar(o.scale);
  return g;
}
export const romero = () => poodle({ color: "#b0602c", scale: 0.85 });
export const lindaCanichita = () => poodle({ color: "#efe5d3", scale: 0.85 });

export function corbata() {
  const g = new THREE.Group();
  const blk = "#1c1a1c";
  const body = at(mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 12), blk), 0, 0.42, 0);
  body.rotation.x = Math.PI / 2; g.add(body);
  const chest = at(mesh(new THREE.SphereGeometry(0.13, 12, 10), "#efe8dd", { outline: false }), 0, 0.42, 0.3); chest.scale.set(0.8, 1.1, 0.5); g.add(chest);
  const legs = [];
  [[-0.12, 0.24], [0.12, 0.24], [-0.12, -0.24], [0.12, -0.24]].forEach(([x, z]) => {
    const l = at(new THREE.Group(), x, 0.34, z);
    l.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.32, 8), blk), 0, -0.16, 0)); g.add(l); legs.push(l);
  });
  const head = at(new THREE.Group(), 0, 0.72, 0.36); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.19, 16, 12), blk));
  const sn = at(mesh(new THREE.CapsuleGeometry(0.08, 0.1, 4, 10), "#2a2628"), 0, -0.06, 0.17); sn.rotation.x = Math.PI / 2; head.add(sn);
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), toon("#050505")), 0, -0.04, 0.29));
  const eyes = [];
  [-1, 1].forEach(s => {
    const e = at(new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), toon("#8a5a32")), s * 0.08, 0.05, 0.165); head.add(e); eyes.push(e);
    e.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })), 0.01, 0.012, 0.028));
  });
  const ears = [];
  [-1, 1].forEach(s => { const ear = at(mesh(new THREE.SphereGeometry(0.09, 10, 8), blk), s * 0.17, 0.06, -0.02); ear.scale.set(0.5, 1.2, 0.9); head.add(ear); ears.push(ear); });
  const tail = at(new THREE.Group(), 0, 0.5, -0.4);
  const tm = at(mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 8), blk), 0, 0.12, -0.05); tm.rotation.x = -0.6; tail.add(tm); g.add(tail);
  g.userData = { kind: "dog", head, eyes, legs, tail: [tail], ears, phase: Math.random() * 10, blinkAt: 2 };
  g.scale.setScalar(0.95);
  return g;
}

/* ---------------- animación idle ---------------- */
export function animate(a, t, dt) {
  const u = a.userData; if (!u) return;
  const p = t + u.phase;
  if (u.eyes) {
    u.blinkAt -= dt;
    const blink = u.blinkAt < 0 && u.blinkAt > -0.12;
    if (u.blinkAt < -0.12) u.blinkAt = 2 + Math.random() * 4;
    u.eyes.forEach(e => { e.scale.y = blink ? 0.12 : 1; });
  }
  if (u.busy) return;
  if (u.kind === "human") {
    u.body.position.y = Math.sin(p * 2.2) * 0.012;
    u.head.rotation.z = Math.sin(p * 0.9) * 0.05;
    u.head.rotation.y = Math.sin(p * 0.5) * 0.15;
    u.arms[0].rotation.x = Math.sin(p * 1.1) * 0.05;
    u.arms[1].rotation.x = -Math.sin(p * 1.1) * 0.05;
  } else if (u.kind === "cat") {
    u.tail.forEach((s, i) => { s.rotation.z = Math.sin(p * 1.6 - i * 0.5) * 0.18; s.rotation.x = -0.12; });
    u.head.rotation.y = Math.sin(p * 0.4) * 0.3;
    if (u.body) u.body.scale.y = 0.86 + Math.sin(p * 1.8) * 0.012;
  } else if (u.kind === "dog") {
    u.tail[0].rotation.z = Math.sin(p * 12) * 0.5;
    u.head.rotation.z = Math.sin(p * 0.8) * 0.12;
    if (u.ears) u.ears.forEach((e, i) => { e.rotation.z = Math.sin(p * 3 + i) * 0.1; });
  }
}

export function runCycle(a, t, speed = 14) {
  const u = a.userData; if (!u || !u.legs) return;
  u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * speed + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7; });
  if (u.kind === "human" && u.arms) { u.arms[0].rotation.x = Math.sin(t * speed) * 0.8; u.arms[1].rotation.x = -Math.sin(t * speed) * 0.8; }
}

// expresión de la boca: "happy" sonrisa, "sad" boca para abajo
export function expr(a, mode) {
  const m = a.userData && a.userData.mouth; if (!m) return;
  if (mode === "sad") { m.rotation.z = 0; m.position.y = -0.16; }
  else { m.rotation.z = Math.PI; m.position.y = -0.12; }
}
