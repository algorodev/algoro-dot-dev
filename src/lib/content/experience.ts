function baseName(path: string) {
  return path
    .split('/')
    .pop()!
    .replace(/\.mdx?$/, '');
}

function parseMonthYear(dateStr: string): Date {
  if (!dateStr) return new Date(0); // Return epoch for empty dates

  const [month, year] = dateStr.trim().split(' ');
  const monthMap: { [key: string]: number } = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };

  const monthIndex = monthMap[month.toUpperCase()];
  if (monthIndex === undefined) {
    console.warn(`Invalid month format: ${dateStr}`);
    return new Date(0);
  }

  return new Date(parseInt(year), monthIndex, 1);
}

export async function getAllExperiences() {
  const modules = import.meta.glob<any>('/src/content/experience/**/*.mdx', { eager: true });
  const experiences = Object.entries(modules).map(([file, mod]) => {
    const fm = mod.frontmatter || {};
    const slug = fm.slug || baseName(file);
    return { file, slug, ...fm, Content: mod.default };
  });

  if (experiences.length === 0) {
    throw new Error('No experience found');
  }

  return experiences.sort((a, b) => {
    const aIsActive = !a.end || a.end.trim() === '';
    const bIsActive = !b.end || b.end.trim() === '';

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    const startDateA = parseMonthYear(a.start);
    const startDateB = parseMonthYear(b.start);
    const startComparison = startDateB.getTime() - startDateA.getTime();

    if (startComparison !== 0) {
      return startComparison;
    }

    if (aIsActive && bIsActive) return 0;

    const endDateA = parseMonthYear(a.end || '');
    const endDateB = parseMonthYear(b.end || '');
    return endDateB.getTime() - endDateA.getTime();
  });
}
