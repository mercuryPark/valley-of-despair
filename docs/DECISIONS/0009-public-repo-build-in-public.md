# 0009. PUBLIC 레포 + build-in-public

- **Status**: Accepted
- **Date**: 2026-05-03

## Context

ROADMAP.md / spec 초안은 GitHub 레포 visibility를 **PRIVATE**로 명시했음(콘텐츠 IP 보호, 출시 전 미완성 노드 노출 차단 의도).

Day 1 실행 시점에 사용자가 이미 `mercuryPark/valley-of-despair` PUBLIC 레포를 사전 생성해 둔 상태였고, 그대로 사용하기로 결정. PUBLIC을 PRIVATE로 전환하지 않고 PUBLIC + build-in-public 전략으로 전환.

## Decision

**PUBLIC 유지.** 출시 전 작성 과정 자체를 공개. 별도 PRIVATE 단계 없음.

## Consequences

### 긍정

- **build-in-public 효과**: 진행 자체가 사이드 컨텐츠. 커밋 히스토리·PR·이슈가 그대로 학습 자료/포트폴리오.
- **GitHub Actions 무제한**: Hobby 플랜에서 PUBLIC 레포 CI 분량 제한 없음 (PRIVATE는 2,000분/월).
- **외부 피드백 조기 수신 가능**: 출시 전이라도 누군가 PR/이슈 열 수 있음.
- **출시 시 visibility 전환 불필요**: 이미 PUBLIC이라 Day 15 마무리 작업 한 항목 감소.

### 부정

- **드래프트 노출**: 작성 중 노드(`status: draft`)나 미정 결정이 검색·SNS에 색인 가능. 외부 자료에서 본인이 인용한 미공개 정보 공개 위험은 없으나, "완성도 낮은 작업"이 보일 수 있음.
- **표현 자기 검열 압력**: PUBLIC 인지하면 commit 메시지·draft 콘텐츠 표현이 보수적이 될 수 있음. 실제 학습 흔적의 진정성 약화 가능.
- **본인 경험 노드 — 회사 정보 노출 주의**: OfficeNEXT, 실무 사례 등 작성 시 회사 영업비밀·고객 정보 누출 자체 검열 강화 필요.

## 거부된 대안

### PRIVATE 유지 후 출시 시 PUBLIC 전환

- 원래 ROADMAP 가정. 안전하지만 build-in-public 가치 포기.
- 출시 직전 visibility 전환 시 commit 히스토리 노출 시점 분리 안 됨 → 어차피 모든 과거 커밋 노출.

### 신규 PRIVATE 생성 + 기존 `valley-of-despair` 폐기

- 사용자 의향 따라 가능했으나 신규 셋업 비용 + 기존 URL 폐기 비용. 추가 가치 없음.

## 운영 가드레일 (PUBLIC 유지를 위해)

- **회사 정보**: 노드의 "실무 포인트" 섹션 작성 시 회사명·고객명·구체 매출/지표 노출 금지. "B2B 메신저", "이전 실무 환경"으로 추상화.
- **드래프트 노드**: `status: draft` frontmatter 일관 사용. 사이드바·인덱스에서 노출 안 함 (CONTENT_SCHEMA.md 참조).
- **commit 메시지·PR 본문**: 평소 톤 유지 (자기 검열 안 함). 단 시크릿 검사는 평소처럼 엄격히.
- **시크릿 정책**: `.env*`는 무조건 .gitignore. 노출 시 즉시 rotate. PUBLIC 레포 특성상 leak 시 노출 즉시.

## 재평가 트리거

- 위 가드레일을 일관되게 지키기 어려운 상황 (회사 정책 변화, 콘텐츠 민감도 증가)
- build-in-public 효과가 명백히 미미하다고 판단되는 시점 (예: 6개월 운영 후 외부 유입·피드백 0)
