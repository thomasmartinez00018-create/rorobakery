// Modo historia de "Gatos de Linda 2.0": "La otra Linda".
// Solo datos (guion y diseño de niveles). La lógica la pone el runtime del modo historia: js/historia.js.
// Contrato: DISENO.md sección 6. Lo que va más allá del contrato está explicado acá abajo y es opcional para el motor.
//
// Campos de cada capítulo
//   id, n, map, title, sub      identificación; map es uno de: roros, plaza, estacion, feria, bielli, abuela, tortugas, terrazas
//   intro / outro               escenas de diálogo: [{ who, text }], who es una clave de SPEAKERS (id de retrato)
//   goal                        objetivo; kind: defend | escort | survive | trains | track | boss | reach | protect | none
//                               un goal puede traer `then` con un segundo objetivo que arranca cuando termina el primero
//   dur                         segundos: duración fija si el objetivo es por tiempo; si no, duración estimada (para ritmo)
//   mix                         [tipo, peso, desde t]: qué gatos salen y desde cuándo (tipos de ENEMY en engine.js o de NEW_TYPES)
//   events                      { t } por tiempo o { at } por disparador (ver TRIGGERS); do: ver EVENT_DO
//   allies                      aliados presentes desde el arranque (ver ALLIES); los que llegan después entran con do: "ally"
//   unlock                      lo que pasa al modo arcade al terminar el capítulo
//   extras opcionales           rate (multiplica el ritmo de aparición), xpMul (multiplica la experiencia),
//                               hz (peligro del mapa: { first, every } o null para apagarlo), hordes (segundos de las hordas),
//                               orders (segundos de los pedidos de Roro's), give (armas al arrancar: [{ weapon, lv }]),
//                               solo (variante para uno: goal se mezcla con el del capítulo, hint suma un cartel y
//                               cualquier otro campo pisa al del capítulo), cast (personajes en escena)
//   En el modo historia no salen Luz a los 3:30 ni Linda a los 7:00 del arcade: cada jefa entra por evento.
//
// Posiciones: mundo de 1024 x 1024, siempre dentro de la zona caminable del mapa (MAPS[x].b en engine.js).
// roros y abuela son mapas nuevos: su zona caminable está en NEW_MAPS, al final (igual a GEO de maps.js).
//
// Ajustes del runtime (fase B1), lo mínimo para que el guion calce con los mapas rehechos con fotos (GEO de maps.js):
//   - prólogo: horno y mesa de tortas en el lugar donde están dibujados (GEO.roros.points).
//   - cap. 1: la catedral quedó arriba (sobre Belgrano) y Balbín abajo: el recorrido de Carmelo sale de la esquina de
//     Balbín, pasa por Sarmiento, las palomas y los mástiles y termina en la escalinata. Velocidad ajustada por duración.
//   - cap. 2: el andén de abajo es el 2 y Amanda espera en un refugio del andén 1 (arriba); gatos sentados a su lado.
//   - cap. 6: el lago no es caminable (GEO.tortugas.b empieza en y = 404): se llega al pie del puente de la torre
//     blanca, ahí bajan al Chema y ahí acorralan a la gata Linda. La caniche espera en la entrada (cast).
//   - cap. 5 y 7: la caniche aparece en escena (cast y evento al terminar) para que la cámara tenga a quién mirar.
//   - cast acepta { id, x, y } además del nombre suelto.
//   - allyDown lleva `who` (qué aliado): sin eso, que Corbata se fuera a la cucha hacía perder el capítulo 6.
//   - duraciones (medidas con tools/bot_historia.mjs para que cada capítulo dure 4 a 6 minutos con la lectura):
//     Carmelo camina a 12 px/s, rastros más largos con 50 s entre uno y otro, puntos donde hay que quedarse en el
//     capítulo 6 (hold), Luz con 9000 de vida y la caniche con 6000 que entra a los 100 s.
//   - cap. 7: el diálogo de la gata cuando cae (allyDown) va con once: true; si no, cortaba la pelea final cada vez.

const d = (who, text) => ({ who, text });

export const SPEAKERS = {
  thomas:    { name: "Thomas" },
  rocio:     { name: "Rocío" },
  juli:      { name: "Juli" },
  chema:     { name: "El Chema" },
  amanda:    { name: "Amanda" },
  carmelo:   { name: "Carmelo" },
  maitena:   { name: "Maitena" },
  romero:    { name: "Romero" },
  corbata:   { name: "Corbata" },
  luz:       { name: "Luz" },
  gata:      { name: "Linda, la gata" },
  caniche:   { name: "Linda, la caniche" },
  comisario: { name: "El comisario", phone: true },   // solo voz por teléfono, retrato de teléfono
  narrador:  { name: "", portrait: null }             // texto sin retrato (acotaciones)
};

