# 0001. 콘텐츠 저장: MDX + Git (헤드리스 CMS·DB 거부)

- **Status**: Accepted
- **Date**: 2026-05-03

## Context

학습 플랫폼의 콘텐츠를 어디에 어떻게 저장할 것인가. 후보:

1. MDX + Git (레포 안에 파일로)
2. Sanity / Contentlayer 등 헤드리스 CMS
3. DB 직접 + 마크다운 에디터 자작
4. Notion API 연동

작성자는 **본인 1명**, 노드 80~120개, 코드 블록·다이어그램 빈번.

## Decision

**MDX + Git** 채택. `next-mdx-remote` + `shiki` + `rehype-pretty-code` 조합.

## Consequences

### 긍정

- 본인이 유일 작성자 → CMS 협업 기능 불필요
- Git 버전 관리·diff·리뷰가 콘텐츠에 그대로 적용
- grep·VSCode 검색·find-and-replace 자유
- Vercel 배포 → 콘텐츠 변경이 자동 빌드
- 빌드 타임 정적 처리 → 런타임 비용 0
- 빌드 시 frontmatter Zod 검증 가능 (잘못된 데이터 = 빌드 실패)

### 부정

- 비개발자 작성 어려움 (해당 없음)
- 노드 수 늘어나면 grep·정렬 도구 자체 필요 (수백 개 시점)

## 거부된 대안

### Sanity / Contentlayer
- 다중 작성자·실시간 편집이 필요할 때 유용
- 1인엔 오버엔지니어링, 외부 의존성 추가

### DB 직접 + 마크다운 에디터 자작
- 에디터 만드는 데 시간 다 빠짐
- Git 버전 관리 사라짐
- 1인 개발 안티패턴

### Notion API
- Rate limit, 코드 블록 변형, 이미지 만료 빈번
- 빌드 안정성 떨어짐

## 마이그레이션 가능성

콘텐츠 양이 수백 개를 넘고 다중 작성자가 필요해지면 Contentlayer/Sanity로 마이그레이션 가능. frontmatter 스키마를 표준 형태로 유지하면 변환 비용 낮음.
