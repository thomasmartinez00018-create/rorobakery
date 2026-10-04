# Gatos de Linda 2.0: contexto completo del proyecto

Este archivo junta todo lo necesario para seguir trabajando en el juego sin la conversación original: para quién es, qué decisiones se tomaron, cómo está hecho, números de balance, cómo se prueba y se publica, y qué queda pendiente.

La versión 2.0 (rama `gdl/v2`) suma cinco trabajos sobre la versión publicada: **cimientos** (perfil v2, motor con guion, azar con semilla, herramientas de prueba), **modo historia** "La otra Linda" (guion, personajes, escenarios y el motor que lo ejecuta), **gráficos** (animaciones, ambiente por mapa, postproceso, calidad Alta o Ahorro, título nuevo) y **dinámica del arcade** (Luz de pareja, eventos de mitad de partida, combos, metas, alcancía, Maitena, accesibilidad). Las mediciones de cada trabajo están en `tools/mediciones.md`.

---

## 1. Qué es

Es un juego cooperativo para dos, del estilo de Vampire Survivors, para jugar cada uno en su celular (o en la compu), en tiempo real. Thomas y Rocío aguantan oleadas de gatos que manda **Linda**, la gata mala, hasta derrotarla a los 7 minutos (arcade), o juegan los nueve capítulos del modo historia.

- **Para jugar (versión publicada, todavía la 1):** https://rorobakery.vercel.app/gatos/ (no pide cuenta)
- **Código:** https://github.com/thomasmartinez00018-create/rorobakery, carpeta `gatos/`. Producción sale de la rama `claude/hola-55y4vl`; la 2.0 está en `gdl/v2` y no se publicó.
- **Publicación:** proyecto `rorobakery` en Vercel (id `prj_FdNQqZxTt6YNe89grBav1U1Z3wGw`, equipo `team_8M2HdN9OWfYJgDj5kNli7Kg1`)
- **Otros contenidos del mismo repo:**
  - La raíz es la web de **Roro's Bakery**, la pastelería de Rocío. No se toca.
  - `/juego/` es **Expediente a Dos**, el primer juego que se hizo: un misterio cooperativo en 3D pixel art. Quedó como alternativa porque no resultó "viciable".

## 2. Para quién es y datos personales usados

**Jugadores:**
- **Thomas.** Pelo oscuro con rulos y degradé, musculosa negra "FOREVER", jogging gris con rayas blancas, ojotas azul marino con blanco. Hace kickboxing en el **Team Bielli** (9 de Julio 2340, Los Polvorines). En el juego pelea cuerpo a cuerpo con la Patada Bielli. Ropa desbloqueable: la del Team Bielli.
- **Rocío**, su novia. Pelo largo oscuro, remera lila, collar. Es pastelera y tiene Roro's Bakery. En el juego ataca a distancia con medialunas y tortas. Ropa desbloqueable: el delantal de Roro's.

**Mascotas, que aparecen como armas:**
- **Juli:** gato gris y blanco, peludo, de ojos verdes, muy mimoso. Gira alrededor del jugador. En la historia evoluciona a **Juliano Benito Mostacholi**.
- **Romero:** caniche toy rojizo, inquieto. Sale corriendo a morder. En la historia evoluciona a **Monsieur Gomeghooo**.

**Villanas (jefas):**
- **Luz:** gata atigrada de panza naranja y malhumorada, de la casa de la abuela. En el arcade aparece a los 3:30; en la historia es la jefa del capítulo 5.
- **Linda:** gata atigrada de pelo largo con babero blanco, la mamá de Juli y muy mala. Es la jefa final del arcade, a los 7:00.
- **La otra Linda:** la caniche crema de la abuela, "la buena". Jefa del capítulo 7 de la historia.

**Personajes de la historia:** Carmelo (chico perdido en la plaza), el Chema y Amanda (gatos de la familia), Corbata (perro negro con pecho blanco de la abuela), Maitena (13 años, invicta, del Team Bielli), la gata Linda (en la historia también aliada), el comisario.

**Zona:** Malvinas Argentinas / San Miguel / Los Polvorines.

**Lo que pidió el usuario a lo largo del proyecto:**
1. Un juego para dos, cada uno en su celu, en tiempo real.
2. Muy buenos gráficos, animaciones y ambientación, que se sienta una experiencia completa.
3. Que sea "viciable": para tirarse a jugar los dos en la cama.
4. Más dificultad, pero "pensada, no a lo loco", con mejores dinámicas y habilidades.
5. Lugares reales de la zona, armados en lo posible con fotos reales.
6. Un modo historia con la familia, los animales y los lugares reales.

**Estilo que espera de las respuestas:** directo, sin relleno, en español rioplatense, sin guion largo.

