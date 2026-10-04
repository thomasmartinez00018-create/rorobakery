// Gatos de Linda — menús, salas, bucle de juego y sincronización entre los dos celus.
import { Sim, WEAPONS, PASSIVES, MAPS, EVO_OF, chapterGuion, MID_IDS, coinsFor, METAS_TXT, ALCANCIA } from "./engine.js";
import { buildSprites, SPR, portrait as portraitPng } from "./sprites.js";
import { Renderer, THEMES } from "./render.js";
import { Net, makeCode, cleanCode, PROTO } from "./net.js";
import { sfx } from "./sfx.js";
import { music } from "./music.js";
import { Input } from "./input.js";
import { loadProfile, saveProfile, requestPersist, exportCode, importCode, BACKUP_KEYS } from "./profile.js";

const $ = s => document.querySelector(s);
// retratos memorizados: portrait() codifica un PNG cada vez (toDataURL) y el HUD lo pide en cada cuadro
const portraitMemo = new Map();
const portrait = (name, scale = 6) => { const k = name + "|" + scale; let u = portraitMemo.get(k); if (!u) { u = portraitPng(name, scale); if (u) portraitMemo.set(k, u); } return u; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const NAME = { thomas: "Thomas", rocio: "Rocío" };
const ICON = { patada: "thomas", medialuna: "medialuna", juli: "juli", romero: "romero", mate: "mate", bondi: "bus", rodillo: "rodillo", torta: "torta", guantes: "guante", zapatillas: "zapa", termo: "termo", iman: "iman", amargo: "mate", abrazo: "corazon", delantal: "delantal", vendas: "vendas", alfajor: "alfajor" };
const HZ_BANNER = { tren: ["¡Viene el tren!", "Salgan de las vías"], fletero: ["¡El fletero!", "Pasa la camioneta sin frenar"], cortadora: ["¡La cortadora!", "El canchero no mira"], carritos: ["¡Carritos!", "Se soltó una fila del súper"], autos: ["¡Auto!", "Cuidado en el estacionamiento"], trote: ["¡Entrada en calor!", "Pasa la fila trotando"] };
const UPG = { hp: ["Vida", "+10 de vida"], dmg: ["Fuerza", "+8% de daño"], spd: ["Velocidad", "+5% de velocidad"], mag: ["Imán", "+15% de alcance"] };
const UPG_COST = [25, 50, 100, 180, 300]; // dinámica 9: x1,5 porque ganar ahora paga x1,5 (el Taller dura lo mismo)
// dinámica 9: premios de primera victoria por mapa y por meta nueva (x el multiplicador del mapa)
const FIRST_WIN = 150, NEW_META = 40;
const alcOn = id => { const a = ALCANCIA.find(x => x.id === id); return !!a && prof.arcade.alc >= a.at; };
const optOn = id => alcOn(id) && !!prof.arcade.opt[id];
// dinámica 3: carteles del evento de mitad de partida (inicio, fin, y fin ganado para el sparring)
const MID_BANNER = {
  corbata: [["¡Corbata se escapó!", "El perro de la abuela los ayuda 30 segundos"], ["Corbata volvió a su casa", "Gracias, Corbata"]],
  apagon: [["¡Apagón en la estación!", "Los gatos negros aprovechan la oscuridad"], ["Volvió la luz", ""]],
  liquidacion: [["¡Liquidación de cajones!", "Caen cajones: ojo con las sombras rojas"], ["Terminó la liquidación", "Rompan los cajones que quedaron"]],
  sparring: [["¡Sparring!", "Un gato con guantes: tienen 30 segundos para ganarle"], ["Terminó el round", "El sparring se fue a las duchas"], ["¡Le ganaron al sparring!", "Caja de Roro's y monedas extra"]],
  riego: [["¡Se prendió el riego!", "Los gatos mojados van más lento"], ["Se apagó el riego", ""]],
  promo: [["¡Promo 2x1!", "Salen el doble de gatos, pero más flojitos"], ["Terminó la promo", ""]],
  salida: [["¡Salida del cine!", "Los autos pasan sin parar: llévenles los gatos"], ["Se vació el estacionamiento", ""]]
};
const MID_HUD = { corbata: "Corbata", apagon: "Apagón", liquidacion: "Liquidación", sparring: "Sparring", riego: "Riego", promo: "Promo 2x1", salida: "Salida del cine" };
const MAP_COST = { plaza: 0, estacion: 60, feria: 120, bielli: 150, cancha: 180, tortugas: 260, terrazas: 350 };
let coinIc = "";
const COIN = () => coinIc || (coinIc = `<img class="coin-ic" src="${portrait("moneda", 3)}" alt="monedas">`);

/* ---------------- perfil guardado (js/profile.js: v2 con migración desde v1) ---------------- */
let prof = loadProfile();
// cuando ya hay progreso que cuidar, se pide al navegador que no borre el guardado
const save = () => { saveProfile(prof); if (prof.runs > 0) requestPersist(); };
let backupIn = "", backupMsg = null, backupPending = null;

/* ---------------- estado general ---------------- */
buildSprites();
const R = new Renderer($("#game"));
const input = new Input($("#touch"), $("#joy-base"), $("#joy-knob"));
const ui = $("#ui"), hud = $("#hud");
let screen = "title";
let map = "plaza";
const me = { side: "host", net: null, code: null, partner: null, partnerMeta: null, connected: false, protoBad: false };
const PROTO_MSG = "Actualizá la página: tu pareja tiene otra versión del juego. Que la actualice también y vuelvan a entrar.";
let sim = null, snap = null, runId = 0, runOn = false, paused = false, endShown = false, earned = 0;
let pendingEv = [], sendAcc = 0, lastSeen = 0;
let guestPos = null, guestInput = { pos: null, face: 1, moving: 0, ult: false, dash: false };
const smooth = new Map();
let luzMsgAt = 0; // dinámica 2: para no repetir el cartel de Luz en cada carga
let stealAt = 0; // dinámica 3
const comboMsgAt = {}; // dinámica 5
const COMBO_BANNER = { mate: ["¡Medialuna al mate!", "Sale mojada: pega más y frena"], torta: ["¡Patada a la torta!", "Gato pateado a la explosión: doble daño"], juli: ["¡Juli marca, Romero muerde!", "Triple daño al gato marcado"] };
let arcadeRuns = 0; // dinámica 4: partidas de arcade en esta sesión (el anfitrión decide el arranque rápido)
let bannerT = 0, errMsg = null, busyMsg = null, joinDraft = cleanCode(new URLSearchParams(location.search).get("sala") || "");

/* ---------------- modo historia (js/story.js, si existe; si no, nada cambia) ---------------- */
const QS = new URLSearchParams(location.search);
let STORY = null, capSel = null, curCap = null;
import("./story.js").then(m => {
  // el story.js de ejemplo solo aparece con ?debug o ?historia, así no se ve en el juego publicado
  if (m.EXAMPLE && !QS.has("debug") && !QS.has("historia")) return;
  if (Array.isArray(m.CHAPTERS) && m.CHAPTERS.length) { STORY = m; if (screen !== "run") draw(); }
}).catch(() => {});
const chapter = id => (STORY && id && STORY.CHAPTERS.find(c => c.id === id)) || null;
const speaker = who => (STORY && STORY.SPEAKERS && STORY.SPEAKERS[who] && STORY.SPEAKERS[who].name) || NAME[who] || who || "";
// capítulo terminado: lo guardan los dos celus (el anfitrión además le avisa al invitado con {t:"cap"})
function saveChapter(id, n) {
  if (!id) return;
  const ch = chapter(id), num = ch ? ch.n | 0 : n | 0;
  prof.story.done[id] = true; prof.story.cap = Math.max(prof.story.cap | 0, num + 1);
  for (const u of (ch && ch.unlock) || []) prof.unlock[u] = true;
  save();
}

/* ---------------- demo de fondo en el menú ---------------- */
let demo = null;
function newDemo() { demo = new Sim(map); demo.addPlayer("host", prof.who || "thomas"); demo.t = 40; }
newDemo(); R.setMap(map);

/* ---------------- red ---------------- */
function netHandlers() {
  return {
    status(st) {
      me.connected = st === "connected";
      if (st === "connected") { sfx.join(); me.protoBad = false; if (me.side === "guest") me.net.send({ t: "hello", who: prof.who, meta: prof.up, proto: PROTO }); else sendLobby(); }
      if (st === "busy") { errMsg = "Esa sala ya está llena."; leave(); }
      if (st === "closed") onPartnerLost();
      draw();
    },
    data(d) {
      if (!d || typeof d !== "object") return;
      if (me.side === "host") {
        lastGuestMsg = performance.now(); guestAway = false;
        if (d.t === "hello") { me.partner = d.who === "rocio" ? "rocio" : "thomas"; me.partnerMeta = cleanMeta(d.meta); me.protoBad = d.proto !== PROTO; sendLobby(); draw(); }
        if (d.t === "in" && sim && isFinite(d.vw) && isFinite(d.vh)) sim.setView("guest", +d.vw, +d.vh);
        if (d.t === "in" && d.pos && isFinite(d.pos.x) && isFinite(d.pos.y)) { guestInput.pos = { x: +d.pos.x, y: +d.pos.y }; guestInput.face = d.face < 0 ? -1 : 1; guestInput.moving = d.moving ? 1 : 0; if (d.ult) guestInput.ult = true; if (d.dash) guestInput.dash = true; }
        if (d.t === "pick" && sim) sim.pick("guest", d.i | 0);
        if (d.t === "adv" && sim) sim.adv("guest", !!d.skip);
      } else {
        if (d.t === "lobby") { me.partner = d.who; map = THEMES[d.map] ? d.map : "plaza"; capSel = d.cap || null; me.protoBad = d.proto !== PROTO; draw(); }
        if (d.t === "start" && !me.protoBad) startRun(d.map, d.chars, d.cap);
        if (d.t === "cap") saveChapter(d.id, d.n);
        if (d.t === "s" && d.s) { snap = d.s; lastSeen = performance.now(); onEvents(snap.ev || []); }
        if (d.t === "menu") { endRun(); toMenu(); }
      }
    }
  };
}
const cleanMeta = m => { const o = {}; for (const k of ["hp", "dmg", "spd", "mag"]) o[k] = Math.max(0, Math.min(5, (m && m[k]) | 0)); return o; };
function sendLobby() { if (me.net && me.net.connected) me.net.send({ t: "lobby", who: prof.who, map, cap: capSel, proto: PROTO }); }

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
  catch (e) { busyMsg = null; me.side = "host"; errMsg = e && e.type === "peer-unavailable" ? `No existe la sala ${code}. Si tu pareja la creó con otra versión, actualicen la página los dos.` : "No se pudo conectar."; draw(); }
}
function leave() { if (me.net) me.net.close(); me.net = null; me.connected = false; me.side = "host"; me.partner = null; me.protoBad = false; }
// se cortó la conexión: el anfitrión sigue solo; el invitado vuelve al menú
function onPartnerLost() {
  const who = (me.partner && NAME[me.partner]) || "tu pareja";
  if (me.side === "host") {
    if (runOn && sim && sim.players.guest) { sim.dropPlayer("guest"); banner(`Se desconectó ${who}`, "Seguís solo. Pausa disponible"); }
    else if (!runOn) me.partner = null;
    return;
  }
  leave(); me.code = null;
  if (runOn) { endRun(); errMsg = "Se cortó la conexión con la sala."; toMenu(); }
  else if (screen === "room" || screen === "results") { errMsg = "Tu pareja cerró la sala."; screen = "menu"; }
}

