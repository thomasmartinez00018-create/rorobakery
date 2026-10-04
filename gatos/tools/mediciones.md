# Mediciones de la fase de cimientos

Todo se midió en una Mac M1 con Node 25 y Chromium de Playwright (headless, 390 x 844, dpr 3). "CPU 6x" es el frenado de CPU por CDP que aproxima un Android de gama media/baja. Los números del navegador varían de corrida en corrida: por eso se corrió 3 veces cada lado y se dan los rangos.

Cómo repetirlo (desde `gatos/tools/`, con `npm install` hecho):

```sh
node run_batch.mjs                        # 7 mapas a dúo, 40 partidas cada uno
MODES=duo,solo OUT=nombre node run_batch.mjs
node resumen.mjs results/antes results/despues
node perf_resumen.mjs etiqueta             # motor y red, sin navegador
python3 -m http.server 8811                # dentro de gatos/, en otra terminal
PROF=1 node app_bench.mjs 6 300            # juego real, perfil de CPU con 6x
node app_bench.mjs 6 300                   # juego real, traza (estilos, layout, pintado)
RATES=6 node render_bench.mjs              # dibujo aislado
```

## 1. Bots: el bot de la auditoría se dejaba arrastrar por los objetos del piso

El cerebro del bot sumaba la atracción de todos los objetos a menos de 200 px. Con 40 monedas tiradas a los 5 minutos (no vencían), el bot terminaba caminando hacia los gatos. Con los objetos que ahora vencen, ese mismo bot pasó a ganar mucho más (Plaza dúo de 18% a 95%), y no porque el juego sea más fácil sino porque el bot deja de suicidarse.

Se corrigió el bot (ahora va al objeto más cercano, igual que con las gemas) y se volvió a medir la base con el bot corregido. **Los porcentajes de victoria de la auditoría (18% en Plaza dúo, etc.) estaban muy deprimidos por este defecto del bot**: con el bot corregido y el motor original, Plaza dúo gana 98%. Para balance fino hay que probar con personas.

## 2. Optimizaciones 1 a 8 (tabla 1.4 de la auditoría)

### Bots, antes y después (bot corregido, 40 partidas por configuración, semillas fijas)

`results/0_base_bot2` (motor original, commit 02ab518) contra `results/1_opt`:

| Configuración | Gana antes → después | Fin mediana antes → después (IC95 de la diferencia) | Nivel medio | Gatos medios | ¿Dentro del margen? |
| --- | --- | --- | --- | --- | --- |
| Plaza dúo | 98% → 98% | 7:51 → 7:48 (-13 a +5 s) | 30,7 → 30,6 | 3694 → 3645 | sí |
| Plaza solo | 78% → 73% | 7:40 → 7:40 (-10 a +13 s) | 24,2 → 24,1 | 2284 → 2268 | sí |
| Estación dúo | 98% → 98% | 7:54 → 7:56 (-14 a +10 s) | 31,1 → 31,2 | 3820 → 3792 | sí |
| Estación solo | 78% → 78% | 7:51 → 7:44 (-20 a +9 s) | 24,7 → 25,4 | 2391 → 2438 | sí |
| Feria dúo | 100% → 98% | 8:12 → 8:00 (-21 a +2 s) | 32,6 → 32,6 | 4200 → 4141 | sí |
| Feria solo | 73% → 68% | 7:48 → 7:42 (-20 a +6 s) | 24,3 → 24,6 | 2357 → 2373 | sí |
| Bielli dúo | 98% → 95% | 8:03 → 7:56 (-17 a +5 s) | 32,7 → 32,5 | 4278 → 4202 | sí |
| Bielli solo | 60% → 57% | 7:41 → 7:32 (-22 a +5 s) | 22,4 → 21,6 | 2153 → 2002 | sí |
| Cancha dúo | 98% → 95% | 7:57 → 8:02 (-7 a +17 s) | 32,5 → 32,6 | 4231 → 4265 | sí |
| Cancha solo | 35% → 50% | 7:37 → 7:41 (-16 a +22 s) | 21,9 → 22,4 | 2078 → 2145 | sí |
| Tortugas dúo | 95% → 90% | 8:07 → 8:08 (-17 a +12 s) | 33,7 → 33,0 | 4555 → 4408 | sí |
| Tortugas solo | 38% → 38% | 7:34 → 7:31 (-233 a +208 s) | 20,2 → 19,3 | 1898 → 1777 | sí |
| Terrazas dúo | 90% → 93% | 8:05 → 8:05 (-11 a +13 s) | 33,5 → 34,0 | 4587 → 4688 | sí |
| Terrazas solo | 33% → 35% | 7:27 → 6:17 (-255 a +131 s) | 20,7 → 18,9 | 2007 → 1728 | sí |

