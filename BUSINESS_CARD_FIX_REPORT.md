# 명함 정밀도 개선 보고서

> 작성일: 2026-03-27

## 1. 현황 요약

PDF 원본과 현재 웹 구현 간에 **비율, 폰트, 좌표, 색상, 아이콘** 전반에서 차이가 존재함.

---

## 2. 앞면 (Front)

### 현재 방식
- `bc_front.png` (1004x591px) 이미지를 600x354px로 축소하여 표시
- 텍스트 오버레이 없음 (이미지 그대로 사용)

### 문제점
- 없음. 앞면은 PDF에서 추출한 이미지를 그대로 사용하므로 **추가 작업 불필요**.
- 단, 렌더링 크기(600x354)가 원본 비율(1.7:1)과 약간 다름 → 아래 비율 수정 시 함께 해결

---

## 3. 뒷면 (Back) — 주요 문제 분석

### 3.1 폰트 불일치

| 구분 | PDF 원본 | 현재 코드 |
|------|----------|-----------|
| 영문 | **Montserrat** (Bold, Regular) | Arial, sans-serif |
| 한글 | **Noto Sans CJK JP** Regular | 시스템 sans-serif |

**해결**: Google Fonts에서 Montserrat + Noto Sans KR 웹폰트 로드

### 3.2 텍스트 좌표 차이 (핵심 문제)

PDF 좌표계: 240.94 x 141.73pt (85 x 50mm)
렌더링 크기: 600px 기준 → **스케일 팩터: 2.49x** (600 / 240.94)

| 요소 | PDF 좌표 (pt) | PDF 폰트 크기 | 스케일 적용 (px) | 현재 코드 (px) | 차이 |
|------|---------------|---------------|-----------------|----------------|------|
| **Daisy Kang** | x=19.2, y=51.2 | 14pt Bold | x=47.8, y=127.5, 34.9px | x=40, y≈40, 28px | 위치/크기 모두 다름 |
| **강민영** | x=110.2, y=50.5 | 8pt Regular | x=274.4, y=125.7, 19.9px | inline, 16px | 위치/크기 모두 다름 |
| **Team Leader** | x=19.3, y=62.5 | 9pt Bold | x=48.1, y=155.6, 22.4px | flow, 16px | 크기 작음 |
| **Team name** | x=19.3, y=72.1 | 8pt Regular | x=48.1, y=179.5, 19.9px | flow, 14px | 크기 작음 |
| **전화번호** | x=26.3, y=85.0 | 7pt Regular | x=65.5, y=211.6, 17.4px | flow, 13px | 크기 작음 |
| **이메일** | x=26.3, y=93.4 | 7pt Regular | x=65.5, y=232.6, 17.4px | flow, 13px | 크기 작음 |
| **주소 1** | x=26.2, y=102.2 | 6pt Regular | x=65.2, y=254.5, 14.9px | flow, 12px | 크기 작음 |
| **주소 2** | x=26.2, y=110.2 | 6pt Regular | x=65.2, y=274.4, 14.9px | flow, 12px | |
| **www.iyuno.com** | x=20.0, y=121.8 | 7pt Regular | x=49.8, y=303.3, 17.4px | flow, 13px | 크기 작음 |

> **y좌표 참고**: PDF의 y는 baseline 기준 (글자 하단). 실제 텍스트 상단은 `y - fontSize` 정도.
> 위 표의 "스케일 적용" y값은 baseline 위치이므로, 구현 시 텍스트 상단 위치로 보정 필요.

### 3.3 세로 구분선 (Contact Section Left Border) 색상 오류

| 구분 | PDF 원본 | 현재 코드 |
|------|----------|-----------|
| 색상 | **연한 회색** (RGB 220, 221, 221 = `#DCDDDD`) | 노란색 (`#E8A020`) |
| 위치 | x=21.38pt, y=61.53pt에서 30.13pt 아래로 | borderLeft on div |
| 두께 | 3pt (스케일 후 ~7.5px) | 3px |

**현재 코드에서 노란색 `#E8A020`으로 되어 있지만, PDF 원본은 회색임.**

### 3.4 색상 체계

| 요소 | PDF 원본 색상 | 현재 코드 |
|------|--------------|-----------|
| 이름 (Daisy Kang) | `rgb(35, 25, 22)` = **거의 검정** | `#1a1a1a` ✅ 유사 |
| Team Leader | `rgb(244, 176, 74)` = **금색/노란색** | `#E8A020` ✅ 유사 |
| Team name | `rgb(244, 176, 74)` = **금색** (Team Leader와 동일) | `#b0b0b0` (회색) ❌ **다름** |
| 전화/이메일 | `rgb(35, 25, 22)` = **거의 검정** | `#333` ✅ 유사 |
| 주소 | `rgb(90, 87, 87)` = **진한 회색** | `#888` ❌ 약간 다름 |
| www | `rgb(35, 25, 22)` = **거의 검정** | `#1a1a1a` ✅ |
| 한글 이름 | `rgb(90, 87, 87)` = **진한 회색** | `#888` ✅ 유사 |

> **Team name 색상이 가장 큰 오류** — PDF에서는 Team Leader와 같은 금색인데, 코드에서는 회색으로 되어 있음.

