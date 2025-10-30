import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, 'tokens.json');

export function loadTokens() {
  try {
    if (!fs.existsSync(STORE_PATH)) return null;
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveTokens(obj) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error("Token-Speicherfehler:", e);
  }
}
