import MiniSearch, { type Options } from 'minisearch';

import { koreanNgramTokenize } from './tokenize';

export type SearchDoc = {
  id: string;
  domain: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
};

export const SEARCH_OPTIONS: Options<SearchDoc> = {
  fields: ['title', 'summary', 'tags', 'body'],
  storeFields: ['id', 'domain', 'slug', 'title', 'summary', 'body'],
  tokenize: koreanNgramTokenize,
  processTerm: (term) => term.toLowerCase().trim() || null,
  searchOptions: {
    boost: { title: 3, summary: 2, tags: 2, body: 1 },
    prefix: true,
    fuzzy: 0.1,
  },
};

export function createSearchIndex(): MiniSearch<SearchDoc> {
  return new MiniSearch<SearchDoc>(SEARCH_OPTIONS);
}

export function loadSearchIndex(json: string): MiniSearch<SearchDoc> {
  return MiniSearch.loadJSON<SearchDoc>(json, SEARCH_OPTIONS);
}