### 3.5 iyuno 아이콘

PDF에서 추출한 아이콘 벡터 좌표:

| 바 | x (pt) | y 시작 (from bottom) | 높이 (pt) |
|----|--------|---------------------|-----------|
| 1 | 202.64 | 111.58 | 5.89 |
| 2 | 206.94 | 109.71 | 12.04 |
| 3 | 211.24 | 111.05 | 8.57 |
| 4 | 215.54 | 110.25 | 9.90 |
| 5 | 219.84 | 112.12 | 5.89 |
| 노란점 | 202.64 | 120.01 | r=1.47 |

- 아이콘 우측 끝: ~221.2pt → 우측 마진 ≈ 19.7pt (= 8.2%)
- 아이콘 상단 끝: ~20.2pt from top (= 14.3%)

현재 코드: `top-6 right-6` (24px, 24px) → 비율이 다름

---

## 4. 구현 계획 (Eng Review 반영)

> Eng Review 결정사항:
> - 렌더링 방식: **Canvas API** (JobDescription.tsx 패턴 재활용)
> - 캔버스 크기: **964×567px** (PDF × 4배, 정수 스케일링)
> - 아이콘: **PDF 벡터 데이터 정밀 재현** (베지어 곡선 Canvas path)
> - 폰트: **Next.js google font** (layout.tsx에 Montserrat import 추가)
> - 기존 Noto Sans KR은 layout.tsx에 이미 로드됨 → 중복 추가 불필요

### Phase 1: 폰트 설정
1. `layout.tsx`에 `Montserrat` import 추가 (Bold, Regular weight)
2. Noto Sans KR은 이미 로드됨 — 추가 불필요

### Phase 2: Canvas 기반 뒷면 전면 재작성
1. `BusinessCard.tsx` 뒷면을 **Canvas API**로 전면 교체
2. 캔버스 크기: **964×567px** (PDF 240.94×141.73pt의 정확히 4배)
3. 모든 좌표에 **×4 스케일 팩터** 적용 (정수 변환, sub-pixel 없음)
4. `ctx.fillText()`로 PDF baseline 좌표를 직접 사용
5. `canvas.toDataURL()`로 다운로드 (html-to-image 대체)

### Phase 3: 색상 + 구분선 수정
1. Team name 색상: `#b0b0b0` → 금색 계열로 수정
2. 세로 구분선: `#E8A020` (노란색) → `#DCDDDD` (회색)으로 수정
3. 주소 색상 미세 조정
4. PDF 원본 색상값 정밀 적용

### Phase 4: iyuno 아이콘 정밀화
1. PDF 벡터 데이터의 **베지어 곡선**을 Canvas path로 정확히 변환
2. 각 바의 높이/위치/곡률을 PDF 원본과 100% 일치
3. 아이콘 위치를 PDF 좌표 × 4 기준으로 배치

---

## 5. 어려운 점 / 리스크

| 항목 | 설명 | 심각도 |
|------|------|--------|
| 폰트 렌더링 차이 | 웹 폰트와 PDF 임베딩 폰트의 렌더링(힌팅, 커닝)이 미세하게 다를 수 있음 | 낮음 |
| baseline 좌표 | Canvas fillText()는 PDF와 동일하게 baseline 기준이므로 변환 불필요 (**Canvas 전환으로 해소**) | 해소됨 |
| 한글 폰트 | PDF는 NotoSansCJKjp (일본어판)를 사용하지만, 한국어에는 NotoSansKR이 더 적합. 글리프 차이는 거의 없음 | 낮음 |

---

## 6. Failure Modes

| Codepath | 실패 시나리오 | 테스트 | 에러 핸들링 | 사용자 경험 |
|----------|-------------|--------|------------|------------|
| 폰트 로딩 | Montserrat 로드 실패 | 없음 | document.fonts.ready 사용 | 폴백 폰트로 렌더링 |
| Canvas 그리기 | 브라우저 Canvas 미지원 | 없음 | canvasRef null 체크 | 빈 화면 |
| 다운로드 | toDataURL 호출 실패 | 없음 | 없음 | 조용한 실패 |

> Critical gap 없음 — 모든 실패 시나리오가 graceful degradation 또는 non-critical

---

## 7. NOT in scope

- 채용공고(JobDescription) 컴포넌트 수정
- 앞면 이미지 교체 (이미 정상 작동)
- 반응형 레이아웃 개선
- 테스트 인프라 도입 (내부 도구, 육안 검증으로 충분)

## 8. What already exists

| 기존 코드 | 위치 | 재사용 여부 |
|-----------|------|------------|
| Noto Sans KR 웹폰트 로드 | `layout.tsx:15-19` | 재사용 (중복 추가 불필요) |
| Canvas API 렌더링 패턴 | `JobDescription.tsx` | 패턴 재활용 |
| 앞면 이미지 렌더링 | `BusinessCard.tsx:107-121` | 유지 (수정 불필요) |

---

## 9. 결론

**Canvas API 기반으로 4개 Phase 진행. PDF 좌표 × 4배 정수 스케일링으로 정밀도 최대화.**

수정 파일: 2개 (`layout.tsx`, `BusinessCard.tsx`)
예상 소요: human ~8h / CC ~30min

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 4 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — ready to implement