export const CHAPTERS = [
  /* ---------------------------------------------------------------- 0 */
  {
    id: "prologo", n: 0, map: "roros",
    title: "La víspera", sub: "Roro's Bakery, la noche antes del Día de la Madre",
    intro: [
      d("rocio", "Ocho tortas para el Día de la Madre. Faltan dos y son las once de la noche."),
      d("thomas", "Decime qué hago. Prometo no tocar nada que tenga crema."),
      d("rocio", "Cuidá la mesa. Si se cae una torta, mañana me mudo a otra provincia."),
      d("chema", "Amanda, el horno está prendido."),
      d("amanda", "Sí. Por eso está calentito."),
      d("thomas", "Pará. ¿Eso de la ventana es un gato? Son como veinte gatos.")
    ],
    goal: {
      kind: "defend", time: 90,
      targets: [
        { id: "horno", name: "El horno", x: 180, y: 244, hp: 300 },
        { id: "mesa", name: "La mesa de tortas", x: 800, y: 452, hp: 240 }
      ],
      targetBias: 0.6,        // 60% de los gatos van a los objetivos y no a los jugadores
      failOnLoss: false       // es el tutorial: si cae uno, se pierde una estrella, no el capítulo
    },
    dur: 90, rate: 0.6, xpMul: 1.6, hz: null, hordes: [], orders: [],
    mix: [["gato", 10, 0], ["saltarin", 2, 40], ["negro", 1, 60]],
    events: [
      { t: 1, do: "hint", text: "Apoyá el dedo y arrastrá para caminar. Las armas pegan solas." },
      { t: 12, do: "hint", text: "Botón celeste: esquive. Un saltito y no te toca nada." },
      { t: 25, do: "dialog", lines: [
        d("rocio", "¡La mesa no! Thomas, parate entre los gatos y las tortas."),
        d("thomas", "Ya sé, ya sé. Soy una pared con rulos.")
      ] },
      { t: 40, do: "give", weapon: "juli", lv: 1 },
      { t: 40, do: "dialog", lines: [
        d("juli", "Miau. (Juli se pone serio. Todo lo serio que puede ponerse un gato.)"),
        d("rocio", "Juli se suma. Gira alrededor tuyo y araña. Es un amor, pero araña.")
      ] },
      { t: 50, do: "hint", text: "El botón grande se carga matando gatos. Si lo tiran juntos, pega el doble." },
      { t: 60, do: "elite", kind: "gato" },
      // cinemática: parece un secuestro, pero los chicos se van solos (semilla del giro 1)
      { t: 78, do: "kidnap", who: ["chema", "amanda"], exit: { x: 980, y: 200 }, lines: [
        d("chema", "¡Amanda, nos vamos de paseo!"),
        d("amanda", "¡Sí! ¿A dónde?"),
        d("chema", "No sé. Con los gatos."),
        d("thomas", "¡Se llevan al Chema y a Amanda!")
      ] }
    ],
    allies: [],
    outro: [
      d("rocio", "Se llevaron la bandeja de alfajores. Y a los chicos."),
      d("juli", "Miau. Miau. MIAU."),
      d("thomas", "Gatos organizados, de noche, robando. Esto tiene firma: Linda."),
      d("rocio", "Y dejaron esto tirado. Un paquete de premios para gatos. Del Carrefour."),
      d("rocio", "Yo no compro premios. Juli come lo que le doy y da las gracias."),
      d("thomas", "Agarrá las llaves. Juli, vos venís. Vamos a buscar a tus hijos.")
    ],
    unlock: ["map:roros"]
  },

  /* ---------------------------------------------------------------- 1 */
  {
    id: "plaza", n: 1, map: "plaza",
    title: "El superhéroe en pijama", sub: "Plaza Mitre, San Miguel",
    intro: [
      d("thomas", "Los gatos cruzaron por acá. Las palomas no paran de chusmear."),
      d("carmelo", "¡Quiero a mi mamá!"),
      d("rocio", "¿Carmelo? ¿Qué hacés en la plaza a esta hora, en pijama?"),
      d("carmelo", "¡Es un traje de superhéroe! Tiene capa y antifaz. Mirá cómo vuela la capa."),
      d("thomas", "Perdón, campeón. ¿Y dónde está tu mamá?"),
      d("carmelo", "En la catedral. Me fui a perseguir una paloma y la paloma se fue."),
      d("rocio", "Lo llevamos hasta la escalinata. Y nadie se separa de nadie.")
    ],
    goal: {
      kind: "escort", ally: "carmelo",
      // recorrido: de la esquina de Balbín (abajo) al monumento, las palomas, los mástiles y la catedral (arriba, sobre Belgrano)
      path: [
        { x: 140, y: 880 }, { x: 320, y: 760 },
        { x: 466, y: 664, wait: 8, tag: "sarmiento" },
        { x: 700, y: 730 }, { x: 860, y: 850, wait: 6, tag: "palomas" },
        { x: 700, y: 730 }, { x: 600, y: 560 },
        { x: 606, y: 396, wait: 8, tag: "mastiles" },
        { x: 512, y: 300 }, { x: 512, y: 222, tag: "catedral" }
      ],
      speed: 12,              // px/s, solo camina si hay un jugador a menos de 70 px (16 duraba 2 min: ver HISTORIA.md)
      near: 70,
      calm: 2                 // segundos al lado para que deje de llorar
    },
    dur: 240, rate: 0.8, xpMul: 1.4, hordes: [], orders: [120],
    mix: [["gato", 10, 0], ["saltarin", 3, 50], ["negro", 3, 110], ["madre", 1, 150], ["escupidor", 1, 180]],
    events: [
      { t: 4, do: "hint", text: "Carmelo camina si tiene a alguien cerca. Si se asusta, se sienta a llorar." },
      { t: 20, do: "dialog", lines: [
        d("carmelo", "¡Patada de superhéroe!"),
        d("thomas", "Esa técnica es mía, eh. Después te cobro la clase.")
      ] },
      { at: "tag:sarmiento", do: "dialog", lines: [
        d("carmelo", "¿Ese señor de bronce también perdió a su mamá?"),
        d("rocio", "Es Sarmiento. No perdió a nadie. Está ahí parado hace más de cien años.")
      ] },
      { at: "goal50", do: "dialog", lines: [
        d("carmelo", "Yo vi una perrita con moño. Les daba comida a los gatos."),
        d("thomas", "Sí, y yo vi un dinosaurio arriba del 315. Caminá, campeón."),
        d("rocio", "Dale, Carme. Después nos contás.")
      ] },
      { at: "tag:mastiles", do: "dialog", lines: [
        d("carmelo", "Las banderas están bailando."),
        d("thomas", "Es el viento."),
        d("carmelo", "No. Están bailando.")
      ] },
      { at: "allyDown", who: "carmelo", do: "dialog", once: true, lines: [
        d("carmelo", "¡QUIERO A MI MAMÁ!"),
        d("rocio", "Ya casi, Carme. Desde acá se ve la torre del reloj. Vení que te acompaño.")
      ] },
      { t: 90, do: "elite", kind: "saltarin" },
      { t: 180, do: "elite", kind: "negro" }
    ],
    give: [{ weapon: "juli", lv: 1 }],
    allies: ["carmelo"],
    solo: { goal: { near: 90, fleeEvery: [60, 75] } },
    outro: [
      d("carmelo", "¡MAMÁ!"),
      d("narrador", "Carmelo sube la escalinata corriendo y se le cuelga del cuello a su mamá."),
      d("carmelo", "Chau, Thomas. Chau, Rocío. La perrita del moño era linda, eh."),
      d("thomas", "Sí, sí. Linda la perrita."),
      d("rocio", "Los gatos siguieron para la estación. Se escucha el Belgrano Norte.")
    ],
    unlock: []
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "estacion", n: 2, map: "estacion",
    title: "Tres trenes", sub: "Estación Los Polvorines, andén 1",
    intro: [
      d("rocio", "Andén 1, trenes a Villa Rosa. Y una banda de gatos sentada en los asientos azules."),
      d("thomas", "Ahí, en el refugio de enfrente. ¡Es Amanda!"),
      d("amanda", "¡Hola! Estoy en la estación."),
      d("juli", "Miau. (Juli tiembla de la emoción. O de frío. Con Juli nunca se sabe.)"),
      d("rocio", "No se puede cruzar con todos esos gatos encima de las vías."),
      d("thomas", "El Belgrano Norte no frena por gatos. Que pase y nos abra camino.")
    ],
    goal: {
      kind: "trains", count: 3,
      start: { x: 512, y: 640 },                     // andén 2 (abajo)
      // al pasar el segundo tren se limpia la vía: Amanda espera en el refugio del andén de enfrente (andén 1, arriba)
      rescue: { who: "amanda", after: 2, x: 776, y: 420, r: 24, hold: 3, holdPair: 1.5 }
    },
    hz: { first: 50, every: 80 },                    // trenes a los ~50, ~130 y ~210 s
    dur: 230, rate: 0.9, xpMul: 1.4, hordes: [100], orders: [],
    mix: [["gato", 8, 0], ["saltarin", 3, 20], ["negro", 3, 60], ["escupidor", 2, 90], ["madre", 1, 140]],
    events: [
      { t: 1, do: "spawn", kind: "gato", n: 6, x: 776, y: 410 },
      { t: 3, do: "hint", text: "Cuando suena la bocina, salí de las vías. Los gatos no se avivan." },
      { at: "step:1", do: "dialog", lines: [
        d("rocio", "Uno. Faltan dos. El tren es más puntual que vos."),
        d("thomas", "Eso dolió más que el tren.")
      ] },
      { at: "step:2", do: "dialog", lines: [
        d("thomas", "¡Ahora! La vía quedó limpia. Crucemos a buscarla."),
        d("amanda", "Hola. Sigo en la estación.")
      ] },
      { at: "rescue", do: "ally", who: "amanda" },
      { at: "rescue", do: "dialog", lines: [
        d("amanda", "Me rescataron. Qué bueno. Estaba aburrida."),
        d("juli", "Miau, miau. (Le lame la cabeza entera. Amanda se deja.)")
      ] },
      { t: 75, do: "elite", kind: "saltarin" },
      { t: 160, do: "elite", kind: "madre" }
    ],
    give: [{ weapon: "juli", lv: 1 }],
    allies: [],
    solo: { goal: { rescue: { hold: 2 } } },
    outro: [
      d("rocio", "Amanda, ¿estás bien? ¿Te trajo la gata Linda?"),
      d("amanda", "No. Nos escapamos nosotros. Para ver a la abuela Linda. Es el Día de la Madre."),
      d("thomas", "Pará. ¿Se fueron solos con una banda de gatos?"),
      d("amanda", "Sí. Dijeron que iban a lo de la abuela. Mintieron. Los gatos mienten."),
      d("rocio", "Entonces Linda no se los llevó. ¿Y quién manda a esos gatos?"),
      d("rocio", "Y tenés pelos crema pegados. Vos sos gris, Juli es gris. ¿Con quién estuviste?"),
      d("amanda", "Con alguien crema.")
    ],
    unlock: []
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "feria", n: 3, map: "feria",
    title: "¡Gomeghooo!", sub: "Feria Persa, Av. Balbín",
    intro: [
      d("thomas", "El cartel dice que abre de diez a veintidós. Está todo cerrado."),
      d("rocio", "Y Romero adentro. Se escapó atrás de un olor y pasó por abajo de la reja."),
      d("romero", "(De lejos) ¡Gomeghooo!"),
      d("thomas", "Es él. Cuando se hace el francés es porque encontró algo."),
      d("amanda", "Huele a pollo."),
      d("juli", "Miau. (Juli huele también. Confirma: pollo.)")
    ],
    goal: {
      kind: "track", count: 3,
      // rastros de a uno: quedarse encima hasta llenarlo; los gatos que se sientan arriba lo frenan
      spots: [{ x: 230, y: 430 }, { x: 820, y: 560 }, { x: 520, y: 880 }],
      r: 26, fill: 24, fillPair: 14, window: 60,
      gap: 50,                 // segundos hasta que aparece el rastro siguiente (con 6 s de llenado el capítulo duraba 30 s)
      onTimeout: "move",       // si se vence, el rastro salta a otro puesto y llega una tanda de negros
      sniffers: { kind: "negro", every: 6 }   // un gato va derecho al rastro cada 6 s
    },
    dur: 260, rate: 0.85, xpMul: 1.6, hordes: [170], orders: [],
    mix: [["gato", 8, 0], ["saltarin", 3, 15], ["escupidor", 2, 40], ["negro", 3, 60], ["madre", 2, 110], ["gordo", 1, 160]],
    events: [
      { t: 3, do: "hint", text: "Párense encima del rastro hasta llenarlo. Los dos juntos, el doble de rápido." },
      { at: "step:1", do: "dialog", lines: [
        d("rocio", "Huellas de caniche y migas de premio de pollo. Este perro come mejor que yo."),
        d("thomas", "Vos comés torta todo el día."),
        d("rocio", "Las pruebo. Es trabajo.")
      ] },
      // cameo de la gata Linda desde el techo del castillo
      { at: "goal50", do: "dialog", lines: [
        d("gata", "Miren quiénes vinieron a la feria sin plata."),
        d("thomas", "¡Linda! ¿Dónde está el Chema?"),
        d("gata", "Yo no fui. Pero sé quién fue. Y no les voy a decir."),
        d("gata", "Ah, y no me confundan con la otra Linda. Yo soy la mala."),
        d("rocio", "¿Qué otra Linda? ¡Volvé!")
      ] },
      { at: "step:2", do: "crates", n: 8, r: [60, 160], banner: ["¡Liquidación!", "Se vinieron abajo los cajones de un puesto"] },
      { at: "step:2", do: "dialog", lines: [
        d("thomas", "¡Liquidación! Todo a mitad de precio. Romperlos es gratis.")
      ] },
      { at: "step:3", do: "give", weapon: "romero", lv: 2 },
      { at: "step:3", do: "dialog", lines: [
        d("romero", "¡Gomeghooo! Oh là là, ¿me buscaban, mes amis?"),
        d("rocio", "¿Y esa boina? ¿La sacaste de un puesto?"),
        d("romero", "Pgestada, ma chérie. Es pog la causa.")
      ] },
      { t: 80, do: "elite", kind: "madre" },
      { t: 200, do: "elite", kind: "gordo" }
    ],
    give: [{ weapon: "juli", lv: 1 }],
    allies: ["amanda"],
    solo: { goal: { fill: 14, gap: 35, sniffers: { every: 14 } }, hordes: [], rate: 0.6 },
    outro: [
      d("romero", "Seguí el olog hasta acá. Miguen lo que tenían los gatos: premios de pollo."),
      d("rocio", "Del Carrefour. El mismo paquete que dejaron en la cocina."),
      d("thomas", "Alguien les compra premios a los gatos para que hagan lío. ¿Linda tiene plata?"),
      d("amanda", "La abuela Linda no tiene bolsillos."),
      d("juli", "Miau. (Juli asiente. Es verdad, no tiene.)"),
      d("rocio", "Los gatos agarraron para Los Polvorines. Para el lado del Team Bielli.")
    ],
    unlock: []
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "bielli", n: 4, map: "bielli",
    title: "Sangre de campeón", sub: "Team Bielli, 9 de Julio 2340",
    intro: [
      d("thomas", "Mi gimnasio. Si los gatos se meten acá, se meten conmigo."),
      d("rocio", "Hay gatos con guantes arriba del ring. Negros, como los tuyos."),
      d("thomas", "Ah, no. Eso ya es una falta de respeto."),
      d("romero", "¿Quiegue que los muegda, monsieur?"),
      d("amanda", "Los gatos con guantes no pueden agarrar nada. Qué tontos.")
    ],
    goal: { kind: "survive", time: 300, ring: { x: 690, y: 570, half: 130 } },
    dur: 300, rate: 1.0, xpMul: 1.3, hordes: [120], orders: [200],
    mix: [["gato", 7, 0], ["saltarin", 3, 0], ["negro", 4, 40], ["escupidor", 2, 70], ["guantes", 2, 90], ["madre", 2, 130], ["gordo", 2, 180]],
    events: [
      { t: 3, do: "hint", text: "Thomas juega de local: pega 15% más. La fila de la entrada en calor no frena." },
      // sparring: élites con guantes que salen del ring
      { t: 40, do: "elite", kind: "guantes", pos: { x: 690, y: 570 } },
      { t: 100, do: "elite", kind: "guantes", pos: { x: 690, y: 570 } },
      { at: "goal50", do: "maitena", from: { x: 512, y: 970 } },
      { at: "goal50", do: "dialog", lines: [
        d("maitena", "¿Quién dejó entrar gatos al gimnasio? ¿Fuiste vos, Thomas?"),
        d("thomas", "¡Maite! Justo. Ayudame con los del ring."),
        d("maitena", "Te ayudo. Pero después le cuento a todos que te tuve que salvar."),
        d("thomas", "No necesito que me salve mi hermana de trece años."),
        d("maitena", "Invicta. De trece años e invicta. Correte.")
      ] },
      { at: "goal50", do: "special", id: "maitena" },
      { at: "goal50", do: "hint", text: "Nuevo especial: Llamá a Maitena. Si lo tocan los dos juntos, pega el doble." },
      { t: 210, do: "elite", kind: "guantes", pos: { x: 690, y: 570 } },
      { t: 255, do: "elite", kind: "guantes", pos: { x: 690, y: 570 } },
      { t: 255, do: "elite", kind: "gordo" }
    ],
    allies: ["amanda"],
    give: [{ weapon: "juli", lv: 1 }, { weapon: "romero", lv: 2 }],
    outro: [
      d("maitena", "Listo. Y esto estaba tirado en el medio del ring. Un moñito crema."),
      d("rocio", "¿Un moñito? Los gatos no usan moño."),
      d("maitena", "Es de perro. De perrita. Tiene olor a perfume de veterinaria."),
      d("thomas", "Pelos crema, premios del Carrefour y un moñito. ¿De quién es todo esto?"),
      d("amanda", "De alguien crema que usa moño."),
      d("maitena", "Si me necesitan, llámenme. Igual me van a necesitar.")
    ],
    unlock: ["skin:bielli", "special:maitena"]
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "abuela", n: 5, map: "abuela",
    title: "Luz no declara", sub: "La casa de la abuela, San Miguel",
    intro: [
      d("rocio", "La casa de la abuela. Los gatos entraron por el patio."),
      d("thomas", "Despacito. Si despertamos a la abuela, nos reta a los dos."),
      d("corbata", "¡GUAU! (Corbata cuida el patio. De todo. También de ustedes.)"),
      d("thomas", "Corbata, somos nosotros. Venimos a ayudar."),
      d("corbata", "Guau. (Lo pensó. Decidió que sí. Se suma.)"),
      d("amanda", "Corbata tiene corbata.")
    ],
    goal: { kind: "boss", boss: "luz2", spawn: { x: 512, y: 230 }, surrender: true },
    dur: 280, rate: 1.0, xpMul: 1.5, hz: null, hordes: [], orders: [70],
    mix: [["gato", 8, 0], ["saltarin", 3, 0], ["negro", 4, 30], ["escupidor", 2, 50], ["madre", 2, 80], ["gordo", 1, 100]],
    events: [
      { t: 4, do: "hint", text: "Corbata embiste a los gatos. Si lo tumban, se va a su cucha y vuelve." },
      { t: 60, do: "elite", kind: "madre" },
      { t: 110, do: "dialog", lines: [
        d("luz", "¿Qué hacen en mi patio? Son las tres de la mañana."),
        d("rocio", "¡Luz! ¿Vos también estás con los gatos?"),
        d("luz", "No estoy con nadie. Estoy de mal humor. Que es distinto.")
      ] },
      { t: 110, do: "boss", kind: "luz2" },
      { t: 112, do: "hint", text: "Luz marca a uno con una línea roja. Si el otro se le pone al lado, Luz se frena." },
      { at: "bossPhase2", do: "dialog", lines: [
        d("luz", "Ah, ¿se ayudan? Qué asco. Qué asco el amor."),
        d("thomas", "Gracias, Luz. Lo tomamos como un cumplido.")
      ] },
      { at: "allyDown", who: "corbata", do: "dialog", once: true, lines: [
        d("corbata", "Guau. (Se va a su cucha a juntar fuerzas. Ya vuelve.)")
      ] },
      { at: "goalDone", do: "ally", who: "caniche", idle: true, from: { x: 512, y: 840 } }
    ],
    allies: ["amanda", "corbata"],
    give: [{ weapon: "juli", lv: 1 }, { weapon: "romero", lv: 2 }],
    solo: {
      goal: { soloStun: "cucha" },
      hint: "Llevá a Luz hasta la cucha de Corbata: si estás pegado a la cucha cuando carga, se la come."
    },
    outro: [
      d("luz", "Ya está. Me rindo. Igual no era idea mía."),
      d("rocio", "¿Cómo que no era idea tuya? ¿Quién te manda?"),
      d("luz", "Me obligaban. A la gata Linda también la persiguen. Alguien usa su nombre."),
      d("luz", "No le vi la cara. Pelos crema, un moñito y perfume de veterinaria."),
      d("caniche", "¡Holaaa! ¡Qué susto! ¿Están bien? ¿Quieren un premio? Tengo un montón."),
      d("juli", "Fsss. (Juli le bufa. Juli no le bufa a nadie.)"),
      d("thomas", "Juli, no seas maleducado. Es la Linda buena. La de la abuela.")
    ],
    unlock: ["map:abuela", "ally:corbata"]
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "tortugas", n: 6, map: "tortugas",
    title: "La torre blanca", sub: "Tortugas Open Mall, Tortuguitas",
    intro: [
      d("caniche", "¡El Chema está en la torre blanca! ¡Lo vi! Vayan, vayan, yo los espero acá."),
      d("rocio", "Qué servicial. Gracias, Linda."),
      d("thomas", "El lago, los puentes y la torre al fondo. Y carritos sueltos del súper."),
      d("amanda", "El Chema le tiene miedo al agua. Y a los carritos. Y a las hojas."),
      d("juli", "Miau. (Juli mira la torre como si pudiera saltar hasta allá.)")
    ],
    goal: {
      kind: "reach",
      start: { x: 120, y: 820 },
      // por los puentes de madera del lago hasta la torre blanca reticulada
      // por el estacionamiento y el boulevard hasta el pie del puente de la torre blanca (el lago no se camina)
      // hold: segundos que hay que quedarse en ese punto (en el puente, cruzar juntos); sin esto el capítulo duraba 50 s
      path: [{ x: 420, y: 900 }, { x: 820, y: 930 }, { x: 900, y: 720, hold: 26, holdPair: 18, holdSolo: 14 }, { x: 560, y: 650 }, { x: 512, y: 560, tag: "puente", hold: 36, holdPair: 26, holdSolo: 18 }, { x: 512, y: 436, tag: "torre" }],
      r: 40,
      // el Chema no se anima a bajar de la torre: hay que quedarse abajo hasta convencerlo
      rescue: { who: "chema", x: 512, y: 424, r: 24, hold: 44, holdPair: 32, holdSolo: 14 },
      // después del rescate llega la gata Linda corrida por sus propios gatos
      then: { kind: "protect", ally: "gataLinda", x: 560, y: 470, time: 40 }
    },
    dur: 270, rate: 0.95, xpMul: 1.5, hz: { first: 20, every: 15 }, hordes: [], orders: [],
    mix: [["gato", 6, 0], ["saltarin", 3, 0], ["negro", 5, 0], ["escupidor", 2, 40], ["madre", 2, 70], ["gordo", 2, 110]],
    events: [
      { t: 3, do: "hint", text: "Lleguen al puente de la torre blanca. Los carritos avisan con una franja roja." },
      { t: 30, do: "call", who: "comisario",
        lines: [
          d("narrador", "Suena el teléfono. Número privado."),
          d("comisario", "Habla el comisario. Una pregunta y los dejo seguir.")
        ],
        q: "¿Cuántas Lindas hay en la familia?", opts: ["Una", "Dos", "Tres"], a: 1, prize: "caja",
        onOk: [d("comisario", "Dos. Correcto. No se olviden de la otra.")],
        onFail: [d("comisario", "Mal. Piénsenlo bien. Corto.")] },
      { at: "tag:puente", do: "dialog", lines: [
        d("thomas", "Por el puente, juntos. Pegados pegamos más. Está en las reglas, lo leí.")
      ] },
      { at: "rescue", do: "ally", who: "chema" },
      { at: "rescue", do: "dialog", lines: [
        d("chema", "Hola. Estoy arriba de una torre."),
        d("rocio", "¡Chema! ¿Estás bien, mi amor?"),
        d("chema", "Sí. La torre es blanca.")
      ] },
      { at: "rescue", do: "ally", who: "gataLinda", from: { x: 1040, y: 470 } },
      { at: "rescue", do: "dialog", lines: [
        d("gata", "No digan nada. Sí, me persiguen. Sí, son mis propios gatos. Qué vergüenza."),
        d("thomas", "Linda, ¿te ayudamos o te pegamos?"),
        d("gata", "Ayúdenme ahora. Me pegan otro día. Prometo merecerlo."),
        d("rocio", "Rodéenla. Nadie toca a la abuela de los chicos.")
      ] },
      { at: "rescue", do: "horde", n: 30, around: "gataLinda" },
      { at: "allyDown", who: "gataLinda", do: "fail", banner: ["Se llevaron a Linda", "Revancha"] },
      { t: 100, do: "elite", kind: "negro" },
      { t: 190, do: "elite", kind: "gordo" }
    ],
    allies: ["amanda", "corbata"],
    cast: [{ id: "caniche", x: 170, y: 860 }],
    give: [{ weapon: "juli", lv: 1 }, { weapon: "romero", lv: 2 }],
    solo: { goal: { then: { time: 60 } } },
    outro: [
      d("gata", "Gracias. No se acostumbren."),
      d("chema", "Abuela Linda, te trajimos un regalo."),
      d("amanda", "Era un alfajor. Nos lo comimos."),
      d("gata", "Mis nietos. No sirven para nada. Los adoro."),
      d("gata", "La que manda a todos está en Terrazas. En el Carrefour, donde roba los premios."),
      d("thomas", "¿Quién es? Decilo de una vez."),
      d("gata", "No me van a creer. Vayan y vean. Yo voy con ustedes.")
    ],
    unlock: []
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: "terrazas", n: 7, map: "terrazas",
    title: "La otra Linda", sub: "Terrazas de Mayo, Ruta 8",
    intro: [
      d("rocio", "La M de colores, el estacionamiento lleno de gatos y nadie a la vista."),
      d("caniche", "¡Llegaron! ¡Sorpresa! Bueno, sorpresa para ustedes. Para mí no."),
      d("thomas", "¿Linda? ¿La Linda buena?"),
      d("caniche", "La buena, la buena. Toda la vida siendo la buena. ¿Saben lo que cansa?"),
      d("caniche", "Mañana es el Día de la Madre. Sin torta no hay fiesta. Y la abuela es toda mía."),
      d("gata", "No me confundan con la otra Linda. Yo soy la mala. Ella es peor."),
      d("thomas", "La perrita con moño. Carmelo nos lo dijo y no le dimos bola.")
    ],
    goal: { kind: "boss", boss: "canicheBoss", spawn: { x: 512, y: 300 }, surrender: true },
    dur: 330, rate: 1.0, xpMul: 1.6, hz: { first: 30, every: 26 }, hordes: [], orders: [],
    mix: [["gato", 5, 0], ["negro", 5, 0], ["saltarin", 4, 0], ["escupidor", 2, 0], ["madre", 2, 30], ["gordo", 2, 60]],
    events: [
      { t: 3, do: "hint", text: "Los premios de la caniche agrandan a los gatos. Levántenlos antes que ellos." },
      { t: 40, do: "elite", kind: "gordo" },
      { t: 100, do: "boss", kind: "canicheBoss" },
      { at: "bossPhase2", do: "dialog", lines: [
        d("caniche", "¡Carritos! ¡Del Carrefour! ¡Los traje yo!"),
        d("rocio", "Premios, carritos y una bandeja de alfajores. Sos una banda entera vos sola.")
      ] },
      { at: "bossPhase3", do: "dialog", lines: [
        d("caniche", "¡NO ES JUSTO! ¡ES MI ABUELA! ¡MÍA, MÍA, MÍA!"),
        d("gata", "Berrinche. Denle con todo, que se cansa sola.")
      ] },
      { at: "bossPhase3", do: "hint", text: "Es el momento: ¡Llamá a Maitena!" },
      { at: "allyDown", who: "gataLinda", do: "dialog", once: true, lines: [
        d("gata", "Me quedan seis vidas. Me tomo un minuto y vuelvo.")
      ] }
    ],
    allies: ["amanda", "corbata", "chema", "gataLinda"],
    cast: [{ id: "caniche", x: 512, y: 300 }],   // en la intro está ahí parada; a los 100 s pasa a ser la jefa
    solo: { rate: 0.85 },
    give: [{ weapon: "juli", lv: 1 }, { weapon: "romero", lv: 2 }],
    outro: [
      d("caniche", "Bueno. Perdón. Un poquito. Pero yo tenía razón en algo. No sé en qué."),
      d("gata", "Devolvé la bandeja de alfajores, querida."),
      d("caniche", "Me comí dos. Bueno, cuatro."),
      d("rocio", "Son las seis de la mañana y me faltan dos tortas. Todos a Roro's."),
      d("thomas", "Yo bato. Prometo no tocar la crema."),
      d("juli", "Miau. (Juli ronronea. Por primera vez en toda la noche.)")
    ],
    unlock: []
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: "epilogo", n: 8, map: "roros",
    title: "Día de la Madre", sub: "Roro's Bakery, domingo al mediodía",
    intro: [
      d("narrador", "Domingo. Roro's está lleno. En la mesa del medio, una torta lila que dice Mamá."),
      d("carmelo", "¡Mamá, mirá! Esa torta la salvé yo. Con patadas."),
      d("narrador", "La mamá de Carmelo le da un beso en la cabeza. Él se hace el superhéroe y se deja."),
      d("maitena", "Thomas, contales quién noqueó a los gatos del ring."),
      d("thomas", "Fue en equipo."),
      d("maitena", "Fui yo.")
    ],
    goal: { kind: "none" },
    dur: 0, hz: null, hordes: [], orders: [],
    mix: [],
    events: [],
    allies: [],
    cast: ["juli", "chema", "amanda", "romero", "corbata", "gataLinda", "caniche", "carmelo", "maitena"],   // solo para dibujar la escena
    outro: [
      d("chema", "Abuela Linda, feliz día. Te trajimos un regalo."),
      d("amanda", "Es el mismo alfajor. Lo encontramos de nuevo."),
      d("gata", "Feliz día para mí. Sigo siendo la mala, eh. Pero hoy paso."),
      d("caniche", "Yo estoy castigada. Sin premios hasta fin de año. Y sin moño."),
      d("rocio", "La abuela pidió la porción más grande. Ya se la separé."),
      d("thomas", "Linda la torta, Roro."),
      d("rocio", "No digas Linda. Por hoy, no digas Linda.")
    ],
    credits: [
      "Gatos de Linda 2.0: La otra Linda",
      "Para Thomas y Rocío, para jugar de a dos",
      "Con Juli, el Chema, Amanda y Romero",
      "Y con Carmelo, Maitena, Corbata y Luz",
      "La abuela se quedó con la porción más grande"
    ],
    unlock: ["skin:roros"]
  }
];

