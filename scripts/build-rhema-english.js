#!/usr/bin/env node
// Build the public-domain BSB/MSB English texts for Rhema.

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, '..');
const TMP_DIR = path.join(OUT_DIR, 'tmp-bibles');

const SOURCES = [
  { key: 'BSB', global: 'RhemaBSB', file: 'rhema-bsb.js', local: 'bsb.txt', url: 'https://bereanbible.com/bsb.txt' },
  { key: 'MSB', global: 'RhemaMSB', file: 'rhema-msb.js', local: 'msb.txt', url: 'https://majoritybible.com/msb.txt' }
];

const BOOKS = [
  { code: 'GEN', name: 'Genesis', testament: 'OT' },
  { code: 'EXO', name: 'Exodus', testament: 'OT' },
  { code: 'LEV', name: 'Leviticus', testament: 'OT' },
  { code: 'NUM', name: 'Numbers', testament: 'OT' },
  { code: 'DEU', name: 'Deuteronomy', testament: 'OT' },
  { code: 'JOS', name: 'Joshua', testament: 'OT' },
  { code: 'JDG', name: 'Judges', testament: 'OT' },
  { code: 'RUT', name: 'Ruth', testament: 'OT' },
  { code: '1SA', name: '1 Samuel', testament: 'OT' },
  { code: '2SA', name: '2 Samuel', testament: 'OT' },
  { code: '1KI', name: '1 Kings', testament: 'OT' },
  { code: '2KI', name: '2 Kings', testament: 'OT' },
  { code: '1CH', name: '1 Chronicles', testament: 'OT' },
  { code: '2CH', name: '2 Chronicles', testament: 'OT' },
  { code: 'EZR', name: 'Ezra', testament: 'OT' },
  { code: 'NEH', name: 'Nehemiah', testament: 'OT' },
  { code: 'EST', name: 'Esther', testament: 'OT' },
  { code: 'JOB', name: 'Job', testament: 'OT' },
  { code: 'PSA', name: 'Psalms', testament: 'OT' },
  { code: 'PRO', name: 'Proverbs', testament: 'OT' },
  { code: 'ECC', name: 'Ecclesiastes', testament: 'OT' },
  { code: 'SNG', name: 'Song of Solomon', testament: 'OT' },
  { code: 'ISA', name: 'Isaiah', testament: 'OT' },
  { code: 'JER', name: 'Jeremiah', testament: 'OT' },
  { code: 'LAM', name: 'Lamentations', testament: 'OT' },
  { code: 'EZK', name: 'Ezekiel', testament: 'OT' },
  { code: 'DAN', name: 'Daniel', testament: 'OT' },
  { code: 'HOS', name: 'Hosea', testament: 'OT' },
  { code: 'JOL', name: 'Joel', testament: 'OT' },
  { code: 'AMO', name: 'Amos', testament: 'OT' },
  { code: 'OBA', name: 'Obadiah', testament: 'OT' },
  { code: 'JON', name: 'Jonah', testament: 'OT' },
  { code: 'MIC', name: 'Micah', testament: 'OT' },
  { code: 'NAM', name: 'Nahum', testament: 'OT' },
  { code: 'HAB', name: 'Habakkuk', testament: 'OT' },
  { code: 'ZEP', name: 'Zephaniah', testament: 'OT' },
  { code: 'HAG', name: 'Haggai', testament: 'OT' },
  { code: 'ZEC', name: 'Zechariah', testament: 'OT' },
  { code: 'MAL', name: 'Malachi', testament: 'OT' },
  { code: 'MAT', name: 'Matthew', testament: 'NT' },
  { code: 'MAR', name: 'Mark', testament: 'NT' },
  { code: 'LUK', name: 'Luke', testament: 'NT' },
  { code: 'JOH', name: 'John', testament: 'NT' },
  { code: 'ACT', name: 'Acts', testament: 'NT' },
  { code: 'ROM', name: 'Romans', testament: 'NT' },
  { code: '1CO', name: '1 Corinthians', testament: 'NT' },
  { code: '2CO', name: '2 Corinthians', testament: 'NT' },
  { code: 'GAL', name: 'Galatians', testament: 'NT' },
  { code: 'EPH', name: 'Ephesians', testament: 'NT' },
  { code: 'PHP', name: 'Philippians', testament: 'NT' },
  { code: 'COL', name: 'Colossians', testament: 'NT' },
  { code: '1TH', name: '1 Thessalonians', testament: 'NT' },
  { code: '2TH', name: '2 Thessalonians', testament: 'NT' },
  { code: '1TI', name: '1 Timothy', testament: 'NT' },
  { code: '2TI', name: '2 Timothy', testament: 'NT' },
  { code: 'TIT', name: 'Titus', testament: 'NT' },
  { code: 'PHM', name: 'Philemon', testament: 'NT' },
  { code: 'HEB', name: 'Hebrews', testament: 'NT' },
  { code: 'JAM', name: 'James', testament: 'NT' },
  { code: '1PE', name: '1 Peter', testament: 'NT' },
  { code: '2PE', name: '2 Peter', testament: 'NT' },
  { code: '1JO', name: '1 John', testament: 'NT' },
  { code: '2JO', name: '2 John', testament: 'NT' },
  { code: '3JO', name: '3 John', testament: 'NT' },
  { code: 'JUD', name: 'Jude', testament: 'NT' },
  { code: 'REV', name: 'Revelation', testament: 'NT' },
];

const BOOK_BY_NAME = new Map(BOOKS.map(book => [book.name.toLowerCase(), book]));
BOOK_BY_NAME.set('psalm', BOOKS.find(book => book.code === 'PSA'));

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'rhema-english-build/1.0' } }, res => {
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

async function readSource(source) {
  const localPath = path.join(TMP_DIR, source.local);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, 'utf8');
  return fetchText(source.url);
}

function parsePlainText(raw) {
  const bible = {};
  const refRe = /^(.+?)\s+(\d+):(\d+)\t(.+)$/;
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(refRe);
    if (!match) continue;
    const [, bookName, chapter, verse, text] = match;
    const book = BOOK_BY_NAME.get(bookName.toLowerCase());
    if (!book) continue;
    bible[book.code] ||= {};
    bible[book.code][chapter] ||= {};
    bible[book.code][chapter][verse] = text.trim();
  }
  return bible;
}

async function main() {
  for (const source of SOURCES) {
    const bible = parsePlainText(await readSource(source));
    const js = `window.${source.global} = ${JSON.stringify(bible)};\nwindow.RhemaEnglishBooks = ${JSON.stringify(BOOKS)};\n`;
    fs.writeFileSync(path.join(OUT_DIR, source.file), js);
    console.log(`Wrote ${source.file} (${Object.keys(bible).length} books, ${(js.length / 1024 / 1024).toFixed(2)} MB)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
