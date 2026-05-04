import type { Metadata } from 'next';
import Link from 'next/link';

import { listAllNodes } from '@/lib/content/loader';
import { DOMAIN_META, DOMAINS } from '@/lib/content/schema';

export const metadata: Metadata = {
  title: '학습',
};

export default async function LearnIndexPage(): Promise<React.JSX.Element> {
  const allNodes = await listAllNodes();

  const countByDomain = DOMAINS.reduce<Record<string, number>>((acc, d) => {
    acc[d] = allNodes.filter((n) => n.domain === d && n.frontmatter.status === 'published').length;
    return acc;
  }, {});

  return (
    <div>
      <header className="border-border mb-10 border-b pb-6">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">학습</h1>
        <p className="text-muted-foreground mt-3 text-base">
          6개 도메인에서 핵심 개념을 연결하며 학습한다. 도메인을 선택해 시작한다.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DOMAINS.map((domain) => {
          const meta = DOMAIN_META[domain];
          const count = countByDomain[domain] ?? 0;

          return (
            <li key={domain}>
              <Link
                href={`/learn/${domain}`}
                className="border-border hover:bg-muted/40 flex h-full flex-col rounded-md border p-5 transition-colors"
              >
                <span className="text-xs font-medium tracking-widest uppercase opacity-60">
                  {domain}
                </span>
                <span className="mt-2 text-lg font-semibold">{meta.label}</span>
                <span className="text-muted-foreground mt-1 flex-1 text-sm">
                  {meta.description}
                </span>
                <span className="text-muted-foreground mt-4 text-xs">
                  {count > 0 ? `${count}개 노드` : '준비 중'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
