// Arma una copia instrumentada del motor (../js/engine.js, o el archivo que diga ENGINE) en .gen/engine_inst.mjs.
// No cambia ninguna regla: solo agrega this._src (quién pega), this._h (qué lastima al jugador) y avisos fuera de cámara.
// Si un parche no encuentra su línea, falla: así nos enteramos cuando el motor cambió.
// Uso: node make_inst.mjs [ruta del motor]   (lo llama solo bot.mjs; no hace falta correrlo a mano)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENGINE = path.resolve(HERE, "../js/engine.js");

// cada parche es [buscar, reemplazar] o una lista de variantes [[buscar, reemplazar], ...] (la primera que aparezca)
const PATCHES = [
  ["z.ph.add(p.side); p.inv = 0; this.hurt(p, z.dmg, true); }", "z.ph.add(p.side); p.inv = 0; this._h = 'peligro'; this.hurt(p, z.dmg, true); }"],
  ["z.hit.add(e.id); this.damage(", "z.hit.add(e.id); this._src = 'peligro'; this.damage("],
  ["if (p.inv <= 0 && d2(p, e) < rr * rr) this.hurt(p, dmg);", "if (p.inv <= 0 && d2(p, e) < rr * rr) { this._h = e.type + (e.elite ? '*' : ''); this.hurt(p, dmg); }"],
  ...["patada", "medialuna", "mate", "bondi", "rodillo", "torta"].map(w => [`    if (W.${w} && this.cd(`, `    this._src = '${w}'; if (W.${w} && this.cd(`]),
  ["    if (W.juli) {", "    this._src = 'juli'; if (W.juli) {"],
  ["    if (W.romero) {", "    this._src = 'romero'; if (W.romero) {"],
  ["  ultimate(p) {\n    p.ult = 0;", "  ultimate(p) {\n    p.ult = 0; this._src = 'especial'; this._ults = (this._ults || 0) + 1;"],
  ["dmg: 55 * k, own: p.side });", "dmg: 55 * k, own: p.side, ult: 1 });"],
  ["for (const b of this.proj) {\n      b.life", "for (const b of this.proj) {\n      this._src = b.k === 0 ? 'medialuna' : 'rodillo'; b.life"],
  ["for (const pl of this.pools) {", "for (const pl of this.pools) { this._src = 'mate';"],
  ["for (const bm of this.bombs) {\n      bm.t += dt;", "for (const bm of this.bombs) {\n      this._src = bm.ult ? 'especial' : 'torta'; bm.t += dt;"],
  ["for (const bus of this.buses) {", "for (const bus of this.buses) { this._src = 'bondi';"],
  ["if (d2(h, p) < 49) { this.hurt(p, h.dmg);", "if (d2(h, p) < 49) { this._h = h.k ? 'escupida' : 'bola de pelo'; this.hurt(p, h.dmg);"],
  ["if (d2(p, z) < z.r * z.r) this.hurt(p, z.dmg);", "if (d2(p, z) < z.r * z.r) { this._h = 'zona de Linda'; this.hurt(p, z.dmg); }"],
  ["this.near(p.x, p.y, 150, e => { if (!this.foe(e)) return;", "this._src = 'manguera'; this.near(p.x, p.y, 150, e => { if (!this.foe(e)) return;"],
  // telegrafía fuera de cámara: ¿el que recibe el ataque ve al gato cuando avisa?
  ["else if (m < 125 && e.cd <= 0 && this.eproj.length < 48) { e.st = 1; e.stT = 0.6; spd = 0; }", "else if (m < 125 && e.cd <= 0 && this.eproj.length < 48) { e.st = 1; e.stT = 0.6; spd = 0; this._tele('spit', e, tgt); }"],
  ["else if ((e.cd -= dt) <= 0 && m < 85) { e.st = 1;", "else if ((e.cd -= dt) <= 0 && m < 85) { this._tele('salto', e, tgt); e.st = 1;"],
  ["  hurt(p, dmg, force) {", "  _tele(k, e, p) { const v = this.view[p.side]; const off = !v || Math.abs(e.x - p.x) > v.hw || Math.abs(e.y - p.y) > v.hh; const T = this._tl || (this._tl = {}); const o = T[k] || (T[k] = { n: 0, off: 0 }); o.n++; if (off) o.off++; }\n  hurt(p, dmg, force) {"]
];

export function instrument(src) {
  let s = src;
  for (const p of PATCHES) {
    const variants = Array.isArray(p[0]) ? p : [p];
    const hit = variants.find(([a]) => s.split(a).length - 1 === 1);
    if (!hit) throw new Error("make_inst: parche no encontrado o ambiguo: " + variants[0][0].slice(0, 90));
    s = s.replace(hit[0], () => hit[1]);
  }
  return s;
}

// genera el archivo instrumentado y devuelve su ruta (escritura atómica: varios procesos pueden llamarlo a la vez)
export function build(engine = process.env.ENGINE || DEFAULT_ENGINE) {
  const src = fs.readFileSync(engine, "utf8");
  const out = instrument(src);
  const dir = path.join(HERE, ".gen"); fs.mkdirSync(dir, { recursive: true });
  const tag = engine === DEFAULT_ENGINE ? "" : "_" + Buffer.from(path.resolve(engine)).toString("base64url").slice(-24);
  const file = path.join(dir, `engine_inst${tag}.mjs`);
  const head = "// COPIA INSTRUMENTADA de " + engine + " (generada por make_inst.mjs, no editar)\n";
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== head + out) {
    const tmp = file + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, head + out); fs.renameSync(tmp, file);
  }
  return file;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("ok", build(process.argv[2] ? path.resolve(process.argv[2]) : undefined));
}
