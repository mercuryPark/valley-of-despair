import { promises as fs } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

import { FrontmatterSchema, type Frontmatter } from '../src/lib/content/schema';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const FILENAME_RE = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;

type Severity = 'error' | 'warning';
type Issue = { file: string; message: string; severity: Severity };

type LoadedNode = {
  file: string;
  relPath: string;
  domainFolder: string;
  filename: string;
  frontmatter: Frontmatter;
};

async function listMdxFiles(): Promise<string[]> {
  const out: string[] = [];
  const domainDirs = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  for (const d of domainDirs) {
    if (!d.isDirectory()) continue;
    const domainPath = path.join(CONTENT_ROOT, d.name);
    const files = await fs.readdir(domainPath);
    for (const f of files) {
      if (f.endsWith('.mdx')) out.push(path.join(domainPath, f));
    }
  }
  return out.sort();
}

async function parseNode(file: string, issues: Issue[]): Promise<LoadedNode | null> {
  const relPath = path.relative(process.cwd(), file);
  const filename = path.basename(file);
  const domainFolder = path.basename(path.dirname(file));

  const raw = await fs.readFile(file, 'utf8');
  const parsed = matter(raw);

  const result = FrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    for (const err of result.error.issues) {
      const fieldPath = err.path.join('.') || '(root)';
      issues.push({
        file: relPath,
        message: `frontmatter.${fieldPath}: ${err.message}`,
        severity: 'error',
      });
    }
    return null;
  }

  return { file, relPath, domainFolder, filename, frontmatter: result.data };
}

function checkFolderMatchesDomain(node: LoadedNode, issues: Issue[]): void {
  if (node.frontmatter.domain !== node.domainFolder) {
    issues.push({
      file: node.relPath,
      message: `폴더(${node.domainFolder})와 frontmatter.domain(${node.frontmatter.domain})이 일치하지 않음`,
      severity: 'error',
    });
  }
}

function checkFilenamePattern(node: LoadedNode, issues: Issue[]): void {
  const m = FILENAME_RE.exec(node.filename);
  if (!m) {
    issues.push({
      file: node.relPath,
      message: `파일명이 {order:02}-{slug}.mdx 패턴이 아님 (예: 03-crp.mdx)`,
      severity: 'error',
    });
    return;
  }

  const fileOrder = Number(m[1]);
  const fileSlug = m[2]!;

  if (fileOrder !== node.frontmatter.order) {
    issues.push({
      file: node.relPath,
      message: `파일명 order(${fileOrder})와 frontmatter.order(${node.frontmatter.order}) 불일치`,
      severity: 'error',
    });
  }

  if (!node.frontmatter.id.endsWith(fileSlug)) {
    issues.push({
      file: node.relPath,
      message: `파일명 slug(${fileSlug})가 frontmatter.id(${node.frontmatter.id}) 끝과 일치하지 않음`,
      severity: 'error',
    });
  }
}

function checkGlobalIdUniqueness(nodes: LoadedNode[], issues: Issue[]): void {
  const seen = new Map<string, string>();
  for (const n of nodes) {
    const id = n.frontmatter.id;
    const prev = seen.get(id);
    if (prev !== undefined) {
      issues.push({
        file: n.relPath,
        message: `중복된 id: '${id}' (이미 ${prev}에서 사용)`,
        severity: 'error',
      });
    } else {
      seen.set(id, n.relPath);
    }
  }
}

function checkOrderUniquePerDomain(nodes: LoadedNode[], issues: Issue[]): void {
  const byDomain = new Map<string, Map<number, string>>();
  for (const n of nodes) {
    const domainMap = byDomain.get(n.frontmatter.domain) ?? new Map<number, string>();
    const prev = domainMap.get(n.frontmatter.order);
    if (prev !== undefined) {
      issues.push({
        file: n.relPath,
        message: `도메인 내 order 중복: ${n.frontmatter.domain}/${n.frontmatter.order} (이미 ${prev})`,
        severity: 'error',
      });
    } else {
      domainMap.set(n.frontmatter.order, n.relPath);
    }
    byDomain.set(n.frontmatter.domain, domainMap);
  }
}

function checkRefIntegrity(nodes: LoadedNode[], issues: Issue[]): void {
  const allIds = new Set(nodes.map((n) => n.frontmatter.id));
  for (const n of nodes) {
    for (const ref of n.frontmatter.prerequisites) {
      if (!allIds.has(ref)) {
        issues.push({
          file: n.relPath,
          message: `prerequisites '${ref}' — 해당 id의 노드가 없음`,
          severity: 'error',
        });
      }
    }
    for (const ref of n.frontmatter.crossLinks ?? []) {
      if (!allIds.has(ref)) {
        issues.push({
          file: n.relPath,
          message: `crossLinks '${ref}' — 해당 id의 노드가 없음 (작성 예정 노드일 수 있음)`,
          severity: 'warning',
        });
      }
    }
  }
}

async function main(): Promise<void> {
  const files = await listMdxFiles();
  if (files.length === 0) {
    console.log('content/ 아래에 .mdx 파일이 없음 — 스킵');
    return;
  }

  const issues: Issue[] = [];
  const nodes: LoadedNode[] = [];

  for (const file of files) {
    const node = await parseNode(file, issues);
    if (node) {
      checkFolderMatchesDomain(node, issues);
      checkFilenamePattern(node, issues);
      nodes.push(node);
    }
  }

  checkGlobalIdUniqueness(nodes, issues);
  checkOrderUniquePerDomain(nodes, issues);
  checkRefIntegrity(nodes, issues);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (issues.length === 0) {
    console.log(`✓ content 검증 통과: ${nodes.length}개 노드`);
    return;
  }

  const grouped = new Map<string, Issue[]>();
  for (const i of issues) {
    const arr = grouped.get(i.file) ?? [];
    arr.push(i);
    grouped.set(i.file, arr);
  }

  for (const [file, list] of grouped) {
    process.stderr.write(`\n  ${file}\n`);
    for (const i of list) {
      const tag = i.severity === 'error' ? '✗' : '⚠';
      process.stderr.write(`    ${tag} ${i.message}\n`);
    }
  }

  if (errors.length > 0) {
    console.error(
      `\n✗ content 검증 실패: error ${errors.length}건${warnings.length ? `, warning ${warnings.length}건` : ''}`,
    );
    process.exit(1);
  } else {
    console.log(`\n⚠ content 검증 통과 (warning ${warnings.length}건) — ${nodes.length}개 노드`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
