'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ProgressIndicator } from '@/components/sidebar/progress-indicator';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NodeMeta } from '@/lib/content/loader';
import { DOMAIN_META, DOMAINS, type Domain } from '@/lib/content/schema';

function currentDomainFromPath(pathname: string): Domain | null {
  const m = /^\/learn\/([^/]+)/.exec(pathname);
  if (!m) return null;
  const candidate = m[1]!;
  return (DOMAINS as readonly string[]).includes(candidate) ? (candidate as Domain) : null;
}

type ExpandState = {
  // The domain that was active when manualExpanded was last reset.
  anchorDomain: Domain | null;
  // User-toggled overrides on top of the anchor.
  manualExpanded: Set<Domain>;
};

export function NodeTree({ nodes, showProgress }: { nodes: NodeMeta[]; showProgress: boolean }) {
  const pathname = usePathname();
  const currentDomain = currentDomainFromPath(pathname);

  const [expandState, setExpandState] = useState<ExpandState>(() => ({
    anchorDomain: currentDomain,
    manualExpanded: new Set(currentDomain ? [currentDomain] : []),
  }));

  // When the domain changes, derive a fresh expansion set (no effect needed).
  const effectiveExpanded: Set<Domain> =
    expandState.anchorDomain === currentDomain
      ? expandState.manualExpanded
      : new Set(currentDomain ? [currentDomain] : []);

  function toggle(d: Domain) {
    setExpandState((prev) => {
      // If domain has changed since last toggle, reset first.
      const base: Set<Domain> =
        prev.anchorDomain === currentDomain
          ? prev.manualExpanded
          : new Set(currentDomain ? [currentDomain] : []);
      const next = new Set(base);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return { anchorDomain: currentDomain, manualExpanded: next };
    });
  }

  return (
    <>
      {DOMAINS.map((domain) => {
        const domainNodes = nodes.filter((n) => n.domain === domain);
        const isOpen = effectiveExpanded.has(domain);
        return (
          <SidebarGroup key={domain}>
            <SidebarGroupLabel asChild>
              <button
                type="button"
                onClick={() => toggle(domain)}
                className="flex w-full items-center justify-between"
              >
                <span>{DOMAIN_META[domain].label}</span>
                <span className="text-xs">{isOpen ? '▾' : '▸'}</span>
              </button>
            </SidebarGroupLabel>
            {isOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {domainNodes.map((n) => {
                    const href = `/learn/${n.domain}/${n.slug}`;
                    const isActive = pathname === href;
                    return (
                      <SidebarMenuItem key={n.frontmatter.id}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={href} className="flex items-center gap-2">
                            {showProgress && (
                              <ProgressIndicator
                                nodeSlug={n.frontmatter.id}
                                enabled={showProgress}
                              />
                            )}
                            <span className="truncate text-sm">{n.frontmatter.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {domainNodes.length === 0 && (
                    <p className="text-muted-foreground px-2 py-1 text-xs">준비 중</p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        );
      })}
    </>
  );
}
