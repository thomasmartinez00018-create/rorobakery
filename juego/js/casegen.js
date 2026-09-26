// Generación determinística de casos: el mismo seed produce el mismo caso en los dos dispositivos.

export function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const TALLES = [36, 38, 40, 42, 44];
export const VEHS = ["MOTO", "BICI", "REMIS", "TREN", "BONDI"];
export const VEH_TXT = { MOTO: "moto", BICI: "bici", REMIS: "remís", TREN: "tren", BONDI: "bondi" };
export const MANOS = ["izquierda", "derecha"];
export const ESTATS = ["alta", "baja"];

export const PLACES = [
  { k: "casa", t: "El caso del sillón verde", place: "la casa de Thomas y Rocío", barrio: "Malvinas Argentinas", obj: "el último paquete de galletitas escondido en la alacena" },
  { k: "abuela", t: "La pastafrola de la abuela", place: "la casa de la abuela", barrio: "San Miguel", obj: "la pastafrola de membrillo recién horneada" },
  { k: "heladeria", t: "Frío en Balbín y Paunero", place: "la heladería de Balbín y Paunero", barrio: "San Miguel", obj: "el balde entero de dulce de leche granizado" },
  { k: "observatorio", t: "Noche sin luna", place: "el Observatorio de San Miguel", barrio: "San Miguel", obj: "la lente del telescopio de 1898" },
  { k: "estacion", t: "Último tren a Los Polvorines", place: "la estación Los Polvorines del Belgrano Norte", barrio: "Los Polvorines", obj: "el reloj del andén" },
  { k: "rotonda", t: "Vueltas en la rotonda", place: "la rotonda de Grand Bourg", barrio: "Grand Bourg", obj: "el cartel de la parada del 315" },
  { k: "plaza", t: "Feria en Plaza Mitre", place: "la feria artesanal de Plaza Mitre", barrio: "San Miguel", obj: "el mate de alpaca del puesto más viejo" },
  { k: "cancha", t: "La bandera del Trueno", place: "la cancha del Trueno Verde", barrio: "Los Polvorines", obj: "la bandera histórica del ascenso del 84" },
  { k: "mall", t: "Función cancelada", place: "el cine del Tortugas Open Mall", barrio: "Tortuguitas", obj: "el rollo de la película del estreno" },
  { k: "gym", t: "Nocaut en el Team Bielli", place: "el gimnasio del Team Bielli", barrio: "Los Polvorines", obj: "el cinturón de campeón que cuelga arriba del ring" },
  { k: "bakery", t: "La torta lila", place: "Roro's Bakery, la pastelería de Rocío", barrio: "Malvinas Argentinas", obj: "la torta lila de un pedido de cumpleaños" }
];

