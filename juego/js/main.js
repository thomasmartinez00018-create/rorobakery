// Expediente a Dos — flujo del juego, estado compartido y pantallas.
import * as A from "./actors.js";
import { World } from "./world.js";
import { Net, makeCode, cleanCode } from "./net.js";
import { sfx } from "./sfx.js";
import { soleSVG, glyphSVG } from "./draw2d.js";
import { genCase, hashSeed, clueText, normPhrase, VEH_TXT, MANOS, ESTATS } from "./casegen.js";

const gsap = window.gsap;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const LS = "ead2-";
const lsGet = k => { try { return localStorage.getItem(LS + k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, v); } catch (e) {} };
const NAME = { thomas: "Thomas", rocio: "Rocío" };
const RNAME = { campo: "Campo", archivo: "Archivo" };
const other = r => r === "campo" ? "archivo" : "campo";

/* ---------------- estado ---------------- */
function fresh() {
  return {
    v: 2, phase: "lobby", level: 1, seed: 0, solo: false, code: "",
    roles: { host: "campo", guest: "archivo" }, who: { host: null, guest: null },
    startedAt: 0, solved: { suela: false, cifra: false, testigos: false }, pen: 0, wrong: [], juli: null,
    end: null, left: 0, streak: 0, fx: null, romero: null
  };
}
let S = fresh();
const me = {
  side: "host", who: lsGet("who"), inRoom: false, net: null, netStatus: "off", offset: 0,
  best: +(lsGet("best") || 0), bestStreak: +(lsGet("bestStreak") || 0)
};
let C = null, portraits = [];
let tab = "suela";
let sel = {};
let flash = null;
let lastFx = null, lastPhase = null, lastRomero = null, lastSeed = null, lastWrongLen = 0;
let joinDraft = cleanCode(new URLSearchParams(location.search).get("sala") || "");
let soloCode = lsGet("soloCode") || String(1000 + Math.floor(Math.random() * 9000));
let lobbyPanel = joinDraft ? "join" : null;
let busyMsg = null, errMsg = null;
let lastSec = -1, quitArm = false;

const ui = $("#ui"), stageEl = $("#stage");
const world = new World($("#canvas-wrap"), $("#bubbles"));
world.setPlace("casa");

const hostNow = () => Date.now() + (me.side === "guest" ? me.offset : 0);
const myRole = () => S.roles[me.side];
const partnerSide = () => me.side === "host" ? "guest" : "host";
const partnerName = () => NAME[S.who[partnerSide()]] || "tu pareja";
const remaining = () => {
  if (!C || !S.startedAt) return C ? C.P.time : 0;
  if (S.end) return S.left;
  return Math.max(0, C.P.time - (hostNow() - S.startedAt) / 1000 - S.pen);
};

/* ---------------- caso ---------------- */
function ensureCase() {
  if (!S.seed) { C = null; return; }
  if (C && C.seed === S.seed && C.level === S.level) return;
  C = genCase(S.seed, S.level);
  portraits = world.portraits(C.sus.map(s => () => A.suspect(s.look)));
  sel = { suela: null, cifra: "", man: null, est: null, acc: null };
  tab = "suela"; flash = null;
}

/* ---------------- anfitrión: reglas ---------------- */
let fxId = 0;
function fx(o) { S.fx = Object.assign({ id: ++fxId + "-" + Date.now() }, o); }

function hostAct(a, by) {
  const P = C && C.P;
  switch (a.type) {
    case "hello":
      if (by === "guest") S.who.guest = a.who;
      break;
    case "swap":
      if (by !== "host" || (S.phase !== "lobby" && S.phase !== "end")) return;
      S.roles = { host: S.roles.guest, guest: S.roles.host };
      break;
    case "open": {
      if (by !== "host") return;
      openCase(S.level);
      break;
    }
    case "go":
      if (S.phase !== "brief") return;
      S.phase = "play"; S.startedAt = Date.now();
      S.romero = C.P.romero ? { at: S.startedAt + C.romeroFrac * C.P.time * 1000, active: false, until: 0, done: false, caught: false, n: 0 } : null;
      break;
    case "answer": {
      if (S.phase !== "play" || S.solved[a.k]) return;
      let ok = false;
      if (a.k === "suela") ok = !!(C.catalog[a.v] && C.catalog[a.v].ok);
      if (a.k === "cifra") ok = normPhrase(a.v) === normPhrase(C.phrase) && normPhrase(a.v).length > 0;
      if (a.k === "testigos") ok = a.v && a.v.man === C.c.mano && a.v.est === C.c.estat;
      if (ok) { S.solved[a.k] = true; fx({ kind: "ok", k: a.k, by }); }
      else { S.pen += P.pen; fx({ kind: "err", k: a.k, by, secs: P.pen }); }
      break;
    }
    case "accuse": {
      if (S.phase !== "play" || S.wrong.includes(a.i)) return;
      if (a.i === C.cul) { S.left = remaining(); finish("win"); }
      else { S.wrong.push(a.i); S.pen += P.penAcc; fx({ kind: "err", k: "accuse", by, secs: P.penAcc, i: a.i }); }
      break;
    }
    case "juli": {
      if (S.phase !== "play" || S.juli !== null) return;
      const pool = C.sus.map((s, i) => i).filter(i => i !== C.cul && !S.wrong.includes(i));
      if (!pool.length) return;
      const i = pool[Math.floor(Math.random() * pool.length)];
      S.juli = i; S.wrong.push(i); S.pen += P.penJuli;
      fx({ kind: "juli", i, by, secs: P.penJuli });
      break;
    }
    case "romero":
      if (S.romero && S.romero.active) { S.romero.active = false; S.romero.done = true; S.romero.caught = true; fx({ kind: "romero-ok", by }); }
      break;
    case "next":
      if (by !== "host" || S.phase !== "end") return;
      if (S.end === "win") { S.level += 1; } else { S.level = 1; S.streak = 0; }
      openCase(S.level);
      break;
    case "menu":
      if (by !== "host") return;
      S.phase = "lobby"; S.seed = 0;
      break;
    default: return;
  }
  commit();
}

