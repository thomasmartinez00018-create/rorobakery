// Joystick táctil (aparece donde apoyás el dedo) y teclado para compu.
export class Input {
  constructor(zone, base, knob) {
    this.zone = zone; this.base = base; this.knob = knob;
    this.dir = { x: 0, y: 0 }; this.touch = null; this.keys = new Set(); this.ultPressed = false;
    const R = 38;
    zone.addEventListener("pointerdown", e => {
      if (this.touch !== null) return;
      this.touch = e.pointerId; this.ox = e.clientX; this.oy = e.clientY;
      zone.setPointerCapture(e.pointerId);
      base.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; knob.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      base.classList.add("on"); knob.classList.add("on");
    });
    zone.addEventListener("pointermove", e => {
      if (e.pointerId !== this.touch) return;
      let dx = e.clientX - this.ox, dy = e.clientY - this.oy; const m = Math.hypot(dx, dy);
      if (m > R) { dx = dx / m * R; dy = dy / m * R; }
      this.dir = { x: dx / R, y: dy / R };
      knob.style.transform = `translate(${this.ox + dx}px, ${this.oy + dy}px)`;
    });
    const end = e => { if (e.pointerId !== this.touch) return; this.touch = null; this.dir = { x: 0, y: 0 }; base.classList.remove("on"); knob.classList.remove("on"); };
    zone.addEventListener("pointerup", end); zone.addEventListener("pointercancel", end);
    addEventListener("keydown", e => { this.keys.add(e.key.toLowerCase()); if (e.key === " ") { this.ultPressed = true; e.preventDefault(); } });
    addEventListener("keyup", e => this.keys.delete(e.key.toLowerCase()));
    addEventListener("blur", () => this.keys.clear());
  }
  get vec() {
    const k = this.keys;
    let x = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    let y = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m }; }
    return this.dir;
  }
  takeUlt() { const u = this.ultPressed; this.ultPressed = false; return u; }
}
