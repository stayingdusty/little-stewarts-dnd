import { filterSpoilers, sortRecords } from './search-utils.js';

const state = {
  records: [],
  query: '',
  domain: 'all',
  includeSpoilers: false
};

const elements = {
  searchInput: document.querySelector('#searchInput'),
  domainFilter: document.querySelector('#domainFilter'),
  spoilerToggle: document.querySelector('#spoilerToggle'),
  resultCount: document.querySelector('#resultCount'),
  results: document.querySelector('#results'),
  template: document.querySelector('#resultCardTemplate')
};

const LABEL_OVERRIDES = {
  canon: 'Canon',
  'inventory-item': 'Inventory Item'
};

const titleCase = (value) => {
  const normalized = String(value || '').replace(/-/g, ' ');
  return LABEL_OVERRIDES[value] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeQuery = (value) => value.trim().toLowerCase();

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

  return sortRecords(filterSpoilers(matches, state.includeSpoilers));
};

const render = () => {
  const matches = filterRecords();
  elements.resultCount.textContent = `${matches.length} record(s) found`;
  elements.results.innerHTML = '';

  for (const record of matches) {
    const fragment = elements.template.content.cloneNode(true);
    fragment.querySelector('.card-title').textContent = record.name;
    fragment.querySelector('.pill').textContent = titleCase(record.kind);
    fragment.querySelector('.card-summary').textContent = record.summary || 'No summary available.';
    fragment.querySelector('.card-tags').textContent = `Tags: ${(record.tags || []).join(', ') || 'none'}`;
    fragment.querySelector('.card-source').textContent = `Source: ${record.sourcePath || 'n/a'}`;
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

  elements.spoilerToggle.addEventListener('change', (event) => {
    state.includeSpoilers = event.target.checked;
    render();
  });
};

const init = async () => {
  const response = await fetch('./data/search-index.json', { cache: 'no-store' });
  state.records = await response.json();
  bindEvents();
  render();
};

init().catch((error) => {
  elements.resultCount.textContent = 'Failed to load knowledge base data.';
  elements.results.textContent = error.message;
});
