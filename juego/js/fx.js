// Ambientación: partículas, palomas y haces de luz. Cada efecto devuelve { obj, update(dt, t) }.
import * as THREE from "three";
import * as A from "./actors.js";

let DOT = null;
function dotTex() {
  if (DOT) return DOT;
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  DOT = new THREE.CanvasTexture(c);
  return DOT;
}
const rnd = (a, b) => a + Math.random() * (b - a);

function pointsField(n, init, mat) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const data = [];
  for (let i = 0; i < n; i++) { const d = init(i); data.push(d); pos.set([d.p.x, d.p.y, d.p.z], i * 3); col.set([1, 1, 1], i * 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { pts, pos, col, data, geo };
}

export function dust(o = {}) {
  const box = o.box || [-4.5, 4.5, 0.3, 3.6, -3, 2.5];
  const color = new THREE.Color(o.color || "#ffe9c4");
  const f = pointsField(o.n || 120, () => ({ p: new THREE.Vector3(rnd(box[0], box[1]), rnd(box[2], box[3]), rnd(box[4], box[5])), v: new THREE.Vector3(rnd(-0.05, 0.05), rnd(-0.03, 0.04), rnd(-0.03, 0.03)), ph: Math.random() * 7 }),
    new THREE.PointsMaterial({ size: o.size || 0.05, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true, opacity: o.opacity || 0.7 }));
  return {
    obj: f.pts,
    update(dt, t) {
      f.data.forEach((d, i) => {
        d.p.addScaledVector(d.v, dt); d.p.x += Math.sin(t * 0.4 + d.ph) * 0.002;
        if (d.p.y > box[3]) d.p.y = box[2]; if (d.p.y < box[2]) d.p.y = box[3];
        if (d.p.x > box[1]) d.p.x = box[0]; if (d.p.x < box[0]) d.p.x = box[1];
        f.pos[i * 3] = d.p.x; f.pos[i * 3 + 1] = d.p.y; f.pos[i * 3 + 2] = d.p.z;
        const k = 0.55 + 0.45 * Math.sin(t * 1.3 + d.ph);
        f.col[i * 3] = color.r * k; f.col[i * 3 + 1] = color.g * k; f.col[i * 3 + 2] = color.b * k;
      });
      f.geo.attributes.position.needsUpdate = true; f.geo.attributes.color.needsUpdate = true;
    }
  };
}

export function fireflies(o = {}) {
  const base = new THREE.Color(o.color || "#e4ff6a");
  const f = pointsField(o.n || 36, () => ({ c: new THREE.Vector3(rnd(-4.5, 4.5), rnd(0.3, 2.2), rnd(-2.5, 2.5)), p: new THREE.Vector3(), ph: Math.random() * 20, sp: rnd(0.3, 0.8) }),
    new THREE.PointsMaterial({ size: 0.13, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending }));
  return {
    obj: f.pts,
    update(dt, t) {
      f.data.forEach((d, i) => {
        const k = t * d.sp + d.ph;
        d.p.set(d.c.x + Math.sin(k) * 0.6, d.c.y + Math.sin(k * 1.3) * 0.3, d.c.z + Math.cos(k * 0.8) * 0.6);
        f.pos.set([d.p.x, d.p.y, d.p.z], i * 3);
        const b = Math.max(0, Math.sin(t * 2 + d.ph * 3)) * 2.2;
        f.col.set([base.r * b, base.g * b, base.b * b], i * 3);
      });
      f.geo.attributes.position.needsUpdate = true; f.geo.attributes.color.needsUpdate = true;
    }
  };
}

export function falling(o = {}) {
  // hojas o pétalos que caen balanceándose
  const cols = (o.colors || ["#6aa84f", "#93c47d", "#b6d7a8"]).map(c => new THREE.Color(c));
  const f = pointsField(o.n || 26, () => ({ p: new THREE.Vector3(rnd(-4.5, 4.5), rnd(0, 5), rnd(-3, 2.5)), ph: Math.random() * 9, sp: rnd(0.25, 0.5), c: cols[Math.floor(Math.random() * cols.length)] }),
    new THREE.PointsMaterial({ size: o.size || 0.09, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true }));
  f.data.forEach((d, i) => f.col.set([d.c.r, d.c.g, d.c.b], i * 3));
  f.geo.attributes.color.needsUpdate = true;
  return {
    obj: f.pts,
    update(dt, t) {
      f.data.forEach((d, i) => {
        d.p.y -= d.sp * dt; d.p.x += Math.sin(t * 1.5 + d.ph) * dt * 0.4;
        if (d.p.y < 0.02) { d.p.y = rnd(4, 5.5); d.p.x = rnd(-4.5, 4.5); }
        f.pos.set([d.p.x, d.p.y, d.p.z], i * 3);
      });
      f.geo.attributes.position.needsUpdate = true;
    }
  };
}

export function steam(sources) {
  const f = pointsField(sources.length * 10, i => ({ s: sources[i % sources.length], p: new THREE.Vector3(), life: Math.random() * 2.2, ph: Math.random() * 6 }),
    new THREE.PointsMaterial({ size: 0.16, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true, opacity: 0.45 }));
  return {
    obj: f.pts,
    update(dt, t) {
      f.data.forEach((d, i) => {
        d.life += dt; if (d.life > 2.2) d.life = 0;
        const k = d.life / 2.2;
        d.p.set(d.s.x + Math.sin(t * 2 + d.ph) * 0.08 * k, d.s.y + k * 0.9, d.s.z);
        f.pos.set([d.p.x, d.p.y, d.p.z], i * 3);
        const a = Math.sin(k * Math.PI) * 0.9;
        f.col.set([a, a, a], i * 3);
      });
      f.geo.attributes.position.needsUpdate = true; f.geo.attributes.color.needsUpdate = true;
    }
  };
}

export function rain(o = {}) {
  const n = o.n || 520;
  const pos = new Float32Array(n * 6);
  const drops = [];
  for (let i = 0; i < n; i++) drops.push({ x: rnd(-8, 8), y: rnd(0, 11), z: rnd(-7, 5), v: rnd(9, 13) });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: o.color || "#a9bddf", transparent: true, opacity: 0.55, depthWrite: false }));
  lines.frustumCulled = false;
  // salpicaduras en el piso
  const sp = pointsField(60, () => ({ p: new THREE.Vector3(rnd(-4.8, 4.8), 0.03, rnd(-3.3, 3.3)), life: Math.random() * 0.3 }),
    new THREE.PointsMaterial({ size: 0.07, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true }));
  const g = new THREE.Group(); g.add(lines); g.add(sp.pts);
  return {
    obj: g,
    update(dt) {
      drops.forEach((d, i) => {
        d.y -= d.v * dt; d.x -= dt * 1.2;
        if (d.y < 0) { d.y = rnd(9, 11); d.x = rnd(-7, 9); }
        pos.set([d.x, d.y, d.z, d.x + 0.05, d.y + 0.35, d.z], i * 6);
      });
      geo.attributes.position.needsUpdate = true;
      sp.data.forEach((d, i) => {
        d.life -= dt; if (d.life <= 0) { d.life = rnd(0.15, 0.35); d.p.set(rnd(-4.8, 4.8), 0.03, rnd(-3.3, 3.3)); }
        sp.pos.set([d.p.x, d.p.y, d.p.z], i * 3);
        const a = d.life * 2.5; sp.col.set([0.75 * a, 0.82 * a, a], i * 3);
      });
      sp.geo.attributes.position.needsUpdate = true; sp.geo.attributes.color.needsUpdate = true;
    }
  };
}

