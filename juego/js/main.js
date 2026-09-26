// Expediente a Dos — flujo del juego, estado compartido y pantallas.
import * as A from "./actors.js";
import { World } from "./world.js";
import { Net, makeCode, cleanCode } from "./net.js";
import { sfx } from "./sfx.js";
import { music } from "./music.js";
import { soleSVG, glyphSVG, pixelIcon, wireSVG, COLOR_HEX } from "./draw2d.js";
import { genCase, hashSeed, stationClue, normPhrase, VEH_TXT, MANOS, ESTATS, STATION_NAME, ALARM_RULES } from "./casegen.js";

const gsap = window.gsap;
// sin "lag smoothing": las animaciones duran lo mismo en los dos dispositivos aunque uno vaya más lento
gsap.ticker.lagSmoothing(0);
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
    startedAt: 0, solved: {}, pen: 0, wrong: [], juli: null,
    end: null, left: 0, streak: 0, fx: null, romero: null, ev: {}
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
let lastFx = null, lastPhase = null, lastRomero = null, lastSeed = null, lastWrongLen = 0, lastEvKey = "";
let joinDraft = cleanCode(new URLSearchParams(location.search).get("sala") || "");
let soloCode = lsGet("soloCode") || String(1000 + Math.floor(Math.random() * 9000));
let lobbyPanel = joinDraft ? "join" : null;
let busyMsg = null, errMsg = null;
let lastSec = -1, quitArm = false;

