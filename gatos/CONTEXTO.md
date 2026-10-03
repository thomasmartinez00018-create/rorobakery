# Gatos de Linda: contexto completo del proyecto

Este archivo junta todo lo necesario para seguir trabajando en el juego sin la conversación original: para quién es, qué decisiones se tomaron, cómo está hecho, números de balance, cómo se prueba y se publica, y qué queda pendiente.

---

## 1. Qué es

Es un juego cooperativo para dos, del estilo de Vampire Survivors, para jugar cada uno en su celular (o en la compu), en tiempo real. Thomas y Rocío aguantan oleadas de gatos que manda **Linda**, la gata mala, hasta derrotarla a los 7 minutos.

- **Para jugar:** https://rorobakery.vercel.app/gatos/ (no pide cuenta)
- **Código:** https://github.com/thomasmartinez00018-create/rorobakery, rama `claude/hola-55y4vl`, carpeta `gatos/`
- **Publicación:** proyecto `rorobakery` en Vercel (id `prj_FdNQqZxTt6YNe89grBav1U1Z3wGw`, equipo `team_8M2HdN9OWfYJgDj5kNli7Kg1`), en producción desde esa rama
- **Otros contenidos del mismo repo:**
  - La raíz es la web de **Roro's Bakery**, la pastelería de Rocío. No se toca.
  - `/juego/` es **Expediente a Dos**, el primer juego que se hizo: un misterio cooperativo en 3D pixel art. Quedó como alternativa porque no resultó "viciable".

## 2. Para quién es y datos personales usados

**Jugadores:**
- **Thomas.** Pelo oscuro con rulos y degradé, musculosa negra "FOREVER", jogging gris con rayas blancas, ojotas azul marino con blanco. Hace kickboxing en el **Team Bielli** (9 de Julio 2340, Los Polvorines). En el juego pelea cuerpo a cuerpo con la Patada Bielli.
- **Rocío**, su novia. Pelo largo oscuro, remera lila, collar. Es pastelera y tiene Roro's Bakery. En el juego ataca a distancia con medialunas y tortas.

**Mascotas, que aparecen como armas:**
- **Juli:** gato gris y blanco, peludo, de ojos verdes, muy mimoso. Gira alrededor del jugador.
- **Romero:** caniche toy rojizo, inquieto. Sale corriendo a morder.

**Villanas (jefas):**
- **Luz:** gata atigrada de panza naranja y malhumorada, de la casa de la abuela. Aparece a los 3:30.
- **Linda:** gata atigrada de pelo largo con babero blanco, la mamá de Juli y muy mala. Es la jefa final, a los 7:00.

**Otros animales de la casa de la abuela,** todavía sin usar: **Corbata** (perro negro con pecho blanco) y **Linda** (caniche crema; hay dos Lindas).

**Zona:** Malvinas Argentinas / San Miguel / Los Polvorines.

**Lo que pidió el usuario a lo largo del proyecto:**
1. Un juego para dos, cada uno en su celu, en tiempo real.
2. Muy buenos gráficos, animaciones y ambientación, que se sienta una experiencia completa.
3. Que sea "viciable": para tirarse a jugar los dos en la cama.
4. Más dificultad, pero "pensada, no a lo loco", con mejores dinámicas y habilidades.
5. Lugares reales de la zona, armados en lo posible con fotos reales.

**Estilo que espera de las respuestas:** directo, sin relleno, en español rioplatense.

## 3. Cómo se juega