/* ---------------- partida ---------------- */
function hostStart() {
  if (me.protoBad && me.net && me.net.connected) { draw(); return; }
  const chars = { host: prof.who, guest: me.connected ? me.partner : null };
  if (me.net && me.net.connected) me.net.send({ t: "start", map, chars, cap: capSel });
  startRun(map, chars, capSel);
}
function startRun(m, chars, cap) {
  map = THEMES[m] ? m : "plaza"; R.setMap(map);
  curCap = chapter(cap); if (cap && !curCap) curCap = { id: cap, n: 0, title: "Capítulo", sub: "" };
  runId++; runOn = true; paused = false; lastGuestMsg = lastSeen = performance.now(); guestAway = false; endShown = false; earned = 0; smooth.clear(); pendingEv = [];
  if (me.side === "host") {
    // dinámica 4: desde la segunda partida de arcade de la sesión, arranque rápido (reloj en 0:30 y una mejora)
    const fast = !chapter(cap) && arcadeRuns > 0; if (!chapter(cap)) arcadeRuns++;
    sim = new Sim(map, chapter(cap) ? chapterGuion(curCap) : undefined, { fast, picante: !chapter(cap) && optOn("picante"), sinfin: !chapter(cap) && optOn("sinfin") }); // dinámica 9: opciones de la alcancía
    sim.addPlayer("host", chars.host || "thomas", prof.up);
    if (chars.guest) sim.addPlayer("guest", chars.guest, me.partnerMeta || {});
    snap = sim.snapshot();
  } else { sim = null; snap = null; guestPos = null; }
  screen = "run"; music.set("run"); sfx.play("levelup");
  hintT = prof.runs < 3 ? 9 : 0; keepAwake(true); setPaused(false);
  if (curCap) banner(curCap.title || THEMES[map].name, curCap.sub || "");
  else banner(THEMES[map].name, map === "bielli" && (chars.host === "thomas" || chars.guest === "thomas") ? "Thomas juega de local: +15% de daño" : "Aguanten hasta que aparezca Linda");
  draw();
}
function endRun() { runOn = false; sim = null; keepAwake(false); setPaused(false); }
function toMenu() { screen = me.net && me.code ? "room" : "menu"; music.set("menu"); newDemo(); R.setMap(map); draw(); }