export function stars(o = {}) {
  const n = o.n || 420;
  const f = pointsField(n, () => {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * 0.42 * Math.PI;
    return { p: new THREE.Vector3(40 * Math.cos(th) * Math.sin(ph), 40 * Math.cos(ph) + 1, 40 * Math.sin(th) * Math.sin(ph) - 12), ph: Math.random() * 9, b: rnd(0.5, 1.4) };
  }, new THREE.PointsMaterial({ size: 0.22, map: dotTex(), transparent: true, depthWrite: false, vertexColors: true, fog: false }));
  f.data.forEach((d, i) => f.pos.set([d.p.x, d.p.y, d.p.z], i * 3));
  f.geo.attributes.position.needsUpdate = true;
  // estrella fugaz
  const shoot = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false }));
  const g = new THREE.Group(); g.add(f.pts); g.add(shoot);
  let next = 3, s = null;
  return {
    obj: g,
    update(dt, t) {
      f.data.forEach((d, i) => { const k = d.b * (0.6 + 0.4 * Math.sin(t * 3 + d.ph)); f.col.set([k, k, k * 1.05], i * 3); });
      f.geo.attributes.color.needsUpdate = true;
      next -= dt;
      if (next < 0 && !s) { s = { t: 0, x: rnd(-14, 4), y: rnd(10, 16) }; next = rnd(5, 11); }
      if (s) {
        s.t += dt;
        shoot.position.set(s.x + s.t * 16, s.y - s.t * 6, -16); shoot.rotation.z = -0.36;
        shoot.material.opacity = Math.sin(Math.min(1, s.t / 0.7) * Math.PI);
        if (s.t > 0.7) { s = null; shoot.material.opacity = 0; }
      }
    }
  };
}

