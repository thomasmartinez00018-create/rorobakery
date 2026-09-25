// Dibujos 2D (SVG) de las pruebas: suelas y símbolos del cifrado.
function rowPat(p, y) {
  const xs = [36, 52, 68, 84];
  if (p === "círculos") return xs.map(x => `<circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="currentColor" stroke-width="2.6"/>`).join("");
  if (p === "rombos") return xs.map(x => `<path d="M${x} ${y - 7}L${x + 6} ${y}L${x} ${y + 7}L${x - 6} ${y}Z" fill="currentColor"/>`).join("");
  if (p === "zigzag") { const pts = []; for (let i = 0; i <= 8; i++) pts.push((26 + i * 8.5) + "," + (y + (i % 2 ? -7 : 7))); return `<polyline points="${pts.join(" ")}" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>`; }
  return [30, 42, 54, 66, 78, 90].map(x => `<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`).join("");
}

export function soleSVG(s, cls = "") {
  let g = s.rows.map((p, i) => rowPat(p, [50, 82, 114][i])).join("");
  if (s.logo === "estrella") {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5 : 12; pts.push((60 + rr * Math.cos(a)).toFixed(1) + "," + (152 + rr * Math.sin(a)).toFixed(1)); }
    g += `<polygon points="${pts.join(" ")}" fill="currentColor"/>`;
  } else if (s.logo === "media luna") g += `<circle cx="60" cy="152" r="12" fill="currentColor"/><circle cx="66" cy="148" r="10" fill="var(--sole-bg)"/>`;
  if (s.heel === "cuadrado") g += `<rect x="40" y="198" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3"/>`;
  else if (s.heel === "redondo") g += `<circle cx="60" cy="218" r="21" fill="none" stroke="currentColor" stroke-width="3"/>`;
  else g += `<rect x="37" y="198" width="19" height="40" fill="none" stroke="currentColor" stroke-width="3"/><rect x="64" y="198" width="19" height="40" fill="none" stroke="currentColor" stroke-width="3"/>`;
  return `<svg class="${cls}" viewBox="0 0 120 264" aria-hidden="true"><path d="M60 6C92 6 108 36 106 80C104 118 94 136 91 160L91 238C91 252 80 258 60 258C40 258 29 252 29 238L29 160C26 136 16 118 14 80C12 36 28 6 60 6Z" fill="var(--sole-bg)" stroke="currentColor" stroke-width="3"/>${g}</svg>`;
}

export function glyphSVG(q) {
  const full = q.fill === "lleno";
  const st = full ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"';
  let shp;
  if (q.shape === "círculo") shp = `<circle cx="20" cy="20" r="14" ${st}/>`;
  else if (q.shape === "triángulo") shp = `<path d="M20 5L35 33H5Z" ${st}/>`;
  else if (q.shape === "cuadrado") shp = `<rect x="7" y="7" width="26" height="26" ${st}/>`;
  else shp = `<path d="M20 3L37 20L20 37L3 20Z" ${st}/>`;
  const mc = full ? "var(--glyph-bg)" : "currentColor", cy = q.shape === "triángulo" ? 24 : 20;
  let mk = "";
  if (q.mark === "punto") mk = `<circle cx="20" cy="${cy}" r="3.3" fill="${mc}"/>`;
  else if (q.mark === "raya") mk = `<line x1="13" y1="${cy}" x2="27" y2="${cy}" stroke="${mc}" stroke-width="3" stroke-linecap="round"/>`;
  else if (q.mark === "cruz") mk = `<path d="M20 ${cy - 6}V${cy + 6}M14 ${cy}H26" stroke="${mc}" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 40 40" class="glyph" aria-hidden="true">${shp}${mk}</svg>`;
}
