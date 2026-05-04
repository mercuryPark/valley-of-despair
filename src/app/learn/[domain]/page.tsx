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
      <header className="border-border mb-8 border-b pb-6">
        <p className="text-muted-foreground text-sm">{nodes.length}개 노드</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{meta.label}</h1>
        <p className="text-muted-foreground mt-3 text-base">{meta.description}</p>
      </header>

      {nodes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">아직 작성된 노드가 없습니다.</p>
      ) : (
        <ol className="space-y-3">
          {nodes.map((node) => (
            <li key={node.slug}>
              <Link
                href={`/learn/${node.domain}/${node.slug}`}
                className="border-border hover:bg-muted/40 block rounded-md border p-4 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{node.frontmatter.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {node.frontmatter.estimatedMinutes}분 · {node.frontmatter.difficulty}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{node.frontmatter.summary}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