## 3. Cómo se juega

### Arcade

- **Armar la partida:** uno toca **Jugar de a dos** y comparte el código de 4 letras (o el link `?sala=XXXX`); el otro entra con **Unirme**. También se puede jugar solo.
- **Movimiento:** joystick flotante que aparece donde apoyás el dedo. En la compu, WASD o flechas.
- **Ataque:** las armas atacan solas.
- **Esquive:** botón celeste, o Shift / K en la compu. Salto corto con 0,35 s de invulnerabilidad y 2,4 s de recarga.
- **Especial:** botón grande, que se carga matando gatos. Thomas tiene **Combo** (onda alrededor); Rocío, **Tortas** (lluvia de 10 tortas). Si los dos lo tiran con menos de 2,5 s de diferencia sale el **Combo de pareja**: x1,7 de daño y +30 de vida para los dos. Cuando la pareja tiene el especial listo aparece un aviso arriba del botón.
- **Llamá a Maitena** (botón violeta, tecla M): se desbloquea en el capítulo 4 de la historia. En el arcade aparece si **cualquiera de los dos** la desbloqueó. La carga es compartida (en el arcade, 250 gatos; en la historia, 60). Si los dos lo tocan con menos de 2,5 s de diferencia sale doble (más radio y x1,5 de daño). Maitena entra corriendo, tira tres patadas giratorias que aturden 2 s y se va.
- **Juntos:** a menos de 72 px uno del otro aparece un hilo de corazón y los dos pegan +20%. Con el hilo se activan los **combos de pareja entre armas** (siempre arma de uno con arma del otro): medialuna que cruza un charco de mate sale mojada (x1,5 y frena), gato pateado que cae en una explosión de torta recibe x2, gato que Juli arañó lo muerde el Romero de la pareja con x3.
- **Subir de nivel:** el juego se pausa y **cada uno elige** entre 3 mejoras. Un arma nueva que la pareja ya tiene sale menos; una que combina con las de la pareja sale más y la tarjeta lo dice.
- **Caer y levantarse:** si uno cae, el otro lo levanta quedándose al lado 2,2 s. Vuelve con el 45% de la vida y 2 s de invulnerabilidad. Si caen los dos, se pierde.
- **Segunda chance con Linda** (una por partida): si caen los dos mientras Linda está viva, llega un pedido de Roro's de emergencia, se levantan con 30% de vida y Linda frena 5 s. Ganar así paga x1,25 en vez de x1,5.
- **Arranque rápido:** desde la segunda partida de arcade de la sesión (la revancha), el reloj arranca en 0:30 con una mejora para elegir.
- **Evento de mitad de partida** (a las 4:40 si no hay jefa viva, 30 s), uno por mapa: Plaza, Corbata se escapó y embiste gatos; Estación, apagón; Feria, liquidación (caen cajones); Team Bielli, sparring con un élite de guantes; Cancha, riego; Tortugas, promo 2x1; Terrazas, salida del cine (los autos pasan cada 5 s). Los mapas de la historia usan el de Corbata. Se ve en el cartel del objetivo con su cuenta regresiva.
- **Gato ladrón:** desde las 5:00 aparece un gato que se roba la experiencia del piso y escapa. Si lo agarran, la suelta.
- **Metas (estrellas por mapa):** la del evento de mitad de partida, entregar los 3 pedidos de Roro's y ganar sin que nadie caiga. Una meta nueva paga monedas extra.
- **Alcancía de la pareja:** lo ganado en partidas de a dos se suma a la alcancía (no se gasta). A los 1200 se habilita **Picante** (gatos con 25% más de vida y daño, 40% más de monedas) y a los 3000 **Sin fin** (después de Linda la partida sigue; cuenta como victoria). Se prenden en la sala.
- **Ganar:** matar a Linda.
- **Monedas:** se ganan en cada partida y se gastan en el **Taller** (mejoras permanentes) y en desbloquear mapas.
- **HUD:** abajo a la izquierda, armas y pasivas con su nivel (**EVO** si ya evolucionó). Si un gato avisa un ataque fuera de cámara y cerca tuyo, aparece una flecha roja en el borde. Con poca vida, viñeta roja que late.
- **Pausa** (II, Escape o P): seguir, sonido, música, vibración, **calidad** (Alta o Ahorro), **ver más** (cámara más alejada), **botones grandes**, **para zurdos** y salir al menú. Jugando solo frena el juego, y se pausa sola si cambiás de app. De a dos, la partida sigue.
- **Si se corta la conexión:** a los 4 s la mejora de la pareja se elige sola, a los 6 s aparece el aviso "Tu pareja no responde" y a los 25 s el anfitrión sigue solo. Si se cae la sala, el invitado vuelve al menú.
- **En el celu:** la pantalla no se apaga durante la partida (Wake Lock) y el celu vibra con golpes, caídas y cajas (solo en Android; se puede apagar desde la pausa).

