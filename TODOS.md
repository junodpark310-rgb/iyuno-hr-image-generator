# TODOS

## html-to-image 의존성 제거
- **What:** 앞면도 Canvas로 전환하여 html-to-image 패키지 완전 제거
- **Why:** 뒷면을 Canvas API로 전환하면 html-to-image는 앞면에서만 사용됨. 앞면도 전환하면 의존성 1개 제거 가능
- **Context:** 현재 앞면은 `<img>` + `toPng()`으로 렌더링 중. Canvas로 전환 시 `drawImage()`로 간단히 대체 가능. 뒷면 Canvas 작업 완료 후 진행하는 것이 효율적.
- **Depends on:** Phase 2 (뒷면 Canvas 전환) 완료 후
