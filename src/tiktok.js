import fetch from 'node-fetch';


const API = 'https://open.tiktokapis.com/v2';


export function buildAuthUrl({ clientKey, scopes, redirectUri, state = 'trendpro' }) {
const params = new URLSearchParams({
client_key: clientKey,
response_type: 'code',
scope: scopes,
redirect_uri: redirectUri,
state
});
return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}


export async function exchangeCodeForToken({ clientKey, clientSecret, code, redirectUri }) {
const body = new URLSearchParams({
client_key: clientKey,
client_secret: clientSecret,
code,
grant_type: 'authorization_code',
redirect_uri: redirectUri
});
const res = await fetch(`${API}/oauth/token/`, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
body
});
if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
return res.json();
}


export async function refreshToken({ clientKey, clientSecret, refreshToken }) {
const body = new URLSearchParams({
client_key: clientKey,
client_secret: clientSecret,
grant_type: 'refresh_token',
refresh_token: refreshToken
});
const res = await fetch(`${API}/oauth/token/`, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
body
});
if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
return res.json();
}


export async function getUserInfo({ accessToken, fields = ['open_id','display_name','avatar_url'] }) {
// GET variant (works reliably in Node)
const params = new URLSearchParams({ fields: fields.join(',') });
const res = await fetch(`${API}/user/info/?${params.toString()}`, {
headers: {
Authorization: `Bearer ${accessToken}`,
'User-Agent': 'Mozilla/5.0 (TrendPro)'
}
});
const data = await res.json();
return data;
}