function openCase(level) {
  S.level = level;
  S.seed = S.solo ? hashSeed(S.code + ":" + level) : (Math.random() * 4294967295) >>> 0;
  Object.assign(S, { phase: "brief", startedAt: 0, solved: { suela: false, cifra: false, testigos: false }, pen: 0, wrong: [], juli: null, end: null, left: 0, romero: null });
  ensureCase();
}

function finish(result) {
  S.phase = "end"; S.end = result;
  if (result === "win") S.streak += 1;
  fx({ kind: result });
}

function hostTick() {
  if (S.phase !== "play" || !C) return;
  const now = Date.now();
  if (remaining() <= 0) { S.left = 0; finish("lose"); commit(); return; }
  const R = S.romero;
  if (R && !R.done && !R.active && now >= R.at) { R.active = true; R.until = now + 6500; R.n += 1; commit(); }
  else if (R && R.active && now > R.until) { R.active = false; R.done = true; S.pen += C.P.penRomero; fx({ kind: "romero-miss", secs: C.P.penRomero }); commit(); }
}

function commit() {
  if (me.side === "host") {
    if (me.net && me.net.connected) me.net.send({ t: "state", S, now: Date.now() });
    persistHost();
  }
  react();
}

function persistHost() {
  if (S.level - (S.end === "win" ? 0 : 1) > me.best) { me.best = S.end === "win" ? S.level : S.level - 1; lsSet("best", me.best); }
  if (S.streak > me.bestStreak) { me.bestStreak = S.streak; lsSet("bestStreak", me.bestStreak); }
}

/* acción local: el anfitrión la aplica, el invitado la manda */
function act(a) {
  sfx.init();
  if (me.side === "host") hostAct(a, "host");
  else if (me.net) me.net.send({ t: "act", a });
}

/* ---------------- red ---------------- */
function netHandlers() {
  return {
    status(st, detail) {
      me.netStatus = st;
      if (st === "connected") {
        sfx.join();
        if (me.side === "guest") me.net.send({ t: "act", a: { type: "hello", who: me.who } });
        else me.net.send({ t: "state", S, now: Date.now() });
      }
      if (st === "busy") { errMsg = "Esa sala ya tiene dos jugadores."; leaveRoom(); }
      if (st === "error" && detail) console.warn("peer", detail);
      render();
    },
    data(d) {
      if (!d || typeof d !== "object") return;
      if (me.side === "host" && d.t === "act" && d.a && typeof d.a.type === "string") hostAct(d.a, "guest");
      if (me.side === "guest" && d.t === "state" && d.S && d.S.v === 2) {
        me.offset = (d.now || Date.now()) - Date.now();
        S = d.S;
        persistGuest();
        react();
      }
    }
  };
}
function persistGuest() {
  const reached = S.end === "win" ? S.level : S.level - 1;
  if (reached > me.best) { me.best = reached; lsSet("best", me.best); }
  if (S.streak > me.bestStreak) { me.bestStreak = S.streak; lsSet("bestStreak", me.bestStreak); }
}

async function createRoom() {
  busyMsg = "Creando sala…"; errMsg = null; render();
  me.side = "host"; S = fresh(); S.who.host = me.who;
  me.net = new Net(netHandlers());
  for (let i = 0; i < 4; i++) {
    const code = makeCode();
    try { await me.net.host(code); S.code = code; me.inRoom = true; busyMsg = null; me.netStatus = "waiting"; render(); return; }
    catch (e) { if (e && e.type !== "unavailable-id") { busyMsg = null; errMsg = "No se pudo crear la sala. Revisá la conexión o jugá sin conexión."; render(); return; } }
  }
  busyMsg = null; errMsg = "No se pudo crear la sala. Probá de nuevo."; render();
}