const NAMES = ["Nené Acosta", "Chino Ferreyra", "Marta Ibarra", "Beto Lucero", "Yami Godoy", "Rulo Sánchez", "Tere Molina", "Cacho Duarte", "Vero Paz", "Tano Russo", "Pili Arce", "Lalo Benítez", "Mirta Quiroga", "Fede Aguirre", "Gaby Romano", "Nico Leiva", "Coca Villalba", "Pato Giménez"];
const OFICIOS = ["colectivero de la 315", "kiosquera de la estación", "verdulero de Grand Bourg", "profe de la UNGS", "heladera", "remisero", "artesana de la feria", "portero de edificio", "astrónoma aficionada", "hincha del Trueno Verde", "vendedor de chipá", "peluquera de Los Polvorines", "mecánico de Ruta 8", "panadera", "delivery en moto", "jubilado del ajedrez"];
const BIRDS = ["Hornero", "Zorzal", "Tero", "Chimango", "Benteveo", "Calandria", "Cardenal", "Carpintero", "Chingolo", "Tijereta", "Churrinche", "Pirincho", "Picaflor", "Carancho"];
const WITS = ["Doña Porota", "El Gringo", "Marga, la del kiosco", "Rulo", "Sergio, el portero", "Tati", "Don Aldo", "La Colorada", "Cacho", "Mirta", "El chino de la verdu", "Norma"];
const REL = ["Estaba a dos metros, bajo el farol. Relato consistente.", "Custodio del lugar. Hay una cámara que confirma lo que dice.", "Llamó al 911 en el momento. No cambió ni una coma.", "Enfermera de guardia, sobria, a buena distancia.", "Paseaba al perro justo enfrente, con buena luz.", "Esperaba el 176 en la parada de enfrente. Vista perfecta."];
const UNREL = ["Miope. Esa noche no tenía los anteojos.", "Salía del bingo de Belgrano y Paunero con dos fernets encima.", "Miró desde un tercer piso con la persiana a medio bajar.", "Primo de uno de los sospechosos. Ya mintió una vez.", "Declaró tres días después y cambió la versión dos veces.", "Estaba mirando el celular. Admite que \"vio de reojo\"."];
const EXTRA = ["Llevaba una campera inflable, de esas que hacen ruido.", "Tenía olor a chipá recién hecho.", "Silbaba un tema de la Mona Jiménez.", "Se paró a acariciar a un gato antes de irse.", "Miró el reloj dos veces, como si lo esperaran."];
const STMT = {
  izquierda: ["Forzó la cerradura con la mano izquierda.", "Agarró el botín con la izquierda y salió rajando."],
  derecha: ["Forzó la cerradura con la mano derecha.", "Firmó la planilla de entrada con la derecha, lo vi clarito."],
  alta: ["Tuvo que agacharse para pasar por la puerta.", "Alcanzó el estante de arriba sin estirarse."],
  baja: ["No llegaba al picaporte de la reja, tuvo que saltar.", "Se subió a un cajón para alcanzar la ventana."]
};
const VERBS = ["HUYO EN", "ESCAPO EN", "SE FUE EN", "RAJO EN", "SE TOMO EL"];
const VIAS = ["POR RUTA OCHO", "POR LA ROTONDA", "POR LA PLAZA", "POR EL PUENTE", "POR LA DOSCIENTOS DOS"];

export const PAT = ["círculos", "zigzag", "rombos", "rayas"];
export const HEEL = ["cuadrado", "redondo", "partido"];
export const LOGO = ["estrella", "media luna", "sin logo"];
export const SHAPES = ["círculo", "triángulo", "cuadrado", "rombo"];
export const FILLS = ["lleno", "vacío"];
export const MARKS = ["punto", "raya", "cruz", "nada"];

const SKINS = ["#f1c7a5", "#e3b08a", "#c98d62", "#9c6644", "#f6d6bd"];
const HAIRS = ["corto", "rulos", "largo", "rodete", "pelado", "gorra"];
const HAIRC = ["#1b1411", "#3b2618", "#6b4a2b", "#b98a4d", "#8d8d8d", "#d8d2c8"];
const SHIRTS = ["#c0392b", "#2e86c1", "#27ae60", "#f39c12", "#8e44ad", "#16a085", "#d35400", "#34495e", "#e84393", "#f1c40f"];
const PANTS = ["#2c3e50", "#4b4b4b", "#1f3a5f", "#6d4c41", "#222222", "#7f8c8d"];

export function params(level) {
  const L = Math.max(1, level | 0);
  return {
    time: Math.max(300, 480 - (L - 1) * 20),
    nSus: L < 3 ? 5 : L < 6 ? 6 : L < 9 ? 7 : 8,
    nCat: Math.min(12, 5 + L),
    nNear: Math.min(5, 2 + Math.floor(L / 2)),
    nDecoy: Math.min(10, 3 + L),
    extraWit: L >= 8 ? 2 : L >= 4 ? 1 : 0,
    longPhrase: L >= 4,
    pen: 20 + Math.floor((L - 1) / 3) * 5,
    penAcc: 40 + L * 5,
    penJuli: 15,
    penRomero: 15,
    romero: L >= 2,
    villain: L % 3 === 0
  };
}

