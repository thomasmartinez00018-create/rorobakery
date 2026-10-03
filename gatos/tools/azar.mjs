// Azar repetible para las herramientas: mulberry32. Igual al que usa el motor para this.rnd.
export function mulberry32(a) {
  a >>>= 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// reemplaza Math.random por uno con semilla (devuelve la función para restaurar)
export function seedMath(seed) { const orig = Math.random; Math.random = mulberry32(seed); return () => { Math.random = orig; }; }
