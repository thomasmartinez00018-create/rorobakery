// Simulación de "Gatos de Linda". La corre solo el anfitrión; el invitado recibe fotos del estado.
export const MAP = 1024;          // el mundo mide 1024 x 1024 px (baja resolución)
export const RUN_BOSS1 = 210;     // Luz aparece a los 3:30
export const RUN_BOSS2 = 420;     // Linda aparece a los 7:00

// b: zona caminable [x0, y0, x1, y1]; hz: peligro que cruza el mapa; tier: dificultad del lugar
export const MAPS = {
  plaza:    { tier: 0, b: [12, 12, MAP - 12, MAP - 12], hz: null, pigeons: 30 },
  estacion: { tier: 1, b: [12, 12, MAP - 12, MAP - 12], hz: "tren", hzEvery: 30, hzFirst: 35 },
  feria:    { tier: 2, b: [12, 202, MAP - 12, MAP - 12], hz: "fletero", hzEvery: 26, hzFirst: 40, crates: 6 },
  bielli:   { tier: 3, b: [30, 200, MAP - 30, 984], hz: "trote", hzEvery: 22, hzFirst: 30 },
  cancha:   { tier: 3, b: [12, 136, MAP - 12, MAP - 136], hz: "cortadora", hzEvery: 24, hzFirst: 30 },
  tortugas: { tier: 4, b: [12, 176, MAP - 12, 870], hz: "carritos", hzEvery: 22, hzFirst: 30 },
  terrazas: { tier: 5, b: [12, 214, MAP - 12, MAP - 12], hz: "autos", hzEvery: 18, hzFirst: 25 }
};
export const HAZ = {
  tren:      { len: 330, spd: 560, h: 22, dmg: 40, edmg: 9999, warn: 2.2 },
  fletero:   { len: 52, spd: 320, h: 12, dmg: 24, edmg: 140, warn: 1.7 },
  cortadora: { len: 22, spd: 120, h: 11, dmg: 18, edmg: 90, warn: 1.4 },
  carritos:  { len: 156, spd: 210, h: 9, dmg: 20, edmg: 80, warn: 1.7 },
  autos:     { len: 44, spd: 360, h: 13, dmg: 28, edmg: 160, warn: 1.5 },
  trote:     { len: 112, spd: 140, h: 10, dmg: 16, edmg: 80, warn: 1.6 }
};
export const HAZ_ID = Object.keys(HAZ);

export const ENEMY = {
  gato:      { hp: 10, spd: 30, dmg: 6, r: 6, xp: 1 },
  negro:     { hp: 22, spd: 38, dmg: 8, r: 6, xp: 2 },
  paloma:    { hp: 6, spd: 70, dmg: 5, r: 5, xp: 1 },
  gordo:     { hp: 60, spd: 21, dmg: 12, r: 9, xp: 5 },
  luz:       { hp: 1000, spd: 28, dmg: 16, r: 13, xp: 40, boss: true },
  linda:     { hp: 4200, spd: 25, dmg: 20, r: 17, xp: 0, boss: true },
  saltarin:  { hp: 16, spd: 31, dmg: 9, r: 6, xp: 2 },
  escupidor: { hp: 18, spd: 26, dmg: 5, r: 6, xp: 3 },
  madre:     { hp: 40, spd: 23, dmg: 8, r: 7, xp: 3 },
  gatito:    { hp: 4, spd: 50, dmg: 3, r: 4, xp: 1 },
  caja:      { hp: 24, spd: 0, dmg: 0, r: 7, xp: 0, obj: true },
  // dinámica 3 (ids 30 y 31): el gato con guantes del sparring de Bielli y el gato ladrón que roba gemas desde las 5:00
  sparring:  { hp: 26, spd: 34, dmg: 10, r: 7, xp: 3 },
  ladron:    { hp: 14, spd: 40, dmg: 4, r: 6, xp: 1 }
};
// el número de cada tipo viaja en la foto: los nuevos (enemigos o aliados) van SIEMPRE al final, nunca se reordena
export const ENEMY_ID = { gato: 0, negro: 1, paloma: 2, gordo: 3, luz: 4, linda: 5, saltarin: 6, escupidor: 7, madre: 8, gatito: 9, caja: 10,
  carmelo: 11, corbata: 12, gatalinda: 13, maitena: 14, chema: 15, amanda: 16,
  // dinámica del arcade: ids desde 30 (del 17 al 29 quedan para los tipos nuevos del modo historia)
  sparring: 30, ladron: 31 };
// número → nombre (arreglo con huecos: los ids no son contiguos)
export const ENEMY_NAME = []; for (const [k, v] of Object.entries(ENEMY_ID)) ENEMY_NAME[v] = k;
export const PICKS = ["alfajor", "moneda", "caja", "iman", "manguera"];
// aliados del modo historia. kind: cómo se dibujan mientras no tengan sprite propio (humano, perro, gato).
// act: follow (sigue al jugador más cercano o escolta y pega pataditas), ram (embiste en línea con aviso), area (golpe en área con aviso).
// Valores iniciales: los ajusta la fase del modo historia. Un capítulo puede pisar cualquiera ({ id, hp, dmg, ... }).
export const ALLY = {
  carmelo:   { kind: "humano", act: "follow", hp: 60, spd: 46, r: 5, dmg: 8, cd: 0.9, reach: 16, kb: 140 },
  corbata:   { kind: "perro", act: "ram", hp: 140, spd: 64, r: 7, dmg: 40, cd: 2.4, reach: 150, kb: 220 },
  gatalinda: { kind: "gato", act: "area", hp: 400, spd: 40, r: 9, dmg: 26, cd: 2.6, reach: 48, kb: 160 },
  maitena:   { kind: "humano", act: "area", hp: 200, spd: 70, r: 6, dmg: 60, cd: 1.6, reach: 56, kb: 260, inv: true },
  chema:     { kind: "gato", act: "follow", hp: 40, spd: 60, r: 4, dmg: 0, cd: 9, reach: 0, kb: 0 },
  amanda:    { kind: "gato", act: "follow", hp: 40, spd: 60, r: 4, dmg: 0, cd: 9, reach: 0, kb: 0 }
};
// banderas de cada gato en la foto del estado
export const F_FLASH = 1, F_TELE = 2, F_ELITE = 4, F_RUSH = 8, F_WET = 16, F_LEFT = 32, F_DOWN = 64; // LEFT y DOWN: solo aliados
export const F_STUN = 128;        // dinámica 2: gato o jefa aturdida (recibe más daño)
export const F_BAG = 256;         // dinámica 3: gato ladrón que lleva gemas robadas

/* dinámica 3: evento de mitad de partida, uno por mapa. Arranca a los mid.t s (4:40) si no hay un jefe vivo (si lo hay,
   espera hasta mid.last; después se saltea) y dura mid.dur s, cortado en mid.end para no pisar la horda de las 5:30.
   corbata: Corbata se escapó de lo de la abuela y embiste gatos 30 s (aliado). apagon: solo quedan los faroles y la luz
   de los jugadores, y vienen más gatos negros. liquidacion: caen cajones (sombra roja; el que cae pega a gatos y
   jugadores). sparring: un élite con guantes (jab doble); si le ganan antes del final, monedas extra. riego: aspersores
   que mojan y frenan gatos. promo: 2x1, salen el doble de gatos con 60% de vida. salida: salida del cine, los autos
   pasan cada 5 s. stats.mid cuenta lo de cada evento para las metas del mapa. */
/* dinámica 5: combos de pareja entre armas, activos con el hilo de corazón (los dos a menos de 72 px) y siempre entre
   armas de los DOS (la de uno con la del otro). Cada arma → el arma de la pareja con la que combina:
   medialuna que cruza un charco de mate de la pareja sale mojada (x1,5 y frena); un gato pateado que cae en una
   explosión de torta de la pareja recibe x2; un gato que Juli arañó lo muerde el Romero de la pareja con x3. */
export const COMBO_OF = { medialuna: "mate", mate: "medialuna", patada: "torta", torta: "patada", juli: "romero", romero: "juli" };
export const COMBO = { mate: 1.5, torta: 2, juli: 3, win: 0.8, mark: 2 }; // multiplicadores; win: s que dura la patada; mark: s que dura la marca de Juli
export const MID_IDS = ["corbata", "apagon", "liquidacion", "sparring", "riego", "promo", "salida"];
export const MID_OF = { plaza: "corbata", estacion: "apagon", feria: "liquidacion", bielli: "sparring", cancha: "riego", tortugas: "promo", terrazas: "salida" };
export const GOALS = ["none", "survive", "defend", "escort", "trains", "track", "boss", "reach", "protect"];

export const WEAPONS = {
  patada:    { name: "Patada Bielli", desc: "Patada en arco hacia donde mirás. Nivel 3: a los dos lados.", max: 5, evo: { p: "guantes", name: "Patada Voladora", desc: "Patada giratoria enorme que tira a todos para atrás." } },
  medialuna: { name: "Medialunas", desc: "Tira medialunas al gato más cercano.", max: 5, evo: { p: "amargo", name: "Docena de Medialunas", desc: "Abanico de 6 medialunas que atraviesan." } },
  juli:      { name: "Juli", desc: "Juli gira a tu alrededor y araña lo que toca.", max: 5, evo: { p: "abrazo", name: "Juli Mimosa", desc: "4 Julis que te curan cada vez que arañan." } },
  romero:    { name: "Romero", desc: "Romero sale corriendo a morder gatos.", max: 5, evo: { p: "zapatillas", name: "Romero Desatado", desc: "Más rápido, y cada mordida pega a todos alrededor." } },
  mate:      { name: "Mate hirviendo", desc: "Charcos de mate que queman lo que pisa.", max: 5, evo: { p: "termo", name: "Pava Hirviendo", desc: "Dos charcos gigantes que además frenan a los gatos." } },
  bondi:     { name: "El 315", desc: "Pasa el colectivo y se lleva puesto todo.", max: 5, evo: { p: "iman", name: "315 Expreso", desc: "Dos colectivos, uno para cada lado, más seguido." } },
  rodillo:   { name: "Palo de amasar", desc: "Va y vuelve, atraviesa a todos.", max: 5, evo: { p: "vendas", name: "Rodillo de Acero", desc: "Cuatro palos a la vez, en cruz." } },
  torta:     { name: "Torta bomba", desc: "Una torta que explota al caer.", max: 5, evo: { p: "delantal", name: "Torta de Tres Pisos", desc: "Cada torta explota y larga tres más." } }
};
export const PASSIVES = {
  guantes:    { name: "Guantes de box", desc: "+15% de daño.", max: 5 },
  zapatillas: { name: "Zapatillas", desc: "+8% de velocidad.", max: 5 },
  termo:      { name: "Termo", desc: "Recuperás vida de a poco.", max: 5 },
  iman:       { name: "Imán", desc: "Juntás la experiencia desde más lejos.", max: 5 },
  amargo:     { name: "Mate amargo", desc: "Las armas se recargan 7% más rápido.", max: 5 },
  abrazo:     { name: "Abrazo", desc: "+20 de vida máxima.", max: 5 },
  delantal:   { name: "Delantal de Roro", desc: "+10% de área en golpes, charcos y explosiones.", max: 5 },
  vendas:     { name: "Vendas", desc: "Recibís 7% menos de daño.", max: 5 }
};
export const EVO_OF = Object.fromEntries(Object.entries(WEAPONS).map(([w, d]) => [d.evo.p, w]));
export const SLOTS = 5;
export const GEM_CAP = 120;       // pasadas estas gemas en el piso, las más viejas se fusionan con la vecina
export const GEM_OVER = 400;      // como antes: con más de 400 gemas (contando las fusionadas) las más viejas pasan solas a experiencia
export const PICK_CAP = 30;       // tope de objetos en el piso (las cajas de Roro's nunca se descartan)
export const PICK_LIFE = 40;      // monedas, imanes y mangueras vencen a los 40 s y parpadean los últimos 5
const EXPIRES = { moneda: 1, iman: 1, manguera: 1 }; // la caja y el alfajor no vencen: son premio y vida

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

