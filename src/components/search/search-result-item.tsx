'use client';

import { CommandItem } from '@/components/ui/command';
import type { NodeMeta } from '@/lib/content/loader';
import { DOMAIN_META } from '@/lib/content/schema';

export function SearchResultItem({
  node,
  snippet,
  onSelect,
}: {
  node: NodeMeta;
  snippet: string | null;
  onSelect: () => void;
}) {
  const domainLabel = DOMAIN_META[node.domain].label;
  return (
    <CommandItem onSelect={onSelect} className="flex flex-col items-start gap-1 px-3 py-2">
      <div className="flex w-full items-center gap-2">
        <span className="text-muted-foreground text-xs">{domainLabel}</span>
        <span className="text-sm font-medium">{node.frontmatter.title}</span>
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs">
        {snippet ?? node.frontmatter.summary}
      </p>
    </CommandItem>
  );
}
