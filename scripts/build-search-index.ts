import { promises as fs } from 'node:fs';
import path from 'node:path';

import { listAllNodes } from '@/lib/content/loader';
import { createSearchIndex, type SearchDoc } from '@/lib/search/index';

async function main() {
  const all = await listAllNodes();
  const published = all.filter((n) => n.frontmatter.status === 'published');

  const docs: SearchDoc[] = await Promise.all(
    published.map(async (n) => {
      const filePath = path.join(process.cwd(), 'content', n.domain, n.filename);
      const raw = await fs.readFile(filePath, 'utf8');
      const bodyStart = raw.indexOf('\n---', 4);
      const body = bodyStart === -1 ? '' : raw.slice(bodyStart + 4).trim();
      return {
        id: n.frontmatter.id,
        domain: n.domain,
        slug: n.slug,
        title: n.frontmatter.title,
        summary: n.frontmatter.summary,
        body,
        tags: n.frontmatter.tags ?? [],
      };
    }),
  );

  const index = createSearchIndex();
  index.addAll(docs);

  const outPath = path.join(process.cwd(), 'public', 'search-index.json');
  await fs.writeFile(outPath, JSON.stringify(index), 'utf8');

  const stats = await fs.stat(outPath);
  console.log(
    `[search] indexed ${docs.length} docs → ${outPath} (${(stats.size / 1024).toFixed(1)}KB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