### Modo historia: "La otra Linda"

Siete capítulos, un prólogo y un epílogo (`js/story.js`; resumen narrativo en `HISTORIA.md`). Se juegan solo o de a dos; de a dos se pueden jugar los capítulos que tenga **cualquiera de los dos** celus. Cada capítulo tiene diálogos con retrato (los dos tienen que tocar para avanzar; si uno no toca, la línea pasa sola), un objetivo propio en el HUD, pistas y subtítulos, y termina con 1 a 3 estrellas (ganar; nadie cayó; ningún aliado cayó ni se perdió nada).

| Capítulo | Mapa | Objetivo |
| --- | --- | --- |
| Prólogo. La víspera | Roro's Bakery | Defender el horno y la mesa de tortas 90 s |
| 1. El superhéroe en pijama | Plaza Mitre | Escoltar a Carmelo hasta la catedral |
| 2. Tres trenes | Estación Los Polvorines | Aguantar tres trenes y rescatar a Amanda |
| 3. ¡Gomeghooo! | Feria Persa | Encontrar tres rastros de Romero |
| 4. Sangre de campeón | Team Bielli | Aguantar 5 minutos; entra Maitena |
| 5. Luz no declara | La casa de la abuela | Pelea de pareja contra Luz (que se rinda) |
| 6. La torre blanca | Tortugas Open Mall | Cruzar, rescatar al Chema y proteger a la gata Linda |
| 7. La otra Linda | Terrazas de Mayo | Jefa en tres fases: premios, carritos y berrinche |
| Epílogo. Día de la Madre | Roro's Bakery | Escena final |

**Desbloqueos para el arcade:** mapa Roro's (prólogo), ropa Team Bielli y especial Maitena (capítulo 4), mapa de la casa de la abuela y "Corbata te acompaña" (capítulo 5), delantal de Roro's (epílogo).

## 4. Contenido

### Armas (máximo 5 por jugador, cada una hasta nivel 5)

| Arma | Qué hace | Evoluciona con | Evolución |
| --- | --- | --- | --- |
| Patada Bielli (inicial de Thomas) | Arco hacia donde mirás; desde nivel 3, a los dos lados | Guantes de box | Patada Voladora: 360°, más grande, empuja |
| Medialunas (inicial de Rocío) | Al gato más cercano; atraviesa desde nivel 4 | Mate amargo | Docena de Medialunas: abanico de 6 |
| Juli | Gira alrededor y araña | Abrazo | Juli Mimosa: 4 Julis que curan al arañar |
| Romero | Corre a morder | Zapatillas | Romero Desatado: más rápido, mordida en área |
| Mate hirviendo | Charcos que queman | Termo | Pava Hirviendo: 2 charcos gigantes que frenan |
| El 315 | Pasa un colectivo | Imán | 315 Expreso: dos colectivos, más seguido |
| Palo de amasar | Va y vuelve atravesando | Vendas | Rodillo de Acero: 4 en cruz |
| Torta bomba | Explota al caer | Delantal de Roro | Torta de Tres Pisos: suelta 3 tortas más |

En la dinámica se subieron Juli y el Palo de amasar al nivel del resto (banco de armas en `tools/mediciones.md`). **Evolución:** arma en nivel 5 + su pasiva + abrir una **caja de Roro's**. Si no se cumple, la caja sube un arma de nivel; si ya está todo al máximo, da vida llena y 5 monedas.

### Pasivas (máximo 5)

| Pasiva | Efecto |
| --- | --- |
| Guantes | +15% de daño |
| Zapatillas | +8% de velocidad |
| Termo | +0,45 de vida por segundo |
| Imán | Alcance de recolección x1,25 |
| Mate amargo | Recarga -7% |
| Abrazo | +20 de vida máxima |
| Delantal de Roro | +10% de área |
| Vendas | -7% de daño recibido |

### Enemigos

Todos los ataques se anuncian antes con un **!** y un parpadeo.

