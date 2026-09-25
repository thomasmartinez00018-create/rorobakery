// Mundo 3D: dioramas de lugares reales, cinemáticas, rueda de reconocimiento y retratos.
import * as THREE from "three";
import * as A from "./actors.js";
import * as FX from "./fx.js";
import { Pipeline } from "./post.js";

const gsap = window.gsap;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------------- texturas ---------------- */
const tex = A.canvasTex;
const T = {};
function tiles(key, base, line, n = 8, jitter = 0) {
  return T[key] || (T[key] = (() => {
    const t = tex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      if (jitter) for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * jitter})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      g.strokeStyle = line; g.lineWidth = 3;
      for (let i = 0; i <= n; i++) { const p = i * w / n; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })());
}
function stripes(key, cols, horizontal = false, n = 8) {
  return T[key] || (T[key] = tex(128, 128, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; if (horizontal) g.fillRect(0, i * h / n, w, h / n + 1); else g.fillRect(i * w / n, 0, w / n + 1, h); }
  }));
}
function speckle(key, base, spot) {
  return T[key] || (T[key] = tex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = spot; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 10, 1 + Math.random() * 3, 1.4, 0, Math.PI * 2); g.fill(); }
  }));
}
function leaves() {
  return T.leaves || (T.leaves = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#eef0e6"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI;
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = i % 2 ? "#7da27a" : "#a9c7a2";
      g.beginPath(); g.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }));
}
function stained() {
  return T.stained || (T.stained = tex(256, 128, (g, w, h) => {
    g.fillStyle = "#e9f0ee"; g.fillRect(0, 0, w, h);
    const cols = ["#3d7ea6", "#5aa5a0", "#2f5d7c", "#8cc0c7", "#46857d"];
    for (let i = 0; i < 70; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 14, 8 + Math.random() * 10, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "#f5f5f5"; g.lineWidth = 6;
    for (let x = 0; x <= w; x += w / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    g.strokeRect(3, 3, w - 6, h - 6);
  }));
}
function signTex(text, o = {}) {
  const w = o.w || 512, h = o.h || 128;
  return tex(w, h, (g) => {
    g.fillStyle = o.bg || "#1f4e99"; g.fillRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16); }
    g.fillStyle = o.fg || "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = o.font || `${Math.round(h * 0.66)}px "Jersey 10", Karla, Arial, sans-serif`;
    const lines = String(text).split("\n");
    lines.forEach((ln, i) => g.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * h * 0.42));
  });
}
function flagTex() {
  return T.flag || (T.flag = tex(192, 128, (g, w, h) => {
    g.fillStyle = "#74acdf"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.fillRect(0, h / 3, w, h / 3);
    g.fillStyle = "#f6b40e"; g.beginPath(); g.arc(w / 2, h / 2, 14, 0, Math.PI * 2); g.fill();
  }));
}
function fieldTex() {
  return T.field || (T.field = tex(512, 320, (g, w, h) => {
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#3f9a3a" : "#48a843"; g.fillRect(i * w / 10, 0, w / 10 + 1, h); }
    g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(10, 10, w - 20, h - 20);
    g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 10); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 42, 0, Math.PI * 2); g.stroke();
    g.strokeRect(10, h / 2 - 70, 70, 140); g.strokeRect(w - 80, h / 2 - 70, 70, 140);
  }));
}
function heightTex() {
  return T.height || (T.height = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#26324a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(230,236,245,.5)"; g.fillStyle = "rgba(242,177,52,.95)"; g.font = "700 30px 'Courier New', monospace";
    for (let cm = 100; cm <= 200; cm += 10) {
      const y = h - (cm / 88 / 2.6) * h;
      g.lineWidth = cm % 50 === 0 ? 6 : 2;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      if (cm % 20 === 0) { g.fillText((cm / 100).toFixed(1).replace(".", ",") + " m", 10, y - 8); g.fillText((cm / 100).toFixed(1).replace(".", ",") + " m", w - 110, y - 8); }
    }
  }));
}

/* ---------------- kit de construcción ---------------- */
function kit(root) {
  // sin coordenadas, respeta la posición que ya trae el objeto
  const put = (m, x, y, z, ry) => { if (x !== undefined) m.position.set(x, y || 0, z || 0); if (ry !== undefined) m.rotation.y = ry; root.add(m); return m; };
  const K = {
    put,
    box: (w, h, d, c, x, y, z, o) => put(A.mesh(new THREE.BoxGeometry(w, h, d), c, o), x, y, z),
    cyl: (rt, rb, h, c, x, y, z, o, seg = 18) => put(A.mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, o), x, y, z),
    cone: (r, h, c, x, y, z, o, seg = 8) => put(A.mesh(new THREE.ConeGeometry(r, h, seg), c, o), x, y, z),
    sph: (r, c, x, y, z, o) => put(A.mesh(new THREE.SphereGeometry(r, 16, 12), c, o), x, y, z),
    tbox: (w, h, d, map, x, y, z, o = {}) => {
      const m = A.toon("#ffffff", { map });
      return put(A.mesh(new THREE.BoxGeometry(w, h, d), m, o), x, y, z);
    },
    sign: (text, w, h, o, x, y, z, ry = 0) => {
      const g = new THREE.Group();
      const back = A.mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.06), o.frame || "#222");
      g.add(back);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTex(text, o) }));
      face.position.z = 0.035; g.add(face);
      return put(g, x, y, z, ry);
    },
    base: (w, d, top, side, map, rep = 4) => {
      let topMat = A.toon(top);
      if (map) { const m = map.clone(); m.needsUpdate = true; m.repeat.set(rep, rep * d / w); m.wrapS = m.wrapT = THREE.RepeatWrapping; topMat = A.toon("#ffffff", { map: m }); }
      const sideMat = A.toon(side);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
      b.receiveShadow = true; b.position.y = -0.3; root.add(b);
      const ol = new THREE.Mesh(b.geometry, A.OUTLINE); ol.scale.set(1.006, 1.03, 1.008); b.add(ol);
      return b;
    },
    tree: (x, z, s = 1, leaf = "#3f8f4a") => {
      K.cyl(0.08 * s, 0.11 * s, 0.9 * s, "#6b4a2f", x, 0.45 * s, z);
      K.sph(0.55 * s, leaf, x, 1.2 * s, z);
      K.sph(0.4 * s, leaf, x + 0.25 * s, 1.5 * s, z + 0.1);
    },
    lamp: (x, z, glow = true) => {
      K.cyl(0.04, 0.05, 2.2, "#2d2d33", x, 1.1, z);
      K.sph(0.13, glow ? A.toon("#ffe7a8", { emissive: "#ffd66b", emissiveIntensity: 1.2 }) : "#ddd", x, 2.25, z, { outline: false });
    }
  };
  return K;
}

