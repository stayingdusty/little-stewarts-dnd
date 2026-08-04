const documentRoot = document.querySelector('#summaryDocument');
const picker = document.querySelector('#summaryPicker');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const render = (record) => {
  document.title = `${record.title} — Little Stewarts D&D`;
  documentRoot.innerHTML = `
    <header>
      <h1>${escapeHtml(record.title)}</h1>
      <p class="subtitle">${escapeHtml(record.subtitle)}</p>
      <section class="meta" aria-label="Session metadata">
        ${Object.entries(record.metadata).map(([label, value]) => `<div><strong>${escapeHtml(label.replace(/([A-Z])/g, ' $1'))}</strong>${escapeHtml(value)}</div>`).join('')}
      </section>
    </header>
    <section class="summary-grid">
      <div class="box callout"><h3>Chapter Snapshot</h3><p>${escapeHtml(record.summary)}</p></div>
      <div class="box callout"><h3>Major Outcome</h3><p>${escapeHtml(record.majorOutcome)}</p></div>
    </section>
    ${record.sections.map((section) => `<section class="document-section"><h2>${escapeHtml(section.heading)}</h2>${section.bodyHtml}</section>`).join('')}`;
};

const loadRecord = async (manifest) => {
  const requested = location.hash.slice(1);
  const entry = manifest.find((item) => item.id === requested) || manifest[0];
  if (!entry) throw new Error('No structured playthrough summaries are available.');
  if (location.hash !== `#${entry.id}`) history.replaceState(null, '', `#${entry.id}`);
  picker.value = entry.id;
  const response = await fetch(`../${entry.path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${entry.title}.`);
  render(await response.json());
};

const init = async () => {
  const response = await fetch('../data/playthrough-summaries.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load the playthrough summary index.');
  const manifest = await response.json();
  picker.innerHTML = manifest.map((item) => `<option value="${escapeHtml(item.id)}">Arc ${item.arc}, Chapter ${item.chapter}</option>`).join('');
  picker.addEventListener('change', () => { location.hash = picker.value; });
  window.addEventListener('hashchange', () => loadRecord(manifest));
  document.querySelector('#printButton').addEventListener('click', () => window.print());
  await loadRecord(manifest);
};

init().catch((error) => {
  documentRoot.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
});
