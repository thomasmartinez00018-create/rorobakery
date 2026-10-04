// Prueba del guardado: un perfil v1 real pasa a v2 sin perder nada, el código de respaldo va y vuelve,
// y los casos raros (vacío, roto, versión futura) no borran el progreso. Uso: node test_perfil.mjs
import assert from "assert/strict";
import { loadProfile, saveProfile, migrate, exportCode, importCode, freshProfile, requestPersist, PROFILE_KEY, BACKUP_KEYS } from "../js/profile.js";

class FakeStorage {
  constructor(o = {}) { this.m = new Map(Object.entries(o)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log("ok -", name); };

// perfil v1 tal como lo guarda la versión publicada (main.js de 02ab518)
const V1 = { v: 1, who: "rocio", coins: 437, up: { hp: 3, dmg: 2, spd: 1, mag: 5 }, maps: { plaza: true, estacion: true, feria: true }, best: { t: 431.6, k: 3120, lv: 29 }, wins: 4, runs: 23 };

t("v1 → v2 conserva monedas, Taller, mapas, récords, victorias, partidas y personaje", () => {
  const st = new FakeStorage({ [PROFILE_KEY]: JSON.stringify(V1), "gdl-music": "1" });
  const p = loadProfile(st);
  assert.equal(p.v, 2);
  assert.equal(p.coins, 437);
  assert.deepEqual(p.up, V1.up);
  assert.deepEqual(p.maps, V1.maps);
  assert.deepEqual(p.best, V1.best);
  assert.equal(p.wins, 4); assert.equal(p.runs, 23); assert.equal(p.who, "rocio");
  assert.deepEqual(p.story, { cap: 0, done: {} });
  assert.deepEqual(p.unlock, {});
  // quedó grabado como v2 y el original se guardó aparte
  const saved = JSON.parse(st.getItem(PROFILE_KEY));
  assert.equal(saved.v, 2); assert.equal(saved.coins, 437);
  assert.deepEqual(JSON.parse(st.getItem(BACKUP_KEYS.v1)), V1);
  assert.equal(st.getItem("gdl-music"), "1");
});

t("cargar dos veces no cambia nada ni pisa la copia de v1", () => {
  const st = new FakeStorage({ [PROFILE_KEY]: JSON.stringify(V1) });
  const a = loadProfile(st), b = loadProfile(st);
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(st.getItem(BACKUP_KEYS.v1)), V1);
});

t("guardar y volver a cargar un v2 da lo mismo", () => {
  const st = new FakeStorage();
  const p = loadProfile(st);
  assert.deepEqual(p, freshProfile());
  p.coins = 99; p.story.cap = 3; p.story.done.prologo = { t: 88 }; p.unlock["skin:bielli"] = true; p.maps.abuela = true;
  saveProfile(p, st);
  assert.deepEqual(loadProfile(st), p);
});

t("un perfil roto no se pierde: queda copiado aparte", () => {
  const st = new FakeStorage({ [PROFILE_KEY]: "{esto no es json" });
  const p = loadProfile(st);
  assert.deepEqual(p, freshProfile());
  assert.equal(st.getItem(BACKUP_KEYS.broken), "{esto no es json");
});

t("una versión futura no se rebaja ni pierde campos", () => {
  const st = new FakeStorage({ [PROFILE_KEY]: JSON.stringify({ ...V1, v: 3, nuevo: { x: 1 }, story: { cap: 5, done: { a: true }, extra: 2 } }) });
  const p = loadProfile(st);
  assert.equal(p.v, 3); assert.deepEqual(p.nuevo, { x: 1 }); assert.equal(p.story.cap, 5); assert.equal(p.story.extra, 2); assert.equal(p.coins, 437);
});

t("valores sucios se limpian sin romper", () => {
  const p = migrate({ v: 1, who: "linda", coins: -5, up: { hp: 9, dmg: "2", spd: null }, maps: null, best: null, wins: "x", runs: 2.7 });
  assert.equal(p.who, null); assert.equal(p.coins, 0); assert.deepEqual(p.up, { hp: 5, dmg: 2, spd: 0, mag: 0 });
  assert.deepEqual(p.maps, { plaza: true }); assert.deepEqual(p.best, { t: 0, k: 0, lv: 0 }); assert.equal(p.wins, 0); assert.equal(p.runs, 2);
  assert.equal(migrate({ v: 0 }), null); assert.equal(migrate(null), null); assert.equal(migrate("hola"), null);
});

t("código de respaldo: exportar e importar da el mismo perfil", () => {
  const p = migrate(V1); p.story.done.prologo = true; p.who = "thomas";
  const code = exportCode(p);
  assert.match(code, /^GDL2\.[A-Za-z0-9_-]+\.[0-9a-z]+$/);
  assert.deepEqual(importCode(code), p);
  // con espacios o saltos de línea en el medio (pegado desde WhatsApp) también anda
  assert.deepEqual(importCode(code.slice(0, 20) + "\n " + code.slice(20) + " "), p);
});

t("código de respaldo con un perfil v1 adentro se migra", () => {
  const json = JSON.stringify(V1);
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
  const code = "GDL1." + Buffer.from(json).toString("base64url") + "." + fnv(json);
  const p = importCode(code);
  assert.equal(p.v, 2); assert.equal(p.coins, 437); assert.deepEqual(p.up, V1.up);
});

t("código cortado o cambiado se rechaza con un mensaje", () => {
  const code = exportCode(migrate(V1));
  assert.throws(() => importCode(code.slice(0, -6)), /cortado|dañado|no es de Gatos/);
  assert.throws(() => importCode(code.replace("GDL2.e", "GDL2.f")), /cortado|dañado/);
  assert.throws(() => importCode("hola"), /no es de Gatos de Linda/);
  assert.throws(() => importCode(""), /no es de Gatos de Linda/);
});

t("nombres con tildes sobreviven al código", () => {
  const p = migrate(V1); p.story.nota = "Rocío y el ñandú";
  assert.equal(importCode(exportCode(p)).story.nota, "Rocío y el ñandú");
});

// navigator.storage.persist() se pide una sola vez y sin romper si no existe
let asked = 0;
await requestPersist({ storage: { persisted: async () => false, persist: async () => { asked++; return true; } } });
await requestPersist({ storage: { persisted: async () => false, persist: async () => { asked++; return true; } } });
assert.equal(asked, 1); ok++; console.log("ok - navigator.storage.persist() se pide una sola vez");

console.log(`\n${ok} pruebas de guardado en verde`);
