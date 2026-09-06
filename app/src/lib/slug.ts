const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Vietnamese-aware slugify: strips diacritics, folds đ->d, collapses to `a-z0-9-`. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
