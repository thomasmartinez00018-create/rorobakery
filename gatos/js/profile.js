// Perfil guardado en el celu (localStorage): monedas, Taller, mapas, récords y progreso de la historia.
// v1 era el formato de la primera versión; v2 agrega la historia. La migración conserva todo lo de v1.
// No toca el DOM: se puede probar en Node con un localStorage de mentira (tools/test_perfil.mjs).
export const PROFILE_KEY = "gdl-profile";
export const PROFILE_V = 2;
export const BACKUP_KEYS = { v1: "gdl-profile-v1", prev: "gdl-profile-anterior", broken: "gdl-profile-roto" };
const UPGS = ["hp", "dmg", "spd", "mag"];

const int = (v, lo = 0, hi = 1e9) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
const num = (v, lo = 0, hi = 1e9) => { v = +v; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };

export function freshProfile() {
  return { v: PROFILE_V, who: null, coins: 0, up: { hp: 0, dmg: 0, spd: 0, mag: 0 }, maps: { plaza: true }, best: { t: 0, k: 0, lv: 0 }, wins: 0, runs: 0, story: { cap: 0, done: {} }, unlock: {}, arcade: freshArcade() };
}
// dinámica del arcade (claves propias, aparte de los desbloqueos de la historia en `unlock`):
// alc = alcancía de la pareja (monedas de partidas a dúo, no se gastan); metas[mapa] = [0|1, 0|1, 0|1];
// win1[mapa] = 1 si ya ganaron ahí (bonus de primera victoria); opt = opciones de la alcancía prendidas en la sala
export function freshArcade() { return { alc: 0, metas: {}, win1: {}, opt: {} }; }
function normArcade(a) {
  const f = freshArcade(); if (!a || typeof a !== "object") return f;
  const metas = {}; if (a.metas && typeof a.metas === "object") for (const [k, v] of Object.entries(a.metas)) if (Array.isArray(v)) metas[k] = [0, 1, 2].map(i => v[i] ? 1 : 0);
  const flags = o => { const r = {}; if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (v) r[k] = 1; return r; };
  return { ...f, ...a, alc: int(a.alc), metas, win1: flags(a.win1), opt: flags(a.opt) };
}

// deja cualquier perfil (v1 o v2) en forma v2 válida, sin perder campos que no conoce
function normalize(p) {
  const f = freshProfile();
  const up = {}; for (const k of UPGS) up[k] = int(p.up && p.up[k], 0, 5);
  const maps = { plaza: true }; if (p.maps && typeof p.maps === "object") for (const [k, v] of Object.entries(p.maps)) if (v) maps[k] = true;
  const b = p.best || {};
  const st = p.story && typeof p.story === "object" ? p.story : {};
  const done = {}; if (st.done && typeof st.done === "object") for (const [k, v] of Object.entries(st.done)) if (v) done[k] = typeof v === "object" ? v : true;
  const unlock = {}; if (p.unlock && typeof p.unlock === "object") for (const [k, v] of Object.entries(p.unlock)) if (v) unlock[k] = true;
  return {
    ...f, ...p,
    v: Math.max(PROFILE_V, int(p.v, 1, 99)),
    who: p.who === "thomas" || p.who === "rocio" ? p.who : null,
    coins: int(p.coins), up, maps,
    best: { t: num(b.t), k: int(b.k), lv: int(b.lv) },
    wins: int(p.wins), runs: int(p.runs),
    story: { ...st, cap: int(st.cap, 0, 99), done },
    unlock,
    arcade: normArcade(p.arcade)
  };
}

// v1 → v2: se copian monedas, Taller, mapas, récords, victorias, partidas y personaje; se suma la historia vacía
export function migrate(p) {
  if (!p || typeof p !== "object") return null;
  const v = p.v | 0;
  if (v === 1) return normalize({ ...p, v: 2, story: { cap: 0, done: {} }, unlock: {} });
  if (v >= 2) return normalize(p);
  return null;
}

const store0 = () => { try { return globalThis.localStorage || null; } catch (e) { return null; } };

// lee el perfil; si es v1 lo migra, guarda una copia del original y lo deja grabado como v2
export function loadProfile(store = store0()) {
  let raw = null;
  try { raw = store && store.getItem(PROFILE_KEY); } catch (e) {}
  if (!raw) return freshProfile();
  let p = null;
  try { p = JSON.parse(raw); } catch (e) {}
  const out = migrate(p);
  if (!out) {
    // no se entiende: se guarda aparte para no perderlo y se arranca de cero
    try { store.setItem(BACKUP_KEYS.broken, raw); } catch (e) {}
    return freshProfile();
  }
  if ((p.v | 0) === 1) {
    try { if (!store.getItem(BACKUP_KEYS.v1)) store.setItem(BACKUP_KEYS.v1, raw); store.setItem(PROFILE_KEY, JSON.stringify(out)); } catch (e) {}
  }
  return out;
}

export function saveProfile(p, store = store0()) {
  try { store && store.setItem(PROFILE_KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
}

// pide que el navegador no borre el guardado (Safari borra localStorage de sitios sin usar a los 7 días)
let persistAsked = false;
export function requestPersist(nav = globalThis.navigator) {
  if (persistAsked) return Promise.resolve(null);
  persistAsked = true;
  try {
    const s = nav && nav.storage;
    if (!s || !s.persist) return Promise.resolve(null);
    return (s.persisted ? s.persisted() : Promise.resolve(false)).then(ok => ok || s.persist()).catch(() => null);
  } catch (e) { return Promise.resolve(null); }
}

/* ---------- código de respaldo: el perfil en base64 para copiar y pegar ---------- */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
const toB64 = s => { const b = new TextEncoder().encode(s); let bin = ""; for (const x of b) bin += String.fromCharCode(x); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const fromB64 = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const bin = atob(s); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); };

export function exportCode(p) {
  const json = JSON.stringify(normalize(p));
  return "GDL2." + toB64(json) + "." + fnv(json);
}

// devuelve el perfil del código o tira un Error con un mensaje para mostrar
export function importCode(code) {
  const c = String(code || "").replace(/\s+/g, "");
  const m = c.match(/^GDL(\d+)\.([A-Za-z0-9_-]+)\.([0-9a-z]+)$/);
  if (!m) throw new Error("Ese código no es de Gatos de Linda. Copialo entero, desde GDL hasta el final.");
  let json;
  try { json = fromB64(m[2]); } catch (e) { throw new Error("El código está cortado o tiene letras de más."); }
  if (fnv(json) !== m[3]) throw new Error("El código está cortado o tiene letras de más.");
  let p; try { p = JSON.parse(json); } catch (e) { throw new Error("El código está dañado."); }
  const out = migrate(p);
  if (!out) throw new Error("El código está dañado.");
  return out;
}