| Gato | Vida | Velocidad | Daño | Comportamiento |
| --- | --- | --- | --- | --- |
| Gato (gris) | 10 | 30 | 6 | Básico |
| Negro | 22 | 38 | 8 | Rápido |
| Paloma | 6 | 70 | 5 | Bandadas que cruzan en línea recta |
| Gordo (naranja) | 60 | 21 | 12 | Tanque |
| Saltarín (naranja y blanco) | 16 | 31 | 9 | Se agacha 0,5 s y salta en línea recta |
| Escupidor (siamés) | 18 | 26 | 5 | Mantiene distancia, carga 0,6 s y escupe; solo si el que recibe lo ve |
| Gata madre (tricolor) | 40 | 23 | 8 | Al morir suelta 3 gatitos |
| Gatito | 4 | 50 | 3 | Sale de la madre |
| Cajón | 24 | 0 | 0 | Se rompe y suelta monedas, alfajor, imán o manguera |
| Sparring (arcade, Team Bielli) | 26 | 34 | 10 | Jab doble con aviso |
| Ladrón (arcade, desde 5:00) | 14 | 40 | 4 | Se roba gemas y escapa |
| Gato con guantes (historia) | 26 | 34 | 10 | Jab doble con aviso |

- **Élite:** cada unos 40 a 58 s (menos cuando hay un jefe). Tiene x8 de vida, es más grande y dorado, y suelta una caja de Roro's.
- **Luz** (arcade, 3:30): **pelea de pareja**. Marca a uno con una línea roja y carga contra él; si a mitad de la carga la pareja del marcado está a menos de 72 px, se frena y queda **aturdida 2 s recibiendo el doble**. Jugando solo, esquivar justo cuando arranca cumple ese papel. Con menos de la mitad de vida carga dos veces seguidas. Tiene x1,8 de vida respecto de la versión 1.
- **Linda** (arcade, 7:00) tiene tres fases: bolas de pelo de a tres; desde el 66%, abanico, círculos rojos que explotan y madres y saltarines; desde el 33%, anillo de 20 bolas con un hueco. Tiene x1,7 de vida y x1,5 de daño respecto de la versión 1.
- **Luz de la historia** (luz2): la misma idea de pareja (comparten `Sim.mateHolds`), pero chequea al terminar el aviso, a 28 px, y jugando solo la frena la cucha de Corbata. Se rinde en vez de morir.
- **La otra Linda** (canicheBoss, historia): premios que agrandan a los gatos, carritos del Carrefour y ondas de berrinche con huecos.

### Ajuste de dificultad

- **Hordas:** a los 2:30 y a los 5:30 llega un anillo de 40 gatos con dos huecos de salida.
- **Ajuste automático:** si uno está caído, salen la mitad de gatos. Si van con más nivel del esperado (1 + segundos/16), salen hasta un 25% más.
- **Respiro:** después de que aparece o muere un jefe, salen menos gatos durante unos segundos.
- **Pedido de Roro's** (1:35, 4:10 y 6:05): una caja en el mapa y 32 s para cargarla parados encima. Solo tarda unos 5 s (3 s jugando en solitario); los dos juntos, 2 s.
- **Objetos de los cajones:** **Imán** junta toda la experiencia del mapa. **Manguera** moja a los gatos en 150 px.

### Mapas

Cada mapa tiene un **nivel de dificultad** (tier) y un peligro que cruza la pantalla, siempre anunciado con una franja roja; el peligro le pega a todos, jugadores y gatos.

| Mapa | Nivel | Costo | Peligro | Base visual |
| --- | --- | --- | --- | --- |
| Plaza Mitre | 0 | gratis | sin peligro (más palomas) | Plaza con fuente, jacarandás y faroles |
| Estación Los Polvorines | 1 | 60 | Tren Belgrano Norte | Belgrano Norte, que es rojo |
| Feria Persa | 2 | 120 | Fletero | **Fotos reales** |
| Team Bielli | 3 | 150 | Fila de la entrada en calor | **Fotos reales** del Instagram del team |
| Cancha del Trueno Verde | 3 | 180 | Cortadora de césped | Inventado |
| Tortugas Open Mall | 4 | 260 | Carritos del súper | Descripciones escritas |
| Terrazas de Mayo | 5 | 350 | Autos | Descripciones escritas |
| Roro's Bakery (historia) | 1 | se gana en el prólogo | Bandejas | Inventado |
| La casa de la abuela (historia) | 3 | se gana en el capítulo 5 | Corbata cruzando | Inventado |

**Detalles de los mapas armados con referencias** (Feria Persa, Team Bielli, Tortugas, Terrazas): ver el historial de la versión 1; las zonas caminables y los carriles se ajustaron a los mapas rehechos con fotos (`GEO` en `maps.js` y `MAPS[x].b` en `engine.js`). **Thomas juega de local** en el Team Bielli: +15% de daño.

**Limitación técnica:** desde el entorno de trabajo no se pueden descargar imágenes de internet. Los mapas se arman mirando fotos que pasa el usuario, o con descripciones escritas.

### Progreso guardado