/* ---------------- lugares ---------------- */
const PLACES = {
  casa(K, W) {
    K.base(10, 7, "#ffffff", "#8a7d6b", tiles("floorW", "#f2f0ea", "#d6d2c8", 6));
    K.tbox(10, 4, 0.2, speckle("wallTan", "#b89a6a", "#e8dcc2"), 0, 2, -3.4);
    const shape = new THREE.Shape(); shape.moveTo(-5, 0); shape.lineTo(5, 0); shape.lineTo(0, 2.2); shape.lineTo(-5, 0);
    const gable = A.mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }), "#d8d3ca"); K.put(gable, 0, 4, -3.5);
    [-1, 1].forEach(s => { const bm = K.box(5.6, 0.22, 0.3, "#c9a36b", s * 2.5, 5.05, -3.15); bm.rotation.z = -s * 0.41; });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: stained() })); K.put(win, 0, 4.4, -3.28);
    K.box(2.3, 0.08, 0.1, "#ffffff", 0, 3.82, -3.26);
    // sillón verde con manta
    K.box(2.8, 0.45, 1.05, "#7cb32b", 2.6, 0.32, -1.6); K.box(2.8, 0.8, 0.3, "#72a827", 2.6, 0.75, -2.2);
    [-1, 1].forEach(s => K.box(0.3, 0.65, 1.05, "#72a827", 2.6 + s * 1.4, 0.45, -1.6));
    K.tbox(1.9, 0.07, 1.0, stripes("manta", ["#1b1d24", "#e9e2cf", "#8e939c", "#e9e2cf"], false, 10), 2.8, 0.58, -1.6, { outline: false });
    // heladera, estante, mesa
    K.box(0.85, 2.0, 0.7, "#b9bec6", -3.9, 1.0, -2.8); K.box(0.04, 0.5, 0.05, "#666", -3.55, 1.4, -2.43);
    K.box(1.2, 0.05, 0.45, "#9aa0a8", -2.6, 0.5, -3.0); K.box(1.2, 0.05, 0.45, "#9aa0a8", -2.6, 1.1, -3.0); K.box(1.2, 0.05, 0.45, "#9aa0a8", -2.6, 1.7, -3.0);
    ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#2ecc71", "#e67e22"].forEach((c, i) => K.box(0.18, 0.28, 0.18, c, -3.05 + i * 0.18, 0.67 + (i % 3) * 0.6, -3.0, { outline: false }));
    K.box(1.6, 0.08, 1.0, "#a7abb2", -1.6, 0.9, -1.9); [[-2.3, -2.3], [-0.9, -2.3], [-2.3, -1.5], [-0.9, -1.5]].forEach(([x, z]) => K.box(0.07, 0.86, 0.07, "#7a4a2a", x, 0.43, z));
    K.box(0.5, 1.2, 0.08, "#8a5230", -2.7, 0.6, -1.3); K.box(0.52, 0.6, 0.1, "#e36ea6", -2.7, 1.0, -1.25);
    // alacena abierta (la escena del crimen)
    K.box(1.2, 0.8, 0.4, "#c79a60", -1.4, 2.6, -3.1); const door = K.box(0.58, 0.76, 0.04, "#b98a50", -2.1, 2.6, -2.8); door.rotation.y = 1.1;
    W.evidence = V(-1.4, 2.6, -2.9);
    return { sky: "#27324d", fog: "#27324d", hemi: ["#fff1dc", "#4a3b2c"], sun: "#ffe9c9", sunI: 1.9, pets: [], night: false };
  },
  abuela(K, W) {
    K.base(10, 7, "#9c3b30", "#6a2a22", speckle("redfloor", "#a1433a", "rgba(60,20,15,.35)"), 2);
    K.tbox(5.5, 3.2, 0.2, tiles("terra", "#c98a6d", "#a8654f", 6), -2.25, 1.6, -3.4);
    K.box(4.5, 3.2, 0.2, "#e9e4dc", 2.75, 1.6, -3.4);
    K.box(1.6, 0.9, 0.6, "#6a6a6f", -3.2, 1.15, -3.0); K.box(1.6, 0.05, 0.6, "#2b2b2b", -3.2, 1.62, -3.0);
    [-3.8, -2.6].forEach(x => K.box(0.06, 0.8, 0.06, "#777", x, 0.4, -2.8));
    K.tbox(2.4, 0.08, 1.4, leaves(), 1.0, 0.95, -1.4); [[0, -0.8], [2, -0.8], [0, -2], [2, -2]].forEach(([x, z]) => K.box(0.08, 0.9, 0.08, "#8b6b4a", x, 0.45, z));
    K.cyl(0.35, 0.3, 0.05, "#f5f5f5", 1.3, 1.02, -1.3); K.sph(0.05, "#8c5a2b", 1.35, 1.07, -1.25);
    W.evidence = V(1.3, 1.1, -1.3);
    for (let i = 0; i < 4; i++) K.box(1.6, 0.3 * (i + 1), 0.55, "#b7b1a6", 3.8, 0.15 * (i + 1), -1.0 - i * 0.55);
    K.cyl(0.2, 0.15, 0.08, "#c7ccd2", 3.3, 0.34, -1.0);
    K.cyl(0.25, 0.2, 0.4, "#b5552e", -4.2, 0.2, 0.2); K.sph(0.35, "#3e8a45", -4.2, 0.6, 0.2);
    const luz = A.luz(); luz.position.set(3.9, 0.6, -1.55); luz.rotation.y = -0.4;
    const cor = A.corbata(); cor.position.set(-3.1, 0, 1.2); cor.rotation.y = 0.6;
    const lin = A.lindaCanichita(); lin.position.set(3.0, 0, 1.6); lin.rotation.y = -0.5;
    return { sky: "#f0c38a", fog: "#f0c38a", hemi: ["#fff4e0", "#7a3b2b"], sun: "#fff0d0", sunI: 2.3, pets: [luz, cor, lin] };
  },
  heladeria(K, W) {
    K.base(10, 7, "#b8bcc2", "#6f7278", tiles("vereda", "#c3c6cb", "#9da1a8", 10), 2);
    K.box(9, 3.4, 0.25, "#f4efe6", 0, 1.7, -3.2);
    K.tbox(9.2, 0.25, 1.4, stripes("awning", ["#f28fb0", "#fff4f7"], false, 14), 0, 3.3, -2.5).rotation.x = 0.35;
    K.sign("HELADOS · DESDE 1980", 4.2, 0.6, { bg: "#6b3b2a", fg: "#ffe9c6", border: "#e0b36a" }, 0, 2.7, -3.05);
    K.box(4.2, 1.0, 0.9, "#f7f2ea", 0, 0.5, -1.9);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.45, 0.8), new THREE.MeshToonMaterial({ color: "#cfe9f5", transparent: true, opacity: 0.35 })); K.put(glass, 0, 1.23, -1.9);
    ["#c78a3e", "#5a3622", "#f19ab4", "#fff29a", "#9ad18b", "#c78a3e"].forEach((c, i) => K.cyl(0.25, 0.25, 0.2, i === 0 ? "#3a3a3a" : c, -1.5 + i * 0.6, 1.08, -1.9));
    W.evidence = V(-1.5, 1.2, -1.9);
    K.cyl(0.05, 0.05, 2.6, "#2d2d33", -4.2, 1.3, 1.6);
    K.sign("BALBÍN", 1.3, 0.3, { bg: "#1f4e99" }, -4.2, 2.45, 1.6, 0.0);
    K.sign("PAUNERO", 1.3, 0.3, { bg: "#1f4e99" }, -4.2, 2.1, 1.6, Math.PI / 2);
    [-3, 3].forEach(x => { K.cyl(0.3, 0.3, 0.06, "#d24d57", x, 0.75, -0.4); K.cyl(0.04, 0.04, 0.75, "#888", x, 0.37, -0.4); });
    K.tree(4.2, -1.2, 0.9);
    return { sky: "#8fd0e8", fog: "#8fd0e8", hemi: ["#ffffff", "#8a7a6a"], sun: "#fff6e6", sunI: 2.6, pets: [] };
  },
  observatorio(K, W) {
    K.base(10, 7, "#2f5d3a", "#20331f", null);
    K.cyl(1.7, 1.8, 1.8, "#e8e6e1", 0, 0.9, -1.8, {}, 28);
    const dome = A.mesh(new THREE.SphereGeometry(1.75, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), "#c7ccd4"); K.put(dome, 0, 1.8, -1.8);
    K.box(0.5, 1.5, 0.3, "#1a2238", 0, 2.6, -0.3).rotation.x = -0.6;
    const scope = K.cyl(0.14, 0.18, 1.7, "#39414f", 0.2, 3.1, -0.9); scope.rotation.x = -0.9;
    W.evidence = V(0.2, 3.1, -0.9);
    K.box(2.4, 1.3, 1.4, "#dcd8cf", 3.2, 0.65, -2.2); K.box(0.6, 1.0, 0.05, "#5a3d2a", 3.2, 0.5, -1.48);
    K.lamp(-3.5, 1.2); K.lamp(3.8, 1.0); K.tree(-4.1, -2.4, 1.1, "#2f6b3a");
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); K.put(moon, -9, 9, -18);
    return { sky: "#0b1430", fog: "#0b1430", hemi: ["#8fa6ff", "#10140e"], sun: "#b8c8ff", sunI: 1.2, pets: [], night: true };
  },
  estacion(K, W) {
    K.base(10, 7, "#9aa0a6", "#55595e", tiles("anden", "#a7acb2", "#8c9197", 12), 3);
    K.box(10, 0.06, 0.25, "#f2c230", 0, 0.03, -0.9, { outline: false });
    K.box(10, 0.2, 2.0, "#4a4038", 0, -0.1, -2.4, { outline: false });
    for (let i = -9; i <= 9; i++) K.box(0.18, 0.06, 1.7, "#6d5842", i * 0.52, 0.02, -2.4, { outline: false });
    [-2.9, -1.9].forEach(z => K.box(10, 0.08, 0.08, "#9aa3ad", 0, 0.08, z, { outline: false }));
    const train = new THREE.Group(); K.put(train, 0, 0, -2.4);
    const car = A.mesh(new THREE.BoxGeometry(7.5, 1.7, 1.3), "#dfe3e8"); car.position.y = 1.0; train.add(car);
    const band = A.mesh(new THREE.BoxGeometry(7.52, 0.3, 1.32), "#1f4e99", { outline: false }); band.position.y = 0.45; train.add(band);
    const wins = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.55), new THREE.MeshBasicMaterial({ map: stripes("wins", ["#23324a", "#dfe3e8"], false, 16) })); wins.position.set(0, 1.25, 0.66); train.add(wins);
    W.train = train;
    K.sign("LOS POLVORINES", 3.6, 0.55, { bg: "#1f4e99" }, 1.2, 2.4, -0.6);
    [-0.5, 2.9].forEach(x => K.cyl(0.04, 0.04, 2.2, "#2d2d33", x, 1.1, -0.62));
    K.box(1.8, 0.1, 0.5, "#8a5a33", -2.8, 0.5, -0.2); [-3.5, -2.1].forEach(x => K.box(0.08, 0.5, 0.4, "#333", x, 0.25, -0.2));
    K.cyl(0.04, 0.04, 2.5, "#2d2d33", 4.0, 1.25, 0.2); K.box(0.5, 0.35, 0.08, "#2d2d33", 4.0, 2.4, 0.2);
    W.evidence = V(4.0, 2.4, 0.2);
    K.box(1.4, 2.0, 1.2, "#e8dcc6", -4.2, 1.0, 1.4); K.sign("BOLETERÍA", 1.2, 0.3, { bg: "#6b3b2a" }, -4.2, 1.7, 2.02);
    return { sky: "#e9a36a", fog: "#e9a36a", hemi: ["#ffe7cc", "#4a3d36"], sun: "#ffd2a0", sunI: 2.2, pets: [], trainIntro: true };
  },
  rotonda(K, W) {
    K.base(10, 7, "#5d9a48", "#3c5f2c", null);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 3.2, 48), A.toon("#3d3f45")); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.01, -0.8); ring.receiveShadow = true; K.put(ring, 0, 0.01, -0.8).rotation.x = -Math.PI / 2;
    const dash = new THREE.Mesh(new THREE.RingGeometry(2.53, 2.57, 48), new THREE.MeshBasicMaterial({ color: 0xf5f5f5 })); K.put(dash, 0, 0.02, -0.8).rotation.x = -Math.PI / 2;
    K.cyl(1.85, 1.85, 0.12, "#6fb25a", 0, 0.06, -0.8, {}, 40);
    K.cyl(0.04, 0.04, 3.2, "#dcdcdc", 0, 1.6, -0.8);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide })); K.put(flag, 0.47, 2.85, -0.8); W.flag = flag;
    K.box(0.9, 0.5, 0.9, "#cfcac0", 0, 0.37, -0.8);
    const bus = new THREE.Group(); const bb = A.mesh(new THREE.BoxGeometry(1.8, 0.9, 0.75), "#e8e8e8"); bb.position.y = 0.6; bus.add(bb);
    const stripe = A.mesh(new THREE.BoxGeometry(1.82, 0.22, 0.77), "#c0392b", { outline: false }); stripe.position.y = 0.45; bus.add(stripe);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), new THREE.MeshBasicMaterial({ map: signTex("315", { bg: "#111", fg: "#ffcf3a", w: 256, h: 112 }) })); num.position.set(0.91, 0.85, 0); num.rotation.y = Math.PI / 2; bus.add(num);
    [[-0.6, 0.38], [0.6, 0.38], [-0.6, -0.38], [0.6, -0.38]].forEach(([x, z]) => { const w = A.mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12), "#1a1a1a"); w.rotation.x = Math.PI / 2; w.position.set(x, 0.17, z); bus.add(w); });
    K.put(bus); W.bus = bus;
    K.cyl(0.04, 0.04, 2.1, "#2d2d33", 3.8, 1.05, 1.6); K.sign("PARADA\n315 · 341 · 440", 1.0, 0.55, { bg: "#1f4e99", h: 180, w: 330 }, 3.8, 2.0, 1.6);
    W.evidence = V(3.8, 2.0, 1.6);
    K.tree(-4.2, -2.6, 1.1); K.tree(4.2, -2.7, 1.0); K.tree(-4.4, 1.8, 0.8);
    return { sky: "#f4b07a", fog: "#f4b07a", hemi: ["#fff0dd", "#3c5f2c"], sun: "#ffd6a8", sunI: 2.2, pets: [] };
  },
  plaza(K, W) {
    K.base(10, 7, "#c8bba6", "#7b6e5a", tiles("adoquin", "#cdbfa8", "#a99a82", 14, 0.08), 2);
    K.box(3.4, 3.4, 1.0, "#e9e1d1", 0, 1.7, -2.9);
    [-1, 1].forEach(s => { K.box(1.0, 4.4, 1.0, "#e2d8c5", s * 2.2, 2.2, -2.9); K.cone(0.72, 1.4, "#6d7a8a", s * 2.2, 5.1, -2.9, {}, 4); });
    K.cone(1.9, 1.2, "#e2d8c5", 0, 4.0, -2.9, {}, 3).rotation.y = Math.PI / 6;
    const rose = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ map: stained() })); K.put(rose, 0, 2.6, -2.38);
    K.box(0.9, 1.4, 0.05, "#5a3d2a", 0, 0.7, -2.38);
    const stall = (x, z, cols) => {
      K.box(1.4, 0.08, 0.8, "#8a5a33", x, 0.8, z); [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(([dx, dz]) => K.box(0.05, 1.6, 0.05, "#444", x + dx, 0.8, z + dz));
      K.tbox(1.6, 0.06, 1.0, stripes("aw" + cols.join(), cols, false, 8), x, 1.65, z).rotation.x = 0.1;
      for (let i = 0; i < 3; i++) K.cyl(0.08, 0.07, 0.16, ["#c0c7cf", "#8a5a33", "#6c8f4e"][i], x - 0.4 + i * 0.4, 0.92, z);
    };
    stall(-3.0, -0.4, ["#2e86c1", "#f5f5f5"]); stall(3.0, -0.4, ["#e67e22", "#f5f5f5"]); stall(3.4, 1.6, ["#27ae60", "#f5f5f5"]);
    W.evidence = V(-3.0, 1.0, -0.4);
    K.tree(-4.2, -2.4, 1.1); K.tree(4.3, -2.5, 1.0);
    return { sky: "#9ed3f0", fog: "#9ed3f0", hemi: ["#ffffff", "#7b6e5a"], sun: "#fff4df", sunI: 2.5, pets: [] };
  },
  cancha(K, W) {
    K.base(10, 7, "#48a843", "#2f6b2c", null);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), A.toon("#ffffff", { map: fieldTex() })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; K.put(f, 0, 0.01, 0.6).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) K.tbox(10, 0.5, 0.6, stripes("tribuna", ["#1d8a3a", "#f5f5f5"], false, 16), 0, 0.25 + i * 0.5, -2.0 - i * 0.45);
    K.sign("CLUB ATLÉTICO SAN MIGUEL", 5, 0.5, { bg: "#1d8a3a", border: "#fff" }, 0, 2.6, -3.0);
    [-4.4, 4.4].forEach(x => { K.box(0.06, 0.9, 0.06, "#fff", x, 0.45, 0.0); K.box(0.06, 0.9, 0.06, "#fff", x, 0.45, 1.2); K.box(0.06, 0.06, 1.26, "#fff", x, 0.9, 0.6); });
    K.cyl(0.04, 0.04, 3.0, "#dcdcdc", 3.4, 1.5, -1.2);
    W.evidence = V(3.4, 2.8, -1.2);
    K.lamp(-4.6, -1.0); K.lamp(4.6, -1.0);
    return { sky: "#1b2a4a", fog: "#1b2a4a", hemi: ["#dfe8ff", "#1f2f1c"], sun: "#e6eeff", sunI: 1.8, pets: [], night: true };
  },
  mall(K, W) {
    K.base(10, 7, "#8d9096", "#4f5257", tiles("parking", "#8f9298", "#b9bcc4", 5), 2);
    K.box(4.2, 2.6, 1.4, "#2d3142", -2.2, 1.3, -2.6); K.sign("CINE", 1.6, 0.6, { bg: "#c0392b", fg: "#fff4d6", border: "#ffcf3a" }, -2.2, 2.2, -1.88);
    K.box(3.6, 2.0, 1.4, "#e8e2d6", 2.6, 1.0, -2.6); K.sign("PATIO DE COMIDAS", 2.6, 0.4, { bg: "#16a085" }, 2.6, 1.7, -1.88);
    W.evidence = V(-2.2, 1.2, -1.9);
    for (let i = 0; i < 12; i++) K.sph(0.06, A.toon("#fff1b8", { emissive: "#ffd66b", emissiveIntensity: 1.3 }), -4.5 + i * 0.82, 2.9 - Math.sin(i / 11 * Math.PI) * 0.35, -1.2, { outline: false });
    const palm = (x, z) => { K.cyl(0.07, 0.1, 1.8, "#8b6b4a", x, 0.9, z); for (let i = 0; i < 6; i++) { const lf = K.box(0.9, 0.04, 0.22, "#3f8f4a", x + Math.cos(i) * 0.35, 1.85, z + Math.sin(i) * 0.35); lf.rotation.y = -i; lf.rotation.z = -0.35; } };
    palm(-4.3, 1.2); palm(4.3, 1.4);
    return { sky: "#34264d", fog: "#34264d", hemi: ["#ffe6f2", "#2a2230"], sun: "#ffd9f0", sunI: 1.9, pets: [], night: true };
  },
  gym(K, W) {
    K.base(10, 7, "#2b2b30", "#18181c", tiles("goma", "#303036", "#26262b", 8), 2);
    K.box(10, 3.6, 0.2, "#3a3f4a", 0, 1.8, -3.4);
    K.sign("TEAM BIELLI", 3.6, 0.7, { bg: "#b3121b", fg: "#ffffff", border: "#111" }, 0, 2.9, -3.28);
    // ring
    K.box(4.2, 0.4, 3.0, "#e8e8e8", 0, 0.2, -1.5); K.box(4.1, 0.02, 2.9, "#1f5fbf", 0, 0.41, -1.5, { outline: false });
    [[-2, -0.1], [2, -0.1], [-2, -2.9], [2, -2.9]].forEach(([x, z], i) => K.cyl(0.07, 0.07, 1.3, i % 2 ? "#b3121b" : "#1f5fbf", x, 1.05, z));
    [0.75, 1.05, 1.35].forEach((y, i) => {
      const col = ["#ffffff", "#b3121b", "#ffffff"][i];
      K.box(4.0, 0.035, 0.035, col, 0, y, -0.1, { outline: false }); K.box(4.0, 0.035, 0.035, col, 0, y, -2.9, { outline: false });
      K.box(0.035, 0.035, 2.8, col, -2, y, -1.5, { outline: false }); K.box(0.035, 0.035, 2.8, col, 2, y, -1.5, { outline: false });
    });
    // bolsas y guantes
    [-3.9, 3.9].forEach((x, i) => { K.box(0.05, 0.9, 0.05, "#555", x, 3.0, -1.2); K.cyl(0.32, 0.32, 1.3, i ? "#b3121b" : "#1b1b1f", x, 1.9, -1.2); });
    [-0.3, 0.3].forEach(x => K.sph(0.16, "#b3121b", x - 3.0, 0.95, 1.6));
    K.box(1.4, 0.8, 0.5, "#555a64", -3.0, 0.4, 1.6);
    // gancho vacío donde estaba el cinturón
    K.box(1.6, 0.06, 0.06, "#c9a227", 0, 2.25, -3.25);
    W.evidence = V(0, 2.25, -3.1);
    return { sky: "#1c1d24", fog: "#1c1d24", hemi: ["#e8ecff", "#1a1a1f"], sun: "#ffffff", sunI: 2.1, pets: [] };
  },
  bakery(K, W) {
    K.base(10, 7, "#f6efe8", "#b98c7a", tiles("bakefloor", "#f7eee6", "#e3cfc3", 8), 2);
    K.tbox(10, 3.6, 0.2, stripes("bakewall", ["#f6d7df", "#fbeaee"], false, 20), 0, 1.8, -3.4);
    K.sign("Roro's Bakery", 3.8, 0.8, { bg: "#6b2d45", fg: "#ffe6ee", border: "#e8b7c6", font: "italic 700 64px Georgia, serif" }, 0, 2.9, -3.28);
    K.box(5.2, 1.0, 1.0, "#ffffff", 0, 0.5, -1.7); K.box(5.3, 0.08, 1.1, "#e8b7c6", 0, 1.04, -1.7);
    const cake = (x, c1, c2, h = 0.34, r = 0.36) => { K.cyl(0.42, 0.42, 0.04, "#f2f2f2", x, 1.1, -1.7); K.cyl(r, r, h, c1, x, 1.12 + h / 2, -1.7); K.cyl(r * 0.9, r * 0.9, 0.06, c2, x, 1.15 + h, -1.7, { outline: false }); };
    cake(-1.8, "#4a2a1c", "#6b3b28");        // torta de chocolate
    K.cyl(0.42, 0.42, 0.04, "#f2f2f2", -0.6, 1.1, -1.7); // plato vacío: la torta lila
    cake(0.6, "#f4e27a", "#fff6c4", 0.18, 0.4); // tarta de limón
    cake(1.8, "#e2b56e", "#f3d9a4", 0.3, 0.34); // bizcochuelo
    W.evidence = V(-0.6, 1.2, -1.7);
    K.sph(0.05, "#c9a0dc", -0.5, 1.15, -1.55, { outline: false }); K.sph(0.04, "#c9a0dc", -0.72, 1.14, -1.6, { outline: false });
    [-3.4, 3.4].forEach(x => { K.box(1.0, 0.06, 0.6, "#ffffff", x, 0.78, 0.4); K.cyl(0.06, 0.06, 0.75, "#caa", x, 0.38, 0.4); });
    K.box(0.9, 1.8, 0.6, "#dfe3e8", -4.1, 0.9, -2.6); K.box(0.8, 0.8, 0.05, "#1f2330", -4.1, 1.2, -2.28);
    return { sky: "#f7c9d6", fog: "#f7c9d6", hemi: ["#fff6f8", "#8a5a66"], sun: "#fff4f0", sunI: 2.4, pets: [] };
  }
};