export function pigeons(spots) {
  const g = new THREE.Group(); const birds = [];
  spots.forEach(([x, z]) => {
    const b = new THREE.Group();
    const body = A.mesh(new THREE.SphereGeometry(0.09, 10, 8), "#8f96a3", { ol: 1.12 }); body.scale.set(1, 0.85, 1.4); body.position.y = 0.1; b.add(body);
    const head = new THREE.Group(); head.position.set(0, 0.19, 0.1); b.add(head);
    head.add(A.mesh(new THREE.SphereGeometry(0.05, 8, 6), "#6e7a8e", { ol: 1.15 }));
    const beak = A.mesh(new THREE.ConeGeometry(0.015, 0.04, 4), "#e3a74b", { outline: false }); beak.rotation.x = Math.PI / 2; beak.position.z = 0.055; head.add(beak);
    const neck = A.mesh(new THREE.SphereGeometry(0.045, 8, 6), "#4f8a7a", { outline: false }); neck.position.set(0, 0.15, 0.07); b.add(neck);
    b.position.set(x, 0, z); b.rotation.y = Math.random() * 6;
    g.add(b); birds.push({ b, head, ph: Math.random() * 9, fly: 0, home: new THREE.Vector3(x, 0, z) });
  });
  return {
    obj: g,
    scare() { birds.forEach(d => { if (!d.fly) d.fly = 0.001; }); },
    update(dt, t) {
      birds.forEach(d => {
        if (d.fly) {
          d.fly += dt;
          d.b.position.y = d.fly * 3; d.b.position.x += dt * 2; d.b.rotation.z = Math.sin(t * 30) * 0.3;
          if (d.fly > 5) { d.fly = 0; d.b.position.copy(d.home); d.b.rotation.z = 0; }
          return;
        }
        const peck = Math.max(0, Math.sin(t * 5 + d.ph));
        d.head.position.y = 0.19 - peck * 0.09; d.head.position.z = 0.1 + peck * 0.05;
        if (Math.sin(t * 0.7 + d.ph) > 0.995) d.b.rotation.y += 0.8;
      });
    }
  };
}

export function beam(o) {
  // haz de luz "volumétrico" falso
  const h = o.h || 3, r = o.r || 0.8;
  const geo = new THREE.ConeGeometry(r, h, 24, 1, true);
  geo.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: o.color || "#fff1c9", transparent: true, opacity: o.opacity || 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.copy(o.from);
  if (o.tilt) m.rotation.set(o.tilt[0], 0, o.tilt[1]);
  const base = m.material.opacity;
  return { obj: m, update(dt, t) { m.material.opacity = base * (0.8 + 0.2 * Math.sin(t * 0.9 + (o.ph || 0))); } };
}