Se guarda en cada dispositivo (localStorage, clave `gdl-profile`; las preferencias van en `gdl-music`, `gdl-mute`, `gdl-vib`, `gdl-zoom`, `gdl-bigbtn`, `gdl-zurdo` y la calidad de gráficos). El perfil es v2 (`js/profile.js`): un perfil v1 se migra solo conservando todo y el original queda copiado en `gdl-profile-v1`. En el Taller, "Código de respaldo" copia el perfil como texto para recuperarlo en otro celu.

- **Claves del perfil:** `coins`, `up` (Taller), `maps`, `best`, `wins`, `runs`, `story` (`cap` = capítulo disponible, `done` con estrellas, `seen` = escenas vistas), `unlock` (desbloqueos de la historia: `map:roros`, `map:abuela`, `skin:bielli`, `skin:roros`, `special:maitena`, `ally:corbata`), `skin`, `corbataOn` y `arcade` (dinámica: `alc` alcancía, `metas[mapa]`, `win1[mapa]` primera victoria, `opt` opciones de la alcancía). `unlock` y `arcade` son claves distintas y no se pisan.
- **Monedas por partida** (`coinsFor` en `engine.js`): (juntadas + gatos/12 + segundos/20) x1,5 si ganan (x1,25 con la segunda chance) x (1 + nivel del mapa x 0,12) x1,4 en Picante. Más 150 x (1 + nivel x 0,12) la primera vez que ganan en un mapa y 40 por meta nueva.
- **Taller:** Vida (+10), Fuerza (+8%), Velocidad (+5%) e Imán (+15%), hasta nivel 5. Cuestan 25, 50, 100, 180 y 300 (x1,5 desde la dinámica, porque ganar paga x1,5).

## 5. Números del motor (`js/engine.js`)

La curva del arcade está en un solo lugar, `DIFF`, calibrada con los bots (los bots la pueden pisar con `DIFF='{"hp":1.1}'`).

| Qué | Fórmula o valor |
| --- | --- |
| Mundo | 1024 x 1024 px, cada mapa con su zona caminable (`MAPS[x].b`) |
| Vida de los gatos | base x (1 + t/130 + (t/270)²) x (1 + nivel del mapa x 0,04); solo, x0,85 |
| Vida de los jefes | base x (1 + nivel del mapa x 0,06) x (1 + nivel del equipo x 0,08); solo, x0,7; Luz x1,8 y Linda x1,7 |
| Daño de los gatos | base x (1 + t/250) x (1 + nivel del mapa x 0,03); élite x1,4; Linda x1,5 |
| Ritmo de aparición | min(9, 0,9 + t/34) gatos/s x ajuste x (1 + nivel del mapa x 0,02); solo x0,72; tope de 220 en pantalla |
| Experiencia para el próximo nivel | floor(5 + nivel x 4 + nivel^1,75) |
| Jugador | 100 de vida (+10 por mejora), velocidad 62, imán 26 px |
| Revivir | 2,2 s a menos de 24 px |
| Golpe crítico | 8%, daño x2 |

**Balance con bots** (`tools/`, ver sección 7 y `tools/mediciones.md`). El bot perfecto esquiva casi perfecto; el casual elige mejoras al azar ponderado y decide cada 0,3 s, más parecido a una persona. Objetivo de la dinámica: casual de a dos entre 35 y 60% de victorias en la Plaza y entre 15 y 35% en Terrazas; perfecto de a dos no más de 95% en la Plaza. Los números de la integración están en la sección 7. **Falta validar con personas.**

## 6. Cómo está hecho

**Base técnica:**
- Sitio estático, sin build, en `gatos/`. Las librerías y fuentes están copiadas en el repo.
- Canvas 2D en baja resolución, escalado sin suavizado (pixel art).
- Sprites dibujados por código, píxel a píxel (`js/sprites.js`), con contorno automático, espejados y versiones en blanco para el destello. Incluye los personajes de la historia, retratos de diálogo y las skins.
- **Gráficos 2.0** (`js/render.js` y `AMBIENCE` en `maps.js`): animaciones de golpe, patada, lanzar, esquive y caído; muertes con "pop" y hit-stop; partículas en un pool fijo (`R.fx`, arrays tipados); ambiente por mapa (partículas, tinte, viñeta, luces que titilan); postproceso barato (gradación horneada en el mapa, brillos cacheados, sombras suaves para jugadores, aliados, jefas y élites); transiciones pixeladas entre pantallas (`R.wipe`); números con jerarquía; viñeta roja de poca vida; insignia de la pareja fuera de cámara. **Calidad Alta o Ahorro** (`R.setQuality`, en la pausa): Ahorro saca brillos, gradación y partículas de ambiente para celus que se traban. Firma de dibujo del jugador: `drawPlayer(g, p, side, isMe, X, Y, dt)`.
- **Noche:** una capa (noche + tinte + viñeta, cacheada por mapa y tamaño) con huecos de luz. En el apagón del arcade se cierra más.
- **Física:** grilla espacial de 32 px para colisiones y para que los gatos no se amontonen.
- **Audio:** música chiptune y sonidos sintetizados en vivo con WebAudio.