14 de 14 configuraciones dentro del margen. Monedas ganadas por partida (promedio de las 560): 615,7 → 596,7 (menos 3%, por las monedas que vencen).

Lo que se probó por separado antes de decidir:
- Fusionar gemas sola: 14/14 dentro del margen. La primera versión (sin la regla de las 400) bajaba el nivel medio unos 2 niveles (medido con el bot de la auditoría en Plaza y Terrazas a dúo), porque se perdía la experiencia que antes se cobraba sola al pasar las 400 gemas. Se mantuvo esa regla contando cuántas gemas representa cada fusionada.
- Vencimiento de objetos para todo menos la caja: 13/14 (Bielli solo bajó de 60% a 35%). Por eso el alfajor tampoco vence: queda como la caja.

### Motor y red (`perf_resumen.mjs`, partida a dúo con bots y vida infinita, misma semilla)

| Momento | Gemas en la foto | Foto binarypack | KB/s hacia el invitado | `step` medio |
| --- | --- | --- | --- | --- |
| Plaza 3:00 | 246 → 102 | 2,71 → 1,53 KB | 48,4 → 29,8 | 0,023 → 0,019 ms |
| Plaza 5:00 | 386 → 107 | 3,67 → 1,74 KB | 71,8 → 35,8 | 0,039 → 0,027 ms |
| Plaza 7:00 | 393 → 111 | 4,46 → 1,77 KB | 89,8 → 33,5 | 0,045 → 0,023 ms |
| Terrazas 5:00 | 388 → 118 | 4,11 → 2,24 KB | 83,0 → 41,7 | 0,052 → 0,038 ms |
| Terrazas 7:00 | 388 → 117 | 4,74 → 2,06 KB | 93,3 → 44,1 | 0,050 → 0,033 ms |
| Estrés (250 gatos) | 0 | 3,22 → 3,22 KB | 73,8 → 73,8 | 0,205 → 0,211 ms |

Objetos del piso en la foto a los 7:00 en Plaza: 1165 → 85 bytes.

### Juego real en Chromium (`app_bench.mjs`, partida solo adelantada a los 5:10, 3 corridas por lado)

| | Antes | Después |
| --- | --- | --- |
| Bucle completo (`loop`), CPU 6x | 413 a 453 ms/s (6,9 a 7,5 ms por cuadro) | 138 a 188 ms/s (2,3 a 3,1 ms por cuadro) |
| `updateHud`, CPU 6x | 150 a 168 ms/s | 3 a 5 ms/s |
| `R.frame` (dibujo), CPU 6x | 220 a 244 ms/s | 117 a 155 ms/s |
| Luces (`lighting`), CPU 6x | 41 a 51 ms/s | 19 a 27 ms/s |
| Números de daño (`drawNum`), CPU 6x | 18 a 47 ms/s | 2,5 a 5,6 ms/s |
| Sonidos (`sfx.play`), CPU 6x | 7 a 13 ms/s | 3 a 5 ms/s |
| Recálculo de estilos + layout (traza), CPU 6x | 27,8 + 53,0 ms/s | 10,9 + 8,2 ms/s |
| Pintado (traza), CPU 6x | 30,5 ms/s | 9,9 ms/s |
| Bucle completo, CPU 1x | 180 ms/s | 66 ms/s |

### Dibujo aislado (`render_bench.mjs`, CPU 6x, `R.frame` medio)

| Escenario | Antes | Después |
| --- | --- | --- |
| Plaza 5:00 | 3,50 ms | 2,18 ms |
| Plaza 7:00 | 3,90 ms | 2,09 ms |
| Estrés (220 gatos, 10 armas evolucionadas) | 4,18 ms | 3,05 ms |
| Costo de los números en estrés (con menos sin) | 1,48 ms | 0,12 ms |
| Costo de las luces en Plaza 5:00 (con menos sin) | 1,39 ms | 0,30 ms |

El tope de 60 cuadros por segundo no se puede medir en Chromium headless (corre a 60 Hz). Se verificó en el navegador simulando una pantalla de 120 Hz (ver sección de pruebas).

## 3. Motor con guion y azar con semilla

### Prueba exacta (lo que garantiza que el arcade es el mismo)

Con `EXACT=1` el motor nuevo usa `Math.random` como azar (en vez de su `this.rnd` con semilla) y el lote reemplaza `Math.random` por uno con semilla fija. Si el guion por defecto hace exactamente lo mismo que el código de antes, las dos corridas tienen que dar los mismos resultados byte a byte.

- 7 mapas, dúo y solo, 40 partidas cada uno (560 partidas): motor de antes (commit 053fb2b) contra motor con guion. **Los 14 archivos de resultados son idénticos byte a byte.**
- `node test_guion.mjs` repite esa comparación (6 partidas por configuración, 84 en total) más pruebas de semilla, mezcla, topes, eventos y victoria por tiempo.

