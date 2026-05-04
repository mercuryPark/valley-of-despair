import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { getAdjacentNodes, listPublishedNodes, loadNode } from '@/lib/content/loader';
import { mdxOptions } from '@/lib/content/mdx';
import { DOMAIN_META, DOMAINS, type Domain } from '@/lib/content/schema';

type Params = { domain: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const nodes = await listPublishedNodes();
  return nodes.map((n) => ({ domain: n.domain, slug: n.slug }));
}

export const dynamic = 'force-static';

function isDomain(value: string): value is Domain {
  return (DOMAINS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { domain, slug } = await params;
  if (!isDomain(domain)) return {};
  const node = await loadNode(domain, slug);
  if (!node) return {};
  return {
    title: node.frontmatter.title,
    description: node.frontmatter.summary,
  };
}

export default async function NodePage({
  params,
}: {
  params: Promise<Params>;
}): Promise<React.JSX.Element> {
  const { domain, slug } = await params;
  if (!isDomain(domain)) notFound();

  const node = await loadNode(domain, slug);
  if (!node) notFound();

  const { prev, next } = await getAdjacentNodes(node.domain, node.frontmatter.order);
  const allNodes = await listPublishedNodes();
  const prereqs = node.frontmatter.prerequisites
    .map((id) => allNodes.find((n) => n.frontmatter.id === id))
    .filter((n): n is NonNullable<typeof n> => n !== undefined);

  const domainMeta = DOMAIN_META[node.domain];

  return (
    <article>
      <header className="border-border mb-8 border-b pb-6">
        <p className="text-muted-foreground text-sm">
          <Link href={`/learn/${node.domain}`} className="hover:underline">
            {domainMeta.label}
          </Link>
          {' · '}
          {node.frontmatter.estimatedMinutes}분 · {node.frontmatter.difficulty}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">
          {node.frontmatter.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{node.frontmatter.summary}</p>

        {prereqs.length > 0 && (
          <div className="mt-5">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">선수 지식</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {prereqs.map((p) => (
                <li key={p.frontmatter.id}>
                  <Link
                    href={`/learn/${p.domain}/${p.slug}`}
                    className="border-border hover:bg-muted/40 inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors"
                  >
                    {p.frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="mdx-body space-y-4 leading-7">
        <MDXRemote source={node.body} options={{ mdxOptions }} />
      </div>

      <p className="text-muted-foreground border-border mt-8 border-t pt-4 text-xs">
        이 노드는 외부 자료(MDN·web.dev·공식 문서)와 LLM 보조로 정리한 학습 노트입니다.
      </p>

      {(prev || next) && (
        <nav className="border-border mt-12 grid grid-cols-2 gap-4 border-t pt-6">
          <div>
            {prev && (
              <Link
                href={`/learn/${prev.domain}/${prev.slug}`}
                className="border-border hover:bg-muted/40 block rounded-md border p-4 transition-colors"
              >
                <p className="text-muted-foreground text-xs">← 이전</p>
                <p className="mt-1 text-sm font-medium">{prev.frontmatter.title}</p>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link
                href={`/learn/${next.domain}/${next.slug}`}
                className="border-border hover:bg-muted/40 block rounded-md border p-4 transition-colors"
              >
                <p className="text-muted-foreground text-xs">다음 →</p>
                <p className="mt-1 text-sm font-medium">{next.frontmatter.title}</p>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}