**Motor con guion** (`makeGuion` y `ARCADE` en `engine.js`): el arcade es un guion (jefes, hordas, pedidos, élites, cajones, palomas, peligros, ritmo, mezcla, evento de mitad de partida `mid`, arranque rápido `fast`, segunda chance `second`, victoria y derrota). Un capítulo se convierte en guion con `chapterGuion` (que delega en `storyGuion` de `js/historia.js`) y ahí `mid`, `fast` y `second` quedan apagados. El azar usa semilla (`mulberry32`): la misma semilla repite la partida.

**Runtime de la historia** (`js/historia.js`): `installStory` se instala sobre `Sim` al final de `engine.js` y pisa `begin`, diálogos, objetivos, aliados, especiales y la foto. Sin historia (arcade sin aliados, objetivo ni especiales) se comporta como el motor de siempre y no consume azar: los aliados del arcade (Corbata del evento de la Plaza) usan los métodos originales del motor (`_o.addAlly`, `_o.hurtAlly`, `_o.updateAllies`). Resuelve objetivos (defend, escort, survive, trains, track, boss, reach, protect, none), disparadores (start, goalNN, goalDone, allyDown, bossPhase2/3, step:N, tag:X, rescue), los tipos nuevos, los aliados y el especial de Maitena (`pressMaitena`, `callMaitena`, `maitenaTick`, `maiTick`), que es **uno solo para la historia y el arcade**.

**Ids de tipos** (viajan en la foto, nunca se reordenan): 0 a 10 los de siempre; 11 a 16 aliados (carmelo, corbata, gatalinda, maitena, chema, amanda); 17 a 23 historia (guantes, luz2, canicheBoss, premio, juli, romero, caniche); 24 a 29 libres; 30 y 31 dinámica (sparring, ladron). `ENEMY_NAME` es un arreglo con huecos. `FUR` de `render.js` tiene color para 0 a 10, 17 a 20, 30 y 31 (los aliados se dibujan con su propio sprite).

**Banderas de cada gato en la foto:** 1 destello, 2 aviso, 4 élite, 8 embestida, 16 mojado, 32 izquierda y 64 caído (aliados), 128 marcado por Amanda, 256 agrandado por un premio, **512 aturdido** (Luz frenada, luz2, noqueados por Maitena; el mismo bit en `engine.js` y `historia.js`), 1024 rendida, 2048 ladrón con gemas. En aliados, 128, 256 y 512 son llora, corre y patea.

**Red (PeerJS / WebRTC P2P):**
- **Sala:** el anfitrión crea un código de 4 letras (prefijo `gatos-de-linda-v2-`). `hello` y `lobby` llevan `proto` (`PROTO` en `net.js`, hoy **3**): si no coincide, la sala pide "Actualizá la página" y no arranca.
- **Simulación:** la corre **solo el anfitrión**. Manda una foto del estado 20 veces por segundo, con los eventos acumulados.
- **Movimiento del invitado:** se mueve localmente y manda su posición y el tamaño de su pantalla (`vw`, `vh`); los gatos aparecen justo afuera de lo que ve cada uno.
- **Mensajes del anfitrión al invitado:** `lobby {who, map, cap, avail, proto}`, `start {map, chars, cap, skins, opts}` (opts: Maitena y Corbata en el arcade), `s {snapshot}`, `cap {id, n, stars}` (capítulo ganado), `menu`.
- **Mensajes del invitado al anfitrión:** `hello {who, meta, proto, cap, skin}` (meta lleva el Taller y `maitena` si la desbloqueó), `in {pos, face, moving, ult, dash, mt, vw, vh}` (mt: tocó Maitena), `pick {i}`, `adv {skip, c}` (diálogo y opción de la pregunta).
- **Foto del estado:** `E` gatos (6 números: id, tipo, x, y, banderas, ángulo), `A` aliados (mismo formato), `B`, `H`, `G`, `K`, `U`, `M`, `Bu`, `Z`, `Hz`, `ob`, `tg`, `P` jugadores (con `sk` skin), `boss` (con `mk` marcado y `ph` fase), `of`, `ev`, `dlg`, `goal`, `cam`, `cap`; historia: `hn` pista, `tk` subtítulo, `Wv` ondas, `mai` (carga, quién armó, activa), `sr` estrellas, `eb`; dinámica: `md` (evento de mitad de partida, segundos, cuenta) y al terminar `mt` metas, `sc`, `won`, `hot`.

**Archivos:**