async function joinRoom(code) {
  code = cleanCode(code);
  if (code.length !== 4) return;
  busyMsg = "Conectando con la sala " + code + "…"; errMsg = null; render();
  me.side = "guest"; S = fresh();
  me.net = new Net(netHandlers());
  try { await me.net.join(code); me.inRoom = true; busyMsg = null; S.code = code; history.replaceState(null, "", location.pathname + "?sala=" + code); render(); }
  catch (e) {
    busyMsg = null;
    errMsg = e && e.type === "peer-unavailable" ? `No existe la sala ${code}. Revisá el código.` : "No se pudo conectar. Si siguen fallando, jueguen sin conexión con el mismo número de caso.";
    me.side = "host"; render();
  }
}

function startSolo() {
  me.side = "host"; S = fresh();
  S.solo = true; S.code = soloCode; S.who.host = me.who;
  lsSet("soloCode", soloCode);
  me.inRoom = true;
  const lvl = Math.max(1, Math.min(30, +(lsGet("soloLevel") || 1)));
  S.level = lvl;
  render();
}

function leaveRoom() {
  if (me.net) me.net.close();
  me.net = null; me.inRoom = false; me.side = "host"; me.netStatus = "off";
  S = fresh(); C = null;
  history.replaceState(null, "", location.pathname);
  world.setPlace("casa"); world.camIdle();
  render();
}

/* ---------------- reacciones a cambios de estado ---------------- */
function react() {
  ensureCase();
  const phaseChanged = S.phase !== lastPhase || S.seed !== lastSeed;
  if (phaseChanged) {
    const prev = lastPhase;
    lastPhase = S.phase; lastSeed = S.seed;
    if (S.phase === "brief") {
      world.setView("place"); world.setPlace(C.place.k); world.intro({ villain: C.P.villain });
      sfx.sting(); if (C.P.villain) setTimeout(() => sfx.evil(), 4000);
      if (S.solo) lsSet("soloLevel", S.level);
    }
    if (S.phase === "play" && prev === "brief") { world.camIdle(); sfx.whoosh(); }
    if (S.phase === "lobby") { world.setView("place"); if (world.placeKey !== "casa") world.setPlace("casa"); world.camIdle(); }
  }
  if (S.fx && S.fx.id !== lastFx) {
    const f = S.fx; lastFx = f.id;
    const mine = f.by === me.side;
    if (f.kind === "ok") { sfx.ok(); flash = { k: f.k, ok: true, t: mine ? "¡Bien! Pista desbloqueada." : `${partnerName()} resolvió esta pista.` }; }
    if (f.kind === "err") {
      sfx.err(); hitTimer(f.secs);
      const txt = f.k === "accuse" ? `${C.sus[f.i].name} tiene coartada. −${f.secs} s` : `${mine ? "No es eso" : partnerName() + " se equivocó"}. −${f.secs} s`;
      flash = { k: f.k, ok: false, t: txt };
    }
    if (f.kind === "juli") { sfx.meow(); hitTimer(f.secs); world.juliHint(`Miau. ${C.sus[f.i].name.split(" ")[0]} es inocente.`); flash = { k: "accuse", ok: true, t: `Juli descartó a ${C.sus[f.i].name}. −${f.secs} s` }; }
    if (f.kind === "romero-ok") { sfx.ok(); world.endRomero(true); }
    if (f.kind === "romero-miss") { sfx.err(); hitTimer(f.secs); world.endRomero(false); }
    if (f.kind === "win") { sfx.win(); world.setView("place"); world.celebrate(); }
    if (f.kind === "lose") { sfx.lose(); world.setView("place"); world.defeat(); setTimeout(() => sfx.evil(), 600); }
    if (flash) { const fl = flash; setTimeout(() => { if (flash === fl) { flash = null; render(); } }, 3000); }
  }
  const R = S.romero;
  const rkey = R ? R.n + ":" + R.active : null;
  if (rkey !== lastRomero) {
    lastRomero = rkey;
    if (R && R.active && S.phase === "play") {
      world.setView("place");
      sfx.bark();
      world.romeroRun(Math.max(1500, R.until - hostNow()), () => act({ type: "romero" }));
    }
  }
  if (S.phase === "play" && tab === "rueda" && myRole() === "archivo") {
    if (S.wrong.length !== lastWrongLen) world.buildLineup(C.sus, S.wrong);
    if (!(R && R.active)) world.setView("lineup");
  }
  lastWrongLen = S.wrong.length;
  render();
}

function hitTimer(secs) {
  const t = $("#timer"); if (!t) return;
  t.classList.remove("hit"); void t.offsetWidth; t.classList.add("hit");
  const s = document.createElement("span"); s.className = "penfx"; s.textContent = "−" + secs + " s"; t.appendChild(s);
  setTimeout(() => s.remove(), 1500);
}

