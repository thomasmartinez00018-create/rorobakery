// Prueba real del modo historia en Chromium (headless, tamaño de celu), con un bot simple adentro de la página que
// mueve el joystick (no toca la simulación): juega el prólogo y el capítulo 1 completos solo, el capítulo 5 de a dos
// en dos contextos separados (un solo navegador) con PeerServer local (diálogos sincronizados, objetivo, aliados, fin de capítulo) y
// arranca los demás capítulos para sacar capturas. Falla si aparece cualquier error en la consola.
// Necesita:  python3 -m http.server 8834   (dentro de gatos/)   y   npx peer --port 9000
// Uso: URL=http://127.0.0.1:8834/ PEER=127.0.0.1:9000 node test_historia_nav.mjs   (PARTES=solo,duo,capturas)
// Capturas: gatos-dev/capturas/historia-<n>.png (izquierda: diálogo de la intro; derecha: un momento de juego).
import assert from "assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.URL || "http://127.0.0.1:8834/", PEER = process.env.PEER || "127.0.0.1:9000";
const SHOTS = process.env.SHOTS || path.resolve(HERE, "../../../../gatos-dev/capturas");
const PARTES = (process.env.PARTES || "solo,duo,capturas").split(",");
const errors = []; let ok = 0;
const pass = msg => { ok++; console.log("ok -", msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(SHOTS, { recursive: true });

const profile = (who, cap, extra = {}) => ({ v: 2, who, coins: 0, up: { hp: 0, dmg: 0, spd: 0, mag: 0 }, maps: { plaza: true }, best: { t: 0, k: 0, lv: 0 }, wins: 0, runs: 9, story: { cap, done: {} }, unlock: {}, ...extra });
// un solo navegador a la vez (la Mac es compartida): de a dos, cada celu es un contexto separado del mismo navegador
let BROWSER = null;
async function newPage(name, prof) {
  if (!BROWSER || !BROWSER.isConnected()) BROWSER = await chromium.launch({ executablePath: chromePath(), headless: true });
  const browser = BROWSER;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(p => { if (!sessionStorage.getItem("gdl-set")) { localStorage.setItem("gdl-profile", JSON.stringify(p)); localStorage.setItem("gdl-music", "0"); sessionStorage.setItem("gdl-set", "1"); } }, prof);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" && !/favicon\.ico/.test(((m.location() || {}).url || "") + m.text())) errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`${name} pageerror: ${e.message}`));
  page._browser = { close: () => ctx.close() };
  return page;
}
const g = (page, fn, arg) => page.evaluate(fn, arg);
const snapOf = page => g(page, () => { const G = window.__g(), s = G.snap; return s ? { st: s.st, t: s.t, cap: s.cap, dlg: s.dlg, goal: s.goal, A: s.A, boss: s.boss, P: s.P, hn: s.hn, tk: s.tk, mai: s.mai } : null; });
const screenOf = page => g(page, () => document.body.dataset.screen);

// bot adentro de la página: mueve el joystick del que juega en ese celu (anfitrión: lee la simulación; invitado:
// solo la foto). Esquiva gatos, peligros y ondas, va al objetivo y se pega a la pareja.
async function startBot(page, mode = "host") {
  await g(page, m => {
    if (window.__bot) clearInterval(window.__bot);
    window.__bot = setInterval(() => {
      const G = window.__g(); if (!G || !G.snap || G.snap.st !== "run") { if (G && G.input) G.input.dir = { x: 0, y: 0 }; return; }
      let fx = 0, fy = 0, dash = false;
      const add = (x, y, w) => { const d = Math.hypot(x, y) || 1; fx += x / d * w; fy += y / d * w; };
      if (m === "guest") {
        // el invitado acompaña al anfitrión (así de a dos la pareja está siempre junta)
        const s = G.snap, me = s.P.guest, h = s.P.host; if (!me || !h) return;
        const d = Math.hypot(h.x - me.x, h.y - me.y);
        if (h.d) add(h.x - me.x, h.y - me.y, 3); else if (d > 14) add(h.x + 10 - me.x, h.y - me.y, d > 40 ? 2 : 0.8);
        for (let i = 0; i < s.E.length; i += 6) { const ex = s.E[i + 2], ey = s.E[i + 3], dd = Math.hypot(me.x - ex, me.y - ey); if (dd < 40 && s.E[i + 1] !== 10) add(me.x - ex, me.y - ey, 40 / dd * 0.6); }
        const m2 = Math.hypot(fx, fy); G.input.dir = m2 > 0.05 ? { x: fx / m2, y: fy / m2 } : { x: 0, y: 0 }; return;
      }
      const sim = G.sim, p = sim && sim.players.host; if (!p) return;
      const other = sim.players.guest, life = p.hp / p.maxHp;
      for (const e of sim.enemies) { if (e.hp <= 0 || e.type === "caja" || e.type === "premio" || e.surr) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, boss = !!(e.type === "luz2" || e.type === "canicheBoss"); if (d < (boss ? 80 : 60)) add(dx, dy, (boss ? 3 : 1) * 900 / (d * d)); if ((e.st === 1 || e.st === 2) && d < 40) dash = true; }
      for (const h of sim.eproj) { const d = Math.hypot(p.x - h.x, p.y - h.y); if (d < 50) add(p.x - h.x, p.y - h.y, 3); }
      for (const z of sim.hz) if (Math.abs(p.y - z.y) < z.h + 22) fy += Math.sign(p.y - z.y || 1) * 4;
      for (const W of sim.waves || []) { const r = W.R * Math.min(1, W.t / W.dur), d = Math.hypot(p.x - W.x, p.y - W.y); if (d > r && d - r < 22) dash = true; }
      let gem = null, gd = 120 * 120; for (const q of sim.gems) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < gd) { gd = d; gem = q; } } if (gem) add(gem.x - p.x, gem.y - p.y, 0.6);
      for (const k of sim.pickups) { const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < 160) { add(k.x - p.x, k.y - p.y, 1.2); break; } }
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
// toca la caja de diálogo (contesta la pregunta del comisario con la respuesta 2) y elige la primera mejora
async function tend(page) {
  const box = await page.$("#dialog:not([hidden]) .dlgbox");
  if (box) { const opt = await page.$("#dialog .dlgopts button"); if (opt) { const os = await page.$$("#dialog .dlgopts button"); await (os[1] || os[0]).click().catch(() => {}); } else await box.click().catch(() => {}); return "dlg"; }
  const lv = await page.$('#levelup:not([hidden]) [data-act="pick"]'); if (lv) { await sleep(380); await lv.click().catch(() => {}); return "lv"; }
  return null;
}
// foto de una página como buffer PNG
const shot = page => page.screenshot({ type: "png" });
// une dos capturas (intro con diálogo y juego) en una sola imagen
async function compose(page, a, b, file, label) {
  const data = await g(page, async ([a, b, label]) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    const c = document.createElement("canvas"), pad = 24; c.width = A.width + B.width + pad * 3; c.height = Math.max(A.height, B.height) + pad * 2 + 60;
    const x = c.getContext("2d"); x.fillStyle = "#0b0d1c"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(A, pad, pad + 60); x.drawImage(B, A.width + pad * 2, pad + 60);
    x.fillStyle = "#ffb938"; x.font = "bold 40px sans-serif"; x.fillText(label, pad, 52);
    return c.toDataURL("image/png").split(",")[1];
  }, [a.toString("base64"), b.toString("base64"), label]);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
}

// juega el capítulo que está corriendo hasta la pantalla de resultados; saca las dos capturas
async function playToEnd(page, label, { others = [], maxS = 600, shotAt = 25 } = {}) {
  let dlgShot = null, gameShot = null, seenAlly = new Set(), maxLv = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < maxS * 1000) {
    const sc = await screenOf(page); if (sc === "results") break;
    const s = await snapOf(page);
    if (s && s.st === "dialog" && !dlgShot && s.dlg && s.dlg.id === "intro" && s.dlg.i >= 1) { await sleep(1200); dlgShot = await shot(page); }
    if (s && s.st === "run" && !gameShot && s.t > shotAt) gameShot = await shot(page);
    if (s && s.A) for (let i = 1; i < s.A.length; i += 6) seenAlly.add(s.A[i]);
    await tend(page); for (const o of others) await tend(o);
    await sleep(120);
  }
  return { dlgShot, gameShot, seenAlly, ms: Date.now() - t0 };
}

const browsers = [];
try {
  /* ---------- 1. solo: prólogo y capítulo 1 completos ---------- */
  if (PARTES.includes("solo")) {
    const page = await newPage("solo", profile("thomas", 0)); browsers.push(page._browser);
    await page.goto(BASE + "?debug"); await page.click('[data-act="start"]');
    await page.click('[data-act="story"]');
    assert.equal(await page.$$eval(".capc", b => b.length), 9); assert.equal(await page.$$eval(".capc.locked", b => b.length), 8);
    pass("pantalla de capítulos: 9 capítulos, 8 con candado al empezar");
    await page.click('[data-act="storysolo"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
    const d0 = await snapOf(page); assert.equal(d0.cap, "prologo"); assert.equal(d0.dlg.who, "rocio");
    assert.ok(await page.$("#dialog .dlgbox img"), "retrato en el diálogo");
    await startBot(page, "host");
    let r = await playToEnd(page, "prólogo", { shotAt: 30 });
    assert.match(await page.textContent(".results h2"), /Capítulo superado/);
    let prof = await g(page, () => JSON.parse(localStorage.getItem("gdl-profile")));
    assert.equal(prof.story.cap, 1); assert.ok(prof.unlock["map:roros"]); assert.ok(prof.story.done.prologo.stars >= 1);
    assert.ok(r.seenAlly.has(15) && r.seenAlly.has(16), "el Chema y Amanda en la cocina");
    await compose(page, r.dlgShot, r.gameShot, path.join(SHOTS, "historia-0.png"), "Prólogo: La víspera");
    pass(`prólogo completo solo en ${Math.round(r.ms / 1000)} s reales: diálogo, defender, cinemática, capítulo superado y guardado (cap 1, mapa Roro's)`);
    // capítulo 1 desde "Siguiente"
    await page.click('[data-act="next"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.cap === "plaza");
    // si el bot pierde (pasa: el capítulo se puede perder), se prueba también "Reintentar", hasta 3 veces
    let tries = 1; r = await playToEnd(page, "capítulo 1", { shotAt: 40 });
    while (!/Capítulo superado/.test(await page.textContent(".results h2")) && tries < 3) {
      assert.ok(await page.$('[data-act="again"]'), "derrota con Reintentar"); assert.match(await page.textContent('[data-act="again"]'), /Reintentar/);
      await page.click('[data-act="again"]'); tries++;
      await page.waitForFunction(() => window.__g().snap && window.__g().snap.cap === "plaza" && window.__g().snap.t < 5);
      const r2 = await playToEnd(page, "capítulo 1", { shotAt: 40 }); r = { ...r2, dlgShot: r.dlgShot || r2.dlgShot, gameShot: r.gameShot || r2.gameShot };
    }
    console.log(`   (capítulo 1: intentos ${tries})`);
    assert.match(await page.textContent(".results h2"), /Capítulo superado/, "capítulo 1 ganado");
    prof = await g(page, () => JSON.parse(localStorage.getItem("gdl-profile")));
    assert.equal(prof.story.cap, 2); assert.ok(prof.story.seen["plaza:intro"]);
    assert.ok(r.seenAlly.has(11), "Carmelo dibujado como aliado");
    await compose(page, r.dlgShot, r.gameShot, path.join(SHOTS, "historia-1.png"), "Capítulo 1: El superhéroe en pijama");
    pass(`capítulo 1 completo solo en ${Math.round(r.ms / 1000)} s reales: escolta de Carmelo hasta la catedral, guardado (cap 2)`);
    // "Saltar" aparece en una escena ya vista
    await page.click('[data-act="again"]');
    await page.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
    await sleep(500); assert.ok(await page.$('#dialog [data-act="advskip"]'), "Saltar en una escena ya vista");
    await page.click('#dialog [data-act="advskip"]'); await sleep(400);
    assert.equal((await snapOf(page)).st, "run", "jugando solo, Saltar cierra la escena");
    pass("Saltar: aparece si ya se vio y cierra la escena entera");
    await page._browser.close();
  }

  /* ---------- 2. de a dos: capítulo 5 (Luz, pelea de pareja) ---------- */
  if (PARTES.includes("duo")) {
    // el anfitrión no tiene capítulos; la invitada llegó hasta el 5: se juega el máximo de los dos
    const host = await newPage("anfitrión", profile("thomas", 0)); const guest = await newPage("invitada", profile("rocio", 5));
    browsers.push(host._browser, guest._browser);
    const q = `?debug&peer=${PEER}`;
    await host.goto(BASE + q); await guest.goto(BASE + q);
    await host.click('[data-act="start"]'); await host.click('[data-act="create"]');
    await host.waitForSelector(".room .code"); const code = (await host.textContent(".room .code")).trim();
    await guest.click('[data-act="start"]'); await guest.fill("#code", code); await guest.click('[data-act="join"]');
    await host.waitForFunction(() => window.__g().me.connected && window.__g().me.partner === "rocio");
    await host.click('[data-act="story"]'); await host.waitForSelector(".capc");
    assert.equal(await host.$$eval(".capc.locked", b => b.length), 3, "capítulos 0 a 5 abiertos por la invitada");
    await host.click('.capc[data-v="abuela"]'); await sleep(300);
    assert.match(await guest.textContent(".room"), /Luz no declara/, "la invitada ve el capítulo elegido");
    await host.click('[data-act="go"]');
    await host.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
    await guest.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
    // diálogo sincronizado: el mismo renglón en los dos y espera a que toquen los dos
    const [a, b] = [await snapOf(host), await snapOf(guest)];
    assert.deepEqual([a.dlg.id, a.dlg.i], [b.dlg.id, b.dlg.i]); assert.equal(a.cap, "abuela"); assert.equal(b.cap, "abuela");
    await sleep(2600); await host.click("#dialog .dlgbox"); await sleep(250); await host.click("#dialog .dlgbox"); await sleep(500);
    assert.equal((await snapOf(host)).dlg.i, 0, "con un solo toque no avanza");
    assert.match(await host.textContent("#dlgwait"), /Esperando a tu pareja/);
    await guest.click("#dialog .dlgbox"); await sleep(250); await guest.click("#dialog .dlgbox"); await sleep(600);
    const [a2, b2] = [await snapOf(host), await snapOf(guest)]; assert.equal(a2.dlg.i, 1); assert.equal(b2.dlg.i, 1);
    pass("de a dos: sala, capítulos = máximo de los dos celus, diálogo sincronizado que espera a los dos");
    await startBot(host, "host"); await startBot(guest, "guest");
    let dlgShot = null, gameShot = null, sawMark = false, sawStun = false, sawLuzGuest = false, sawCorbata = false, goalGuest = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 600000) {
      if ((await screenOf(host)) === "results" && (await screenOf(guest)) === "results") break;
      const s = await snapOf(host), sg = await snapOf(guest);
      if (s && s.st === "dialog" && !dlgShot && s.dlg.id === "intro" && s.dlg.i >= 2) { await sleep(1200); dlgShot = await shot(host); }
      if (s && s.boss && s.boss.mk) sawMark = true;
      if (sg && sg.boss && sg.boss.n === "luz2") sawLuzGuest = true;
      if (sg && sg.goal && sg.goal.k === "boss") goalGuest = true;
      if (sg && sg.A) for (let i = 1; i < sg.A.length; i += 6) if (sg.A[i] === 12) sawCorbata = true;
      if (!sawStun) sawStun = await g(host, () => { const L = window.__g().sim && window.__g().sim.enemies.find(e => e.type === "luz2"); return !!(L && L.st === 3); });
      if (s && s.st === "run" && s.boss && s.t > 125 && !gameShot) gameShot = await shot(host);
      await tend(host); await tend(guest);
      await sleep(120);
    }
    assert.match(await host.textContent(".results h2"), /Capítulo superado/); assert.match(await guest.textContent(".results h2"), /Capítulo superado/);
    const ph = await g(host, () => JSON.parse(localStorage.getItem("gdl-profile"))), pg = await g(guest, () => JSON.parse(localStorage.getItem("gdl-profile")));
    assert.equal(ph.story.cap, 6, "el anfitrión guardó el capítulo"); assert.equal(pg.story.cap, 6, "la invitada guardó el capítulo (mensaje cap)");
    assert.ok(ph.unlock["map:abuela"] && pg.unlock["map:abuela"], "mapa de la abuela desbloqueado en los dos");
    assert.ok(sawMark && sawStun, "Luz marcó y quedó aturdida con la pareja pegada"); assert.ok(sawLuzGuest && goalGuest && sawCorbata, "la invitada ve a Luz, el objetivo y a Corbata");
    await compose(host, dlgShot, gameShot || await shot(host), path.join(SHOTS, "historia-5.png"), "Capítulo 5: Luz no declara (de a dos)");
    pass(`capítulo 5 de a dos completo en ${Math.round((Date.now() - t0) / 1000)} s reales: Luz marca, se frena con la pareja pegada, se rinde; los dos guardan el capítulo`);
    await host._browser.close(); await guest._browser.close();
  }

  /* ---------- 3. capturas de los demás capítulos ---------- */
  if (PARTES.includes("capturas")) {
    const all = { 2: "Capítulo 2: Tres trenes", 3: "Capítulo 3: ¡Gomeghooo!", 4: "Capítulo 4: Sangre de campeón", 6: "Capítulo 6: La torre blanca", 7: "Capítulo 7: La otra Linda", 8: "Epílogo: Día de la Madre" };
    const page = await newPage("capturas", profile("rocio", 8, { unlock: { "skin:roros": true }, skin: { rocio: "rocioRoros" } })); browsers.push(page._browser);
    await page.goto(BASE + "?debug"); await page.click('[data-act="start"]');
    for (const [n, label] of Object.entries(all)) {
      await page.click('[data-act="story"]');
      const id = await g(page, n => window.__storyIds ? window.__storyIds[n] : null, n);
      const cards = await page.$$(".capc"); await cards[+n].click(); await sleep(300);
      await page.click('[data-act="storysolo"]');
      await page.waitForFunction(() => window.__g().snap && window.__g().snap.st === "dialog");
      for (let i = 0; i < 2; i++) { await sleep(2600); await page.click("#dialog .dlgbox"); await sleep(200); await page.click("#dialog .dlgbox"); }
      await sleep(1800); const a = await shot(page);
      await startBot(page, "host");
      let b = null; const t0 = Date.now();
      while (Date.now() - t0 < 80000) {
        const s = await snapOf(page); const sc = await screenOf(page);
        if (sc === "results") { b = b || await shot(page); break; }
        if (s && s.st === "run" && s.t > (n === "8" ? 0 : n === "7" ? 104 : 22) && !b) { await sleep(300); b = await shot(page); break; }
        if (n === "7" && s && s.st === "run" && s.t < 100) await g(page, () => { const S = window.__g().sim; S.t = Math.max(S.t, 99.5); }); // adelanta hasta que entra la jefa
        if (n === "8" && s && s.st === "dialog" && s.dlg && s.dlg.id === "outro" && !b) { await sleep(1500); b = await shot(page); break; }
        await tend(page); await sleep(150);
      }
      assert.ok(b, "captura de juego del capítulo " + n);
      await compose(page, a, b, path.join(SHOTS, `historia-${n}.png`), label);
      void id;
      await g(page, () => { clearInterval(window.__bot); });
      // salir al menú como desde la pausa (el modal de nivel puede estar tapando el botón)
      if ((await screenOf(page)) === "run") await g(page, () => document.querySelector('[data-act="quit"]').click());
      else await page.click('[data-act="menu"]').catch(() => {});
      await sleep(300);
    }
    pass("capturas de los capítulos 2, 3, 4, 6, 7 y el epílogo (intro con diálogo y juego)");
  }
  assert.deepEqual(errors, [], "errores en la consola:\n" + errors.join("\n"));
  pass("ningún error en la consola de ninguna página");
} finally {
  for (const b of browsers) await b.close().catch(() => {});
  if (BROWSER) await BROWSER.close().catch(() => {});
}
console.log(`\n${ok} pruebas del modo historia en el navegador en verde · capturas en ${SHOTS}`);
