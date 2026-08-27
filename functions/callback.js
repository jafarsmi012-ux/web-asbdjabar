// OAuth GitHub untuk Decap CMS — langkah 2: tukar `code` jadi access token,
// serahkan ke jendela /admin lewat postMessage (protokol handshake Decap).
// Perlu env var GITHUB_CLIENT_ID dan GITHUB_CLIENT_SECRET di Cloudflare Pages.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const saved = /(?:^|;\s*)decap_oauth_state=([^;]+)/.exec(request.headers.get('Cookie') || '')?.[1];

  if (!code || !state || state !== saved) {
    return page('error', 'state tidak cocok — coba login ulang.');
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!data.access_token) {
    return page('error', data.error_description || 'gagal menukar token.');
  }
  return page('success', { token: data.access_token, provider: 'github' });
}

function page(status, content) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const body = `<!doctype html><meta charset="utf-8"><body>
<script>
(function () {
  function receive(e) {
    window.removeEventListener('message', receive, false);
    if (window.opener) window.opener.postMessage(${JSON.stringify(msg)}, e.origin);
    setTimeout(function () { window.close(); }, 500);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', '*');
})();
</script>
<p>Selesai. Jendela ini akan tertutup otomatis.</p>
</body>`;
  return new Response(body, {
    status: status === 'success' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