/* ---------------- vistas ---------------- */
function castCards() {
  if (!castCards.urls) {
    castCards.urls = world.portraits([A.thomas, A.rocio, A.juli, A.romero, () => A.lindaGata(false), A.corbata, A.lindaCanichita, A.luz]);
  }
  const u = castCards.urls;
  const people = [
    ["Thomas", "Detective. Kickboxer del Team Bielli.", u[0]],
    ["Rocío", "Detective. Repostera de Roro's Bakery.", u[1]],
    ["Juli", "Gato mimoso. Una vez por caso te dice quién es inocente.", u[2]],
    ["Romero", "Caniche inquieto. Si se escapa, agarralo.", u[3]],
    ["Linda", "La gata mala. Mamá de Juli. Mente maestra.", u[4], true],
    ["Corbata", "Perro de la abuela. Cuida el patio.", u[5]],
    ["Linda", "La canichita de la abuela. La buena.", u[6]],
    ["Luz", "Gata de la abuela. Malhumorada, no declara.", u[7]]
  ];
  return `<div class="cast">${people.map(p => `<figure class="castcard${p[3] ? " evil" : ""}"><img src="${p[2]}" alt=""><figcaption><b>${p[0]}</b><span>${p[1]}</span></figcaption></figure>`).join("")}</div>`;
}

function viewLobby() {
  const whoPick = `<div class="who">${["thomas", "rocio"].map(w => `<button class="whobtn" data-act="who" data-v="${w}" aria-pressed="${me.who === w}">${NAME[w]}</button>`).join("")}</div>`;
  const locked = !me.who;
  return `
  <section class="hero">
    <p class="eyebrow">Policial cooperativo para dos · Malvinas Argentinas y San Miguel</p>
    <h1>Expediente<br>a Dos</h1>
    <p class="lede">Uno está en la escena, el otro en el archivo. Cada uno ve la mitad de las pistas. Hablen rápido: el reloj corre, cada error lo acelera y Linda, la gata, está detrás de todo.</p>
  </section>
  <section class="card">
    <p class="label">¿Quién sos?</p>
    ${whoPick}
    ${errMsg ? `<p class="flash bad">${esc(errMsg)}</p>` : ""}
    ${busyMsg ? `<p class="busy">${esc(busyMsg)}</p>` : `
    <div class="actions">
      <button class="cta" data-act="create" ${locked ? "disabled" : ""}>Crear sala</button>
      <button class="ghost" data-act="panel" data-v="join" ${locked ? "disabled" : ""}>Unirme con código</button>
    </div>
    ${lobbyPanel === "join" ? `<div class="joinrow"><input id="joincode" class="code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="${esc(joinDraft)}"><button class="cta small" data-act="join" ${locked || joinDraft.length !== 4 ? "disabled" : ""}>Entrar</button></div>` : ""}
    <details class="solo"${lobbyPanel === "solo" ? " open" : ""}>
      <summary>Jugar sin conexión</summary>
      <p class="hint">Cada uno en su dispositivo, con el mismo número de caso y roles distintos. Se hablan por llamada. El reloj no se sincroniza: arranquen a la vez.</p>
      <div class="joinrow"><input id="solocode" class="code" maxlength="4" inputmode="numeric" value="${esc(soloCode)}"><button class="ghost small" data-act="solo" ${locked ? "disabled" : ""}>Abrir</button></div>
    </details>`}
    ${locked ? `<p class="hint">Elegí quién sos para empezar.</p>` : ""}
  </section>
  <section class="card">
    <p class="label">El elenco</p>
    ${castCards()}
  </section>
  <section class="card how">
    <p class="label">Cómo se juega</p>
    <ol>
      <li>Uno crea la sala y le pasa el código o el link al otro.</li>
      <li>Cada caso pasa en un lugar real: la rotonda de Grand Bourg, la estación Los Polvorines, la heladería de Balbín y Paunero…</li>
      <li>Campo ve la escena: la huella, la libreta del ladrón, los testigos. Archivo tiene los registros que les dan sentido.</li>
      <li>Resuelvan las tres pistas, crucen las fichas y acusen a una sola persona.</li>
      <li>Cada caso ganado sube el nivel: más sospechosos, más símbolos, menos tiempo.</li>
    </ol>
    <div class="stats"><span class="pill">Mejor nivel: <b>${me.best || "—"}</b></span><span class="pill">Mejor racha: <b>${me.bestStreak || "—"}</b></span></div>
  </section>`;
}

