# CONVENTIONS.md — 코드·콘텐츠·작업 규칙

## 코드 스타일

### TypeScript

- `strict: true` + `noUncheckedIndexedAccess: true` + `exactOptionalPropertyTypes: true`
- `any` 사용 금지. 불가피하면 `unknown`으로 받고 좁히기
- `as` 단언 최소화. 필요시 Zod로 검증 후 타입 좁히기
- 함수 매개변수·반환값 타입 명시 (특히 export)
- 인터페이스 vs 타입: **타입(`type`) 우선**. 확장 필요한 경우만 `interface`

### React / Next.js

- App Router 기본. 클라이언트 컴포넌트는 필요 시점에만 `'use client'` 선언
- 서버 컴포넌트에서 데이터 페칭 우선, 클라이언트는 인터랙션 영역만
- `useEffect`로 데이터 페칭 금지 (React Query + Supabase 클라이언트 사용)
- 조건부 렌더 시 `&&` 함정 주의 (숫자 0, 빈 문자열). `Boolean(x) && ...` 또는 명시 비교
- 키 prop은 안정 ID 사용. 인덱스 사용 금지 (재정렬 가능 리스트)

### 폴더 구조

```
src/
├─ app/                      # Next.js App Router
│  ├─ (marketing)/           # 랜딩
│  ├─ learn/[domain]/[slug]/ # 노드 페이지
│  ├─ api/
│  └─ layout.tsx
├─ components/
│  ├─ ui/                    # shadcn/ui (수정해도 OK)
│  └─ feature/               # 기능별 컴포넌트
├─ lib/
│  ├─ supabase/              # 클라이언트·서버 헬퍼
│  ├─ content/               # MDX 로딩·frontmatter 파싱
│  └─ utils.ts
├─ hooks/
├─ stores/                   # Zustand
└─ types/

content/                     # MDX 콘텐츠 (레포 루트)
├─ foundations/
├─ frontend/
├─ backend/
├─ database/
├─ cloud/
└─ cs/
```

### 명명

- 파일: `kebab-case.ts(x)`, 단 React 컴포넌트는 `PascalCase.tsx`
- 변수·함수: `camelCase`
- 타입·컴포넌트: `PascalCase`
- 상수: `SCREAMING_SNAKE_CASE`
- 환경변수: `NEXT_PUBLIC_` 접두사는 클라이언트 노출분만

### 임포트 순서

1. React, Next.js
2. 외부 라이브러리
3. `@/` 절대 경로 (lib → components → hooks → stores)
4. 상대 경로
5. 타입 (`import type`)

ESLint 자동 정렬에 맡김.

## 커밋 규칙

### Conventional Commits

```
feat: 새 기능
fix: 버그 수정
refactor: 동작 변경 없는 리팩터
chore: 의존성·도구·설정
docs: 문서만
style: 포맷팅·세미콜론 등
test: 테스트만
perf: 성능 개선
content: MDX 콘텐츠 추가/수정
```

### 메시지

- 한국어 또는 영어 (혼용 OK, 일관성만 유지)
- 본문에 *왜*를 적음 (무엇은 코드가 말함)
- 스코프 사용: `feat(auth): Google OAuth 추가`

### 브랜치

- `main`: 항상 배포 가능 상태
- `feat/xxx`, `fix/xxx`, `content/xxx`: 작업 브랜치
- 1인 개발이지만 PR로 머지 (Vercel preview·Husky 검증 활용)

## 테스트 정책

- **TDD 강요 안 함**. 테스트는 구현 후 작성
- **단위 테스트**: Vitest. 핵심 유틸·frontmatter 검증·진척도 로직 우선
- **컴포넌트 테스트**: 복잡한 인터랙션 컴포넌트만 (Sidebar, 검색 등)
- **E2E**: Playwright, v1.5+. MVP에서는 출시 직전 스모크만
- 커버리지 목표는 두지 않음 (1인 개발에 비현실적). 핵심 흐름 위주

## 콘텐츠 작성 규칙

### 톤