function onEvents(ev) {
  const sounds = R.events(ev, me.side);
  for (const s of sounds) if (s) sfx.play(s);
  for (const e of ev) {
    if (e[0] === "hurt" && e[3] === me.side) buzz(25, 140);
    if ((e[0] === "down" || e[0] === "revive") && e[3] === me.side) buzz(e[0] === "down" ? [90, 60, 180] : 60);
    if (e[0] === "boss") buzz(150);
    if (e[0] === "chest" && e[1] === me.side) buzz(e[2] === "evo" ? [40, 40, 90] : 40);
    if (e[0] === "boss") { banner(e[1] === "luz" ? "¡LUZ!" : "¡LINDA!", e[1] === "luz" ? "La gata de la abuela está furiosa" : "La jefa en persona. Derrótenla para ganar"); music.set("boss"); }
    if (e[0] === "bossdown") { banner(!e[1] || e[1] === "luz" ? "¡Luz se rindió!" : "¡Lo derrotaron!", "Dejó un alfajor"); music.set("run"); }
    if (e[0] === "horde") banner("¡HORDA!", "Los rodearon");
    if (e[0] === "down") { const who = e[3] === me.side ? "Caíste" : `¡Cayó ${NAME[(snap && snap.P[e[3]] && snap.P[e[3]].c) || ""] || "tu pareja"}!`; banner(who, e[3] === me.side ? "Esperá que te levanten" : "Parate al lado para levantarlo"); }
    if (e[0] === "levelup") music.set("pause");
    if (e[0] === "elite") banner("¡Gato de élite!", "Duro y lento. Suelta una caja de Roro's");
    if (e[0] === "warn") { const b = HZ_BANNER[e[1]]; if (b) banner(b[0], b[1]); }
    if (e[0] === "phase") banner(e[1] === 2 ? "¡Linda se enoja!" : "¡Linda está furiosa!", e[1] === 2 ? "Salgan de los círculos rojos" : "Busquen el hueco en el anillo");
    if (e[0] === "sync") banner("¡Combo de pareja!", "Doble poder y se curan los dos");
    // dinámica 2: Luz marca a uno y se frena si el otro está pegado (jugando solo, si esquivás justo)
    if (e[0] === "mark" && performance.now() - luzMsgAt > 7000) {
      luzMsgAt = performance.now(); const solo = snap && Object.keys(snap.P).length === 1;
      const who = e[1] === me.side ? "¡Luz te marcó!" : `¡Luz marcó a ${NAME[(snap && snap.P[e[1]] && snap.P[e[1]].c) || ""] || "tu pareja"}!`;
      banner(who, solo ? "Esquivá justo cuando arranca y se choca" : "Júntense: pegados la frenan");
    }
    if (e[0] === "stun") { luzMsgAt = performance.now(); banner("¡Luz se frenó!", "Está aturdida: le pegan el doble"); }
    // dinámica 3: evento de mitad de partida y gato ladrón
    if (e[0] === "mid") { const b = MID_BANNER[e[1]]; if (b) { const [t, sub] = e[2] ? b[0] : e[3] && b[2] ? b[2] : b[1]; banner(t, sub); } }
    // dinámica 5: combos de pareja (un cartel por combo cada 15 s)
    if (e[0] === "combo" && performance.now() - (comboMsgAt[e[1]] || -1e9) > 15000) { comboMsgAt[e[1]] = performance.now(); const c = COMBO_BANNER[e[1]]; if (c) banner(c[0], c[1]); }
    if (e[0] === "second") banner("¡Pedido de Roro's de emergencia!", snap && Object.keys(snap.P).length === 1 ? "Te levantás. Linda se distrae 5 segundos" : "Se levantan los dos. Linda se distrae 5 segundos"); // dinámica 8
    if (e[0] === "endless") banner("¡Linda cayó!", "Sin fin: ya es victoria. Aguanten todo lo que puedan"); // dinámica 9
    if (e[0] === "fast") banner("Arranque rápido", "Revancha: arrancan en 0:30 con una mejora");
    if (e[0] === "ladron") banner("¡Gato ladrón!", "Se roba la experiencia del piso: agárrenlo antes de que escape");
    if (e[0] === "steal" && performance.now() - stealAt > 8000) { stealAt = performance.now(); banner("¡Se escapó un ladrón!", `Se llevó ${e[3]} de experiencia`); }
    if (e[0] === "obj") banner(["Se enfrió el pedido", "¡Pedido entregado!", "¡Pedido de Roro's!"][e[1]], ["Otra vez será", "Caja, alfajor y monedas", "Párense encima: juntos carga el doble"][e[1]]);
    if (e[0] === "vacuum" && e[3] === me.side) banner("¡Imán!", "Toda la experiencia para ustedes");
    if (e[0] === "splash" && e[3] === me.side) banner("¡Manguerazo!", "A los gatos no les gusta el agua");
    if (e[0] === "chest") {
      const who = e[1] === me.side ? "" : `${NAME[(snap && snap.P[e[1]] && snap.P[e[1]].c) || ""] || "Tu pareja"}: `;
      if (e[2] === "evo") banner("¡EVOLUCIÓN!", who + WEAPONS[e[3]].evo.name);
      else if (e[2] === "up") banner("Caja de Roro's", who + WEAPONS[e[3]].name + " sube de nivel");
      else banner("Caja de Roro's", who + "vida llena y monedas");
    }
  }
}

