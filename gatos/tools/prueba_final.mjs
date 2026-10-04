// Prueba final de la integración (historia + dinámica + gráficos) en Chromium real, tamaño de celu (390 x 844).
// Necesita:  python3 -m http.server <puerto> (dentro de gatos/)  y  npx peer --port 9000
// Uso: URL=http://127.0.0.1:8811/ PEER=127.0.0.1:9000 node prueba_final.mjs   (PARTES=solo,duo)
// Solo: título, menú, arcade 2 minutos en la Plaza (con Maitena desbloqueada: el botón es el mismo de la historia),
//       prólogo completo y capítulo 1 hasta el primer diálogo.
// De a dos (dos contextos del mismo navegador, uno solo abierto a la vez): arcade 1 minuto (Maitena la desbloqueó
//       solo la invitada y aparece igual para los dos) y capítulo 5 (Luz) completo.
// Capturas: SHOTS/final-*.png (por defecto gatos-dev/capturas). Falla si hay errores en la consola.
import assert from "assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.URL || "http://127.0.0.1:8811/", PEER = process.env.PEER || "127.0.0.1:9000";
const SHOTS = process.env.SHOTS || path.resolve(HERE, "../../../../gatos-dev/capturas");
const PARTES = (process.env.PARTES || "solo,duo").split(",");
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = 0; const pass = m => { ok++; console.log("ok -", m); };
fs.mkdirSync(SHOTS, { recursive: true });
const profile = (who, cap, extra = {}) => ({ v: 2, who, coins: 0, up: { hp: 0, dmg: 0, spd: 0, mag: 0 }, maps: { plaza: true }, best: { t: 0, k: 0, lv: 0 }, wins: 0, runs: 9, story: { cap, done: {} }, unlock: {}, ...extra });

let BROWSER = null; const ctxs = [];
async function newPage(name, prof) {
  if (!BROWSER || !BROWSER.isConnected()) BROWSER = await chromium.launch({ executablePath: chromePath(), headless: true });
  const ctx = await BROWSER.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); ctxs.push(ctx);
  await ctx.addInitScript(p => { if (!sessionStorage.getItem("gdl-set")) { localStorage.setItem("gdl-profile", JSON.stringify(p)); localStorage.setItem("gdl-music", "0"); localStorage.setItem("gdl-mute", "1"); sessionStorage.setItem("gdl-set", "1"); } }, prof);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" && !/favicon\.ico/.test(((m.location() || {}).url || "") + m.text())) errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`${name} pageerror: ${e.message}`));
  return page;
}
const g = (page, fn, arg) => page.evaluate(fn, arg);
const snapOf = page => g(page, () => { const s = window.__g().snap; return s ? { st: s.st, t: s.t, cap: s.cap, dlg: s.dlg, goal: s.goal, boss: s.boss, mai: s.mai, md: s.md, kl: s.kl, P: s.P } : null; });
const screenOf = page => g(page, () => document.body.dataset.screen);
const snapPng = (page, name) => page.screenshot({ path: path.join(SHOTS, `final-${name}.png`) });

