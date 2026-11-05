// 빌드 시 /posts-index.json 생성 — /write 작성 페이지가 기존 글 목록/본문을 불러오기 위해 사용
import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => true)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const list = posts.map((post) => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate.toISOString(),
    updatedDate: post.data.updatedDate?.toISOString() ?? null,
    category: post.data.category,
    tags: post.data.tags,
    draft: post.data.draft,
    body: post.body ?? post.content ?? '',
  }));

  return new Response(JSON.stringify(list), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