/* ---------------- bucle ---------------- */
let last = performance.now(), rafPrev = last, rafBudget = 0;
const FRAME_MS = 1000 / 60;
function loop(now) {
  // tope de 60 cuadros por segundo: en pantallas de 90 o 120 Hz se saltean cuadros (mitad de CPU y batería)
  rafBudget = Math.min(FRAME_MS * 2, rafBudget + now - rafPrev); rafPrev = now;
  if (rafBudget < FRAME_MS - 1.5) { requestAnimationFrame(loop); return; }
  rafBudget = Math.max(-FRAME_MS / 2, rafBudget - FRAME_MS);
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  let V;
  if (screen === "run" && me.side === "host" && sim) {
    const inp = { host: { dir: input.vec, ult: input.takeUlt(), dash: input.takeDash() || hostDash } }; hostDash = false;
    if (sim.players.guest) { inp.guest = { ...guestInput }; guestInput.ult = false; guestInput.dash = false; }
    sim.setView("host", R.bw, R.bh);
    if (sim.players.guest) heartbeat(now);
    if (!paused) sim.step(dt, inp);
    snap = sim.snapshot();
    onEvents(snap.ev); pendingEv.push(...snap.ev);
    sendAcc += dt;
    if (me.net && me.net.connected && sendAcc >= 0.05) { sendAcc = 0; me.net.send({ t: "s", s: { ...snap, ev: pendingEv } }); pendingEv = []; }
    V = view(snap, "host");
  } else if (screen === "run" && me.side === "guest") {
    if (runOn && now - lastSeen > 6000 && !guestAway) { guestAway = true; banner("Tu pareja no responde", "Esperando la conexión…"); }
    if (runOn && now - lastSeen > 25000) onPartnerLost();
    if (now - lastSeen < 1000) guestAway = false;
    if (snap) {
      const mine = snap.P.guest;
      if (mine) {
        const B = (MAPS[snap.map] || MAPS.plaza).b;
        let dash = false;
        if (!guestPos || mine.d) guestPos = { x: mine.x, y: mine.y, face: mine.f, moving: 0, dt: 0, dcd: 0 };
        else if (snap.st === "run") {
          const v = input.vec, m = Math.hypot(v.x, v.y);
          guestPos.moving = m > 0.1 ? 1 : 0;
          guestPos.dcd = Math.max(0, guestPos.dcd - dt);
          if ((input.takeDash() || guestDash) && guestPos.dcd <= 0 && mine.dc <= 0.1) {
            dash = true; guestPos.dcd = 2.4; guestPos.dt = 0.17;
            const dx = m > 0.1 ? v.x / m : guestPos.face, dy = m > 0.1 ? v.y / m : 0; guestPos.dvx = dx * 290; guestPos.dvy = dy * 290;
          }
          let nx = guestPos.x, ny = guestPos.y;
          if (m > 0.1) { nx += v.x * mine.sp * dt; ny += v.y * mine.sp * dt; if (Math.abs(v.x) > 0.15) guestPos.face = Math.sign(v.x); }
          if (guestPos.dt > 0) { guestPos.dt -= dt; nx += guestPos.dvx * dt; ny += guestPos.dvy * dt; }
          guestPos.x = Math.max(B[0], Math.min(B[2], nx)); guestPos.y = Math.max(B[1], Math.min(B[3], ny));
        } else guestPos.moving = 0;
        guestDash = false;
        sendAcc += dt;
        const ult = input.takeUlt() || guestUlt;
        if (me.net && (sendAcc >= 0.05 || ult || dash)) { sendAcc = 0; me.net.send({ t: "in", pos: { x: guestPos.x, y: guestPos.y }, face: guestPos.face, moving: guestPos.moving, ult, dash, vw: R.bw, vh: R.bh }); guestUlt = false; }
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
let guestUlt = false, guestDash = false, hostDash = false;
// si la pareja no manda nada (celu bloqueado, sin señal), no se traba la partida:
// a los 4 s se le elige la mejora sola y a los 25 s se sigue sin ella
let lastGuestMsg = 0, guestAway = false;
function heartbeat(now) {
  const quiet = now - lastGuestMsg;
  if (quiet < 4000) return;
  if (!guestAway) { guestAway = true; banner(`${(me.partner && NAME[me.partner]) || "Tu pareja"} no responde`, "Si tarda, sus mejoras se eligen solas"); }
  const of = sim.offers.guest; if (sim.state === "levelup" && of && of.pick === null) sim.pick("guest", 0);
  if (sim.state === "dialog" && sim.dlg && !sim.dlg.ready.guest) sim.adv("guest");
  if (quiet > 25000 && me.net) { me.net.dropConn(); me.connected = false; onPartnerLost(); }
}

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
    enemies.push({ id, type: E[i + 1], x, y, f: E[i + 4], a: E[i + 5], fx });
  }
  // aliados (modo historia): mismo formato plano que los gatos
  const allies = [], A = s.A || [];
  for (let i = 0; i < A.length; i += 6) {
    const id = A[i], tx = A[i + 2], ty = A[i + 3]; let x = tx, y = ty;
    if (guest) { const o = smooth.get(id); if (o) { o.x += (tx - o.x) * 0.35; o.y += (ty - o.y) * 0.35; x = o.x; y = o.y; } else smooth.set(id, { x, y }); seen.add(id); }
    allies.push({ id, type: A[i + 1], x, y, f: A[i + 4], a: A[i + 5] });
  }
  if (guest && smooth.size > seen.size + 50) for (const k of smooth.keys()) if (!seen.has(k)) smooth.delete(k);
  return { local, players, enemies, allies, proj: s.B, eproj: s.H, gems: s.G, pickups: s.K, pools: s.U, bombs: s.M, buses: s.Bu, zones: s.Z || [], hz: s.Hz || [], obj: s.ob, bond: s.tg, goal: s.goal || null, cam: s.cam || null,
    dark: !!(s.md && MID_IDS[s.md[0]] === "apagon") }; // dinámica 3: apagón
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
    <button class="dashbtn" id="dashbtn" data-act="dash"><span>ESQUIVE</span></button>
    <div class="goalhud" id="goalhud" hidden></div>
    <div class="objhud" id="objhud" hidden><img src="${portrait("regalo", 3)}" alt=""><span id="objtxt"></span></div>
    <div class="build" id="build"></div>
    <div class="movehint" id="movehint" hidden>${TOUCH ? "Apoyá el dedo en cualquier lado y arrastrá para moverte.<br>Las armas atacan solas." : "Movete con WASD o las flechas.<br>Shift esquiva · Espacio tira el combo."}</div>
    <div class="banner" id="banner"><b id="btitle"></b><span id="bsub"></span></div>
    <div class="pausemenu" id="pausemenu" hidden><div class="panel">
      <h2>Pausa</h2><p class="hint" id="pausenote"></p>
      <button class="big" data-act="resume">Seguir</button>
      <div class="toggles"><button class="mid" data-act="snd" id="tsnd"></button><button class="mid" data-act="mus" id="tmus"></button><button class="mid" data-act="vib" id="tvib"></button></div>
      <button class="mid ghost" data-act="quit">Salir al menú</button>
    </div></div>`;
  hudBuilt = true;
}
function banner(title, sub) { bannerT = 2.6; const b = $("#banner"); if (!b) return; $("#btitle").textContent = title; $("#bsub").textContent = sub || ""; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); }
let lastOffersKey = "", resultTimer = 0;
// el HUD escribe en el DOM solo si el valor cambió: cada escritura obliga al navegador a recalcular estilos y layout
const hudEls = new Map(), hudVals = new Map();
function hudEl(id) { let e = hudEls.get(id); if (!e || !e.isConnected) { e = document.getElementById(id); hudEls.set(id, e); } return e; }
function put(key, id, v, fn) { if (hudVals.get(key) === v) return; const e = hudEl(id); if (!e) return; hudVals.set(key, v); fn(e, v); }
const show = (id, on) => put("show:" + id, id, on, (e, v) => { e.hidden = !v; });
function updateHud(dt) {
  if (!hudBuilt) buildHud();
  if (hud.hidden) hud.hidden = false;
  const s = snap;
  put("xp", "xpfill", Math.min(100, Math.round(s.xp / s.xn * 200) / 2), (e, v) => { e.style.width = v + "%"; });
  put("lvl", "lvl", s.lv, (e, v) => { e.textContent = "NV " + v; });
  put("time", "time", Math.max(0, Math.floor(s.t)), (e, v) => { e.textContent = fmt(v); });
  put("kills", "kills", s.kl, (e, v) => { e.textContent = v; });
  // barras de vida: se arman solo si cambian los jugadores o alguno cae; la vida va por style.width
  const ps = Object.entries(s.P);
  put("hps", "hps", ps.map(([side, p]) => side + ":" + p.c + ":" + p.d).join(","), e => {
    e.innerHTML = ps.map(([side, p]) => `<div class="hp ${p.d ? "down" : ""}"><img src="${portrait(p.c, 2)}" alt=""><div><i id="hpf-${side}"></i></div>${p.d ? "<em>¡AYUDA!</em>" : ""}</div>`).join("");
    for (const [side] of ps) hudVals.delete("hp:" + side);
  });
  for (const [side, p] of ps) put("hp:" + side, "hpf-" + side, Math.max(0, Math.round(p.hp / p.mh * 100)), (e, v) => { e.style.width = v + "%"; });
  const mine = s.P[me.side];
  if (mine) {
    put("ultk", "ultbtn", Math.round(mine.u * 20) * 5, (e, v) => e.style.setProperty("--k", v + "%"));
    put("ultready", "ultbtn", mine.u >= 1, (e, v) => e.classList.toggle("ready", v));
    put("ultlabel", "ultlabel", mine.c === "thomas" ? "COMBO" : "TORTAS", (e, v) => { e.textContent = v; });
    const dk = 1 - Math.min(1, (me.side === "guest" && guestPos ? Math.max(guestPos.dcd, mine.dc) : mine.dc) / 2.4);
    put("dashk", "dashbtn", Math.round(dk * 20) * 5, (e, v) => e.style.setProperty("--k", v + "%"));
    put("build", "build", JSON.stringify([mine.w, mine.pa, mine.e]), e => { e.innerHTML = buildIcons(mine); });
  }
  if (hintT > 0) { hintT -= dt; const v = input.vec; if (v.x || v.y) hintT = Math.min(hintT, 0.6); show("movehint", !(hintT <= 0 || s.st !== "run")); } else show("movehint", false);
  show("objhud", !!s.ob);
  if (s.ob) put("objtxt", "objtxt", `Pedido de Roro's ${s.ob[2]}% · ${s.ob[3]}s`, (e, v) => { e.textContent = v; });
  show("goalhud", !!s.goal || !!s.md);
  if (s.goal) put("goaltxt", "goalhud", goalText(s.goal), (e, v) => { e.textContent = v; });
  else if (s.md) put("goaltxt", "goalhud", `${MID_HUD[MID_IDS[s.md[0]]] || ""} · ${s.md[1]} s`, (e, v) => { e.textContent = v; }); // dinámica 3
  renderDialog(s.st === "dialog" ? s.dlg : null);
  show("bossbar", !!s.boss);
  if (s.boss) {
    put("bossname", "bossname", s.boss.n === "luz" ? "LUZ" : "LINDA, LA JEFA", (e, v) => { e.textContent = v; });
    put("bossfill", "bossfill", Math.round(s.boss.hp * 200) / 2, (e, v) => { e.style.width = v + "%"; });
  }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) { const b = hudEl("banner"); if (b) b.classList.remove("on"); } }
  // subida de nivel
  const of = s.st === "levelup" ? s.of && s.of[me.side] : null;
  const key = s.st + ":" + s.lv + ":" + (of ? of.pick : "-") + ":" + JSON.stringify(of && of.opts);
  if (key !== lastOffersKey) { lastOffersKey = key; renderLevelUp(s, of); }
  if (s.st === "run" && music.mode === "pause" && $("#pausemenu").hidden) music.set(s.boss ? "boss" : "run");
  // fin
  if ((s.st === "over" || s.st === "win") && !endShown) {
    resultTimer += dt;
    if (resultTimer > 1.6) { endShown = true; resultTimer = 0; finish(s); }
  }
}
// texto del objetivo para el HUD (en infinitivo: sirve jugando solo o de a dos)
function goalText(g) {
  const lb = g.lb ? " " + g.lb : "", l = g.l !== null && g.l !== undefined ? ` · ${g.l} s` : "", hp = g.hp !== null && g.hp !== undefined ? ` · ${g.hp}%` : "";
  switch (g.k) {
    case "survive": return `Aguantar${lb}${l}`;
    case "defend": return `Defender${lb || " el lugar"}${hp}${l}`;
    case "protect": return `Proteger${lb}${hp}${l}`;
    case "escort": return `Llevar${lb} · ${g.p}%${hp}`;
    case "trains": return `Trenes: ${g.n} de ${g.of}`;
    case "track": return `Rastros: ${g.n} de ${g.of}${l}`;
    case "boss": return `Derrotar${lb || " a la jefa"}`;
    case "reach": return `Llegar${lb} · ${g.p}%`;
    default: return g.lb || "";
  }
}
// caja de diálogo: retrato, nombre y texto que se escribe solo. Tocar completa el texto y después avanza.
let dlgKey = "", dlgShown = 0, dlgFull = false;
function renderDialog(d) {
  const box = $("#dialog"); if (!box) return;
  if (!d) { if (dlgKey) { dlgKey = ""; box.hidden = true; box.innerHTML = ""; } return; }
  const key = d.id + ":" + d.i;
  if (key !== dlgKey) {
    for (const k of [...hudVals.keys()]) if (k.startsWith("dlg")) hudVals.delete(k);
    dlgKey = key; dlgShown = performance.now(); dlgFull = false;
    const img = portrait(d.who, 4);
    box.hidden = false;
    box.innerHTML = `<div class="dlgbox" data-act="adv">${img ? `<img src="${img}" alt="">` : ""}<div class="dlgtxt"><b>${esc(speaker(d.who))}</b><p id="dlgtext"></p><div class="dlgfoot"><span id="dlgwait"></span><button class="skip" data-act="advskip">Saltar</button></div></div></div>`;
  }
  const n = dlgFull ? d.text.length : Math.min(d.text.length, Math.floor((performance.now() - dlgShown) / 28));
  if (n >= d.text.length) dlgFull = true;
  put("dlgtext", "dlgtext", n, (e, v) => { e.textContent = d.text.slice(0, v); });
  const mine = d.r && d.r[me.side];
  put("dlgwait", "dlgwait", mine ? "Esperando a tu pareja…" : `${d.i + 1} de ${d.n} · tocá para seguir`, (e, v) => { e.className = mine ? "wait" : ""; e.textContent = v; });
}
function advDialog(skip) {
  if (!snap || snap.st !== "dialog" || performance.now() - dlgShown < 300) return;
  if (!skip && !dlgFull) { dlgFull = true; return; }
  if (me.side === "host") { if (sim) sim.adv("host", skip); }
  else if (me.net) me.net.send({ t: "adv", skip: skip ? 1 : 0 });
}
function buildIcons(p) {
  const pip = (lv, max) => `<i>${"▮".repeat(lv)}${"▯".repeat(Math.max(0, max - lv))}</i>`;
  const w = Object.entries(p.w || {}).map(([id, lv]) => `<span class="${p.e && p.e[id] ? "evo" : ""}"><img src="${portrait(ICON[id] || "gem1", 2)}" alt="${esc(WEAPONS[id].name)}">${p.e && p.e[id] ? "<i>EVO</i>" : pip(lv, WEAPONS[id].max)}</span>`).join("");
  const pa = Object.entries(p.pa || {}).map(([id, lv]) => `<span class="pas"><img src="${portrait(ICON[id] || "gem1", 2)}" alt="${esc(PASSIVES[id].name)}">${pip(lv, PASSIVES[id].max)}</span>`).join("");
  return `<div>${w}</div>${pa ? `<div>${pa}</div>` : ""}`;
}
let lvShownAt = 0;
function renderLevelUp(s, of) {
  const box = $("#levelup");
  if (!of) { box.hidden = true; box.innerHTML = ""; return; }
  lvShownAt = performance.now();
  box.hidden = false;
  if (of.pick !== null) { box.innerHTML = `<div class="lvbox"><h2>¡Nivel ${s.lv}!</h2><p class="wait">Esperando que tu pareja elija…</p></div>`; return; }
  const mine = s.P[me.side];
  box.innerHTML = `<div class="lvbox"><h2>¡Nivel ${s.lv}!</h2><p>Elegí una mejora</p>
    <div class="opts">${of.opts.map((o, i) => {
      const def = o.kind === "w" ? WEAPONS[o.id] : o.kind === "p" ? PASSIVES[o.id] : { name: "Alfajor", desc: "Te recuperás entero." };
      const isNew = o.kind === "w" && !(mine && mine.w && mine.w[o.id]);
      const hint = o.kind === "w" ? `Evoluciona con ${PASSIVES[WEAPONS[o.id].evo.p].name}` : o.kind === "p" && EVO_OF[o.id] ? `Evoluciona ${WEAPONS[EVO_OF[o.id]].name}` : "";
      // dinámica 6: el arma combina con una de tu pareja
      const cbHint = o.cb && WEAPONS[o.cb] ? `Combina con ${WEAPONS[o.cb].name} de ${NAME[o.who] || "tu pareja"}` : "";
      return `<button class="opt" data-act="pick" data-i="${i}">
        <img src="${portrait(ICON[o.id] || "gem1", 4)}" alt="">
        <span class="on"><b>${esc(def.name)}</b>${isNew ? `<em>NUEVA</em>` : `<small>Nivel ${o.lv}</small>`}<span>${esc(def.desc)}</span>${hint ? `<i class="evo">${esc(hint)}</i>` : ""}${cbHint ? `<i class="evo combo">${esc(cbHint)}</i>` : ""}</span>
        <span class="stars">${"■".repeat(o.lv)}${"□".repeat(Math.max(0, (def.max || 1) - o.lv))}</span></button>`;
    }).join("")}</div></div>`;
  sfx.play("levelup");
}
function finish(s) {
  const win = s.st === "win";
  if (win && s.cap) { saveChapter(s.cap); if (me.side === "host" && me.net && me.net.connected) me.net.send({ t: "cap", id: s.cap, n: curCap ? curCap.n | 0 : 0 }); }
  // dinámica 9: victoria x1,5 (x1,25 con la segunda chance), bonus de primera victoria por mapa, metas y alcancía
  const tierK = 1 + (MAPS[s.map] || MAPS.plaza).tier * 0.12, A = prof.arcade, duo = Object.keys(s.P).length > 1;
  const won = win || !!s.won;
  earned = coinsFor({ co: s.co, kl: s.kl, t: s.t, win: won, tier: (MAPS[s.map] || MAPS.plaza).tier, second: !!s.sc, hot: !!s.hot });
  const extra = [];
  let metas = null, alcAdd = 0;
  if (!s.cap) {
    if (won && !A.win1[s.map]) { A.win1[s.map] = 1; const b = Math.round(FIRST_WIN * tierK); earned += b; extra.push(`primera victoria acá +${b}`); }
    const had = A.metas[s.map] || [0, 0, 0], got = s.mt || [0, 0, 0];
    metas = METAS_TXT(s.map).map((txt, i) => ({ txt, ok: !!got[i], nueva: !!got[i] && !had[i], antes: !!had[i] }));
    const nuevas = metas.filter(m => m.nueva).length; if (nuevas) { const b = Math.round(NEW_META * tierK) * nuevas; earned += b; extra.push(`${nuevas === 1 ? "meta nueva" : nuevas + " metas nuevas"} +${b}`); }
    A.metas[s.map] = had.map((v, i) => v || got[i] ? 1 : 0);
    if (duo) { alcAdd = earned; A.alc += earned; }
  }
  prof.coins += earned; prof.runs++;
  // los récords y las victorias son del arcade; un capítulo solo guarda su progreso
  const newBest = !s.cap && s.t > prof.best.t;
  if (!s.cap) { if (won) prof.wins++; prof.best = { t: Math.max(prof.best.t, s.t), k: Math.max(prof.best.k, s.kl), lv: Math.max(prof.best.lv, s.lv) }; }
  save();
  hud.hidden = true; $("#levelup").hidden = true; keepAwake(false); setPaused(false);
  screen = "results"; music.set("menu");
  const duel = Object.values(s.P).map(p => ({ c: p.c, k: p.k })).sort((a, b) => b.k - a.k);
  draw({ win: won, t: s.t, k: s.kl, lv: s.lv, newBest, duel, cap: curCap, metas, extra, alcAdd, second: !!s.sc, endless: !!s.won && !win });
}