| Archivo | Qué tiene |
| --- | --- |
| `index.html` | Canvas, zona táctil, HUD, modal de nivel, interfaz |
| `js/engine.js` | Simulación y reglas del arcade, tablas (`MAPS`, `HAZ`, `ENEMY`, `ALLY`, `DIFF`, `LUZ_PAR`, `METAS`, `ALCANCIA`, `MAITENA`, `COMBO`) |
| `js/historia.js` | Runtime del modo historia (se instala sobre `Sim`) |
| `js/story.js` | Guion de "La otra Linda": capítulos, diálogos, objetivos, eventos, desbloqueos |
| `js/maps.js` | `THEMES`, `GEO`, `AMBIENCE` y `buildMap` de los 9 mapas |
| `js/sprites.js` | Pixel art: personas, gatos, perros, objetos, vehículos, escenografía, retratos |
| `js/render.js` | Dibujo por cuadro, efectos, avisos, luces, postproceso y transiciones |
| `js/main.js` | Menús, salas, capítulos, bucle, sincronización, HUD, taller y resultados |
| `js/profile.js` | Perfil v2, migración y código de respaldo |
| `js/net.js` | Envoltorio de PeerJS y `PROTO` |
| `js/input.js`, `js/sfx.js`, `js/music.js` | Joystick y teclado, efectos, música |
| `css/app.css` | Interfaz pixel (incluye accesibilidad y el botón de Maitena) |

**Agregar un mapa nuevo:**
1. Entrada en `MAPS` y, si tiene peligro, en `HAZ` (`engine.js`; los nuevos siempre al final).
2. Tema, `GEO`, `AMBIENCE` y bloque de dibujo en `maps.js`.
3. Costo en `MAP_COST` y cartel en `HZ_BANNER` (`main.js`); si tiene evento propio, `MID_OF` y `METAS` en `engine.js`.
4. Sprites nuevos en `sprites.js` y el dibujo del peligro en `drawHazard` (`render.js`).

## 7. Cómo se prueba

**Todo junto:** `node gatos/tools/test.mjs` corre `test_perfil`, `test_guion`, `test_historia` y `test_dinamica` en Node y, si el juego está servido en `http://127.0.0.1:8811/`, `test_navegador` y `test_historia_nav` en Chromium (otro puerto: `URL=http://127.0.0.1:PUERTO/`). Las de navegador necesitan `npm ci` en `tools/` y un PeerServer local.

```sh
cd gatos && python3 -m http.server 8811      # el juego
npx peer --port 9000                         # para jugar de a dos sin internet
cd gatos/tools && npm ci && node test.mjs
```

Abrir `http://127.0.0.1:8811/?debug` deja `window.__g()` en la consola (`{ sim, snap, me, R, prof, input }`). De a dos sin internet: `?peer=127.0.0.1:9000`, con dos contextos o perfiles del mismo navegador.

| Prueba | Qué cubre |
| --- | --- |
| `test_perfil.mjs` | Perfil v1 a v2, respaldo, perfiles rotos |
| `test_guion.mjs` | Arcade idéntico byte a byte al motor de referencia `038a90f` (último commit de la dinámica) con la geometría nueva, la marca de Luz como `lmark` y las banderas 512 y 2048; semilla y guiones chicos |
| `test_historia.mjs` | Diálogos, los 9 objetivos, aliados, especiales y los capítulos reales con bots |
| `test_dinamica.mjs` | Los cambios de la dinámica (ids, Luz de pareja, eventos, ladrón, arranque rápido, combos, roles, segunda chance, monedas, metas, Maitena unificada) y la integración con la historia (banderas sin choques, ids con nombre, la historia sin la dinámica del arcade) |
| `test_navegador.mjs` | Chromium real: perfil, respaldo, arcade 30 s, tope de 60 cuadros, de a dos con PeerServer, versión distinta |
| `test_historia_nav.mjs` | Chromium real: capítulos, prólogo y capítulo 1 completos solo, capítulo 5 completo de a dos, capturas |
| `prueba_dinamica.mjs` | Chromium real: 2 minutos de arcade y capturas de todo lo de la dinámica |
| `prueba_final.mjs` | Chromium real, prueba de la integración: título, menú, arcade 2 min solo con Maitena, prólogo completo, capítulo 1 hasta el primer diálogo; de a dos, arcade 1 min y capítulo 5 completo. Capturas `final-*.png` |

