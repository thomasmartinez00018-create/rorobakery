// Gatos de Linda — menús, salas, bucle de juego y sincronización entre los dos celus.
import { Sim, WEAPONS, PASSIVES, ENEMY_NAME, MAP } from "./engine.js";
import { buildSprites, SPR, portrait } from "./sprites.js";
import { Renderer, THEMES } from "./render.js";
import { Net, makeCode, cleanCode } from "./net.js";
import { sfx } from "./sfx.js";
import { music } from "./music.js";
import { Input } from "./input.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const NAME = { thomas: "Thomas", rocio: "Rocío" };
const ICON = { patada: "thomas", medialuna: "medialuna", juli: "juli", romero: "romero", mate: "mate", bondi: "bus", rodillo: "rodillo", torta: "torta", guantes: "guante", zapatillas: "zapa", termo: "termo", iman: "iman", amargo: "mate", abrazo: "corazon", alfajor: "alfajor" };
const UPG = { hp: ["Vida", "+10 de vida"], dmg: ["Fuerza", "+8% de daño"], spd: ["Velocidad", "+5% de velocidad"], mag: ["Imán", "+15% de alcance"] };
const UPG_COST = [15, 35, 70, 120, 200];
const MAP_COST = { plaza: 0, estacion: 60, cancha: 150 };
let coinIc = "";
const COIN = () => coinIc || (coinIc = `<img class="coin-ic" src="${portrait("moneda", 3)}" alt="monedas">`);

/* ---------------- perfil guardado ---------------- */
const LS = "gdl-profile";
function loadProfile() {
  try { const p = JSON.parse(localStorage.getItem(LS)); if (p && p.v === 1) return p; } catch (e) {}
  return { v: 1, who: null, coins: 0, up: { hp: 0, dmg: 0, spd: 0, mag: 0 }, maps: { plaza: true }, best: { t: 0, k: 0, lv: 0 }, wins: 0, runs: 0 };
}
let prof = loadProfile();
const save = () => { try { localStorage.setItem(LS, JSON.stringify(prof)); } catch (e) {} };

/* ---------------- estado general ---------------- */
buildSprites();
const R = new Renderer($("#game"));
const input = new Input($("#touch"), $("#joy-base"), $("#joy-knob"));
const ui = $("#ui"), hud = $("#hud");
let screen = "title";
let map = "plaza";
const me = { side: "host", net: null, code: null, partner: null, partnerMeta: null, connected: false };
let sim = null, snap = null, runId = 0, runOn = false, paused = false, endShown = false, earned = 0;
let pendingEv = [], sendAcc = 0, lastSeen = 0;
let guestPos = null, guestInput = { pos: null, face: 1, moving: 0, ult: false };
const smooth = new Map();
let bannerT = 0, errMsg = null, busyMsg = null, joinDraft = cleanCode(new URLSearchParams(location.search).get("sala") || "");

/* ---------------- demo de fondo en el menú ---------------- */
let demo = null;
function newDemo() { demo = new Sim(map); demo.addPlayer("host", prof.who || "thomas"); demo.t = 40; }
newDemo(); R.setMap(map);

