// Música procedural (noir lo-fi) y sonido ambiente, todo sintetizado.
import { sfx } from "./sfx.js";

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// progresiones: noir en La menor y variantes
const PROG = {
  calm: [[45, [57, 60, 64, 67]], [41, [57, 60, 64, 65]], [38, [53, 57, 60, 64]], [40, [56, 59, 62, 65]]],
  play: [[45, [57, 60, 64, 67]], [43, [55, 59, 62, 65]], [41, [57, 60, 64, 65]], [40, [56, 59, 62, 64]]],
  tense: [[45, [57, 60, 63, 66]], [46, [58, 61, 65, 68]], [45, [57, 60, 63, 66]], [44, [56, 60, 63, 66]]],
  win: [[48, [60, 64, 67, 71]], [41, [60, 64, 65, 69]], [43, [59, 62, 67, 71]], [48, [60, 64, 67, 72]]],
  lose: [[45, [57, 60, 64]], [41, [57, 60, 65]], [40, [56, 59, 64]], [45, [57, 60, 64]]]
};
const TEMPO = { calm: 78, play: 92, tense: 118, win: 96, lose: 66 };

export const music = {
  on: (() => { try { return localStorage.getItem("ead2-music") !== "0"; } catch (e) { return true; } })(),
  mode: "calm", step: 0, next: 0, timer: null, amb: null,

  start() {
    const ac = sfx.init(); if (!ac || this.timer) return;
    this.ac = ac;
    this.bus = ac.createGain(); this.bus.gain.value = this.on ? 0.55 : 0; this.bus.connect(sfx.master);
    this.ambBus = ac.createGain(); this.ambBus.gain.value = 0.5; this.ambBus.connect(sfx.master);
    this.lp = ac.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.frequency.value = 2400; this.lp.connect(this.bus);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.next = ac.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 25);
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem("ead2-music", this.on ? "1" : "0"); } catch (e) {}
    if (this.bus) this.bus.gain.setTargetAtTime(this.on ? 0.55 : 0, this.ac.currentTime, 0.2);
    return this.on;
  },
  setMode(m) {
    if (m === this.mode) return;
    this.mode = m;
    if (this.lp) this.lp.frequency.setTargetAtTime(m === "tense" ? 4200 : m === "lose" ? 900 : 2400, this.ac.currentTime, 0.5);
  },

  tick() {
    const ac = this.ac;
    while (this.next < ac.currentTime + 0.12) { this.play16(this.step, this.next); this.next += 60 / TEMPO[this.mode] / 4; this.step++; }
  },

  play16(s, t) {
    const m = this.mode, prog = PROG[m], bar = Math.floor(s / 16) % prog.length, pos = s % 16;
    const [root, chord] = prog[bar];
    const beat = 60 / TEMPO[m];
    if (pos === 0) this.pad(chord, t, beat * 4 * 0.98, m === "tense" ? 0.05 : 0.07);
    // bajo
    const bassHits = m === "tense" ? [0, 2, 4, 6, 8, 10, 12, 14] : m === "calm" || m === "lose" ? [0, 10] : [0, 6, 8, 14];
    if (bassHits.includes(pos)) this.bass(mtof(root + (pos === 14 && m === "play" ? 7 : 0)), t, beat * (m === "tense" ? 0.45 : 0.9));
    // batería
    if (m !== "calm" && m !== "lose") {
      if (pos === 0 || pos === 8 || (m === "tense" && pos % 4 === 0)) this.kick(t);
      if (pos === 4 || pos === 12) this.snare(t);
      if (m === "tense" ? true : pos % 2 === 0) this.hat(t, pos % 4 === 2 ? 0.05 : 0.025);
    } else if (pos % 4 === 2) this.hat(t, 0.015);
    // vibráfono: notas sueltas de la escala
    const prob = m === "tense" ? 0.18 : m === "calm" ? 0.2 : 0.14;
    if (pos % 2 === 0 && Math.random() < prob) {
      const n = chord[Math.floor(Math.random() * chord.length)] + 12 * (Math.random() < 0.5 ? 1 : 0);
      this.vibe(mtof(n), t, beat * 1.5);
    }
  },

  env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  pad(chord, t, dur, v) {
    const ac = this.ac, g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.6); g.gain.setValueAtTime(v, t + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(this.lp);
    chord.forEach(n => [-6, 6].forEach(det => { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }));
  },
  bass(freq, t, dur) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.value = freq / 2;
    this.env(g, t, 0.01, dur, 0.22); o.connect(g); g.connect(this.lp); o.start(t); o.stop(t + dur + 0.05);
  },
  vibe(freq, t, dur) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(), trem = ac.createOscillator(), tg = ac.createGain();
    o.type = "sine"; o.frequency.value = freq; trem.frequency.value = 5.5; tg.gain.value = 0.3;
    trem.connect(tg); tg.connect(g.gain);
    this.env(g, t, 0.005, dur, 0.06); o.connect(g); g.connect(this.lp);
    o.start(t); trem.start(t); o.stop(t + dur + 0.05); trem.stop(t + dur + 0.05);
  },
  kick(t) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(g, t, 0.003, 0.22, 0.5); o.connect(g); g.connect(this.lp); o.start(t); o.stop(t + 0.3);
  },
  noiseHit(t, v, dur, type, freq) {
    const ac = this.ac, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    this.env(g, t, 0.002, dur, v); src.connect(f); f.connect(g); g.connect(this.lp);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  },
  snare(t) { this.noiseHit(t, 0.12, 0.16, "bandpass", 1800); },
  hat(t, v) { this.noiseHit(t, v, 0.04, "highpass", 7000); },

  /* ---- ambiente ---- */
  setAmbience(kind, rain) {
    if (!this.ac) return;
    const ac = this.ac;
    if (this.amb) { const old = this.amb; old.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4); setTimeout(() => { old.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); clearInterval(old.iv); }, 1500); }
    const g = ac.createGain(); g.gain.value = 0.0001; g.connect(this.ambBus);
    g.gain.setTargetAtTime(1, ac.currentTime, 0.8);
    const nodes = [];
    const loop = (type, freq, v, q = 0.7) => {
      const src = ac.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const lg = ac.createGain(); lg.gain.value = v;
      src.connect(f); f.connect(lg); lg.connect(g); src.start(); nodes.push(src); return lg;
    };
    const blip = (freq, dur, v, type = "sine", to) => {
      const t = ac.currentTime, o = ac.createOscillator(), eg = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      this.env(eg, t, 0.01, dur, v); o.connect(eg); eg.connect(g); o.start(t); o.stop(t + dur + 0.05);
    };
    let iv = null;
    if (kind === "city") { loop("lowpass", 260, 0.18); iv = setInterval(() => { if (Math.random() < 0.12) { blip(392, 0.35, 0.03, "square"); blip(330, 0.35, 0.03, "square"); } }, 1500); }
    if (kind === "night") { loop("lowpass", 180, 0.05); iv = setInterval(() => { for (let i = 0; i < 3; i++) setTimeout(() => blip(4600, 0.03, 0.02, "sine"), i * 60); }, 900); }
    if (kind === "birds" || kind === "plaza") { loop("lowpass", 300, 0.06); if (kind === "plaza") loop("bandpass", 700, 0.05, 0.4); iv = setInterval(() => { if (Math.random() < 0.5) blip(2600 + Math.random() * 1500, 0.12, 0.02, "sine", 3800); }, 700); }
    if (kind === "crowd") { const lg = loop("bandpass", 650, 0.12, 0.35); iv = setInterval(() => { lg.gain.setTargetAtTime(0.08 + Math.random() * 0.1, ac.currentTime, 0.4); }, 800); }
    if (kind === "indoor") { const o = ac.createOscillator(); o.frequency.value = 58; const og = ac.createGain(); og.gain.value = 0.02; o.connect(og); og.connect(g); o.start(); nodes.push(o); loop("lowpass", 140, 0.04); }
    if (kind === "gym") { loop("lowpass", 160, 0.05); iv = setInterval(() => { if (Math.random() < 0.35) this.noiseHitAmb(g, 0.3, 0.12, 180); }, 1100); }
    if (rain) { loop("lowpass", 1400, 0.22); loop("highpass", 4000, 0.03); }
    this.amb = { g, nodes, iv };
  },
  noiseHitAmb(dest, v, dur, freq) {
    const ac = this.ac, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.noiseBuf; f.type = "lowpass"; f.frequency.value = freq;
    this.env(g, ac.currentTime, 0.002, dur, v); src.connect(f); f.connect(g); g.connect(dest); src.start(); src.stop(ac.currentTime + dur + 0.05);
  },
  horn() {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime;
    [311, 370].forEach(fq => { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = fq; this.env(g, t, 0.05, 1.1, 0.04); o.connect(g); g.connect(this.ambBus); o.start(t); o.stop(t + 1.3); });
  }
};