// azar con semilla (mulberry32): la misma semilla da la misma partida, para pruebas y cinemáticas
export function mulberry32(a) {
  a >>>= 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- guion de la partida: qué pasa y cuándo ----------
   new Sim(mapa, guion, { seed }). Sin guion se juega ARCADE, que es el modo de siempre.
   - bosses: [{ t, type, dist, calm, phase }]       jefes que aparecen a los t segundos
   - hordes: [{ t, n, dist, kinds }]                 anillo de n gatos con dos huecos; kinds se reparte por i % largo
   - orders: [t, ...]                                pedidos de Roro's (si hay un jefe vivo se corren 12 s)
   - elites: { first, min, max, slope, pools: [[desde t, [tipos]], ...] } (null: sin élites)
   - crates: { first, max } (null: sin cajones) · pigeons: { from } (null: sin palomas) · hazards: peligro del mapa sí o no
   - rate: { base, per, max, cap }                   gatos por segundo = min(max, base + t / per), tope de cap en pantalla
   - mix: [[tipo, peso, desde t, hasta t, tope], ...]  activo si t > desde y t <= hasta; tope = número o [base, cada t]
   - win: { kill: tipo } | { t: segundos } | { goal: true } · lose: { allDown: true }
   - goal, events, allies, dialogs: modo historia (ver más abajo) */
/* dinámica 2: Luz como pelea de pareja. Valores por defecto de Sim.luzPar (reutilizable: un jefe del modo historia,
   por ejemplo luz2, puede usar la misma lógica con { pair: { near: 28, stun: 2.5, stunMul: 1.5 } } en su entrada de bosses).
   mark/markDbl: segundos de aviso (línea roja que sigue al marcado); near: px entre el marcado y su pareja para frenarla
   (72 = hilo de corazón); half: segundos de carga antes de chequear; stun: segundos aturdida; stunMul: daño recibido;
   cd: pausa entre cargas; dodge: jugando solo, esquivar en esos segundos antes del chequeo también la frena. */
export const LUZ_PAR = { mark: 0.65, markDbl: 0.4, near: 72, half: 0.35, stun: 2, stunMul: 2, cd: 2.6, dodge: 0.6 };
export const ARCADE = {
  id: "arcade",
  // hp: multiplicador de vida del jefe; pair: true (LUZ_PAR) u objeto que pisa valores de LUZ_PAR
  bosses: [{ t: 210, type: "luz", dist: 150, calm: 3, hp: 2.5, pair: true }, { t: 420, type: "linda", dist: 160, calm: 4, phase: 1 }],
  hordes: [{ t: 150, n: 40, dist: 150, kinds: ["gato"] }, { t: 330, n: 40, dist: 150, kinds: ["saltarin", "negro", "negro"] }],
  orders: [95, 250, 365],
  elites: { first: 70, min: 38, max: 58, slope: 25, pools: [[0, ["gato", "saltarin"]], [110, ["saltarin", "negro", "madre"]], [200, ["negro", "gordo", "madre", "saltarin"]]] },
  crates: { first: 12, max: 5 },
  pigeons: { from: 50 },
  hazards: true,
  rate: { base: 0.9, per: 34, max: 9, cap: 220 },
  mix: [["gato", 10, 0, 300], ["gato", 5, 300], ["saltarin", 3, 45, 200], ["saltarin", 4, 200], ["escupidor", 2, 90, 250, [4, 90]], ["escupidor", 3, 250, null, [4, 90]],
    ["negro", 4, 110, 300], ["negro", 7, 300], ["madre", 2, 140, null, 7], ["gordo", 2, 180, 300], ["gordo", 3, 300],
    ["ladron", 2, 300, null, 3]],                               // dinámica 3: gato ladrón desde las 5:00, hasta 3 a la vez
  mid: { t: 280, dur: 30, last: 300, end: 325 },               // dinámica 3: evento de mitad de partida (MID_OF)
  // dinámica 4: arranque rápido de revancha (new Sim(mapa, guion, { fast: true })): el reloj arranca en t, con
  // `levels` mejoras para elegir apenas empieza, y el saltarín y las palomas habilitados desde `early` segundos
  fast: { t: 30, levels: 1, early: 15 },
  win: { kill: "linda" },
  lose: { allDown: true },
  goal: null,
  events: []
};
// completa un guion parcial con lo del arcade que falte (lo que se pone en null queda apagado)
export function makeGuion(g) {
  if (!g) return ARCADE;
  const out = { ...ARCADE, ...g };
  for (const k of ["bosses", "hordes", "orders", "mix", "events"]) out[k] = out[k] || [];
  out.win = out.win || {}; out.lose = out.lose || { allDown: true };
  return out;
}

// capítulo de js/story.js → guion. Lo que el capítulo no dice queda como en el arcade, salvo jefes, hordas,
// pedidos y élites, que en la historia arrancan apagados (cada capítulo pone los suyos).
export function chapterGuion(ch) {
  const pick = (k, dflt) => ch[k] !== undefined ? ch[k] : dflt;
  return makeGuion({
    id: ch.id, chapter: ch.id,
    bosses: pick("bosses", []), hordes: pick("hordes", []), orders: pick("orders", []), elites: pick("elites", null),
    crates: pick("crates", ARCADE.crates), pigeons: pick("pigeons", ARCADE.pigeons), hazards: pick("hazards", true),
    rate: pick("rate", ARCADE.rate), mix: pick("mix", ARCADE.mix), events: pick("events", []), mid: pick("mid", null), fast: pick("fast", null),
    goal: ch.goal || { kind: "none" }, dur: ch.dur, allies: ch.allies || [], intro: ch.intro || [], outro: ch.outro || [],
    win: pick("win", {}), lose: pick("lose", { allDown: true })
  });
}

export class Sim {
  constructor(map = "plaza", guion, opts = {}) {
    this.map = MAPS[map] ? map : "plaza"; this.cfg = MAPS[this.map];
    this.seed = opts.seed !== undefined ? opts.seed >>> 0 : (Math.random() * 4294967296) >>> 0;
    this.rnd = mulberry32(this.seed);
    let G = makeGuion(guion);
    // dinámica 4: arranque rápido (solo si el guion lo tiene: el arcade sí, la historia no)
    this.fast = !!(opts.fast && G.fast);
    if (this.fast) {
      const F = G.fast;
      G = { ...G, pigeons: G.pigeons && { ...G.pigeons, from: Math.min(G.pigeons.from, F.early) }, mix: G.mix.map(m => m[0] === "saltarin" && m[2] > F.early && m[2] <= F.t + 30 ? [m[0], m[1], F.early, ...m.slice(3)] : m) };
    }
    this.G = G;
    this.t = this.fast ? G.fast.t : 0; this.state = "run";
    this.players = {}; this.enemies = []; this.proj = []; this.eproj = []; this.gems = []; this.pools = []; this.bombs = []; this.buses = []; this.pickups = []; this.zones = []; this.hz = [];
    this.nextId = 1; this.level = 1; this.xp = 0; this.xpNext = 5; this.kills = 0; this.coins = 0;
    this.offers = {}; this.pendingLevels = 0;
    this.ev = []; this.spawnAcc = 0; this.bossIdx = 0; this.bossRef = null;
    this.bosses = G.bosses.slice().sort((a, b) => a.t - b.t);
    this.hordes = G.hordes.slice().sort((a, b) => a.t - b.t); this.calm = 0;
    this.eliteNext = G.elites ? G.elites.first : 9e9; this.crateNext = G.crates ? G.crates.first : 9e9; this.hzNext = (G.hazards && this.cfg.hzFirst) || 9e9;
    this.objTimes = G.orders.slice().sort((a, b) => a - b); this.obj = null;
    // copias: el mismo capítulo se puede jugar de nuevo (revancha) sin arrastrar qué eventos ya pasaron
    this.events = G.events.filter(e => e.t !== undefined).map(e => ({ ...e })).sort((a, b) => a.t - b.t); this.evIdx = 0;
    this.atEvents = G.events.filter(e => e.at !== undefined && e.t === undefined).map(e => ({ ...e }));
    // modo historia: diálogo, objetivo, aliados y cámara (en el arcade quedan vacíos y no tocan el azar)
    this.dlg = null; this.dlgQueue = []; this.dlgN = 0; this.goal = null; this.allies = []; this.lures = []; this.cam = null; this.begun = false;
    this.bond = false;
    this.mid = null; this.midNext = G.mid ? G.mid.t : 9e9; this.stats = { mid: 0, cb: { mate: 0, torta: 0, juli: 0 } }; // dinámica 3 y 5
    this.comboAt = {};                                                                                // dinámica 5
    this.view = {};                 // medio ancho y medio alto de lo que ve cada jugador, para que los gatos aparezcan fuera de cámara
    this.grid = new Map();
  }

  addPlayer(side, char, meta = {}) {
    const m = { hp: 0, dmg: 0, spd: 0, mag: 0, ...meta };
    const [x0, y0, x1, y1] = this.cfg.b;
    const p = {
      side, char, x: (x0 + x1) / 2 + (side === "host" ? -14 : 14), y: (y0 + y1) / 2 + 30, face: 1, moving: 0,
      maxHp: 100 + m.hp * 10, hp: 100 + m.hp * 10, speed: 62 * (1 + m.spd * 0.05), dmgMul: 1 + m.dmg * 0.08, cdMul: 1, magnet: 26 * (1 + m.mag * 0.15), regen: 0, area: 1, armor: 1,
      weapons: { [char === "thomas" ? "patada" : "medialuna"]: 1 }, passives: {}, evo: {}, cds: {}, inv: 0, downed: false, reviveT: 0, ult: 0, kills: 0, lastUlt: -9,
      dashCd: 0, dashT: 0, dvx: 0, dvy: 0, bond: false,
      dog: null, orbA: 0
    };
    if (this.map === "bielli" && char === "thomas") p.dmgMul += 0.15; // juega de local
    this.players[side] = p;
    return p;
  }

  // si se corta la conexión, el que queda sigue solo (y no se traba esperando que el otro elija mejora)
  dropPlayer(side) {
    const p = this.players[side]; if (!p) return;
    delete this.players[side]; delete this.view[side];
    if (this.offers[side]) {
      delete this.offers[side];
      if (this.state === "levelup" && Object.values(this.offers).every(x => x.pick !== null)) { this.offers = {}; this.state = "run"; if (this.pendingLevels) this.openLevelUp(); }
    }
    if (this.dlg) { delete this.dlg.ready[side]; this.checkDialog(); }
    if (this.alive().length === 0 && this.state !== "win") { this.state = "over"; this.ev.push(["over"]); }
  }
  setView(side, w, h) { this.view[side] = { hw: clamp(w / 2, 60, 400), hh: clamp(h / 2, 60, 400) }; }
  // dentro de la cámara de algún jugador
  onScreen(x, y, m = 0) { for (const p of this.alive()) { const v = this.view[p.side]; if (v && Math.abs(x - p.x) < v.hw + m && Math.abs(y - p.y) < v.hh + m) return true; } return false; }

  // dinámica 1: ¿el jugador p ve el punto (x, y) en su pantalla? Igual que la cámara de render.js: centrada en el
  // jugador (8 px más arriba) y frenada en los bordes del mundo. m: margen hacia adentro. Sin tamaño de pantalla
  // conocido (o si p no es un jugador: lo que se defiende en la historia) cuenta como visto.
  sees(p, x, y, m = 6) {
    const v = p && p.side && this.view[p.side]; if (!v) return true;
    const cx = clamp(p.x, v.hw, MAP - v.hw), cy = clamp(p.y - 8, v.hh, MAP - v.hh);
    return Math.abs(x - cx) < v.hw - m && Math.abs(y - cy) < v.hh - m;
  }
  alive() { return Object.values(this.players).filter(p => !p.downed); }
  rr(a, b) { return a + this.rnd() * (b - a); }
  inB(x, y, m = 0) { const b = this.cfg.b; return x >= b[0] + m && x <= b[2] - m && y >= b[1] + m && y <= b[3] - m; }

  /* ---------- paso de simulación ---------- */
  step(dt, input) {
    if (!this.begun) this.begin();
    if (this.state === "dialog") { this.dialogTick(dt); return; }
    if (this.state !== "run") return;
    this.t += dt;
    const ps = Object.values(this.players), [bx0, by0, bx1, by1] = this.cfg.b;
    // movimiento: el anfitrión se mueve con su joystick; el invitado manda su posición
    for (const p of ps) {
      const inp = input[p.side] || {};
      p.dashCd = Math.max(0, p.dashCd - dt);
      if (p.downed) { p.moving = 0; continue; }
      let mx = 0, my = 0;
      if (inp.pos) { p.x = inp.pos.x; p.y = inp.pos.y; p.face = inp.face || p.face; p.moving = inp.moving ? 1 : 0; }
      else if (inp.dir) {
        const { x, y } = inp.dir; const m = Math.hypot(x, y);
        p.moving = m > 0.1 ? 1 : 0;
        if (m > 0.1) { mx = x / Math.max(1, m); my = y / Math.max(1, m); p.x += x * p.speed * dt; p.y += y * p.speed * dt; if (Math.abs(x) > 0.15) p.face = Math.sign(x); }
      }
      if (inp.dash && p.dashCd <= 0) {
        p.dashCd = 2.4; p.inv = Math.max(p.inv, 0.35);
        if (!inp.pos) { if (!mx && !my) mx = p.face; const m = Math.hypot(mx, my); p.dvx = mx / m * 290; p.dvy = my / m * 290; p.dashT = 0.17; }
        this.ev.push(["dash", Math.round(p.x), Math.round(p.y), p.side]); p.lastDash = this.t;
      }
      if (p.dashT > 0) { p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt; }
      p.x = clamp(p.x, bx0, bx1); p.y = clamp(p.y, by0, by1);
      if (inp.ult && p.ult >= 1) this.ultimate(p);
      p.inv = Math.max(0, p.inv - dt);
      if (p.regen) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    }
    // juntos pegan más fuerte
    const al = this.alive();
    this.bond = al.length === 2 && d2(al[0], al[1]) < 72 * 72;
    for (const p of ps) p.bond = this.bond && !p.downed;
    this.revive(dt);
    this.spawn(dt);
    this.buildGrid();
    this.moveEnemies(dt);
    for (const p of ps) if (!p.downed) this.weapons(p, dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateObjective(dt);
    if (this.allies.length) { this._by = "ally"; this.updateAllies(dt); this._by = null; }
    if (this.goal) this.updateGoal(dt);
    this.updateGems(dt);
    this.cleanup();
    if (this.G.lose.allDown !== false && this.alive().length === 0) { this.state = "over"; this.ev.push(["over"]); }
    else if (this.G.win.t && this.t >= this.G.win.t && this.state === "run") this.win();
  }
  // ganar: si el guion tiene epílogo (outro), primero se muestra y la victoria llega al cerrarlo
  win() {
    if (this.state === "win" || this.state === "over") return;
    if (this.G.outro && this.G.outro.length && !this.outroShown) { this.outroShown = true; this.openDialog(this.G.outro, { id: "outro", then: "win", force: true }); return; }
    this.state = "win"; this.ev.push(["win"]);
  }
  lose() { if (this.state === "win" || this.state === "over") return; this.state = "over"; this.ev.push(["over"]); }

  // eventos con hora del guion: { t, do: "elite" | "horde" | "boss" | "order" | "spawn" | "calm" | "win" | "lose", ... }
  runEvents() {
    while (this.evIdx < this.events.length && this.t >= this.events[this.evIdx].t) this.doEvent(this.events[this.evIdx++]);
  }
  doEvent(e) {
    switch (e.do) {
      case "elite": this.spawnElite(e.type); break;
      case "horde": this.hordes.unshift({ t: this.t, n: e.n, dist: e.dist, kinds: e.kinds }); break;
      case "boss": this.bosses.splice(this.bossIdx, 0, { t: this.t, type: e.type, dist: e.dist, calm: e.calm, phase: e.phase }); break;
      case "order": this.objTimes.unshift(this.t); break;
      case "spawn": { const n = e.n || 1; for (let i = 0; i < n; i++) { const q = e.x !== undefined ? { x: e.x + this.rr(-8, 8), y: e.y + this.rr(-8, 8) } : this.edgePos(150); const en = this.spawnAt(e.type || "gato", q.x, q.y, e.hp || 1); if (e.elite) { en.elite = true; en.r = Math.round(en.r * 1.8); en.dmg *= 1.4; en.spd *= 0.85; } } break; }
      case "calm": this.calm = e.s || 4; break;
      case "win": this.win(); break;
      case "lose": this.lose(); break;
      case "dialog": this.openDialog(e.lines, { id: e.id, auto: e.auto }); break;
      case "ally": this.addAlly(e.type, e); break;
      case "allyout": this.allies = this.allies.filter(a => a.type !== e.type); break;
      case "cam": this.cam = e.off ? null : { x: e.x, y: e.y, ally: e.ally, until: e.s ? this.t + e.s : null }; break;
      case "goal": this.initGoal(e.goal || e); break;
      default: if (this.onEvent) this.onEvent(e);
    }
  }

  revive(dt) {
    const ps = Object.values(this.players);
    for (const p of ps) {
      if (!p.downed) continue;
      const helper = ps.find(q => q !== p && !q.downed && d2(p, q) < 24 * 24);
      p.reviveT = helper ? p.reviveT + dt : Math.max(0, p.reviveT - dt * 0.5);
      if (p.reviveT >= 2.2) { p.downed = false; p.hp = p.maxHp * 0.45; p.inv = 2; p.reviveT = 0; this.ev.push(["revive", p.x, p.y, p.side]); }
    }
  }

  /* ---------- aparición de enemigos ---------- */
  spawnAt(type, x, y, hpMul = 1) {
    const b = ENEMY[type], tier = this.cfg.tier;
    const scale = (1 + this.t / 130 + (this.t / 270) ** 2) * (1 + tier * 0.07);
    const solo = Object.keys(this.players).length === 1 ? 0.7 : 1;
    const hp = b.boss ? b.hp * solo * (1 + tier * 0.06) * (1 + this.level * 0.08) : b.hp * scale * hpMul * (solo < 1 ? 0.85 : 1);
    const [x0, y0, x1, y1] = this.cfg.b;
    const e = { id: this.nextId++, type, x: clamp(x, x0, x1), y: clamp(y, y0, y1), hp, maxHp: hp, spd: b.spd * (b.boss ? 1 : 1 + this.t / 900), dmg: b.dmg, r: b.r, flash: 0, kx: 0, ky: 0, wob: this.rnd() * 9, cd: this.rr(1, 2.5), st: 0, stT: 0, ax: 0, ay: 0, slow: 0, hits: {} };
    if (type === "paloma") { e.x = x; e.y = y; }
    if (type === "ladron" && !this.stats.lad) { this.stats.lad = 1; this.ev.push(["ladron"]); } // dinámica 3: primer ladrón
    this.enemies.push(e);
    return e;
  }
  // punto a cierta distancia de un jugador, dentro de la zona caminable
  ringPos(dist, from) {
    const ps = this.alive(); const p = from || ps[Math.floor(this.rnd() * ps.length)] || Object.values(this.players)[0];
    for (let i = 0; i < 10; i++) {
      const a = this.rnd() * Math.PI * 2, x = p.x + Math.cos(a) * dist, y = p.y + Math.sin(a) * dist;
      if (this.inB(x, y, 6)) return { x, y, p };
    }
    const a = this.rnd() * Math.PI * 2;
    return { x: p.x + Math.cos(a) * dist, y: p.y + Math.sin(a) * dist, p };
  }
  // justo afuera de la pantalla (si no sabemos el tamaño de pantalla, a distancia fija como antes)
  edgePos(min = 140, from) {
    const ps = this.alive(); const p = from || ps[Math.floor(this.rnd() * ps.length)] || Object.values(this.players)[0];
    const v = this.view[p.side]; if (!v) return this.ringPos(this.rr(min, min + 40), p);
    for (let i = 0; i < 12; i++) {
      const a = this.rnd() * Math.PI * 2, c = Math.abs(Math.cos(a)) || 1e-6, s = Math.abs(Math.sin(a)) || 1e-6;
      const d = Math.max(min, Math.min(v.hw / c, v.hh / s) + this.rr(14, 34));
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (this.inB(x, y, 6) && !this.onScreen(x, y, 8)) return { x, y, p };
    }
    return this.ringPos(this.rr(min, min + 40), p);
  }
  pressure() {
    const n = Object.keys(this.players).length;
    if (this.alive().length < n) return 0.5;                  // si uno cayó, aflojan para dar chance de levantarlo
    const expected = 1 + this.t / 16;
    return clamp(0.9 + (this.level - expected) * 0.035, 0.85, 1.25); // si van sobrados, aprietan
  }
  count(type) { let n = 0; for (const e of this.enemies) if (e.type === type && e.hp > 0) n++; return n; }
  spawn(dt) {
    const t = this.t, tier = this.cfg.tier, G = this.G;
    const crossed = every => Math.floor(t / every) !== Math.floor((t - dt) / every);
    // jefes del guion (arcade: Luz a los 3:30 y Linda a los 7:00)
    while (this.bossIdx < this.bosses.length && t >= this.bosses[this.bossIdx].t) {
      const b = this.bosses[this.bossIdx++], q = this.ringPos(b.dist || 150);
      this.bossRef = this.spawnAt(b.type, q.x, q.y); if (b.phase) this.bossRef.phase = b.phase;
      if (b.hp) { this.bossRef.hp *= b.hp; this.bossRef.maxHp = this.bossRef.hp; }                  // dinámica 2
      if (b.pair) this.bossRef.pair = b.pair === true ? LUZ_PAR : { ...LUZ_PAR, ...b.pair };
      this.ev.push(["boss", b.type]); this.calm = b.calm || 0;
    }
    const bossAlive = this.bossRef && this.bossRef.hp > 0;
    // horda en anillo con dos huecos: hay que encontrar la salida
    if (this.hordes.length && t >= this.hordes[0].t) {
      const h = this.hordes.shift(); this.ev.push(["horde"]);
      const ps = this.alive(); const p = ps[0] || Object.values(this.players)[0];
      const gap = this.rnd() * Math.PI * 2, N = h.n || 40, kinds = h.kinds || ["gato"], dist = h.dist || 150;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, da = k => Math.abs(Math.atan2(Math.sin(a - k), Math.cos(a - k)));
        if (da(gap) < 0.42 || da(gap + Math.PI) < 0.42) continue;
        this.spawnAt(kinds[i % kinds.length], p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist);
      }
    }
    // bandada de palomas que cruza
    const pe = this.cfg.pigeons || 42;
    if (G.pigeons && t > G.pigeons.from && crossed(pe)) {
      const q = this.edgePos(170); const dx = q.p.x - q.x, dy = q.p.y - q.y, m = Math.hypot(dx, dy);
      for (let i = 0; i < 12; i++) { const e = this.spawnAt("paloma", q.x + this.rr(-20, 20), q.y + this.rr(-20, 20)); e.vx = dx / m; e.vy = dy / m; }
    }
    // gato de élite: duro, lento, suelta una caja
    if (t >= this.eliteNext) {
      const el = G.elites;
      this.eliteNext = t + Math.max(el.min, el.max - t / el.slope);
      if (!bossAlive) this.spawnElite();
    }
    // cajones para romper
    if (t >= this.crateNext) {
      this.crateNext = t + (this.cfg.crates || 13);
      if (this.count("caja") < G.crates.max) { const q = this.ringPos(this.rr(90, 200)); if (this.inB(q.x, q.y, 20)) this.spawnAt("caja", q.x, q.y); }
    }
    // pedido de Roro's
    if (this.objTimes.length && t >= this.objTimes[0]) {
      if (bossAlive) this.objTimes[0] += 12; else { this.objTimes.shift(); this.startObjective(); }
    }
    // peligro del lugar
    if (G.hazards && this.cfg.hz && t >= this.hzNext) { this.hzNext = t + this.cfg.hzEvery * this.rr(0.85, 1.15); this.spawnHazard(); }
    // eventos sueltos del guion (modo historia)
    if (this.evIdx < this.events.length) this.runEvents();
    // dinámica 3: evento de mitad de partida
    if (t >= this.midNext) { if (!bossAlive) this.startMid(); else if (t > G.mid.last) this.midNext = 9e9; else this.midNext = t + 2; }
    if (this.mid) this.midTick(dt);

    if (this.calm > 0) { this.calm -= dt; }
    if (!G.rate) return;
    const moving = this.enemies.length - this.count("caja");
    if (moving >= G.rate.cap) return;
    const mk = this.mid && this.mid.k, promo = mk === "promo"; // dinámica 3: la promo 2x1 duplica y afloja; el apagón trae negros
    const rate = Math.min(G.rate.max, G.rate.base + t / G.rate.per) * this.pressure() * (1 + tier * 0.04) * (this.calm > 0 ? 0.2 : 1) * (Object.keys(this.players).length === 1 ? 0.72 : 1) * (promo ? 2 : 1);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const q = this.edgePos(150);
      this.spawnAt(mk === "apagon" && this.rnd() < 0.4 ? "negro" : this.pickType(), q.x, q.y, promo ? 0.6 : 1);
    }
  }
  // mezcla de gatos del guion: [tipo, peso, desde t, hasta t, tope]
  pickType() {
    const t = this.t, W = [];
    for (const [k, w, from = 0, to = null, cap = null] of this.G.mix) {
      if (!(t > from) || (to !== null && t > to)) continue;
      if (cap !== null && this.count(k) >= (Array.isArray(cap) ? cap[0] + Math.floor(t / cap[1]) : cap)) continue;
      W.push([k, w]);
    }
    if (!W.length) return "gato";
    const tot = W.reduce((a, w) => a + w[1], 0); let r = this.rnd() * tot;
    for (const [k, w] of W) { if ((r -= w) <= 0) return k; }
    return W[0][0];
  }
  spawnElite(type) {
    const t = this.t, pools = (this.G.elites || ARCADE.elites).pools;
    let pool = pools[0][1]; for (const [from, ks] of pools) if (t >= from) pool = ks;
    const q = this.edgePos(160);
    const e = this.spawnAt(type || pool[Math.floor(this.rnd() * pool.length)], q.x, q.y, 8);
    e.elite = true; e.r = Math.round(e.r * 1.8); e.dmg *= 1.4; e.spd *= 0.85;
    this.ev.push(["elite", Math.round(e.x), Math.round(e.y)]);
  }

  /* ---------- dinámica 3: evento de mitad de partida (ver MID_OF) ---------- */
  startMid() {
    const k = MID_OF[this.map] || "corbata", G = this.G.mid;
    this.midNext = 9e9;
    const M = this.mid = { k, t0: this.t, end: this.t + Math.min(G.dur, G.end - this.t), acc: 0.5, fall: 0, win: 0 };
    if (k === "corbata") { const q = this.edgePos(120); M.ally = this.addAlly("corbata", { x: q.x, y: q.y, hp: 200, cd: 2 }); }
    if (k === "sparring") {
      const q = this.edgePos(150), e = M.boss = this.spawnAt("sparring", q.x, q.y, 10);
      e.elite = true; e.r = Math.round(e.r * 1.8); e.dmg *= 1.4; e.spd *= 0.85;
    }
    this.ev.push(["mid", k, 1]);
  }
  midTick(dt) {
    const M = this.mid, k = M.k;
    if (k === "liquidacion" && (M.acc -= dt) <= 0) {
      // cae un cajón cerca de alguien: sombra roja 1,2 s, pega al caer y queda para romper
      M.acc = 2.4; const ps = this.alive(), p = ps[Math.floor(this.rnd() * ps.length)];
      if (p) { const q = this.ringPos(this.rr(30, 110), p); if (this.inB(q.x, q.y, 16)) this.zones.push({ x: q.x, y: q.y, r: 16, t: 0, dur: 1.2, dmg: 10, crate: true }); }
    }
    if (k === "riego" && (M.acc -= dt) <= 0) {
      M.acc = 4;
      for (let i = 0; i < 3; i++) {
        const ps = this.alive(), p = ps[Math.floor(this.rnd() * ps.length)]; if (!p) break;
        const q = this.ringPos(this.rr(40, 140), p);
        this.near(q.x, q.y, 55, e => { if (!this.foe(e) || d2(e, q) > 55 * 55) return; const ux = e.x - q.x, uy = e.y - q.y, m = Math.hypot(ux, uy) || 1; e.slow = 3; this.stats.mid++; this.damage(e, 8, null, ux / m * 140, uy / m * 140, true); });
        this.ev.push(["splash", Math.round(q.x), Math.round(q.y), ""]);
      }
    }
    if (k === "salida" && this.hzNext > this.t + 6.5) this.hzNext = this.t + this.rr(4, 6);
    if (k === "sparring" && M.boss.hp <= 0 && !M.boss.gone) { M.win = 1; this.stats.mid++; this.coins += 10; this.drop("moneda", M.boss.x + 10, M.boss.y); return this.endMid(); }
    if (this.t >= M.end) this.endMid();
  }
  endMid() {
    const M = this.mid; this.mid = null;
    if (M.ally) this.allies = this.allies.filter(a => a !== M.ally);
    if (M.boss && M.boss.hp > 0) { M.boss.hp = 0; M.boss.gone = true; }
    if (M.k === "apagon" && !M.fall) this.stats.mid = 1;
    this.ev.push(["mid", M.k, 0, M.win, this.stats.mid]);
  }

  /* ---------- pedido de Roro's: llevarlo juntos carga el doble ---------- */
  startObjective() {
    const ps = this.alive(); if (!ps.length) return;
    const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    let x = cx, y = cy;
    for (let i = 0; i < 16; i++) { const a = this.rnd() * Math.PI * 2, d = this.rr(170, 240); x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d; if (this.inB(x, y, 40)) break; }
    const b = this.cfg.b; x = clamp(x, b[0] + 40, b[2] - 40); y = clamp(y, b[1] + 40, b[3] - 40);
    this.obj = { x, y, prog: 0, left: 32, acc: 0 };
    this.ev.push(["obj", 2]);
  }
  updateObjective(dt) {
    const o = this.obj; if (!o) return;
    o.left -= dt;
    const inside = this.alive().filter(p => d2(p, o) < 22 * 22).length;
    const solo = Object.keys(this.players).length === 1;
    o.prog += dt * (inside >= 2 ? 0.5 : inside === 1 ? (solo ? 0.34 : 0.2) : 0);
    // el olor a torta atrae gatos
    if (inside) { o.acc += dt; if (o.acc > 1.1) { o.acc = 0; const a = this.rnd() * Math.PI * 2; this.spawnAt(this.rnd() < 0.5 ? "saltarin" : "gato", o.x + Math.cos(a) * 120, o.y + Math.sin(a) * 120); } }
    if (o.prog >= 1) {
      this.drop("caja", o.x, o.y + 6); this.drop("alfajor", o.x - 12, o.y); this.drop("moneda", o.x + 12, o.y); this.drop("moneda", o.x + 16, o.y + 8);
      this.coins += 3; this.ev.push(["obj", 1, Math.round(o.x), Math.round(o.y)]); this.obj = null;
    } else if (o.left <= 0) { this.ev.push(["obj", 0]); this.obj = null; }
  }

  /* ---------- peligros que cruzan el mapa (avisan antes) ---------- */
  spawnHazard() {
    const k = this.cfg.hz, H = HAZ[k], ps = this.alive(); if (!ps.length) return;
    const p = ps[Math.floor(this.rnd() * ps.length)], b = this.cfg.b;
    let y = clamp(p.y + this.rr(-6, 6), b[1] + H.h, b[3] - H.h);
    if (k === "tren") y = Math.abs(p.y - 335) < Math.abs(p.y - 675) ? 335 : 675;
    const dir = this.rnd() < 0.5 ? 1 : -1;
    const lanes = k === "cortadora" ? [y, clamp(y + (this.rnd() < 0.5 ? -60 : 60), b[1] + H.h, b[3] - H.h)] : [y];
    for (const ly of lanes) this.hz.push({ k, y: ly, h: H.h, dir, warn: H.warn, x: dir > 0 ? -10 : MAP + 10, len: H.len, spd: H.spd, dmg: H.dmg, edmg: H.edmg, hit: new Set(), ph: new Set() });
    this.ev.push(["warn", k]);
  }
  updateHazards(dt) {
    for (const z of this.hz) {
      if (z.warn > 0) { z.warn -= dt; if (z.warn <= 0) this.ev.push(["pass", z.k]); continue; }
      z.x += z.dir * z.spd * dt;
      const a = z.dir > 0 ? z.x - z.len : z.x, b = z.dir > 0 ? z.x : z.x + z.len;
      if ((z.dir > 0 && a > MAP + 20) || (z.dir < 0 && b < -20)) { z.done = true; if (this.goal && this.goal.k === "trains") this.goal.n++; continue; }
      for (const p of this.alive()) if (!z.ph.has(p.side) && p.x > a && p.x < b && Math.abs(p.y - z.y) < z.h + 4) { z.ph.add(p.side); p.inv = 0; this.hurt(p, z.dmg, true); }
      this._by = "hz"; // dinámica 3: para contar los gatos que se lleva el peligro en la salida del cine
      this.near((a + b) / 2, z.y, Math.max(z.len / 2, z.h) + 8, e => {
        if (z.hit.has(e.id) || e.x < a || e.x > b || Math.abs(e.y - z.y) > z.h + e.r) return;
        z.hit.add(e.id); this.damage(e, ENEMY[e.type].boss ? 220 : z.edmg, null, z.dir * 260, (e.y - z.y) * 10, true);
      });
      this._by = null;
    }
  }

  /* ---------- grilla espacial ---------- */
  buildGrid() {
    this.grid.clear();
    for (const e of this.enemies) {
      const k = ((e.x >> 5) << 8) | (e.y >> 5);
      let c = this.grid.get(k); if (!c) this.grid.set(k, c = []); c.push(e);
    }
  }
  near(x, y, r, fn) {
    const x0 = (x - r) >> 5, x1 = (x + r) >> 5, y0 = (y - r) >> 5, y1 = (y + r) >> 5;
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const c = this.grid.get((gx << 8) | gy); if (!c) continue;
      for (const e of c) if (e.hp > 0) fn(e);
    }
  }
  foe(e) { return e.hp > 0 && !ENEMY[e.type].obj; }
  nearest(p, maxR = 200) {
    let best = null, bd = maxR * maxR;
    for (const e of this.enemies) { if (!this.foe(e)) continue; const d = d2(p, e); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  moveEnemies(dt) {
    const alive = this.alive(), [bx0, by0, bx1, by1] = this.cfg.b;
    const dmgScale = (1 + this.t / 330) * (1 + this.cfg.tier * 0.05);
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - dt); e.slow = Math.max(0, e.slow - dt);
      if (ENEMY[e.type].obj) continue;
      let tgt = null, bd = Infinity;
      for (const p of alive) { const d = d2(p, e); if (d < bd) { bd = d; tgt = p; } }
      // lo que hay que defender o proteger atrae a los gatos (pesa como si estuviera más cerca)
      for (const L of this.lures) { if (L.down) continue; const d = d2(L, e) * 0.5; if (d < bd) { bd = d; tgt = L; } }
      if (!tgt) continue;
      let dx = tgt.x - e.x, dy = tgt.y - e.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      let spd = e.spd * (e.slow > 0 ? 0.5 : 1);
      switch (e.type) {
        case "paloma": if (e.vx !== undefined) { dx = e.vx; dy = e.vy + Math.sin(this.t * 6 + e.wob) * 0.4; } break;
        case "saltarin":
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.36; } }
          else if (e.st === 2) { spd = 235; dx = e.ax; dy = e.ay; if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = this.rr(2.4, 3.4); } }
          else if ((e.cd -= dt) <= 0 && m < 85) { e.st = 1; e.stT = e.elite ? 0.6 : 0.5; e.ax = dx; e.ay = dy; }
          break;
        case "escupidor":
          e.cd -= dt;
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 0; e.cd = this.rr(2.8, 3.8); const n = e.elite ? 3 : 1; for (let i = 0; i < n; i++) { const a = Math.atan2(tgt.y - e.y, tgt.x - e.x) + (i - (n - 1) / 2) * 0.28; this.eproj.push({ k: 1, x: e.x, y: e.y - 5, vx: Math.cos(a) * 88, vy: Math.sin(a) * 88, life: 2.6, dmg: 9 * dmgScale }); } this.ev.push(["spit", Math.round(e.x), Math.round(e.y)]); } }
          // dinámica 1 (escupidor justo): carga a menos de 95 px y solo si su objetivo lo ve en su pantalla
          else if (m < 95 && e.cd <= 0 && this.eproj.length < 48 && this.sees(tgt, e.x, e.y - 10)) { e.st = 1; e.stT = 0.6; spd = 0; }
          else if (m < 72) { dx = -dx; dy = -dy; spd *= 0.8; }
          else if (m < 92) spd *= 0.25;
          break;
        case "luz":
          if (e.pair) { spd *= this.luzPar(e, dt, e.pair); if (e.st === 2) { dx = e.ax; dy = e.ay; } break; } // dinámica 2
          e.cd -= dt;
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.7; } }
          else if (e.st === 2) { spd *= 4.4; dx = e.ax; dy = e.ay; if ((e.stT -= dt) <= 0) { e.st = 0; if (e.hp < e.maxHp * 0.5 && !e.dbl) { e.dbl = true; e.cd = 0.25; } else { e.dbl = false; e.cd = 2.6; } } }
          else if (e.cd <= 0) { e.st = 1; e.stT = e.dbl ? 0.4 : 0.65; e.ax = dx; e.ay = dy; this.ev.push(["charge", Math.round(e.x), Math.round(e.y)]); }
          break;
        case "linda": spd *= this.linda(e, dx, dy, dt, dmgScale); break;
        case "sparring": // dinámica 3: jab doble (se frena con aviso y tira dos embestidas cortas de unos 40 px)
          if (e.st === 1) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.13; e.jab = 1; } }
          else if (e.st === 2) { spd = 320; dx = e.ax; dy = e.ay; if ((e.stT -= dt) <= 0) { if (e.jab < 2) { e.st = 4; e.stT = 0.2; } else { e.st = 0; e.cd = this.rr(1.6, 2.4); } } }
          else if (e.st === 4) { spd = 0; if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.13; e.jab = 2; e.ax = dx; e.ay = dy; } }
          else if ((e.cd -= dt) <= 0 && m < 60) { e.st = 1; e.stT = 0.45; e.ax = dx; e.ay = dy; }
          break;
        case "ladron": { // dinámica 3: va a la gema suelta más cercana, se la lleva y escapa; lejos de todos, se va con lo robado
          if ((e.bag || 0) < 10) {
            let g = null, gd = 260 * 260;
            for (const q of this.gems) { if (q.got || q.pull) continue; const d = d2(q, e); if (d < gd) { gd = d; g = q; } }
            if (g) { const gx = g.x - e.x, gy = g.y - e.y, gm = Math.hypot(gx, gy) || 1; dx = gx / gm; dy = gy / gm; spd *= 1.25; if (gm < 6) { g.got = true; e.bag = (e.bag || 0) + g.v; } break; }
            if (!e.bag) break;
          }
          dx = -dx; dy = -dy; spd *= 1.15;
          if (bd > 300 * 300 && !this.onScreen(e.x, e.y, 10)) { e.hp = 0; e.gone = true; this.ev.push(["steal", Math.round(e.x), Math.round(e.y), Math.round(e.bag)]); }
          break;
        }
      }
      // separación entre gatos para que no se amontonen en un punto
      let sx = 0, sy = 0;
      this.near(e.x, e.y, 12, o => { if (o === e) return; const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy; const rr = (e.r + o.r) * 0.8; if (dd < rr * rr && dd > 0.01) { const k = (rr - Math.sqrt(dd)) / rr; sx += ox * k; sy += oy * k; } });
      e.x += (dx * spd + e.kx + sx * 6) * dt; e.y += (dy * spd + e.ky + sy * 6) * dt;
      e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (e.type === "paloma") { if (e.x < -20 || e.x > MAP + 20 || e.y < -20 || e.y > MAP + 20) e.hp = 0, e.gone = true; }
      else { e.x = clamp(e.x, bx0, bx1); e.y = clamp(e.y, by0, by1); }
      // contacto con jugadores
      const dmg = e.dmg * dmgScale;
      for (const p of alive) {
        const rr = e.r + 5;
        if (p.inv <= 0 && d2(p, e) < rr * rr) this.hurt(p, dmg);
      }
      if (this.allies.length) for (const a of this.allies) { if (a.down || a.cfg.inv || a.inv > 0) continue; const rr = e.r + a.r; if (d2(a, e) < rr * rr) this.hurtAlly(a, dmg); }
      if (this.lures.length) for (const L of this.lures) { if (!L.tgt || L.down || L.inv > 0) continue; const rr = e.r + L.r; if (d2(L, e) < rr * rr) { L.hp = Math.max(0, L.hp - dmg); L.inv = 0.25; L.flash = 0.12; this.ev.push(["goalhit", Math.round(L.x), Math.round(L.y)]); } }
    }
  }
  /* dinámica 2: carga de pareja. Devuelve el multiplicador de velocidad del cuadro (0 quieta, 4,4 cargando).
     st 1: marca a un jugador (alterna entre los dos) y la línea lo sigue; st 2: carga en línea recta; a los o.half s
     de carga, si la pareja del marcado está a menos de o.near px (o, jugando solo, si el marcado esquivó hace menos de
     o.dodge s), se frena y pasa a st 3: aturdida o.stun s, recibe o.stunMul de daño. Con menos de la mitad de vida
     carga dos veces seguidas. Evento ["mark", lado] al marcar y ["stun", x, y] al frenarse. */
  luzPar(e, dt, o) {
    e.cd -= dt;
    if (e.st === 3) { if ((e.stT -= dt) <= 0) { e.st = 0; e.stun = 0; e.cd = 1.2; } return 0; }
    if (e.st === 1) {
      const m = e.mark && this.players[e.mark.side] === e.mark && !e.mark.downed ? e.mark : this.alive()[0];
      if (m) { e.mark = m; const ux = m.x - e.x, uy = m.y - e.y, d = Math.hypot(ux, uy) || 1; e.ax = ux / d; e.ay = uy / d; }
      if ((e.stT -= dt) <= 0) { e.st = 2; e.stT = 0.7; e.chk = false; }
      return 0;
    }
    if (e.st === 2) {
      e.stT -= dt;
      if (!e.chk && e.stT <= 0.7 - o.half) {
        e.chk = true;
        const m = e.mark, solo = Object.keys(this.players).length === 1;
        const mate = m && this.alive().find(q => q !== m);
        const held = m && !m.downed && (mate ? d2(m, mate) < o.near * o.near : solo && this.t - (m.lastDash || -9) < o.dodge);
        if (held) { e.st = 3; e.stT = o.stun; e.stun = o.stunMul; e.dbl = false; e.kx = e.ky = 0; this.ev.push(["stun", Math.round(e.x), Math.round(e.y)]); return 0; }
      }
      if (e.stT <= 0) { e.st = 0; if (e.hp < e.maxHp * 0.5 && !e.dbl) { e.dbl = true; e.cd = 0.25; } else { e.dbl = false; e.cd = o.cd; } }
      return 4.4;
    }
    const al = this.alive();
    if (e.cd <= 0 && al.length) {
      e.markI = (e.markI || 0) + 1; e.mark = e.dbl && e.mark && !e.mark.downed ? e.mark : al[e.markI % al.length];
      e.st = 1; e.stT = e.dbl ? o.markDbl : o.mark;
      this.ev.push(["charge", Math.round(e.x), Math.round(e.y)], ["mark", e.mark.side]);
      return 0;
    }
    return 1;
  }
  // Linda cambia de táctica a medida que pierde vida
  linda(e, dx, dy, dt, dmgScale) {
    const ph = e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3;
    if (ph !== e.phase) { e.phase = ph; e.cd = 1.4; e.zcd = 1.6; this.ev.push(["phase", ph, Math.round(e.x), Math.round(e.y)]); this.calm = 2; }
    e.cd -= dt;
    if (e.cd <= 0) {
      const base = Math.atan2(dy, dx);
      if (ph < 3) {
        e.cd = ph === 1 ? 2.4 : 2.2;
        const n = ph === 1 ? 3 : 5;
        for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.3; this.eproj.push({ k: 0, x: e.x, y: e.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 3.5, dmg: 12 * dmgScale }); }
        if (this.rnd() < 0.42) {
          const kinds = ph === 1 ? ["negro", "negro", "negro", "negro", "negro", "negro"] : ["madre", "saltarin", "madre", "saltarin"];
          kinds.forEach((k, i) => { const a = i / kinds.length * Math.PI * 2; this.spawnAt(k, e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); });
          this.ev.push(["summon", Math.round(e.x), Math.round(e.y)]);
        }
      } else {
        // anillo de bolas de pelo con un hueco para escapar
        e.cd = 2.9;
        const N = 20, gap = base + this.rr(-0.6, 0.6);
        for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.5) continue; this.eproj.push({ k: 0, x: e.x, y: e.y - 8, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 4, dmg: 12 * dmgScale }); }
        if (this.rnd() < 0.3) { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; this.spawnAt("saltarin", e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); } this.ev.push(["summon", Math.round(e.x), Math.round(e.y)]); }
      }
      this.ev.push(["hairball", Math.round(e.x), Math.round(e.y)]);
    }
    if (ph >= 2) {
      e.zcd -= dt;
      if (e.zcd <= 0) {
        e.zcd = ph === 3 ? 3.4 : 4.4;
        for (const p of this.alive()) this.zones.push({ x: p.x + this.rr(-8, 8), y: p.y + this.rr(-8, 8), r: 24, t: 0, dur: 1.15, dmg: 16 * dmgScale });
        if (ph === 3) { const q = this.ringPos(this.rr(30, 70)); this.zones.push({ x: q.x, y: q.y, r: 30, t: 0, dur: 1.3, dmg: 16 * dmgScale }); }
        this.ev.push(["zones"]);
      }
    }
    return ph === 3 ? 1.35 : 1;
  }

  hurt(p, dmg, force) {
    if (p.downed || (p.inv > 0 && !force)) return;
    p.hp -= dmg * p.armor; p.inv = 0.6;
    this.ev.push(["hurt", Math.round(p.x), Math.round(p.y), p.side]);
    if (p.hp <= 0) { p.hp = 0; p.downed = true; p.reviveT = 0; p.dashT = 0; if (this.mid) this.mid.fall = 1; this.ev.push(["down", Math.round(p.x), Math.round(p.y), p.side]); }
  }

  damage(e, dmg, p, kx = 0, ky = 0, raw) {
    if (e.hp <= 0) return;
    const crit = !raw && this.rnd() < 0.08;
    const d = Math.round((raw ? dmg : dmg * (p ? p.dmgMul * (p.bond ? 1.2 : 1) : 1) * (crit ? 2 : 1)) * (e.stun || 1)); // stun: dinámica 2
    e.hp -= d; e.flash = 0.12;
    const kb = ENEMY[e.type].boss ? 0.15 : ENEMY[e.type].obj ? 0 : e.elite ? 0.35 : 1;
    e.kx += kx * kb; e.ky += ky * kb;
    this.ev.push(["hit", Math.round(e.x), Math.round(e.y - 8), Math.min(9999, d), crit ? 1 : 0]);
    if (e.hp <= 0) this.kill(e, p);
  }

  kill(e, p) {
    const B = ENEMY[e.type];
    this.ev.push(["die", Math.round(e.x), Math.round(e.y), ENEMY_ID[e.type]]);
    if (B.obj) { this.dropCrate(e); if (e.liq) { this.stats.mid++; this.drop("moneda", e.x - 6, e.y + 4); } return; } // dinámica 3: cajón de la liquidación
    this.kills++;
    if (this.mid && ((this.mid.k === "corbata" && this._by === "ally") || (this.mid.k === "salida" && this._by === "hz") || this.mid.k === "promo")) this.stats.mid++; // dinámica 3
    if (e.bag) this.gems.push({ x: e.x, y: e.y, v: e.bag, pull: 0 });                     // dinámica 3: el ladrón suelta lo robado
    if (p) { p.kills++; p.ult = Math.min(1, p.ult + (B.boss ? 0.5 : e.elite ? 0.25 : 1 / 55)); }
    if (e.type === this.G.win.kill) { this.win(); return; }
    if (B.boss) { for (let i = 0; i < 16; i++) this.gems.push({ x: e.x + this.rr(-24, 24), y: e.y + this.rr(-24, 24), v: 5, pull: 0 }); this.drop("alfajor", e.x - 8, e.y); this.drop("caja", e.x + 8, e.y); this.bossRef = null; this.calm = 8; this.ev.push(["bossdown", e.type]); return; }
    if (e.type === "madre") for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const k = this.spawnAt("gatito", e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8); k.kx = Math.cos(a) * 90; k.ky = Math.sin(a) * 90; }
    if (e.elite) { this.drop("caja", e.x, e.y); for (let i = 0; i < 4; i++) this.gems.push({ x: e.x + this.rr(-14, 14), y: e.y + this.rr(-14, 14), v: 5, pull: 0 }); return; }
    this.gems.push({ x: e.x, y: e.y, v: B.xp, pull: 0 });
    if (this.rnd() < 0.01) this.drop("alfajor", e.x + 4, e.y);
    if (this.rnd() < 0.04) this.drop("moneda", e.x - 4, e.y);
  }
  dropCrate(e) {
    const r = this.rnd();
    const k = r < 0.34 ? "moneda" : r < 0.56 ? "alfajor" : r < 0.76 ? "iman" : "manguera";
    this.drop(k, e.x, e.y);
    if (k === "moneda") this.drop(k, e.x + 7, e.y + 3);
  }
  // objeto en el piso: las monedas cercanas se apilan; con más de PICK_CAP se va el más viejo que vence (nunca una caja)
  drop(k, x, y) {
    if (k === "moneda") for (const o of this.pickups) if (o.k === "moneda" && !o.got && (o.x - x) ** 2 + (o.y - y) ** 2 < 256) { o.n = (o.n || 1) + 1; o.t0 = this.t; return o; }
    const o = { k, x, y, t0: this.t };
    this.pickups.push(o);
    if (this.pickups.length > PICK_CAP) {
      let i = this.pickups.findIndex(q => EXPIRES[q.k] && !q.got);
      if (i < 0) i = this.pickups.findIndex(q => q.k !== "caja" && !q.got);
      if (i >= 0) this.pickups.splice(i, 1);
    }
    return o;
  }

  /* ---------- armas ---------- */
  cd(p, id, base) {
    p.cds[id] = (p.cds[id] || 0) - this.dt;
    if (p.cds[id] > 0) return false;
    p.cds[id] = base * p.cdMul; return true;
  }
  // dinámica 5: gato arañado hace poco por la Juli de la pareja, el más cercano al perro
  markedFor(p, dog, R) {
    let best = null, bd = R * R;
    for (const e of this.enemies) { if (!this.foe(e) || !(e.juli > this.t - COMBO.mark) || e.juliBy === p.side) continue; const d = d2(dog, e); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  // dinámica 5: anota el combo y avisa (como mucho un aviso cada 0,6 s por combo, para no llenar la red)
  combo(k, x, y) {
    this.stats.cb[k]++;
    if ((this.comboAt[k] || -9) > this.t - 0.6) return;
    this.comboAt[k] = this.t; this.ev.push(["combo", k, Math.round(x), Math.round(y)]);
  }
  targets(p, R, n) { return this.enemies.filter(e => this.foe(e) && d2(p, e) < R * R).sort((a, b) => d2(p, a) - d2(p, b)).slice(0, n); }
  weapons(p, dt) {
    this.dt = dt;
    const W = p.weapons, X = p.evo, A = p.area;
    if (W.patada && this.cd(p, "patada", (1.05 - W.patada * 0.07) * (X.patada ? 0.8 : 1))) {
      const lv = W.patada, r = (30 + lv * 3) * A * (X.patada ? 1.35 : 1), both = lv >= 3 || X.patada, dmg = (13 + lv * 6) * (X.patada ? 1.6 : 1), kb = X.patada ? 220 : 120;
      this.ev.push(["slash", Math.round(p.x), Math.round(p.y), p.face, Math.round(r), X.patada ? 2 : both ? 1 : 0]);
      this.near(p.x, p.y, r, e => { const dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy > r * r) return; if (!both && dx * p.face < -6) return; const m = Math.hypot(dx, dy) || 1; e.kick = this.t; e.kickBy = p.side; this.damage(e, dmg, p, X.patada ? dx / m * kb : Math.sign(dx || p.face) * kb, X.patada ? dy / m * kb : dy * 2); });
    }
    if (W.medialuna && this.cd(p, "medialuna", X.medialuna ? 0.75 : 0.95 - W.medialuna * 0.07)) {
      const lv = W.medialuna, dmg = 10 + lv * 4;
      if (X.medialuna) {
        const t = this.nearest(p, 190);
        const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        for (let i = 0; i < 6; i++) { const a = base + (i - 2.5) * 0.22; this.proj.push({ k: 0, x: p.x, y: p.y - 6, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: dmg * 1.2, pierce: 3, life: 1.3, own: p.side, hit: new Set() }); }
        this.ev.push(["throw", p.x, p.y]);
      } else {
        const targets = this.targets(p, 170, 1 + Math.floor(lv / 2));
        targets.forEach(t => { const a = Math.atan2(t.y - p.y, t.x - p.x); this.proj.push({ k: 0, x: p.x, y: p.y - 6, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg, pierce: lv >= 4 ? 2 : 1, life: 1.4, own: p.side, hit: new Set() }); });
        if (targets.length) this.ev.push(["throw", p.x, p.y]);
      }
    }
    if (W.juli) {
      p.orbA += dt * 3.2;
      const lv = W.juli, n = X.juli ? 4 : Math.min(3, 1 + Math.floor(lv / 2)), r = (26 + lv * 3) * A * (X.juli ? 1.2 : 1), dmg = (5 + lv * 3) * (X.juli ? 1.5 : 1);
      p.orbs = [];
      for (let i = 0; i < n; i++) {
        const a = p.orbA + i * Math.PI * 2 / n, ox = p.x + Math.cos(a) * r, oy = p.y + Math.sin(a) * r * 0.7;
        p.orbs.push([Math.round(ox), Math.round(oy)]);
        this.near(ox, oy, 10, e => { if (d2({ x: ox, y: oy }, e) > (e.r + 6) ** 2) return; if ((e.hits.juli || 0) > this.t) return; e.hits.juli = this.t + 0.35; e.juli = this.t; e.juliBy = p.side; this.damage(e, dmg, p, Math.cos(a) * 80, Math.sin(a) * 80); if (X.juli) p.hp = Math.min(p.maxHp, p.hp + 0.35); });
      }
    } else p.orbs = null;
    if (W.romero) {
      if (!p.dog) p.dog = { x: p.x, y: p.y, bite: 0 };
      const lv = W.romero, dog = p.dog, spd = (110 + lv * 12) * (X.romero ? 1.4 : 1);
      // dinámica 5: con el hilo, Romero va primero al gato que arañó la Juli de la pareja
      const marked = p.bond ? this.markedFor(p, dog, 140) : null, tgt = marked || this.nearest(dog, 140);
      const gx = tgt ? tgt.x : p.x + 16, gy = tgt ? tgt.y : p.y + 8;
      const dx = gx - dog.x, dy = gy - dog.y, m = Math.hypot(dx, dy) || 1;
      if (m > 4) { dog.x += dx / m * spd * dt; dog.y += dy / m * spd * dt; dog.face = Math.sign(dx) || 1; }
      if (Math.hypot(p.x - dog.x, p.y - dog.y) > 200) { dog.x = p.x; dog.y = p.y; }
      dog.bite -= dt;
      if (tgt && m < tgt.r + 6 && dog.bite <= 0) {
        dog.bite = (0.55 - lv * 0.04) * (X.romero ? 0.7 : 1);
        let dmg = 14 + lv * 7;
        if (p.bond && tgt.juli > this.t - COMBO.mark && tgt.juliBy !== p.side) { dmg *= COMBO.juli; this.combo("juli", tgt.x, tgt.y); } // dinámica 5
        if (X.romero) { this.near(tgt.x, tgt.y, 22, e => { if (d2(e, tgt) < 22 * 22) this.damage(e, dmg, p, dx / m * 90, dy / m * 90); }); this.ev.push(["boom", Math.round(tgt.x), Math.round(tgt.y), 14]); }
        else this.damage(tgt, dmg, p, dx / m * 60, dy / m * 60);
        this.ev.push(["bite", tgt.x, tgt.y]);
      }
    }
    if (W.mate && this.cd(p, "mate", 3.3 - W.mate * 0.3)) {
      const lv = W.mate, n = X.mate ? 2 : 1, cands = this.targets(p, 120, 2);
      for (let i = 0; i < n; i++) {
        const tgt = cands[i];
        const x = tgt ? tgt.x : p.x + this.rr(-30, 30), y = tgt ? tgt.y : p.y + this.rr(-30, 30);
        this.pools.push({ x, y, r: Math.round((17 + lv * 3) * A * (X.mate ? 1.4 : 1)), life: X.mate ? 4.5 : 3, tick: 0, dmg: (5 + lv * 3) * (X.mate ? 1.3 : 1), own: p.side, slow: !!X.mate });
      }
    }
    if (W.bondi && this.cd(p, "bondi", (9.5 - W.bondi * 1.2) * (X.bondi ? 0.75 : 1))) {
      const lv = W.bondi, dirs = X.bondi ? [1, -1] : [this.rnd() < 0.5 ? 1 : -1];
      dirs.forEach((dir, i) => this.buses.push({ x: p.x - dir * 220, y: p.y + (X.bondi ? (i ? 20 : -20) : this.rr(-18, 18)), dir, life: 1.8, dmg: (40 + lv * 20) * (X.bondi ? 1.4 : 1), own: p.side, hit: new Set(), h: 14 + lv * 2 }));
      this.ev.push(["bus", p.x, p.y]);
    }
    if (W.rodillo && this.cd(p, "rodillo", 1.7 - W.rodillo * 0.15)) {
      const lv = W.rodillo, dmg = (12 + lv * 5) * (X.rodillo ? 1.5 : 1);
      const dirs = X.rodillo ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[p.face, 0]];
      for (const [ux, uy] of dirs) this.proj.push({ k: 1, x: p.x, y: p.y - 4, vx: ux * 190 + (uy ? 0 : 0), vy: uy * 170 + (ux ? this.rr(-20, 20) : 0), dmg, pierce: 999, life: 1.6, own: p.side, back: true, t: 0, hit: new Set() });
    }
    if (W.torta && this.cd(p, "torta", 2.9 - W.torta * 0.3)) {
      const lv = W.torta, cands = this.enemies.filter(e => this.foe(e) && d2(p, e) < 110 * 110);
      const tgt = cands[Math.floor(this.rnd() * cands.length)];
      if (tgt) this.bombs.push({ x0: p.x, y0: p.y, x: tgt.x, y: tgt.y, t: 0, dur: 0.55, r: Math.round((24 + lv * 4) * A), dmg: 22 + lv * 10, own: p.side, cl: !!X.torta });
    }
  }

  ultimate(p) {
    p.ult = 0;
    // si los dos tiran el combo casi juntos, se potencia y los cura
    const other = Object.values(this.players).find(q => q !== p);
    const sync = other && !other.downed && this.t - other.lastUlt < 2.5;
    p.lastUlt = this.t;
    const k = sync ? 1.7 : 1;
    if (sync) { for (const q of this.alive()) q.hp = Math.min(q.maxHp, q.hp + 30); this.ev.push(["sync", Math.round((p.x + other.x) / 2), Math.round((p.y + other.y) / 2)]); }
    if (p.char === "thomas") {
      this.ev.push(["ultT", p.x, p.y]);
      const R = 75 * (sync ? 1.3 : 1);
      this.near(p.x, p.y, R, e => { const dx = e.x - p.x, dy = e.y - p.y, m = Math.hypot(dx, dy) || 1; if (m < R) this.damage(e, 90 * k, p, dx / m * 260, dy / m * 260); });
    } else {
      this.ev.push(["ultR", p.x, p.y]);
      const n = sync ? 14 : 10;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = this.rr(20, 85); this.bombs.push({ x0: p.x, y0: p.y, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, t: -i * 0.05, dur: 0.5, r: 28, dmg: 55 * k, own: p.side }); }
    }
  }

  updateProjectiles(dt) {
    const byside = s => this.players[s];
    for (const b of this.proj) {
      // dinámica 5: medialuna que cruza un charco de mate de la pareja, con el hilo, sale mojada
      if (b.k === 0 && !b.wet && this.bond) for (const pl of this.pools) if (pl.own !== b.own && d2(b, pl) < pl.r * pl.r) { b.wet = true; b.dmg *= COMBO.mate; this.combo("mate", b.x, b.y); break; }
      b.life -= dt;
      if (b.back) { b.t += dt; const p = byside(b.own); if (b.t > 0.55 && p) { const dx = p.x - b.x, dy = p.y - b.y, m = Math.hypot(dx, dy) || 1; b.vx += dx / m * 900 * dt; b.vy += dy / m * 900 * dt; const sp = Math.hypot(b.vx, b.vy); if (sp > 230) { b.vx *= 230 / sp; b.vy *= 230 / sp; } if (m < 10) b.life = 0; if (!b.cleared) { b.hit.clear(); b.cleared = true; } } else { b.vx *= Math.pow(0.35, dt); b.vy *= Math.pow(0.35, dt); } }
      b.x += b.vx * dt; b.y += b.vy * dt;
      this.near(b.x, b.y, 12, e => {
        if (b.pierce <= 0 || b.hit.has(e.id)) return;
        if (d2(b, e) < (e.r + 4) ** 2) { b.hit.add(e.id); b.pierce--; if (b.wet) e.slow = Math.max(e.slow, 1.5); this.damage(e, b.dmg, byside(b.own), b.vx * 0.4, b.vy * 0.4); }
      });
      if (b.pierce <= 0) b.life = 0;
    }
    for (const pl of this.pools) {
      pl.life -= dt; pl.tick -= dt;
      if (pl.tick <= 0) { pl.tick = 0.4; this.near(pl.x, pl.y, pl.r, e => { if (d2(pl, e) < pl.r * pl.r) { this.damage(e, pl.dmg, byside(pl.own)); if (pl.slow) e.slow = 0.6; } }); }
    }
    const extra = [];
    for (const bm of this.bombs) {
      bm.t += dt;
      if (bm.t >= bm.dur && !bm.done) {
        bm.done = true; this.ev.push(["boom", Math.round(bm.x), Math.round(bm.y), bm.r]);
        this.near(bm.x, bm.y, bm.r, e => {
          const dx = e.x - bm.x, dy = e.y - bm.y, m = Math.hypot(dx, dy) || 1; if (m >= bm.r) return;
          // dinámica 5: gato pateado por la pareja que cae en la explosión
          const kicked = this.bond && e.kick > this.t - COMBO.win && e.kickBy !== bm.own; if (kicked) this.combo("torta", e.x, e.y);
          this.damage(e, bm.dmg * (kicked ? COMBO.torta : 1), byside(bm.own), dx / m * 150, dy / m * 150);
        });
        if (bm.cl) for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + this.rr(0, 1); extra.push({ x0: bm.x, y0: bm.y, x: bm.x + Math.cos(a) * bm.r * 1.2, y: bm.y + Math.sin(a) * bm.r * 1.2, t: 0, dur: 0.4, r: Math.round(bm.r * 0.7), dmg: bm.dmg * 0.6, own: bm.own }); }
      }
    }
    this.bombs.push(...extra);
    for (const bus of this.buses) {
      bus.life -= dt; bus.x += bus.dir * 260 * dt;
      this.near(bus.x, bus.y, 24, e => { if (bus.hit.has(e.id)) return; if (Math.abs(e.x - bus.x) < 18 && Math.abs(e.y - bus.y) < bus.h) { bus.hit.add(e.id); this.damage(e, bus.dmg, byside(bus.own), bus.dir * 300, (e.y - bus.y) * 8); } });
    }
    for (const h of this.eproj) {
      h.life -= dt; h.x += h.vx * dt; h.y += h.vy * dt;
      for (const p of this.alive()) if (d2(h, p) < 49) { this.hurt(p, h.dmg); h.life = 0; }
    }
    for (const z of this.zones) {
      z.t += dt;
      if (z.t >= z.dur && !z.done) {
        z.done = true;
        if (z.crate) { // dinámica 3: cajón de la liquidación que cae
          this.ev.push(["boom", Math.round(z.x), Math.round(z.y), z.r]);
          this.near(z.x, z.y, z.r + 8, e => { if (this.foe(e) && d2(e, z) < (z.r + e.r) ** 2) this.damage(e, 60, null, 0, 0, true); });
          const c = this.spawnAt("caja", z.x, z.y); c.liq = true;
        } else this.ev.push(["zone", Math.round(z.x), Math.round(z.y), z.r]);
        for (const p of this.alive()) if (d2(p, z) < z.r * z.r) this.hurt(p, z.dmg);
      }
    }
  }

  updateGems(dt) {
    const alive = this.alive();
    for (const g of this.gems) {
      if (g.got) continue; // dinámica 3: robada por un ladrón en este cuadro
      let tgt = null, bd = Infinity;
      for (const p of alive) { const d = d2(p, g); if (d < bd) { bd = d; tgt = p; } }
      if (!tgt) continue;
      if (g.pull || bd < tgt.magnet * tgt.magnet) {
        g.pull = Math.min(1, g.pull + dt * 3);
        const dx = tgt.x - g.x, dy = tgt.y - g.y, m = Math.hypot(dx, dy) || 1, sp = 60 + g.pull * 260 + (g.vac ? 200 : 0);
        g.x += dx / m * sp * dt; g.y += dy / m * sp * dt;
        if (m < 7) { g.got = true; this.gainXp(g.v); this.ev.push(["gem", tgt.side]); }
      }
    }
    for (const k of this.pickups) {
      for (const p of alive) if (d2(p, k) < 144) {
        k.got = true;
        if (k.k === "alfajor") { p.hp = Math.min(p.maxHp, p.hp + 35); this.ev.push(["heal", p.x, p.y, p.side]); }
        else if (k.k === "moneda") { this.coins += k.n || 1; this.ev.push(["coin", p.x, p.y, p.side]); }
        else if (k.k === "caja") this.openChest(p);
        else if (k.k === "iman") { for (const g of this.gems) { g.pull = 1; g.vac = true; } this.ev.push(["vacuum", Math.round(p.x), Math.round(p.y), p.side]); }
        else if (k.k === "manguera") {
          // a los gatos no les gusta el agua
          this.near(p.x, p.y, 150, e => { if (!this.foe(e)) return; const dx = e.x - p.x, dy = e.y - p.y, m = Math.hypot(dx, dy) || 1; if (m > 150) return; e.slow = 4.5; this.damage(e, 20, p, dx / m * 200, dy / m * 200); });
          this.ev.push(["splash", Math.round(p.x), Math.round(p.y), p.side]);
        }
        break;
      }
    }
  }

  // caja de Roro's: evoluciona un arma completa con su compañera, o sube un arma
  openChest(p) {
    const evo = Object.keys(p.weapons).find(w => p.weapons[w] >= WEAPONS[w].max && !p.evo[w] && p.passives[WEAPONS[w].evo.p]);
    if (evo) { p.evo[evo] = true; this.ev.push(["chest", p.side, "evo", evo, Math.round(p.x), Math.round(p.y)]); return; }
    const up = Object.keys(p.weapons).filter(w => p.weapons[w] < WEAPONS[w].max);
    if (up.length) { const w = up[Math.floor(this.rnd() * up.length)]; p.weapons[w]++; this.ev.push(["chest", p.side, "up", w, Math.round(p.x), Math.round(p.y)]); return; }
    p.hp = p.maxHp; this.coins += 5; this.ev.push(["chest", p.side, "gold", "", Math.round(p.x), Math.round(p.y)]);
  }

  gainXp(v) {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext; this.level++;
      this.xpNext = Math.floor(5 + this.level * 4 + Math.pow(this.level, 1.75));
      this.pendingLevels++;
    }
    if (this.pendingLevels && this.state === "run") this.openLevelUp();
  }

  openLevelUp() {
    this.state = "levelup"; this.pendingLevels--;
    this.offers = {};
    for (const p of Object.values(this.players)) this.offers[p.side] = { opts: this.rollOffers(p), pick: null };
    this.ev.push(["levelup", this.level]);
  }
  rollOffers(p) {
    const pool = [];
    const nW = Object.keys(p.weapons).length, nP = Object.keys(p.passives).length;
    for (const [id, w] of Object.entries(WEAPONS)) { const lv = p.weapons[id] || 0; if (lv < w.max && (lv > 0 || nW < SLOTS)) pool.push({ kind: "w", id, lv: lv + 1, weight: lv ? 3 : 2 }); }
    for (const [id, w] of Object.entries(PASSIVES)) {
      const lv = p.passives[id] || 0; if (lv >= w.max || (!lv && nP >= SLOTS)) continue;
      const pair = EVO_OF[id], wants = pair && p.weapons[pair] && !p.passives[id];
      pool.push({ kind: "p", id, lv: lv + 1, weight: wants ? 2.6 : 1.5 });
    }
    const out = [];
    while (out.length < 3 && pool.length) {
      const tot = pool.reduce((a, o) => a + o.weight, 0); let r = this.rnd() * tot, i = 0;
      while (r > pool[i].weight) { r -= pool[i].weight; i++; }
      out.push(pool.splice(i, 1)[0]);
    }
    if (!out.length) out.push({ kind: "heal", id: "alfajor", lv: 1 });
    return out.map(({ kind, id, lv }) => ({ kind, id, lv }));
  }
  pick(side, idx) {
    const o = this.offers[side]; if (!o || o.pick !== null) return;
    o.pick = idx;
    const p = this.players[side], c = o.opts[idx];
    if (c) {
      if (c.kind === "w") p.weapons[c.id] = c.lv;
      else if (c.kind === "p") { p.passives[c.id] = c.lv; this.applyPassive(p, c.id); }
      else p.hp = p.maxHp;
    }
    if (Object.values(this.offers).every(x => x.pick !== null)) {
      this.offers = {};
      this.state = "run";
      if (this.pendingLevels) this.openLevelUp();
      else if (this.dlgQueue.length) this.openDialog(null);
    }
  }
  applyPassive(p, id) {
    if (id === "guantes") p.dmgMul += 0.15;
    if (id === "zapatillas") p.speed *= 1.08;
    if (id === "termo") p.regen += 0.45;
    if (id === "iman") p.magnet *= 1.25;
    if (id === "amargo") p.cdMul *= 0.93;
    if (id === "abrazo") { p.maxHp += 20; p.hp += 20; }
    if (id === "delantal") p.area += 0.1;
    if (id === "vendas") p.armor *= 0.93;
  }

  cleanup() {
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.proj = this.proj.filter(b => b.life > 0);
    this.pools = this.pools.filter(b => b.life > 0);
    this.bombs = this.bombs.filter(b => !b.done || b.t < b.dur + 0.05);
    this.buses = this.buses.filter(b => b.life > 0);
    this.eproj = this.eproj.filter(b => b.life > 0);
    this.zones = this.zones.filter(z => !z.done);
    this.hz = this.hz.filter(z => !z.done);
    this.gems = this.gems.filter(g => !g.got);
    for (const k of this.pickups) if (EXPIRES[k.k] && this.t - k.t0 > PICK_LIFE) k.got = true;
    this.pickups = this.pickups.filter(k => !k.got);
    if (this.gems.length > GEM_CAP) this.mergeGems();
  }
  // las gemas más viejas se suman a la vecina más cercana: la experiencia es la misma y la foto pesa menos.
  // Cada gema recuerda cuántas representa (c), así se mantiene la regla de siempre: pasadas las 400, las más viejas
  // se cobran solas como experiencia.
  mergeGems() {
    while (this.gems.length > GEM_CAP) {
      const g = this.gems.shift();
      let best = this.gems[0], bd = Infinity;
      for (const o of this.gems) { const d = d2(g, o); if (d < bd) { bd = d; best = o; } }
      best.v += g.v; best.c = (best.c || 1) + (g.c || 1); best.pull = Math.max(best.pull, g.pull); if (g.vac) best.vac = true;
    }
    let n = 0; for (const g of this.gems) n += g.c || 1;
    let xp = 0;
    while (n > GEM_OVER && this.gems.length) {
      const g = this.gems[0], c = g.c || 1, take = Math.min(c, n - GEM_OVER);
      if (take === c) { this.gems.shift(); xp += g.v; }
      else { const v = g.v * take / c; g.v -= v; g.c = c - take; xp += v; }
      n -= take;
    }
    if (xp) this.gainXp(xp);
  }

  /* ---------- modo historia: arranque, diálogos, aliados, objetivos y cámara ---------- */
  // se llama en el primer step (ya con los jugadores): aliados, objetivo, eventos "start" e intro
  begin() {
    this.begun = true;
    const G = this.G;
    if (this.fast) { this.ev.push(["fast"]); for (let i = 0; i < (G.fast.levels || 0); i++) this.gainXp(this.xpNext - this.xp); } // dinámica 4: sube de nivel y elige
    for (const a of G.allies || []) this.addAlly(typeof a === "string" ? a : a.id || a.type, typeof a === "string" ? {} : a);
    if (G.goal && G.goal.kind && G.goal.kind !== "none") this.initGoal(G.goal);
    for (const e of this.atEvents) if (e.at === "start") { e.fired = true; this.doEvent(e); }
    if (G.intro && G.intro.length) this.openDialog(G.intro, { id: "intro" });
  }

  /* diálogo: congela la partida como la subida de nivel. Avanza cuando tocan los dos (adv) o solo a los `auto`
     segundos por línea; si los dos tocan "Saltar" se cierra entero. lines: [{ who, text, cam: [x, y] }] */
  openDialog(lines, opts = {}) {
    if (lines && lines.length) this.dlgQueue.push({ id: opts.id || "d" + ++this.dlgN, lines, i: 0, t: 0, auto: opts.auto || 6, ready: {}, then: opts.then || null });
    if (this.dlg || !this.dlgQueue.length) return;
    if (this.state !== "run" && !(opts.force && this.state !== "over")) return; // si están eligiendo mejora, espera
    this.dlg = this.dlgQueue.shift(); this.state = "dialog";
    this.ev.push(["dialog", this.dlg.id]);
  }
  adv(side, skip = false) {
    const d = this.dlg; if (this.state !== "dialog" || !d || !this.players[side]) return;
    d.ready[side] = skip ? 2 : 1;
    this.checkDialog();
  }
  checkDialog() {
    const d = this.dlg; if (!d) return;
    const sides = Object.keys(this.players);
    if (!sides.every(s => d.ready[s])) return;
    if (sides.every(s => d.ready[s] === 2)) this.closeDialog(); else this.nextLine();
  }
  nextLine() { const d = this.dlg; d.i++; d.t = 0; d.ready = {}; if (d.i >= d.lines.length) this.closeDialog(); }
  closeDialog() {
    const d = this.dlg; this.dlg = null; this.state = "run";
    this.ev.push(["dialogend", d.id]);
    if (d.then === "win") { this.state = "win"; this.ev.push(["win"]); return; }
    if (this.pendingLevels) this.openLevelUp();
    else if (this.dlgQueue.length) this.openDialog(null);
  }
  dialogTick(dt) { const d = this.dlg; if (!d) { this.state = "run"; return; } d.t += dt; if (d.t >= d.auto) this.nextLine(); }

  /* aliados: lista A de la foto, mismo formato plano que E */
  addAlly(type, o = {}) {
    const base = ALLY[type]; if (!base) return null;
    const cfg = { ...base, ...o };
    const ps = this.alive(), lead = ps[0] || Object.values(this.players)[0];
    const x = o.x !== undefined ? o.x : lead ? lead.x + this.rr(-20, 20) : MAP / 2, y = o.y !== undefined ? o.y : lead ? lead.y + this.rr(10, 24) : MAP / 2;
    const a = { id: this.nextId++, type, cfg, x, y, hp: cfg.hp, maxHp: cfg.hp, r: cfg.r, inv: 1, flash: 0, cd: 1, st: 0, stT: 0, ax: 0, ay: 0, face: 1, down: false, downT: 0, hit: new Set() };
    this.allies.push(a);
    this.ev.push(["ally", a.id, type]);
    return a;
  }
  hurtAlly(a, dmg) {
    a.hp -= dmg; a.inv = 0.6; a.flash = 0.12;
    if (a.hp <= 0) { a.hp = 0; a.down = true; a.downT = 10; a.st = 0; this.ev.push(["allydown", a.id, Math.round(a.x), Math.round(a.y)]); }
  }
  updateAllies(dt) {
    const alive = this.alive(), [bx0, by0, bx1, by1] = this.cfg.b, g = this.goal;
    for (const a of this.allies) {
      const C = a.cfg;
      a.inv = Math.max(0, a.inv - dt); a.flash = Math.max(0, a.flash - dt); a.cd -= dt;
      if (a.down) {
        // los que no son el objetivo se levantan solos a los 10 s
        const key = g && (g.k === "escort" || g.k === "protect") && g.ally === a;
        if (!key && (a.downT -= dt) <= 0) { a.down = false; a.hp = a.maxHp * 0.5; a.inv = 2; this.ev.push(["allyup", a.id, Math.round(a.x), Math.round(a.y)]); }
        continue;
      }
      let lead = null, ld = Infinity; for (const p of alive) { const d = d2(p, a); if (d < ld) { ld = d; lead = p; } }
      // hacia dónde camina: escolta (si hay alguien cerca va al destino), si no sigue al jugador más cercano
      let gx = a.x, gy = a.y, spd = C.spd;
      if (g && g.k === "escort" && g.ally === a) {
        if (lead && ld < 70 * 70) { gx = g.to[0]; gy = g.to[1]; } else if (lead) { gx = lead.x; gy = lead.y; spd *= 0.6; }
      } else if (lead && ld > 28 * 28) { gx = lead.x; gy = lead.y; }
      if (C.act === "ram") {
        if (a.st === 1) { spd = 0; if ((a.stT -= dt) <= 0) { a.st = 2; a.stT = 0.45; a.hit.clear(); } }
        else if (a.st === 2) {
          a.x += a.ax * 260 * dt; a.y += a.ay * 260 * dt; spd = 0;
          this.near(a.x, a.y, 16, e => { if (a.hit.has(e.id) || !this.foe(e) || d2(a, e) > (e.r + a.r + 4) ** 2) return; a.hit.add(e.id); this.damage(e, C.dmg, null, a.ax * C.kb, a.ay * C.kb); });
          if ((a.stT -= dt) <= 0) { a.st = 0; a.cd = C.cd; }
        } else if (a.cd <= 0) { const t = this.nearest(a, C.reach); if (t) { const m = Math.hypot(t.x - a.x, t.y - a.y) || 1; a.ax = (t.x - a.x) / m; a.ay = (t.y - a.y) / m; a.st = 1; a.stT = 0.4; this.ev.push(["charge", Math.round(a.x), Math.round(a.y)]); } }
      } else if (C.act === "area") {
        if (a.st === 1) { spd = 0; if ((a.stT -= dt) <= 0) { a.st = 0; a.cd = C.cd; this.ev.push(["boom", Math.round(a.x), Math.round(a.y), C.reach]); this.near(a.x, a.y, C.reach, e => { const dx = e.x - a.x, dy = e.y - a.y, m = Math.hypot(dx, dy) || 1; if (m < C.reach) this.damage(e, C.dmg, null, dx / m * C.kb, dy / m * C.kb); }); } }
        else if (a.cd <= 0 && this.nearest(a, C.reach * 0.8)) { a.st = 1; a.stT = 0.5; }
      } else if (C.dmg > 0 && a.cd <= 0) {
        // pataditas a lo que se acerca
        const t = this.nearest(a, C.reach + 10);
        if (t && d2(a, t) < (C.reach + t.r) ** 2) { a.cd = C.cd; const dx = t.x - a.x, dy = t.y - a.y, m = Math.hypot(dx, dy) || 1; this.damage(t, C.dmg, null, dx / m * C.kb, dy / m * C.kb); this.ev.push(["slash", Math.round(a.x), Math.round(a.y), dx < 0 ? -1 : 1, C.reach, 0]); }
      }
      const dx = gx - a.x, dy = gy - a.y, m = Math.hypot(dx, dy);
      if (spd > 0 && m > 2) { const k = Math.min(m, spd * dt) / m; a.x += dx * k; a.y += dy * k; if (Math.abs(dx) > 1) a.face = Math.sign(dx); }
      a.x = clamp(a.x, bx0, bx1); a.y = clamp(a.y, by0, by1);
    }
  }

  /* objetivos genéricos (GOALS). Su estado viaja en la foto como `goal`. Al cumplirse se gana (con epílogo si hay);
     defend/protect/escort se pierden si cae lo que se cuida; track con dur se pierde si se acaba el tiempo. */
  initGoal(def) {
    const k = def.kind || "none", b = this.cfg.b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    const g = this.goal = { k, def, p: 0, n: 0, of: def.n || 0, t0: this.t, dur: def.dur || this.G.dur || 0, lb: def.label || "" };
    if (k === "defend") { const T = { x: def.x !== undefined ? def.x : cx, y: def.y !== undefined ? def.y : cy, r: def.r || 22, hp: def.hp || 300, maxHp: def.hp || 300, inv: 0, flash: 0, tgt: true }; g.target = T; this.lures.push(T); }
    if (k === "protect" || k === "escort") {
      g.ally = (def.ally && this.allies.find(a => a.type === def.ally)) || (def.ally ? this.addAlly(def.ally, def.allyOpts || {}) : this.allies[0]) || null;
      if (k === "protect" && g.ally) this.lures.push(g.ally);
    }
    if (k === "escort" || k === "reach") { g.to = def.to || [cx, b[1] + 60]; g.r = def.r || 24; g.d0 = Math.max(1, this.goalDist()); }
    if (k === "trains") g.of = def.n || 3;
    if (k === "track") {
      g.of = def.n || (def.pts ? def.pts.length : 3);
      g.pts = def.pts ? def.pts.map(q => q.slice()) : Array.from({ length: g.of }, () => { const q = this.ringPos(this.rr(220, 380)); return [Math.round(clamp(q.x, b[0] + 30, b[2] - 30)), Math.round(clamp(q.y, b[1] + 30, b[3] - 30))]; });
    }
    if (k === "boss") { this.G = { ...this.G, win: { kill: def.type } }; this.bosses.splice(this.bossIdx, 0, { t: this.t + (def.t || 3), type: def.type, dist: def.dist || 160, calm: 3, phase: def.phase }); }
    this.ev.push(["goal", k]);
  }
  goalDist() {
    const g = this.goal;
    if (g.k === "escort") return g.ally ? Math.hypot(g.ally.x - g.to[0], g.ally.y - g.to[1]) : 0;
    let m = Infinity; for (const p of this.alive()) m = Math.min(m, Math.hypot(p.x - g.to[0], p.y - g.to[1]));
    return m === Infinity ? g.d0 || 0 : m;
  }
  updateGoal(dt) {
    const g = this.goal; if (g.done) return;
    const el = this.t - g.t0, T = g.target;
    if (T) { T.inv = Math.max(0, T.inv - dt); T.flash = Math.max(0, T.flash - dt); }
    switch (g.k) {
      case "survive": g.p = g.dur ? el / g.dur : 0; if (g.dur && el >= g.dur) return this.goalDone(); break;
      case "defend": g.p = g.dur ? el / g.dur : 0; if (T.hp <= 0) return this.goalFail(); if (g.dur && el >= g.dur) return this.goalDone(); break;
      case "protect": g.p = g.dur ? el / g.dur : 0; if (!g.ally || g.ally.down) return this.goalFail(); if (g.dur && el >= g.dur) return this.goalDone(); break;
      case "escort": case "reach": {
        if (g.k === "escort" && (!g.ally || g.ally.down)) return this.goalFail();
        const d = this.goalDist(); g.p = Math.max(g.p, 1 - d / g.d0);
        if (d < g.r) return this.goalDone();
        break;
      }
      case "trains": g.p = g.n / g.of; if (g.n >= g.of) return this.goalDone(); break;
      case "track":
        for (const p of this.alive()) for (let i = g.pts.length - 1; i >= 0; i--) { const q = g.pts[i]; if ((p.x - q[0]) ** 2 + (p.y - q[1]) ** 2 < 16 * 16) { g.pts.splice(i, 1); g.n++; this.ev.push(["track", q[0], q[1], p.side]); } }
        g.p = g.n / g.of;
        if (g.n >= g.of) return this.goalDone();
        if (g.dur && el >= g.dur) return this.goalFail();
        break;
      case "boss": { const B = this.bossRef && this.bossRef.type === g.def.type ? this.bossRef : null; if (B) g.p = Math.max(g.p, 1 - B.hp / B.maxHp); break; }
    }
    // hitos del objetivo: eventos { at: "goal50", ... } cuando el progreso pasa ese porcentaje
    for (const e of this.atEvents) if (!e.fired && /^goal\d+$/.test(e.at) && g.p * 100 >= +e.at.slice(4)) { e.fired = true; this.doEvent(e); }
  }
  goalDone() { const g = this.goal; g.done = true; g.p = 1; this.ev.push(["goaldone", g.k]); this.win(); }
  goalFail() { const g = this.goal; g.done = true; this.ev.push(["goalfail", g.k]); this.lose(); }
  // a dónde mira la cámara: línea de diálogo con cam, evento cam (punto o aliado) o null (sigue al jugador)
  camPos() {
    const line = this.dlg && this.dlg.lines[this.dlg.i];
    if (line && line.cam) return [Math.round(line.cam[0]), Math.round(line.cam[1])];
    const c = this.cam; if (!c) return null;
    if (c.until !== null && c.until !== undefined && this.t > c.until) { this.cam = null; return null; }
    if (c.ally) { const a = this.allies.find(q => q.type === c.ally); return a ? [Math.round(a.x), Math.round(a.y)] : null; }
    return [Math.round(c.x), Math.round(c.y)];
  }

  /* ---------- foto del estado para dibujar (local o por red) ---------- */
  snapshot() {
    const E = [];
    for (const e of this.enemies) {
      const tele = (e.st === 1 && (e.type === "saltarin" || e.type === "escupidor" || e.type === "luz" || e.type === "sparring"));
      const f = (e.flash > 0 ? F_FLASH : 0) | (tele ? F_TELE : 0) | (e.elite ? F_ELITE : 0) | (e.st === 2 ? F_RUSH : 0) | (e.slow > 0 ? F_WET : 0) | (e.stun ? F_STUN : 0) | (e.bag ? F_BAG : 0);
      E.push(e.id, ENEMY_ID[e.type], Math.round(e.x), Math.round(e.y), f, tele || e.st === 2 ? Math.round(Math.atan2(e.ay, e.ax) * 10) : 0);
    }
    const B = []; for (const b of this.proj) B.push(b.k, Math.round(b.x), Math.round(b.y), Math.round(Math.atan2(b.vy, b.vx) * 10));
    const H = []; for (const h of this.eproj) H.push(Math.round(h.x), Math.round(h.y), h.k);
    const G = []; for (const g of this.gems) G.push(Math.round(g.x), Math.round(g.y), Math.max(1, Math.round(g.v)));
    const K = this.pickups.map(k => EXPIRES[k.k] && this.t - k.t0 > PICK_LIFE - 5 ? [PICKS.indexOf(k.k), Math.round(k.x), Math.round(k.y), 1] : [PICKS.indexOf(k.k), Math.round(k.x), Math.round(k.y)]);
    const U = this.pools.map(p => [Math.round(p.x), Math.round(p.y), p.r, Math.round(p.life * 10), p.slow ? 1 : 0]);
    const M = this.bombs.map(b => [Math.round(b.x0), Math.round(b.y0), Math.round(b.x), Math.round(b.y), Math.round(Math.min(1, Math.max(0, b.t / b.dur)) * 100), b.done ? 1 : 0, b.r]);
    const Bu = this.buses.map(b => [Math.round(b.x), Math.round(b.y), b.dir]);
    const Z = this.zones.map(z => [Math.round(z.x), Math.round(z.y), z.r, Math.round(z.t / z.dur * 100)]);
    const Hz = this.hz.map(z => [HAZ_ID.indexOf(z.k), Math.round(z.y), z.h, Math.round(z.x), z.dir, z.warn > 0 ? Math.round(z.warn * 10) : 0, z.len]);
    const ob = this.obj ? [Math.round(this.obj.x), Math.round(this.obj.y), Math.round(this.obj.prog * 100), Math.ceil(this.obj.left)] : null;
    const P = {};
    for (const p of Object.values(this.players)) P[p.side] = {
      c: p.char, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, f: p.face, m: p.moving, hp: Math.round(p.hp), mh: p.maxHp, d: p.downed ? 1 : 0, rv: Math.round(p.reviveT * 100) / 100, u: Math.round(p.ult * 100) / 100, i: p.inv > 0 ? 1 : 0, sp: p.speed,
      o: p.orbs || null, dg: p.dog ? [Math.round(p.dog.x), Math.round(p.dog.y), p.dog.face || 1] : null, w: p.weapons, pa: p.passives, e: p.evo, k: p.kills, dc: Math.round(p.dashCd * 10) / 10
    };
    const boss = this.bossRef && this.bossRef.hp > 0 ? { n: this.bossRef.type, hp: this.bossRef.hp / this.bossRef.maxHp } : null;
    // modo historia (en el arcade van vacíos o null: un invitado viejo los ignora)
    const A = [];
    for (const a of this.allies) {
      const tele = a.st === 1, f = (a.flash > 0 ? F_FLASH : 0) | (tele ? F_TELE : 0) | (a.st === 2 ? F_RUSH : 0) | (a.face < 0 ? F_LEFT : 0) | (a.down ? F_DOWN : 0);
      A.push(a.id, ENEMY_ID[a.type], Math.round(a.x), Math.round(a.y), f, tele || a.st === 2 ? Math.round(Math.atan2(a.ay, a.ax) * 10) : 0);
    }
    const d = this.dlg, line = d && d.lines[d.i];
    const dlg = d ? { id: d.id, i: d.i, n: d.lines.length, who: line.who || "", text: line.text || "", r: d.ready, t: Math.round(d.t * 10) / 10, a: d.auto } : null;
    const g = this.goal;
    const goal = g && g.k !== "none" ? {
      k: g.k, p: Math.round(Math.min(1, g.p) * 100), lb: g.lb, n: g.n, of: g.of,
      l: g.dur && (g.k === "survive" || g.k === "defend" || g.k === "protect" || g.k === "track") ? Math.max(0, Math.ceil(g.dur - (this.t - g.t0))) : null,
      hp: g.target ? Math.round(g.target.hp / g.target.maxHp * 100) : g.ally ? Math.round(g.ally.hp / g.ally.maxHp * 100) : null,
      x: g.target ? Math.round(g.target.x) : null, y: g.target ? Math.round(g.target.y) : null, r: g.target ? g.target.r : g.r || null, fl: g.target && g.target.flash > 0 ? 1 : 0,
      to: g.to || null, a: g.ally ? g.ally.id : null, pts: g.pts ? g.pts.slice() : null, ok: g.done ? 1 : 0
    } : null;
    const ev = this.ev; this.ev = [];
    return { t: Math.round(this.t * 100) / 100, st: this.state, lv: this.level, xp: Math.round(this.xp * 100) / 100, xn: this.xpNext, kl: this.kills, co: this.coins, E, B, H, G, K, U, M, Bu, Z, Hz, ob, tg: this.bond ? 1 : 0, P, boss, of: this.offers, ev, map: this.map, A, dlg, goal, cam: this.camPos(), cap: this.G.chapter || null,
      md: this.mid ? [MID_IDS.indexOf(this.mid.k), Math.max(0, Math.ceil(this.mid.end - this.t)), this.stats.mid] : null }; // dinámica 3
  }
}