function viewRoom() {
  const partner = S.who[partnerSide()];
  const connected = S.solo || (me.net && me.net.connected);
  const shareUrl = location.origin + location.pathname + "?sala=" + S.code;
  const roleRow = side => {
    const w = S.who[side];
    return `<div class="rolerow"><span class="avatar">${w ? NAME[w][0] : "?"}</span><div><b>${w ? NAME[w] : "Esperando…"}</b>${side === me.side ? " <small>(vos)</small>" : ""}<span class="rolename">${RNAME[S.roles[side]]}</span></div></div>`;
  };
  const roleInfo = myRole() === "campo"
    ? "Vas a estar en la escena: ves la huella, la libreta con la clave del ladrón y las declaraciones."
    : "Vas a estar en el archivo: catálogo de suelas, mensaje interceptado, registro de testigos y la rueda con alturas.";
  return `
  <section class="card room">
    ${S.solo ? `<p class="eyebrow">Sin conexión · caso ${esc(S.code)}</p>
      <h2>Nivel ${S.level}</h2>
      <p class="hint">Tu pareja tiene que abrir el caso <b>${esc(S.code)}</b> en el nivel <b>${S.level}</b> con el otro rol.</p>
      <div class="actions"><button class="ghost small" data-act="lvl" data-v="-1">Nivel −</button><button class="ghost small" data-act="lvl" data-v="1">Nivel +</button></div>
      <div class="roles">${["campo", "archivo"].map(r => `<button class="role" data-act="solorole" data-v="${r}" aria-pressed="${S.roles.host === r}"><b>${RNAME[r]}</b></button>`).join("")}</div>`
    : `<p class="eyebrow">Sala</p>
      <div class="bigcode">${esc(S.code)}</div>
      ${me.side === "host" ? `<div class="actions"><button class="ghost small" data-act="share" data-v="${esc(shareUrl)}">Compartir link</button></div>` : ""}
      <p class="status ${connected ? "on" : ""}"><span class="dot"></span>${connected ? (partner ? `${NAME[partner]} está conectada/o` : "Conectados") : me.side === "host" ? "Esperando que tu pareja entre…" : "Reconectando…"}</p>
      <div class="rolesboard">${roleRow("host")}${roleRow("guest")}</div>
      ${me.side === "host" ? `<button class="ghost small" data-act="swap">Intercambiar roles</button>` : ""}`}
    <p class="roleinfo"><b>${RNAME[myRole()]}.</b> ${roleInfo}</p>
    ${me.side === "host"
      ? `<button class="cta" data-act="open" ${connected ? "" : "disabled"}>Abrir el caso${S.level > 1 ? " · nivel " + S.level : ""}</button>`
      : `<p class="busy">Esperando que ${esc(partnerName())} abra el caso…</p>`}
    <button class="link" data-act="leave">Salir de la sala</button>
  </section>`;
}

function viewBrief() {
  const p = C.place;
  const mine = myRole() === "campo"
    ? "Estás en la escena. Ves la huella en el piso, la libreta que se le cayó al ladrón y lo que dicen los testigos."
    : "Estás en el archivo. Tenés el catálogo de suelas, el mensaje interceptado, el registro de testigos y la rueda con alturas.";
  return `
  <section class="brief">
    <div class="briefcard" id="briefcard">
      <p class="eyebrow">Nivel ${S.level}${S.streak ? ` · racha ${S.streak}` : ""} · ${esc(p.barrio)}</p>
      <h2>${esc(p.t)}</h2>
      <p>Alguien entró en ${esc(p.place)} y se llevó ${esc(p.obj)}. Hay ${C.sus.length} sospechosos retenidos. Tienen ${fmt(C.P.time)}.</p>
      ${C.P.villain ? `<p class="villain">Linda, la gata, dejó su marca. Nivel de jefa: todo cuesta más.</p>` : ""}
      <p class="roleinfo"><b>${RNAME[myRole()]}.</b> ${mine}</p>
      <button class="cta" data-act="go">Arrancar el reloj</button>
      <p class="hint">${S.solo ? "Cuenten 3, 2, 1 y aprieten a la vez." : "Cuando uno arranca, arranca para los dos."}</p>
    </div>
  </section>`;
}

function clueBox(k) {
  if (!S.solved[k]) return "";
  return `<div class="clue">Pista: ${clueText(k, C.c)}<span>${S.solo ? "Contásela a tu pareja." : "Los dos la ven."}</span></div>`;
}
function flashBox(k) { return flash && flash.k === k ? `<p class="flash ${flash.ok ? "good" : "bad"}" role="alert">${esc(flash.t)}</p>` : ""; }

