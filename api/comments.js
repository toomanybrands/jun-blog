// 댓글 서버 — 댓글은 GitHub 리포의 comments/<postId>.json 에 저장 (Vercel 저장소 불필요)
// POST   /api/comments  { postId, name, body, hp?, ts? } → 댓글 추가
// DELETE /api/comments?id=<uuid>&passphrase=<쓰기비밀번호>&postId=<id> → 댓글 삭제(관리자)
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const REPO = 'toomanybrands/jun-blog';
const BRANCH = 'main';
const MAX_BODY = 2000;
const MAX_PER_POST = 50;

function encPath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

function gh(path, opts = {}) {
  return fetch('https://api.github.com' + path, {
    method: opts.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: opts.body,
  }).then(async (r) => {
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      const e = new Error((j && j.message) || 'GitHub 오류 ' + r.status);
      e.status = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  });
}

function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function readComments(postId) {
  const path = 'comments/' + postId + '.json';
  return gh('/repos/' + REPO + '/contents/' + encPath(path) + '?ref=' + BRANCH).then(
    (cur) => ({
      sha: cur.sha,
      list: (JSON.parse(Buffer.from(cur.content, 'base64').toString('utf8')) || {}).list || [],
    })
  );
}

function writeComments(postId, list, sha) {
  const path = 'comments/' + postId + '.json';
  const payload = {
    content: Buffer.from(JSON.stringify({ list }, null, 1), 'utf8').toString('base64'),
    message: '댓글: ' + postId,
    branch: BRANCH,
  };
  if (sha) payload.sha = sha;
  return gh('/repos/' + REPO + '/contents/' + encPath(path), { method: 'PUT', body: JSON.stringify(payload) });
}

export default async function handler(req, res) {
  // 관리자 삭제 — 쓰기 비밀번호 재사용
  if (req.method === 'DELETE') {
    const expected = process.env.WRITE_PASSPHRASE;
    if (!expected || !safeEqual(req.query.passphrase || '', expected)) {
      res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않아요.' });
      return;
    }
    const postId = String(req.query.postId || '').toLowerCase();
    const id = String(req.query.id || '');
    if (!/^[a-z0-9_-]+$/.test(postId) || !id) {
      res.status(400).json({ ok: false, error: '잘못된 요청이에요.' });
      return;
    }
    try {
      const { sha, list } = await readComments(postId);
      const next = list.filter((c) => c.id !== id);
      if (next.length === list.length) {
        res.status(404).json({ ok: false, error: '댓글을 찾을 수 없어요.' });
        return;
      }
      await writeComments(postId, next, sha);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message || String(e) });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: '허용되지 않는 요청이에요.' });
    return;
  }

  const b = req.body || {};

  // 스팸 방지: honeypot(사람은 안 채움), 너무 빠른 제출(봇)
  if (b.hp) res.json({ ok: true });
  if (b.ts && Date.now() - Number(b.ts) < 4000) {
    res.status(429).json({ ok: false, error: 'too-fast' });
    return;
  }

  const postId = String(b.postId || '').toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(postId)) {
    res.status(400).json({ ok: false, error: '잘못된 글 id예요.' });
    return;
  }
  const name =
    String(b.name || '')
      .replace(/<[^>]*>?/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 50) || '익명';
  const body = String(b.body || '').trim().slice(0, MAX_BODY);
  if (!body) {
    res.status(400).json({ ok: false, error: '댓글이 비어요.' });
    return;
  }

  try {
    const { sha, list } = await readComments(postId).catch(() => ({ sha: null, list: [] }));
    if (list.length >= MAX_PER_POST) {
      res.status(429).json({ ok: false, error: 'too-many' });
      return;
    }
    const comment = { id: randomUUID(), name, body, date: new Date().toISOString() };
    list.push(comment);
    await writeComments(postId, list, sha);
    // 응답에 전체 목록 포함 → 클라이언트가 raw CDN 전파를 기다리지 않고 즉시 표시
    res.json({ ok: true, list });
  } catch (e) {
    // 409 = 동시 충돌 → 클라이언트가 1회 재시도
    res.status(e.status === 409 ? 409 : 500).json({ ok: false, error: e.message || String(e) });
  }
}
