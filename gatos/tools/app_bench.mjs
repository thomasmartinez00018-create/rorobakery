// Mide el juego REAL en Chromium headless: partida solo, CPU frenada 6x, con traza de devtools para separar
// script, estilos/layout del HUD y pintado. Necesita el juego servido: python3 -m http.server 8811 (dentro de gatos/).
// Uso: node app_bench.mjs [frenado de CPU] [segundos a adelantar]   URL=http://127.0.0.1:8811/  PROF=1 para perfil de CPU
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";
const exe = chromePath();
const RATE = +(process.argv[2] || 6), WARM = +(process.argv[3] || 300);
const browser = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on("pageerror", e => console.error("pageerror:", e.message));
await page.goto((process.env.URL || "http://127.0.0.1:8811/") + "?debug");
await page.click('[data-act="start"]');
await page.click('[data-act="who"][data-v="rocio"]');
await page.click('[data-act="solo"]');
await page.click('[data-act="go"]');
await page.waitForTimeout(500);
// adelantar la partida con el motor del propio juego (vida infinita, mejoras automáticas)
await page.evaluate(W => {
  const g = window.__g; const s = g().sim;
  const keep = () => { const sim = window.__g().sim; if (!sim) return; for (const p of Object.values(sim.players)) p.hp = p.maxHp; if (sim.state === "levelup") for (const k of Object.keys(sim.offers)) if (sim.offers[k].pick === null) { const o = sim.offers[k].opts; let i = o.findIndex(x => x.kind === "w"); sim.pick(k, i < 0 ? 0 : i); } };
  setInterval(keep, 50);
  let a = 0; while (s.t < W && a++ < 200000) { keep(); s.step(1 / 30, { host: { dir: { x: Math.cos(s.t / 3), y: Math.sin(s.t / 2.3) } } }); s.ev = []; }
}, WARM);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });
await page.waitForTimeout(1500);
// intervalos entre cuadros
await page.evaluate(() => { window.__fr = []; let last = performance.now(); const f = n => { window.__fr.push(n - last); last = n; if (window.__fr.length < 100000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
if (process.env.PROF) {
  await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start");
  await page.waitForTimeout(8000);
  const { profile } = await cdp.send("Profiler.stop");
  const byId = new Map(profile.nodes.map(n => [n.id, n])); const self = new Map(); const dts = profile.timeDeltas; let tot = 0;
  profile.samples.forEach((id, i) => { const n = byId.get(id); const cf = n.callFrame; const k = (cf.functionName || "(anon)") + " " + cf.url.replace(/^https?:\/\/[^/]+\//, "") + ":" + (cf.lineNumber + 1); const d = (dts[i] || 0) / 1000; self.set(k, (self.get(k) || 0) + d); tot += d; });
  // tiempo inclusivo por función (sumando hijos)
  const parent = new Map(); for (const n of profile.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
  const incl = new Map(); profile.samples.forEach((id, i) => { const d = (dts[i] || 0) / 1000; const seen = new Set(); let cur = id; while (cur) { const n = byId.get(cur), cf = n.callFrame; const k = (cf.functionName || "(anon)") + " " + cf.url.replace(/^https?:\/\/[^/]+\//, "") + ":" + (cf.lineNumber + 1); if (!seen.has(k)) { incl.set(k, (incl.get(k) || 0) + d); seen.add(k); } cur = parent.get(cur); } });
  const top = m => [...m.entries()].filter(([k]) => !k.startsWith("(idle)") && !k.startsWith("(program)") && !k.startsWith("(root)")).sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => k + " = " + (v / 8).toFixed(1) + " ms/s");
  console.log("CPU " + RATE + "x · muestreo 8 s · total muestreado " + (tot / 8).toFixed(0) + " ms/s");
  console.log("SELF:\n  " + top(self).join("\n  "));
  console.log("INCLUSIVO:\n  " + top(incl).join("\n  "));
  await browser.close(); process.exit(0);
}
const events = [];
cdp.on("Tracing.dataCollected", d => events.push(...d.value));
await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,v8.gc", transferMode: "ReportEvents" });
await page.waitForTimeout(8000);
const done = new Promise(r => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.end"); await done;
const fr = await page.evaluate(() => window.__fr.slice(5));
const st = await page.evaluate(() => { const s = window.__g().sim, sn = window.__g().snap; return { t: Math.round(s.t), en: s.enemies.length, gems: s.gems.length, pick: s.pickups.length, lv: s.level }; });
const sum = {}; let main = null;
for (const e of events) if (e.ph === "X" && e.dur) { sum[e.name] = (sum[e.name] || 0) + e.dur / 1000; }
const secs = 8;
const pick = ["FireAnimationFrame", "FunctionCall", "UpdateLayoutTree", "Layout", "Paint", "PrePaint", "Layerize", "MinorGC", "MajorGC", "V8.GC_SCAVENGER", "ParseHTML", "HitTest", "UpdateLayer", "CompositeLayers", "RunTask"];
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(p * (s.length - 1))].toFixed(1); };
console.log(JSON.stringify({ cpu: RATE + "x", estado: st, fps: +(fr.length / (fr.reduce((a, b) => a + b, 0) / 1000)).toFixed(1), frameInterval: { p50: q(fr, .5), p95: q(fr, .95), max: q(fr, 1), over20ms: fr.filter(x => x > 20).length + "/" + fr.length }, msPorSegundo: Object.fromEntries(pick.filter(k => sum[k]).map(k => [k, +(sum[k] / secs).toFixed(1)])) }));
await browser.close();
