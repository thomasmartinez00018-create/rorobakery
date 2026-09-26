# Gatos de Linda

Supervivientes cooperativo para dos, cada uno en su celu. Thomas (patadas del Team Bielli) y Rocío (medialunas y tortas) aguantan las oleadas de gatos que manda Linda, la gata mala, hasta derrotarla.

## Cómo se juega

- Uno toca **Jugar de a dos** y le pasa el código (o el link) al otro, que entra con **Unirme**. También se puede jugar solo.
- Se mueven con el dedo: el joystick aparece donde apoyás. Las armas atacan solas.
- Los gatos dejan gemas: al juntar experiencia suben de nivel y **cada uno elige una mejora** (armas nuevas o mejoras de las que tienen).
- Si uno cae, el otro lo levanta quedándose al lado unos segundos.
- A los 3:30 aparece **Luz**; a los 7:00, **Linda**. Derrotarla es ganar.
- El botón redondo es el especial (se carga matando gatos): **Combo** de Thomas o **Lluvia de tortas** de Rocío. Si los dos lo tiran casi a la vez sale el **Combo de pareja**: pega más y los cura.
- **Esquive** (botón celeste, o Shift en la compu): un salto corto en el que no te pueden pegar.
- Parados cerca uno del otro aparece el hilo de corazón: **juntos pegan 20% más**.
- Las monedas de cada partida se gastan en el **Taller** (mejoras permanentes) y en desbloquear mapas.

### Dificultad pensada

Los gatos avisan antes de atacar (signo **!** y parpadeo): hay que leerlos y esquivar, no solo correr.

- **Saltarín** (naranja y blanco): se agacha y salta en línea recta.
- **Escupidor** (siamés): se queda a distancia y escupe.
- **Gata madre** (tricolor): al caer suelta tres gatitos.
- **Élite** (dorado y enorme): cuesta matarlo y suelta una **caja de Roro's**.
- **Luz** marca con una línea roja por dónde va a cargar; con poca vida carga dos veces.
- **Linda** tiene tres fases: bolas de pelo, después círculos rojos donde va a caer algo, y al final un anillo de bolas con un hueco para escapar.
- Las hordas vienen en anillo con dos huecos. Si uno cae, los gatos aflojan para dar chance de levantarlo; si van sobrados, aprietan.
- **Pedido de Roro's**: aparece una caja en el mapa; parados encima se carga, y juntos el doble de rápido.
- Cajones para romper: sueltan monedas, alfajores, imán (junta toda la experiencia) o manguera (moja y frena a los gatos).

### Evoluciones

Arma al máximo + su pasiva compañera + abrir una caja de Roro's = evolución.

| Arma | Pasiva | Evolución |
| --- | --- | --- |
| Patada Bielli | Guantes de box | Patada Voladora |
| Medialunas | Mate amargo | Docena de Medialunas |
| Juli | Abrazo | Juli Mimosa |
| Romero | Zapatillas | Romero Desatado |
| Mate hirviendo | Termo | Pava Hirviendo |
| El 315 | Imán | 315 Expreso |
| Palo de amasar | Vendas | Rodillo de Acero |
| Torta bomba | Delantal de Roro | Torta de Tres Pisos |

### Mapas

Cada mapa es más difícil y da más monedas, y tiene su propio peligro que cruza la pantalla (siempre avisa antes con una franja roja).

1. **Plaza Mitre**: para arrancar.
2. **Estación Los Polvorines**: pasa el Belgrano Norte por las vías.
3. **Feria Persa**: armada con fotos reales. El castillo de Av. Balbín con murallas de colores, cúpulas de cebolla y torres con punta, el cartel de la alfombra mágica, el paredón azul con reja blanca, y adentro los pasillos con línea amarilla, los locales de ropa, los puestos de golosinas y el patio de comidas. Cruza el fletero.
4. **Team Bielli**: armado con fotos reales. Encastrables amarillos y negros, bolsas, el ring, banderines de países y los banners del team. Cruza la fila de la entrada en calor. Thomas juega de local: +15% de daño.
5. **Cancha del Trueno Verde**: la cortadora del canchero.
6. **Tortugas Open Mall**: palmeras, cúpulas de vidrio, la fuente, la calesita, el deck sobre el lago y carritos del súper sueltos.
7. **Terrazas de Mayo**: la entrada con el cartel, Carrefour, Cinemark, bowling, el patio de comidas y el estacionamiento gigante con autos.

## Técnica

- Sitio estático sin build, en `/gatos/`. Canvas 2D en baja resolución (pixel art real), sprites generados por código con contorno automático, luces nocturnas.
- El anfitrión corre la simulación (`js/engine.js`) y manda el estado 20 veces por segundo por WebRTC (PeerJS). Cada jugador controla su propio movimiento, así no se siente demora al moverse.
- Música chiptune y sonidos sintetizados con WebAudio.
- El progreso (monedas, mejoras, récords) queda guardado en cada dispositivo.

Para probar local: `python3 -m http.server` dentro de `gatos/`.