const TAUNTS = [
  "Miau. Ni con el 315 me alcanzan.",
  "¿Otra vez ustedes? Juli, mirá cómo pierden.",
  "Yo no fui. Pero sé quién fue. Y no les voy a decir.",
  "No me confundan con la otra Linda. Yo soy la mala.",
  "Tengo siete vidas y ustedes ocho minutos.",
  "Si Romero se escapa, no es mi culpa. Bueno, un poco sí."
];


/* ---------------- ambientación por lugar ---------------- */
function warmLight(K, x, y, z, color = "#ffd28a", intensity = 7, dist = 7) {
  const l = new THREE.PointLight(color, intensity, dist, 1.6); l.position.set(x, y, z); K.put(l); return l;
}
function glowMat(color, k = 1.6) { return A.toon(color, { emissive: color, emissiveIntensity: k }); }
function hangLamp(K, W, x, z, y = 3.6, beamH = 3.4) {
  K.cyl(0.012, 0.012, 1.2, "#222", x, y + 0.6, z, { outline: false });
  K.cone(0.28, 0.24, "#2d3340", x, y, z, {}, 12);
  K.sph(0.09, glowMat("#fff0c0", 2.2), x, y - 0.12, z, { outline: false });
  const b = FX.beam({ from: V(x, y - 0.12, z), h: beamH, r: 0.9, opacity: 0.045 }); K.put(b.obj); W.amb.push(b);
  return warmLight(K, x, y - 0.3, z, "#ffd9a0", 2.6, 5);
}
function flickerLight(W, light, base, rate = 1) {
  W.amb.push({ update(dt, t) { light.intensity = base * (Math.sin(t * 13 * rate) > 0.97 || Math.sin(t * 7.3 * rate) > 0.985 ? 0.25 : 1); } });
}

