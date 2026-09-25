# Expediente a Dos

Juego policial cooperativo para dos jugadores: Thomas y Rocío resuelven casos en lugares reales de Malvinas Argentinas y San Miguel, con Juli, Romero y compañía. Detrás de todo está Linda, la gata.

## Cómo se juega

1. Uno abre la página, elige quién es y toca **Crear sala**. Aparece un código de 4 letras.
2. El otro entra con **Unirme con código** o con el link compartido (`?sala=CODIGO`).
3. **Campo** ve la escena (huella, libreta cifrada, testigos). **Archivo** tiene los registros (catálogo de suelas, mensaje interceptado, registro de testigos, rueda con alturas).
4. Resuelven las tres pistas, cruzan las fichas y acusan a una sola persona.
5. Cada caso ganado sube el nivel: más sospechosos, más símbolos, menos tiempo. Cada 3 niveles aparece Linda.

Sin conexión: **Jugar sin conexión** con el mismo número de caso en los dos dispositivos.

## Técnica

- Sitio estático, sin build. Se sirve tal cual desde `/juego/`.
- 3D con Three.js en estilo "3D pixel art": la escena se dibuja en baja resolución y se agranda sin suavizar, con bloom en las luces y un grading final (paleta con tramado ordenado, viñeta, grano, pulso rojo en el último minuto).
- Ambientación por lugar: partículas (polvo, lluvia con salpicaduras, luciérnagas, hojas, vapor, estrellas fugaces), palomas, haces de luz, luces que titilan y props animados. Algunos casos llueven.
- Música procedural (noir lo-fi que se acelera en el último minuto) y sonido ambiente sintetizados con WebAudio.
- Animaciones con GSAP: cinemáticas con barras de cine, transiciones en círculo, reacciones de los personajes y comportamientos espontáneos.
- P2P con PeerJS (servidor público de PeerJS para el emparejamiento; los datos van directo entre los dos navegadores).
- Librerías en `vendor/` y tipografías en `fonts/` (Jersey 10, VT323, Karla; SIL OFL): no depende de CDNs.
- Cada caso se genera a partir de una semilla (`js/casegen.js`), así los dos dispositivos ven el mismo caso.

| Archivo | Qué hace |
|---|---|
| `js/main.js` | Estado, reglas (el anfitrión es la autoridad), pantallas |
| `js/world.js` | Escenarios 3D, ambientación, cinemáticas, rueda de reconocimiento, retratos |
| `js/post.js` | Pipeline pixel art: baja resolución, bloom y grading |
| `js/fx.js` | Partículas, palomas y haces de luz |
| `js/music.js` | Música procedural y sonido ambiente |
| `js/actors.js` | Personajes y mascotas |
| `js/casegen.js` | Generador de casos y dificultad por nivel |
| `js/net.js` | Sala P2P |
| `js/sfx.js` | Sonidos sintetizados |

Para probar local: `python3 -m http.server` dentro de `juego/` y abrir `http://localhost:8000`.
