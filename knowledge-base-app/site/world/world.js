const container = document.querySelector('#document');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const renderBlock = (block) => {
  if (block.type === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`;
  if (block.type === 'heading') return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
  if (block.type === 'callout') return `<aside class="callout callout--${escapeHtml(block.style)}">${escapeHtml(block.text)}</aside>`;
  if (block.type === 'list') {
    const tag = block.ordered ? 'ol' : 'ul';
    return `<${tag}>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
  }
  if (block.type === 'table') return `<div class="table-wrap"><table><thead><tr>${block.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return '';
};

const renderLore = (document) => `
  <header><p class="eyebrow">Arc ${document.arc} · DM-only structured reference</p><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.summary)}</p></header>
  <section class="intro">${document.intro.map(renderBlock).join('')}</section>
  ${document.sections.map((section) => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${section.blocks.map(renderBlock).join('')}</section>`).join('')}`;

const renderEncounter = (encounter) => `<article class="encounter" id="${escapeHtml(encounter.id)}">
  <header class="encounter__head"><span class="marker">${encounter.marker}</span><div><h2>${escapeHtml(encounter.name)}</h2><p>${escapeHtml(encounter.location)}</p></div><div class="checks">□ Discovered<br>□ Completed</div></header>
  <p class="hook">${escapeHtml(encounter.hook)}</p>
  <div class="encounter__grid"><div><h3>Roster</h3><p>${escapeHtml(encounter.roster)}</p><h3>Battlefield</h3><p>${escapeHtml(encounter.battlefield)}</p></div><div><h3>What they want</h3><p>${escapeHtml(encounter.motivation)}</p><h3>Other endings</h3><p>${escapeHtml(encounter.alternateEndings)}</p></div></div>
  ${encounter.reward ? `<p class="reward"><strong>Reward:</strong> ${escapeHtml(encounter.reward)}</p>` : ''}<h3>Initiative / HP / Notes</h3><div class="notes"></div>
</article>`;

const renderMap = (map) => `<div class="map-canvas-wrap"><canvas id="worldMap" role="img" aria-label="${escapeHtml(map.alt)}"></canvas></div>
  <p class="map-key"><span>● Settlement</span><span>◉ Encounter</span><span>⌁ River</span><span>┄ Travel route</span></p>`;

const renderEncounters = (document) => `
  <header><p class="eyebrow">Arc ${document.arc} · DM-only structured reference</p><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.summary)}</p></header>
  <section class="map-panel">${renderMap(document.map)}<div><h2>How to use</h2><ol>${document.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></div></section>
  <section class="encounters">${document.encounters.map(renderEncounter).join('')}</section>`;

const drawWorldMap = (map) => {
  const canvas = document.querySelector('#worldMap');
  if (!canvas) return;
  const { width, height } = map.coordinateSystem;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.aspectRatio = `${width} / ${height}`;
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#eee4c8'); background.addColorStop(1, '#c6af7d');
  context.fillStyle = background; context.fillRect(0, 0, width, height);

  const terrainColors = { mountains: '#978a75', desert: '#dac48a', bog: '#718368', sea: '#7999a0', moor: '#91846d' };
  for (const region of map.regions) {
    context.save(); context.globalAlpha = 0.72; context.fillStyle = terrainColors[region.terrain] || '#b4a37f';
    context.beginPath(); context.ellipse(region.x + region.width / 2, region.y + region.height / 2, region.width / 2, region.height / 2, -0.08, 0, Math.PI * 2); context.fill();
    if (region.terrain === 'mountains') {
      context.strokeStyle = '#51493f'; context.lineWidth = 2;
      for (let x = region.x + 20; x < region.x + region.width; x += 42) { context.beginPath(); context.moveTo(x - 17, region.y + region.height - 10); context.lineTo(x, region.y + 28 + (x % 3) * 8); context.lineTo(x + 20, region.y + region.height - 10); context.stroke(); }
    }
    context.restore();
    context.fillStyle = '#3d382f'; context.font = 'bold 22px Georgia'; context.textAlign = 'center'; context.fillText(region.name, region.x + region.width / 2, region.y + region.height / 2);
  }

  const drawPath = (feature, color, widthValue, dash = []) => {
    context.save(); context.strokeStyle = color; context.lineWidth = widthValue; context.setLineDash(dash); context.beginPath();
    feature.points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.stroke(); context.restore();
    if (feature.name) { const midpoint = feature.points[Math.floor(feature.points.length / 2)]; context.fillStyle = color; context.font = 'italic 16px Georgia'; context.textAlign = 'center'; context.fillText(feature.name, midpoint[0], midpoint[1] - 10); }
  };
  map.waterways.forEach((feature) => drawPath(feature, '#315f73', 6));
  map.routes.forEach((feature) => drawPath(feature, '#514331', 4, [12, 9]));

  for (const landmark of map.landmarks) {
    context.fillStyle = landmark.kind === 'arc' ? '#241d28' : '#6b3029'; context.beginPath(); context.arc(landmark.x, landmark.y, landmark.kind === 'arc' ? 13 : 7, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#2e2922'; context.font = 'bold 19px Georgia'; context.textAlign = 'center'; context.fillText(landmark.name, landmark.x, landmark.y + 28);
  }
  for (const marker of map.encounterMarkers) {
    context.fillStyle = '#fffdf4'; context.beginPath(); context.arc(marker.x, marker.y, 22, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#2b2925'; context.lineWidth = 3; context.stroke();
    context.fillStyle = '#151412'; context.font = 'bold 20px system-ui'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(marker.marker, marker.x, marker.y);
  }
  context.strokeStyle = '#6d5b3b'; context.lineWidth = 6; context.strokeRect(3, 3, width - 6, height - 6);
};

const kind = new URLSearchParams(location.search).get('document') === 'encounters' ? 'encounters' : 'lore';
const file = kind === 'encounters' ? 'old-world-encounters.json' : 'lore-cosmology-mythology.json';
const response = await fetch(`../data/world/${file}`);
if (!response.ok) throw new Error(`Unable to load ${file}`);
const documentRecord = await response.json();
document.title = documentRecord.title;
container.innerHTML = kind === 'encounters' ? renderEncounters(documentRecord) : renderLore(documentRecord);
if (kind === 'encounters') drawWorldMap(documentRecord.map);