function viewSuela() {
  const solved = S.solved.suela;
  if (myRole() === "campo") return `
    <div class="station"><h3>La huella</h3>
    <p class="intro">Hay una sola huella clara en el piso. Describísela a ${esc(partnerName())} de la punta al taco: tiene el catálogo.</p>
    <div class="mud">${soleSVG(C.catalog.find(s => s.ok), "sole-big")}</div>
    ${flashBox("suela")}${clueBox("suela")}</div>`;
  return `
    <div class="station"><h3>Catálogo de suelas</h3>
    <p class="intro">${esc(partnerName())} ve una huella. Preguntá por cada franja, el logo y el taco. Cuando la encuentres, confirmala.</p>
    <div class="catalog">${C.catalog.map((s, i) => `<button class="cat" data-act="pick" data-k="suela" data-v="${i}" aria-pressed="${sel.suela === i}" ${solved ? "disabled" : ""}>${soleSVG(s)}<b>${s.model}</b><span>Talle ${s.talle}</span></button>`).join("")}</div>
    ${solved ? clueBox("suela") : `<button class="cta" data-act="answer" data-k="suela" ${sel.suela === null ? "disabled" : ""}>Confirmar suela</button>${flashBox("suela")}`}</div>`;
}
function viewCifra() {
  const solved = S.solved.cifra;
  if (myRole() === "archivo") {
    let n = 0;
    return `
    <div class="station"><h3>Mensaje interceptado</h3>
    <p class="intro">Un informante dejó este mensaje. La clave está en la libreta que encontró ${esc(partnerName())}. Dictale los símbolos uno por uno: forma, relleno y marca.</p>
    <div class="msg">${C.msg.map(w => `<div class="word">${w.map(q => `<div class="gcell">${glyphSVG(q)}<i>${++n}</i></div>`).join("")}</div>`).join("")}</div>
    ${flashBox("cifra")}${clueBox("cifra")}</div>`;
  }
  return `
    <div class="station"><h3>La libreta</h3>
    <p class="intro">Se le cayó al ladrón. Cada símbolo es una letra. ${esc(partnerName())} tiene un mensaje escrito con esta clave: que te lo dicte y escribí la frase completa.</p>
    <div class="keygrid">${C.keyList.map(k => `<div class="key">${glyphSVG(k.g)}<b>${k.l}</b></div>`).join("")}</div>
    ${solved ? clueBox("cifra") : `
    <div class="field"><label for="cifra">Mensaje descifrado</label><input id="cifra" class="text" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(sel.cifra)}" placeholder="Frase completa"></div>
    <button class="cta" data-act="answer" data-k="cifra">Confirmar mensaje</button>${flashBox("cifra")}`}</div>`;
}
function viewTestigos() {
  const solved = S.solved.testigos;
  if (myRole() === "campo") return `
    <div class="station"><h3>Los testigos</h3>
    <p class="intro">Declararon ${C.wit.length} personas. Algunas no sirven. Leéselas a ${esc(partnerName())}: tiene el registro de cada testigo.</p>
    <div class="slips">${C.wit.map(w => `<div class="slip"><span class="who">${esc(w.name)}</span><q>${esc(w.text)}</q></div>`).join("")}</div>
    ${flashBox("testigos")}${clueBox("testigos")}</div>`;
  const seg = (k, opts) => `<div class="seg">${opts.map(o => `<button data-act="pick" data-k="${k}" data-v="${o}" aria-pressed="${sel[k] === o}">${o[0].toUpperCase() + o.slice(1)}</button>`).join("")}</div>`;
  return `
    <div class="station"><h3>Registro de testigos</h3>
    <p class="intro">${esc(partnerName())} tiene lo que dijo cada uno. Vos sabés a quién creerle. Descartá lo que no sirve y definí cómo es el culpable.</p>
    <div class="slips">${C.registry.map(w => `<div class="slip"><span class="who">${esc(w.name)}</span><span>${esc(w.note)}</span></div>`).join("")}</div>
    ${solved ? clueBox("testigos") : `
    <div class="field"><label>Mano hábil del culpable</label>${seg("man", MANOS)}</div>
    <div class="field"><label>Estatura del culpable</label>${seg("est", ESTATS)}</div>
    <button class="cta" data-act="answer" data-k="testigos" ${sel.man && sel.est ? "" : "disabled"}>Confirmar perfil</button>${flashBox("testigos")}`}</div>`;
}
function viewRueda() {
  const items = [["suela", "La huella"], ["cifra", "El mensaje"], ["testigos", "Los testigos"]];
  const campo = myRole() === "campo";
  const data = s => campo ? `Vehículo: ${VEH_TXT[s.veh]} · Mano: ${s.mano}` : `Talle: ${s.talle} · Estatura: ${s.estat}`;
  const chosen = sel.acc !== null && sel.acc !== undefined ? C.sus[sel.acc] : null;
  return `
    <div class="station"><h3>La rueda</h3>
    <p class="intro">${C.sus.length} personas retenidas. Vos tenés ${campo ? "vehículo y mano hábil" : "talle y estatura (mirá la pared de alturas)"}; ${esc(partnerName())} tiene el resto. Crucen los datos antes de acusar.</p>
    <div class="clues">${items.map(([k, t]) => S.solved[k] ? `<span class="ok">✓ ${clueText(k, C.c)}</span>` : `<span class="no">— ${t}: sin resolver</span>`).join("")}</div>
    <div class="lineup">${C.sus.map((s, i) => {
      const out = S.wrong.includes(i), byJuli = S.juli === i;
      return `<button class="sus${out ? " out" : ""}" data-act="pick" data-k="acc" data-v="${i}" aria-pressed="${sel.acc === i}" ${out ? "disabled" : ""}>
        <img src="${portraits[i]}" alt=""><span class="num">${i + 1}</span>
        <span class="info"><span class="n">${esc(s.name)}</span><span class="o">${esc(s.oficio)}</span><span class="d">${data(s)}</span></span>
        ${out ? `<span class="tag">${byJuli ? "Juli: inocente" : "Inocente"}</span>` : ""}</button>`;
    }).join("")}</div>
    <div class="actions">
      <button class="cta" data-act="accuse" ${chosen ? "" : "disabled"}>${chosen ? `Acusar a ${esc(chosen.name)}` : "Elegí a quién acusar"}</button>
      <button class="ghost small juli" data-act="juli" ${S.juli !== null ? "disabled" : ""}>${S.juli !== null ? "Juli ya ayudó" : `Pedirle ayuda a Juli (−${C.P.penJuli} s)`}</button>
    </div>
    ${flashBox("accuse")}</div>`;
}