/* ---------------- red ---------------- */
function netHandlers() {
  return {
    status(st) {
      me.connected = st === "connected";
      if (st === "connected") { sfx.join(); if (me.side === "guest") me.net.send({ t: "hello", who: prof.who, meta: prof.up }); else sendLobby(); }
      if (st === "busy") { errMsg = "Esa sala ya está llena."; leave(); }
      if (st === "closed" && runOn) banner(me.side === "host" ? "Se desconectó tu pareja" : "Se cortó la conexión", "Vuelvan al menú y armen la sala de nuevo");
      draw();
    },
    data(d) {
      if (!d || typeof d !== "object") return;
      if (me.side === "host") {
        if (d.t === "hello") { me.partner = d.who === "rocio" ? "rocio" : "thomas"; me.partnerMeta = cleanMeta(d.meta); sendLobby(); draw(); }
        if (d.t === "in" && d.pos && isFinite(d.pos.x) && isFinite(d.pos.y)) { guestInput.pos = { x: +d.pos.x, y: +d.pos.y }; guestInput.face = d.face < 0 ? -1 : 1; guestInput.moving = d.moving ? 1 : 0; if (d.ult) guestInput.ult = true; }
        if (d.t === "pick" && sim) sim.pick("guest", d.i | 0);
      } else {
        if (d.t === "lobby") { me.partner = d.who; map = THEMES[d.map] ? d.map : "plaza"; draw(); }
        if (d.t === "start") startRun(d.map, d.chars);
        if (d.t === "s" && d.s) { snap = d.s; lastSeen = performance.now(); onEvents(snap.ev || []); }
        if (d.t === "menu") { endRun(); toMenu(); }
      }
    }
  };
}
const cleanMeta = m => { const o = {}; for (const k of ["hp", "dmg", "spd", "mag"]) o[k] = Math.max(0, Math.min(5, (m && m[k]) | 0)); return o; };
function sendLobby() { if (me.net && me.net.connected) me.net.send({ t: "lobby", who: prof.who, map }); }

async function createRoom() {
  busyMsg = "Creando sala"; errMsg = null; draw();
  me.side = "host"; me.partner = null; me.net = new Net(netHandlers());
  for (let i = 0; i < 4; i++) {
    const code = makeCode();
    try { await me.net.host(code); me.code = code; busyMsg = null; screen = "room"; draw(); return; }
    catch (e) { if (e && e.type !== "unavailable-id") break; }
  }
  busyMsg = null; errMsg = "No se pudo crear la sala. Probá de nuevo o jugá solo."; draw();
}
async function joinRoom(code) {
  code = cleanCode(code); if (code.length !== 4) return;
  busyMsg = "Entrando a la sala " + code; errMsg = null; draw();
  me.side = "guest"; me.net = new Net(netHandlers());
  try { await me.net.join(code); me.code = code; busyMsg = null; screen = "room"; draw(); }
  catch (e) { busyMsg = null; me.side = "host"; errMsg = e && e.type === "peer-unavailable" ? `No existe la sala ${code}.` : "No se pudo conectar."; draw(); }
}
function leave() { if (me.net) me.net.close(); me.net = null; me.connected = false; me.side = "host"; me.partner = null; }

/* ---------------- partida ---------------- */
function hostStart() {
  const chars = { host: prof.who, guest: me.connected ? me.partner : null };
  if (me.net && me.net.connected) me.net.send({ t: "start", map, chars });
  startRun(map, chars);
}
function startRun(m, chars) {
  map = THEMES[m] ? m : "plaza"; R.setMap(map);
  runId++; runOn = true; paused = false; endShown = false; earned = 0; smooth.clear(); pendingEv = [];
  if (me.side === "host") {
    sim = new Sim(map);
    sim.addPlayer("host", chars.host || "thomas", prof.up);
    if (chars.guest) sim.addPlayer("guest", chars.guest, me.partnerMeta || {});
    snap = sim.snapshot();
  } else { sim = null; snap = null; guestPos = null; }
  screen = "run"; music.set("run"); sfx.play("levelup");
  banner(THEMES[map].name, "Aguanten hasta que aparezca Linda");
  draw();
}
function endRun() { runOn = false; sim = null; }
function toMenu() { screen = me.net && me.code ? "room" : "menu"; music.set("menu"); newDemo(); R.setMap(map); draw(); }