/* ---------- disparadores que el runtime tiene que emitir ---------- */
export const TRIGGERS = {
  goal50:     "el objetivo llegó a la mitad (tiempo, recorrido, rastros o vida de la jefa, según el kind)",
  goalDone:   "objetivo cumplido; si el goal tiene `then`, se emite al terminar el segundo",
  allyDown:   "un aliado queda fuera: Carmelo se sienta a llorar, Corbata se va a la cucha, la gata Linda cae",
  bossPhase2: "la jefa pasa a su segunda fase (Luz al 50%, la caniche al 66%)",
  bossPhase3: "la jefa pasa a su tercera fase (solo la caniche, al 33%)",
  "step:N":   "paso N del objetivo (desde 1): tren N que pasó, rastro N lleno",
  "tag:X":    "el aliado escoltado o los jugadores llegaron al punto del recorrido con tag X",
  rescue:     "terminó el rescate de un aliado (Amanda en la estación, el Chema en la torre)"
};

/* ---------- acciones de los eventos ---------- */
export const EVENT_DO = {
  dialog:  "abre una escena { lines }; con once: true se muestra una sola vez aunque el disparador se repita",
  hint:    "cartel corto arriba, sin pausar { text }",
  elite:   "élite como en el arcade { kind, pos? }",
  give:    "les da un arma a los dos jugadores { weapon, lv }",
  ally:    "suma un aliado { who, from? }",
  special: "habilita un especial nuevo { id } (ver SPECIALS)",
  maitena: "entrada de Maitena: llega corriendo { from } y hace el especial gratis una vez",
  kidnap:  "cinemática: los gatos se llevan a { who } hasta { exit }, con { lines } mientras tanto; no pausa",
  boss:    "aparece la jefa { kind } en goal.spawn",
  crates:  "aparecen { n } cajones a una distancia { r } de los jugadores, con { banner }",
  horde:   "anillo de { n } gatos con dos huecos alrededor de { around } (jugadores o un aliado)",
  call:    "llamada del comisario: { lines }, pregunta { q, opts, a }; si aciertan los dos, { prize } y { onOk }, si no { onFail }",
  fail:    "pierden el capítulo con { banner }"
};

