# 0002. DB·인증: Supabase (Firebase 거부)

- **Status**: Accepted
- **Date**: 2026-05-03

## Context

진척도·인증 등 동적 데이터를 어디에 저장할 것인가. 후보:

1. Supabase (Postgres + Auth + RLS)
2. Firebase (Firestore + Auth)
3. Clerk(인증) + Neon/Planetscale(DB)
4. NextAuth + 자체 DB

## Decision

**Supabase** 채택. Auth는 Google + GitHub OAuth.

## Consequences

### 긍정

- Postgres 관계형 → 진척도 같은 정형 데이터에 자연스러움
- Auth + RLS zero-config, 사용자 데이터 격리 DB 레벨 강제
- Google·GitHub OAuth 즉시 연동
- 무료 티어 (500MB DB, 50K MAU) 사이드 프로젝트 충분
- SQL 마이그레이션 직접 관리 가능 (`supabase migration` CLI)
- `@supabase/ssr`로 Next.js App Router 서버·클라이언트 분리 깔끔

### 부정

- 한국 region 없음 (Tokyo 사용) — 학습 사이트 latency 민감도 낮아 OK
- Vendor lock-in 일부 (마이그레이션은 Postgres 표준이라 큰 부담 아님)

## 거부된 대안

### Firebase
- NoSQL → 진척도 같은 정형 데이터에 어색
- Vendor lock-in 강함 (Firestore 쿼리·트리거 종속)
- RLS에 해당하는 Security Rules 학습 곡선

### Clerk + Neon/Planetscale
- Clerk 인증 UX는 매끄럽지만 별도 비용·복잡도
- 1인 개발에 과함

### NextAuth + 자체 DB
- 인증 직접 짜기 안티패턴 (보안 리스크)
- OAuth 콜백·세션·CSRF 다 직접 처리

## 데이터 모델 초안

```sql
-- progress 테이블
create table progress (
  user_id uuid references auth.users(id) on delete cascade,
  node_id text not null,
  status text not null check (status in ('unread', 'reading', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  primary key (user_id, node_id)
);

-- RLS: 본인 데이터만 읽기·쓰기
alter table progress enable row level security;

create policy "users read own progress"
  on progress for select using (auth.uid() = user_id);

create policy "users write own progress"
  on progress for insert with check (auth.uid() = user_id);

create policy "users update own progress"
  on progress for update using (auth.uid() = user_id);
```

콘텐츠 본문은 DB에 저장하지 않음. 진척도만.

## 마이그레이션 가능성

스키마가 단순(progress 1테이블)이라 다른 Postgres 호스팅(Neon, Railway, Supabase self-hosted)으로 이전 비용 낮음. Auth는 분리 시 NextAuth+자체 DB로 마이그레이션 가능.
