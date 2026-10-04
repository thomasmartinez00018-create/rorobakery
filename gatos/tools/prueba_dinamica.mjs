// Prueba en navegador real de la dinámica del arcade (Chromium de Playwright, headless, tamaño de celu).
//   python3 -m http.server 8823        (dentro de gatos/, en otra terminal)
//   URL=http://127.0.0.1:8823/ OUT=carpeta node prueba_dinamica.mjs
// 1) Una partida de 2 minutos reales jugando solo con el teclado: ningún error en la consola.
// 2) Capturas de los carteles nuevos (OUT/dinamica-*.png): sala con metas y alcancía, arranque rápido, Luz que marca
//    y se frena, eventos de mitad de partida de los 7 mapas, gato ladrón, combo de pareja, aviso del especial de la
//    pareja, Maitena, flecha roja de aviso fuera de cámara, segunda chance, resultados con metas y "ver más".
// Para llegar rápido a cada momento se usa ?debug (window.__g) y se adelanta el reloj del motor.
import assert from "assert/strict";
import fs from "fs";
import path from "path";
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";

const BASE = process.env.URL || "http://127.0.0.1:8823/", OUT = process.env.OUT || "out";
const LONG = +(process.env.LARGA || 120); // segundos reales de la partida larga
fs.mkdirSync(OUT, { recursive: true });
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const shots = [];
const PROF = { v: 2, who: "thomas", coins: 900, up: { hp: 0, dmg: 0, spd: 0, mag: 0 }, maps: { plaza: true, estacion: true, feria: true, bielli: true, cancha: true, tortugas: true, terrazas: true }, best: { t: 300, k: 2000, lv: 20 }, wins: 1, runs: 6, story: { cap: 4, done: {} }, unlock: { "special:maitena": true }, arcade: { alc: 1350, metas: { plaza: [1, 0, 0] }, win1: {}, opt: {} } };

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
async function newPage(name) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(p => { if (!localStorage.getItem("gdl-profile")) localStorage.setItem("gdl-profile", JSON.stringify(p)); localStorage.setItem("gdl-mute", "1"); }, PROF);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() || {}).url || "")) errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`${name} pageerror: ${e.message}`));
  return page;
}
const g = (page, fn, arg) => page.evaluate(fn, arg);
async function autoPick(page) { const b = await page.$('#levelup:not([hidden]) [data-act="pick"]'); if (b) { await sleep(400); await b.click().catch(() => {}); } }
async function shot(page, name, wait = 450) { await sleep(wait); const f = path.join(OUT, `dinamica-${name}.png`); await page.screenshot({ path: f }); shots.push(f); }
const bannerText = page => page.evaluate(() => { const b = document.getElementById("banner"); return b && b.classList.contains("on") ? document.getElementById("btitle").textContent + " / " + document.getElementById("bsub").textContent : ""; });
async function waitBanner(page, re, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const b = await bannerText(page); if (re.test(b)) return b; await autoPick(page); await sleep(60); }
  throw new Error("no apareció el cartel " + re + " (último: " + (await bannerText(page)) + ")");
}
// arranca una partida solo en el mapa m (desde el menú)
async function startSolo(page, m = "plaza") {
  await page.click('[data-act="solo"]');
  await page.click(`[data-act="map"][data-v="${m}"]`).catch(() => {});
  await page.click('[data-act="go"]');
  await page.waitForFunction(() => window.__g().sim && window.__g().sim.t >= 0 && document.body.dataset.screen === "run");
}
async function toMenu(page) { await page.keyboard.press("Escape"); await sleep(150); await page.click('[data-act="quit"]'); await sleep(200); }
// pareja quieta al lado (simulada en el mismo motor) para lo que necesita dúo
const addMate = (page, dx = 18) => g(page, dx => { const { sim } = window.__g(); if (!sim.players.guest) { const h = sim.players.host; const q = sim.addPlayer("guest", "rocio"); q.x = h.x + dx; q.y = h.y; sim.setView("guest", 195, 422); } }, dx);
const keepAlive = page => g(page, () => { clearInterval(window.__keep); window.__keep = setInterval(() => { const s = window.__g().sim; if (s) for (const p of Object.values(s.players)) { p.hp = p.maxHp; } }, 100); });