- **Armar la partida:** uno toca **Jugar de a dos** y comparte el código de 4 letras (o el link `?sala=XXXX`); el otro entra con **Unirme**. También se puede jugar solo.
- **Movimiento:** joystick flotante que aparece donde apoyás el dedo. En la compu, WASD o flechas.
- **Ataque:** las armas atacan solas.
- **Esquive:** botón celeste, o Shift / K en la compu. Es un salto corto con 0,35 s de invulnerabilidad y 2,4 s de recarga.
- **Especial:** botón grande, que se carga matando gatos. Thomas tiene **Combo** (onda alrededor); Rocío, **Tortas** (lluvia de 10 tortas). Si los dos lo tiran con menos de 2,5 s de diferencia sale el **Combo de pareja**: ×1,7 de daño y +30 de vida para los dos.
- **Juntos:** a menos de 72 px uno del otro aparece un hilo de corazón y los dos pegan +20%.
- **Subir de nivel:** al juntar experiencia el juego se pausa y **cada uno elige** entre 3 mejoras. Se espera a que elijan los dos.
- **Caer y levantarse:** si uno cae, el otro lo levanta quedándose al lado 2,2 s. Vuelve con el 45% de la vida y 2 s de invulnerabilidad. Si caen los dos, se pierde.
- **Ganar:** matar a Linda.
- **Monedas:** se ganan en cada partida y se gastan en el **Taller** (mejoras permanentes) y en desbloquear mapas.
- **HUD:** abajo a la izquierda se ven las armas y pasivas con su nivel (**EVO** si ya evolucionó). Las primeras partidas muestran una pista de controles.
- **Pausa** (II, Escape o P): seguir, sonido, música, vibración y salir al menú. Jugando solo frena el juego, y se pausa sola si cambiás de app. De a dos, la partida sigue.
- **Si se corta la conexión:** si la pareja deja de responder, a los 4 s su mejora se elige sola, a los 6 s aparece el aviso "Tu pareja no responde" y a los 25 s el anfitrión sigue solo. Si se cae la sala, el invitado vuelve al menú.
- **En el celu:** la pantalla no se apaga durante la partida (Wake Lock) y el celu vibra con golpes, caídas y cajas (solo en Android; se puede apagar desde la pausa).

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

**Cómo se consigue una evolución:** arma en nivel 5 + su pasiva + abrir una **caja de Roro's**. Si no se cumple la condición, la caja sube un arma de nivel; si ya está todo al máximo, da vida llena y 5 monedas.

### Pasivas (máximo 5)

| Pasiva | Efecto |
| --- | --- |
| Guantes | +15% de daño |
| Zapatillas | +8% de velocidad |
| Termo | +0,45 de vida por segundo |
| Imán | Alcance de recolección ×1,25 |
| Mate amargo | Recarga −7% |
| Abrazo | +20 de vida máxima |
| Delantal de Roro | +10% de área |
| Vendas | −7% de daño recibido |

Al subir de nivel, las pasivas que completan una evolución tienen más chance de salir. Las tarjetas avisan con qué evoluciona cada cosa.

### Enemigos

Todos los ataques se anuncian antes con un **!** y un parpadeo.

| Gato | Vida | Velocidad | Daño | Comportamiento |
| --- | --- | --- | --- | --- |
| Gato (gris) | 10 | 30 | 6 | Básico |
| Negro | 22 | 38 | 8 | Rápido |
| Paloma | 6 | 70 | 5 | Bandadas que cruzan en línea recta |
| Gordo (naranja) | 60 | 21 | 12 | Tanque |
| Saltarín (naranja y blanco) | 16 | 31 | 9 | Se agacha 0,5 s y salta en línea recta |
| Escupidor (siamés) | 18 | 26 | 5 | Mantiene distancia, carga 0,6 s y escupe |
| Gata madre (tricolor) | 40 | 23 | 8 | Al morir suelta 3 gatitos |
| Gatito | 4 | 50 | 3 | Sale de la madre |
| Cajón | 24 | 0 | 0 | Se rompe y suelta monedas, alfajor, imán o manguera |

- **Élite:** cada unos 40–58 s (menos cuando hay un jefe). Tiene ×8 de vida, es más grande y dorado, y suelta una caja de Roro's.
- **Luz** (jefa a los 3:30, 1000 de vida base): marca con una línea roja por dónde va a cargar. Con menos de la mitad de vida carga dos veces seguidas. Al morir suelta una caja, un alfajor y experiencia.
- **Linda** (jefa final a los 7:00, 4200 de vida base) tiene tres fases:
  1. Bolas de pelo de a tres y llama gatos negros.
  2. Desde el 66% de vida: abanico de 5 bolas, círculos rojos debajo de cada jugador que explotan a los 1,15 s, y llama madres y saltarines.
  3. Desde el 33%: anillo de 20 bolas con un hueco para escapar, más círculos, y se mueve más rápido.

### Ajuste de dificultad