/* ---------------- pantallas ---------------- */
function charCard(c) {
  return `<button class="char ${prof.who === c ? "on" : ""}" data-act="who" data-v="${c}">
    <img src="${portrait(c, 6)}" alt=""><b>${NAME[c]}</b><span>${c === "thomas" ? "Patada Bielli · cuerpo a cuerpo" : "Medialunas · a distancia"}</span></button>`;
}
function mapCards() {
  return `<div class="maps">${Object.entries(THEMES).map(([k, t]) => {
    const owned = prof.maps[k];
    const tier = MAPS[k].tier;
    return `<button class="mapc ${map === k ? "on" : ""} ${owned ? "" : "locked"}" data-act="${owned ? "map" : "buymap"}" data-v="${k}"><div><b>${t.name}</b><small>${"★".repeat(tier + 1)}${"☆".repeat(5 - tier)} · ${esc(t.sub)}${tier ? ` · +${tier * 12}%${COIN()}` : ""}</small></div><span>${owned ? (map === k ? "Elegido" : "Elegir") : `${MAP_COST[k]}${COIN()}`}</span></button>`;
  }).join("")}</div>`;
}
// capítulos de la historia (por ahora una lista simple; la pantalla de la historia es de la fase siguiente)
function capCards() {
  const list = [{ id: "", title: "Arcade", sub: "Aguantar hasta que aparezca Linda" }, ...STORY.CHAPTERS];
  return `<p class="label">Historia</p><div class="maps caps">${list.map(c => { const on = (capSel || "") === c.id; return `<button class="mapc ${on ? "on" : ""}" data-act="cap" data-v="${esc(c.id)}"><div><b>${esc(c.title || c.id)}</b><small>${esc(c.sub || "")}${prof.story.done[c.id] ? " · hecho" : ""}</small></div><span>${on ? "Elegido" : "Elegir"}</span></button>`; }).join("")}</div>`;
}
// dinámica 9: alcancía de la pareja, metas por mapa y opciones de la sala
function alcText() {
  const a = prof.arcade.alc, next = ALCANCIA.find(x => a < x.at);
  return next ? `Alcancía de la pareja: ${a} de ${next.at} para ${next.name}` : `Alcancía de la pareja: ${a} · todo desbloqueado`;
}
function metasBlock(m) {
  const had = prof.arcade.metas[m] || [0, 0, 0];
  return `<p class="hint">Metas: ${METAS_TXT(m).map((t, i) => `${had[i] ? "★" : "☆"} ${esc(t)}`).join(" · ")}</p>`;
}
function alcOptions() {
  const on = ALCANCIA.filter(x => alcOn(x.id)); if (!on.length) return "";
  return `<div class="toggles">${on.map(x => `<button class="mid ${prof.arcade.opt[x.id] ? "" : "ghost"}" data-act="alcopt" data-v="${x.id}">${esc(x.name)}: ${prof.arcade.opt[x.id] ? "sí" : "no"}</button>`).join("")}</div>
    <p class="hint">${on.map(x => `${esc(x.name)}: ${esc(x.desc)}`).join(" ")}</p>`;
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
      <p class="rec">${alcText()}</p>
      <button class="link" data-act="snd">${sfx.muted ? "Sonido: apagado" : "Sonido: prendido"}</button>
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
      <p class="status ${me.connected ? "on" : ""}">${me.connected ? `Conectados: ${NAME[prof.who]} y ${partner || "…"}` : "Esperando que entre tu pareja…"}</p>
      ${me.connected && me.protoBad ? `<p class="err">${esc(PROTO_MSG)}</p>` : ""}`}
      <p class="label">Mapa</p>
      ${me.side === "host" && !capSel ? mapCards() : `<p class="mapname">${THEMES[map].name}${capSel ? " · " + esc((chapter(capSel) || { title: "Capítulo" }).title) : ""}</p>`}
      ${!capSel ? metasBlock(map) : ""}
      ${me.side === "host" && !capSel ? alcOptions() : ""}
      ${me.side === "host" && STORY ? capCards() : ""}
      ${me.side === "host" ? `<button class="big" data-act="go" ${solo || (me.connected && !me.protoBad) ? "" : "disabled"}>¡A jugar!</button>` : me.protoBad ? "" : `<p class="busy">Esperando que arranque ${partner || "tu pareja"}</p>`}
      <button class="link" data-act="back">Volver</button>
    </section>`;
    return;
  }
  if (screen === "results") {
    const r = lastResult;
    ui.innerHTML = `<section class="panel results">
      ${r.cap ? `<h2 class="${r.win ? "win" : "lose"}">${r.win ? "¡Capítulo superado!" : "No salió"}</h2>
      <p>${esc(r.cap.title || "")}${r.win ? "" : ". Prueben de nuevo."}</p>` : `<h2 class="${r.win ? "win" : "lose"}">${r.win ? "¡Derrotaron a Linda!" : "Los gatos ganaron"}</h2>
      <p>${r.win ? "El barrio está a salvo. Por esta noche." : "Linda se quedó con el barrio. Revancha."}</p>`}
      ${r.duel && r.duel.length > 1 ? `<div class="duel">${r.duel.map((d, i) => `<div class="${i === 0 ? "mvp" : ""}"><img src="${portrait(d.c, 3)}" alt=""><b>${NAME[d.c]}</b><span>${d.k} gatos</span>${i === 0 ? "<em>MVP</em>" : ""}</div>`).join("")}</div>` : ""}
      <div class="stats"><div><b>${fmt(r.t)}</b><span>tiempo${r.newBest ? " · ¡récord!" : ""}</span></div><div><b>${r.k}</b><span>gatos</span></div><div><b>${r.lv}</b><span>nivel</span></div><div><b>+${earned}</b><span>monedas</span></div></div>
      ${r.metas ? `<p class="label">Metas de ${esc(THEMES[map].name)}</p>${r.metas.map(m => `<p class="hint">${m.ok || m.antes ? "★" : "☆"} ${esc(m.txt)}${m.nueva ? " · ¡nueva!" : ""}</p>`).join("")}` : ""}
      ${r.win && !r.cap ? `<p class="hint">Ganar paga x${r.second ? "1,25 (usaron la segunda chance)" : "1,5"}${r.extra.length ? " · " + esc(r.extra.join(" · ")) : ""}</p>` : r.extra && r.extra.length ? `<p class="hint">${esc(r.extra.join(" · "))}</p>` : ""}
      ${r.alcAdd ? `<p class="hint">Alcancía de la pareja +${r.alcAdd}. ${esc(alcText())}</p>` : ""}
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
      <button class="mid ghost" data-act="backup">Código de respaldo</button>
      <button class="link" data-act="back">Volver</button>
    </section>`;
    return;
  }
  if (screen === "backup") {
    const p = backupPending;
    ui.innerHTML = `<section class="panel shop backup">
      <div class="brand"><h2>Respaldo</h2><span class="coins">${COIN()}${prof.coins}</span></div>
      <p class="hint">Este código guarda tus monedas, el Taller, los mapas, los récords y la historia. Mandátelo por WhatsApp o guardalo en notas: si cambiás de celu o se borra el navegador, lo pegás acá y recuperás todo.</p>
      <textarea id="bkout" readonly rows="4">${esc(exportCode(prof))}</textarea>
      <button class="mid" data-act="bkcopy">Copiar código</button>
      <p class="label">Cargar un código</p>
      <textarea id="bkin" rows="3" placeholder="Pegá acá tu código" autocomplete="off" autocapitalize="off" spellcheck="false">${esc(backupIn)}</textarea>
      ${backupMsg ? `<p class="${backupMsg.ok ? "hint" : "err"}">${esc(backupMsg.text)}</p>` : ""}
      ${p ? `<p class="hint">El código tiene ${p.coins} monedas, ${p.wins} victorias y ${Object.keys(p.maps).length} mapas. Reemplaza lo que tenés ahora (${prof.coins} monedas).</p>
        <button class="mid" data-act="bkyes">Sí, reemplazar</button>` : `<button class="mid" data-act="bkload">Cargar</button>`}
      <button class="link" data-act="back">Volver</button>
    </section>`;
  }
}