**Bots:** `run_batch.mjs <mapa> <duo|solo> <N> [policy] [react]` (perfecto: `builder 0`; casual: `casual 0.3`), `bateria.mjs` (los dos bots en los 7 mapas sobre una copia congelada de `engine.js` e `historia.js`), `curva.mjs`, `calibrar.mjs`, `resumen.mjs`, `bot_historia.mjs [N] [capítulo]` (capítulos solo, de a dos y con un jugador quieto para ver que se pueden perder), `weapons_bench.mjs`, `perf.mjs`, `render_bench.mjs`, `app_bench.mjs`. **La Mac se comparte con otros sistemas:** de a un proceso pesado y un navegador headless por vez.

**Bots después de la integración** (20 partidas por configuración en el arcade, semillas fijas; 4 por capítulo en la historia):

| Configuración | Integración | Lo que midió la rama | Nota |
| --- | --- | --- | --- |
| Arcade, casual de a dos, Plaza | 35% (7/20); 48% con 40 partidas | 45% (dinámica) | Dentro del objetivo (35 a 60%) |
| Arcade, casual de a dos, Terrazas | 5% (1/20); 5% con 40 partidas | 15% (dinámica) | **Debajo del objetivo (15 a 35%)** |
| Arcade, perfecto de a dos, Plaza | 95% (19/20) | 95% (dinámica) | Igual |
| Arcade, perfecto de a dos, Terrazas | 75% (15/20) | 75% (dinámica) | Igual |
| Historia, capítulos 0 a 8 | Todos ganados solo y de a dos (solo, 3/4 en los capítulos 1, 3 y 7) | Todos completables (historia) | Con un jugador quieto se pierden todos (el epílogo es una escena) |

La diferencia del casual no viene del motor: `test_guion` da el arcade idéntico byte a byte al de la dinámica, y el motor de la dinámica (038a90f) con las zonas caminables nuevas de la historia (GEO) da exactamente los mismos resultados que la integración (7/20 y 1/20). Con su geometría vieja da 9/20 y 3/20. Las zonas caminables más chicas de Plaza y Terrazas hacen el arcade un poco más difícil para el bot casual; en Terrazas lo deja fuera del objetivo. Pendiente: recalibrar Terrazas con `bateria.mjs` (40 partidas).

## 8. Cómo se publica

- Vercel **no** publica solo desde la rama: se publica a producción a mano desde `claude/hola-55y4vl` (API de Vercel o "Redeploy" en el panel).
- La 2.0 está en `gdl/v2`. Para publicarla hay que llevarla a `claude/hola-55y4vl` y publicar a mano; antes, ver la lista de riesgos de la sección 10.
- Las vistas previas de Vercel piden iniciar sesión; por eso se usa producción, que es pública.
- **Riesgo:** `main` no tiene los juegos. Si alguien publica `main`, desaparecen `/gatos` y `/juego`. **Recomendado: unir la rama a `main`.**

## 9. Historia del proyecto

| Commit | Qué se hizo |
| --- | --- |
| `e14025c`, `c7338f9`, `1f6df26`, `4f8511d` | Expediente a Dos, el misterio 3D. Se descartó como juego principal por poco "viciable". |
| `968baf4` | Primera versión de Gatos de Linda: 3 mapas, 8 armas, 6 pasivas, Luz y Linda. |
| `5e980a8` | Dificultad pensada: avisos, fases de jefas, evoluciones, esquive, combo de pareja, pedido de Roro's, peligros y 3 mapas nuevos. |
| `09c50e0` | Feria Persa rehecha con fotos reales y nuevo mapa Team Bielli. |
| `aab3973` | Conexión que no se traba, gatos fuera de cámara, pausa, armas en pantalla, Wake Lock y vibración. |
| `8bba9e4` | Cimientos de la 2.0: perfil v2, motor con guion, azar con semilla, herramientas y pruebas. |
| `13b187b` | Integración del modo historia (personajes, escenarios, guion, runtime e interfaz) y gráficos. |
| merge de `gdl/dinamica` | Dinámica del arcade integrada sobre historia y gráficos (este archivo describe el resultado). |

## 10. Pendientes, ideas y riesgos antes de publicar

1. **Probar con personas** (sobre todo la Luz de pareja, los combos y la dificultad de los capítulos 1, 3 y 7 jugando solo) y ajustar con lo que digan.
2. **Pedir fotos de Tortugas y Terrazas** para que queden tan fieles como la Feria.
3. **Unir la rama a `main`.**
4. **Riesgos conocidos de la 2.0:** el casual de a dos en Terrazas quedó en 5% (sección 7); el arcade en los mapas de la historia usa el evento de Corbata; con "Corbata te acompaña" prendido en la Plaza hay dos Corbatas durante el evento y la meta cuenta los gatos de las dos; la versión publicada (v1) y la 2.0 no pueden jugar juntas (`PROTO` distinto, avisa "Actualizá la página").
5. Ideas: logros, más personajes jugables, eventos propios para Roro's y la casa de la abuela en el arcade.
