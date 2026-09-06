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

const renderMap = (map) => `<div class="map-embed-wrap">
    <iframe class="map-embed" src="./old_world_map.html" title="${escapeHtml(map.alt)}"></iframe>
  </div>
  <p class="map-open-link"><a href="./old_world_map.html">Open the interactive map full screen</a></p>`;

const renderEncounters = (document) => `
  <header><p class="eyebrow">Arc ${document.arc} · DM-only structured reference</p><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.summary)}</p></header>
  <section class="map-panel">${renderMap(document.map)}<div><h2>How to use</h2><ol>${document.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></div></section>
  <section class="encounters">${document.encounters.map(renderEncounter).join('')}</section>`;

const kind = new URLSearchParams(location.search).get('document') === 'encounters' ? 'encounters' : 'lore';
const file = kind === 'encounters' ? 'old-world-encounters.json' : 'lore-cosmology-mythology.json';
const response = await fetch(`../data/world/${file}`);
if (!response.ok) throw new Error(`Unable to load ${file}`);
const documentRecord = await response.json();
document.title = documentRecord.title;
container.innerHTML = kind === 'encounters' ? renderEncounters(documentRecord) : renderLore(documentRecord);