// bot dentro de la página (anfitrión: lee la simulación; invitado: sigue al anfitrión con la foto)
async function startBot(page, mode = "host") {
  await g(page, m => {
    if (window.__bot) clearInterval(window.__bot);
    window.__bot = setInterval(() => {
      const G = window.__g(); if (!G || !G.snap || G.snap.st !== "run") { if (G && G.input) G.input.dir = { x: 0, y: 0 }; return; }
      let fx = 0, fy = 0, dash = false;
      const add = (x, y, w) => { const d = Math.hypot(x, y) || 1; fx += x / d * w; fy += y / d * w; };
      if (m === "guest") {
        const s = G.snap, me = s.P.guest, h = s.P.host; if (!me || !h) return;
        const d = Math.hypot(h.x - me.x, h.y - me.y);
        if (h.d) add(h.x - me.x, h.y - me.y, 3); else if (d > 14) add(h.x + 10 - me.x, h.y - me.y, d > 40 ? 2 : 0.8);
        for (let i = 0; i < s.E.length; i += 6) { const ex = s.E[i + 2], ey = s.E[i + 3], dd = Math.hypot(me.x - ex, me.y - ey); if (dd < 40 && s.E[i + 1] !== 10) add(me.x - ex, me.y - ey, 40 / dd * 0.6); }
        const m2 = Math.hypot(fx, fy); G.input.dir = m2 > 0.05 ? { x: fx / m2, y: fy / m2 } : { x: 0, y: 0 }; return;
      }
      const sim = G.sim, p = sim && sim.players.host; if (!p) return;
      const other = sim.players.guest, life = p.hp / p.maxHp;
      for (const e of sim.enemies) { if (e.hp <= 0 || e.type === "caja" || e.type === "premio" || e.surr) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, boss = !!(e.type === "luz2" || e.type === "canicheBoss" || e.type === "luz" || e.type === "linda"); if (d < (boss ? 80 : 60)) add(dx, dy, (boss ? 3 : 1) * 900 / (d * d)); if ((e.st === 1 || e.st === 2) && d < 90) dash = dash || d < 34; }
      for (const h of sim.eproj) { const d = Math.hypot(p.x - h.x, p.y - h.y); if (d < 50) add(p.x - h.x, p.y - h.y, 3); }
      for (const z of sim.hz) if (Math.abs(p.y - z.y) < z.h + 22) fy += Math.sign(p.y - z.y || 1) * 4;
      for (const W of sim.waves || []) { const r = W.R * Math.min(1, W.t / W.dur), d = Math.hypot(p.x - W.x, p.y - W.y); if (d > r && d - r < 22) dash = true; }
      let gem = null, gd = 120 * 120; for (const q of sim.gems) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < gd) { gd = d; gem = q; } } if (gem) add(gem.x - p.x, gem.y - p.y, 0.6);
      const go = sim.goal; let tx = null, ty = null, w = 0, tol = 10;
      if (go && !go.done) {
        const aim = go.aim;
        if (go.k === "escort" && go.ally) { const A = go.ally; if (A.cry) { tx = A.x; ty = A.y; w = 4; tol = 8; } else { const nx = go.path[go.wp] || A, dx = nx.x - A.x, dy = nx.y - A.y, mm = Math.hypot(dx, dy) || 1; tx = A.x + dx / mm * 20 - 10; ty = A.y + dy / mm * 20; w = 2.6; tol = 14; } }
        else if (go.k === "boss" && go.boss && go.boss.st === 1 && go.boss.type === "luz2") { const P = sim.players[go.boss.mk]; if (other && P && P !== p) { tx = P.x; ty = P.y; w = 6; tol = 4; } else if (!other) { const c = sim.points().cucha; if (c) { tx = c.x; ty = c.y; w = 6; tol = 6; } } }
        else if (aim && go.k !== "boss") { tx = aim.x; ty = aim.y; w = go.k === "defend" ? 1.6 : 2.2; tol = go.k === "defend" || go.k === "protect" ? 34 : 6; }
      }
      if (tx !== null) { const d = Math.hypot(tx - p.x, ty - p.y); if (d > tol) add(tx - p.x, ty - p.y, w * (life > 0.5 ? 1 : life > 0.3 ? 0.45 : 0.12)); }
      if (other) { const d = Math.hypot(other.x - p.x, other.y - p.y); if (other.downed) add(other.x - p.x, other.y - p.y, 3); else if (d > 60) add(other.x - p.x, other.y - p.y, 0.8); }
      const b = sim.cfg.b; add((b[0] + b[2]) / 2 - p.x, (b[1] + b[3]) / 2 - p.y, 0.25);
      const mm = Math.hypot(fx, fy); G.input.dir = mm > 0.05 ? { x: fx / mm, y: fy / mm } : { x: 0, y: 0 };
      if (dash) G.input.dashPressed = true;
      if (p.ult >= 1) G.input.ultPressed = true;
    }, 33);
  }, mode);
}
async function tend(page) {
  const box = await page.$("#dialog:not([hidden]) .dlgbox");
  if (box) { const os = await page.$$("#dialog .dlgopts button"); if (os.length) await (os[1] || os[0]).click().catch(() => {}); else await box.click().catch(() => {}); return "dlg"; }
  const lv = await page.$('#levelup:not([hidden]) [data-act="pick"]'); if (lv) { await sleep(380); await lv.click().catch(() => {}); return "lv"; }
  return null;
}
// juega `secs` segundos reales atendiendo diálogos y subidas de nivel; devuelve lo que vio
async function playFor(pages, secs, onTick) {
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) { for (const p of pages) await tend(p); if (onTick) await onTick(); await sleep(150); }
}
const bannerText = page => g(page, () => { const b = document.getElementById("banner"); return b && b.classList.contains("on") ? document.getElementById("btitle").textContent + " / " + document.getElementById("bsub").textContent : ""; });

