// Efectos de sonido sintetizados con WebAudio: nada que descargar.
let ac = null, master = null, sfxBus = null;
let muted = false;
try { muted = localStorage.getItem("gdl-mute") === "1"; } catch (e) {}
const last = {};

function tone(f, d, type = "sine", v = 0.08, when = 0, to) {
  if (!ac || muted) return;
  try {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + d + 0.05);
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
    src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t);
  } catch (e) {}
}

export const sfx = {
  init() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
        master = ac.createGain(); master.gain.value = muted ? 0 : 1;
        master.connect(comp); comp.connect(ac.destination);
        sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  },
  get ctx() { return ac; },
  get master() { return master; },
  get muted() { return muted; },
  toggle() {
    muted = !muted;
    try { localStorage.setItem("gdl-mute", muted ? "1" : "0"); } catch (e) {}
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.05);
    return muted;
  },
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
  typeKey() { noise(0.03, 0.18, 0, 2400); },
  iris() { tone(880, 0.25, "square", 0.03, 0, 220); },
  stamp() { noise(0.12, 0.5, 0, 300); tone(90, 0.2, "sine", 0.15); },
  start() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, "square", 0.05, i * 0.08)); },
  join() { tone(523, 0.1, "triangle", 0.08); tone(784, 0.18, "triangle", 0.08, 0.09); },
  // sonidos del juego, con límite de frecuencia para que 200 gatos no saturen
  play(name) {
    const now = performance.now(), gap = { hit: 45, die: 55, gem: 40, throw: 120, coin: 60, spit: 150, boom: 60, dash: 100 }[name] || 0;
    if (gap && now - (last[name] || 0) < gap) return;
    last[name] = now;
    const f = {
      hit: () => { noise(0.04, 0.12, 0, 1800 + Math.random() * 800); },
      die: () => { tone(420 + Math.random() * 120, 0.08, "square", 0.035, 0, 180); },
      gem: () => { tone(1100 + Math.random() * 400, 0.06, "square", 0.025, 0, 1800); },
      throw: () => { noise(0.06, 0.06, 0, 3000); },
      coin: () => { tone(988, 0.07, "square", 0.05); tone(1319, 0.14, "square", 0.05, 0.06); },
      levelup: () => { [523, 659, 784, 1047].forEach((q, i) => tone(q, 0.14, "square", 0.06, i * 0.07)); },
      hurt: () => { tone(220, 0.15, "sawtooth", 0.08, 0, 110); },
      down: () => { [440, 330, 220].forEach((q, i) => tone(q, 0.2, "square", 0.07, i * 0.12)); },
      revive: () => { [330, 440, 660, 880].forEach((q, i) => tone(q, 0.14, "triangle", 0.08, i * 0.08)); },
      heal: () => { tone(660, 0.1, "triangle", 0.07); tone(880, 0.16, "triangle", 0.07, 0.08); },
      boom: () => { noise(0.3, 0.3, 0, 300); tone(90, 0.25, "sine", 0.15, 0, 40); },
      ult: () => { noise(0.5, 0.3, 0, 600); [220, 330, 440, 660].forEach((q, i) => tone(q, 0.2, "sawtooth", 0.06, i * 0.05)); },
      bus: () => { tone(311, 0.5, "sawtooth", 0.05); tone(370, 0.5, "sawtooth", 0.05); },
      horde: () => { [196, 185, 175].forEach((q, i) => tone(q, 0.25, "sawtooth", 0.07, i * 0.2)); },
      "boss:luz": () => { tone(180, 0.6, "sawtooth", 0.08, 0, 90); noise(0.5, 0.15, 0.1, 400); },
      "boss:linda": () => { [220, 208, 196, 110].forEach((q, i) => tone(q, 0.35, "square", 0.08, i * 0.22)); },
      bossdown: () => { [523, 659, 784, 1047, 1319].forEach((q, i) => tone(q, 0.2, "square", 0.07, i * 0.09)); },
      hairball: () => { noise(0.1, 0.1, 0, 900); },
      win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((q, i) => tone(q, 0.22, "square", 0.07, i * 0.12)); },
      over: () => { [392, 349, 330, 262].forEach((q, i) => tone(q, 0.35, "triangle", 0.08, i * 0.25)); },
      dash: () => { noise(0.12, 0.12, 0, 2400); tone(500, 0.08, "triangle", 0.03, 0, 900); },
      elite: () => { tone(150, 0.4, "sawtooth", 0.07, 0, 110); tone(300, 0.3, "square", 0.04, 0.1, 220); },
      spit: () => { noise(0.07, 0.09, 0, 1400); tone(700, 0.06, "sine", 0.04, 0, 300); },
      zones: () => { [880, 660].forEach((q, i) => tone(q, 0.12, "square", 0.04, i * 0.12)); },
      phase: () => { [196, 185, 175, 110].forEach((q, i) => tone(q, 0.3, "sawtooth", 0.08, i * 0.14)); noise(0.6, 0.2, 0, 300); },
      chest: () => { [659, 784, 988, 1319].forEach((q, i) => tone(q, 0.16, "square", 0.06, i * 0.06)); },
      evo: () => { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((q, i) => tone(q, 0.2, "square", 0.06, i * 0.07)); noise(0.5, 0.15, 0.3, 3000); },
      vacuum: () => { tone(300, 0.5, "sine", 0.08, 0, 1600); },
      splash: () => { noise(0.5, 0.25, 0, 1200); noise(0.3, 0.15, 0.1, 3200); },
      sync: () => { [523, 784, 1047, 1568].forEach((q, i) => tone(q, 0.3, "triangle", 0.09, i * 0.05)); noise(0.4, 0.2, 0, 800); },
      horn: () => { tone(233, 1.1, "sawtooth", 0.06); tone(277, 1.1, "sawtooth", 0.06); tone(349, 1.1, "sawtooth", 0.04); },
      warn: () => { [988, 740, 988, 740].forEach((q, i) => tone(q, 0.12, "square", 0.05, i * 0.16)); },
      train: () => { for (let i = 0; i < 6; i++) noise(0.14, 0.2, i * 0.2, 250); },
      whoosh: () => { noise(0.4, 0.15, 0, 700); },
      obj: () => { [784, 988, 1175].forEach((q, i) => tone(q, 0.14, "triangle", 0.08, i * 0.09)); },
      objok: () => { [659, 784, 988, 1319, 1568].forEach((q, i) => tone(q, 0.18, "triangle", 0.08, i * 0.08)); },
      objfail: () => { [330, 262].forEach((q, i) => tone(q, 0.3, "triangle", 0.07, i * 0.2)); }
    }[name];
    if (f) f();
  }
};
