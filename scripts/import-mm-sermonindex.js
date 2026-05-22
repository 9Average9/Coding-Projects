#!/usr/bin/env node
// Import Moulton-Milligan entries from Strong's-keyed SermonIndex pages.

const fs = require('fs');
const https = require('https');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEXICON_PATH = path.join(ROOT, 'rhema-lexicon.js');
const OUT_PATH = path.join(ROOT, 'rhema-mm.js');
const BASE_URL = 'https://www.sermonindex.net/strongs/greek/g';
const CONCURRENCY = 8;

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const req = https.get(url, { headers: { 'User-Agent': 'rhema-mm-import/1.0' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        return fetchText(res.headers.location, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode === 404) {
        res.resume();
        return resolve('');
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
  });
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractMoultonMilligan(html) {
  const match = html.match(/<h2>Moulton &amp; Milligan[^<]*<\/h2>\s*<div class="str-lexicon-text">([\s\S]*?)<\/div>/);
  if (!match) return '';
  const text = decodeHtml(match[1])
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return '';
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function loadStrongNumbers() {
  const js = fs.readFileSync(LEXICON_PATH, 'utf8');
  const match = js.match(/window\.RhemaLexicon\s*=\s*(\{[\s\S]*?\});\s*window\.RhemaOcc/);
  if (!match) throw new Error('Could not find window.RhemaLexicon in rhema-lexicon.js');
  return Object.keys(JSON.parse(match[1]))
    .map(Number)
    .filter(num => Number.isInteger(num) && num > 0)
    .sort((a, b) => a - b);
}

async function importEntry(num) {
  const html = await fetchText(`${BASE_URL}${num}/`);
  if (!html) return null;
  const entry = extractMoultonMilligan(html);
  return entry ? [num, entry] : null;
}

async function main() {
  const numbers = loadStrongNumbers();
  const result = {};
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < numbers.length) {
      const num = numbers[index++];
      try {
        const imported = await importEntry(num);
        if (imported) result[imported[0]] = imported[1];
      } catch (error) {
        console.warn(`G${num}: ${error.message}`);
      } finally {
        completed++;
        if (completed % 100 === 0 || completed === numbers.length) {
          console.log(`Imported ${Object.keys(result).length} of ${completed}/${numbers.length} checked`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const ordered = {};
  for (const key of Object.keys(result).sort((a, b) => Number(a) - Number(b))) {
    ordered[key] = result[key];
  }

  fs.writeFileSync(OUT_PATH, `window.RhemaMoultonMilligan = ${JSON.stringify(ordered)};\n`, 'utf8');
  console.log(`Wrote ${Object.keys(ordered).length} Moulton-Milligan entries to ${OUT_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
