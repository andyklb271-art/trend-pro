import fs from 'fs';
const PATH = './token-store.json';


export function loadTokens() {
try {
const raw = fs.readFileSync(PATH, 'utf8');
return JSON.parse(raw);
} catch (e) {
return { access_token: process.env.ACCESS_TOKEN || '', refresh_token: process.env.REFRESH_TOKEN || '' };
}
}


export function saveTokens(tokens) {
const data = {
access_token: tokens.access_token || '',
refresh_token: tokens.refresh_token || ''
};
fs.writeFileSync(PATH, JSON.stringify(data, null, 2));
}