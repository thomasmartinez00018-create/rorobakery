// Música chiptune generada en vivo con WebAudio.
import { sfx } from "./sfx.js";

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  menu: { bpm: 96, prog: [[57, [0, 3, 7]], [53, [0, 4, 7]], [48, [0, 4, 7]], [55, [0, 4, 7]]], drums: false, arp: 2 },
  run:  { bpm: 138, prog: [[57, [0, 3, 7]], [53, [0, 4, 7]], [48, [0, 4, 7]], [55, [0, 4, 7]]], drums: true, arp: 1, lead: true },
  boss: { bpm: 152, prog: [[57, [0, 3, 6]], [58, [0, 4, 7]], [57, [0, 3, 6]], [56, [0, 4, 7]]], drums: true, arp: 1, lead: true, heavy: true },
  pause: { bpm: 80, prog: [[60, [0, 4, 7, 11]], [57, [0, 3, 7, 10]]], drums: false, arp: 2 }
};
const LEAD = [12, 10, 7, 10, 12, 15, 14, 12, 7, 5, 3, 5, 7, 10, 7, 3];

export const music = {
  on: (() => { try { return localStorage.getItem("gdl-music") !== "0"; } catch (e) { return true; } })(),
  mode: "menu", step: 0, timer: null,
  start() {
    const ac = sfx.init(); if (!ac || this.timer) return;
    this.ac = ac;
    this.bus = ac.createGain(); this.bus.gain.value = this.on ? 0.32 : 0; this.bus.connect(sfx.master);
    const len = ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.next = ac.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  },
  toggle() { this.on = !this.on; try { localStorage.setItem("gdl-music", this.on ? "1" : "0"); } catch (e) {} if (this.bus) this.bus.gain.setTargetAtTime(this.on ? 0.32 : 0, this.ac.currentTime, 0.1); return this.on; },
  set(mode) { if (this.mode !== mode) { this.mode = mode; this.step = 0; } },
  tick() {
    const ac = this.ac;
    while (this.next < ac.currentTime + 0.12) {
      const S = SONGS[this.mode];
      this.play(S, this.step, this.next);
      this.next += 60 / S.bpm / 4; this.step++;
    }
  },
  play(S, s, t) {
    const bar = Math.floor(s / 16) % S.prog.length, pos = s % 16;
    const [root, ch] = S.prog[bar];
    const dur = 60 / S.bpm / 4;
    // bajo
    if (pos % (S.drums ? 2 : 4) === 0) this.osc("triangle", mtof(root - 24 + (S.heavy && pos % 8 === 6 ? 1 : 0)), t, dur * (S.drums ? 1.8 : 3.5), 0.22);
    // arpegio
    if (pos % S.arp === 0) { const n = root + ch[(pos / S.arp) % ch.length] + 12; this.osc("square", mtof(n), t, dur * 0.8, 0.045); }
    // melodía
    if (S.lead && pos % 2 === 0 && (Math.floor(s / 64) % 2 === 1)) this.osc("square", mtof(root + LEAD[(pos / 2 + bar * 4) % 16] + 12), t, dur * 1.7, 0.035, 0.5);
    if (S.drums) {
      if (pos % 4 === 0) this.kick(t);
      if (pos % 8 === 4) this.hit(t, 0.12, 0.12, "bandpass", 1600);
      this.hit(t, pos % 2 ? 0.02 : 0.035, 0.03, "highpass", 8000);
    }
  },
  osc(type, f, t, d, v, duty) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + d + 0.02);
  },
  kick(t) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.2);
  },
  hit(t, v, d, type, f) {
    const ac = this.ac, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.noise; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(this.bus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }
};
