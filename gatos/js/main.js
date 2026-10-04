// Gatos de Linda: menús, salas, bucle de juego y sincronización entre los dos celus.
import { Sim, WEAPONS, PASSIVES, MAPS, EVO_OF, chapterGuion, MID_IDS, coinsFor, METAS_TXT, ALCANCIA } from "./engine.js";
import { buildSprites, SPR, portrait as portraitPng, dialogPortrait } from "./sprites.js";
import { Renderer, THEMES } from "./render.js";
import { STORY_MAPS } from "./maps.js";
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
// historia: mapas que se ganan jugando la historia (no se compran) y qué capítulo los da
const STORY_MAP_FROM = { roros: "el prólogo", abuela: "el capítulo 5" };
HZ_BANNER.corbata = ["¡Corbata!", "Pasa corriendo por el patio"]; HZ_BANNER.bandejas = ["¡Bandejas!", "Se soltó el carro de las tortas"];
// lo que se desbloquea en la historia, con su nombre para el menú
const UNLOCK_NAME = { "map:roros": "Mapa Roro's Bakery", "map:abuela": "Mapa La casa de la abuela", "skin:bielli": "Thomas con la ropa del Team Bielli", "skin:roros": "Rocío con el delantal de Roro's", "special:maitena": "Especial Llamá a Maitena", "ally:corbata": "Corbata te acompaña" };
const SKIN = { thomas: { unlock: "skin:bielli", id: "thomasBielli", name: "Team Bielli" }, rocio: { unlock: "skin:roros", id: "rocioRoros", name: "Delantal de Roro's" } };
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
/* dinámica 10: accesibilidad. "Ver más" (zoom), botones grandes y lado de los botones (zurdos), guardados en el celu.
   Los estilos van acá para no tocar css/app.css (el integrador los puede pasar a ese archivo). */
const pref = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === "1"; } catch (e) { return d; } };
const setPref = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch (e) {} };
let zoomOn = pref("gdl-zoom", false), bigBtn = pref("gdl-bigbtn", false), leftBtn = pref("gdl-zurdo", false);
R.zoomOut = zoomOn; R.resize();
// Maitena: una sola fuente de desbloqueo para la historia y el arcade, prof.unlock["special:maitena"] (lo pone
// saveChapter con el `unlock` del capítulo de Bielli de story.js). El botón es #maibtn (estilos en css/app.css).
const hasUnlock = id => !!(prof.unlock && (prof.unlock["special:" + id] || prof.unlock[id]));
function applyA11y() { hud.classList.toggle("zurdo", leftBtn); hud.classList.toggle("grandes", bigBtn); }
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
  if (Array.isArray(m.CHAPTERS) && m.CHAPTERS.length) { STORY = m; if (screen !== "run") draw(); }
}).catch(() => {});
// historia: capítulos disponibles = el máximo entre los dos celus (el anfitrión manda el suyo en lobby)
let partnerCap = 0, hostCap = 0;
const storyCap = () => Math.max(prof.story.cap | 0, me.connected ? (me.side === "host" ? partnerCap : hostCap) : 0);
const skinOf = c => { const k = SKIN[c]; return k && prof.unlock[k.unlock] && prof.skin && prof.skin[c] === k.id ? k.id : null; };
if (!prof.skin) prof.skin = {};
const chapter = id => (STORY && id && STORY.CHAPTERS.find(c => c.id === id)) || null;
const speaker = who => STORY && STORY.SPEAKERS && STORY.SPEAKERS[who] ? STORY.SPEAKERS[who].name : NAME[who] || who || ""; // el narrador no tiene nombre
// capítulo terminado: lo guardan los dos celus (el anfitrión además le avisa al invitado con {t:"cap"})
function saveChapter(id, n, stars) {
  if (!id) return;
  const ch = chapter(id), num = ch ? ch.n | 0 : n | 0;
  const old = prof.story.done[id], best = Math.max(typeof old === "object" ? old.stars | 0 : old ? 1 : 0, stars | 0);
  prof.story.done[id] = { stars: best || 1 }; prof.story.cap = Math.max(prof.story.cap | 0, num + 1);
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
      if (st === "connected") { sfx.join(); me.protoBad = false; if (me.side === "guest") me.net.send({ t: "hello", who: prof.who, meta: { ...prof.up, maitena: hasUnlock("maitena") ? 1 : 0 }, proto: PROTO, cap: prof.story.cap | 0, skin: skinOf(prof.who) }); else sendLobby(); }
      if (st === "busy") { errMsg = "Esa sala ya está llena."; leave(); }
      if (st === "closed") onPartnerLost();
      draw();
    },
    data(d) {
      if (!d || typeof d !== "object") return;
      if (me.side === "host") {
        lastGuestMsg = performance.now(); guestAway = false;
        if (d.t === "hello") { me.partner = d.who === "rocio" ? "rocio" : "thomas"; me.partnerMeta = cleanMeta(d.meta); me.protoBad = d.proto !== PROTO; partnerCap = Math.max(0, Math.min(9, d.cap | 0)); me.partnerSkin = d.skin === "thomasBielli" || d.skin === "rocioRoros" ? d.skin : null; sendLobby(); draw(); }
        if (d.t === "in" && sim && isFinite(d.vw) && isFinite(d.vh)) sim.setView("guest", +d.vw, +d.vh);
        if (d.t === "in" && d.pos && isFinite(d.pos.x) && isFinite(d.pos.y)) { guestInput.pos = { x: +d.pos.x, y: +d.pos.y }; guestInput.face = d.face < 0 ? -1 : 1; guestInput.moving = d.moving ? 1 : 0; if (d.ult) guestInput.ult = true; if (d.dash) guestInput.dash = true; if (d.mt) guestInput.mai = true; }
        if (d.t === "pick" && sim) sim.pick("guest", d.i | 0);
        if (d.t === "adv" && sim) sim.adv("guest", !!d.skip, typeof d.c === "number" ? d.c | 0 : undefined);
      } else {
        if (d.t === "lobby") { me.partner = d.who; map = THEMES[d.map] ? d.map : "plaza"; capSel = d.cap || null; hostCap = Math.max(0, Math.min(9, d.avail | 0)); me.protoBad = d.proto !== PROTO; draw(); }
        if (d.t === "start" && !me.protoBad) startRun(d.map, d.chars, d.cap, d.skins, d.opts);
        if (d.t === "cap") saveChapter(d.id, d.n, d.stars);
        if (d.t === "s" && d.s) { snap = d.s; lastSeen = performance.now(); onEvents(snap.ev || []); }
        if (d.t === "menu") { endRun(); toMenu(); }
      }
    }
  };
}
const cleanMeta = m => { const o = {}; for (const k of ["hp", "dmg", "spd", "mag"]) o[k] = Math.max(0, Math.min(5, (m && m[k]) | 0)); o.maitena = !!(m && m.maitena); return o; }; // maitena: la pareja la desbloqueó en la historia
function sendLobby() { if (me.net && me.net.connected) me.net.send({ t: "lobby", who: prof.who, map, cap: capSel, avail: prof.story.cap | 0, proto: PROTO }); }

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
  const skins = { host: skinOf(prof.who), guest: me.connected ? me.partnerSkin || null : null };
  // historia: lo que se desbloqueó y se puede usar en el arcade (Maitena y Corbata)
  // Maitena: una sola fuente de desbloqueo (prof.unlock["special:maitena"]); en el arcade alcanza con que la tenga uno de los dos
  const opts = { maitena: hasUnlock("maitena") || !!(me.connected && me.partnerMeta && me.partnerMeta.maitena), corbata: !!(prof.unlock["ally:corbata"] && prof.corbataOn) };
  if (me.net && me.net.connected) me.net.send({ t: "start", map, chars, cap: capSel, skins, opts });
  startRun(map, chars, capSel, skins, opts);
}
function startRun(m, chars, cap, skins = {}, opts = {}) {
  map = THEMES[m] ? m : "plaza"; R.setMap(map);
  curCap = chapter(cap); if (cap && !curCap) curCap = { id: cap, n: 0, title: "Capítulo", sub: "" };
  runId++; runOn = true; paused = false; lastGuestMsg = lastSeen = performance.now(); guestAway = false; endShown = false; earned = 0; smooth.clear(); pendingEv = [];
  guestInput.pos = null; guestInput.mai = false; dlgSeenNow = new Set(); // historia: la revancha no arrastra la posición vieja del invitado
  if (me.side === "host") {
    // historia: Maitena y Corbata en el arcade. Dinámica 4: desde la segunda partida de arcade de la sesión, arranque
    // rápido (reloj en 0:30 y una mejora); dinámica 9: opciones de la alcancía
    const arcadeOpts = !chapter(cap) && (opts.maitena || opts.corbata) ? { specials: opts.maitena ? { maitena: true } : {}, allies: opts.corbata ? ["corbata"] : [] } : undefined;
    const fast = !chapter(cap) && arcadeRuns > 0; if (!chapter(cap)) arcadeRuns++;
    sim = new Sim(map, chapter(cap) ? chapterGuion(curCap, { solo: !chars.guest }) : arcadeOpts, { fast, picante: !chapter(cap) && optOn("picante"), sinfin: !chapter(cap) && optOn("sinfin") });
    sim.addPlayer("host", chars.host || "thomas", prof.up, skins.host);
    if (chars.guest) sim.addPlayer("guest", chars.guest, me.partnerMeta || {}, skins.guest);
    snap = sim.snapshot();
  } else { sim = null; snap = null; guestPos = null; }
  screen = "run"; music.set("run"); sfx.play("levelup");
  hintT = prof.runs < 3 ? 9 : 0; keepAwake(true); setPaused(false);
  if (curCap) banner(curCap.title || THEMES[map].name, curCap.sub || "");
  else banner(THEMES[map].name, map === "bielli" && (chars.host === "thomas" || chars.guest === "thomas") ? "Thomas juega de local: +15% de daño" : "Aguanten hasta que aparezca Linda");
  draw();
}
function endRun() {
  runOn = false; sim = null; keepAwake(false); setPaused(false);
  // salir en medio de una subida de nivel o de un diálogo no deja el cartel tapando el menú (historia)
  const lv = $("#levelup"); if (lv) { lv.hidden = true; lv.innerHTML = ""; } lastOffersKey = "";
  const dl = $("#dialog"); if (dl) { dl.hidden = true; dl.innerHTML = ""; } dlgKey = ""; document.body.classList.remove("cine");
}
function toMenu() { screen = me.net && me.code ? "room" : "menu"; music.set("menu"); newDemo(); R.setMap(map); draw(); }

