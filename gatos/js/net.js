// Conexión P2P con PeerJS: el anfitrión crea la sala con un código de 4 letras y el invitado entra con ese código.
const PREFIX = "gatos-de-linda-v1-";
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function makeCode() {
  return Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
}
export const cleanCode = s => String(s || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);

function peerOpts() {
  // ?peer=host:puerto permite probar con un PeerServer propio
  const q = new URLSearchParams(location.search).get("peer");
  if (!q) return { debug: 0 };
  const [host, port] = q.split(":");
  return { host, port: +port || 9000, path: "/", secure: false, debug: 0 };
}

export class Net {
  constructor(handlers) {
    this.h = handlers;
    this.peer = null; this.conn = null; this.isHost = false; this.code = null;
  }
  get connected() { return !!(this.conn && this.conn.open); }

  host(code) {
    this.close();
    this.isHost = true; this.code = code;
    return new Promise((resolve, reject) => {
      let opened = false;
      const p = this.peer = new window.Peer(PREFIX + code, peerOpts());
      p.on("open", () => { opened = true; resolve(code); });
      p.on("connection", c => {
        if (this.connected) { c.on("open", () => { c.send({ t: "busy" }); setTimeout(() => c.close(), 400); }); return; }
        this.bind(c);
      });
      p.on("disconnected", () => { if (!p.destroyed) try { p.reconnect(); } catch (e) {} });
      p.on("error", e => { if (!opened) reject(e); else this.h.status("error", e.type); });
    });
  }

  join(code) {
    this.close();
    this.isHost = false; this.code = code;
    return new Promise((resolve, reject) => {
      let done = false;
      const fail = e => { if (!done) { done = true; reject(e); } };
      const timer = setTimeout(() => fail({ type: "timeout" }), 15000);
      const p = this.peer = new window.Peer(undefined, peerOpts());
      p.on("open", () => {
        const c = p.connect(PREFIX + code, { reliable: true });
        this.bind(c, () => { if (!done) { done = true; clearTimeout(timer); resolve(); } });
      });
      p.on("error", e => { clearTimeout(timer); if (!done) fail(e); else this.h.status("error", e.type); });
    });
  }

  bind(c, onOpen) {
    c.on("open", () => { this.conn = c; this.h.status("connected"); onOpen && onOpen(); });
    c.on("data", d => { if (d && d.t === "busy") { this.h.status("busy"); return; } this.h.data(d); });
    c.on("close", () => { if (this.conn === c) { this.conn = null; this.h.status("closed"); } });
    c.on("error", () => {});
  }

  send(o) { if (this.connected) try { this.conn.send(o); } catch (e) {} }

  close() {
    try { this.conn && this.conn.close(); } catch (e) {}
    try { this.peer && this.peer.destroy(); } catch (e) {}
    this.conn = null; this.peer = null;
  }
}
