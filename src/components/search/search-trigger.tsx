'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { NodeMeta } from '@/lib/content/loader';

import { SearchDialog } from './search-dialog';
import { useCmdK } from './use-cmdk';

export function SearchTrigger({ nodes }: { nodes: NodeMeta[] }) {
  const [open, setOpen] = useState(false);

  useCmdK(() => setOpen((v) => !v));

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="검색 (Cmd+K)"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} nodes={nodes} />
    </>
  );
}
