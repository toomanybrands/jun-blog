# 준의 블로그 (jun-blog)

Astro + Markdown 기반의 정적 블로그입니다. 다크 모드, Giscus 댓글, 카테고리/태그, Pagefind 검색을 지원합니다.

## 실행

```bash
npm install
npm run dev      # 로컬 개발 → http://localhost:4321
npm run build    # 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 글쓰기

`src/content/posts/` 폴더에 Markdown 파일을 만들면 됩니다.

```markdown
---
title: "글 제목"
description: "홈 목록에 표시되는 요약 (한두 문장)"
pubDate: 2026-11-06
category: "개발"
tags: ["astro", "블로그"]
draft: false
---

여기에 본문입니다. Markdown 문법을 자유롭게 사용할 수 있어요.
```

- `draft: true` → 빌드에서 제외 (초고 보관용)
- `category` → `/categories/카테고리명` 페이지에 모아져요
- `tags` → `/tags/태그명` 페이지와 `/tags` 태그 목록에 표시됩니다

## 사이트 설정

`src/config.ts` 에서 수정합니다.

| 항목 | 설명 |
| --- | --- |
| `name` | 사이트 이름 (헤더, 홈, 메타) |
| `description` | 사이트 설명 |
| `giscus.repo` | Giscus 댓글을 활성화할 공개 GitHub 저장소 (예: `jun/jun-blog`) |

`astro.config.mjs` 의 `site` 도 배포 후 실제 도메인으로 바꾸세요.

## 댓글 (Giscus) 활성화

1. 이 블로그가 GitHub 저장소로 공개(public)되어 있어야 합니다
2. https://giscus.app 에서 저장소 이름을 입력해 구성을 확인하세요 (기본 범주는 `Announcements` 입니다)
3. `src/config.ts` 의 `giscus.repo` 에 `jun/jun-blog` 처럼 저장소를 지정하면 완료 — repoId 등은 자동으로 조회합니다

## Vercel에 배포

1. 프로젝트를 GitHub 저장소로 push
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/계정명/jun-blog.git
   git push -u origin main
   ```
2. https://vercel.com → **Add New → Project** → 해당 저장소 선택
   - Framework Preset: **Astro** (자동 감지됨)
3. Deploy 누르면 끝 — 그 후 `git push` 만하면 자동으로 재배포됩니다