- **Hordas:** a los 2:30 y a los 5:30 llega un anillo de 40 gatos con dos huecos de salida.
- **Ajuste automático:** si uno de los dos está caído, salen la mitad de gatos para dar chance de levantarlo. Si van con más nivel del esperado (1 + segundos/16), salen hasta un 25% más.
- **Respiro:** después de que aparece o muere un jefe, salen menos gatos durante unos segundos.
- **Pedido de Roro's** (a los 1:35, 4:10 y 6:05): aparece una caja en el mapa y hay 32 s para cargarla parados encima. Uno solo encima tarda unos 5 s (3 s si se juega en solitario); los dos juntos, 2 s. Mientras se carga vienen gatos. El premio es caja, alfajor y monedas.
- **Objetos que sueltan los cajones:** **Imán** junta toda la experiencia del mapa. **Manguera** moja a los gatos en 150 px: 20 de daño, empujón y 50% más lentos durante 4,5 s.

### Mapas

Cada mapa tiene un **nivel de dificultad** (tier). Cada nivel suma +7% de vida a los gatos, +5% de daño, +4% de aparición y +12% de monedas. Cada mapa tiene además un peligro que cruza la pantalla, siempre anunciado con una franja roja. Al peligro le pega a todos, jugadores y gatos, así que se puede usar para atraer gatos.

| Mapa | Nivel | Costo | Peligro | Base visual |
| --- | --- | --- | --- | --- |
| Plaza Mitre | 0 | gratis | — (más palomas) | Inventado: plaza con fuente, jacarandás y faroles |
| Estación Los Polvorines | 1 | 60 | Tren Belgrano Norte (40 de daño, mata a los gatos al instante) | Inventado a partir del Belgrano Norte, que es rojo |
| Feria Persa | 2 | 120 | Fletero (camioneta) | **Fotos reales** del usuario (Street View y Google Maps) |
| Team Bielli | 3 | 150 | Fila de alumnos de la entrada en calor | **Fotos reales** del Instagram del Team Bielli |
| Cancha del Trueno Verde | 3 | 180 | Cortadora de césped (dos carriles) | Inventado |
| Tortugas Open Mall | 4 | 260 | Fila de 6 carritos del súper | Solo descripciones escritas, sin fotos |
| Terrazas de Mayo | 5 | 350 | Autos en el estacionamiento | Solo descripciones escritas, sin fotos |

**Detalles de los mapas armados con referencias:**
- **Feria Persa** (Av. Balbín, San Miguel; es el ex boliche "el gran castillo"):
  - Castillo con murallas almenadas, cada tramo de un color (rojo, lila, amarillo, verde, azul, rosa, turquesa).
  - Torres cilíndricas con cúpula de cebolla o punta de cono, y un rosetón blanco en el tramo verde.
  - Cartel celeste "Feria Persa" con la alfombra mágica.
  - Paredón azul con reja blanca y pasto adelante.
  - Adentro: piso gris con línea amarilla discontinua y flechas, locales de ropa con mostradores de vidrio, puestos de golosinas estilo "Don Félix" con máquina de pochoclo, maniquíes, patio de comidas con mesas y tubos de luz.
  - Abajo pasa Av. Balbín.
- **Team Bielli:**
  - Piso de encastrables amarillos y negros, pared blanca, techo de chapa y banderines de países.
  - Banners negros y amarillos ("TEAM BIELLI" y "KICK BOXING"), bolsas negras y amarillas.
  - Ring con cuerdas blancas, rojas y azules, esquinas roja y azul, y sillas blancas.
  - **Thomas juega de local:** +15% de daño en este mapa.
- **Tortugas Open Mall** (Tortuguitas, Malvinas Argentinas): locales con carteles (Coto, Cinemark, Sodimac…), cúpulas de vidrio, palmeras iluminadas, fuente, calesitas y el deck de madera de "Terrazas del Mall" sobre el lago.
- **Terrazas de Mayo** (Ruta 8 y 202, el ex "Carrefour de Ruta 8"): fachada con el cartel, Carrefour, Cinemark, bowling, Neverland, sombrillas del patio de comidas, estacionamiento gigante con autos y postes de luz, y la Ruta 8 abajo.

**Limitación técnica:** desde el entorno de trabajo no se pueden descargar imágenes de internet. Los mapas se arman mirando fotos que pasa el usuario, o con descripciones escritas cuando no hay fotos.

### Progreso guardado

Se guarda en cada dispositivo (localStorage, clave `gdl-profile`; las preferencias van en `gdl-music`, `gdl-mute` y `gdl-vib`).