/* ---------------- pausa, sonido, vibración y pantalla encendida ---------------- */
const TOUCH = matchMedia("(pointer: coarse)").matches;
let hintT = 0;
let vibOn = (() => { try { return localStorage.getItem("gdl-vib") !== "0"; } catch (e) { return true; } })();
let lastBuzz = 0;
function buzz(pattern, gap = 0) {
  if (!vibOn || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return;
  const now = performance.now(); if (gap && now - lastBuzz < gap) return; lastBuzz = now;
  try { navigator.vibrate(pattern); } catch (e) {}
}
// la pausa frena el juego solo si jugás solo; de a dos el menú se abre pero la partida sigue
const soloRun = () => me.side === "host" && !(me.net && me.net.connected);
function setPaused(on) {
  const pm = $("#pausemenu"); if (!pm) { paused = false; return; }
  pm.hidden = !on; paused = on && soloRun();
  if (on) { $("#pausenote").textContent = soloRun() ? "El juego está frenado." : "De a dos la partida sigue corriendo."; paintToggles(); music.set("pause"); }
  else if (screen === "run" && snap) music.set(snap.st === "levelup" ? "pause" : snap.boss ? "boss" : "run");
}
function paintToggles() {
  const t = (id, label, on) => { const el = $(id); if (el) { el.textContent = `${label}: ${on ? "sí" : "no"}`; el.classList.toggle("off", !on); } };
  t("#tsnd", "Sonido", !sfx.muted); t("#tmus", "Música", music.on); t("#tvib", "Vibrar", vibOn);
  const v = $("#tvib"); if (v) v.hidden = !navigator.vibrate;
}
let wake = null;
async function keepAwake(on) {
  try {
    if (on && !wake && navigator.wakeLock && document.visibilityState === "visible") { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); }
    else if (!on && wake) { const w = wake; wake = null; await w.release(); }
  } catch (e) { wake = null; }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { if (screen === "run" && soloRun() && snap && snap.st === "run") setPaused(true); }
  else if (runOn) keepAwake(true);
});