const AMB = {
  casa(K, W) {
    hangLamp(K, W, 0.3, -0.4, 3.5);
    K.tbox(3.4, 0.02, 1.9, stripes("rug", ["#7a2e2e", "#c9a36b", "#2e4a6b", "#c9a36b"], true, 12), 0.1, 0.012, 0.9, { outline: false, shadow: false });
    K.cyl(0.065, 0.05, 0.12, "#7a4a2a", -1.3, 1.0, -1.7);
    const bomb = K.cyl(0.01, 0.01, 0.2, "#d6d6d6", -1.27, 1.1, -1.7, { outline: false }); bomb.rotation.z = -0.3;
    K.cyl(0.08, 0.08, 0.46, "#f4f4f4", -1.85, 1.17, -1.85); K.cyl(0.05, 0.06, 0.08, "#7fc6c1", -1.85, 1.44, -1.85);
    K.cyl(0.22, 0.17, 0.4, "#b5552e", 4.3, 0.2, 1.0); [0, 1, 2, 3, 4].forEach(i => { const l = K.cone(0.1, 0.8, "#3f8f4a", 4.3 + Math.cos(i * 1.3) * 0.12, 0.75, 1.0 + Math.sin(i * 1.3) * 0.12, {}, 5); l.rotation.z = Math.cos(i * 1.3) * 0.4; l.rotation.x = Math.sin(i * 1.3) * 0.4; });
    const win = FX.beam({ from: V(0, 4.3, -3.1), h: 4.4, r: 1.1, tilt: [0.62, 0], color: "#bfe6ff", opacity: 0.035 }); K.put(win.obj); W.amb.push(win);
    W.amb.push(FX.dust({ color: "#fff1d0" }));
    return { sound: "indoor" };
  },
  abuela(K, W) {
    [-4.3, -0.6].forEach(x => K.cyl(0.03, 0.03, 2.4, "#777", x, 1.2, 0.2));
    K.box(3.7, 0.015, 0.015, "#ddd", -2.45, 2.35, 0.2, { outline: false });
    const clothes = [["#e36ea6", -3.7], ["#3d7ea6", -2.8], ["#f1c40f", -1.8], ["#ffffff", -1.2]].map(([c, x]) => { const g = new THREE.Group(); g.position.set(x, 2.35, 0.2); const m = A.mesh(new THREE.BoxGeometry(0.45, 0.55, 0.03), c); m.position.y = -0.28; g.add(m); K.put(g, x, 2.35, 0.2); return g; });
    W.anims.push((dt, t) => clothes.forEach((g, i) => { g.rotation.x = Math.sin(t * 1.7 + i) * 0.18; }));
    const sb = FX.beam({ from: V(3.5, 5.5, -2.5), h: 6, r: 1.4, tilt: [0.3, 0.5], color: "#fff0c8", opacity: 0.04 }); K.put(sb.obj); W.amb.push(sb);
    W.amb.push(FX.falling({ n: 16 }), FX.dust({ n: 60, color: "#fff4d6" }));
    return { sound: "birds" };
  },
  heladeria(K, W) {
    const sign = K.sign("ABIERTO", 1.3, 0.35, { bg: "#140a1a", fg: "#ff5fa2", border: "#ff5fa2" }, 2.8, 2.0, -3.05);
    sign.children[1].material = new THREE.MeshBasicMaterial({ map: sign.children[1].material.map, color: new THREE.Color(1.6, 1.6, 1.6) });
    [[-3.6, 1.2], [-3.2, 1.6], [3.3, 2.3], [2.6, 2.7], [-1.0, 3.0]].forEach(() => {});
    const pg = FX.pigeons([[-3.6, 1.2], [-3.1, 1.7], [3.2, 2.4], [2.5, 2.9], [-0.9, 3.0]]); K.put(pg.obj); W.amb.push(pg); W.pigeons = pg;
    W.amb.push(FX.falling({ n: 10 }));
    return { sound: "city", rainOk: true };
  },
  observatorio(K, W) {
    W.amb.push(FX.stars(), FX.fireflies({ n: 34 }));
    W.place.children.forEach(o => { if (o.geometry && o.geometry.type === "SphereGeometry" && o.position.y > 1.7 && o.position.y < 1.9) W.dome = o; });
    W.anims.push((dt, t) => { if (W.dome) W.dome.rotation.y = Math.sin(t * 0.15) * 0.6; });
    [[-3.5, 1.2], [3.8, 1.0]].forEach(([x, z]) => { const l = warmLight(K, x, 2.1, z, "#ffd98a", 6, 5); flickerLight(W, l, 6, x > 0 ? 1.3 : 1); });
    return { sound: "night" };
  },
  estacion(K, W) {
    for (let x = -4.5; x <= 4.5; x += 3) { K.cyl(0.035, 0.035, 3.6, "#3a3a40", x, 1.8, -3.35); }
    K.box(10, 0.012, 0.012, "#222", 0, 3.4, -2.4, { outline: false }); K.box(10, 0.012, 0.012, "#222", 0, 3.25, -2.4, { outline: false });
    const pg = FX.pigeons([[-1.8, 0.4], [-1.3, 0.9], [2.2, 1.2], [3.0, 0.6]]); K.put(pg.obj); W.amb.push(pg); W.pigeons = pg;
    W.amb.push(FX.dust({ n: 70, color: "#ffd6a0", box: [-4.5, 4.5, 0.3, 3, -1, 3] }));
    return { sound: "city", rainOk: true, horn: true };
  },
  rotonda(K, W) {
    [[-3.6, 2.4], [3.2, -2.9]].forEach(([x, z]) => { K.lamp(x, z); warmLight(K, x, 2.2, z, "#ffd28a", 4, 5); });
    K.box(0.9, 1.0, 0.7, "#e9e2d0", -3.8, 0.5, -2.6); K.sign("KIOSCO", 0.8, 0.22, { bg: "#c0392b" }, -3.8, 1.1, -2.24);
    W.amb.push(FX.falling({ n: 22, colors: ["#d98c3a", "#e8b04a", "#a86b32"] }));
    return { sound: "city", rainOk: true };
  },
  plaza(K, W) {
    const bell = new THREE.Group(); const bm = A.mesh(new THREE.ConeGeometry(0.28, 0.4, 12, 1, true), "#c9a227"); bm.position.y = -0.2; bell.add(bm);
    K.put(bell, 2.2, 3.9, -2.35); W.anims.push((dt, t) => { bell.rotation.z = Math.sin(t * 1.4) * 0.35; });
    const pg = FX.pigeons([[-0.8, 1.2], [-0.3, 1.6], [0.6, 1.0], [1.1, 1.5], [-1.4, 0.4], [0.2, 0.2]]); K.put(pg.obj); W.amb.push(pg); W.pigeons = pg;
    W.amb.push(FX.falling({ n: 18, colors: ["#f6c1d9", "#ffffff", "#f39ac0"], size: 0.07 }));
    return { sound: "plaza", rainOk: true };
  },
  cancha(K, W) {
    [-4.6, 4.6].forEach((x, i) => {
      K.cyl(0.08, 0.1, 4.6, "#3b3f48", x, 2.3, -3.1);
      const panel = K.box(1.1, 0.5, 0.12, "#222", x, 4.6, -3.0); panel.rotation.x = 0.5;
      const lit = K.box(1.0, 0.4, 0.05, glowMat("#f4f8ff", 2.6), x, 4.6, -2.93, { outline: false }); lit.rotation.x = 0.5;
      const b = FX.beam({ from: V(x, 4.6, -2.9), h: 6.5, r: 2.2, tilt: [0.85, i ? 0.45 : -0.45], color: "#e6eeff", opacity: 0.06 }); K.put(b.obj); W.amb.push(b);
    });
    const flags = [-2.5, 0, 2.5].map(x => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshBasicMaterial({ map: stripes("flagcasm", ["#1d8a3a", "#ffffff"], false, 4), side: THREE.DoubleSide })); K.put(f, x, 2.9, -2.1); return f; });
    W.anims.push((dt, t) => flags.forEach((f, i) => { f.rotation.y = Math.sin(t * 3 + i) * 0.35; }));
    return { sound: "crowd", rainOk: true, rainBias: 0.5 };
  },
  mall(K, W) {
    const cine = W.place.children.find(o => o.isGroup && o.children[1] && o.position.y > 2.1 && o.position.x < -2);
    if (cine) cine.children[1].material = new THREE.MeshBasicMaterial({ map: cine.children[1].material.map, color: new THREE.Color(1.5, 1.5, 1.5) });
    const neon = warmLight(K, -2.2, 2.2, -1.3, "#ff5a5a", 6, 5); flickerLight(W, neon, 6, 0.8);
    warmLight(K, 2.6, 1.8, -1.3, "#6affd6", 3, 4);
    return { sound: "city", rainOk: true };
  },
  gym(K, W) {
    [-1.2, 1.2].forEach(x => { const l = hangLamp(K, W, x, -1.5, 3.3, 3.0); flickerLight(W, l, 5, x > 0 ? 0.9 : 0.6); });
    const bags = W.place.children.filter(o => o.geometry && o.geometry.type === "CylinderGeometry" && Math.abs(o.position.x) > 3.8 && o.position.y > 1.5 && o.position.y < 2.2);
    bags.forEach(b => { b.geometry = b.geometry.clone(); b.geometry.translate(0, -0.65, 0); b.position.y += 0.65; });
    W.anims.push((dt, t) => bags.forEach((b, i) => { b.rotation.z = Math.sin(t * 2.2 + i * 2) * 0.12; b.rotation.x = Math.cos(t * 1.7 + i) * 0.06; }));
    W.amb.push(FX.dust({ n: 90, color: "#dfe6ff" }));
    return { sound: "gym" };
  },
  bakery(K, W) {
    [-1.6, 1.6].forEach(x => hangLamp(K, W, x, -1.7, 3.2, 2.6));
    W.amb.push(FX.steam([V(-1.8, 1.5, -1.7), V(1.8, 1.45, -1.7)]), FX.dust({ n: 60, color: "#ffe6ee" }));
    return { sound: "indoor" };
  }
};

