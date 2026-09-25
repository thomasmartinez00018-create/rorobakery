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
  { k: "gym", t: "Nocaut en el Team Bielli", place: "el gimnasio del Team Bielli", barrio: "Malvinas Argentinas", obj: "el cinturón de campeón que cuelga arriba del ring" },
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

  return { seed, level, P, place, sus, cul, c, catalog, phrase, keyList, msg, wit, registry, romeroFrac: 0.3 + r() * 0.3, rain: r() < (place.k === "cancha" ? 0.55 : 0.33) };
}

export function normPhrase(s) {
  return String(s).toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "");
}

export function clueText(k, c) {
  if (k === "suela") return `Calza ${c.talle}.`;
  if (k === "cifra") return `Se escapó en ${VEH_TXT[c.veh]}.`;
  return `Mano hábil: ${c.mano}. Estatura: ${c.estat}.`;
}
