import { promises as fs } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import { cache } from 'react';

import { DOMAINS, FrontmatterSchema, type Domain, type Frontmatter } from './schema';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const FILENAME_RE = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;

export type NodeMeta = {
  domain: Domain;
  slug: string;
  filename: string;
  frontmatter: Frontmatter;
};

export type LoadedNode = NodeMeta & {
  body: string;
};

function parseFilename(filename: string): { order: number; slug: string } | null {
  const m = FILENAME_RE.exec(filename);
  if (!m) return null;
  return { order: Number(m[1]), slug: m[2]! };
}

async function readNodeFile(
  domain: Domain,
  filename: string,
): Promise<{ frontmatter: Frontmatter; body: string }> {
  const filePath = path.join(CONTENT_ROOT, domain, filename);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const frontmatter = FrontmatterSchema.parse(parsed.data);
  return { frontmatter, body: parsed.content };
}

export const listAllNodes = cache(async (): Promise<NodeMeta[]> => {
  const out: NodeMeta[] = [];

  for (const domain of DOMAINS) {
    const dir = path.join(CONTENT_ROOT, domain);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }

    for (const filename of entries) {
      if (!filename.endsWith('.mdx')) continue;
      const parsed = parseFilename(filename);
      if (!parsed) continue;

      const { frontmatter } = await readNodeFile(domain, filename);
      out.push({ domain, slug: parsed.slug, filename, frontmatter });
    }
  }

  return out.sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.frontmatter.order - b.frontmatter.order;
  });
});

export async function listPublishedNodes(): Promise<NodeMeta[]> {
  const all = await listAllNodes();
  return all.filter((n) => n.frontmatter.status === 'published');
}

export async function listNodesByDomain(domain: Domain): Promise<NodeMeta[]> {
  const published = await listPublishedNodes();
  return published.filter((n) => n.domain === domain);
}

export async function loadNode(domain: Domain, slug: string): Promise<LoadedNode | null> {
  const dir = path.join(CONTENT_ROOT, domain);

  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }

  const target = entries.find((name) => {
    const parsed = parseFilename(name);
    return parsed?.slug === slug;
  });
  if (!target) return null;

  const { frontmatter, body } = await readNodeFile(domain, target);

  if (frontmatter.domain !== domain) {
    throw new Error(
      `frontmatter.domain(${frontmatter.domain})이 폴더(${domain})와 일치하지 않음: ${target}`,
    );
  }

  if (frontmatter.status !== 'published') return null;

  return { domain, slug, filename: target, frontmatter, body };
}

export async function getAdjacentNodes(
  domain: Domain,
  order: number,
): Promise<{ prev: NodeMeta | null; next: NodeMeta | null }> {
  const nodes = await listNodesByDomain(domain);
  const idx = nodes.findIndex((n) => n.frontmatter.order === order);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? (nodes[idx - 1] ?? null) : null,
    next: idx < nodes.length - 1 ? (nodes[idx + 1] ?? null) : null,
  };
}
