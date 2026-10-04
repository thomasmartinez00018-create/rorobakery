// Prueba en un navegador real (Chromium de Playwright, headless, tamaño de celu).
// Necesita el juego servido y, para la parte de a dos, un PeerServer local:
//   python3 -m http.server 8811          (dentro de gatos/)
//   npx peer --port 9000
// Uso: node test_navegador.mjs   URL=http://127.0.0.1:8811/  PEER=127.0.0.1:9000  SOLO=1 (sin la parte de a dos)
// Partes: perfil v1 migrado y código de respaldo; arcade 30 s; tope de 60 cuadros con una
// pantalla de 120 Hz simulada; de a dos (dos navegadores separados): sala, diálogo sincronizado, relevo y
// aviso de versión distinta. Falla si aparece cualquier error en la consola de cualquier página.
import assert from "assert/strict";
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";

const BASE = process.env.URL || "http://127.0.0.1:8811/", PEER = process.env.PEER || "127.0.0.1:9000";
const exe = chromePath(), errors = [];
let ok = 0;
const pass = msg => { ok++; console.log("ok -", msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function newPage(browser, name, init) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() || {}).url || "")) errors.push(`${name}: ${m.text()} (${(m.location() || {}).url || ""})`); });
  page.on("pageerror", e => errors.push(`${name} pageerror: ${e.message}`));
  return page;
}
const g = (page, fn, arg) => page.evaluate(fn, arg);
// elige la primera mejora si aparece el modal de nivel
async function autoPick(page) { const b = await page.$('#levelup:not([hidden]) [data-act="pick"]'); if (b) { await sleep(400); await b.click().catch(() => {}); } }
// toca la caja de diálogo hasta "avanzar": si el texto se estaba escribiendo, el primer toque solo lo completa
async function tapDialog(page) {
  const key = () => g(page, () => { const s = window.__g().snap, d = s && s.dlg, me = window.__g().me.side; return d ? d.id + ":" + d.i + ":" + (d.r && d.r[me] ? 1 : 0) : "no"; });
  const k0 = await key();
  for (let i = 0; i < 3; i++) { await page.click("#dialog .dlgbox"); await sleep(400); if ((await key()) !== k0) return; }
  throw new Error("el toque no avanzó el diálogo");
}

const V1 = { v: 1, who: "rocio", coins: 437, up: { hp: 3, dmg: 2, spd: 1, mag: 5 }, maps: { plaza: true, estacion: true }, best: { t: 431.6, k: 3120, lv: 29 }, wins: 4, runs: 23 };
const browser = await chromium.launch({ executablePath: exe, headless: true });

/* ---------- 1. perfil v1 → v2 y código de respaldo ---------- */
{
  const page = await newPage(browser, "perfil", { fn: v1 => { if (!localStorage.getItem("gdl-profile")) localStorage.setItem("gdl-profile", JSON.stringify(v1)); }, arg: V1 });
  await page.goto(BASE + "?debug");
  await page.click('[data-act="start"]');
  assert.match(await page.textContent(".menu .coins"), /437/);
  const st = await g(page, () => ({ p: JSON.parse(localStorage.getItem("gdl-profile")), v1: JSON.parse(localStorage.getItem("gdl-profile-v1")) }));
  assert.equal(st.p.v, 2); assert.equal(st.p.coins, 437); assert.deepEqual(st.p.up, V1.up); assert.deepEqual(st.p.maps, V1.maps); assert.equal(st.v1.coins, 437);
  pass("perfil v1 en el navegador: se ve con 437 monedas y quedó grabado como v2 con copia del original");
  await page.click('[data-act="shop"]'); await page.click('[data-act="backup"]');
  const code = await page.inputValue("#bkout");
  assert.match(code, /^GDL2\./);
  await page.fill("#bkin", "esto no es un código"); await page.click('[data-act="bkload"]');
  assert.match(await page.textContent(".backup .err"), /no es de Gatos de Linda/);
  // cambio las monedas a mano y recupero con el código
  await g(page, () => { const p = JSON.parse(localStorage.getItem("gdl-profile")); p.coins = 1; localStorage.setItem("gdl-profile", JSON.stringify(p)); });
  await page.reload(); await page.click('[data-act="start"]'); assert.match(await page.textContent(".menu .coins"), /\b1\b/);
  await page.click('[data-act="shop"]'); await page.click('[data-act="backup"]');
  await page.fill("#bkin", code); await page.click('[data-act="bkload"]');
  assert.match(await page.textContent(".backup"), /437 monedas/);
  await page.click('[data-act="bkyes"]');
  assert.match(await page.textContent(".backup .coins"), /437/);
  assert.equal((await g(page, () => JSON.parse(localStorage.getItem("gdl-profile")))).coins, 437);
  pass("código de respaldo desde el Taller: rechaza basura, muestra el resumen y recupera las 437 monedas");
  await page.context().close();
}