/* ---------- tipos nuevos de enemigos (ids nuevos siempre al final de ENEMY_ID) ---------- */
export const NEW_TYPES = {
  guantes: {
    base: { hp: 26, spd: 34, dmg: 10, r: 7, xp: 3 },
    look: "gato negro con guantes de box negros (el sparring del Team Bielli)",
    does: "Jab doble: se frena 0,45 s con aviso (!) y hace dos embestidas cortas de 40 px separadas 0,2 s. " +
          "Sale como élite en el ring (x8 de vida, suelta caja). Fuera del ring se comporta como un negro."
  },
  luz2: {
    base: { hp: 9000, spd: 28, dmg: 16, r: 13, xp: 40, boss: true },
    look: "Luz de siempre (atigrada, panza naranja)",
    does: "Pelea de pareja. Marca a un jugador con una línea roja 1 s y carga hacia él. " +
          "Si al arrancar la carga el otro jugador está a menos de 28 px del marcado, Luz se frena en seco y queda " +
          "aturdida 2,5 s (recibe x1,5 de daño). Fase 2 (menos de 50%): marca en 0,7 s y carga dos veces seguidas. " +
          "Solo: el papel del otro lo hace la cucha de Corbata (NEW_MAPS.abuela.points.cucha) o Corbata mismo. " +
          "A 0 de vida no muere: se rinde (goalDone)."
  },
  canicheBoss: {
    base: { hp: 6000, spd: 30, dmg: 18, r: 15, xp: 0, boss: true },
    look: "caniche crema con moñito rosa, cara de buena (hasta que deja de tenerla)",
    does: "Fase 1, Premios (100% a 66%): cada 3 s tira 4 premios del Carrefour a 60-120 px; llama gatos y negros. " +
          "Fase 2, Carritos (66% a 33%): silba y cruzan dos filas de carritos (peligro carritos) cada 7 s con aviso; " +
          "embiste en línea marcando 0,8 s como Luz. " +
          "Fase 3, Berrinche (menos de 33%): se tira al piso y patalea; cada 4 s una onda en anillo que crece de 0 a " +
          "160 px en 1,2 s con dos huecos para escapar, ladridos que empujan y saltarines. Se mueve 30% más rápido. " +
          "A 0 de vida no muere: se rinde con berrinche (goalDone)."
  },
  premio: {
    base: { hp: 1, spd: 0, dmg: 0, r: 4, xp: 0, obj: true },
    look: "bolsita de premios para gatos del Carrefour",
    does: "Objeto en el piso que tira la caniche. Atrae a los gatos a 140 px. Un gato que lo come queda agrandado " +
          "10 s (+40% velocidad, +30% daño, un poco más grande). Si un jugador lo pisa, lo levanta y desaparece."
  }
};