- **Monedas por partida:** (monedas juntadas + gatos/12 + segundos/20 + 60 si ganaron) × (1 + nivel del mapa × 0,12).
- **Taller:** Vida (+10), Fuerza (+8%), Velocidad (+5%) e Imán (+15%), hasta nivel 5 cada una. Cuestan 15, 35, 70, 120 y 200 monedas.
- **También se guardan:** mapas desbloqueados, récords (tiempo, gatos, nivel), victorias y partidas jugadas.

## 5. Números del motor (`js/engine.js`)

| Qué | Fórmula o valor |
| --- | --- |
| Mundo | 1024 × 1024 px, cada mapa con su zona caminable (`MAPS[x].b`) |
| Vida de los gatos | base × (1 + t/130 + (t/270)²) × (1 + nivel del mapa × 0,07); solo, ×0,85 |
| Vida de los jefes | base × (1 + nivel del mapa × 0,06) × (1 + nivel del equipo × 0,08); solo, ×0,7 |
| Daño de los gatos | base × (1 + t/330) × (1 + nivel del mapa × 0,05); élite, ×1,4 |
| Ritmo de aparición | min(9, 0,9 + t/34) gatos/s × ajuste automático × (1 + nivel del mapa × 0,04); solo, ×0,72; tope de 220 en pantalla |
| Experiencia para el próximo nivel | floor(5 + nivel × 4 + nivel^1,75) |
| Jugador | 100 de vida (+10 por mejora), velocidad 62, imán 26 px |
| Revivir | 2,2 s a menos de 24 px |
| Golpe crítico | 8%, daño ×2 |

**Balance probado con bots** (`sim3.mjs`, ver sección 7). Los bots esquivan casi perfecto, así que una persona va a sufrir más:
- A dúo ganan casi siempre en la Plaza, con Linda durando unos 20–30 s. En Feria, Tortugas y Terrazas a veces pierden. Llegan a Luz en nivel 15 aprox. y a Linda en nivel 30 aprox.
- Solo, con Rocío, ganan en Plaza y en Terrazas en las simulaciones.
- **Falta validar con personas.** Es lo próximo para ajustar.

## 6. Cómo está hecho

**Base técnica:**
- Sitio estático, sin build, en `gatos/`. Las librerías y fuentes están copiadas en el repo, porque los CDN estaban bloqueados en el entorno de desarrollo.
- Canvas 2D en baja resolución: el buffer se escala ×`max(2, round(min(W,H)/230))`, con el suavizado apagado para que se vea pixel art.
- Los sprites se dibujan por código, píxel a píxel, con contorno automático, más versiones espejadas y en blanco para el destello de golpe.
- **Noche:** una capa oscura con huecos de luz en degradé (faroles, jugadores, objetos) y un tinte cálido aditivo.
- **Física:** grilla espacial de 32 px para colisiones y para que los gatos no se amontonen.
- **Audio:** música chiptune y sonidos sintetizados en vivo con WebAudio.

**Red (PeerJS / WebRTC P2P):**
- **Sala:** el anfitrión crea un código de 4 letras (prefijo de id `gatos-de-linda-v1-`).
- **Simulación:** la corre **solo el anfitrión**. Manda una foto del estado 20 veces por segundo, con los eventos acumulados.
- **Movimiento del invitado:** se mueve localmente (sin demora) y manda su posición junto con el tamaño de su pantalla (`vw`, `vh`), así los gatos aparecen justo afuera de lo que ve cada uno (`edgePos` en el motor). El esquive también se simula local y el anfitrión solo aplica la invulnerabilidad.
- **Mensajes del anfitrión al invitado:** `lobby {who,map}`, `start {map,chars}`, `s {snapshot}`, `menu`.
- **Mensajes del invitado al anfitrión:** `hello {who,meta}`, `in {pos,face,moving,ult,dash,vw,vh}`, `pick {i}`.
- **Latido:** el anfitrión controla cuándo recibió el último mensaje y saca al jugador caído de la conexión con `Sim.dropPlayer(side)`.
- **Foto del estado:**
  - Gatos en `E`, 6 números por gato: id, tipo, x, y, banderas, ángulo. Banderas: 1 destello, 2 aviso, 4 élite, 8 embestida, 16 mojado.
  - Además: `B` proyectiles, `H` proyectiles enemigos, `G` gemas, `K` objetos, `U` charcos, `M` tortas, `Bu` colectivos, `Z` zonas de Linda, `Hz` peligros, `ob` pedido, `tg` vínculo.
  - `P` trae los datos de cada jugador, más `boss`, `of` (ofertas de nivel) y `ev` (eventos).