function viewPlay() {
  const tabs = [["suela", "Huella"], ["cifra", "Mensaje"], ["testigos", "Testigos"], ["rueda", "Rueda"]];
  const st = k => k === "rueda" ? (S.wrong.length ? S.wrong.length + " desc." : "acusar") : (S.solved[k] ? "✓ lista" : "abierta");
  const body = tab === "suela" ? viewSuela() : tab === "cifra" ? viewCifra() : tab === "testigos" ? viewTestigos() : viewRueda();
  const net = S.solo ? "" : `<span class="dot${me.net && me.net.connected ? " on" : ""}"></span>`;
  return `
  <div class="hud">
    <div class="hl"><b>Nivel ${S.level}</b><span>${RNAME[myRole()]} ${net}</span></div>
    <div class="timer${remaining() <= 60 ? " low" : ""}" id="timer">${fmt(remaining())}</div>
    <div class="hr"><button class="mute" data-act="mute">${sfx.muted ? "Sin sonido" : "Sonido"}</button></div>
  </div>
  ${me.side === "guest" && me.netStatus === "closed" ? `<div class="banner bad">Se cortó la conexión. <button class="ghost small" data-act="rejoin">Reconectar</button></div>` : ""}
  ${me.side === "host" && !S.solo && me.netStatus === "closed" ? `<div class="banner bad">${esc(partnerName())} se desconectó. Cuando vuelva a entrar con el código ${esc(S.code)}, sigue la partida.</div>` : ""}
  <nav class="tabs" role="tablist">${tabs.map(([k, t]) => `<button class="tab${k !== "rueda" && S.solved[k] ? " done" : ""}" role="tab" data-act="tab" data-v="${k}" aria-selected="${tab === k}">${t}<small>${st(k)}</small></button>`).join("")}</nav>
  ${body}
  <button class="link" data-act="quit">${quitArm ? "¿Seguro? Tocá de nuevo para abandonar" : "Abandonar el caso"}</button>`;
}

function viewEnd() {
  const c = C.c, win = S.end === "win";
  return `
  <section class="endcard">
    <div class="stamp ${win ? "win" : "lose"}">${win ? "Caso cerrado" : "Se escapó"}</div>
    <div class="culprit"><img src="${portraits[C.cul]}" alt=""><div>
      <b>${esc(c.name)}</b><span>${esc(c.oficio)}</span>
      <span class="mono">Talle ${c.talle} · ${VEH_TXT[c.veh]} · mano ${c.mano} · estatura ${c.estat}</span></div></div>
    <p class="lede">${win
      ? `Confesó en la comisaría antes del amanecer. ${esc(C.place.obj[0].toUpperCase() + C.place.obj.slice(1))} volvió a ${esc(C.place.place)}. Linda, la gata, jura que no tuvo nada que ver.`
      : `Se fue en ${VEH_TXT[c.veh]} y Linda, la gata, se quedó con ${esc(C.place.obj)}.`}</p>
    <div class="facts">
      <div class="fact"><b>${fmt(win ? S.left : 0)}</b><span>Tiempo que sobró</span></div>
      <div class="fact"><b>${S.pen} s</b><span>Perdidos en errores</span></div>
      <div class="fact"><b>${S.streak}</b><span>Racha actual</span></div>
      <div class="fact"><b>${me.best || "—"}</b><span>Mejor nivel</span></div>
    </div>
    ${me.side === "host"
      ? `<div class="actions"><button class="cta" data-act="next">${win ? `Siguiente caso · nivel ${S.level + 1}` : "Volver a empezar · nivel 1"}</button>
         <button class="ghost" data-act="swapnext">Cambiar roles</button></div>`
      : `<p class="busy">Esperando que ${esc(partnerName())} abra el siguiente caso…</p>`}
    <button class="link" data-act="leave">Salir al menú</button>
  </section>`;
}

function screen() {
  if (!me.inRoom) return "lobby";
  if (S.phase === "lobby" || !C) return "room";
  return S.phase;
}

function render() {
  const scr = screen();
  document.body.dataset.screen = scr;
  world.setShift(scr === "play" ? 0 : scr === "brief" ? 0.12 : window.innerWidth < 700 ? 0.2 : 0.16);
  const a = document.activeElement, id = a && a.id, ss = a && a.selectionStart;
  ui.innerHTML = scr === "lobby" ? viewLobby() : scr === "room" ? viewRoom() : scr === "brief" ? viewBrief() : scr === "play" ? viewPlay() : viewEnd();
  if (id) { const el = document.getElementById(id); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, ss); } catch (e) {} } }
  if (scr === "brief") animateBrief();
  if (scr !== "play" || tab !== "rueda" || myRole() !== "archivo") { if (world.view === "lineup") world.setView("place"); }
}
// la tarjeta del caso aparece cuando termina la cinemática, aunque la pantalla se redibuje en el medio
let briefSeed = null, briefT0 = 0;
function animateBrief() {
  const el = $("#briefcard"); if (!el) return;
  if (briefSeed !== S.seed) { briefSeed = S.seed; briefT0 = performance.now(); }
  const wait = (C.P.villain ? 6.8 : 3.4) - (performance.now() - briefT0) / 1000;
  if (wait <= -0.8) { el.style.opacity = 1; return; }
  gsap.fromTo(el, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: Math.max(0, wait), ease: "power3.out" });
}

