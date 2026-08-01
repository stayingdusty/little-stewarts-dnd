const state = {
  records: [],
  query: '',
  domain: 'all'
};

const elements = {
  searchInput: document.querySelector('#searchInput'),
  domainFilter: document.querySelector('#domainFilter'),
  resultCount: document.querySelector('#resultCount'),
  results: document.querySelector('#results'),
  template: document.querySelector('#resultCardTemplate')
};

const titleCase = (value) => value.replace(/\b\w/g, (char) => char.toUpperCase());

const filterRecords = () => {
  const query = state.query.trim().toLowerCase();

  return state.records.filter((record) => {
    const matchesDomain = state.domain === 'all' || record.kind === state.domain;
    const matchesQuery = !query || record.searchableText.includes(query);
    return matchesDomain && matchesQuery;
  });
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
