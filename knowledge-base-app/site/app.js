import { DM_MODE_SESSION_KEY, DM_PASSWORD_SHA256 } from './dm-mode-config.js';
import { filterVisibleForMode, sortRecords } from './search-utils.js';
import { getSourceDocNavGroups } from './source-docs-nav.js';

const state = {
  records: [],
  query: '',
  domain: 'all',
  sourceNavOpen: false,
  dmMode: sessionStorage.getItem(DM_MODE_SESSION_KEY) === 'unlocked'
};

const elements = {
  searchInput: document.querySelector('#searchInput'),
  domainFilter: document.querySelector('#domainFilter'),
  resultCount: document.querySelector('#resultCount'),
  results: document.querySelector('#results'),
  template: document.querySelector('#resultCardTemplate'),
  sourceDocNav: document.querySelector('#sourceDocNav'),
  navToggle: document.querySelector('#navToggle'),
  dmModeButton: document.querySelector('#dmModeButton'),
  dmModeStatus: document.querySelector('#dmModeStatus'),
  dmDialog: document.querySelector('#dmDialog'),
  dmForm: document.querySelector('#dmForm'),
  dmPassword: document.querySelector('#dmPassword'),
  dmError: document.querySelector('#dmError'),
  dmCancelButton: document.querySelector('#dmCancelButton')
};

const LABEL_OVERRIDES = {
  canon: 'Canon',
  'inventory-item': 'Inventory Item'
};

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const titleCase = (value) => {
  const normalized = String(value || '').replace(/-/g, ' ');
  return LABEL_OVERRIDES[value] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeQuery = (value) => value.trim().toLowerCase();

const buildSourceHref = (record) => {
  const sourcePath = record.sourcePath || '';
  if (!sourcePath) return '#';

  const normalized = sourcePath
    .replace(/^DND-Source-Docs\//i, 'source-docs/')
    .replace(/^\.\//, '')
    .replace(/\\/g, '/');
  const anchor = record.sourceAnchor && !normalized.includes('#') ? `#${record.sourceAnchor}` : '';
  const [pathPart] = normalized.split(/[?#]/);
  const hasHtmlExtension = pathPart.toLowerCase().endsWith('.html');
  const targetPath = hasHtmlExtension ? normalized : `${normalized.replace(/\/+$/, '')}/index.html`;

  return `./${targetPath}${anchor}`;
};

const matchesQuery = (record, query) => {
  if (!query) return true;

  const haystacks = [
    record.name,
    record.summary,
    record.searchableText,
    record.tags || [],
    record.aliases || [],
    record.sourcePath || ''
  ];

  const flattened = haystacks.flat().filter(Boolean).join(' ').toLowerCase();

  return flattened.includes(query);
};

const filterRecords = () => {
  const query = normalizeQuery(state.query);

  const matches = state.records.filter((record) => {
    const matchesDomain = state.domain === 'all' || record.kind === state.domain;
    const matchesQueryText = matchesQuery(record, query);
    return matchesDomain && matchesQueryText;
  });

  return sortRecords(filterVisibleForMode(matches, state.dmMode));
};

const renderSourceDocNav = () => {
  const groups = getSourceDocNavGroups(state.dmMode);
  elements.sourceDocNav.innerHTML = '';
  elements.sourceDocNav.hidden = !state.sourceNavOpen;
  elements.navToggle.setAttribute('aria-expanded', String(state.sourceNavOpen));
  elements.navToggle.querySelector('.nav-card__toggle-text').textContent = state.sourceNavOpen ? 'Hide source docs' : 'Browse source docs';

  if (!state.sourceNavOpen) {
    return;
  }

  if (!groups.length) {
    elements.sourceDocNav.innerHTML = '<p class="nav-card__hint">No player documents are available.</p>';
    return;
  }

  for (const group of groups) {
    const section = document.createElement('section');
    section.className = 'source-doc-nav__group';
    const icon = group.title === 'Character sheets' ? '🧙' : group.title === 'Playthrough summaries' ? '📖' : '🌍';
    const branchesMarkup = group.branches
      .map((branch) => `
        <div class="source-doc-nav__branch">
          <div class="source-doc-nav__branch-title">${branch.title}</div>
          <ul>${branch.items.map((item) => `<li><a href="${item.href}"><span class="source-doc-nav__item-icon">${item.icon || '📄'}</span>${item.label}</a></li>`).join('')}</ul>
        </div>`)
      .join('');
    section.innerHTML = `<h3><span class="source-doc-nav__icon">${icon}</span>${group.title}</h3>${branchesMarkup}`;
    elements.sourceDocNav.append(section);
  }
};

const render = () => {
  const matches = filterRecords();
  renderSourceDocNav();
  elements.dmModeStatus.textContent = state.dmMode ? 'DM spoilers mode is on.' : 'Player-safe mode is on.';
  elements.dmModeButton.textContent = state.dmMode ? 'Lock DM spoilers' : 'Unlock DM spoilers';
  elements.resultCount.textContent = `${matches.length} record(s) found${state.dmMode ? ' · DM spoilers included' : ''}`;
  elements.results.innerHTML = '';

  for (const record of matches) {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector('.card');
    if (record.visibility === 'dm-only') card.classList.add('card--dm');
    fragment.querySelector('.card-title').textContent = record.name;
    fragment.querySelector('.pill').textContent = titleCase(record.kind);
    fragment.querySelector('.card-summary').textContent = record.summary || 'No summary available.';
    fragment.querySelector('.card-tags').textContent = `Tags: ${(record.tags || []).join(', ') || 'none'}`;

    const sourceLink = fragment.querySelector('.card-source');
    const sourceHref = buildSourceHref(record);
    const linkTarget = record.visibility === 'dm-only' ? '' : ' target="_blank" rel="noopener noreferrer"';
    sourceLink.innerHTML = `<a href="${sourceHref}"${linkTarget}>Source: ${record.sourcePath || 'n/a'}</a>`;

    elements.results.append(fragment);
  }
};

const bindEvents = () => {
  elements.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });

  elements.domainFilter.addEventListener('change', (event) => {
    state.domain = event.target.value;
    render();
  });

  elements.navToggle.addEventListener('click', () => {
    state.sourceNavOpen = !state.sourceNavOpen;
    renderSourceDocNav();
  });

  elements.dmModeButton.addEventListener('click', () => {
    if (state.dmMode) {
      state.dmMode = false;
      sessionStorage.removeItem(DM_MODE_SESSION_KEY);
      render();
      return;
    }

    elements.dmError.textContent = '';
    elements.dmPassword.value = '';
    elements.dmDialog.showModal();
    elements.dmPassword.focus();
  });

  elements.dmCancelButton.addEventListener('click', () => elements.dmDialog.close());

  elements.dmForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const passwordHash = await sha256(elements.dmPassword.value);
    if (passwordHash !== DM_PASSWORD_SHA256) {
      elements.dmError.textContent = 'That password did not match.';
      elements.dmPassword.select();
      return;
    }

    state.dmMode = true;
    sessionStorage.setItem(DM_MODE_SESSION_KEY, 'unlocked');
    elements.dmDialog.close();
    render();
  });
};

const init = async () => {
  const response = await fetch('./data/search-index.json', { cache: 'no-store' });
  state.records = await response.json();
  bindEvents();
  render();

  if (new URLSearchParams(window.location.search).get('dm') === 'locked') {
    elements.dmModeButton.click();
  }
};

init().catch((error) => {
  elements.resultCount.textContent = 'Failed to load knowledge base data.';
  elements.results.textContent = error.message;
});
