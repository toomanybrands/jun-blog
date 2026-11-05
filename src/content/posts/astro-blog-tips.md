---
title: "Astro로 블로그를 만들며 배운 것들"
description: "정적 사이트 생성기 Astro로 블로그를 만들고 느낀 점을 코드로 정리했습니다."
pubDate: 2026-11-03
category: "개발"
tags: ["astro", "블로그"]
---

블로그를 직접 만들면서 Astro의 좋은 점과 함정을 몇 가지 발견했어요. 정리해둡니다.

## 1. 글은 그냥 Markdown 파일

게시글은 `src/content/posts/` 안에 있는 Markdown 파일입니다. 프론트 매터에 메타데이터를 적어주면 됩니다.

```markdown
---
title: "글 제목"
description: "요약"
pubDate: 2026-11-03
category: "개발"
tags: ["astro"]
---

본문...
```

Zod 스키마로 타입 검증까지 해주니 오타도 미리 걸러져요.

## 2. 콘텐츠 컬렉션은 정렬부터

목록 페이지에서 최신순 정렬은 거의 필수입니다.

```ts
const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
```

`draft: true`인 글은 빌드에서 제외되는 게 깔끔합니다.

## 3. 검색은 Pagefind가 편함

서버 없이 클라이언트에서 동작하는 [Pagefind](https://pagefind.app)를 붙였습니다.

```js
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [pagefind()],
});
```

빌드 시 자동으로 인덱스를 만들고, UI도 한 줄이면 끝입니다.

## 4. 다크 모드는 CSS 변수 하나로

```css
:root { --bg: #ffffff; }
[data-theme='dark'] { --bg: #0d1117; }
```

`<html data-theme="...">`만 바꾸면 전체 테마가 전환됩니다. 사용자의 시스템 설정도 존중하고, 선택은 `localStorage`에 기억해요.

---

정적 사이트 생성기는 과하지도 부족하지도 않은 수준입니다. 블로그 목적에는 Astro가 여전히 최고라고 생각해요.
