import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { listNodesByDomain } from '@/lib/content/loader';
import { DOMAIN_META, DOMAINS, type Domain } from '@/lib/content/schema';

type Params = { domain: string };

export function generateStaticParams(): { domain: string }[] {
  return DOMAINS.map((domain) => ({ domain }));
}

export const dynamic = 'force-static';

function isDomain(value: string): value is Domain {
  return (DOMAINS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { domain } = await params;
  if (!isDomain(domain)) return {};
  return { title: DOMAIN_META[domain].label };
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  review: '검토 중',
  published: '공개',
};

export default async function DomainIndexPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<React.JSX.Element> {
  const { domain } = await params;
  if (!isDomain(domain)) notFound();

  const meta = DOMAIN_META[domain];
  const nodes = await listNodesByDomain(domain);

  return (
    <article>
      <div className="text-muted-foreground mb-6 text-sm">
        <Link href="/learn" className="hover:underline">
          ← 학습 인덱스
        </Link>
      </div>

      <header className="border-border mb-8 border-b pb-6">
        <p className="text-muted-foreground text-sm">{nodes.length}개 노드</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{meta.label}</h1>
        <p className="text-muted-foreground mt-3 text-base">{meta.description}</p>
      </header>

      {nodes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          {meta.label} 노드를 준비 중이다. 곧 공개될 예정이다.
        </p>
      ) : (
        <ol className="space-y-3">
          {nodes.map((node) => {
            const status = node.frontmatter.status;
            return (
              <li key={node.slug}>
                <Link
                  href={`/learn/${node.domain}/${node.slug}`}
                  className="border-border hover:bg-muted/40 block rounded-md border p-4 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
                        {node.frontmatter.order}
                      </span>
                      <span className="font-medium">{node.frontmatter.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[status] ?? STATUS_STYLE['draft']}`}
                      >
                        {STATUS_LABEL[status] ?? status}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {node.frontmatter.estimatedMinutes}분 ·{' '}
                        {DIFFICULTY_LABEL[node.frontmatter.difficulty] ??
                          node.frontmatter.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 pl-8 text-sm">
                    {node.frontmatter.summary}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