/* ---------- 1. partida de 2 minutos ---------- */
{
  const page = await newPage("larga");
  await page.goto(BASE + "?debug");
  await page.click('[data-act="start"]');
  await page.click('[data-act="solo"]');
  await shot(page, "sala", 200);
  await page.click('[data-act="go"]');
  await keepAlive(page); // vida llena: se prueba que 2 minutos de partida corren sin errores, no el balance
  const keys = ["d", "s", "a", "w", "d", "w", "a", "s"]; let k = 0; const real = Date.now();
  while (Date.now() - real < LONG * 2000 && (await page.getAttribute("body", "data-screen")) === "run" && (await g(page, () => window.__g().sim.t)) < LONG) {
    await page.keyboard.down(keys[k % keys.length]); await sleep(600); await page.keyboard.up(keys[k % keys.length]); k++;
    await autoPick(page);
  }
  const a = await g(page, () => { const { sim } = window.__g(); return sim ? { t: sim.t, st: sim.state, kills: sim.kills, lv: sim.level } : null; });
  console.log(`partida larga: ${Math.round((Date.now() - real) / 1000)} s reales, reloj ${a ? a.t.toFixed(0) : "-"} s, ${a ? a.kills : "-"} gatos, nivel ${a ? a.lv : "-"}, estado ${a ? a.st : await page.getAttribute("body", "data-screen")}`);
  assert.equal(errors.length, 0, "errores en consola:\n" + errors.join("\n"));
  assert.ok(a && a.t >= LONG, "llegó a " + LONG + " s de reloj");
  console.log("ok - partida de " + LONG + " s de reloj sin errores en la consola");
  await page.context().close();
}

