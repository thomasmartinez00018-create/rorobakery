// Bot headless para "Gatos de Linda" (base: bot_new.mjs). Corre partidas sin pantalla contra la copia
// instrumentada del motor (../js/engine.js, o ENGINE=ruta) y devuelve métricas de dinámica.
// Uso: import { runGame } from "./bot.mjs".
import { pathToFileURL } from "url";
import { build } from "./make_inst.mjs";
const ENG = await import(pathToFileURL(build()).href);
const { Sim, MAPS, WEAPONS, PASSIVES, EVO_OF } = ENG;
// calibración: DIFF='{"hp":1.1,"tierHp":0.05}' pisa la curva de dificultad del motor (si la tiene)
if (process.env.DIFF && ENG.DIFF) Object.assign(ENG.DIFF, JSON.parse(process.env.DIFF));
export { Sim, MAPS };

// misma lógica de movimiento que bot_new.mjs: huye ponderado de gatos y proyectiles, junta gemas, va al pedido y a la pareja
export function brain(sim, p, other) {
  let fx = 0, fy = 0;
  // cuerpo a cuerpo (Thomas): con vida, se acerca al gato más cercano para que la patada llegue
  const melee = p.weapons.patada && p.hp / p.maxHp > 0.4;
  const fr = melee ? 34 : 90;
  let ne = null, nd = 1e9;
  for (const e of sim.enemies) { if (e.hp <= 0 || e.type === "caja") continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; const boss = e.type === "luz" || e.type === "linda"; if (!boss && d < nd) { nd = d; ne = e; } if (d < (boss ? 90 : fr)) { const w = (boss ? 3 : 1) / (d * d) * 900; fx += dx / d * w; fy += dy / d * w; } }
  if (melee && ne && nd > 24 && nd < 160) { fx += (ne.x - p.x) / nd * 1.1; fy += (ne.y - p.y) / nd * 1.1; }
  for (const h of sim.eproj) { const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) || 1; if (d < 50) { fx += dx / d * 3; fy += dy / d * 3; } }
  for (const z of sim.zones) { const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy) || 1; if (d < z.r + 12) { fx += dx / d * 4; fy += dy / d * 4; } }
  for (const z of sim.hz) { if (Math.abs(p.y - z.y) < z.h + 20) fy += Math.sign(p.y - z.y || 1) * 4; }
  let g = null, bd = 1e9; for (const q of sim.gems) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd) { bd = d; g = q; } }
  if (g && bd < 120 * 120) { const d = Math.sqrt(bd) || 1; fx += (g.x - p.x) / d * 0.6; fy += (g.y - p.y) / d * 0.6; }
  // va al objeto más cercano (antes sumaba la atracción de todos: 40 monedas tiradas lo arrastraban hacia los gatos)
  let pk = null, pd = 200; for (const k of sim.pickups) { const d = Math.hypot(k.x - p.x, k.y - p.y) || 1; if (d < pd) { pd = d; pk = k; } }
  if (pk) { fx += (pk.x - p.x) / pd * 1.2; fy += (pk.y - p.y) / pd * 1.2; }
  // modo historia: se queda cerca de lo que hay que defender y va a los rastros o al destino
  const G = sim.goal, gt = G && !G.done && (G.target || (G.k === "reach" && { x: G.to[0], y: G.to[1] }) || (G.k === "escort" && G.ally) || (G.pts && G.pts.length && { x: G.pts[0][0], y: G.pts[0][1] }));
  if (gt) { const d = Math.hypot(gt.x - p.x, gt.y - p.y) || 1; if (d > (G.target ? 45 : 8)) { fx += (gt.x - p.x) / d * 1.6; fy += (gt.y - p.y) / d * 1.6; } }
  if (sim.obj) { const d = Math.hypot(sim.obj.x - p.x, sim.obj.y - p.y) || 1; fx += (sim.obj.x - p.x) / d * 1.5; fy += (sim.obj.y - p.y) / d * 1.5; }
  if (other) { const d = Math.hypot(other.x - p.x, other.y - p.y) || 1; const w = other.downed ? 3 : d > 60 ? 0.8 : 0; fx += (other.x - p.x) / d * w; fy += (other.y - p.y) / d * w; }
  const b = sim.cfg.b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2; const dc = Math.hypot(cx - p.x, cy - p.y) || 1; fx += (cx - p.x) / dc * 0.25 * (dc / 300); fy += (cy - p.y) / dc * 0.25 * (dc / 300);
  const m = Math.hypot(fx, fy); const dir = m > 0.05 ? { x: fx / m, y: fy / m } : { x: 0, y: 0 };
  // Luz marcando: los que leyeron el cartel se juntan (el hilo de corazón la frena)
  if (other && !other.downed) for (const e of sim.enemies) if (e.type === "luz" && e.st === 1) { const d = Math.hypot(other.x - p.x, other.y - p.y) || 1; if (d > 30) { fx += (other.x - p.x) / d * 3; fy += (other.y - p.y) / d * 3; } }
  let danger = false; for (const e of sim.enemies) if ((e.st === 1 || e.st === 2) && Math.hypot(e.x - p.x, e.y - p.y) < 40) danger = true;
  return { dir, dash: danger, ult: p.ult >= 1 };
}

