// Corre render_harness.html en Chromium headless con viewport de celu y CPU frenada por CDP (1x, 4x y 6x).
// Necesita el juego servido: python3 -m http.server 8811 (dentro de gatos/). URL=base del servidor. RATES=1,4,6
import { chromium } from "playwright-core";
import { chromePath } from "./chrome.mjs";
const exe = chromePath();
const gpu = process.argv[2] === "gpu";
const browser = await chromium.launch({ executablePath: exe, headless: true, args: gpu ? ["--enable-gpu", "--use-angle=metal", "--enable-gpu-rasterization"] : [] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on("console", m => { if (m.type() === "error") console.error("console:", m.text()); });
page.on("pageerror", e => console.error("pageerror:", e.message));
await page.goto((process.env.URL || "http://127.0.0.1:8811/") + "tools/render_harness.html");
await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
const cdp = await ctx.newCDPSession(page);
const gpuInfo = await page.evaluate(() => { const c = document.createElement("canvas").getContext("webgl"); const d = c && c.getExtension("WEBGL_debug_renderer_info"); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : "sin webgl"; });
console.log("GPU:", gpuInfo);
const out = [];
const cases = [];
for (const rate of (process.env.RATES || "1,4,6").split(",").map(Number)) {
  for (const warmT of [60, 180, 300, 420]) cases.push({ rate, a: { map: "plaza", warmT, frames: 240, abl: "full" } });
  cases.push({ rate, a: { map: "terrazas", warmT: 300, frames: 240, abl: "full" } });
  cases.push({ rate, a: { map: "plaza", frames: 240, abl: "full", stress: true } });
  for (const abl of ["nolight", "nonums", "noparts", "nonums_noparts"]) cases.push({ rate, a: { map: "plaza", frames: 240, abl, stress: true } });
  for (const abl of ["nolight"]) cases.push({ rate, a: { map: "plaza", warmT: 300, frames: 240, abl } });
}
for (const c of cases) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: c.rate });
  const r = await page.evaluate(a => window.bench(a), c.a);
  r.cpu = c.rate + "x"; out.push(r); console.log(JSON.stringify(r));
}
await browser.close();