try {
  if (PARTES.includes("solo")) {
    const page = await newPage("solo", profile("thomas", 0, { unlock: { "special:maitena": true } }));
    await page.goto(BASE + "?debug"); await sleep(1500);
    await snapPng(page, "titulo"); pass("título");
    await page.click('[data-act="start"]'); await sleep(800);
    assert.match(await page.textContent("#ui"), /Especial Llamá a Maitena/, "el menú muestra lo desbloqueado");
    await snapPng(page, "menu"); pass("menú (con lo desbloqueado en la historia)");
    // arcade 2 minutos en la Plaza
    await page.click('[data-act="who"][data-v="thomas"]').catch(() => {});
    await page.click('[data-act="solo"]'); await sleep(500);
    assert.match(await page.textContent("#ui"), /metas/i, "sala con metas del mapa");
    await snapPng(page, "sala-solo");
    await page.click('[data-act="go"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.st);
    await startBot(page, "host");
    let maiShown = false, maiCalled = false, shot1 = false;
    await playFor([page], 120, async () => {
      const s = await snapOf(page);
      if (s && s.mai && !maiShown) maiShown = await g(page, () => !document.getElementById("maibtn").hidden);
      if (s && s.t > 60 && !shot1) { shot1 = true; await snapPng(page, "arcade-solo-1min"); }
      if (s && s.t > 45 && !maiCalled && s.st === "run") {
        // la carga del arcade es larga (MAITENA.kills): se adelanta para tocar el botón de verdad
        await g(page, () => { const { sim } = window.__g(); sim.mai.base = sim.kills - sim.mai.need; }); await sleep(400);
        const b = await page.$("#maibtn.ready:not([hidden])");
        if (b) { await b.dispatchEvent("pointerdown", { bubbles: true }); await sleep(250); maiCalled = await g(page, () => { const s = window.__g().snap; return !!(s && s.mai && s.mai[2]); }) || /Maitena/.test(await bannerText(page)); if (maiCalled) { await sleep(500); await snapPng(page, "arcade-solo-maitena"); } }
      }
    });
    const s2 = await snapOf(page);
    console.log("   (arcade solo: reloj " + Math.round(s2.t) + " s, estado " + s2.st + ")");
    assert.ok(maiShown, "botón de Maitena en el arcade"); assert.ok(maiCalled, "se pudo llamar a Maitena desde el botón");
    assert.ok(s2.t >= 110 && ["run", "levelup", "over"].includes(s2.st), "la partida siguió " + s2.t + " " + s2.st);
    await snapPng(page, "arcade-solo-2min");
    pass(`arcade solo 2 minutos en la Plaza: reloj en ${Math.round(s2.t)} s, ${s2.kl} gatos, botón de Maitena visible y usado`);
    await page.keyboard.press("Escape"); await sleep(300); await snapPng(page, "pausa"); await page.click('[data-act="quit"]'); await sleep(600);
    // prólogo completo
    await page.click('[data-act="story"]'); await page.waitForSelector(".capc");
    await snapPng(page, "capitulos");
    await page.click('[data-act="storysolo"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
    await sleep(1500); await snapPng(page, "prologo-dialogo");
    await startBot(page, "host");
    let pshot = false; const t0 = Date.now();
    while (Date.now() - t0 < 400000 && (await screenOf(page)) !== "results") { await tend(page); const s = await snapOf(page); if (s && s.st === "run" && s.t > 40 && !pshot) { pshot = true; await snapPng(page, "prologo-juego"); } await sleep(150); }
    assert.match(await page.textContent(".results h2"), /Capítulo superado/);
    await snapPng(page, "prologo-resultado");
    pass(`prólogo completo solo en ${Math.round((Date.now() - t0) / 1000)} s reales`);
    // capítulo 1 hasta el primer diálogo
    await page.click('[data-act="next"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.cap === "plaza" && window.__g().snap.st === "dialog");
    await sleep(1500); const d1 = await snapOf(page); await snapPng(page, "cap1-dialogo");
    assert.equal(d1.dlg.id, "intro");
    pass("capítulo 1 hasta el primer diálogo (" + d1.dlg.who + ")");
    for (const c of ctxs.splice(0)) await c.close();
  }

  if (PARTES.includes("duo")) {
    const q = `?debug&peer=${PEER}`;
    // arcade 1 minuto: solo la invitada desbloqueó a Maitena; el botón aparece igual para los dos
    const host = await newPage("anfitrión", profile("thomas", 0)), guest = await newPage("invitada", profile("rocio", 5, { unlock: { "special:maitena": true } }));
    await host.goto(BASE + q); await guest.goto(BASE + q);
    await host.click('[data-act="start"]'); await host.click('[data-act="create"]');
    await host.waitForSelector(".room .code"); const code = (await host.textContent(".room .code")).trim();
    await guest.click('[data-act="start"]'); await guest.fill("#code", code); await guest.click('[data-act="join"]');
    await host.waitForFunction(() => window.__g().me.connected && window.__g().me.partner === "rocio");
    await sleep(500); await snapPng(host, "sala-duo");
    await host.click('[data-act="go"]');
    await host.waitForFunction(() => window.__g().snap && window.__g().snap.st);
    await guest.waitForFunction(() => window.__g().snap && window.__g().snap.st);
    await startBot(host, "host"); await startBot(guest, "guest");
    let gMai = false;
    await playFor([host, guest], 60, async () => { if (!gMai) gMai = await g(guest, () => !document.getElementById("maibtn").hidden); });
    const sh = await snapOf(host), sg = await snapOf(guest);
    assert.ok(sh.t >= 50, "reloj del anfitrión " + sh.t); assert.ok(Math.abs(sh.t - sg.t) < 2, "el invitado recibe la foto");
    assert.ok(sh.mai && gMai, "Maitena habilitada para los dos (la desbloqueó la invitada)");
    await snapPng(host, "arcade-duo-anfitrion"); await snapPng(guest, "arcade-duo-invitada");
    pass(`arcade de a dos 1 minuto: reloj ${Math.round(sh.t)} s en los dos celus, ${sh.kl} gatos, Maitena en los dos`);
    await host.keyboard.press("Escape"); await host.click('[data-act="quit"]'); await sleep(800);
    // capítulo 5 completo
    await host.click('[data-act="story"]'); await host.waitForSelector(".capc");
    await host.click('.capc[data-v="abuela"]'); await sleep(300);
    await host.click('[data-act="go"]');
    await host.waitForFunction(() => window.__g().snap && window.__g().snap.cap === "abuela");
    await guest.waitForFunction(() => window.__g().snap && window.__g().snap.cap === "abuela");
    await sleep(1500); await snapPng(guest, "cap5-dialogo-invitada");
    await startBot(host, "host"); await startBot(guest, "guest");
    let sawStun = false, bossShot = false; const t0 = Date.now();
    while (Date.now() - t0 < 600000) {
      if ((await screenOf(host)) === "results" && (await screenOf(guest)) === "results") break;
      const s = await snapOf(host);
      if (!sawStun) sawStun = await g(host, () => { const L = window.__g().sim && window.__g().sim.enemies.find(e => e.type === "luz2"); return !!(L && L.st === 3); });
      if (sawStun && !bossShot && s && s.st === "run") { bossShot = true; await snapPng(host, "cap5-luz-aturdida"); }
      await tend(host); await tend(guest); await sleep(120);
    }
    assert.match(await host.textContent(".results h2"), /Capítulo superado/); assert.match(await guest.textContent(".results h2"), /Capítulo superado/);
    assert.ok(sawStun, "Luz se frenó con la pareja pegada");
    await snapPng(host, "cap5-resultado-anfitrion"); await snapPng(guest, "cap5-resultado-invitada");
    pass(`capítulo 5 de a dos completo en ${Math.round((Date.now() - t0) / 1000)} s reales: Luz aturdida por la pareja, se rinde, los dos lo ganan`);
    for (const c of ctxs.splice(0)) await c.close();
  }
} finally {
  if (BROWSER) await BROWSER.close();
}
if (errors.length) { console.log("ERRORES EN CONSOLA:\n" + errors.join("\n")); process.exit(1); }
console.log(`\n${ok} pasos de la prueba final en verde, sin errores en consola · capturas en ${SHOTS}/final-*.png`);