function onEvents(ev) {
  const sounds = R.events(ev, me.side);
  for (const s of sounds) if (s) sfx.play(s);
  for (const e of ev) {
    if (e[0] === "boss") { banner(e[1] === "luz" ? "¡LUZ!" : "¡LINDA!", e[1] === "luz" ? "La gata de la abuela está furiosa" : "La jefa en persona. Derrótenla para ganar"); music.set("boss"); }
    if (e[0] === "bossdown") { banner("¡Luz se rindió!", "Dejó un alfajor"); music.set("run"); }
    if (e[0] === "horde") banner("¡HORDA!", "Los rodearon");
    if (e[0] === "down") { const who = e[3] === me.side ? "Caíste" : `¡Cayó ${NAME[(snap && snap.P[e[3]] && snap.P[e[3]].c) || ""] || "tu pareja"}!`; banner(who, e[3] === me.side ? "Esperá que te levanten" : "Parate al lado para levantarlo"); }
    if (e[0] === "levelup") music.set("pause");
  }
}

/* ---------------- bucle ---------------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  let V;
  if (screen === "run" && me.side === "host" && sim) {
    const inp = { host: { dir: input.vec, ult: input.takeUlt() } };
    if (sim.players.guest) { inp.guest = { ...guestInput }; guestInput.ult = false; }
    if (!paused) sim.step(dt, inp);
    snap = sim.snapshot();
    onEvents(snap.ev); pendingEv.push(...snap.ev);
    sendAcc += dt;
    if (me.net && me.net.connected && sendAcc >= 0.05) { sendAcc = 0; me.net.send({ t: "s", s: { ...snap, ev: pendingEv } }); pendingEv = []; }
    V = view(snap, "host");
  } else if (screen === "run" && me.side === "guest") {
    if (snap) {
      const mine = snap.P.guest;
      if (mine) {
        if (!guestPos || mine.d) guestPos = { x: mine.x, y: mine.y, face: mine.f, moving: 0 };
        else if (snap.st === "run") {
          const v = input.vec, m = Math.hypot(v.x, v.y);
          guestPos.moving = m > 0.1 ? 1 : 0;
          if (m > 0.1) { guestPos.x = Math.max(12, Math.min(MAP - 12, guestPos.x + v.x * mine.sp * dt)); guestPos.y = Math.max(12, Math.min(MAP - 12, guestPos.y + v.y * mine.sp * dt)); if (Math.abs(v.x) > 0.15) guestPos.face = Math.sign(v.x); }
        } else guestPos.moving = 0;
        sendAcc += dt;
        const ult = input.takeUlt() || guestUlt;
        if (me.net && (sendAcc >= 0.05 || ult)) { sendAcc = 0; me.net.send({ t: "in", pos: { x: guestPos.x, y: guestPos.y }, face: guestPos.face, moving: guestPos.moving, ult }); guestUlt = false; }
      }
      V = view(snap, "guest", guestPos);
    }
  } else {
    // menú: demo de fondo con un personaje paseando
    const a = now / 1600;
    demo.step(dt, { host: { dir: { x: Math.cos(a), y: Math.sin(a * 1.3) } } });
    if (demo.state === "levelup") for (const s of Object.keys(demo.offers)) demo.pick(s, 0);
    if (demo.state !== "run" && demo.state !== "levelup") newDemo();
    const ds = demo.snapshot(); R.events(ds.ev, "host");
    V = view(ds, "host");
  }
  if (V) R.frame(V, dt);
  if (screen === "run" && snap) updateHud(dt);
  requestAnimationFrame(loop);
}
let guestUlt = false;

function view(s, local, override) {
  const players = {};
  for (const [side, p] of Object.entries(s.P)) players[side] = side === local && override && !p.d ? { ...p, x: override.x, y: override.y, f: override.face, m: override.moving } : p;
  const enemies = [];
  const pl = Object.values(players);
  const E = s.E, guest = local === "guest";
  const seen = new Set();
  for (let i = 0; i < E.length; i += 6) {
    const id = E[i], tx = E[i + 2], ty = E[i + 3];
    let x = tx, y = ty;
    if (guest) { const o = smooth.get(id); if (o) { o.x += (tx - o.x) * 0.35; o.y += (ty - o.y) * 0.35; x = o.x; y = o.y; } else smooth.set(id, { x, y }); seen.add(id); }
    let fx = 1, bd = Infinity; for (const p of pl) { const d = Math.abs(p.x - x) + Math.abs(p.y - y); if (d < bd) { bd = d; fx = p.x < x ? -1 : 1; } }
    enemies.push({ id, type: E[i + 1], x, y, flash: E[i + 4], charge: E[i + 5], fx });
  }
  if (guest && smooth.size > seen.size + 50) for (const k of smooth.keys()) if (!seen.has(k)) smooth.delete(k);
  return { local, players, enemies, proj: s.B, eproj: s.H, gems: s.G, pickups: s.K, pools: s.U, bombs: s.M, buses: s.Bu };
}

/* ---------------- HUD ---------------- */
let hudBuilt = false;
function buildHud() {
  hud.innerHTML = `
    <div class="xpbar"><i id="xpfill"></i></div>
    <div class="toprow">
      <span class="lvl" id="lvl">NV 1</span>
      <span class="time" id="time">00:00</span>
      <span class="kills"><img src="${portrait("gato", 2)}" alt=""><b id="kills">0</b></span>
    </div>
    <div class="hps" id="hps"></div>
    <div class="bossbar" id="bossbar" hidden><span id="bossname"></span><div><i id="bossfill"></i></div></div>
    <button class="pausebtn" data-act="pause" aria-label="Pausa">II</button>
    <button class="ultbtn" id="ultbtn" data-act="ult"><span id="ultlabel">COMBO</span></button>
    <div class="banner" id="banner"><b id="btitle"></b><span id="bsub"></span></div>`;
  hudBuilt = true;
}
function banner(title, sub) { bannerT = 2.6; const b = $("#banner"); if (!b) return; $("#btitle").textContent = title; $("#bsub").textContent = sub || ""; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); }
let lastOffersKey = "", resultTimer = 0;
function updateHud(dt) {
  if (!hudBuilt) buildHud();
  hud.hidden = false;
  const s = snap;
  $("#xpfill").style.width = Math.min(100, s.xp / s.xn * 100) + "%";
  $("#lvl").textContent = "NV " + s.lv;
  $("#time").textContent = fmt(s.t);
  $("#kills").textContent = s.kl;
  const hps = Object.entries(s.P).map(([side, p]) => `<div class="hp ${p.d ? "down" : ""}"><img src="${portrait(p.c, 2)}" alt=""><div><i style="width:${Math.max(0, p.hp / p.mh * 100)}%"></i></div>${p.d ? "<em>¡AYUDA!</em>" : ""}</div>`).join("");
  const hpEl = $("#hps"); if (hpEl.dataset.v !== hps) { hpEl.innerHTML = hps; hpEl.dataset.v = hps; }
  const mine = s.P[me.side];
  if (mine) {
    const u = $("#ultbtn"); u.style.setProperty("--k", Math.round(mine.u * 100) + "%"); u.classList.toggle("ready", mine.u >= 1);
    $("#ultlabel").textContent = mine.c === "thomas" ? "COMBO" : "TORTAS";
  }
  const bb = $("#bossbar");
  if (s.boss) { bb.hidden = false; $("#bossname").textContent = s.boss.n === "luz" ? "LUZ" : "LINDA, LA JEFA"; $("#bossfill").style.width = s.boss.hp * 100 + "%"; } else bb.hidden = true;
  const b = $("#banner"); if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) b.classList.remove("on"); }
  // subida de nivel
  const of = s.st === "levelup" ? s.of && s.of[me.side] : null;
  const key = s.st + ":" + s.lv + ":" + (of ? of.pick : "-") + ":" + JSON.stringify(of && of.opts);
  if (key !== lastOffersKey) { lastOffersKey = key; renderLevelUp(s, of); }
  if (s.st === "run" && music.mode === "pause") music.set(s.boss ? "boss" : "run");
  // fin
  if ((s.st === "over" || s.st === "win") && !endShown) {
    resultTimer += dt;
    if (resultTimer > 1.6) { endShown = true; resultTimer = 0; finish(s); }
  }
}
function renderLevelUp(s, of) {
  const box = $("#levelup");
  if (!of) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  if (of.pick !== null) { box.innerHTML = `<div class="lvbox"><h2>¡Nivel ${s.lv}!</h2><p class="wait">Esperando que tu pareja elija…</p></div>`; return; }
  const mine = s.P[me.side];
  box.innerHTML = `<div class="lvbox"><h2>¡Nivel ${s.lv}!</h2><p>Elegí una mejora</p>
    <div class="opts">${of.opts.map((o, i) => {
      const def = o.kind === "w" ? WEAPONS[o.id] : o.kind === "p" ? PASSIVES[o.id] : { name: "Alfajor", desc: "Te recuperás entero." };
      const isNew = o.kind === "w" && !(mine && mine.w && mine.w[o.id]);
      return `<button class="opt" data-act="pick" data-i="${i}">
        <img src="${portrait(ICON[o.id] || "gem1", 4)}" alt="">
        <span class="on"><b>${esc(def.name)}</b>${isNew ? `<em>NUEVA</em>` : `<small>Nivel ${o.lv}</small>`}<span>${esc(def.desc)}</span></span>
        <span class="stars">${"■".repeat(o.lv)}${"□".repeat(Math.max(0, (def.max || 1) - o.lv))}</span></button>`;
    }).join("")}</div></div>`;
  sfx.play("levelup");
}
function finish(s) {
  const win = s.st === "win";
  earned = s.co + Math.floor(s.kl / 12) + Math.floor(s.t / 20) + (win ? 60 : 0);
  prof.coins += earned; prof.runs++;
  if (win) prof.wins++;
  const newBest = s.t > prof.best.t;
  prof.best = { t: Math.max(prof.best.t, s.t), k: Math.max(prof.best.k, s.kl), lv: Math.max(prof.best.lv, s.lv) };
  save();
  hud.hidden = true; $("#levelup").hidden = true;
  screen = "results"; music.set("menu");
  const duel = Object.values(s.P).map(p => ({ c: p.c, k: p.k })).sort((a, b) => b.k - a.k);
  draw({ win, t: s.t, k: s.kl, lv: s.lv, newBest, duel });
}