// cómo elige mejoras: "builder" busca evoluciones, "greedy" es la de bot_new.mjs, "random" simula a quien toca sin leer,
// "casual" elige al azar ponderado por el puntaje del builder (lee rápido: casi siempre algo razonable, no siempre lo mejor)
export function choose(policy, p, opts) {
  if (policy === "random") return Math.floor(Math.random() * opts.length);
  if (policy === "greedy") { let i = opts.findIndex(x => x.kind === "w" && p.weapons[x.id]); if (i < 0) i = opts.findIndex(x => x.kind === "p" && x.id in { guantes: 1, amargo: 1, abrazo: 1, zapatillas: 1 }); return i < 0 ? 0 : i; }
  const nW = Object.keys(p.weapons).length;
  const score = o => {
    // o.cb: la tarjeta dice "Combina con ... de tu pareja" (ofertas con roles); quien lee la tarjeta la prefiere un poco
    if (o.kind === "w") { if (p.weapons[o.id]) return 10 + (p.passives[WEAPONS[o.id].evo.p] ? 2 : 0); return (nW < 4 ? 8 : 3) + (o.cb ? 2 : 0); }
    if (o.kind === "p") { const pair = EVO_OF[o.id]; if (pair && p.weapons[pair] && !p.passives[o.id]) return 9; if (pair && p.weapons[pair]) return 4; return ["guantes", "abrazo", "vendas"].includes(o.id) ? 3 : 2; }
    return 0;
  };
  if (policy === "casual") {
    const w = opts.map(o => Math.max(1, score(o))), tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot; for (let i = 0; i < w.length; i++) if ((r -= w[i]) <= 0) return i;
    return w.length - 1;
  }
  let bi = 0, bs = -1; opts.forEach((o, i) => { const s = score(o) + Math.random() * 0.1; if (s > bs) { bs = s; bi = i; } });
  return bi;
}