export function genCase(seed, level) {
  const r = mulberry(seed ^ 0x5bd1e995);
  const pk = a => a[Math.floor(r() * a.length)];
  const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P = params(level);

  const place = level === 1 ? PLACES[0] : pk(PLACES.slice(1).concat(level % 4 === 0 ? [PLACES[0]] : []));

  // Sospechosos: exactamente uno cumple las cuatro pistas y ninguna mitad alcanza sola.
  let sus, cul;
  for (let k = 0; k < 5000; k++) {
    const ns = sh(NAMES).slice(0, P.nSus), os = sh(OFICIOS).slice(0, P.nSus);
    sus = ns.map((n, i) => ({ name: n, oficio: os[i], talle: pk(TALLES), veh: pk(VEHS), mano: pk(MANOS), estat: pk(ESTATS) }));
    cul = Math.floor(r() * P.nSus);
    const c = sus[cul], m = f => sus.filter(f).length;
    if (m(s => s.talle === c.talle && s.veh === c.veh && s.mano === c.mano && s.estat === c.estat) === 1
      && m(s => s.veh === c.veh && s.mano === c.mano) >= 2
      && m(s => s.talle === c.talle && s.estat === c.estat) >= 2
      && m(s => s.talle === c.talle) >= 2 && m(s => s.estat === c.estat) >= 2) break;
  }
  sus.forEach(s => {
    s.look = {
      skin: pk(SKINS), hair: pk(HAIRS), hairColor: pk(HAIRC), shirt: pk(SHIRTS), pants: pk(PANTS),
      height: s.estat === "alta" ? 1.08 + r() * 0.07 : 0.85 + r() * 0.06
    };
  });
  const c = sus[cul];

  // Catálogo de suelas
  const skey = s => s.rows.join() + "|" + s.heel + "|" + s.logo;
  const rsole = () => ({ rows: [pk(PAT), pk(PAT), pk(PAT)], heel: pk(HEEL), logo: pk(LOGO) });
  const target = rsole(), seen = new Set([skey(target)]);
  const cat = [{ rows: target.rows.slice(), heel: target.heel, logo: target.logo, talle: c.talle, ok: true }];
  const otherT = TALLES.filter(t => t !== c.talle);
  let g = 0;
  while (cat.length < 1 + P.nNear && g++ < 300) {
    const n = { rows: target.rows.slice(), heel: target.heel, logo: target.logo };
    const f = Math.floor(r() * 5);
    if (f < 3) n.rows[f] = pk(PAT.filter(p => p !== n.rows[f]));
    else if (f === 3) n.heel = pk(HEEL.filter(h => h !== n.heel));
    else n.logo = pk(LOGO.filter(l => l !== n.logo));
    if (seen.has(skey(n))) continue;
    seen.add(skey(n)); cat.push(Object.assign(n, { talle: pk(otherT), ok: false }));
  }
  while (cat.length < P.nCat && g++ < 1500) {
    const n = rsole(); if (seen.has(skey(n))) continue;
    seen.add(skey(n)); cat.push(Object.assign(n, { talle: pk(TALLES), ok: false }));
  }
  const birds = sh(BIRDS);
  const catalog = sh(cat).map((s, i) => Object.assign(s, { model: birds[i % birds.length] }));

  // Mensaje cifrado
  const phrase = pk(VERBS) + " " + c.veh + (P.longPhrase ? " " + pk(VIAS) : "");
  const letters = [...new Set(phrase.replace(/ /g, "").split(""))];
  const decoys = sh("ABCDEFGHIJLMNOPRSTUVYZ".split("").filter(l => !letters.includes(l))).slice(0, P.nDecoy);
  const allG = [];
  SHAPES.forEach(s => FILLS.forEach(f => MARKS.forEach(m => allG.push({ shape: s, fill: f, mark: m }))));
  const gl = sh(allG), map = {};
  letters.concat(decoys).forEach((l, i) => { map[l] = gl[i % gl.length]; });
  const keyList = sh(Object.keys(map)).map(l => ({ l, g: map[l] }));
  const msg = phrase.split(" ").map(w => w.split("").map(l => map[l]));

  // Testigos
  const wn = sh(WITS), rel = sh(REL), unrel = sh(UNREL), extra = sh(EXTRA);
  const oppM = c.mano === "izquierda" ? "derecha" : "izquierda", oppE = c.estat === "alta" ? "baja" : "alta";
  let items = [
    { text: pk(STMT[c.mano]), ok: true }, { text: pk(STMT[oppM]), ok: false },
    { text: pk(STMT[c.estat]), ok: true }, { text: pk(STMT[oppE]), ok: false }
  ];
  for (let i = 0; i < P.extraWit; i++) items.push({ text: extra[i], ok: true, extra: true });
  let ri = 0, ui = 0;
  items = sh(items).map((w, i) => Object.assign(w, { name: wn[i], note: w.ok ? rel[ri++ % rel.length] : unrel[ui++ % unrel.length] }));
  if (place.k === "abuela") items.push({ name: "Luz, la gata de la abuela", text: "(Te mira fijo, bosteza y se va.)", ok: true, extra: true, note: "Testigo hostil. No aporta nada. Ni lo intentes." });
  const wit = items;
  const registry = sh(items);

  // ---- qué pruebas tiene este caso y qué pista da cada una ----
  const nSt = level >= 6 ? 4 : 3;
  let stations = null;
  for (let k = 0; k < 600 && !stations; k++) {
    const pick = sh(Object.keys(STATION_TYPES)).slice(0, nSt);
    if (pick.includes("cifra") && pick.includes("mapa")) continue;
    const fixed = pick.flatMap(t => STATION_TYPES[t].fixed || []);
    if (new Set(fixed).size !== fixed.length) continue;
    const rest = ["talle", "veh", "mano", "estat"].filter(t => !fixed.includes(t));
    const flex = pick.filter(t => STATION_TYPES[t].flex);
    const mins = flex.reduce((a, t) => a + STATION_TYPES[t].flex[0], 0), maxs = flex.reduce((a, t) => a + STATION_TYPES[t].flex[1], 0);
    if (rest.length < mins || rest.length > maxs) continue;
    const pool = sh(rest), assign = {};
    flex.forEach(t => { assign[t] = pool.splice(0, STATION_TYPES[t].flex[0]); });
    while (pool.length) { const t = flex.find(f => assign[f].length < STATION_TYPES[f].flex[1]); assign[t].push(pool.shift()); }
    stations = pick.map(t => ({ k: t, traits: STATION_TYPES[t].fixed || assign[t] }));
  }

  // la alarma
  const nW = 4 + Math.floor(r() * 3);
  const wires = Array.from({ length: nW }, () => pk(WIRE_COLORS));
  const serial = String(100 + Math.floor(r() * 900));
  const led = r() < 0.5;
  const alarm = { wires, serial, led, cut: solveAlarm(wires, serial, led) };

  // el recorrido
  const cells = sh([...Array(25).keys()]);
  const lands = sh(LANDMARKS).slice(0, 7).map((name, i) => ({ name, cell: cells[i] }));
  let route = null;
  for (let k = 0; k < 400 && !route; k++) {
    const from = pk(lands);
    let row = Math.floor(from.cell / 5), col = from.cell % 5, prev = null;
    const moves = [], nMoves = Math.min(6, 3 + Math.floor(level / 3));
    for (let m = 0; m < nMoves; m++) {
      const opts = DIRS.filter(d => d !== OPP[prev] && d !== prev).map(d => {
        const st = 1 + Math.floor(r() * 3), [dr, dc] = DELTA[d];
        return { d, st, nr: row + dr * st, nc: col + dc * st };
      }).filter(o => o.nr >= 0 && o.nr < 5 && o.nc >= 0 && o.nc < 5);
      if (!opts.length) break;
      const o = pk(opts); moves.push({ d: o.d, st: o.st }); row = o.nr; col = o.nc; prev = o.d;
    }
    const target = row * 5 + col;
    if (moves.length === nMoves && target !== from.cell) route = { from: from.name, moves, target };
  }
  const route2 = { lands, ...route };

  // antes y después
  const fotoTrait = (stations.find(st => st.k === "fotos") || { traits: [pk(["talle", "mano", "estat", "veh"])] }).traits[0];
  const dropped = fotoItem(fotoTrait, c);
  const before = [];
  const seenF = new Set();
  while (before.length < 12) {
    const it = { t: pk(FOTO_ITEMS), c: pk(FOTO_COLORS) };
    if (seenF.has(it.t + it.c)) continue; seenF.add(it.t + it.c); before.push(it);
  }
  const changed = Math.floor(r() * 12);
  const newColor = pk(FOTO_COLORS.filter(col => !(before[changed].t === dropped && before[changed].c === col)));
  // el objeto que dejó el ladrón también aparece en otro lado, así no se delata solo
  const twin = (changed + 1 + Math.floor(r() * 11)) % 12;
  before[twin] = { t: dropped, c: pk(FOTO_COLORS.filter(col => col !== newColor)) };
  const after = before.map(x => ({ ...x }));
  after[changed] = { t: dropped, c: newColor };
  const fotos = { before, after, changed, trait: fotoTrait };

  // eventos del caso, repartidos en el tiempo
  const evs = [];
  if (P.romero && r() < 0.75) evs.push("romero");
  if (level >= 2 && r() < 0.45) evs.push("apagon");
  if (P.villain || (level >= 4 && r() < 0.35)) evs.push("sabotaje");
  if (r() < 0.7) evs.push("quiz");
  const events = {};
  sh(evs).forEach((e, i) => { events[e] = 0.14 + i * 0.17 + r() * 0.08; });
  const quiz = (() => { const q = pk(QUIZ); const opts = sh(q.o.map((t, i) => ({ t, ok: i === 0 }))); return { q: q.q, opts: opts.map(o => o.t), ok: opts.findIndex(o => o.ok) }; })();

  return { seed, level, P, place, sus, cul, c, catalog, phrase, keyList, msg, wit, registry, stations, alarm, map: route2, fotos, events, quiz, romeroFrac: events.romero || 0.4, rain: r() < (place.k === "cancha" ? 0.55 : 0.33) };
}