/* ---------------- pantallas ---------------- */
function charCard(c) {
  return `<button class="char ${prof.who === c ? "on" : ""}" data-act="who" data-v="${c}">
    <img src="${portrait(c, 6)}" alt=""><b>${NAME[c]}</b><span>${c === "thomas" ? "Patada Bielli · cuerpo a cuerpo" : "Medialunas · a distancia"}</span></button>`;
}
function mapCards() {
  return `<div class="maps">${Object.entries(THEMES).map(([k, t]) => {
    const owned = prof.maps[k];
    return `<button class="mapc ${map === k ? "on" : ""} ${owned ? "" : "locked"}" data-act="${owned ? "map" : "buymap"}" data-v="${k}"><b>${t.name}</b><span>${owned ? (map === k ? "Elegido" : "Elegir") : `Desbloquear · ${MAP_COST[k]}${COIN()}`}</span></button>`;
  }).join("")}</div>`;
}
let lastResult = null;
function draw(result) {
  if (result) lastResult = result;
  document.body.dataset.screen = screen;
  if (screen !== "run") hud.hidden = true;
  if (screen === "title") {
    ui.innerHTML = `<section class="title" data-act="start">
      <h1 class="logo"><span>GATOS</span><span>de LINDA</span></h1>
      <p class="tag">Supervivientes del barrio · para dos</p>
      <button class="press" data-act="start">Tocá para empezar</button></section>`;
    return;
  }
  if (screen === "menu") {
    ui.innerHTML = `<section class="panel menu">
      <div class="brand"><h1 class="logo small"><span>GATOS</span><span>de LINDA</span></h1><span class="coins">${COIN()}${prof.coins}</span></div>
      <p class="label">¿Quién sos?</p>
      <div class="chars">${charCard("thomas")}${charCard("rocio")}</div>
      ${errMsg ? `<p class="err">${esc(errMsg)}</p>` : ""}
      ${busyMsg ? `<p class="busy">${esc(busyMsg)}</p>` : `
      <div class="btns">
        <button class="big" data-act="create" ${prof.who ? "" : "disabled"}>Jugar de a dos</button>
        <div class="joinrow"><input id="code" maxlength="4" placeholder="CÓDIGO" value="${esc(joinDraft)}" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="mid" data-act="join" ${prof.who ? "" : "disabled"}>Unirme</button></div>
        <button class="mid" data-act="solo" ${prof.who ? "" : "disabled"}>Jugar solo</button>
        <button class="mid ghost" data-act="shop">Taller de mejoras</button>
      </div>`}
      <p class="rec">Récord: ${fmt(prof.best.t)} · ${prof.best.k} gatos · ${prof.wins} victorias</p>
    </section>`;
    return;
  }
  if (screen === "room" || screen === "solo") {
    const solo = screen === "solo";
    const partner = me.partner ? NAME[me.partner] : null;
    ui.innerHTML = `<section class="panel room">
      ${solo ? `<p class="label">Jugás solo como ${NAME[prof.who]}</p>` : `
      <p class="label">Sala</p><div class="code">${esc(me.code || "")}</div>
      ${me.side === "host" ? `<button class="mid ghost" data-act="share">Compartir link</button>` : ""}
      <p class="status ${me.connected ? "on" : ""}">${me.connected ? `Conectados: ${NAME[prof.who]} y ${partner || "…"}` : "Esperando que entre tu pareja…"}</p>`}
      <p class="label">Mapa</p>
      ${me.side === "host" ? mapCards() : `<p class="mapname">${THEMES[map].name}</p>`}
      ${me.side === "host" ? `<button class="big" data-act="go" ${solo || me.connected ? "" : "disabled"}>¡A jugar!</button>` : `<p class="busy">Esperando que arranque ${partner || "tu pareja"}</p>`}
      <button class="link" data-act="back">Volver</button>
    </section>`;
    return;
  }
  if (screen === "results") {
    const r = lastResult;
    ui.innerHTML = `<section class="panel results">
      <h2 class="${r.win ? "win" : "lose"}">${r.win ? "¡Derrotaron a Linda!" : "Los gatos ganaron"}</h2>
      <p>${r.win ? "El barrio está a salvo. Por esta noche." : "Linda se quedó con el barrio. Revancha."}</p>
      ${r.duel && r.duel.length > 1 ? `<div class="duel">${r.duel.map((d, i) => `<div class="${i === 0 ? "mvp" : ""}"><img src="${portrait(d.c, 3)}" alt=""><b>${NAME[d.c]}</b><span>${d.k} gatos</span>${i === 0 ? "<em>MVP</em>" : ""}</div>`).join("")}</div>` : ""}
      <div class="stats"><div><b>${fmt(r.t)}</b><span>tiempo${r.newBest ? " · ¡récord!" : ""}</span></div><div><b>${r.k}</b><span>gatos</span></div><div><b>${r.lv}</b><span>nivel</span></div><div><b>+${earned}</b><span>monedas</span></div></div>
      ${me.side === "host" ? `<button class="big" data-act="again">Revancha</button>` : `<p class="busy">Esperando la revancha</p>`}
      <button class="mid ghost" data-act="shop">Taller (${COIN()}${prof.coins})</button>
      <button class="link" data-act="menu">Menú</button>
    </section>`;
    return;
  }
  if (screen === "shop") {
    ui.innerHTML = `<section class="panel shop">
      <div class="brand"><h2>Taller</h2><span class="coins">${COIN()}${prof.coins}</span></div>
      <p class="hint">Mejoras permanentes para tu personaje. Las monedas salen de cada partida.</p>
      ${Object.entries(UPG).map(([k, [n, d]]) => { const lv = prof.up[k], cost = UPG_COST[lv]; return `<div class="upg"><div><b>${n}</b><span>${d} · nivel ${lv}/5</span><span class="stars">${"■".repeat(lv)}${"□".repeat(5 - lv)}</span></div><button class="mid" data-act="buy" data-v="${k}" ${lv >= 5 || prof.coins < cost ? "disabled" : ""}>${lv >= 5 ? "Máximo" : `${cost}${COIN()}`}</button></div>`; }).join("")}
      <button class="link" data-act="back">Volver</button>
    </section>`;
  }
}

