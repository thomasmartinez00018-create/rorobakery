// Efectos de sonido sintetizados con WebAudio: nada que descargar.
let ac = null;
let muted = false;
try { muted = localStorage.getItem("ead2-mute") === "1"; } catch (e) {}

function tone(f, d, type = "sine", v = 0.08, when = 0, to) {
  if (!ac || muted) return;
  try {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.05);
  } catch (e) {}
}
function noise(d, v = 0.08, when = 0, freq = 1200) {
  if (!ac || muted) return;
  try {
    const t = ac.currentTime + when, len = Math.ceil(ac.sampleRate * d);
    const buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = v;
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t);
  } catch (e) {}
}

export const sfx = {
  init() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === "suspended") ac.resume();
  },
  get muted() { return muted; },
  toggle() { muted = !muted; try { localStorage.setItem("ead2-mute", muted ? "1" : "0"); } catch (e) {} return muted; },
  ok() { tone(660, 0.12, "triangle", 0.1); tone(990, 0.22, "triangle", 0.1, 0.1); },
  err() { tone(160, 0.35, "sawtooth", 0.06); tone(118, 0.4, "sawtooth", 0.06, 0.06); },
  tick() { tone(1400, 0.035, "square", 0.025); },
  click() { tone(900, 0.03, "square", 0.02); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, "triangle", 0.09, i * 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, "sawtooth", 0.05, i * 0.22)); },
  meow() { tone(700, 0.18, "sine", 0.1, 0, 1100); tone(1100, 0.3, "sine", 0.08, 0.16, 520); },
  evil() { tone(220, 0.25, "square", 0.05, 0, 330); tone(330, 0.25, "square", 0.05, 0.22, 196); tone(196, 0.5, "square", 0.05, 0.44, 110); },
  bark() { noise(0.12, 0.35, 0, 700); tone(260, 0.1, "square", 0.05); noise(0.12, 0.35, 0.2, 700); tone(260, 0.1, "square", 0.05, 0.2); },
  whoosh() { noise(0.6, 0.12, 0, 500); },
  sting() { tone(110, 0.9, "sawtooth", 0.05, 0, 55); tone(220, 0.5, "triangle", 0.06, 0.1, 440); tone(440, 0.8, "triangle", 0.05, 0.5); },
  join() { tone(523, 0.1, "triangle", 0.08); tone(784, 0.18, "triangle", 0.08, 0.09); }
};