**Archivos:**

| Archivo | Qué tiene |
| --- | --- |
| `index.html` | Canvas, zona táctil, HUD, modal de nivel, interfaz |
| `js/engine.js` | Toda la simulación y las reglas |
| `js/maps.js` | `THEMES` (nombre, subtítulo, tinte nocturno) y `buildMap` de los 7 mapas |
| `js/sprites.js` | Pixel art: personas, gatos, perros, objetos, vehículos y escenografía |
| `js/render.js` | Dibujo por cuadro, efectos, avisos, luces y flechas al borde |
| `js/main.js` | Menús, salas, bucle, sincronización, HUD, taller y resultados |
| `js/net.js` | Envoltorio de PeerJS |
| `js/input.js` | Joystick y teclado |
| `js/sfx.js` | Efectos de sonido |
| `js/music.js` | Música |
| `css/app.css` | Interfaz pixel |

**Agregar un mapa nuevo:**
1. Entrada en `MAPS` y, si tiene peligro, en `HAZ` (`engine.js`).
2. Tema y bloque de dibujo en `maps.js`.
3. Costo en `MAP_COST` y cartel en `HZ_BANNER` (`main.js`).
4. Sprites nuevos en `sprites.js` y el dibujo del peligro en `drawHazard` (`render.js`).

## 7. Cómo se prueba

**Servidor local:**

```sh
python3 -m http.server 8766   # dentro de gatos/
```

Abrir `http://127.0.0.1:8766/?debug`. Con `?debug` queda disponible `window.__g()` en la consola, que devuelve `{ sim, snap, me, R, prof, input }`.

**Probar de a dos sin internet:**
- Levantar un PeerServer local (paquete npm `peer`) en el puerto 9000.
- Abrir con `?peer=127.0.0.1:9000`.
- Usar **dos navegadores separados**, porque dos pestañas en el mismo navegador sin GPU se traban.

**Herramientas que se usaron en desarrollo:**
- Simulación sin navegador con bots, para balance: importar `Sim`, avanzar con `step(dt, input)` y elegir mejoras con `pick(side, i)`.
- Pruebas con Playwright para cada mapa, de a dos, nivel, evolución, tren, combo de pareja, Linda y resultados.
- Ninguna de estas herramientas está guardada en el repo.

## 8. Cómo se publica

- Vercel **no** publica solo desde esta rama: se publica a producción a mano desde `claude/hola-55y4vl` (por la API de Vercel o desde el panel, con "Redeploy").
- Las vistas previas de Vercel piden iniciar sesión; por eso se usa producción, que es pública.
- **Riesgo:** `main` no tiene los juegos. Si alguien publica `main`, desaparecen `/gatos` y `/juego`. **Recomendado: unir la rama a `main`.**

## 9. Historia

| Commit | Qué se hizo |
| --- | --- |
| `e14025c`, `c7338f9`, `1f6df26`, `4f8511d` | Expediente a Dos, el misterio 3D. Se descartó como juego principal por poco "viciable". |
| `968baf4` | Primera versión de Gatos de Linda: 3 mapas, 8 armas, 6 pasivas, Luz y Linda. Al usuario le encantó. |
| `5e980a8` | Dificultad pensada: enemigos con aviso, fases de jefas, evoluciones, esquive, combo de pareja, pedido de Roro's, peligros y 3 mapas nuevos. |
| `09c50e0` | Feria Persa rehecha con fotos reales y nuevo mapa Team Bielli. |
| `aab3973` | Hecho desde otra sesión: no se traba al cortarse la conexión, gatos que aparecen fuera de cámara, menú de pausa, armas en pantalla, Wake Lock y vibración. |
| `3a844d5` | Hecho desde otra sesión: web de Roro's Bakery sin guion largo en el título y el pie. |

## 10. Pendientes e ideas

1. **Probar con personas** y ajustar la dificultad con lo que digan.
2. **Pedir fotos de Tortugas y Terrazas** (Street View de frente y alguna de adentro) para que queden tan fieles como la Feria.
3. **Unir la rama a `main`.**
4. Ideas que todavía no se hicieron:
   - Corbata y la caniche Linda de la abuela como aliados o armas.
   - Un mapa de la casa de la abuela.
   - Un mapa de Roro's Bakery.
   - Logros.
   - Modo infinito después de Linda.
   - Más personajes jugables.
