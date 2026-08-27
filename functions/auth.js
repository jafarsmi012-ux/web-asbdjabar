// OAuth GitHub untuk Decap CMS (/admin) — langkah 1: alihkan pengguna ke GitHub.
// Pasangan: functions/callback.js. Perlu env var GITHUB_CLIENT_ID di Cloudflare Pages.
// Decap memanggil {base_url}/auth (lihat admin/config.yml).
export function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  if ((url.searchParams.get('provider') || 'github') !== 'github') {
    return new Response('Provider tidak didukung', { status: 400 });
  }
  if (!env.GITHUB_CLIENT_ID) {
    return new Response('GITHUB_CLIENT_ID belum diset di Cloudflare Pages → Settings → Environment variables', { status: 500 });
  }

  const state = crypto.randomUUID();
  const gh = new URL('https://github.com/login/oauth/authorize');
  gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', `${url.origin}/callback`);
  gh.searchParams.set('scope', url.searchParams.get('scope') || 'repo');
  gh.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: gh.toString(),
      // state disimpan sebentar di cookie, diverifikasi di /callback (anti-CSRF)
      'Set-Cookie': `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