/* ---------------- eventos de la interfaz ---------------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  sfx.init();
  if (a !== "ult" && a !== "pick" && a !== "dash") sfx.click();
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
    case "backup": backupIn = ""; backupMsg = null; backupPending = null; screen = "backup"; draw(); break;
    case "bkcopy": { const el = $("#bkout"), code = el ? el.value : exportCode(prof); if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => { backupMsg = { ok: true, text: "Código copiado." }; draw(); }).catch(() => { if (el) el.select(); }); else if (el) el.select(); break; }
    case "bkload": { const el = $("#bkin"); backupIn = el ? el.value : backupIn; try { backupPending = importCode(backupIn); backupMsg = null; } catch (err) { backupPending = null; backupMsg = { ok: false, text: err.message }; } draw(); break; }
    case "bkyes": if (backupPending) { try { localStorage.setItem(BACKUP_KEYS.prev, JSON.stringify(prof)); } catch (err) {} prof = backupPending; backupPending = null; backupIn = ""; save(); newDemo(); backupMsg = { ok: true, text: "Listo: progreso recuperado." }; } draw(); break;
    case "back": if (screen === "backup") screen = "shop"; else if (screen === "shop") screen = shopBack || "menu"; else { leave(); screen = "menu"; me.code = null; } errMsg = null; draw(); break;
    case "share": { const url = location.origin + location.pathname + "?sala=" + me.code; if (navigator.share) navigator.share({ title: "Gatos de Linda", text: "Entrá a mi sala", url }).catch(() => {}); else navigator.clipboard && navigator.clipboard.writeText(url).then(() => banner("Link copiado", "")).catch(() => {}); break; }
    case "pick": { if (performance.now() - lvShownAt < 350) break; const i = +b.dataset.i; if (me.side === "host") sim && sim.pick("host", i); else me.net && me.net.send({ t: "pick", i }); sfx.play("coin"); break; }

    case "alcopt": if (alcOn(v)) { prof.arcade.opt[v] = prof.arcade.opt[v] ? 0 : 1; save(); } draw(); break; // dinámica 9
    case "cap": { capSel = v || null; const ch = chapter(capSel); if (ch && THEMES[ch.map]) { map = ch.map; R.setMap(map); newDemo(); } sendLobby(); draw(); break; }
    case "adv": advDialog(false); break;
    case "advskip": advDialog(true); break;
    case "pause": setPaused(true); break;
    case "resume": setPaused(false); break;
    case "snd": sfx.toggle(); if (screen === "run") paintToggles(); else draw(); break;
    case "mus": music.toggle(); paintToggles(); break;
    case "vib": vibOn = !vibOn; try { localStorage.setItem("gdl-vib", vibOn ? "1" : "0"); } catch (e) {} paintToggles(); buzz(40); break;
    case "quit":
      setPaused(false);
      if (me.side === "host") { if (me.net && me.net.connected) me.net.send({ t: "menu" }); endRun(); toMenu(); }
      else { endRun(); leave(); me.code = null; screen = "menu"; music.set("menu"); newDemo(); R.setMap(map); draw(); }
      break;
  }
});
let shopBack = "menu";
// esquive y combo responden al apoyar el dedo, sin esperar a soltar
document.addEventListener("pointerdown", e => {
  const b = e.target.closest('[data-act="dash"],[data-act="ult"]'); if (!b) return;
  e.preventDefault(); sfx.init();
  if (b.dataset.act === "ult") { if (me.side === "host") input.ultPressed = true; else guestUlt = true; }
  else { if (me.side === "host") hostDash = true; else guestDash = true; }
});
addEventListener("keydown", e => {
  if (screen === "run" && (e.key === "Escape" || e.key === "p" || e.key === "P")) { const pm = $("#pausemenu"); setPaused(!!(pm && pm.hidden)); }
  // en un diálogo, Espacio o Enter avanzan (y no se gasta el combo)
  if (screen === "run" && snap && snap.st === "dialog" && (e.key === " " || e.key === "Enter")) { input.ultPressed = false; advDialog(false); e.preventDefault(); }
});
document.addEventListener("input", e => { if (e.target.id === "code") { joinDraft = cleanCode(e.target.value); e.target.value = joinDraft; } if (e.target.id === "bkin") { backupIn = e.target.value; backupPending = null; } });

if (new URLSearchParams(location.search).has("debug")) window.__g = () => ({ sim, snap, me, R, prof, input });
draw();
requestAnimationFrame(loop);
