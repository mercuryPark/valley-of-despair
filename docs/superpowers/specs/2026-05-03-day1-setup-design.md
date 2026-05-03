# 2026-05-03 — Day 1 인프라 셋업 설계

## 배경

ROADMAP.md 1주차 Day 1. 빈 Next.js 16 앱을 Vercel에 배포하고 코드 품질 가드레일(TS strict, ESLint, Prettier, Husky, lint-staged)을 갖춘다. main 브랜치 보호까지 활성화하면 Day 2부터 PR 기반 워크플로가 강제된다.

**완료 기준** (ROADMAP.md): 빈 페이지가 `https://valleyofdespair-*.vercel.app`에서 보임.

## 전제 사실

- 작업 디렉토리: `/Users/hoyeon/Documents/workspace/valleyofdespair`
- 도구 버전: Node 20.20.0, pnpm 10.33.0, git 2.51.0, gh 2.86.0, Vercel CLI 28.4.5
- 기존 git 상태: main 브랜치, 첫 커밋(`3504fae`)에 `CLAUDE.md` + `docs/` 포함
- 워킹트리 clean, 원격 없음

## 큰 그림 — 하이브리드 PR 전략

```
PR #1 — chore: scaffold Next.js 16 + Vercel 연동
  목적: 외부 통합(GitHub push, Vercel auto-deploy) 조기 검증
  결과물: vercel.app preview/prod URL에서 빈 Next.js 페이지

PR #2 — chore: TS strict + lint/format + git hooks
  목적: 코드 품질 가드레일 + 첫 Husky/lint-staged 검증
  결과물: 커밋 시 자동 lint/format, PR Vercel preview 정상 빌드

PR #2 머지 직후
  main branch protection 활성화 (require PR review, dismiss stale, linear history)
  status check require는 Day 5에 GitHub Actions 추가하면서 함께
```

**왜 하이브리드**: 6개 항목을 모두 별도 PR로 쪼개면 Day 1 첫날 PR 오버헤드 과대. 한 PR로 다 묶으면 Vercel 자동 배포 같은 외부 통합 리스크를 늦게 발견. 둘로 나눠 외부 통합은 일찍, 내부 품질 셋업은 묶어서 처리한다.

**왜 main 보호 마지막**: Day 1 시점엔 강제할 status check workflow가 없다. require status check 없이 PR-only 보호만 먼저 켜고, Day 5에 GitHub Actions 추가하면서 status check을 require에 합류시킨다.

## PR #1 세부

main에는 현재 docs 커밋만 있는 상태. 이 PR은 `chore/scaffold` 브랜치에서 scaffold + Vercel 연동을 묶는다.

### 단계

1. **사전 확인**
   - `gh auth status`, `vercel whoami` 로그인 확인
   - 미로그인 시 사용자에게 `! gh auth login` / `! vercel login` 요청

2. **GitHub 레포 생성 + main(docs) 초기 push**
   - main 보호 활성화 전이므로 docs-only main을 먼저 원격으로 올린다
   ```bash
   gh repo create valleyofdespair --private --source=. --remote=origin --push \
     --description "FE 학습 플랫폼 — 렌더링/상태/성능/비동기 깊은 학습"
   ```
   - GitHub 기본 브랜치는 main으로 자동 설정됨

3. **Vercel 프로젝트 생성 + GitHub 연결**
   ```bash
   vercel link        # 프로젝트 생성, scope 선택
   vercel git connect # GitHub repo와 연결 → 이후 push/PR 자동 배포
   ```
   - 이 시점에 main은 docs만 있어 빌드 대상 없음. Next.js scaffold가 들어와야 실제 배포가 의미를 가짐. 다음 단계에서 처리.
   - 실패 시 fallback: Vercel 대시보드에서 GitHub 레포 import

4. **`chore/scaffold` 브랜치 생성 후 Next.js 16 scaffold (temp dir 우회)**
   - create-next-app은 비어있지 않은 디렉토리(docs/, CLAUDE.md 존재)에서 충돌 가능 → 인접 디렉토리에 만든 뒤 복사
   ```bash
   git checkout -b chore/scaffold
   cd ..
   pnpm create next-app voi-scaffold-tmp \
     --ts --tailwind --app --src-dir --eslint \
     --import-alias "@/*" --use-pnpm --turbopack --yes
   # docs/·CLAUDE.md·.git을 제외하고 현재 레포로 복사 (기존 README.md는 덮어씀)
   rsync -a --exclude=.git --exclude=node_modules \
     voi-scaffold-tmp/ valleyofdespair/
   rm -rf voi-scaffold-tmp
   cd valleyofdespair
   ```
   - create-next-app이 만든 `README.md`는 그대로 두되, 본문은 PR #2 또는 별도 커밋에서 valleyofdespair 소개로 교체

5. **로컬 검증**
   - `pnpm install` (tmp 복사 후 lockfile 정합성 확인)
   - `pnpm dev` → 기본 페이지 확인 후 종료