// exact: usa Math.random como azar del motor (para comparar bit a bit con un motor sin RNG propio)
// guion: un guion del motor (por ejemplo chapterGuion(capítulo)); en los diálogos el bot toca enseguida
// fast: arranque rápido de revancha (dinámica 4)
export function runGame({ map = "plaza", duo = true, policy = "builder", meta = {}, dt = 1 / 30, react = 0, maxT = 600, chars, seed, exact = false, guion, fast = false } = {}) {
  const sim = new Sim(map, guion, seed !== undefined ? { seed, fast } : fast ? { fast } : undefined);
  if (exact && "rnd" in sim) sim.rnd = Math.random;
  const cs = chars || (duo ? ["thomas", "rocio"] : ["thomas"]);
  sim.addPlayer("host", cs[0], meta); if (duo) sim.addPlayer("guest", cs[1], meta);
  for (const s of Object.keys(sim.players)) sim.setView(s, 195, 422);
  // instrumentación por envoltura (no toca la lógica)
  const dmgBy = {}, dmgBySide = { host: {}, guest: {}, none: {} }, taken = {}, downs = [], picks = [], evos = [], events = [];
  const origDamage = sim.damage.bind(sim);
  sim.damage = (e, dmg, p, kx, ky, raw) => { const before = e.hp; origDamage(e, dmg, p, kx, ky, raw); const d = Math.max(0, Math.min(before, before - e.hp)); const k = sim._src || "?"; dmgBy[k] = (dmgBy[k] || 0) + d; const sd = p ? p.side : "none"; dmgBySide[sd][k] = (dmgBySide[sd][k] || 0) + d; };
  const origHurt = sim.hurt.bind(sim);
  let winTaken = 0;
  sim.hurt = (p, dmg, force) => { const before = p.hp, wasDown = p.downed; origHurt(p, dmg, force); const d = Math.max(0, before - p.hp); if (d > 0) { const k = sim._h || "?"; taken[k] = (taken[k] || 0) + d; winTaken += d; } if (!wasDown && p.downed) downs.push({ t: Math.round(sim.t), side: p.side, cause: sim._h }); };
  const S = { win: [], luz: null, luzDown: null, linda: null, lvT: [], obj: [], elites: 0, chests: { evo: 0, up: 0, gold: 0 }, crates: { moneda: 0, alfajor: 0, iman: 0, manguera: 0 }, sync: 0, revives: 0, hz: 0, hzHits: 0 };
  let acc = 0, winK = 0, wEn = 0, wOn = 0, wN = 0, wMinHp = 1, lastK = 0, held = {};
  const tick = 10; // ventana de 10 s
  while (sim.state !== "over" && sim.state !== "win" && sim.t < maxT) {
    if (sim.state === "dialog") { for (const s of Object.keys(sim.players)) sim.adv(s); continue; }
    if (sim.state === "levelup") {
      for (const s of Object.keys(sim.offers)) if (sim.offers[s] && sim.offers[s].pick === null) { const o = sim.offers[s].opts, i = choose(policy, sim.players[s], o); picks.push({ t: Math.round(sim.t), side: s, ...o[i] }); sim.pick(s, i); }
      continue;
    }
    const inp = {};
    for (const [s, p] of Object.entries(sim.players)) {
      const o = Object.values(sim.players).find(q => q !== p);
      if (react > 0) { const h = held[s]; if (!h || sim.t - h.t >= react) held[s] = { t: sim.t, r: brain(sim, p, o) }; inp[s] = { ...held[s].r, ult: p.ult >= 1 }; }
      else inp[s] = brain(sim, p, o);
    }
    sim.step(dt, inp);
    for (const e of sim.ev) {
      const k = e[0];
      if (k === "levelup") S.lvT.push(Math.round(sim.t));
      else if (k === "boss") { if (e[1] === "luz") S.luz = Math.round(sim.t); else S.linda = Math.round(sim.t); }
      else if (k === "bossdown") S.luzDown = Math.round(sim.t);
      else if (k === "obj" && e[1] !== 2) S.obj.push({ t: Math.round(sim.t), ok: e[1] === 1 });
      else if (k === "elite") S.elites++;
      else if (k === "chest") { S.chests[e[2]]++; if (e[2] === "evo") evos.push({ t: Math.round(sim.t), side: e[1], w: e[3] }); }
      else if (k === "coin") S.crates.moneda++;
      else if (k === "heal") S.crates.alfajor++;
      else if (k === "vacuum") S.crates.iman++;
      else if (k === "splash") S.crates.manguera++;
      else if (k === "sync") S.sync++;
      else if (k === "revive") S.revives++;
      else if (k === "warn") S.hz++;
      else if (k === "mark") S.marks = (S.marks || 0) + 1;      // dinámica 2: cargas de Luz
      else if (k === "stun") S.stuns = (S.stuns || 0) + 1;      // dinámica 2: Luz frenada por la pareja
      else if (k === "second") S.second = Math.round(sim.t);   // dinámica 8
    }
    sim.ev = [];
    // muestreo por ventana
    let on = 0; const al = sim.alive();
    for (const e of sim.enemies) { if (e.type === "caja") continue; for (const p of al) if (Math.abs(e.x - p.x) < 98 && Math.abs(e.y - p.y) < 211) { on++; break; } }
    wEn += sim.enemies.length; wOn += on; wN++;
    for (const p of Object.values(sim.players)) wMinHp = Math.min(wMinHp, p.downed ? 0 : p.hp / p.maxHp);
    acc += dt;
    if (acc >= tick) { S.win.push({ t: Math.round(sim.t), k: sim.kills - lastK, dt: Math.round(winTaken), en: Math.round(wEn / wN), on: Math.round(wOn / wN), minHp: Math.round(wMinHp * 100) / 100, lv: sim.level }); acc = 0; lastK = sim.kills; winTaken = 0; wEn = wOn = wN = 0; wMinHp = 1; }
  }
  const ps = Object.values(sim.players);
  const tier = MAPS[map].tier;
  // monedas: con la fórmula del motor si la tiene (dinámica 9), si no la de antes
  const S2 = sim.stats || {};
  const earned = ENG.coinsFor ? ENG.coinsFor({ co: sim.coins, kl: sim.kills, t: sim.t, win: sim.state === "win" || !!S2.won, tier, second: !!S2.second, hot: !!sim.hot })
    : Math.round((sim.coins + Math.floor(sim.kills / 12) + Math.floor(sim.t / 20) + (sim.state === "win" ? 60 : 0)) * (1 + tier * 0.12));
  return {
    map, duo, policy, state: sim.state, t: Math.round(sim.t), lv: sim.level, kills: sim.kills, coinsRun: sim.coins, earned,
    downs, dmgBy, dmgBySide, taken, picks, evos, S, ults: sim._ults || 0, tele: sim._tl || {},
    stats: sim.stats || null, metas: sim.metas ? sim.metas() : null,
    build: ps.map(p => ({ c: p.char, w: { ...p.weapons }, pa: { ...p.passives }, evo: Object.keys(p.evo) }))
  };
}