/* ---------- 2. arcade 30 s, jugando solo ---------- */
{
  const page = await newPage(browser, "solo");
  await page.goto(BASE + "?debug");
  await page.click('[data-act="start"]'); await page.click('[data-act="who"][data-v="thomas"]');
  await page.click('[data-act="solo"]'); await page.click('[data-act="go"]');
  const keys = ["d", "s", "a", "w"]; let k = 0, real = Date.now();
  while (Date.now() - real < 60000) {
    await page.keyboard.down(keys[k % 4]); await sleep(700); await page.keyboard.up(keys[k % 4]); k++;
    await autoPick(page);
    const t = await g(page, () => window.__g().sim && window.__g().sim.t);
    if (t >= 30) break;
  }
  const a = await g(page, () => { const { sim } = window.__g(); return { t: sim.t, st: sim.state, kills: sim.kills, time: document.getElementById("time").textContent, cap: sim.G.id, gems: sim.gems.length }; });
  assert.ok(a.t >= 30, "llegó a 30 s de juego: " + a.t); assert.equal(a.cap, "arcade"); assert.match(a.time, /^00:3\d$/); assert.ok(a.kills > 0);
  pass(`arcade 30 s jugando solo: ${a.kills} gatos, HUD en ${a.time}, estado ${a.st}`);
  // el capítulo de ejemplo se reemplazó por el guion real: el modo historia se prueba en test_historia_nav.mjs
  await page.context().close();
}

