const ALLOWED_ORIGINS = new Set([
  'https://igpig1226.github.io',
  'http://127.0.0.1:8765',
  'http://localhost:8765'
]);

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin'
        }
      });
    }

    const url = new URL(request.url);
    const isCollection = url.pathname === '/responses';
    const match = /^\/responses\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (!isCollection && !match) return reply({ error: '未找到接口。' }, 404, origin);

    if (request.method === 'POST' && isCollection) {
      if (Number(request.headers.get('Content-Length')) > 16384) {
        return reply({ error: '问卷内容过长。' }, 413, origin);
      }
      let payload;
      try {
        payload = await request.json();
      } catch {
        return reply({ error: '提交内容不是有效的 JSON。' }, 400, origin);
      }
      const { id, answers } = payload || {};
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) {
        return reply({ error: '提交编号无效。' }, 400, origin);
      }
      if (!answers || typeof answers !== 'object' || Array.isArray(answers) ||
          !Object.keys(answers).some(key => key.startsWith('q')) ||
          JSON.stringify(answers).length > 16384) {
        return reply({ error: '问卷内容无效或过长。' }, 400, origin);
      }
      const timestamp = new Date().toISOString();
      await env.DB.prepare('INSERT INTO responses (id, timestamp, answers) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET answers = excluded.answers, timestamp = excluded.timestamp')
        .bind(id, timestamp, JSON.stringify(answers)).run();
      return reply({ id }, 201, origin);
    }

    if (!env.ADMIN_PASSWORD || request.headers.get('Authorization') !== `Bearer ${env.ADMIN_PASSWORD}`) {
      return reply({ error: '管理员密码错误。' }, 401, origin);
    }

    if (request.method === 'GET' && isCollection) {
      const limit = url.searchParams.get('limit') === '1' ? 1 : 200;
      const offset = Number(url.searchParams.get('offset') || 0);
      if (!Number.isSafeInteger(offset) || offset < 0) {
        return reply({ error: '分页参数无效。' }, 400, origin);
      }
      const { results } = await env.DB.prepare(
        'SELECT id, timestamp, answers FROM responses ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?'
      ).bind(limit + 1, offset).all();
      const page = results.slice(0, limit);
      return reply({
        responses: page.map(row => ({ ...JSON.parse(row.answers), id: row.id, timestamp: row.timestamp })),
        hasMore: results.length > limit
      }, 200, origin);
    }

    if (request.method === 'DELETE' && match) {
      await env.DB.prepare('DELETE FROM responses WHERE id = ?').bind(match[1]).run();
      return reply({ ok: true }, 200, origin);
    }

    if (request.method === 'DELETE' && isCollection) {
      await env.DB.prepare('DELETE FROM responses').run();
      return reply({ ok: true }, 200, origin);
    }

    return reply({ error: '不支持此操作。' }, 405, origin);
  }
};
