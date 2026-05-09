'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type MiniSearch from 'minisearch';

import { CommandDialog, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command';
import type { NodeMeta } from '@/lib/content/loader';
import { loadSearchIndex, type SearchDoc } from '@/lib/search/index';

import { SearchEmptyState } from './search-empty-state';
import { SearchResultItem } from './search-result-item';

const MAX_RESULTS = 10;

export function SearchDialog({
  open,
  onOpenChange,
  nodes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: NodeMeta[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const indexRef = useRef<MiniSearch<SearchDoc> | null>(null);
  const [indexReady, setIndexReady] = useState(false);
  const [results, setResults] = useState<{ doc: SearchDoc; snippet: string | null }[]>([]);

  useEffect(() => {
    if (!open || indexRef.current) return;
    let cancelled = false;
    fetch('/search-index.json')
      .then((r) => r.text())
      .then((json) => {
        if (cancelled) return;
        indexRef.current = loadSearchIndex(json);
        setIndexReady(true);
      })
      .catch((err) => console.error('[search] index load failed', err));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!indexRef.current || query.trim().length === 0) {
      setResults([]);
      return;
    }
    const raw = indexRef.current.search(query);
    const top = raw.slice(0, MAX_RESULTS);
    const next = top.map((r) => {
      const doc = r as unknown as SearchDoc;
      const snippet = extractSnippet(doc.body, query, 120);
      return { doc, snippet };
    });
    setResults(next);
  }, [query, indexReady]);

  function selectByDoc(doc: SearchDoc) {
    onOpenChange(false);
    setQuery('');
    router.push(`/learn/${doc.domain}/${doc.slug}`);
  }

  function selectByNode(n: NodeMeta) {
    onOpenChange(false);
    setQuery('');
    router.push(`/learn/${n.domain}/${n.slug}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="노드·키워드 검색…" value={query} onValueChange={setQuery} />
      <CommandList>
        {query.trim().length === 0 ? (
          <SearchEmptyState nodes={nodes} onSelect={selectByNode} />
        ) : results.length === 0 ? (
          <CommandEmpty>검색 결과 없음</CommandEmpty>
        ) : (
          <div className="space-y-1 p-2">
            {results.map(({ doc, snippet }) => {
              const node = nodes.find((n) => n.frontmatter.id === doc.id);
              if (!node) return null;
              return (
                <SearchResultItem
                  key={doc.id}
                  node={node}
                  snippet={snippet}
                  onSelect={() => selectByDoc(doc)}
                />
              );
            })}
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function extractSnippet(body: string, query: string, len: number): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const idx = body.toLowerCase().indexOf(q);
  if (idx === -1) return body.slice(0, len);
  const start = Math.max(0, idx - 30);
  const end = Math.min(body.length, idx + q.length + len - 30);
  return (start > 0 ? '… ' : '') + body.slice(start, end) + (end < body.length ? ' …' : '');
}
