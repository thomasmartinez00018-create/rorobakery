// EJEMPLO TÉCNICO. No es contenido del juego.
// Sirve para probar la infraestructura del modo historia (diálogo, objetivo, foto del estado).
// Lo reemplaza el guion real de "La otra Linda" (fase A4), con el mismo formato (DISENO.md, sección 6).
// Mientras EXAMPLE sea true, el juego solo lo muestra con ?debug o ?historia en la dirección.
export const EXAMPLE = true;

// quién habla: id de retrato (el mismo nombre del sprite) → nombre que se muestra
export const SPEAKERS = {
  thomas: { name: "Thomas" },
  rocio: { name: "Rocío" }
};

export const CHAPTERS = [{
  id: "prueba", n: 0, map: "plaza",
  title: "Capítulo de prueba", sub: "Ejemplo técnico: defender la fuente 60 s",
  intro: [
    { who: "rocio", text: "Esto es un capítulo de prueba. Los gatos van a ir directo a la fuente." },
    { who: "thomas", text: "Entonces la cuidamos un minuto y listo. Vamos." }
  ],
  goal: { kind: "defend", x: 512, y: 520, r: 30, hp: 1200, label: "la fuente" },
  dur: 60,
  mix: [["gato", 10, 0], ["saltarin", 3, 20]],
  events: [{ t: 30, do: "elite" }],
  allies: [],
  outro: [],
  unlock: []
}];