const ui = $("#ui"), stageEl = $("#stage");
const world = new World($("#canvas-wrap"), $("#bubbles"));
world.setPlace("casa");
let started = false;

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
  sel = { suela: null, cifra: "", man: null, est: null, acc: null, alarma: null, mapa: null, fotos: null, quiz: null };
  tab = C.stations[0].k; flash = null;
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
      S.romero = C.events.romero ? { at: S.startedAt + C.events.romero * C.P.time * 1000, active: false, until: 0, done: false, caught: false, n: 0 } : null;
      S.ev = {};
      ["apagon", "sabotaje", "quiz"].forEach(e => { if (C.events[e]) S.ev[e] = { at: S.startedAt + C.events[e] * C.P.time * 1000, state: "wait", until: 0, taps: {}, ans: {} }; });
      break;
    case "answer": {
      if (S.phase !== "play" || S.solved[a.k] || !C.stations.some(st => st.k === a.k)) return;
      let ok = false;
      if (a.k === "alarma") ok = a.v === C.alarm.cut;
      if (a.k === "mapa") ok = a.v === C.map.target;
      if (a.k === "fotos") ok = a.v === C.fotos.changed;
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
    case "shoo": {
      const E = S.ev.sabotaje;
      if (!E || E.state !== "on") return;
      E.taps[by] = Date.now();
      const need = players(), ts = need.map(sd => E.taps[sd]);
      if (ts.every(Boolean) && Math.max(...ts) - Math.min(...ts) <= 2500) { E.state = "done"; fx({ kind: "shoo-ok", by }); }
      break;
    }
    case "quiz": {
      const E = S.ev.quiz;
      if (!E || E.state !== "on" || E.ans[by] !== undefined) return;
      E.ans[by] = a.v;
      if (players().every(sd => E.ans[sd] !== undefined)) resolveQuiz();
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
  Object.assign(S, { phase: "brief", startedAt: 0, solved: {}, pen: 0, wrong: [], juli: null, end: null, left: 0, romero: null, ev: {} });
  ensureCase();
}

function finish(result) {
  S.phase = "end"; S.end = result;
  if (result === "win") S.streak += 1;
  fx({ kind: result });
}

// quiénes tienen que participar en los eventos de a dos
function players() { return !S.solo && me.net && me.net.connected ? ["host", "guest"] : ["host"]; }
function resolveQuiz() {
  const E = S.ev.quiz; E.state = "done";
  const right = players().every(sd => E.ans[sd] === C.quiz.ok);
  if (right) { S.pen -= 20; fx({ kind: "bonus", secs: 20 }); }
  else fx({ kind: "quiz-miss" });
}

function hostTick() {
  if (S.phase !== "play" || !C) return;
  const now = Date.now();
  if (remaining() <= 0) { S.left = 0; finish("lose"); commit(); return; }
  const ev = S.ev || {};
  for (const [k, E] of Object.entries(ev)) {
    if (E.state === "wait" && now >= E.at) {
      E.state = "on"; E.until = now + (k === "apagon" ? 16000 : k === "sabotaje" ? 14000 : 20000);
      commit(); return;
    }
    if (E.state === "on" && now > E.until) {
      if (k === "sabotaje") { E.state = "done"; S.pen += 15; fx({ kind: "sab-miss", secs: 15 }); }
      else if (k === "quiz") resolveQuiz();
      else E.state = "done";
      commit(); return;
    }
  }
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

/* ---------------- transiciones ---------------- */
const irisEl = $("#iris"), irisState = { r: 150 };
function setIris(r) { irisEl.style.setProperty("--r", r + "vmax"); }
function iris(mid) {
  sfx.iris();
  irisEl.classList.add("on");
  gsap.killTweensOf(irisState);
  return gsap.timeline()
    .to(irisState, { r: 0, duration: 0.55, ease: "steps(12)", onUpdate: () => setIris(irisState.r) })
    .add(() => { mid && mid(); })
    .to(irisState, { r: 150, duration: 0.8, ease: "steps(16)", delay: 0.15, onUpdate: () => setIris(irisState.r), onComplete: () => irisEl.classList.remove("on") });
}
function cinema(sec) {
  document.body.classList.add("cine");
  clearTimeout(cinema.t); cinema.t = setTimeout(() => document.body.classList.remove("cine"), sec * 1000);
}
function musicFor(scr) {
  if (!started) return;
  if (scr === "play") music.setMode(remaining() <= 60 ? "tense" : "play");
  else if (scr === "end") music.setMode(S.end === "win" ? "win" : "lose");
  else music.setMode("calm");
}

/* ---------------- reacciones a cambios de estado ---------------- */
function react() {
  ensureCase();
  const phaseChanged = S.phase !== lastPhase || S.seed !== lastSeed;
  if (phaseChanged) {
    const prev = lastPhase;
    lastPhase = S.phase; lastSeed = S.seed;
    if (S.phase === "brief") {
      const cc = C;
      iris(() => {
        world.setView("place");
        const amb = world.setPlace(cc.place.k, { rain: cc.rain });
        world.intro({ villain: cc.P.villain });
        music.setAmbience(amb.sound, amb.rain);
        if (amb.horn) setTimeout(() => music.horn(), 900);
        cinema(cc.P.villain ? 9.4 : 6.2);
      });
      sfx.sting(); if (C.P.villain) setTimeout(() => sfx.evil(), 7000);
      if (S.solo) lsSet("soloLevel", S.level);
    }
    if (S.phase === "play" && prev === "brief") { world.camIdle(); sfx.whoosh(); }
    if (S.phase === "lobby") { world.setView("place"); if (world.placeKey !== "casa") { const amb = world.setPlace("casa"); music.setAmbience(amb.sound, false); } world.camIdle(); }
  }
  if (S.fx && S.fx.id !== lastFx) {
    const f = S.fx; lastFx = f.id;
    const mine = f.by === me.side;
    if (f.kind === "ok") { sfx.ok(); world.react("ok"); popClue = f.k; flash = { k: f.k, ok: true, t: mine ? "¡Bien! Pista desbloqueada." : `${partnerName()} resolvió esta pista.` }; }
    if (f.kind === "err") {
      sfx.err(); hitTimer(f.secs); world.react("err");
      const txt = f.k === "accuse" ? `${C.sus[f.i].name} tiene coartada. −${f.secs} s` : `${mine ? "No es eso" : partnerName() + " se equivocó"}. −${f.secs} s`;
      flash = { k: f.k, ok: false, t: txt };
    }
    if (f.kind === "juli") { sfx.meow(); hitTimer(f.secs); world.juliHint(`Miau. ${C.sus[f.i].name.split(" ")[0]} es inocente.`); flash = { k: "accuse", ok: true, t: `Juli descartó a ${C.sus[f.i].name}. −${f.secs} s` }; }
    if (f.kind === "romero-ok") { sfx.ok(); world.endRomero(true); }
    if (f.kind === "romero-miss") { sfx.err(); hitTimer(f.secs); world.endRomero(false); world.react("err"); }
    if (f.kind === "bonus") { sfx.win(); world.react("ok"); toast(`¡Los dos acertaron! +${f.secs} s`); }
    if (f.kind === "quiz-miss") { sfx.err(); toast("El comisario cortó. No hubo premio."); }
    if (f.kind === "shoo-ok") { sfx.meow(); world.react("ok"); toast("Linda se bajó del escritorio. Por ahora."); }
    if (f.kind === "sab-miss") { sfx.evil(); hitTimer(f.secs); world.react("err"); toast(`Linda desordenó todo. −${f.secs} s`); }
    if (f.kind === "win") { sfx.win(); world.setView("place"); world.celebrate(); }
    if (f.kind === "lose") { sfx.lose(); world.setView("place"); world.defeat(); setTimeout(() => sfx.evil(), 600); }
    if (flash) { const fl = flash; setTimeout(() => { if (flash === fl) { flash = null; render(); } }, 3000); }
  }
  // eventos: apagón, sabotaje de Linda, llamada del comisario
  const ev = S.phase === "play" ? (S.ev || {}) : {};
  const evKey = Object.entries(ev).map(([k, E]) => k + E.state).join();
  if (evKey !== lastEvKey) {
    const was = lastEvKey; lastEvKey = evKey;
    const on = k => ev[k] && ev[k].state === "on", wasOn = k => was.includes(k + "on");
    if (on("apagon") && !wasOn("apagon")) { world.blackout(true); sfx.sting(); document.body.classList.add("apagon"); }
    if (!on("apagon") && document.body.classList.contains("apagon")) { world.blackout(false); document.body.classList.remove("apagon"); }
    if (on("sabotaje") && !wasOn("sabotaje")) { world.setView("place"); world.villainCameo("Me subo al escritorio. ¿Y?"); sfx.evil(); }
    if (on("quiz") && !wasOn("quiz")) { sfx.join(); sel.quiz = null; }
  }
  if (S.phase !== "play" && document.body.classList.contains("apagon")) { world.blackout(false); document.body.classList.remove("apagon"); }
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
    ? "Estás en la escena: ves lo que dejó el ladrón. Tu pareja tiene los registros que le dan sentido."
    : "Estás en el archivo: tenés manuales, registros y la rueda con alturas. Lo que pasó en la escena lo ve tu pareja.";
  const COND = { apagon: "Hay cortes de luz en la zona.", sabotaje: "Linda anda cerca y va a molestar.", romero: "Romero está inquieto.", quiz: "El comisario va a llamar con una pregunta." };
  const conds = Object.keys(C.events).map(k => COND[k]);
  return `
  <section class="brief">
    <div class="briefcard" id="briefcard">
      <p class="eyebrow">Nivel ${S.level}${S.streak ? ` · racha ${S.streak}` : ""} · ${esc(p.barrio)}</p>
      <h2>${esc(p.t)}</h2>
      <p>Alguien entró en ${esc(p.place)} y se llevó ${esc(p.obj)}. Hay ${C.sus.length} sospechosos retenidos. Tienen ${fmt(C.P.time)}.</p>
      ${C.P.villain ? `<p class="villain">Linda, la gata, dejó su marca. Nivel de jefa: todo cuesta más.</p>` : ""}
      <p class="roleinfo"><b>${RNAME[myRole()]}.</b> ${mine}</p>
      <div class="today"><span class="label">Pruebas de hoy</span><div class="chips">${C.stations.map(st => `<span class="chip">${STATION_NAME[st.k][1]}</span>`).join("")}</div></div>
      ${conds.length ? `<div class="today"><span class="label">Esta noche</span><ul class="conds">${conds.map(t => `<li>${t}</li>`).join("")}</ul></div>` : ""}
      <button class="cta" data-act="go">Arrancar el reloj</button>
      <p class="hint">${S.solo ? "Cuenten 3, 2, 1 y aprieten a la vez." : "Cuando uno arranca, arranca para los dos."}</p>
    </div>
  </section>`;
}

function clueBox(k) {
  if (!S.solved[k]) return "";
  const st = C.stations.find(x => x.k === k);
  return `<div class="clue">Pista: ${stationClue(st, C.c)}<span>${S.solo ? "Contásela a tu pareja." : "Los dos la ven."}</span></div>`;
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
function viewAlarma() {
  const A = C.alarm, solved = S.solved.alarma;
  if (myRole() === "campo") return `
    <div class="station"><h3>La alarma</h3>
    <p class="intro">La alarma del lugar está por sonar y borrar las grabaciones. Contale a ${esc(partnerName())} cuántos cables hay, sus colores en orden, la luz y el número de serie. Cortá el que te diga.</p>
    <div class="alarm">
      <div class="alarm-top"><span class="serial">SERIE ${A.serial}</span><span class="led${A.led ? " on" : ""}"></span></div>
      ${A.wires.map((w, i) => `<button class="wirebtn" data-act="${solved ? "" : "cut"}" data-v="${i}" ${solved ? "disabled" : ""} aria-label="Cable ${i + 1} ${w}"><span class="wn">${i + 1}</span>${wireSVG(w, solved && i === A.cut, i)}</button>`).join("")}
    </div>
    ${flashBox("alarma")}${clueBox("alarma")}</div>`;
  return `
    <div class="station"><h3>Manual de la alarma</h3>
    <p class="intro">${esc(partnerName())} tiene el panel. Preguntá cuántos cables hay y buscá la tabla que corresponde. Aplicá las reglas en orden: vale la primera que se cumpla.</p>
    <div class="manual">${[4, 5, 6].map(n => `<div class="rules"><b>${n} cables</b><ol>${ALARM_RULES[n].map(r => `<li>${r}</li>`).join("")}</ol></div>`).join("")}</div>
    ${flashBox("alarma")}${clueBox("alarma")}</div>`;
}
const DIR_TXT = { norte: "al norte", sur: "al sur", este: "al este", oeste: "al oeste" };
function viewMapa() {
  const M = C.map, solved = S.solved.mapa;
  if (myRole() === "archivo") return `
    <div class="station"><h3>Declaración del recorrido</h3>
    <p class="intro">Un vecino siguió al culpable. ${esc(partnerName())} tiene el mapa del barrio: leéle el recorrido paso a paso.</p>
    <ol class="route"><li>Salió desde <b>${M.from}</b>.</li>${M.moves.map(m => `<li>${m.st} ${m.st > 1 ? "cuadras" : "cuadra"} ${DIR_TXT[m.d]}.</li>`).join("")}<li>Ahí se subió a algo y desapareció.</li></ol>
    ${flashBox("mapa")}${clueBox("mapa")}</div>`;
  const land = {}; M.lands.forEach(l => { land[l.cell] = l.name; });
  return `
    <div class="station"><h3>El mapa del barrio</h3>
    <p class="intro">${esc(partnerName())} tiene lo que declaró un vecino. Seguí el recorrido con el dedo y marcá la esquina donde terminó. Arriba es el norte.</p>
    <div class="map"><span class="north">N ▲</span>${Array.from({ length: 25 }, (_, i) => `<button class="blk${land[i] ? " land" : ""}${sel.mapa === i ? " on" : ""}${solved && i === M.target ? " hit" : ""}" data-act="pick" data-k="mapa" data-v="${i}" ${solved ? "disabled" : ""}>${land[i] ? `<span>${land[i]}</span>` : ""}</button>`).join("")}</div>
    ${solved ? clueBox("mapa") : `<button class="cta" data-act="answer" data-k="mapa" ${sel.mapa === null ? "disabled" : ""}>Marcar esta esquina</button>${flashBox("mapa")}`}</div>`;
}
function viewFotos() {
  const F = C.fotos, solved = S.solved.fotos;
  const cell = (it, i, btn) => btn
    ? `<button class="ph${sel.fotos === i ? " on" : ""}${solved && i === F.changed ? " hit" : ""}" data-act="pick" data-k="fotos" data-v="${i}" ${solved ? "disabled" : ""}>${pixelIcon(it.t, it.c)}</button>`
    : `<div class="ph">${pixelIcon(it.t, it.c)}</div>`;
  if (myRole() === "archivo") return `
    <div class="station"><h3>La foto de ayer</h3>
    <p class="intro">La cámara sacó esta foto ayer a las 23:14. Hoy falta una cosa y apareció otra en su lugar. Describile a ${esc(partnerName())} cada objeto: qué es, de qué color y dónde está.</p>
    <div class="photo"><span class="stamp-cam">CAM 02 · AYER 23:14</span><div class="phgrid">${F.before.map((it, i) => cell(it, i, false)).join("")}</div></div>
    ${flashBox("fotos")}${clueBox("fotos")}</div>`;
  return `
    <div class="station"><h3>La escena de hoy</h3>
    <p class="intro">${esc(partnerName())} tiene la foto de ayer. Una sola cosa cambió: esa la dejó el ladrón. Encontrala.</p>
    <div class="photo now"><span class="stamp-cam">AHORA</span><div class="phgrid">${F.after.map((it, i) => cell(it, i, true)).join("")}</div></div>
    ${solved ? clueBox("fotos") : `<button class="cta" data-act="answer" data-k="fotos" ${sel.fotos === null ? "disabled" : ""}>Esto lo dejó el ladrón</button>${flashBox("fotos")}`}</div>`;
}

function viewRueda() {
  const campo = myRole() === "campo";
  const data = s => campo ? `Vehículo: ${VEH_TXT[s.veh]} · Mano: ${s.mano}` : `Talle: ${s.talle} · Estatura: ${s.estat}`;
  const chosen = sel.acc !== null && sel.acc !== undefined ? C.sus[sel.acc] : null;
  return `
    <div class="station"><h3>La rueda</h3>
    <p class="intro">${C.sus.length} personas retenidas. Vos tenés ${campo ? "vehículo y mano hábil" : "talle y estatura (mirá la pared de alturas)"}; ${esc(partnerName())} tiene el resto. Crucen los datos antes de acusar.</p>
    <div class="clues">${C.stations.map(st => S.solved[st.k] ? `<span class="ok">✓ ${stationClue(st, C.c)}</span>` : `<span class="no">— ${STATION_NAME[st.k][1]}: sin resolver</span>`).join("")}</div>
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

function viewEvents() {
  const ev = S.ev || {}, out = [];
  const sab = ev.sabotaje;
  if (sab && sab.state === "on") {
    const tapped = sab.taps[me.side], other = sab.taps[partnerSide()];
    out.push(`<div class="evmodal evil"><div class="evbox">
      <p class="eyebrow">Sabotaje</p><h3>¡Linda se subió al escritorio!</h3>
      <p>Está sentada arriba de todos los papeles. Tóquenla <b>los dos a la vez</b> para bajarla${S.solo ? "" : ` (cuenten 3, 2, 1)`}. Si no, desordena todo: −15 s.</p>
      <button class="cta shoo" data-act="shoo">¡Fuera, Linda!</button>
      <p class="hint">${S.solo ? "" : tapped && other ? "Casi: tienen que tocar al mismo tiempo." : tapped ? `Vos tocaste. Falta ${esc(partnerName())}.` : other ? `${esc(partnerName())} ya tocó. ¡Ahora vos!` : ""}</p>
    </div></div>`);
  }
  const qz = ev.quiz;
  if (qz && qz.state === "on" && C.quiz) {
    const mineAns = qz.ans[me.side];
    out.push(`<div class="evmodal"><div class="evbox">
      <p class="eyebrow">☎ Llamada del comisario</p><h3>${esc(C.quiz.q)}</h3>
      <p class="hint">Respondan cada uno por su lado, sin mirar. Si los dos aciertan: +20 s.</p>
      <div class="qopts">${C.quiz.opts.map((o, i) => `<button class="ghost qopt${mineAns === i ? " on" : ""}" data-act="quizans" data-v="${i}" ${mineAns !== undefined ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
      ${mineAns !== undefined ? `<p class="busy">Esperando a ${esc(partnerName())}</p>` : ""}
    </div></div>`);
  }
  return out.join("");
}

function viewPlay() {
  const tabs = C.stations.map(st => [st.k, STATION_NAME[st.k][0]]).concat([["rueda", "Rueda"]]);
  const st = k => k === "rueda" ? (S.wrong.length ? S.wrong.length + " desc." : "acusar") : (S.solved[k] ? "✓ lista" : "abierta");
  const views = { suela: viewSuela, cifra: viewCifra, testigos: viewTestigos, alarma: viewAlarma, mapa: viewMapa, fotos: viewFotos, rueda: viewRueda };
  const body = (views[tab] || viewRueda)();
  const net = S.solo ? "" : `<span class="dot${me.net && me.net.connected ? " on" : ""}"></span>`;
  return `
  <div class="hud">
    <div class="hl"><b>Nivel ${S.level}</b><span>${RNAME[myRole()]} ${net}</span></div>
    <div class="timer${remaining() <= 60 ? " low" : ""}" id="timer">${fmt(remaining())}</div>
    <div class="hr"><button class="mute" data-act="music" aria-pressed="${music.on}">♪</button><button class="mute" data-act="mute" aria-pressed="${!sfx.muted}">${sfx.muted ? "Mudo" : "Sonido"}</button></div>
  </div>
  ${me.side === "guest" && me.netStatus === "closed" ? `<div class="banner bad">Se cortó la conexión. <button class="ghost small" data-act="rejoin">Reconectar</button></div>` : ""}
  ${me.side === "host" && !S.solo && me.netStatus === "closed" ? `<div class="banner bad">${esc(partnerName())} se desconectó. Cuando vuelva a entrar con el código ${esc(S.code)}, sigue la partida.</div>` : ""}
  <nav class="tabs" role="tablist" style="grid-template-columns:repeat(${tabs.length},1fr)">${tabs.map(([k, t]) => `<button class="tab${k !== "rueda" && S.solved[k] ? " done" : ""}" role="tab" data-act="tab" data-v="${k}" aria-selected="${tab === k}">${t}<small>${st(k)}</small></button>`).join("")}</nav>
  ${body}
  ${viewEvents()}
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

function viewTitle() {
  return `
  <section class="title" data-act="start">
    <p class="eyebrow">Un juego para Thomas y Rocío</p>
    <h1 class="logo"><span>Expediente</span><span>a Dos</span></h1>
    <p class="tagline">Casos policiales en Malvinas Argentinas y San Miguel</p>
    <button class="press" data-act="start">Tocá para empezar</button>
    <p class="hint small">Con sonido. Mejor con auriculares o en llamada.</p>
  </section>`;
}

function screen() {
  if (!started) return "title";
  if (!me.inRoom) return "lobby";
  if (S.phase === "lobby" || !C) return "room";
  return S.phase;
}

function render() {
  const scr = screen();
  document.body.dataset.screen = scr;
  world.setShift(scr === "play" ? 0 : scr === "brief" ? 0.12 : window.innerWidth < 700 ? 0.2 : 0.16);
  const a = document.activeElement, id = a && a.id, ss = a && a.selectionStart;
  const prevScr = document.body.dataset.prev;
  document.body.dataset.prev = scr;
  musicFor(scr);
  ui.innerHTML = scr === "title" ? viewTitle() : scr === "lobby" ? viewLobby() : scr === "room" ? viewRoom() : scr === "brief" ? viewBrief() : scr === "play" ? viewPlay() : viewEnd();
  if (id) { const el = document.getElementById(id); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, ss); } catch (e) {} } }
  if (scr === "brief") animateBrief();
  if (scr === "end" && prevScr !== "end") { gsap.fromTo(".endcard", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 1.2, ease: "back.out(1.4)" }); setTimeout(() => sfx.stamp(), 1500); }
  if (scr === "play" && prevScr !== "play") gsap.fromTo("#ui > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" });
  if (scr === "play" && tabAnim) { tabAnim = false; gsap.fromTo(".station", { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, ease: "power2.out" }); }
  if (popClue) { const el = document.querySelector(".clue"); if (el && tab === popClue) gsap.fromTo(el, { scale: 0.6, rotate: -6, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "back.out(2.2)" }); popClue = null; }
  if ((scr === "lobby" || scr === "room") && prevScr !== scr) gsap.fromTo("#ui > *", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power2.out" });
  if (scr !== "play" || tab !== "rueda" || myRole() !== "archivo") { if (world.view === "lineup") world.setView("place"); }
}
let tabAnim = false, popClue = null;
// la tarjeta del caso aparece cuando termina la cinemática, aunque la pantalla se redibuje en el medio
let briefSeed = null, briefT0 = 0;
function animateBrief() {
  const el = $("#briefcard"); if (!el) return;
  if (briefSeed !== S.seed) { briefSeed = S.seed; briefT0 = performance.now(); }
  const wait = (C.P.villain ? 9.6 : 6.4) - (performance.now() - briefT0) / 1000;
  const h2 = el.querySelector("h2"), full = C.place.t;
  if (wait <= -1.5) { el.style.opacity = 1; return; }
  h2.textContent = "";
  gsap.fromTo(el, { y: 60, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.7, delay: Math.max(0, wait), ease: "power3.out",
    onComplete: () => {
      let i = 0;
      const iv = setInterval(() => { if (!document.body.contains(h2)) return clearInterval(iv); h2.textContent = full.slice(0, ++i); if (i % 2) sfx.typeKey(); if (i >= full.length) clearInterval(iv); }, 45);
    }
  });
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
      tab = v; quitArm = false; tabAnim = true;
      world.setView(v === "rueda" && myRole() === "archivo" && !(S.romero && S.romero.active) ? "lineup" : "place");
      if (v === "rueda" && myRole() === "archivo") world.buildLineup(C.sus, S.wrong);
      render(); ui.scrollTo({ top: 0 }); break;
    case "pick":
      if (["suela", "acc", "mapa", "fotos"].includes(k)) sel[k] = +v; else sel[k] = v;
      sfx.click(); render(); break;
    case "answer": {
      let val = sel[k];
      if (k === "cifra") { const el = $("#cifra"); val = el ? el.value : sel.cifra; if (!normPhrase(val)) return; }
      if (k === "testigos") { if (!sel.man || !sel.est) return; val = { man: sel.man, est: sel.est }; }
      if (["suela", "mapa", "fotos"].includes(k) && (val === null || val === undefined)) return;
      act({ type: "answer", k, v: val }); break;
    }
    case "accuse": if (sel.acc !== null && sel.acc !== undefined) { act({ type: "accuse", i: sel.acc }); sel.acc = null; } break;
    case "juli": act({ type: "juli" }); break;
    case "cut": sfx.click(); act({ type: "answer", k: "alarma", v: +v }); break;
    case "shoo": sfx.meow(); act({ type: "shoo" }); break;
    case "quizans": sel.quiz = +v; act({ type: "quiz", v: +v }); break;
    case "next": act({ type: "next" }); break;
    case "swapnext": act({ type: "swap" }); act({ type: "next" }); break;
    case "mute": sfx.toggle(); render(); break;
    case "music": music.toggle(); render(); break;
    case "start":
      if (started) break;
      sfx.init(); music.start(); sfx.start();
      music.setAmbience(world.ambience ? world.ambience.sound : "indoor", false);
      iris(() => { started = true; render(); if (joinDraft.length === 4 && me.who) joinRoom(joinDraft); });
      break;
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

// la linterna del apagón sigue al dedo o al mouse
window.addEventListener("pointermove", e => { if (document.body.classList.contains("apagon")) { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); } }, { passive: true });
window.addEventListener("pointerdown", e => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); }, { passive: true });

/* ---------------- reloj ---------------- */
setInterval(() => {
  if (me.side === "host") hostTick();
  if (screen() !== "play") { world.setDanger(0); return; }
  const left = remaining();
  world.setDanger(left <= 60 && !S.end ? 0.25 + 0.55 * (1 - left / 60) : 0);
  if (started) music.setMode(left <= 60 ? "tense" : "play");
  const t = $("#timer");
  if (t) {
    const txt = fmt(left);
    if (t.firstChild && t.firstChild.nodeValue !== txt) t.firstChild.nodeValue = txt;
    t.classList.toggle("low", left <= 60);
  }
  const sec = Math.ceil(left);
  if (sec !== lastSec) { if (left <= 30 && left > 0) sfx.tick(); lastSec = sec; }
}, 250);

render();

// ganchos para pruebas automáticas (?debug)
if (new URLSearchParams(location.search).has("debug")) window.__ead = () => ({ S, C, me, world });