- 한국어 기본, 기술 용어는 영어 병기 (예: "DOM (Document Object Model)")
- **평어 (~다)**, 무인칭 설명체. "나"·"우리" 1인칭 사용 X
- 한 단락 4문장 이내
- 영어 직역 어색한 표현 회피, 한국어 자연스러운 어순 우선
- 다이어그램은 Mermaid 또는 SVG export

### 노드 표준 구조 (9 섹션)

자세한 가이드는 `docs/CONTENT_SCHEMA.md` 참조. 요약:

1. 학습 목표 (필수, 1~2줄)
2. 선수 지식 (자동 — frontmatter `prerequisites`)
3. 핵심 개념 (필수)
4. 코드 / 시각 예시 (필수)
5. 실무 시나리오 (필수, 일반화된 사례)
6. 분야 간 연결 (선택)
7. 자가 점검 (필수 — 체크리스트 + 시나리오 펼치기)
8. 자주 하는 오해 (선택)
9. 참고 자료 (필수)

### 합성 비중 (재확인)

- 외부 자료 50% (정확성·1차 출처)
- LLM 보조 40% (구조 초안·예시·자가 점검 질문)
- 본인 큐레이션·검수 10% (정확성 점검·연결성 식별·실무 시나리오 발굴)

본인 1인칭 실무 경험 비중은 0%로 의도적 설계 — 큐레이션 학습 노트 모델.

### 코드 블록

- 언어 명시 (`tsx`, `ts`, `bash`, `json`, `yaml`...)
- 길이 제한: 한 블록 50줄 이내. 더 길면 분할 + 설명
- 실행 가능한 최소 예시. 의사코드 지양

### 외부 자료 인용

- 출처 명시 (블로그·공식 문서 링크)
- 직접 인용 최소화 (저작권 + 차별화 약화)
- 본인 표현으로 재구성

## 작업 워크플로 (Claude Code와)

### 모든 작업의 시작

1. 현재 단계 확인 (`docs/ROADMAP.md` 참조)
2. 영향받는 문서 확인 (PRODUCT, STACK, CONVENTIONS, CONTENT_SCHEMA)
3. 안티패턴 가드레일 검증 (CLAUDE.md "절대 하지 말 것")
4. 작업 → 커밋 → PR

### 큰 결정이 발생하면

- `docs/DECISIONS/NNNN-title.md`에 ADR 추가 (템플릿은 DECISIONS/ 첫 파일 참조)
- ADR 번호는 4자리 zero-pad

### 모델 티어링

- **Opus**: 기획·아키텍처 설계·복잡한 디버깅·리뷰
- **Sonnet**: 일반 코드 작성·리팩터·보일러플레이트·콘텐츠 초안

## 자주 빠지는 함정

### 코드

- ❌ `useEffect`로 외부 데이터 페치 → React Query 사용
- ❌ `any` 임시 사용 → 추후 누적되어 타입 안전 무너짐
- ❌ 클라이언트 컴포넌트 남발 → 서버 컴포넌트 우선
- ❌ Tailwind 클래스 길이 핑계로 `cn()` 남용 → 단순 케이스는 그냥 문자열

### 콘텐츠

- ❌ LLM 글 그대로 붙여넣기 → 검수 필수
- ❌ 외부 자료 통째 인용 → 자기 표현으로 재구성
- ❌ "분야 간 연결" 섹션 억지로 채우기 → 진짜 연결 있을 때만
- ❌ 자가 점검 체크리스트가 본문 요약과 동일 → 본문은 학습, 점검은 응용
- ❌ 노드 하나가 6개 도메인 동시 다룸 → 한 노드 = 한 핵심 개념
- ❌ 노드 길이 욕심 → 한 노드 너무 길면 분할

### 일정

- ❌ "이 라이브러리만 더 추가하면..." → STACK.md 위반 검토 후 거부
- ❌ "이 부분만 더 다듬으면..." → MVP는 빨리 출시가 우선
- ❌ 1주차 인프라에 2주 → 콘텐츠 시간 침범, 일정 재협상
