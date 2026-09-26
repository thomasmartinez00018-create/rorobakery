# Gatos de Linda

Supervivientes cooperativo para dos, cada uno en su celu. Thomas (patadas del Team Bielli) y Rocío (medialunas y tortas) aguantan las oleadas de gatos que manda Linda, la gata mala, hasta derrotarla.

## Cómo se juega

- Uno toca **Jugar de a dos** y le pasa el código (o el link) al otro, que entra con **Unirme**. También se puede jugar solo.
- Se mueven con el dedo: el joystick aparece donde apoyás. Las armas atacan solas.
- Los gatos dejan gemas: al juntar experiencia suben de nivel y **cada uno elige una mejora** (armas nuevas o mejoras de las que tienen).
- Si uno cae, el otro lo levanta quedándose al lado unos segundos.
- A los 3:30 aparece **Luz**; a los 7:00, **Linda**. Derrotarla es ganar.
- El botón redondo es el especial (se carga matando gatos): **Combo** de Thomas o **Lluvia de tortas** de Rocío.
- Las monedas de cada partida se gastan en el **Taller** (mejoras permanentes) y en desbloquear mapas: Plaza Mitre, Estación Los Polvorines y la cancha del Trueno Verde.

Armas: Patada Bielli, Medialunas, Juli (gira alrededor), Romero (muerde), Mate hirviendo, El 315, Palo de amasar y Torta bomba. Pasivas: guantes, zapatillas, termo, imán, mate amargo y abrazo.

## Técnica

- Sitio estático sin build, en `/gatos/`. Canvas 2D en baja resolución (pixel art real), sprites generados por código con contorno automático, luces nocturnas.
- El anfitrión corre la simulación (`js/engine.js`) y manda el estado 20 veces por segundo por WebRTC (PeerJS). Cada jugador controla su propio movimiento, así no se siente demora al moverse.
- Música chiptune y sonidos sintetizados con WebAudio.
- El progreso (monedas, mejoras, récords) queda guardado en cada dispositivo.

Para probar local: `python3 -m http.server` dentro de `gatos/`.