### Bots con el azar propio del motor (comparación estadística)

`results/1_opt` (antes del guion) contra `results/2_guion` (motor con `this.rnd` y semilla por partida): **14/14 configuraciones dentro del margen**.

| Configuración | Gana antes → después | Fin mediana antes → después (IC95 de la diferencia) | ¿Dentro del margen? |
| --- | --- | --- | --- |
| Plaza dúo | 98% → 98% | 7:48 → 7:46 (-11 a +13 s) | sí |
| Plaza solo | 73% → 78% | 7:40 → 7:43 (-8 a +14 s) | sí |
| Estación dúo | 98% → 100% | 7:56 → 7:55 (-15 a +11 s) | sí |
| Estación solo | 78% → 65% | 7:44 → 7:39 (-16 a +4 s) | sí |
| Feria dúo | 98% → 95% | 8:00 → 8:01 (-10 a +9 s) | sí |
| Feria solo | 68% → 63% | 7:42 → 7:42 (-14 a +22 s) | sí |
| Bielli dúo | 95% → 98% | 7:56 → 7:53 (-13 a +7 s) | sí |
| Bielli solo | 57% → 50% | 7:32 → 7:35 (-9 a +16 s) | sí |
| Cancha dúo | 95% → 90% | 8:02 → 7:57 (-18 a +8 s) | sí |
| Cancha solo | 50% → 38% | 7:41 → 7:30 (-131 a +8 s) | sí |
| Tortugas dúo | 90% → 93% | 8:08 → 7:57 (-22 a +10 s) | sí |
| Tortugas solo | 38% → 48% | 7:31 → 7:40 (-23 a +243 s) | sí |
| Terrazas dúo | 93% → 95% | 8:05 → 8:08 (-12 a +12 s) | sí |
| Terrazas solo | 35% → 38% | 6:17 → 7:34 (-12 a +261 s) | sí |

Tiempo de `step`: sin diferencia medible. En la Mac compartida con otros agentes el mismo motor varió entre corridas de 0,030 a 0,099 ms (Terrazas 7:00) y de 0,26 a 0,45 ms (estrés), más que cualquier diferencia entre los dos motores.

## 4. Infraestructura del modo historia

El arcade no consume azar ni cambia con lo nuevo (diálogo, objetivos, aliados, cámara): la batería completa con el motor final (`results/3_final`) da **los 14 archivos idénticos byte a byte** a los de `results/2_guion`. La foto del arcade suma unos 45 bytes en JSON (`A: [], dlg: null, goal: null, cam: null, cap: null`).

Capítulo de ejemplo (`js/story.js`, defender la fuente 60 s) con el bot, que ahora se queda cerca de lo que hay que defender: gana 19 de 20 (10 a dúo, 10 solo).

## 5. Del motor original al final (bot corregido, 40 partidas por configuración)

`results/0_base_bot2` (commit 02ab518) contra `results/3_final`: 13/14 dentro del margen. La que queda afuera es Feria dúo: gana 100% → 95% y la mediana de fin baja de 8:12 a 8:01 (IC95 de -17 a -2 s), o sea que a Linda la vencen unos 11 s antes. Con 14 comparaciones al 95% es esperable que una salga afuera por azar. Monedas por partida: 615,7 → 601,9 (menos 2%).

## 6. Pruebas

`node tools/test.mjs` corre todo. Última corrida, todo en verde:

| Archivo | Qué prueba | Resultado |
| --- | --- | --- |
| `test_perfil.mjs` | Perfil v1 de ejemplo → v2 con localStorage de mentira, copia del original, perfil roto, versión futura, valores sucios, código de respaldo de ida y vuelta, `storage.persist()` | 11 en verde |
| `test_guion.mjs` | Arcade idéntico byte a byte al motor sin guion (84 partidas), semilla, mezcla, topes, eventos, victoria por tiempo y por jefe | 8 en verde |
| `test_historia.mjs` | Diálogo (los dos tocan, relevo a los 6 s, desconexión, saltar, solo, cola con la subida de nivel, epílogo), los 9 objetivos, hitos, aliados (ids, lista A, embestir, área, seguir, levantarse), cámara, capítulo de ejemplo con bots | 28 en verde |
| `test_navegador.mjs` | Chromium real: perfil v1 migrado y código de respaldo desde el Taller; arcade 30 s; capítulo de ejemplo completo; tope de 60 cuadros con pantalla de 120 Hz simulada (dibujó 60,3 cuadros por segundo con el refresco a 125 Hz); de a dos en dos navegadores con PeerServer local: sala, diálogo que espera a los dos, relevo a los 5,3 s, invitado que se mueve y ve el objetivo, aviso "Actualizá la página" con versión distinta; ningún error en consola | 11 en verde |
