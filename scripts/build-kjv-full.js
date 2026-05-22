#!/usr/bin/env node
// Download the public-domain KJV text used by Rhema's reference selector.

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..');
const KJV_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/';

const BOOKS = [
  { code: 'GEN', name: 'Genesis', kjv: 'Genesis', testament: 'OT' },
  { code: 'EXO', name: 'Exodus', kjv: 'Exodus', testament: 'OT' },
  { code: 'LEV', name: 'Leviticus', kjv: 'Leviticus', testament: 'OT' },
  { code: 'NUM', name: 'Numbers', kjv: 'Numbers', testament: 'OT' },
  { code: 'DEU', name: 'Deuteronomy', kjv: 'Deuteronomy', testament: 'OT' },
  { code: 'JOS', name: 'Joshua', kjv: 'Joshua', testament: 'OT' },
  { code: 'JDG', name: 'Judges', kjv: 'Judges', testament: 'OT' },
  { code: 'RUT', name: 'Ruth', kjv: 'Ruth', testament: 'OT' },
  { code: '1SA', name: '1 Samuel', kjv: '1Samuel', testament: 'OT' },
  { code: '2SA', name: '2 Samuel', kjv: '2Samuel', testament: 'OT' },
  { code: '1KI', name: '1 Kings', kjv: '1Kings', testament: 'OT' },
  { code: '2KI', name: '2 Kings', kjv: '2Kings', testament: 'OT' },
  { code: '1CH', name: '1 Chronicles', kjv: '1Chronicles', testament: 'OT' },
  { code: '2CH', name: '2 Chronicles', kjv: '2Chronicles', testament: 'OT' },
  { code: 'EZR', name: 'Ezra', kjv: 'Ezra', testament: 'OT' },
  { code: 'NEH', name: 'Nehemiah', kjv: 'Nehemiah', testament: 'OT' },
  { code: 'EST', name: 'Esther', kjv: 'Esther', testament: 'OT' },
  { code: 'JOB', name: 'Job', kjv: 'Job', testament: 'OT' },
  { code: 'PSA', name: 'Psalms', kjv: 'Psalms', testament: 'OT' },
  { code: 'PRO', name: 'Proverbs', kjv: 'Proverbs', testament: 'OT' },
  { code: 'ECC', name: 'Ecclesiastes', kjv: 'Ecclesiastes', testament: 'OT' },
  { code: 'SNG', name: 'Song of Solomon', kjv: 'SongofSolomon', testament: 'OT' },
  { code: 'ISA', name: 'Isaiah', kjv: 'Isaiah', testament: 'OT' },
  { code: 'JER', name: 'Jeremiah', kjv: 'Jeremiah', testament: 'OT' },
  { code: 'LAM', name: 'Lamentations', kjv: 'Lamentations', testament: 'OT' },
  { code: 'EZK', name: 'Ezekiel', kjv: 'Ezekiel', testament: 'OT' },
  { code: 'DAN', name: 'Daniel', kjv: 'Daniel', testament: 'OT' },
  { code: 'HOS', name: 'Hosea', kjv: 'Hosea', testament: 'OT' },
  { code: 'JOL', name: 'Joel', kjv: 'Joel', testament: 'OT' },
  { code: 'AMO', name: 'Amos', kjv: 'Amos', testament: 'OT' },
  { code: 'OBA', name: 'Obadiah', kjv: 'Obadiah', testament: 'OT' },
  { code: 'JON', name: 'Jonah', kjv: 'Jonah', testament: 'OT' },
  { code: 'MIC', name: 'Micah', kjv: 'Micah', testament: 'OT' },
  { code: 'NAM', name: 'Nahum', kjv: 'Nahum', testament: 'OT' },
  { code: 'HAB', name: 'Habakkuk', kjv: 'Habakkuk', testament: 'OT' },
  { code: 'ZEP', name: 'Zephaniah', kjv: 'Zephaniah', testament: 'OT' },
  { code: 'HAG', name: 'Haggai', kjv: 'Haggai', testament: 'OT' },
  { code: 'ZEC', name: 'Zechariah', kjv: 'Zechariah', testament: 'OT' },
  { code: 'MAL', name: 'Malachi', kjv: 'Malachi', testament: 'OT' },
  { code: 'MAT', name: 'Matthew', kjv: 'Matthew', testament: 'NT' },
  { code: 'MAR', name: 'Mark', kjv: 'Mark', testament: 'NT' },
  { code: 'LUK', name: 'Luke', kjv: 'Luke', testament: 'NT' },
  { code: 'JOH', name: 'John', kjv: 'John', testament: 'NT' },
  { code: 'ACT', name: 'Acts', kjv: 'Acts', testament: 'NT' },
  { code: 'ROM', name: 'Romans', kjv: 'Romans', testament: 'NT' },
  { code: '1CO', name: '1 Corinthians', kjv: '1Corinthians', testament: 'NT' },
  { code: '2CO', name: '2 Corinthians', kjv: '2Corinthians', testament: 'NT' },
  { code: 'GAL', name: 'Galatians', kjv: 'Galatians', testament: 'NT' },
  { code: 'EPH', name: 'Ephesians', kjv: 'Ephesians', testament: 'NT' },
  { code: 'PHP', name: 'Philippians', kjv: 'Philippians', testament: 'NT' },
  { code: 'COL', name: 'Colossians', kjv: 'Colossians', testament: 'NT' },
  { code: '1TH', name: '1 Thessalonians', kjv: '1Thessalonians', testament: 'NT' },
  { code: '2TH', name: '2 Thessalonians', kjv: '2Thessalonians', testament: 'NT' },
  { code: '1TI', name: '1 Timothy', kjv: '1Timothy', testament: 'NT' },
  { code: '2TI', name: '2 Timothy', kjv: '2Timothy', testament: 'NT' },
  { code: 'TIT', name: 'Titus', kjv: 'Titus', testament: 'NT' },
  { code: 'PHM', name: 'Philemon', kjv: 'Philemon', testament: 'NT' },
  { code: 'HEB', name: 'Hebrews', kjv: 'Hebrews', testament: 'NT' },
  { code: 'JAM', name: 'James', kjv: 'James', testament: 'NT' },
  { code: '1PE', name: '1 Peter', kjv: '1Peter', testament: 'NT' },
  { code: '2PE', name: '2 Peter', kjv: '2Peter', testament: 'NT' },
  { code: '1JO', name: '1 John', kjv: '1John', testament: 'NT' },
  { code: '2JO', name: '2 John', kjv: '2John', testament: 'NT' },
  { code: '3JO', name: '3 John', kjv: '3John', testament: 'NT' },
  { code: 'JUD', name: 'Jude', kjv: 'Jude', testament: 'NT' },
  { code: 'REV', name: 'Revelation', kjv: 'Revelation', testament: 'NT' },
];

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'rhema-kjv-build/1.0' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return fetchText(res.headers.location, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function parseKjvBook(bookJson) {
  const result = {};
  for (const ch of bookJson.chapters || []) {
    const chNum = String(ch.chapter);
    result[chNum] = {};
    for (const v of ch.verses || []) result[chNum][String(v.verse)] = v.text;
  }
  return result;
}

async function main() {
  const kjv = {};
  for (const book of BOOKS) {
    process.stdout.write(`${book.code} ${book.name}... `);
    const raw = await fetchText(`${KJV_BASE}${book.kjv}.json`);
    kjv[book.code] = parseKjvBook(JSON.parse(raw));
    process.stdout.write('done\n');
  }
  const js = `window.RhemaKJV = ${JSON.stringify(kjv)};\nwindow.RhemaKJVBooks = ${JSON.stringify(BOOKS.map(({ code, name, testament }) => ({ code, name, testament })))};`;
  fs.writeFileSync(path.join(OUT_DIR, 'rhema-kjv.js'), js);
  console.log(`Wrote rhema-kjv.js (${(js.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