function onEvents(ev) {
  const sounds = R.events(ev, me.side);
  for (const s of sounds) if (s) sfx.play(s);
  for (const e of ev) {
    if (e[0] === "hurt" && e[3] === me.side) buzz(25, 140);
    if ((e[0] === "down" || e[0] === "revive") && e[3] === me.side) buzz(e[0] === "down" ? [90, 60, 180] : 60);
    if (e[0] === "boss") buzz(150);
    if (e[0] === "chest" && e[1] === me.side) buzz(e[2] === "evo" ? [40, 40, 90] : 40);
    if (e[0] === "boss") { const b = BOSS_BANNER[e[1]] || BOSS_BANNER.linda; banner(b[0], b[1]); music.set("boss"); if (e[1] === "luz2") sfx.play("boss:luz"); if (e[1] === "canicheBoss") sfx.play("boss:linda"); }
    if (e[0] === "bossdown") { banner(e[1] === "luz2" ? "¡Luz se rinde!" : e[1] === "canicheBoss" ? "¡La otra Linda se rinde!" : !e[1] || e[1] === "luz" ? "¡Luz se rindió!" : "¡Lo derrotaron!", e[1] === "luz2" || e[1] === "canicheBoss" ? "Bandera blanca" : "Dejó un alfajor"); music.set("run"); }
    storyEvent(e);
    if (e[0] === "horde") banner("¡HORDA!", "Los rodearon");
    if (e[0] === "down") { const who = e[3] === me.side ? "Caíste" : `¡Cayó ${NAME[(snap && snap.P[e[3]] && snap.P[e[3]].c) || ""] || "tu pareja"}!`; banner(who, e[3] === me.side ? "Esperá que te levanten" : "Parate al lado para levantarlo"); }
    if (e[0] === "levelup") music.set("pause");
    if (e[0] === "elite") banner("¡Gato de élite!", "Duro y lento. Suelta una caja de Roro's");
    if (e[0] === "warn") { const b = HZ_BANNER[e[1]]; if (b) banner(b[0], b[1]); }
    if (e[0] === "phase") banner(e[1] === 2 ? "¡Linda se enoja!" : "¡Linda está furiosa!", e[1] === 2 ? "Salgan de los círculos rojos" : "Busquen el hueco en el anillo");
    if (e[0] === "sync") banner("¡Combo de pareja!", "Doble poder y se curan los dos");
    // dinámica 2: Luz marca a uno y se frena si el otro está pegado (jugando solo, si esquivás justo)
    // ("lmark": "mark" es la marca de Amanda en la historia; luz2 tiene su propia pista)
    if (e[0] === "lmark" && snap && snap.boss && snap.boss.n === "luz" && performance.now() - luzMsgAt > 7000) {
      luzMsgAt = performance.now(); const solo = snap && Object.keys(snap.P).length === 1;
      const who = e[1] === me.side ? "¡Luz te marcó!" : `¡Luz marcó a ${NAME[(snap && snap.P[e[1]] && snap.P[e[1]].c) || ""] || "tu pareja"}!`;
      banner(who, solo ? "Esquivá justo cuando arranca y se choca" : "Júntense: pegados la frenan");
    }
    if (e[0] === "stun" && snap && snap.boss && snap.boss.n === "luz") { luzMsgAt = performance.now(); banner("¡Luz se frenó!", "Está aturdida: le pegan el doble"); }
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
    const inp = { host: { dir: input.vec, ult: input.takeUlt(), dash: input.takeDash() || hostDash, mai: maiPress } }; hostDash = false; maiPress = false;
    if (sim.players.guest) { inp.guest = { ...guestInput }; guestInput.ult = false; guestInput.dash = false; guestInput.mai = false; }
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
        if (me.net && (sendAcc >= 0.05 || ult || dash || maiPress)) { sendAcc = 0; me.net.send({ t: "in", pos: { x: guestPos.x, y: guestPos.y }, face: guestPos.face, moving: guestPos.moving, ult, dash, mt: maiPress ? 1 : 0, vw: R.bw, vh: R.bh }); guestUlt = false; maiPress = false; }
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
let guestUlt = false, guestDash = false, hostDash = false, maiPress = false; // maiPress: "Llamá a Maitena" (historia)
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
    waves: s.Wv || null, mark: (s.boss && s.boss.mk) || null, // historia: ondas del berrinche y el marcado por Luz
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
    <div class="goalhud" id="goalhud" hidden><b id="goaltxt"></b><div class="gbar"><i id="goalfill"></i></div></div>
    <div class="hinthud" id="hinthud" hidden></div>
    <div class="talkhud" id="talkhud" hidden></div>
    <div class="pairult" id="pairult" hidden></div>
    <button class="maibtn" id="maibtn" data-act="mai" hidden><span id="mailabel">MAITENA</span></button>
    <div class="objhud" id="objhud" hidden><img src="${portrait("regalo", 3)}" alt=""><span id="objtxt"></span></div>
    <div class="build" id="build"></div>
    <div class="movehint" id="movehint" hidden>${TOUCH ? "Apoyá el dedo en cualquier lado y arrastrá para moverte.<br>Las armas atacan solas." : "Movete con WASD o las flechas.<br>Shift esquiva · Espacio tira el combo."}</div>
    <div class="banner" id="banner"><b id="btitle"></b><span id="bsub"></span></div>
    <div class="pausemenu" id="pausemenu" hidden><div class="panel">
      <h2>Pausa</h2><p class="hint" id="pausenote"></p>
      <button class="big" data-act="resume">Seguir</button>
      <div class="toggles"><button class="mid" data-act="snd" id="tsnd"></button><button class="mid" data-act="mus" id="tmus"></button><button class="mid" data-act="vib" id="tvib"></button><button class="mid" data-act="cal" id="tcal"></button>
        <button class="mid" data-act="zoom" id="tzoom"></button><button class="mid" data-act="bigbtn" id="tbig"></button><button class="mid" data-act="zurdo" id="tzurdo"></button></div>
      <p class="hint" id="calnote"></p>
      <button class="mid ghost" data-act="quit">Salir al menú</button>
    </div></div>`;
  hudBuilt = true; applyA11y();
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
    // dinámica 10: aviso de que tu pareja tiene el especial listo (para buscar el combo de pareja)
    const mate = Object.entries(s.P).find(([side]) => side !== me.side), mp = mate && mate[1];
    const pairTxt = mp && !mp.d && mp.u >= 1 ? `${NAME[mp.c] || "Tu pareja"} tiene ${mp.c === "thomas" ? "el COMBO listo" : "las TORTAS listas"}: ${mine.u >= 1 ? "¡tírenlo juntos!" : "cargá el tuyo"}` : "";
    put("pairult", "pairult", pairTxt, (e, v) => { e.hidden = !v; e.textContent = v; });
    put("ultpair", "ultbtn", !!pairTxt && mine.u >= 1, (e, v) => e.classList.toggle("pair", v));
    put("ultlabel", "ultlabel", mine.c === "thomas" ? "COMBO" : "TORTAS", (e, v) => { e.textContent = v; });
    const dk = 1 - Math.min(1, (me.side === "guest" && guestPos ? Math.max(guestPos.dcd, mine.dc) : mine.dc) / 2.4);
    put("dashk", "dashbtn", Math.round(dk * 20) * 5, (e, v) => e.style.setProperty("--k", v + "%"));
    put("build", "build", JSON.stringify([mine.w, mine.pa, mine.e]), e => { e.innerHTML = buildIcons(mine); });
  }
  if (hintT > 0) { hintT -= dt; const v = input.vec; if (v.x || v.y) hintT = Math.min(hintT, 0.6); show("movehint", !(hintT <= 0 || s.st !== "run")); } else show("movehint", false);
  show("objhud", !!s.ob);
  if (s.ob) put("objtxt", "objtxt", `Pedido de Roro's ${s.ob[2]}% · ${s.ob[3]}s`, (e, v) => { e.textContent = v; });
  // objetivo de la historia o, en el arcade, el evento de mitad de partida (dinámica 3) con su cuenta regresiva
  show("goalhud", (!!s.goal || !!s.md) && s.st !== "dialog");
  if (s.goal) {
    put("goaltxt", "goaltxt", goalText(s.goal), (e, v) => { e.textContent = v; });
    put("goalfill", "goalfill", s.goal.p, (e, v) => { e.style.width = v + "%"; });
    put("goalcry", "goalhud", s.goal.k === "escort" && s.goal.hp < 0, (e, v) => e.classList.toggle("alert", v));
  } else if (s.md) {
    put("goaltxt", "goaltxt", `${MID_HUD[MID_IDS[s.md[0]]] || ""} · ${s.md[1]} s`, (e, v) => { e.textContent = v; });
    put("goalfill", "goalfill", Math.max(0, Math.min(100, Math.round(s.md[1] / 30 * 100))), (e, v) => { e.style.width = v + "%"; });
  }
  // historia: cartel chico (pistas), subtítulo que no pausa y botón de Maitena (el mismo en la historia y el arcade)
  show("hinthud", !!s.hn && s.st === "run");
  if (s.hn) put("hint", "hinthud", s.hn[1], (e, v) => { e.textContent = v; });
  show("talkhud", !!s.tk && s.st !== "dialog");
  if (s.tk) put("talk", "talkhud", s.tk[0], e => { const img = dialogPortrait(portraitId(s.tk[1]), 2); e.innerHTML = `${img ? `<img src="${img}" alt="">` : ""}<span><b>${esc(speaker(s.tk[1]))}</b>${esc(s.tk[2])}</span>`; });
  show("maibtn", !!s.mai && s.st === "run"); put("maithud", "hud", !!s.mai, (e, v) => e.classList.toggle("mait", v));
  if (s.mai) {
    put("maik", "maibtn", Math.round(s.mai[0] * 20) * 5, (e, v) => e.style.setProperty("--k", v + "%"));
    put("maiready", "maibtn", s.mai[0] >= 1 && !s.mai[2], (e, v) => e.classList.toggle("ready", v));
    put("mailabel", "mailabel", s.mai[1] && s.mai[1] !== me.side && s.mai[0] >= 1 ? "¡TOCÁ YA!" : s.mai[1] === me.side ? "ESPERANDO" : "MAITENA", (e, v) => { e.textContent = v; });
  }
  document.body.classList.toggle("cine", s.st === "dialog");
  renderDialog(s.st === "dialog" ? s.dlg : null);
  show("bossbar", !!s.boss);
  if (s.boss) {
    put("bossname", "bossname", BOSS_NAME[s.boss.n] || "LINDA, LA JEFA", (e, v) => { e.textContent = v; });
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
    if (resultTimer === 0) R.wipe("cierre"); // gráficos: el iris se cierra sobre tu personaje mientras llegan los resultados
    resultTimer += dt;
    if (resultTimer > 1.6) { endShown = true; resultTimer = 0; finish(s); }
  }
}
// texto del objetivo para el HUD (en infinitivo: sirve jugando solo o de a dos). La barra muestra el progreso.
const mmss = x => fmt(x).replace(/^0/, "");
function goalText(g) {
  const lb = g.lb || "", l = g.l !== null && g.l !== undefined ? ` · ${mmss(g.l)}` : "";
  switch (g.k) {
    case "survive": return `${lb || "Aguantar"}${l}`;
    case "defend": return `${lb || "Defender"}${g.hp !== null ? ` · ${g.hp}%` : ""}${l}`;
    case "protect": return `${lb || "Proteger"} · ${g.hp}%${l}`;
    case "escort": return g.hp < 0 ? "¡Carmelo llora! Quedate a su lado" : `${lb || "Llevar"} · ${g.p}%`;
    case "trains": return g.rs && g.rs[3] >= 0 ? `${lb || "Rescatar"}: ${snap && Object.keys(snap.P).length > 1 ? "quédense" : "quedate"} en el refugio · ${g.rs[3]}%` : `Trenes: ${g.n} de ${g.of}${g.n >= g.of ? "" : g.n >= 2 ? "" : " · la vía no está limpia"}`;
    case "track": return g.wt ? `Rastros: ${g.n} de ${g.of} · Romero se movió, buscando… ${g.wt} s` : `${lb || "Rastros"}: ${g.n} de ${g.of}${g.sp && g.sp[4] >= 0 ? ` · ${g.sp[4]} s` : ""}`;
    case "boss": return g.in ? `${lb || "Derrotar a la jefa"} · ${g.hp}%` : "Algo se acerca…";
    case "reach": return g.rs && g.rs[3] >= 0 ? `Bajar al Chema de la torre · ${g.rs[3]}%` : g.hd !== undefined && g.hd !== null ? `${snap && Object.keys(snap.P).length > 1 ? "Quédense juntos acá" : "Quedate acá"} · ${g.hd}%` : `${lb || "Llegar"} · ${g.p}%`;
    default: return lb;
  }
}
const BOSS_NAME = { luz: "LUZ", linda: "LINDA, LA JEFA", luz2: "LUZ", canicheBoss: "LA OTRA LINDA" };
const BOSS_BANNER = { luz: ["¡LUZ!", "La gata de la abuela está furiosa"], linda: ["¡LINDA!", "La jefa en persona. Derrótenla para ganar"], luz2: ["¡LUZ!", "Si marca a uno, el otro que se le pegue"], canicheBoss: ["¡LA OTRA LINDA!", "La buena. La de la abuela. La peor"] };
// quién habla → retrato de diálogo (dialogPortrait de sprites.js)
function portraitId(who) {
  if (who === "gata") return "linda";
  if (who === "romero") return curCap && curCap.n >= 3 ? "gomeghooo" : "romero";
  if (who === "caniche") return curCap && curCap.id === "terrazas" ? "canicheBoss" : "caniche";
  if (who === "thomas" || who === "rocio") { for (const p of Object.values((snap && snap.P) || {})) if (p.c === who && p.sk) return p.sk; return who; }
  return who;
}
// eventos de la historia que se muestran como cartel
function storyEvent(e) {
  if (e[0] === "sbanner") banner(e[1], e[2]);
  if (e[0] === "sphase") { const B = snap && snap.boss && snap.boss.n; if (B === "luz2") banner("¡Luz se enoja!", "Ahora carga dos veces seguidas"); else if (B === "canicheBoss") banner(e[1] === 2 ? "¡Carritos!" : "¡Berrinche!", e[1] === 2 ? "La caniche silba y largan los carritos" : "Busquen los huecos de la onda"); music.set("boss"); }
  if (e[0] === "goaldone" && snap && snap.goal && snap.goal.k === "reach") banner("¡Llegaron!", "");
  if (e[0] === "rescue") banner("¡Rescatado!", "");
  if (e[0] === "goallost") banner("¡Se rompió!", "Cuiden lo que queda");
  if (e[0] === "trackmove") banner("Se perdió el rastro", "Saltó a otro puesto");
  if (e[0] === "track") banner("¡Rastro!", "");
  if (e[0] === "give") { if (e[1] === me.side) banner("¡Se suma " + (WEAPONS[e[2]] ? WEAPONS[e[2]].name : e[2]) + "!", WEAPONS[e[2]] ? WEAPONS[e[2]].desc : ""); }
  if (e[0] === "special") banner("Nuevo especial", "Llamá a Maitena: botón violeta");
  if (e[0] === "maitena") { banner(e[1] ? "¡Maitena doble!" : "¡Maitena!", e[1] ? "Lo tocaron los dos: pega el doble" : "Invicta"); buzz([40, 30, 80]); }
  if (e[0] === "maiarm" && e[1] !== me.side) banner("¡Tu pareja llamó a Maitena!", "Tocá el botón ya y sale doble");
  if (e[0] === "stun") buzz(40);
}
// caja de diálogo: retrato, nombre y texto que se escribe solo. Tocar completa el texto y después avanza.
// "Saltar" aparece si esa escena ya se vio (en este celu). La pregunta del comisario muestra las opciones.
let dlgKey = "", dlgShown = 0, dlgFull = false, dlgSeenNow = new Set();
const dlgSeenKey = d => (curCap ? curCap.id : "arcade") + ":" + d.id;
function renderDialog(d) {
  const box = $("#dialog"); if (!box) return;
  if (!d) { if (dlgKey) { markSeen(dlgKey.split(":")[0]); dlgKey = ""; box.hidden = true; box.innerHTML = ""; } return; }
  const key = d.id + ":" + d.i + ":" + d.n;
  if (key !== dlgKey) {
    for (const k of [...hudVals.keys()]) if (k.startsWith("dlg")) hudVals.delete(k);
    // la escena anterior ya se vio: se anota para ofrecer "Saltar" la próxima vez
    if (dlgKey && !dlgKey.startsWith(d.id + ":")) markSeen(dlgKey.split(":")[0]);
    dlgKey = key; dlgShown = performance.now(); dlgFull = false;
    const img = d.who === "narrador" ? "" : dialogPortrait(portraitId(d.who), 3) || portrait(d.who, 4);
    const seen = prof.story.seen && prof.story.seen[dlgSeenKey(d)];
    box.hidden = false;
    box.innerHTML = `<div class="dlgbox ${d.who === "narrador" ? "narr" : ""} ${d.o ? "ask" : ""}" data-act="adv">${img ? `<img src="${img}" alt="">` : ""}<div class="dlgtxt"><b>${esc(speaker(d.who))}</b><p id="dlgtext"></p>
      ${d.o ? `<div class="dlgopts">${d.o.map((o, i) => `<button class="mid" data-act="answer" data-i="${i}">${esc(o)}</button>`).join("")}</div>` : ""}
      <div class="dlgfoot"><span id="dlgwait"></span>${seen && !d.o ? `<button class="skip" data-act="advskip">Saltar</button>` : ""}</div></div></div>`;
  }
  const n = dlgFull ? d.text.length : Math.min(d.text.length, Math.floor((performance.now() - dlgShown) / 28));
  if (n >= d.text.length) dlgFull = true;
  put("dlgtext", "dlgtext", n, (e, v) => { e.textContent = d.text.slice(0, v); });
  const mine = d.o ? d.an && d.an[me.side] !== undefined : d.r && d.r[me.side];
  put("dlgwait", "dlgwait", mine ? "Esperando a tu pareja…" : d.o ? "Elegí una respuesta" : `${d.i + 1} de ${d.n} · tocá para seguir`, (e, v) => { e.className = mine ? "wait" : ""; e.textContent = v; });
}
function markSeen(id) { if (!id || dlgSeenNow.has(id)) return; dlgSeenNow.add(id); prof.story.seen = prof.story.seen || {}; const k = (curCap ? curCap.id : "arcade") + ":" + id; if (!prof.story.seen[k]) { prof.story.seen[k] = 1; save(); } }
function advDialog(skip, choice) {
  if (!snap || snap.st !== "dialog" || performance.now() - dlgShown < 300) return;
  if (snap.dlg && snap.dlg.o && typeof choice !== "number") { dlgFull = true; return; }
  if (!skip && !dlgFull && typeof choice !== "number") { dlgFull = true; return; }
  if (me.side === "host") { if (sim) sim.adv("host", skip, choice); }
  else if (me.net) me.net.send({ t: "adv", skip: skip ? 1 : 0, c: typeof choice === "number" ? choice : undefined });
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
  const unl = win && curCap && curCap.unlock ? curCap.unlock.filter(u => !prof.unlock[u]) : [];
  if (win && s.cap) { saveChapter(s.cap, curCap ? curCap.n : 0, s.sr); if (me.side === "host" && me.net && me.net.connected) me.net.send({ t: "cap", id: s.cap, n: curCap ? curCap.n | 0 : 0, stars: s.sr | 0 }); }
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
  document.body.classList.remove("cine");
  draw({ win: won, t: s.t, k: s.kl, lv: s.lv, newBest, duel, cap: curCap, stars: s.sr | 0, eb: s.eb || null, unl, metas, extra, alcAdd, second: !!s.sc, endless: !!s.won && !win });
}

/* ---------------- pantallas ---------------- */
function charCard(c) {
  const sk = SKIN[c], has = sk && prof.unlock[sk.unlock], on = has && prof.skin[c] === sk.id;
  return `<div class="charwrap"><button class="char ${prof.who === c ? "on" : ""}" data-act="who" data-v="${c}">
    <img src="${portrait(on ? sk.id : c, 6)}" alt=""><b>${NAME[c]}</b><span>${c === "thomas" ? "Patada Bielli · cuerpo a cuerpo" : "Medialunas · a distancia"}</span></button>
    ${has ? `<button class="link skin" data-act="skin" data-v="${c}">Ropa: ${on ? esc(sk.name) : "de siempre"}</button>` : ""}</div>`;
}
// gráficos: los mapas de la historia (abuela, roros) aparecen en el arcade solo si la historia los desbloqueó
// (prof.unlock["map:<id>"], lo guarda saveChapter con el `unlock` de cada capítulo) y si el motor ya tiene su
// entrada en MAPS (engine.js). Mientras falte cualquiera de las dos cosas, el menú queda como antes.
function mapaHistoriaJugable(k) { return !!(prof.unlock && prof.unlock["map:" + k]) && !!MAPS[k] && !!THEMES[k]; }
function mapList() { return [...Object.keys(THEMES), ...STORY_MAPS.filter(mapaHistoriaJugable)]; }
function mapCards() {
  // historia: los mapas abuela y roros (no enumerables en THEMES) aparecen al final, desbloqueados jugando la historia
  const list = [...Object.entries(THEMES), ...Object.keys(STORY_MAP_FROM).map(k => [k, THEMES[k]])];
  return `<div class="maps">${list.map(([k, t]) => {
    const story = STORY_MAP_FROM[k], owned = story ? prof.unlock["map:" + k] : prof.maps[k];
    const tier = MAPS[k].tier;
    const mt = ((prof.arcade.metas || {})[k] || []).filter(Boolean).length; // dinámica 9: metas cumplidas en ese mapa
    return `<button class="mapc ${map === k ? "on" : ""} ${owned ? "" : "locked"}" data-act="${owned ? "map" : story ? "" : "buymap"}" data-v="${k}" ${!owned && story ? "disabled" : ""}><div><b>${t.name}</b><small>${"★".repeat(tier + 1)}${"☆".repeat(5 - tier)} · ${esc(t.sub)}${tier ? ` · +${tier * 12}%${COIN()}` : ""}${owned ? ` · metas ${mt}/3` : ""}</small></div><span>${owned ? (map === k ? "Elegido" : "Elegir") : story ? `Se gana en ${story}` : `${MAP_COST[k]}${COIN()}`}</span></button>`;
  }).join("")}${prof.unlock["ally:corbata"] ? `<button class="link" data-act="corbata">Corbata te acompaña: ${prof.corbataOn ? "sí" : "no"}</button>` : ""}</div>`;
}
// historia: pantalla de capítulos. Disponibles = el máximo entre los dos celus; candado, tilde y estrellas.
const starsOf = id => { const d = prof.story.done[id]; return d ? (typeof d === "object" ? d.stars | 0 : 1) || 1 : 0; };
function chapterList(pick) {
  const avail = storyCap();
  return `<div class="caps">${STORY.CHAPTERS.map(c => {
    const open = c.n <= avail, st = starsOf(c.id), on = capSel === c.id;
    const tag = c.n === 0 ? "Prólogo" : c.n === 8 ? "Epílogo" : "Capítulo " + c.n;
    return `<button class="capc ${on ? "on" : ""} ${open ? "" : "locked"} ${st ? "done" : ""}" ${open && pick ? `data-act="cap" data-v="${esc(c.id)}"` : ""} ${open ? "" : "disabled"}>
      <span class="capn">${c.n === 0 ? "P" : c.n === 8 ? "E" : c.n}</span>
      <span class="capt"><small>${tag}${open ? "" : " · bloqueado"}</small><b>${open ? esc(c.title) : "¿?"}</b><small>${open ? esc(c.sub) : "Terminen el anterior"}</small></span>
      <span class="caps-st">${st ? `<i class="tick">✔</i><em>${"★".repeat(st)}${"☆".repeat(3 - st)}</em>` : open ? "" : "🔒"}</span></button>`;
  }).join("")}</div>`;
}
function capCards() {
  const ch = chapter(capSel);
  return `<p class="label">Historia</p>${ch ? `<div class="capsel"><b>${esc(ch.title)}</b><small>${esc(ch.sub)}</small></div>` : ""}<button class="mid ghost" data-act="story">${ch ? "Cambiar capítulo" : "Elegir un capítulo"}</button>${ch ? `<button class="link" data-act="cap" data-v="">Volver al arcade</button>` : ""}`;
}
// lo desbloqueado en la historia, visible en el menú
function unlockList() {
  const got = Object.keys(UNLOCK_NAME).filter(u => prof.unlock[u]);
  return got.length ? `<p class="unl"><span>Desbloqueado:</span> ${got.map(u => esc(UNLOCK_NAME[u])).join(" · ")}</p>` : "";
}
const nextChapter = ch => STORY && ch ? STORY.CHAPTERS.find(c => c.n === (ch.n | 0) + 1) || null : null;
function storyResult(r) {
  const ch = r.cap, credits = r.win && ch.credits;
  return `<h2 class="${r.win ? "win" : "lose"}">${r.win ? (ch.n === 8 ? "¡Feliz Día de la Madre!" : "¡Capítulo superado!") : esc(r.eb ? r.eb[0] : "No salió")}</h2>
    <p>${esc(ch.title || "")}${r.win ? "" : esc(r.eb && r.eb[1] ? ". " + r.eb[1] + "." : ". Prueben de nuevo.")}</p>
    ${r.win ? `<p class="starsbig">${"★".repeat(r.stars || 1)}<span>${"☆".repeat(3 - (r.stars || 1))}</span></p><p class="hint">Una estrella por terminarlo, otra si nadie cayó y otra si no se perdió nada en el camino.</p>` : ""}
    ${r.unl && r.unl.length ? `<div class="unlnew"><b>¡Desbloquearon!</b>${r.unl.map(u => `<span>${esc(UNLOCK_NAME[u] || u)}</span>`).join("")}</div>` : ""}
    ${credits ? `<div class="credits">${credits.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}`;
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
// gráficos: transición pixelada al cambiar de pantalla (R.wipe en render.js). Iris al entrar a jugar (rosa si es un
// capítulo) y mosaico al salir del título, de la partida o al mostrar los resultados. Lo demás cambia sin transición.
let shownScreen = screen;
function screenFx(from, to) {
  if (to === "run") R.wipe(curCap ? "capitulo" : "iris");
  else if (from === "title" || from === "run" || to === "results") R.wipe("mosaico");
}
function draw(result) {
  if (result) lastResult = result;
  if (screen !== shownScreen) { screenFx(shownScreen, screen); shownScreen = screen; }
  document.body.dataset.screen = screen;
  if (screen !== "run") hud.hidden = true;
  if (screen === "title") {
    // gráficos: pantalla de título con los tres protagonistas (retratos de diálogo), el logo y la demo de fondo
    const cast = [["thomas", "c-a"], ["linda", "c-b"], ["rocio", "c-c"]].map(([id, cl]) => { const src = dialogPortrait(id, 3); return src ? `<img class="${cl}" src="${src}" alt="">` : ""; }).join("");
    ui.innerHTML = `<section class="title" data-act="start">
      <div class="cast" aria-hidden="true">${cast}</div>
      <h1 class="logo"><span>GATOS</span><span>de LINDA</span><em class="ver">2.0</em></h1>
      <p class="tag">Supervivientes del barrio · para dos</p>
      <button class="press" data-act="start"><i aria-hidden="true"></i>Tocá para empezar<i aria-hidden="true"></i></button></section>`;
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
      ${STORY ? `<button class="mid story" data-act="story" ${prof.who ? "" : "disabled"}>Historia: La otra Linda</button>` : ""}
      ${unlockList()}
      <p class="rec">Récord: ${fmt(prof.best.t)} · ${prof.best.k} gatos · ${prof.wins} victorias</p>
      <p class="rec">${alcText()}</p>
      <button class="link" data-act="snd">${sfx.muted ? "Sonido: apagado" : "Sonido: prendido"}</button>
      <button class="link" data-act="zoom">Ver más: ${zoomOn ? "sí" : "no"}</button>
      <button class="link" data-act="bigbtn">Botones grandes: ${bigBtn ? "sí" : "no"}</button>
      <button class="link" data-act="zurdo">Botones: ${leftBtn ? "a la izquierda" : "a la derecha"}</button>
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
      ${capSel ? "" : `<p class="label">Mapa</p>`}
      ${me.side === "host" && !capSel ? mapCards() : capSel ? "" : `<p class="mapname">${THEMES[map].name}</p>`}
      ${!capSel ? metasBlock(map) : ""}
      ${me.side === "host" && !capSel ? alcOptions() : ""}
      ${me.side === "host" && STORY ? capCards() : capSel ? `<p class="label">Historia</p><div class="capsel"><b>${esc((chapter(capSel) || { title: "Capítulo" }).title)}</b><small>${esc((chapter(capSel) || { sub: "" }).sub)}</small></div>` : ""}
      ${me.side === "host" ? `<button class="big" data-act="go" ${solo || (me.connected && !me.protoBad) ? "" : "disabled"}>¡A jugar!</button>` : me.protoBad ? "" : `<p class="busy">Esperando que arranque ${partner || "tu pareja"}</p>`}
      <button class="link" data-act="back">Volver</button>
    </section>`;
    return;
  }
  if (screen === "results") {
    const r = lastResult;
    ui.innerHTML = `<section class="panel results">
      ${r.cap ? storyResult(r) : `<h2 class="${r.win ? "win" : "lose"}">${r.win ? "¡Derrotaron a Linda!" : "Los gatos ganaron"}</h2>
      <p>${r.win ? "El barrio está a salvo. Por esta noche." : "Linda se quedó con el barrio. Revancha."}</p>`}
      ${r.duel && r.duel.length > 1 ? `<div class="duel">${r.duel.map((d, i) => `<div class="${i === 0 ? "mvp" : ""}"><img src="${portrait(d.c, 3)}" alt=""><b>${NAME[d.c]}</b><span>${d.k} gatos</span>${i === 0 ? "<em>MVP</em>" : ""}</div>`).join("")}</div>` : ""}
      <div class="stats"><div><b>${fmt(r.t)}</b><span>tiempo${r.newBest ? " · ¡récord!" : ""}</span></div><div><b>${r.k}</b><span>gatos</span></div><div><b>${r.lv}</b><span>nivel</span></div><div><b>+${earned}</b><span>monedas</span></div></div>
      ${r.metas ? `<p class="label">Metas de ${esc(THEMES[map].name)}</p>${r.metas.map(m => `<p class="hint">${m.ok || m.antes ? "★" : "☆"} ${esc(m.txt)}${m.nueva ? " · ¡nueva!" : ""}</p>`).join("")}` : ""}
      ${r.win && !r.cap ? `<p class="hint">Ganar paga x${r.second ? "1,25 (usaron la segunda chance)" : "1,5"}${r.extra.length ? " · " + esc(r.extra.join(" · ")) : ""}</p>` : r.extra && r.extra.length ? `<p class="hint">${esc(r.extra.join(" · "))}</p>` : ""}
      ${r.alcAdd ? `<p class="hint">Alcancía de la pareja +${r.alcAdd}. ${esc(alcText().replace("Alcancía de la pareja: ", "Ya tienen "))}</p>` : ""}
      ${r.cap && r.win && me.side === "host" && nextChapter(r.cap) ? `<button class="big" data-act="next">Siguiente: ${esc(nextChapter(r.cap).title)}</button>` : ""}
      ${me.side === "host" ? `<button class="${r.cap && r.win && nextChapter(r.cap) ? "mid" : "big"}" data-act="again">${r.cap ? (r.win ? "Jugar de nuevo" : "Reintentar") : "Revancha"}</button>` : `<p class="busy">Esperando a ${esc((me.partner && NAME[me.partner]) || "tu pareja")}</p>`}
      ${r.cap ? `<button class="mid ghost" data-act="story">Capítulos</button>` : ""}
      <button class="mid ghost" data-act="shop">Taller (${COIN()}${prof.coins})</button>
      <button class="link" data-act="menu">Menú</button>
    </section>`;
    return;
  }
  if (screen === "story") {
    const host = !me.connected || me.side === "host";
    ui.innerHTML = `<section class="panel story">
      <div class="brand"><h2>La otra Linda</h2><span class="coins">${"★".repeat(0)}${STORY.CHAPTERS.filter(c => prof.story.done[c.id]).length}/9</span></div>
      <p class="hint">${me.connected ? `De a dos: van los capítulos que tenga cualquiera de los dos.` : "Víspera del Día de la Madre. Se llevaron al Chema y a Amanda. Todo apunta a Linda."}</p>
      ${chapterList(host)}
      ${capSel && host ? (me.connected ? `<button class="big" data-act="go" ${me.protoBad ? "disabled" : ""}>¡A jugar!</button>` : `<div class="btns"><button class="big" data-act="storysolo">Jugar solo</button><button class="mid" data-act="storyduo">Jugar de a dos</button></div>`) : !host ? `<p class="busy">Elige ${esc((me.partner && NAME[me.partner]) || "tu pareja")}</p>` : ""}
      <button class="link" data-act="back">Volver</button>
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
  t("#tzoom", "Ver más", zoomOn); t("#tbig", "Botones grandes", bigBtn);
  const z = $("#tzurdo"); if (z) { z.textContent = `Botones: ${leftBtn ? "izquierda" : "derecha"}`; z.classList.remove("off"); } // dinámica 10
  const v = $("#tvib"); if (v) v.hidden = !navigator.vibrate;
  // gráficos: calidad Alta / Ahorro (R.setQuality la guarda en localStorage)
  const q = $("#tcal"); if (q) q.textContent = `Calidad: ${R.q === "ahorro" ? "Ahorro" : "Alta"}`;
  const n = $("#calnote"); if (n) n.textContent = R.q === "ahorro" ? "Ahorro: sin brillos, gradación de color ni partículas de ambiente. Para celus que se traban." : "Alta: brillos, gradación de color y ambiente de cada mapa.";
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
  if (a !== "ult" && a !== "pick" && a !== "dash" && a !== "mai") sfx.click();
  switch (a) {
    case "start": music.start(); music.set("menu"); screen = "menu"; if (joinDraft.length === 4 && prof.who) joinRoom(joinDraft); draw(); break;
    case "who": prof.who = v; save(); newDemo(); draw(); break;
    case "create": capSel = null; createRoom(); break;
    case "join": { const el = $("#code"); joinRoom(el ? el.value : joinDraft); break; }
    case "solo": leave(); me.side = "host"; capSel = null; screen = "solo"; draw(); break;
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
    case "back": if (screen === "backup") screen = "shop"; else if (screen === "shop") screen = shopBack || "menu"; else if (screen === "story") { screen = me.net && me.code ? "room" : storyBack === "results" ? "menu" : storyBack || "menu"; if (screen === "menu" && !(me.net && me.code)) capSel = null; } else { leave(); screen = "menu"; me.code = null; capSel = null; } errMsg = null; draw(); break;
    case "share": { const url = location.origin + location.pathname + "?sala=" + me.code; if (navigator.share) navigator.share({ title: "Gatos de Linda", text: "Entrá a mi sala", url }).catch(() => {}); else navigator.clipboard && navigator.clipboard.writeText(url).then(() => banner("Link copiado", "")).catch(() => {}); break; }
    case "pick": { if (performance.now() - lvShownAt < 350) break; const i = +b.dataset.i; if (me.side === "host") sim && sim.pick("host", i); else me.net && me.net.send({ t: "pick", i }); sfx.play("coin"); break; }

    case "alcopt": if (alcOn(v)) { prof.arcade.opt[v] = prof.arcade.opt[v] ? 0 : 1; save(); } draw(); break; // dinámica 9
    case "cap": { capSel = v || null; const ch = chapter(capSel); if (ch && THEMES[ch.map]) { map = ch.map; R.setMap(map); newDemo(); } sendLobby(); draw(); break; }
    // historia
    case "story": storyBack = screen === "results" ? (me.net && me.code ? "room" : "menu") : screen; screen = "story"; if (!capSel && STORY) { const n = Math.min(8, storyCap()); const c = STORY.CHAPTERS.find(q => q.n === n); if (c) { capSel = c.id; map = c.map; R.setMap(map); newDemo(); } } sendLobby(); draw(); break;
    case "storysolo": leave(); me.side = "host"; hostStart(); break;
    case "storyduo": createRoom(); break;
    case "next": { const n = nextChapter(chapter(capSel)); if (n) { capSel = n.id; map = n.map; R.setMap(map); sendLobby(); hostStart(); } break; }
    case "skin": { const k = SKIN[v]; if (k) { prof.skin[v] = prof.skin[v] === k.id ? null : k.id; save(); newDemo(); } draw(); break; }
    case "corbata": prof.corbataOn = !prof.corbataOn; save(); draw(); break;
    case "answer": advDialog(false, +b.dataset.i); break;
    case "adv": advDialog(false); break;
    case "advskip": advDialog(true); break;
    case "pause": setPaused(true); break;
    case "resume": setPaused(false); break;
    case "snd": sfx.toggle(); if (screen === "run") paintToggles(); else draw(); break;
    case "mus": music.toggle(); paintToggles(); break;
    case "zoom": zoomOn = !zoomOn; setPref("gdl-zoom", zoomOn); R.zoomOut = zoomOn; R.resize(); paintToggles(); if (screen !== "run") draw(); break; // dinámica 10
    case "bigbtn": bigBtn = !bigBtn; setPref("gdl-bigbtn", bigBtn); applyA11y(); paintToggles(); if (screen !== "run") draw(); break;
    case "zurdo": leftBtn = !leftBtn; setPref("gdl-zurdo", leftBtn); applyA11y(); paintToggles(); if (screen !== "run") draw(); break;
    case "cal": R.setQuality(R.q === "ahorro" ? "alta" : "ahorro"); paintToggles(); break; // gráficos
    case "vib": vibOn = !vibOn; try { localStorage.setItem("gdl-vib", vibOn ? "1" : "0"); } catch (e) {} paintToggles(); buzz(40); break;
    case "quit":
      setPaused(false);
      if (me.side === "host") { if (me.net && me.net.connected) me.net.send({ t: "menu" }); endRun(); toMenu(); }
      else { endRun(); leave(); me.code = null; screen = "menu"; music.set("menu"); newDemo(); R.setMap(map); draw(); }
      break;
  }
});
let shopBack = "menu", storyBack = "menu";
// esquive y combo responden al apoyar el dedo, sin esperar a soltar
document.addEventListener("pointerdown", e => {
  const b = e.target.closest('[data-act="dash"],[data-act="ult"],[data-act="mai"]'); if (!b) return;
  e.preventDefault(); sfx.init();
  if (b.dataset.act === "mai") { maiPress = true; return; }
  if (b.dataset.act === "ult") { if (me.side === "host") input.ultPressed = true; else guestUlt = true; }
  else { if (me.side === "host") hostDash = true; else guestDash = true; }
});
addEventListener("keydown", e => {
  if (screen === "run" && (e.key === "Escape" || e.key === "p" || e.key === "P")) { const pm = $("#pausemenu"); setPaused(!!(pm && pm.hidden)); }
  // en un diálogo, Espacio o Enter avanzan (y no se gasta el combo)
  if (screen === "run" && snap && snap.st === "dialog" && (e.key === " " || e.key === "Enter")) { input.ultPressed = false; advDialog(false); e.preventDefault(); }
  if (screen === "run" && snap && snap.st === "dialog" && snap.dlg && snap.dlg.o && /^[1-9]$/.test(e.key)) advDialog(false, +e.key - 1);
  if (screen === "run" && (e.key === "m" || e.key === "M")) maiPress = true; // Llamá a Maitena
});
document.addEventListener("input", e => { if (e.target.id === "code") { joinDraft = cleanCode(e.target.value); e.target.value = joinDraft; } if (e.target.id === "bkin") { backupIn = e.target.value; backupPending = null; } });

if (new URLSearchParams(location.search).has("debug")) window.__g = () => ({ sim, snap, me, R, prof, input });
draw();
requestAnimationFrame(loop);
