import { MDXRemote } from 'next-mdx-remote/rsc';

import { loadNode } from '@/lib/content/loader';
import { mdxOptions } from '@/lib/content/mdx';

export const dynamic = 'force-static';

export default async function PreviewPage() {
  const { frontmatter, body } = await loadNode('rendering', 'html-parsing');

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-border mb-8 border-b pb-6">
        <p className="text-muted-foreground text-sm">
          {frontmatter.domain} · {frontmatter.estimatedMinutes}분 · {frontmatter.difficulty}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">
          {frontmatter.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{frontmatter.summary}</p>
      </header>

      <div className="mdx-body space-y-4 leading-7">
        <MDXRemote source={body} options={{ mdxOptions }} />
      </div>
    </article>
  );
}
