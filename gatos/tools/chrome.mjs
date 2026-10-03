// Busca el Chromium de Playwright instalado en la Mac (o usa CHROME=ruta).
import fs from "fs";
import path from "path";
export function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(process.env.HOME, "Library/Caches/ms-playwright");
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split("-")[1] - +a.split("-")[1]) : [];
  for (const d of dirs) {
    for (const sub of ["chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-linux/chrome"]) {
      const p = path.join(base, d, sub); if (fs.existsSync(p)) return p;
    }
  }
  throw new Error("No encontré Chromium de Playwright. Instalalo con: npx playwright install chromium, o pasá CHROME=ruta");
}
