const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const stripTags = (value) =>
  decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const slugify = (value) => {
  const base = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base.slice(0, 80) || 'section';
};

export const createSlug = (value, seen = new Set()) => {
  const baseSlug = slugify(value);
  let slug = baseSlug;
  let suffix = 2;

  while (seen.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  seen.add(slug);
  return slug;
};

export const addAnchorsToHtml = (html) => {
  const seen = new Set();
  return html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs = '', content) => {
    const hasId = /\bid\s*=/.test(attrs);
    if (hasId) {
      return full;
    }

    const text = stripTags(content);
    if (!text) {
      return full;
    }

    const slug = createSlug(text, seen);
    return `<h${level}${attrs ? ` ${attrs}` : ''} id="${slug}">${content}</h${level}>`;
  });
};

export const getPrimaryAnchor = (html) => {
  const match = html.match(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i);
  if (!match) {
    return '';
  }

  const text = stripTags(match[2]);
  if (!text) {
    return '';
  }

  return slugify(text);
};