/* ---------- 2. carteles ---------- */
{
  const page = await newPage("carteles");
  await page.goto(BASE + "?debug");
  await page.click('[data-act="start"]');
  // primera partida normal, la segunda de la sesión arranca rápido
  await startSolo(page, "plaza"); await sleep(500); await toMenu(page);
  await startSolo(page, "plaza");
  console.log("arranque rápido:", await waitBanner(page, /Arranque rápido/));
  await shot(page, "arranque-rapido", 150);
  await autoPick(page);
  // flecha roja: un saltarín avisando fuera de cámara, cerca
  await keepAlive(page);
  await g(page, () => { const { sim } = window.__g(); const h = sim.players.host; const e = sim.spawnAt("saltarin", h.x + 125, h.y - 20); e.st = 1; e.stT = 99; e.cd = 99; e.spd = 0; window.__sal = e; });
  await shot(page, "flecha-fuera-de-camara", 600);
  await g(page, () => { window.__sal.hp = 0; });
  // Luz que marca a uno y se frena con la pareja pegada
  await addMate(page, 110); // lejos: primero se ve la marca; después se juntan y la frenan
  await g(page, () => { const { sim } = window.__g(); sim.t = 209.6; for (const e of sim.enemies) if (!e.type.includes("caja")) e.hp = 0; });
  console.log("Luz marca:", await waitBanner(page, /Luz (te )?marcó/, 12000));
  await shot(page, "luz-marca", 250);
  await g(page, () => { const { sim } = window.__g(); const h = sim.players.host, q = sim.players.guest; q.x = h.x + 10; q.y = h.y; });
  console.log("Luz se frena:", await waitBanner(page, /Luz se frenó/, 15000));
  await shot(page, "luz-aturdida", 300);
  // combo de pareja: Thomas con mate, Rocío con medialunas, pegados
  await g(page, () => { const { sim } = window.__g(); if (sim.bossRef) sim.bossRef.hp = 0; const h = sim.players.host, q = sim.players.guest; h.weapons.mate = 5; q.weapons.medialuna = 5; for (let i = 0; i < 6; i++) sim.spawnAt("gordo", h.x + 30 + i * 6, h.y + (i % 2 ? 20 : -20)); });
  console.log("combo:", await waitBanner(page, /Medialuna al mate|Patada a la torta|Juli marca/, 15000));
  await shot(page, "combo", 200);
  // aviso de que la pareja tiene el especial listo
  await autoPick(page); await sleep(300); await autoPick(page);
  await g(page, () => { const { sim } = window.__g(); sim.xpNext = 1e9; sim.players.guest.ult = 1; sim.players.host.ult = 1; }); // sin más subidas de nivel para la foto
  await page.waitForSelector("#pairult:not([hidden])", { timeout: 5000 });
  await autoPick(page);
  await shot(page, "especial-pareja", 300);
  // Maitena
  await g(page, () => { const { sim } = window.__g(); sim.players.host.mait = 1; });
  await page.waitForSelector("#maitbtn.ready", { timeout: 5000 });
  let mb = ""; for (let i = 0; i < 20 && !mb; i++) { await autoPick(page); await page.keyboard.press("m"); await sleep(150); mb = /Maitena/.test(await bannerText(page)) ? await bannerText(page) : ""; }
  console.log("Maitena:", mb || await waitBanner(page, /Maitena/));
  await shot(page, "maitena", 350);
  // gato ladrón desde las 5:00
  await g(page, () => { const { sim } = window.__g(); sim.t = 300.5; sim.midNext = 9e9; sim.bossIdx = 1; for (let i = 0; i < 25; i++) sim.gems.push({ x: sim.players.host.x + 60 + Math.random() * 60, y: sim.players.host.y - 40 + Math.random() * 80, v: 2, pull: 0 }); const q = sim.edgePos(150); sim.spawnAt("ladron", q.x, q.y); });
  // el cartel del primer ladrón puede quedar tapado por otro; si no se ve, alcanza con que el motor lo haya anunciado
  const lb = await waitBanner(page, /ladrón/, 6000).catch(() => null);
  console.log("ladrón:", lb || "cartel tapado; motor: primer ladrón anunciado = " + await g(page, () => window.__g().sim.stats.lad));
  assert.ok(lb || await g(page, () => window.__g().sim.stats.lad === 1));
  await shot(page, "ladron", 600);
  // segunda chance con Linda
  await g(page, () => { const { sim } = window.__g(); clearInterval(window.__keep); sim.t = 419.8; sim.bossIdx = 1; });
  await waitBanner(page, /LINDA/, 8000);
  await g(page, () => { const { sim } = window.__g(); for (const p of Object.values(sim.players)) { p.inv = 0; sim.hurt(p, 9999); } });
  console.log("segunda chance:", await waitBanner(page, /emergencia/));
  await shot(page, "segunda-chance", 250);
  // resultados con metas
  await g(page, () => { const { sim } = window.__g(); sim.win(); });
  await page.waitForSelector(".results", { timeout: 8000 });
  await shot(page, "resultados", 300);
  await page.click('[data-act="menu"]').catch(() => {});
  await sleep(300);
  // eventos de mitad de partida en los 7 mapas
  for (const m of ["plaza", "estacion", "feria", "bielli", "cancha", "tortugas", "terrazas"]) {
    if ((await page.getAttribute("body", "data-screen")) !== "menu") { await page.click('[data-act="menu"]').catch(() => {}); await page.click('[data-act="back"]').catch(() => {}); }
    await startSolo(page, m); await sleep(300); await autoPick(page);
    await keepAlive(page);
    await g(page, () => { const { sim } = window.__g(); sim.t = 279.6; sim.bossIdx = 1; sim.midNext = 280; sim.objTimes = []; for (const e of sim.enemies) e.hp = 0; });
    console.log(m + ":", await waitBanner(page, /Corbata|Apagón|Liquidación|Sparring|riego|Promo|Salida del cine/, 10000));
    await sleep(m === "feria" ? 1800 : m === "cancha" ? 1200 : 700);
    await shot(page, "evento-" + m, 0);
    await toMenu(page);
  }
  // ver más (zoom) en la sala y en partida
  await page.click('.menu [data-act="zoom"]');
  await startSolo(page, "plaza"); await sleep(1200); await autoPick(page);
  await shot(page, "ver-mas", 200);
  await page.keyboard.press("Escape");
  await page.click('[data-act="zurdo"]'); await page.click('[data-act="bigbtn"]');
  await shot(page, "pausa-opciones", 200);
  await page.click('[data-act="resume"]');
  await shot(page, "botones-zurdo", 300);
  await page.context().close();
}
await browser.close();
assert.equal(errors.length, 0, "errores en consola:\n" + errors.join("\n"));
console.log(`ok - ${shots.length} capturas sin errores en la consola:\n` + shots.join("\n"));
