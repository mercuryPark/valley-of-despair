'use client';

import type { NodeMeta } from '@/lib/content/loader';
import { DOMAINS } from '@/lib/content/schema';

import { SearchResultItem } from './search-result-item';

export function SearchEmptyState({
  nodes,
  onSelect,
}: {
  nodes: NodeMeta[];
  onSelect: (n: NodeMeta) => void;
}) {
  const recommended = DOMAINS.flatMap((domain) => {
    const first = nodes
      .filter((n) => n.domain === domain)
      .sort((a, b) => a.frontmatter.order - b.frontmatter.order)[0];
    return first ? [first] : [];
  });

  return (
    <div className="space-y-1 p-2">
      <p className="text-muted-foreground px-2 py-1 text-xs">도메인별 시작 노드</p>
      {recommended.map((n) => (
        <SearchResultItem
          key={n.frontmatter.id}
          node={n}
          snippet={null}
          onSelect={() => onSelect(n)}
        />
      ))}
    </div>
  );
}