/* ---------------- eventos de la interfaz ---------------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  sfx.init();
  if (a !== "ult" && a !== "pick") sfx.click();
  switch (a) {
    case "start": music.start(); music.set("menu"); screen = "menu"; if (joinDraft.length === 4 && prof.who) joinRoom(joinDraft); draw(); break;
    case "who": prof.who = v; save(); newDemo(); draw(); break;
    case "create": createRoom(); break;
    case "join": { const el = $("#code"); joinRoom(el ? el.value : joinDraft); break; }
    case "solo": leave(); me.side = "host"; screen = "solo"; draw(); break;
    case "shop": shopBack = screen; screen = "shop"; draw(); break;
    case "buy": { const lv = prof.up[v], cost = UPG_COST[lv]; if (lv < 5 && prof.coins >= cost) { prof.coins -= cost; prof.up[v]++; save(); sfx.play("coin"); } draw(); break; }
    case "map": map = v; R.setMap(map); newDemo(); sendLobby(); draw(); break;
    case "buymap": if (prof.coins >= MAP_COST[v]) { prof.coins -= MAP_COST[v]; prof.maps[v] = true; map = v; save(); R.setMap(map); newDemo(); sendLobby(); sfx.play("coin"); } else { errMsg = null; } draw(); break;
    case "go": hostStart(); break;
    case "again": hostStart(); break;
    case "menu": if (me.side === "host" && me.net && me.net.connected) me.net.send({ t: "menu" }); endRun(); toMenu(); break;
    case "back": if (screen === "shop") screen = shopBack || "menu"; else { leave(); screen = "menu"; me.code = null; } errMsg = null; draw(); break;
    case "share": { const url = location.origin + location.pathname + "?sala=" + me.code; if (navigator.share) navigator.share({ title: "Gatos de Linda", text: "Entrá a mi sala", url }).catch(() => {}); else navigator.clipboard && navigator.clipboard.writeText(url).then(() => banner("Link copiado", "")).catch(() => {}); break; }
    case "pick": { const i = +b.dataset.i; if (me.side === "host") sim && sim.pick("host", i); else me.net && me.net.send({ t: "pick", i }); sfx.play("coin"); break; }
    case "ult": if (me.side === "host") input.ultPressed = true; else guestUlt = true; break;
    case "pause":
      if (me.side === "host" && !(me.net && me.net.connected)) { paused = !paused; b.textContent = paused ? "▶" : "II"; if (paused) banner("Pausa", "Tocá ▶ para seguir"); }
      else if (confirmQuit) { if (me.net && me.side === "host") me.net.send({ t: "menu" }); endRun(); toMenu(); confirmQuit = false; }
      else { confirmQuit = true; banner("¿Salir?", "Tocá II otra vez para volver al menú"); setTimeout(() => { confirmQuit = false; }, 2500); }
      break;
  }
});
let confirmQuit = false, shopBack = "menu";
document.addEventListener("input", e => { if (e.target.id === "code") { joinDraft = cleanCode(e.target.value); e.target.value = joinDraft; } });

if (new URLSearchParams(location.search).has("debug")) window.__g = () => ({ sim, snap, me, R, prof, input });
draw();
requestAnimationFrame(loop);
