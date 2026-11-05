// /write 서버 프록시 — GitHub 토큰은 여기(Vercel env)에만 있고, 브라우저엔 절대 안 들어감
// POST /api/write  { op: 'create'|'update'|'delete', passphrase, title, id?, markdown? }
import { createHash, timingSafeEqual } from 'node:crypto';

const REPO = 'toomanybrands/jun-blog';
const BRANCH = 'main';
const BASE = 'src/content/posts';

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

function slugify(title) {
  const ascii = String(title).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase().replace(/ +/g, '-');
  if (ascii) return ascii;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return 'post-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'POST만 허용됩니다.' });
    return;
  }
  const expected = process.env.WRITE_PASSPHRASE;
  if (!expected || !safeEqual((req.body && req.body.passphrase) || '', expected)) {
    res.status(401).json({ ok: false, error: '쓰기 비밀번호가 올바르지 않아요.' });
    return;
  }

  const b = req.body || {};
  try {
    if (b.op === 'delete') {
      if (!b.id) throw new Error('글 id가 없어요.');
      const path = BASE + '/' + b.id + (String(b.id).endsWith('.md') ? '' : '.md');
      const cur = await gh('/repos/' + REPO + '/contents/' + encPath(path) + '?ref=' + BRANCH);
      await gh(
        '/repos/' + REPO + '/contents/' + encPath(path) +
        '?message=' + encodeURIComponent('삭제: ' + (b.title || b.id)) + '&sha=' + cur.sha + '&branch=' + BRANCH,
        { method: 'DELETE' }
      );
      res.json({ ok: true });
      return;
    }

    if (b.op === 'create' || b.op === 'update') {
      if (!b.markdown || !b.title) throw new Error('제목 또는 본문이 비어요.');
      let path;
      if (b.op === 'update') {
        if (!b.id) throw new Error('수정할 글 id가 없어요.');
        path = BASE + '/' + b.id + (String(b.id).endsWith('.md') ? '' : '.md');
      } else {
        const listing = await gh('/repos/' + REPO + '/contents/' + BASE + '?ref=' + BRANCH);
        const used = new Set(listing.map((f) => f.name.replace(/\.md$/, '')));
        const base = slugify(b.title);
        let slug = base;
        let n = 2;
        while (used.has(slug)) slug = base + '-' + n++;
        path = BASE + '/' + slug;
      }
      const b64 = Buffer.from(b.markdown, 'utf8').toString('base64');
      let sha = null;
      try {
        const cur = await gh('/repos/' + REPO + '/contents/' + encPath(path) + '?ref=' + BRANCH);
        sha = cur.sha;
      } catch (e) {
        /* 신규 파일 */
      }
      const payload = {
        content: b64,
        message: (b.op === 'update' ? '수정: ' : '신규: ') + b.title,
        branch: BRANCH,
      };
      if (sha) payload.sha = sha;
      await gh('/repos/' + REPO + '/contents/' + encPath(path), { method: 'PUT', body: JSON.stringify(payload) });
      res.json({ ok: true });
      return;
    }

    res.status(400).json({ ok: false, error: '알 수 없는 작업: ' + b.op });
  } catch (e) {
    res.status(e.status === 404 ? 404 : 500).json({ ok: false, error: e.message || String(e) });
  }
}
