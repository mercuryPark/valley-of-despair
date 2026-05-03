import { promises as fs } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

import { FrontmatterSchema, type Domain, type Frontmatter } from './schema';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

export type LoadedNode = {
  frontmatter: Frontmatter;
  body: string;
};

export async function loadNode(domain: Domain, slug: string): Promise<LoadedNode> {
  const dir = path.join(CONTENT_ROOT, domain);
  const entries = await fs.readdir(dir);
  const target = entries.find((name) => {
    if (!name.endsWith('.mdx')) return false;
    const withoutExt = name.replace(/\.mdx$/, '');
    return withoutExt === slug || withoutExt.replace(/^\d+-/, '') === slug;
  });

  if (!target) {
    throw new Error(`노드를 찾을 수 없음: ${domain}/${slug}`);
  }

  const filePath = path.join(dir, target);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const frontmatter = FrontmatterSchema.parse(parsed.data);

  if (frontmatter.domain !== domain) {
    throw new Error(
      `frontmatter.domain(${frontmatter.domain})이 폴더(${domain})와 일치하지 않음`,
    );
  }

  return {
    frontmatter,
    body: parsed.content,
  };
}