/* ---------------- mundo ---------------- */
const rnd = (a, b) => a + Math.random() * (b - a);

export class World {
  constructor(container, overlay) {
    this.container = container; this.overlay = overlay;
    this.coarse = matchMedia("(pointer: coarse)").matches;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    r.setPixelRatio(1);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.camPos = V(0, 3.4, 9); this.camLook = V(0, 1.0, 0.2);
    this.sway = 1; this.shakeAmp = 0;

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4); this.scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(4, 8, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    this.place = new THREE.Group(); this.scene.add(this.place);
    this.cast = new THREE.Group(); this.scene.add(this.cast);
    this.fx = new THREE.Group(); this.scene.add(this.fx);
    this.amb = []; this.anims = [];

    this.thomas = A.thomas(); this.rocio = A.rocio(); this.juli = A.juli(); this.romero = A.romero();
    this.villain = A.lindaGata(true); this.villain.visible = false;
    [this.thomas, this.rocio, this.juli, this.romero, this.villain].forEach(a => this.cast.add(a));
    this.actors = [this.thomas, this.rocio, this.juli, this.romero, this.villain];
    this.homes();

    this.villainLight = new THREE.SpotLight(0xff3b3b, 0, 12, 0.5, 0.6); this.scene.add(this.villainLight); this.scene.add(this.villainLight.target);

    // rueda de reconocimiento
    this.lineup = new THREE.Scene();
    this.lineup.background = new THREE.Color("#141c2c");
    this.lineup.add(new THREE.HemisphereLight(0xffffff, 0x223, 1.5));
    const ls = new THREE.SpotLight(0xfff2d8, 40, 14, 0.7, 0.5); ls.position.set(0, 6, 4); this.lineup.add(ls);
    this.lineupGroup = new THREE.Group(); this.lineup.add(this.lineupGroup);
    this.lineupDust = FX.dust({ n: 70, color: "#fff6dd", box: [-4.5, 4.5, 0.2, 2.8, -0.5, 1.5] }); this.lineup.add(this.lineupDust.obj);
    this.view = "place";

    this.pipe = new Pipeline(r, this.scene, this.camera);

    this.bubbles = [];
    this.clock = new THREE.Clock();
    this.running = [];
    this.romeroChase = null;
    this.behT = 3;

    this.ray = new THREE.Raycaster();
    r.domElement.addEventListener("pointerdown", e => this.onPointer(e));

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    r.setAnimationLoop(() => this.frame());
  }