/* ---------- pruebas nuevas ---------- */
export const STATION_TYPES = {
  suela: { fixed: ["talle"] }, cifra: { fixed: ["veh"] }, mapa: { fixed: ["veh"] },
  testigos: { fixed: ["mano", "estat"] }, alarma: { flex: [1, 2] }, fotos: { flex: [1, 1] }
};
export const STATION_NAME = {
  suela: ["Huella", "La huella"], cifra: ["Mensaje", "El mensaje"], testigos: ["Testigos", "Los testigos"],
  alarma: ["Alarma", "La alarma"], mapa: ["Recorrido", "El recorrido"], fotos: ["Fotos", "Antes y después"]
};
export const WIRE_COLORS = ["rojo", "azul", "amarillo", "blanco", "negro"];
export const ALARM_RULES = {
  4: ["Si no hay ningún cable rojo, cortá el 2º.", "Si el último es blanco, cortá el último.", "Si hay más de un azul, cortá el último azul.", "Si no, cortá el 1º."],
  5: ["Si la luz está prendida y hay un solo negro, cortá el negro.", "Si el primero y el último son del mismo color, cortá el 3º.", "Si hay más amarillos que rojos, cortá el último amarillo.", "Si no, cortá el 2º."],
  6: ["Si el número de serie termina en par y no hay blancos, cortá el 4º.", "Si hay exactamente dos rojos, cortá el último rojo.", "Si la luz está apagada, cortá el último.", "Si no, cortá el 5º."]
};
export function solveAlarm(w, serial, led) {
  const n = w.length, cnt = col => w.filter(x => x === col).length, last = col => w.lastIndexOf(col);
  const even = +serial.slice(-1) % 2 === 0;
  if (n === 4) { if (!cnt("rojo")) return 1; if (w[3] === "blanco") return 3; if (cnt("azul") > 1) return last("azul"); return 0; }
  if (n === 5) { if (led && cnt("negro") === 1) return w.indexOf("negro"); if (w[0] === w[4]) return 2; if (cnt("amarillo") > cnt("rojo")) return last("amarillo"); return 1; }
  if (even && !cnt("blanco")) return 3; if (cnt("rojo") === 2) return last("rojo"); if (!led) return 5; return 4;
}
const LANDMARKS = ["Estación", "Rotonda", "Heladería", "Plaza", "Cancha", "Kiosco", "Iglesia", "Escuela", "Verdulería", "Farmacia"];
const DIRS = ["norte", "sur", "este", "oeste"];
const OPP = { norte: "sur", sur: "norte", este: "oeste", oeste: "este" };
const DELTA = { norte: [-1, 0], sur: [1, 0], este: [0, 1], oeste: [0, -1] };
export const FOTO_ITEMS = ["taza", "mate", "termo", "libro", "reloj", "llave", "anteojos", "celular", "planta", "vela", "guante", "zapatilla", "gorra", "casco", "tarjeta", "banquito", "inflador"];
export const FOTO_COLORS = ["rojo", "azul", "verde", "amarillo", "violeta", "blanco", "negro", "naranja"];
function fotoItem(t, c) {
  if (t === "talle") return "zapatilla";
  if (t === "mano") return "guante";
  if (t === "estat") return c.estat === "alta" ? "gorra" : "banquito";
  return c.veh === "MOTO" ? "casco" : c.veh === "BICI" ? "inflador" : "tarjeta";
}
const VEH_ART = { MOTO: "una moto", BICI: "una bici", REMIS: "un remís", TREN: "el tren", BONDI: "un bondi" };
const QUIZ = [
  { q: "¿Cómo se llama la gata mala, la mamá de Juli?", o: ["Linda", "Luz", "Corbata", "Romero"] },
  { q: "¿Dónde entrena kickboxing Thomas?", o: ["Team Bielli", "El Trueno Verde", "La UNGS", "El Tortugas"] },
  { q: "¿Qué es Romero?", o: ["Un caniche", "Un salchicha", "Un gato", "Un labrador"] },
  { q: "¿De qué color es el sillón de la casa?", o: ["Verde", "Rojo", "Gris", "Azul"] },
  { q: "¿Cómo se llama la pastelería de Rocío?", o: ["Roro's Bakery", "Dulce Roro", "La Abuela", "Pastelería Rocío"] },
  { q: "¿Cómo se llama el perro negro de la abuela?", o: ["Corbata", "Moño", "Negro", "Botón"] },
  { q: "¿Cuántas Lindas hay en la familia?", o: ["Dos", "Una", "Tres", "Ninguna"] },
  { q: "¿Qué dice la musculosa negra de Thomas?", o: ["FOREVER", "NEVER", "BIELLI", "TEAM"] },
  { q: "¿Qué tren pasa por Los Polvorines?", o: ["Belgrano Norte", "Sarmiento", "Mitre", "Roca"] },
  { q: "¿Cómo es Juli?", o: ["Mimoso", "Malhumorado", "Inquieto", "Malo"] },
  { q: "¿Qué gata de la abuela anda siempre de mal humor?", o: ["Luz", "Juli", "Linda", "Corbata"] },
  { q: "¿Qué colectivo da vueltas en la rotonda del juego?", o: ["El 315", "El 60", "El 152", "El 101"] }
];

