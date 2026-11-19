import { UI_TEXT } from '../i18n/translations.ts';
import type { Listing, SupportedLang } from '../types/index.ts';

export function matchesListingSearch(
  item: Listing,
  rawQuery: string,
  lang: SupportedLang
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const t = UI_TEXT[lang];
  const tr = item.translations?.[lang];
  const enTr = item.translations?.en;

  const haystack = [
    tr?.title,
    tr?.description,
    tr?.location,
    tr?.specsSummary,
    enTr?.title,
    enTr?.description,
    enTr?.location,
    enTr?.specsSummary,
    item.title,
    item.description,
    item.location,
    item.ownerName,
    item.category,
    t.categories[item.category],
    UI_TEXT.en.categories[item.category],
    item.specs?.restaurantName,
    item.specs?.brand,
    item.specs?.fuel,
    item.specs?.transmission,
    item.specs?.condition,
    item.specs?.employmentType,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}
