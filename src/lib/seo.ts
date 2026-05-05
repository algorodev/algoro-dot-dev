// Schema.org JSON-LD builders. Keep the shape small and explicit — Google ignores
// unrecognised fields silently, so it's better to ship less data correctly than
// more data with guesses.

const SITE_URL = 'https://www.algoro.dev';
const NAME = 'Alejandro Gonzalez Romero';
const ALT_NAME = 'algorodev';
const ROLE = 'Senior AI Engineer';
const EMAIL = 'me@algoro.dev';
const LOCATION = { city: 'Dublin', country: 'IE' };
const PROFILES = [
  'https://github.com/algorodev',
  'https://www.linkedin.com/in/algorodev/',
];

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: NAME,
    alternateName: ALT_NAME,
    url: SITE_URL,
    email: `mailto:${EMAIL}`,
    jobTitle: ROLE,
    worksFor: {
      '@type': 'Organization',
      name: 'Prozeso',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: LOCATION.city,
      addressCountry: LOCATION.country,
    },
    sameAs: PROFILES,
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    name: 'algoro.dev',
    description:
      "Senior AI Engineer · production AI systems that ship, scale, and don't break.",
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: NAME,
      url: SITE_URL,
    },
  };
}

export function profilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_URL}/about`,
    mainEntity: personSchema(),
  };
}

export function breadcrumbsSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export function creativeWorkSchema(work: {
  title: string;
  summary: string;
  slug: string;
  client: string;
  year: string;
  tags?: string[];
  stack?: string[];
}) {
  const keywords = [...(work.tags ?? []), ...(work.stack ?? [])].join(', ');
  // datePublished accepts YYYY or YYYY-MM-DD; clamp to a single year if a range
  // (e.g. "2022 — 2023") slipped in via the frontmatter.
  const yearMatch = work.year.match(/(\d{4})/);
  const datePublished = yearMatch ? yearMatch[1] : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    description: work.summary,
    url: `${SITE_URL}/work/${work.slug}`,
    about: work.client,
    ...(datePublished ? { datePublished } : {}),
    ...(keywords ? { keywords } : {}),
    author: {
      '@type': 'Person',
      name: NAME,
      url: SITE_URL,
    },
  };
}

export function contactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${SITE_URL}/contact`,
    name: 'Contact',
    description:
      'Open to senior contracts and full-time roles at AI-first companies.',
    mainEntity: personSchema(),
  };
}