export function stationClue(st, c) {
  const ph = t => t === "talle" ? `calza ${c.talle}` : t === "veh" ? `se mueve en ${VEH_TXT[c.veh]}` : t === "mano" ? `mano hábil ${c.mano}` : `estatura ${c.estat}`;
  if (st.k === "suela") return `Calza ${c.talle}.`;
  if (st.k === "cifra") return `Se escapó en ${VEH_TXT[c.veh]}.`;
  if (st.k === "mapa") return `En esa esquina lo vieron subirse a ${VEH_ART[c.veh]}.`;
  if (st.k === "testigos") return `Mano hábil: ${c.mano}. Estatura: ${c.estat}.`;
  if (st.k === "alarma") return `La cámara de la alarma lo grabó: ${st.traits.map(ph).join(", ")}.`;
  const t = st.traits[0];
  if (t === "talle") return `Dejó una zapatilla talle ${c.talle}.`;
  if (t === "mano") return `Dejó un guante de la mano ${c.mano}: es su mano hábil.`;
  if (t === "estat") return c.estat === "alta" ? "Dejó la gorra enganchada arriba del marco de la puerta: estatura alta." : "Dejó un banquito para alcanzar la ventana: estatura baja.";
  return { MOTO: "Dejó un casco: se mueve en moto.", BICI: "Dejó un inflador: se mueve en bici.", REMIS: "Dejó un recibo de remís.", TREN: "Dejó un boleto de tren.", BONDI: "Dejó su SUBE: se mueve en bondi." }[c.veh];
}

export function normPhrase(s) {
  return String(s).toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "");
}

export function clueText(k, c) {
  if (k === "suela") return `Calza ${c.talle}.`;
  if (k === "cifra") return `Se escapó en ${VEH_TXT[c.veh]}.`;
  return `Mano hábil: ${c.mano}. Estatura: ${c.estat}.`;
}