/* ---------- aliados (lista A en la foto del estado) ---------- */
export const ALLIES = {
  carmelo: {
    look: "nene de 4 años en pijama de superhéroe genérico, con antifaz y capa",
    does: "Objetivo de escolta. Camina por goal.path a goal.speed si hay un jugador a menos de goal.near. " +
          "Patadita a los gatos que se le pegan (16 px, 8 de daño, empuje 120, cada 0,8 s). Miedo: +20 por golpe; " +
          "a 100 se sienta a llorar (allyDown) hasta que alguien esté goal.calm s a su lado. No muere. " +
          "Cada 40 a 55 s sale corriendo 3 s detrás de las palomas.",
    barks: { kick: ["¡Patadita!", "¡Tomá, gato!"], flee: ["¡Paloma! ¡Vení que te doy un abrazo!"], cry: ["¡Quiero a mi mamá!"] }
  },
  amanda: {
    look: "como Juli pero chiquita",
    does: "Pasiva Maullido: cada 8 s marca al gato con más vida a menos de 160 px; ese gato recibe +25% de daño 6 s.",
    barks: { mark: ["Miau. Ese es el más grande.", "Ese. El gordo."] }
  },
  chema: {
    look: "como Juli pero chiquito",
    does: "Pasiva Ronroneo: mientras los dos jugadores están juntos (hilo de corazón), +0,6 de vida por segundo a los dos.",
    barks: { purr: ["Rrrrr.", "Están juntos. Qué bien."] }
  },
  corbata: {
    look: "perro negro de pelo corto con pecho blanco",
    does: "Sigue al jugador más cercano. Cada 4 s embiste al grupo de gatos más grande (140 px, 30 de daño, empuje 220). " +
          "200 de vida; si llega a 0 se va a su cucha 20 s (allyDown) y vuelve.",
    barks: { charge: ["¡Guau!"], back: ["Guau. (Volvió.)"] }
  },
  gataLinda: {
    look: "gata atigrada de pelo largo con babero blanco, la corona torcida",
    does: "Capítulo 6: objetivo a proteger, 400 de vida (520 jugando solo); el 60% de los gatos a menos de 200 px van a ella; " +
          "araña lo que tiene al lado (20 px, 12 de daño cada 0,6 s). Si cae, se pierde. " +
          "Capítulo 7: aliada, 500 de vida, le pega a la jefa (20 por segundo); si cae, vuelve a los 15 s.",
    barks: { hit: ["Yo soy la mala, querido.", "Siete vidas, ¿te acordás?"] }
  },
  caniche: { look: "caniche crema con moñito", does: "Solo en escenas (prólogo de capítulo 6 y epílogo)." },
  juli:    { look: "gris y blanco, peludo, ojos verdes", does: "En la historia es el arma Juli (desde el prólogo)." },
  romero:  { look: "caniche toy rojizo, con boina robada", does: "En la historia es el arma Romero (desde el capítulo 3)." },
  maitena: { look: "13 años, remera negra del team, guantes", does: "Especial Llamá a Maitena (ver SPECIALS)." }
};