/* ---------- 4. tope de 60 cuadros con una pantalla de 120 Hz simulada ---------- */
{
  const page = await newPage(browser, "120hz", { fn: () => {
    let q = []; window.__raf = 0;
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    setInterval(() => { const t = performance.now(), cbs = q; q = []; window.__raf++; for (const cb of cbs) cb(t); }, 1000 / 120);
  } });
  await page.goto(BASE + "?debug");
  await sleep(800);
  await g(page, () => { const R = window.__g().R, f = R.frame.bind(R); window.__frames = 0; R.frame = (...a) => { window.__frames++; return f(...a); }; window.__raf = 0; });
  await sleep(3000);
  const r = await g(page, () => ({ raf: window.__raf, frames: window.__frames }));
  const fps = r.frames / 3, hz = r.raf / 3;
  assert.ok(hz > 90, "la pantalla simulada corre a " + hz.toFixed(0) + " Hz");
  assert.ok(fps > 50 && fps < 66, "dibujó " + fps.toFixed(1) + " cuadros por segundo");
  pass(`tope de 60: con la pantalla a ${hz.toFixed(0)} Hz el juego dibujó ${fps.toFixed(1)} cuadros por segundo`);
  await page.context().close();
}
/* ---------- 5. de a dos con PeerServer local: dos contextos separados del mismo navegador (la Mac es compartida) ---------- */
if (!process.env.SOLO) {
  const bA = browser, bB = browser;
  const host = await newPage(bA, "anfitrión"), guest = await newPage(bB, "invitado");
  const Q = `?debug&peer=${PEER}`;
  await host.goto(BASE + Q); await host.click('[data-act="start"]'); await host.click('[data-act="who"][data-v="thomas"]'); await host.click('[data-act="create"]');
  await host.waitForSelector(".room .code", { timeout: 15000 });
  const code = (await host.textContent(".room .code")).trim(); assert.match(code, /^[A-Z]{4}$/);
  await guest.goto(BASE + Q + "&sala=" + code); await guest.click('[data-act="start"]'); await guest.click('[data-act="who"][data-v="rocio"]'); await guest.click('[data-act="join"]');
  await host.waitForSelector(".status.on", { timeout: 15000 });
  assert.match(await host.textContent(".status.on"), /Thomas y Rocío/);
  pass("sala de a dos con PeerServer local (prefijo v2): conectados");
  // historia: el prólogo (se elige solo al abrir la pantalla de capítulos)
  await host.click('[data-act="story"]');
  await guest.waitForFunction(() => /La víspera/.test(document.querySelector(".capsel") ? document.querySelector(".capsel").textContent : ""), null, { timeout: 5000 });
  await host.click('[data-act="go"]');
  await host.waitForSelector("#dialog:not([hidden]) .dlgbox", { timeout: 5000 }); await guest.waitForSelector("#dialog:not([hidden]) .dlgbox", { timeout: 5000 });
  await sleep(2600);
  // toca solo el anfitrión: no avanza y él ve "Esperando a tu pareja"
  await tapDialog(host);
  assert.match(await host.textContent("#dlgwait"), /Esperando a tu pareja/);
  assert.equal(await g(host, () => window.__g().sim.dlg.i), 0);
  // toca el invitado: avanzan los dos
  await tapDialog(guest); await sleep(300);
  assert.equal(await g(host, () => window.__g().sim.dlg.i), 1);
  await guest.waitForFunction(() => /Thomas/.test(document.querySelector("#dialog b").textContent), null, { timeout: 3000 });
  pass("diálogo sincronizado: con un solo toque espera, con los dos avanza en los dos celus");
  // segunda línea: toca solo el anfitrión y el invitado no; a los 6 s pasa sola (relevo)
  const t0 = Date.now();
  await tapDialog(host);
  await host.waitForFunction(() => window.__g().sim.dlg && window.__g().sim.dlg.i === 2, null, { timeout: 8000 });
  await guest.waitForFunction(() => window.__g().snap && window.__g().snap.dlg && window.__g().snap.dlg.i === 2, null, { timeout: 3000 });
  const waited = (Date.now() - t0) / 1000;
  assert.ok(waited > 4 && waited < 7.5, "pasó a los " + waited.toFixed(1) + " s");
  pass(`relevo por tiempo: el invitado no tocó y la línea pasó sola a los ${waited.toFixed(1)} s`);
  while (await g(host, () => window.__g().snap.st === "dialog")) { await tapDialog(host).catch(() => {}); await tapDialog(guest).catch(() => {}); }
  // jugar 10 s: el invitado se mueve y ve el objetivo
  const gp0 = await g(host, () => ({ ...window.__g().sim.players.guest }));
  for (let i = 0; i < 10; i++) { await guest.keyboard.down(i % 2 ? "a" : "w"); await sleep(500); await guest.keyboard.up(i % 2 ? "a" : "w"); await autoPick(host); await autoPick(guest); await sleep(500); }
  const gp1 = await g(host, () => ({ ...window.__g().sim.players.guest }));
  assert.ok(Math.hypot(gp1.x - gp0.x, gp1.y - gp0.y) > 20, "el anfitrión ve moverse al invitado");
  const gs = await g(guest, () => { const s = window.__g().snap; return { goal: s.goal, A: s.A, cap: s.cap, hud: document.getElementById("goalhud").textContent }; });
  assert.equal(gs.cap, "prologo"); assert.equal(gs.goal.k, "defend"); assert.ok(Array.isArray(gs.A)); assert.match(gs.hud, /Cuidar el horno/);
  pass("de a dos jugando: el invitado se mueve, recibe el objetivo en la foto y lo ve en su HUD");
  await host.keyboard.press("Escape"); await host.click('[data-act="quit"]');
  await guest.waitForFunction(() => document.body.dataset.screen !== "run", null, { timeout: 5000 });
  await host.context().close(); await guest.context().close();

  // versión distinta: el invitado dice proto 1 en hello
  const host2 = await newPage(bA, "anfitrión 2"), old = await newPage(bB, "invitado viejo");
  await host2.goto(BASE + Q); await host2.click('[data-act="start"]'); await host2.click('[data-act="who"][data-v="thomas"]'); await host2.click('[data-act="create"]');
  await host2.waitForSelector(".room .code", { timeout: 15000 });
  const code2 = (await host2.textContent(".room .code")).trim();
  await old.goto(BASE + Q + "&sala=" + code2);
  await g(old, () => { const c0 = window.Peer.prototype.connect; window.Peer.prototype.connect = function (...a) { const c = c0.apply(this, a), s0 = c.send.bind(c); c.send = d => s0(d && d.t === "hello" ? { ...d, proto: 1 } : d); return c; }; });
  await old.click('[data-act="start"]'); await old.click('[data-act="who"][data-v="rocio"]'); await old.click('[data-act="join"]');
  await host2.waitForSelector(".room .err", { timeout: 15000 });
  assert.match(await host2.textContent(".room .err"), /Actualizá la página/);
  assert.equal(await host2.isDisabled('[data-act="go"]'), true);
  pass("versión distinta: el anfitrión ve \"Actualizá la página\" y no puede arrancar");
}
await browser.close();

if (errors.length) { console.error("\nErrores en consola:\n" + errors.join("\n")); process.exit(1); }
console.log(`\n${ok} pruebas en navegador en verde, sin errores en consola`);
