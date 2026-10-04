// Corre todas las pruebas: guardado, guion (arcade idéntico al motor de antes), modo historia y, si el juego
// está servido en URL (por defecto http://127.0.0.1:8811/), la prueba en navegador.
// Uso: node test.mjs   (NAV=0 para saltear el navegador; SOLO=1 para el navegador sin la parte de a dos)
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const run = f => { console.log(`\n== ${f}`); const r = spawnSync(process.execPath, [path.join(HERE, f)], { stdio: "inherit", env: process.env }); return r.status === 0; };
const res = {};
for (const f of ["test_perfil.mjs", "test_guion.mjs", "test_historia.mjs"]) res[f] = run(f);
if (process.env.NAV !== "0") {
  const url = process.env.URL || "http://127.0.0.1:8811/";
  const up = await fetch(url + "index.html").then(r => r.ok).catch(() => false);
  if (up) { res["test_navegador.mjs"] = run("test_navegador.mjs"); res["test_historia_nav.mjs"] = run("test_historia_nav.mjs"); }
  else console.log(`\n== test_navegador.mjs: salteada (no hay servidor en ${url}; python3 -m http.server 8811 dentro de gatos/)`);
}
const bad = Object.entries(res).filter(([, v]) => !v).map(([k]) => k);
console.log(bad.length ? `\nFALLARON: ${bad.join(", ")}` : `\nTodo en verde (${Object.keys(res).length} archivos de prueba)`);
process.exit(bad.length ? 1 : 0);