/* ---------- especiales nuevos ---------- */
export const SPECIALS = {
  maitena: {
    name: "Llamá a Maitena",
    from: 4,
    charge: "se carga matando 60 gatos, aparte del especial de cada uno",
    does: "Maitena entra corriendo desde fuera de cámara y tira 3 patadas giratorias de 120 px de radio " +
          "(160 de daño cada una, aturde 2 s). Dura 2,5 s y se va saludando.",
    pair: "si los dos lo tocan con menos de 2,5 s de diferencia: radio 170 y daño x1,5",
    solo: "sale apenas lo tocás",
    barks: ["¡Correte, Thomas!", "Invicta, dije.", "¿Otra vez yo?"]
  }
};

/* ---------- nombres de evoluciones (canon de Thomas) ---------- */
export const EVO_NAMES = {
  juli:   { name: "Juliano Benito Mostacholi", desc: "4 Julis que te curan cada vez que arañan. Nombre completo, por favor.", line: d("juli", "Miau. (A partir de ahora, Juliano Benito Mostacholi.)") },
  romero: { name: "Monsieur Gomeghooo", desc: "Con boina y bigotito. Más rápido, y cada mordida pega a todos alrededor.", shout: "¡Gomeghooo!", line: d("romero", "¡Gomeghooo! Ahoga soy Monsieur. Con bigotito y todo.") }
};

/* ---------- mapas nuevos: propuesta de zona caminable y puntos que usa el guion ---------- */
export const NEW_MAPS = {
  roros: {
    b: [24, 214, 1000, 956],
    points: { horno: { x: 180, y: 226 }, mesaTortas: { x: 800, y: 436 }, isla: { x: 512, y: 392 }, vidriera: { x: 512, y: 610 }, puerta: { x: 512, y: 950 }, ventana: { x: 980, y: 200 } },
    note: "Cocina arriba (horno, mesada, ventana por donde entran los gatos), local abajo con la vidriera. Delantal celeste del logo."
  },
  abuela: {
    b: [32, 200, 992, 856],
    points: { galeria: { x: 512, y: 236 }, cucha: { x: 300, y: 650 }, porton: { x: 512, y: 850 }, limonero: { x: 220, y: 430 } },
    note: "Patio con piso rojo, pared de ladrillo, tendedero y la cucha de Corbata. La abuela no se ve nunca, ni en silueta."
  }
};