  homes() {
    this.home = new Map([
      [this.thomas, V(-0.75, 0, 2.3)], [this.rocio, V(0.75, 0, 2.3)],
      [this.juli, V(-1.8, 0, 2.7)], [this.romero, V(1.8, 0, 2.8)]
    ]);
    this.home.forEach((p, a) => { a.position.copy(p); a.rotation.set(0, 0, 0); a.visible = true; a.userData.busy = false; });
    this.juli.rotation.y = 0.3; this.romero.rotation.y = -0.3;
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.pipe && this.pipe.setSize(w, h, this.coarse);
    this.camera.aspect = w / h;
    const ar = w / h;
    this.fit = ar < 0.6 ? 1.9 : ar < 1 ? 1.45 : ar < 1.4 ? 1.15 : 1;
    this.applyShift();
  }

  setView(v) { this.view = v; }
  setShift(f) { if (f === this.shift) return; this.shift = f; this.applyShift(); }
  applyShift() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    if (this.shift) this.camera.setViewOffset(w, h, 0, h * this.shift, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }
  setDanger(v) { this.pipe.danger = v; }

  setPlace(key, opts = {}) {
    this.placeKey = key;
    this.place.clear();
    this.pets = []; this.amb = []; this.anims = [];
    this.evidence = null; this.train = null; this.bus = null; this.flag = null; this.pigeons = null; this.dome = null;
    const K = kit(this.place);
    const pal = PLACES[key](K, this);
    const amb = (AMB[key] && AMB[key](K, this)) || {};
    this.amb.forEach(f => { if (f.obj && !f.obj.parent) this.place.add(f.obj); });
    const raining = !!(amb.rainOk && opts.rain);
    const sky = new THREE.Color(pal.sky);
    if (raining) sky.lerp(new THREE.Color("#2e3a52"), 0.65);
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, raining ? 11 : 16, raining ? 30 : 42);
    this.hemi.color.set(pal.hemi[0]); this.hemi.groundColor.set(pal.hemi[1]);
    this.hemi.intensity = raining ? 0.85 : 1.15; this.baseHemi = this.hemi.intensity;
    this.sun.color.set(pal.sun); this.baseSun = pal.sunI * 0.8 * (raining ? 0.55 : 1); this.sun.intensity = this.baseSun;
    if (raining) { const rn = FX.rain(); this.place.add(rn.obj); this.amb.push(rn); }
    (pal.pets || []).forEach(p => { this.place.add(p); this.pets.push(p); });
    this.pal = pal;
    this.ambience = { sound: amb.sound || "indoor", rain: raining, night: !!pal.night, horn: !!amb.horn };
    this.pipe.bloomStrength = pal.night || raining ? 0.8 : 0.45;
    this.homes();
    this.villain.visible = false; this.villainLight.intensity = 0;
    if (this.evidence) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.4), transparent: true, opacity: 0.95 }));
      ring.position.copy(this.evidence); this.place.add(ring); this.evRing = ring;
    }
    return this.ambience;
  }

  /* ---- cámara ---- */
  camTo(pos, look, dur = 1.6, ease = "power2.inOut") {
    gsap.to(this.camPos, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease });
    return gsap.to(this.camLook, { x: look.x, y: look.y, z: look.z, duration: dur, ease });
  }
  camIdle() { return this.camTo(V(0, 3.2, 8.6), V(0, 1.0, 0.4), 1.4); }
  shake(a = 0.25) { this.shakeAmp = Math.max(this.shakeAmp, a); }

  /* ---- movimiento ---- */
  walkTo(a, to, dur, delay = 0, speed = 10, face = 0) {
    const u = a.userData; u.busy = true;
    const from = a.position.clone();
    const st = { k: 0 };
    return gsap.to(st, {
      k: 1, duration: dur, delay, ease: "power1.inOut",
      onStart: () => { a.rotation.y = Math.atan2(to.x - from.x, to.z - from.z); },
      onUpdate: () => {
        a.position.lerpVectors(from, to, st.k);
        a.position.y = Math.abs(Math.sin(st.k * dur * speed * 0.5)) * 0.07;
        A.runCycle(a, st.k * dur, speed);
      },
      onComplete: () => {
        a.position.y = 0;
        (u.legs || []).forEach(l => { l.rotation.x = 0; });
        (u.arms || []).forEach(l => { l.rotation.x = 0; });
        gsap.to(a.rotation, { y: face, duration: 0.35, onComplete: () => { u.busy = false; } });
      }
    });
  }

  /* ---- cinemáticas ---- */
  intro({ villain = false } = {}) {
    const tl = gsap.timeline();
    this.sway = 0;
    this.camPos.set(-7, 7.5, 15); this.camLook.set(0, 0.6, -1);
    tl.to(this.camPos, { x: 2.8, y: 3.8, z: 9.6, duration: 3.2, ease: "power2.inOut" }, 0);
    tl.to(this.camLook, { x: 0, y: 1, z: 0, duration: 3.2, ease: "power2.inOut" }, 0);
    const entries = [[this.thomas, -7, 0.4, 1.9, 9], [this.rocio, 7, 0.55, 1.9, 9], [this.juli, -8, 0.2, 1.5, 14], [this.romero, 8, 0.1, 1.2, 18]];
    entries.forEach(([a, x, d, dur, sp]) => {
      const h = this.home.get(a);
      a.position.set(x, 0, h.z + 0.6);
      this.walkTo(a, h, dur, d, sp, a === this.juli ? 0.3 : a === this.romero ? -0.3 : 0);
    });
    if (this.train) { this.train.position.x = -14; tl.to(this.train.position, { x: 0, duration: 2.8, ease: "power3.out" }, 0.2); }
    if (this.evidence) {
      tl.to(this.camLook, { x: this.evidence.x * 0.6, y: this.evidence.y, z: this.evidence.z, duration: 1.1, ease: "power2.inOut" }, 3.0)
        .add(() => { this.say(null, "Acá pasó algo", 1700, this.evidence); gsap.fromTo(this.evRing.scale, { x: 2.5, y: 2.5, z: 2.5 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(3)" }); }, 3.3)
        .to(this.camLook, { x: 0, y: 1, z: 0.4, duration: 1.0, ease: "power2.inOut" }, 4.4)
        .add(() => { this.say(this.rocio, "¿Quién fue?", 1300); }, 4.6)
        .add(() => { this.say(this.thomas, "Lo vamos a encontrar.", 1400); }, 5.3);
    }
    if (villain) tl.add(() => this.villainCameo(), 6.4).to({}, { duration: 3.2 });
    tl.add(() => { this.sway = 1; this.camIdle(); });
    return tl;
  }

  villainCameo(text) {
    const v = this.villain;
    v.visible = true;
    const spot = V(0, 2.6, -1.2);
    v.position.set(spot.x, spot.y + 4, spot.z); v.rotation.set(0, 0, 0);
    this.villainLight.position.set(0, 7, 3); this.villainLight.target.position.copy(spot);
    gsap.to(this.villainLight, { intensity: 60, duration: 0.5 });
    gsap.to(this.sun, { intensity: this.baseSun * 0.3, duration: 0.5 });
    gsap.to(this.hemi, { intensity: 0.6, duration: 0.5 });
    gsap.to(v.position, { y: spot.y, duration: 0.8, ease: "bounce.out" });
    gsap.fromTo(v.scale, { x: 1.05, y: 1.05, z: 1.05 }, { x: 1.2, y: 0.9, z: 1.2, duration: 0.12, delay: 0.75, yoyo: true, repeat: 1 });
    this.camTo(V(0.8, 3.2, 4.6), V(0, 2.9, -1.2), 1.0);
    this.pipe.flash("#ff2a3a", 0.35);
    this.say(v, text || TAUNTS[Math.floor(Math.random() * TAUNTS.length)], 2800);
    [this.thomas, this.rocio].forEach(h => A.expr(h, "sad"));
    return gsap.delayedCall(3.1, () => {
      gsap.to(this.villainLight, { intensity: 0, duration: 0.6 });
      gsap.to(this.sun, { intensity: this.baseSun, duration: 0.6 });
      gsap.to(this.hemi, { intensity: this.baseHemi || 1.15, duration: 0.6 });
      gsap.to(v.position, { y: spot.y + 5, duration: 0.6, ease: "power2.in", onComplete: () => { v.visible = false; } });
      [this.thomas, this.rocio].forEach(h => A.expr(h, "happy"));
    });
  }

  react(kind) {
    const hs = [this.thomas, this.rocio];
    if (kind === "ok") {
      this.pipe.flash("#7dffb8", 0.18);
      hs.forEach((h, i) => { if (h.userData.busy) return; A.expr(h, "happy"); gsap.to(h.position, { y: 0.35, duration: 0.18, yoyo: true, repeat: 1, delay: i * 0.08, ease: "power2.out" }); });
      if (!this.juli.userData.busy) gsap.to(this.juli.position, { y: 0.25, duration: 0.16, yoyo: true, repeat: 1, delay: 0.2 });
    } else if (kind === "err") {
      this.shake(0.3);
      this.pipe.flash("#ff3040", 0.3);
      hs.forEach(h => {
        if (h.userData.busy) return;
        A.expr(h, "sad"); h.userData.busy = true;
        gsap.timeline({ onComplete: () => { h.userData.busy = false; A.expr(h, "happy"); } })
          .to(h.userData.head.rotation, { y: 0.45, duration: 0.1 }).to(h.userData.head.rotation, { y: -0.45, duration: 0.14 })
          .to(h.userData.head.rotation, { y: 0.3, duration: 0.12 }).to(h.userData.head.rotation, { y: 0, duration: 0.12 })
          .to(h.userData.head.rotation, { x: 0.35, duration: 0.3 }, "+=0.1").to(h.userData.head.rotation, { x: 0, duration: 0.4 }, "+=0.6");
      });
    }
  }

  // pequeñas escenas espontáneas: Thomas tira golpes, Rocío bate, Juli se lava, Romero salta
  behave() {
    if (this.view !== "place" || this.romeroChase || this.sway === 0) return;
    const pick = Math.floor(Math.random() * 5);
    const T = this.thomas.userData, R = this.rocio.userData, J = this.juli.userData, P = this.romero.userData;
    if (pick === 0 && !T.busy) {
      T.busy = true;
      gsap.timeline({ onComplete: () => { T.busy = false; } })
        .to(T.arms[0].rotation, { x: -1.3, z: 0.2, duration: 0.12 }).to(T.arms[0].rotation, { x: 0, z: -0.1, duration: 0.14 })
        .to(T.arms[1].rotation, { x: -1.4, z: -0.2, duration: 0.1 }).to(T.arms[1].rotation, { x: 0, z: 0.1, duration: 0.14 })
        .to(T.arms[0].rotation, { x: -1.3, duration: 0.1 }).to(T.arms[0].rotation, { x: 0, duration: 0.2 });
    } else if (pick === 1 && !R.busy) {
      R.busy = true; const arm = R.arms[1]; const st = { k: 0 };
      gsap.to(arm.rotation, { x: -1.0, duration: 0.2 });
      gsap.to(st, { k: 1, duration: 1.4, delay: 0.2, onUpdate: () => { arm.rotation.z = 0.1 + Math.sin(st.k * 40) * 0.25; }, onComplete: () => gsap.to(arm.rotation, { x: 0, z: 0.1, duration: 0.3, onComplete: () => { R.busy = false; } }) });
    } else if (pick === 2 && !J.busy) {
      J.busy = true;
      gsap.timeline({ onComplete: () => { J.busy = false; } }).to(J.head.rotation, { x: 0.55, y: 0.5, duration: 0.35 }).to(J.head.rotation, { x: 0.45, duration: 0.15, yoyo: true, repeat: 5 }).to(J.head.rotation, { x: 0, y: 0, duration: 0.35 });
    } else if (pick === 3 && !P.busy) {
      P.busy = true; const r = this.romero;
      gsap.timeline({ onComplete: () => { P.busy = false; } }).to(r.position, { y: 0.45, duration: 0.2, ease: "power2.out" }).to(r.rotation, { y: r.rotation.y + Math.PI * 2, duration: 0.4 }, "<").to(r.position, { y: 0, duration: 0.2, ease: "power2.in" });
    } else if (pick === 4 && !T.busy && !R.busy) {
      gsap.to(T.head.rotation, { y: 0.6, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 1.2 });
      gsap.to(R.head.rotation, { y: -0.6, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 1.2, delay: 0.15 });
    }
  }

  celebrate() {
    this.view = "place";
    [this.thomas, this.rocio].forEach(h => A.expr(h, "happy"));
    [this.thomas, this.rocio, this.juli, this.romero].forEach((a, i) => {
      gsap.to(a.position, { y: 0.7, duration: 0.28, yoyo: true, repeat: 5, ease: "power1.out", delay: i * 0.08 });
    });
    gsap.to(this.juli.rotation, { y: this.juli.rotation.y + Math.PI * 4, duration: 1.8, ease: "power2.inOut" });
    this.thomas.userData.busy = this.rocio.userData.busy = true;
    [this.thomas, this.rocio].forEach(h => h.userData.arms.forEach((arm, i) => gsap.to(arm.rotation, { z: (i ? 1 : -1) * 2.6, duration: 0.3, yoyo: true, repeat: 5 })));
    gsap.timeline({ delay: 1.9 })
      .to(this.thomas.rotation, { y: -0.9, duration: 0.15 })
      .to(this.thomas.userData.legs[1].rotation, { x: -1.5, duration: 0.14, ease: "power3.out" }, "<")
      .add(() => { this.say(this.thomas, "¡Team Bielli!", 1400); this.shake(0.12); })
      .to(this.thomas.userData.legs[1].rotation, { x: 0, duration: 0.3, delay: 0.25 })
      .to(this.thomas.rotation, { y: 0, duration: 0.3 }, "<");
    this.say(this.rocio, "¡Esto se festeja con torta!", 1600);
    gsap.delayedCall(2.8, () => { this.thomas.userData.busy = this.rocio.userData.busy = false; });
    this.confetti();
    this.pipe.flash("#fff4c0", 0.4);
    this.camTo(V(0, 2.4, 5.6), V(0, 1.1, 2.2), 1.2);
  }

  defeat() {
    this.view = "place";
    gsap.to(this.sun, { intensity: this.baseSun * 0.3, duration: 1 });
    [this.thomas, this.rocio].forEach(h => { h.userData.busy = true; A.expr(h, "sad"); gsap.to(h.userData.head.rotation, { x: 0.5, duration: 0.8 }); });
    gsap.delayedCall(3.2, () => { [this.thomas, this.rocio].forEach(h => { h.userData.busy = false; A.expr(h, "happy"); gsap.to(h.userData.head.rotation, { x: 0, duration: 0.5 }); }); gsap.to(this.sun, { intensity: this.baseSun, duration: 1 }); });
    this.villainCameo("Jajaja. Miau. Mañana se lo devuelvo. O no.");
  }

  confetti() {
    const n = 180, geo = new THREE.PlaneGeometry(0.09, 0.15);
    const cols = [0xf2b134, 0x4ed39a, 0xff6166, 0x7aa2ff, 0xffffff, 0xc9a0dc];
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), n);
    const data = [], m = new THREE.Matrix4(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      data.push({ p: V((Math.random() - 0.5) * 7, 5 + Math.random() * 3, 0.5 + Math.random() * 3), v: V((Math.random() - 0.5) * 1.5, -1.2 - Math.random() * 1.5, 0), r: Math.random() * 6, s: 2 + Math.random() * 6 });
      inst.setColorAt(i, c.setHex(cols[i % cols.length]));
    }
    this.fx.add(inst);
    const q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V(1, 1, 1);
    let life = 4.5;
    this.running.push(dt => {
      life -= dt;
      data.forEach((d, i) => { d.p.addScaledVector(d.v, dt); d.p.x += Math.sin(d.r) * dt * 0.3; d.r += d.s * dt; e.set(d.r, d.r * 0.7, 0); q.setFromEuler(e); m.compose(d.p, q, sc); inst.setMatrixAt(i, m); });
      inst.instanceMatrix.needsUpdate = true;
      if (life <= 0) { this.fx.remove(inst); geo.dispose(); return false; }
      return true;
    });
  }

  juliHint(text) {
    const j = this.juli, u = j.userData;
    u.busy = true;
    const home = this.home.get(j);
    gsap.timeline({ onComplete: () => { u.busy = false; } })
      .add(() => { this.walkTo(j, V(0, 0, 3.4), 0.8, 0, 14, 0); })
      .to(j.position, { y: 0.4, duration: 0.18, yoyo: true, repeat: 1 }, 0.9)
      .add(() => this.say(j, text, 2600), 1.2)
      .add(() => { this.walkTo(j, home, 0.9, 0, 14, 0.3); }, 3.6);
  }

  romeroRun(ms, onTap) {
    const r = this.romero, u = r.userData;
    u.busy = true;
    if (this.pigeons) this.pigeons.scare();
    const chase = { t: 0, ms, onTap, done: false, a0: Math.random() * Math.PI * 2 };
    this.romeroChase = chase;
    this.say(r, "¡GUAU!", 900);
    this.running.push(dt => {
      if (chase.done) return false;
      chase.t += dt * 1000;
      const k = chase.t / 1000;
      const a = chase.a0 + k * 2.3 + Math.sin(k * 3.1) * 0.6;
      const rx = 3.3 + Math.sin(k * 1.7) * 0.6, rz = 1.7;
      const nx = Math.cos(a) * rx, nz = 0.9 + Math.sin(a) * rz;
      r.rotation.y = Math.atan2(nx - r.position.x, nz - r.position.z);
      r.position.set(nx, Math.abs(Math.sin(k * 14)) * 0.18, nz);
      A.runCycle(r, k, 20);
      if (chase.t >= chase.ms) { this.endRomero(false); return false; }
      return true;
    });
  }
  endRomero(caught) {
    const chase = this.romeroChase; if (!chase || chase.done) return;
    chase.done = true; this.romeroChase = null;
    const r = this.romero, home = this.home.get(r);
    r.userData.legs.forEach(l => { l.rotation.x = 0; });
    if (caught) { this.say(r, "¡Lo agarraron! Traía una pista en la boca.", 1800); this.pipe.flash("#7dffb8", 0.2); }
    else this.say(r, "Se fue a la rotonda. Volvió solo.", 1800);
    gsap.to(r.position, { x: home.x, y: 0, z: home.z, duration: 0.9, ease: "power2.out", onComplete: () => { r.rotation.y = -0.3; r.userData.busy = false; } });
  }

  onPointer(e) {
    if (!this.romeroChase || this.view !== "place") return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(p, this.camera);
    const center = this.romero.position.clone(); center.y += 0.4;
    if (this.ray.ray.distanceToPoint(center) < 0.8) { const cb = this.romeroChase.onTap; this.endRomero(true); cb && cb(); }
  }

  /* ---- globos de diálogo ---- */
  say(actor, text, ms = 2000, point) {
    const el = document.createElement("div");
    el.className = "bubble" + (actor === this.villain ? " evil" : "");
    el.textContent = text;
    this.overlay.appendChild(el);
    this.bubbles.push({ el, actor, point, until: performance.now() + ms });
    requestAnimationFrame(() => el.classList.add("on"));
  }
  updateBubbles() {
    const now = performance.now(), w = this.container.clientWidth, h = this.container.clientHeight;
    this.bubbles = this.bubbles.filter(b => {
      if (now > b.until) { b.el.classList.remove("on"); setTimeout(() => b.el.remove(), 300); return false; }
      let p;
      if (b.actor) { p = new THREE.Vector3(); (b.actor.userData.head || b.actor).getWorldPosition(p); p.y += 0.55 * b.actor.scale.y; }
      else p = b.point.clone().add(V(0, 0.5, 0));
      p.project(this.camera);
      const x = Math.max(80, Math.min(w - 80, (p.x * 0.5 + 0.5) * w)), y = Math.max(40, (-p.y * 0.5 + 0.5) * h);
      b.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      b.el.style.visibility = this.view === "place" && p.z < 1 ? "visible" : "hidden";
      return true;
    });
  }

  /* ---- rueda de reconocimiento ---- */
  buildLineup(sus, wrong = []) {
    this.lineupGroup.clear();
    const n = sus.length, gap = Math.min(1.15, 8.4 / n), w = gap * n + 0.8;
    const ht = heightTex().clone(); ht.needsUpdate = true;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.6), new THREE.MeshBasicMaterial({ map: ht }));
    wall.position.set(0, 1.3, -0.6);
    this.lineupGroup.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, 3), A.toon("#303a50")); floor.rotation.x = -Math.PI / 2; this.lineupGroup.add(floor);
    this.lineupActors = sus.map((s, i) => {
      const a = A.suspect(s.look);
      a.position.set((i - (n - 1) / 2) * gap, 0, 0);
      this.lineupGroup.add(a);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshBasicMaterial({ map: signTex(String(i + 1), { bg: "#f2b134", fg: "#1a1204", w: 128, h: 72 }) }));
      plate.position.set(a.position.x, 0.62 * s.look.height, 0.36 * s.look.height); this.lineupGroup.add(plate);
      if (wrong.includes(i)) a.traverse(o => { if (o.material && o.material.color && o.material !== A.OUTLINE) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.25; } });
      return a;
    });
    this.lineupW = w;
  }

  /* ---- retratos pixel a partir de los modelos 3D ---- */
  portraits(list) {
    if (!this.pr) {
      this.pr = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
      this.pr.setSize(72, 72); this.pr.setPixelRatio(1); this.pr.outputColorSpace = THREE.SRGBColorSpace;
      this.prScene = new THREE.Scene();
      this.prScene.add(new THREE.HemisphereLight(0xffffff, 0x445, 1.8));
      const d = new THREE.DirectionalLight(0xffffff, 1.8); d.position.set(2, 3, 4); this.prScene.add(d);
      this.prCam = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    }
    return list.map(make => {
      const a = make();
      const hgt = a.scale.y;
      a.rotation.y = -0.25;
      this.prScene.add(a);
      a.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(a);
      const top = box.max.y, cy = a.userData.kind === "human" ? 1.3 * hgt : (box.min.y + top) / 2 + 0.05;
      const dist = a.userData.kind === "human" ? 2.75 * hgt : 2.5 * Math.max(box.max.x - box.min.x, top - box.min.y);
      this.prCam.position.set(0.2, cy + 0.1, dist); this.prCam.lookAt(0, cy, 0);
      this.pr.render(this.prScene, this.prCam);
      const url = this.pr.domElement.toDataURL("image/png");
      this.prScene.remove(a);
      return url;
    });
  }

  /* ---- loop ---- */
  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    this.actors.concat(this.pets || []).forEach(a => A.animate(a, t, dt));
    this.running = this.running.filter(fn => fn(dt) !== false);
    this.amb.forEach(f => f.update && f.update(dt, t));
    this.anims.forEach(fn => fn(dt, t));
    this.behT -= dt; if (this.behT < 0) { this.behT = rnd(2.2, 4.5); this.behave(); }
    if (this.evRing) { this.evRing.rotation.y += dt * 1.5; this.evRing.rotation.x = Math.PI / 2 + Math.sin(t * 2) * 0.2; }
    if (this.bus) { const a = t * 0.45; this.bus.position.set(Math.cos(a) * 2.55, 0, -0.8 + Math.sin(a) * 2.55); this.bus.rotation.y = -a; }
    if (this.flag) this.flag.rotation.y = Math.sin(t * 2) * 0.15;
    this.shakeAmp *= Math.pow(0.02, dt);
    const sx = (Math.random() - 0.5) * this.shakeAmp, sy = (Math.random() - 0.5) * this.shakeAmp;

    if (this.view === "lineup") {
      if (this.lineupActors) this.lineupActors.forEach(a => A.animate(a, t, dt));
      this.lineupDust.update(dt, t);
      const ar = this.camera.aspect;
      const dist = Math.max(3.2, (this.lineupW * 0.5 + 0.3) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) / Math.min(ar, 1.8));
      this.camera.position.set(Math.sin(t * 0.3) * 0.3 + sx, 1.1 + sy, dist);
      this.camera.lookAt(0, 1.0, 0);
      this.pipe.render(dt, this.lineup, this.camera);
    } else {
      const f = this.fit || 1, sw = this.sway;
      this.camera.position.set(this.camPos.x + Math.sin(t * 0.25) * 0.5 * sw + sx, this.camPos.y + (f - 1) * 1.6 + sy, this.camPos.z * f);
      this.camera.lookAt(this.camLook);
      this.pipe.render(dt, this.scene, this.camera);
    }
    this.updateBubbles();
  }
}