6. **scaffold 커밋 + push + PR**
   - `.gitignore`는 create-next-app 기본 사용
   ```bash
   git add .
   git commit -m "chore: scaffold Next.js 16 (TS, Tailwind, App Router, src/)"
   git push -u origin chore/scaffold
   gh pr create --title "chore: scaffold Next.js 16 + Vercel 연동" \
                --body "Day 1 PR #1. 빈 scaffold + Vercel 연동 검증."
   ```
   - PR 생성 시 Vercel preview 빌드 트리거 → preview URL 확인

7. **PR 머지 + prod 배포 검증**
   - main 보호 아직 없으므로 자체 머지 가능
   - 머지 후 Vercel이 main을 prod로 자동 배포
   - vercel.app prod URL 접속 → 빈 Next.js 페이지 정상 확인
   - 로컬 main 동기화: `git checkout main && git pull`

### 가정/리스크

- `gh`/`vercel` CLI 로그인 안 돼 있으면 사용자 직접 OAuth 필요
- `vercel git connect` 첫 시도 실패 가능 → 대시보드 fallback
- Turbopack은 dev에서만 사용(`--turbopack`). build는 webpack 기본. STACK.md 거부 목록 위반 없음

## PR #2 세부

브랜치: `chore/quality-setup`

### 단계

1. **tsconfig.json 강화**
   ```json
   {
     "compilerOptions": {
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true,
       "noImplicitOverride": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```
   - `pnpm tsc --noEmit`으로 새 에러 발생 여부 확인 (scaffold 단계라 거의 없음)

2. **Prettier + plugin**
   ```bash
   pnpm add -D prettier prettier-plugin-tailwindcss
   ```
   - `.prettierrc.json`:
     ```json
     {
       "semi": true,
       "singleQuote": true,
       "trailingComma": "all",
       "printWidth": 100,
       "plugins": ["prettier-plugin-tailwindcss"]
     }
     ```
   - `.prettierignore`: `pnpm-lock.yaml`, `.next`, `public`, `content` (콘텐츠 포맷 보존)
   - `package.json` scripts: `"format": "prettier --write ."`

3. **ESLint 9 flat config**
   ```bash
   pnpm add -D eslint-config-prettier
   ```
   - `eslint.config.mjs` 마지막에 `eslint-config-prettier/flat` 추가
   - scripts: `"lint": "eslint ."`, `"typecheck": "tsc --noEmit"`

4. **Husky**
   ```bash
   pnpm add -D husky
   pnpm exec husky init
   ```

5. **lint-staged**
   ```bash
   pnpm add -D lint-staged
   ```
   - `package.json`:
     ```json
     "lint-staged": {
       "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
       "*.{json,md,mdx,yml,yaml,css}": ["prettier --write"]
     }
     ```
   - `.husky/pre-commit`: `pnpm exec lint-staged`

6. **검증**
   - 의도적으로 형식 어긋난 변경 → commit 시 lint-staged가 자동 수정 후 통과 확인
   - `pnpm typecheck && pnpm lint && pnpm format && pnpm build` 모두 통과

7. **PR 생성 + 머지**
   - `git push -u origin chore/quality-setup`
   - `gh pr create --title "chore: TS strict + lint/format + git hooks"`
   - Vercel preview 빌드 + URL 확인
   - 자체 머지

### 가정/리스크

- ESLint 9 flat config + Next 16 호환성 이슈 — `pnpm lint`로 즉시 검증
- `exactOptionalPropertyTypes`가 일부 라이브러리 타입과 충돌 가능 — 충돌 시 끄기
- Husky 설치 후 hooks 미동작 — `git config core.hooksPath` 확인

## main 보호 활성화 (PR #2 머지 직후)

```bash
gh api -X PUT repos/:owner/valleyofdespair/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

- 1인 개발이라 `required_approving_review_count: 0` (PR 통과 자체만 강제, 본인 approve 불필요)
- `enforce_admins: false` — 비상시 admin bypass 여지
- status check는 Day 5(GitHub Actions 추가 시)에 별도로 require 추가
- 적용 후 모든 변경은 브랜치 → PR → 머지 강제

## Day 1 완료 검증 체크

- [ ] vercel.app prod URL 접속 → 빈 Next.js 페이지 정상
- [ ] `pnpm dev` 로컬 실행 정상
- [ ] `pnpm typecheck && pnpm lint && pnpm format && pnpm build` 통과
- [ ] 의도적 포맷 어긋남 commit 시 Husky/lint-staged 자동 수정 확인
- [ ] main 보호 활성, 다음 작업부터 PR 강제됨

## Out of scope (Day 2 이후)

- shadcn/ui, 디자인 토큰, 다크/라이트 (Day 2)
- Supabase, Auth (Day 3)
- MDX, frontmatter Zod (Day 4)
- Sentry, PostHog, GitHub Actions CI (Day 5)