/* ---------------- eventos ---------------- */
ui.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  sfx.init();
  const { act: a, v, k } = b.dataset;
  switch (a) {
    case "who": me.who = v; lsSet("who", v); errMsg = null; render(); break;
    case "panel": lobbyPanel = lobbyPanel === v ? null : v; render(); break;
    case "create": createRoom(); break;
    case "join": joinRoom(joinDraft); break;
    case "rejoin": joinRoom(S.code); break;
    case "solo": { const el = $("#solocode"); soloCode = (el ? el.value : soloCode).replace(/\D/g, "").slice(0, 4) || soloCode; startSolo(); break; }
    case "solorole": S.roles = { host: v, guest: other(v) }; render(); break;
    case "lvl": S.level = Math.max(1, Math.min(30, S.level + +v)); lsSet("soloLevel", S.level); render(); break;
    case "share": share(v); break;
    case "swap": act({ type: "swap" }); break;
    case "open": act({ type: "open" }); break;
    case "go": act({ type: "go" }); break;
    case "tab":
      tab = v; quitArm = false;
      world.setView(v === "rueda" && myRole() === "archivo" && !(S.romero && S.romero.active) ? "lineup" : "place");
      if (v === "rueda" && myRole() === "archivo") world.buildLineup(C.sus, S.wrong);
      render(); ui.scrollTo({ top: 0 }); break;
    case "pick":
      if (k === "suela" || k === "acc") sel[k] = +v; else sel[k] = v;
      sfx.click(); render(); break;
    case "answer": {
      let val = sel[k];
      if (k === "cifra") { const el = $("#cifra"); val = el ? el.value : sel.cifra; if (!normPhrase(val)) return; }
      if (k === "testigos") { if (!sel.man || !sel.est) return; val = { man: sel.man, est: sel.est }; }
      if (k === "suela" && val === null) return;
      act({ type: "answer", k, v: val }); break;
    }
    case "accuse": if (sel.acc !== null && sel.acc !== undefined) { act({ type: "accuse", i: sel.acc }); sel.acc = null; } break;
    case "juli": act({ type: "juli" }); break;
    case "next": act({ type: "next" }); break;
    case "swapnext": act({ type: "swap" }); act({ type: "next" }); break;
    case "mute": sfx.toggle(); render(); break;
    case "quit":
      if (!quitArm) { quitArm = true; render(); setTimeout(() => { quitArm = false; if (screen() === "play") render(); }, 4000); return; }
      quitArm = false;
      if (me.side === "host") { S.left = 0; finish("lose"); commit(); } else leaveRoom();
      break;
    case "leave": leaveRoom(); break;
  }
});
ui.addEventListener("input", e => {
  if (e.target.id === "joincode") {
    joinDraft = cleanCode(e.target.value); if (e.target.value !== joinDraft) e.target.value = joinDraft;
    const btn = ui.querySelector('[data-act="join"]'); if (btn) btn.disabled = !me.who || joinDraft.length !== 4;
  }
  if (e.target.id === "cifra") sel.cifra = e.target.value;
  if (e.target.id === "solocode") soloCode = e.target.value.replace(/\D/g, "").slice(0, 4);
});
ui.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  if (e.target.id === "cifra") ui.querySelector('[data-act="answer"][data-k="cifra"]')?.click();
  if (e.target.id === "joincode" && joinDraft.length === 4 && me.who) joinRoom(joinDraft);
});

async function share(url) {
  try { if (navigator.share) { await navigator.share({ title: "Expediente a Dos", text: "Entrá a mi sala de Expediente a Dos", url }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(url); errMsg = null; busyMsg = null; toast("Link copiado"); } catch (e) { toast(url); }
}
function toast(t) {
  const el = document.createElement("div"); el.className = "toast"; el.textContent = t; document.body.appendChild(el);
  gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
  setTimeout(() => gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.remove() }), 2200);
}

/* ---------------- reloj ---------------- */
setInterval(() => {
  if (me.side === "host") hostTick();
  if (screen() !== "play") return;
  const left = remaining();
  const t = $("#timer");
  if (t) {
    const txt = fmt(left);
    if (t.firstChild && t.firstChild.nodeValue !== txt) t.firstChild.nodeValue = txt;
    t.classList.toggle("low", left <= 60);
  }
  const sec = Math.ceil(left);
  if (sec !== lastSec) { if (left <= 30 && left > 0) sfx.tick(); lastSec = sec; }
}, 250);

// entrar directo por link
if (joinDraft.length === 4 && me.who) joinRoom(joinDraft);
render();

// ganchos para pruebas automáticas (?debug)
if (new URLSearchParams(location.search).has("debug")) window.__ead = () => ({ S, C, me, world });
