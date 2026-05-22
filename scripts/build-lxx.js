#!/usr/bin/env node
// Build Rhema Septuagint data from CenterBLC/LXX Text-Fabric files.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '..');
const SOURCE_DIR = process.env.LXX_SOURCE_DIR || path.join(os.tmpdir(), 'rhema-lxx-source');
const TF_DIR = path.join(SOURCE_DIR, 'tf', '1935');

const OT_BOOKS = [
  { code: 'GEN', name: 'Genesis', source: 'Gen' },
  { code: 'EXO', name: 'Exodus', source: 'Exod' },
  { code: 'LEV', name: 'Leviticus', source: 'Lev' },
  { code: 'NUM', name: 'Numbers', source: 'Num' },
  { code: 'DEU', name: 'Deuteronomy', source: 'Deut' },
  { code: 'JOS', name: 'Joshua', source: 'Josh' },
  { code: 'JDG', name: 'Judges', source: 'Judg' },
  { code: 'RUT', name: 'Ruth', source: 'Ruth' },
  { code: '1SA', name: '1 Samuel', source: '1Sam' },
  { code: '2SA', name: '2 Samuel', source: '2Sam' },
  { code: '1KI', name: '1 Kings', source: '1Kgs' },
  { code: '2KI', name: '2 Kings', source: '2Kgs' },
  { code: '1CH', name: '1 Chronicles', source: '1Chr' },
  { code: '2CH', name: '2 Chronicles', source: '2Chr' },
  { code: 'EZR', name: 'Ezra', source: '2Esdr', chapterOffset: 0, chapterLimit: 10 },
  { code: 'NEH', name: 'Nehemiah', source: '2Esdr', chapterOffset: 10, chapterLimit: 13 },
  { code: 'EST', name: 'Esther', source: 'Esth' },
  { code: 'JOB', name: 'Job', source: 'Job' },
  { code: 'PSA', name: 'Psalms', source: 'Ps' },
  { code: 'PRO', name: 'Proverbs', source: 'Prov' },
  { code: 'ECC', name: 'Ecclesiastes', source: 'Qoh' },
  { code: 'SNG', name: 'Song of Solomon', source: 'Cant' },
  { code: 'ISA', name: 'Isaiah', source: 'Isa' },
  { code: 'JER', name: 'Jeremiah', source: 'Jer' },
  { code: 'LAM', name: 'Lamentations', source: 'Lam' },
  { code: 'EZK', name: 'Ezekiel', source: 'Ezek' },
  { code: 'DAN', name: 'Daniel', source: 'Dan' },
  { code: 'HOS', name: 'Hosea', source: 'Hos' },
  { code: 'JOL', name: 'Joel', source: 'Joel' },
  { code: 'AMO', name: 'Amos', source: 'Amos' },
  { code: 'OBA', name: 'Obadiah', source: 'Obad' },
  { code: 'JON', name: 'Jonah', source: 'Jonah' },
  { code: 'MIC', name: 'Micah', source: 'Mic' },
  { code: 'NAM', name: 'Nahum', source: 'Nah' },
  { code: 'HAB', name: 'Habakkuk', source: 'Hab' },
  { code: 'ZEP', name: 'Zephaniah', source: 'Zeph' },
  { code: 'HAG', name: 'Haggai', source: 'Hag' },
  { code: 'ZEC', name: 'Zechariah', source: 'Zech' },
  { code: 'MAL', name: 'Malachi', source: 'Mal' },
];

function ensureSource() {
  if (fs.existsSync(TF_DIR)) return;
  console.log('Cloning CenterBLC/LXX...');
  execFileSync('git', ['clone', '--depth', '1', 'https://github.com/CenterBLC/LXX.git', SOURCE_DIR], { stdio: 'inherit' });
}

function readTfFeature(name) {
  const file = path.join(TF_DIR, `${name}.tf`);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const values = [];
  let inData = false;
  for (const line of lines) {
    if (!inData) {
      if (line.trim() === '') inData = true;
      continue;
    }
    values.push(line);
  }
  while (values.length && values[values.length - 1] === '') values.pop();
  return values;
}

function convertMorph(raw) {
  if (!raw) return '';
  const [posRaw, details = ''] = raw.split('.');
  const pos = {
    A: 'ADJ',
    C: 'CONJ',
    D: 'ADV',
    I: 'INJ',
    N: 'N',
    P: 'PREP',
    X: 'PART',
  }[posRaw] || (posRaw.startsWith('R') ? (posRaw === 'RA' ? 'T' : 'PRON') : posRaw);

  if (pos === 'V' && details.length >= 5) {
    return `V-${details.slice(0, 3)}-${details.slice(3)}`;
  }
  return details ? `${pos}-${details}` : pos;
}

function parseStrongs(raw) {
  const match = String(raw || '').match(/G0*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function addWord(text, bookCode, chapter, verse, word) {
  if (!text[bookCode]) text[bookCode] = {};
  if (!text[bookCode][chapter]) text[bookCode][chapter] = {};
  if (!text[bookCode][chapter][verse]) text[bookCode][chapter][verse] = [];
  text[bookCode][chapter][verse].push(word);
}

function main() {
  ensureSource();

  console.log('Reading LXX Text-Fabric features...');
  const words = readTfFeature('word');
  const books = readTfFeature('book');
  const chapters = readTfFeature('chapter');
  const verses = readTfFeature('verse');
  const strongs = readTfFeature('strongs');
  const morphs = readTfFeature('morphology');

  const bySource = new Map();
  for (const book of OT_BOOKS) {
    if (!bySource.has(book.source)) bySource.set(book.source, []);
    bySource.get(book.source).push(book);
  }

  const names = {};
  const text = {};
  const occ = {};
  for (const book of OT_BOOKS) names[book.code] = book.name;

  for (let i = 0; i < words.length; i++) {
    const sourceBook = books[i];
    const targets = bySource.get(sourceBook);
    if (!targets) continue;

    const sourceChapter = Number(chapters[i]);
    const sourceVerse = String(verses[i]);
    for (const target of targets) {
      const offset = target.chapterOffset || 0;
      const limit = target.chapterLimit || Infinity;
      const relChapter = sourceChapter - offset;
      if (relChapter < 1 || relChapter > limit) continue;

      const strongNum = parseStrongs(strongs[i]);
      const word = [words[i], strongNum, convertMorph(morphs[i])];
      addWord(text, target.code, String(relChapter), sourceVerse, word);

      if (strongNum) {
        if (!occ[strongNum]) occ[strongNum] = { total: 0, books: {} };
        occ[strongNum].total++;
        occ[strongNum].books[target.code] = (occ[strongNum].books[target.code] || 0) + 1;
      }
    }
  }

  const availableBooks = OT_BOOKS.filter(book => text[book.code]).map(book => book.code);
  const payload = { books: availableBooks, names, text };
  const license = [
    '/*',
    'Generated from CenterBLC/LXX, Rahlfs LXX 1935 Text-Fabric data.',
    'Source: https://github.com/CenterBLC/LXX',
    'License: MIT, copyright (c) 2021 CenterBLC.',
    '*/',
    '',
  ].join('\n');
  const js = `${license}window.RhemaLXX = ${JSON.stringify(payload)};\nwindow.RhemaLXXOcc = ${JSON.stringify(occ)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'rhema-lxx.js'), js, 'utf8');

  const verseCount = Object.values(text).reduce((sum, chs) => (
    sum + Object.values(chs).reduce((chSum, vs) => chSum + Object.keys(vs).length, 0)
  ), 0);
  console.log(`Wrote rhema-lxx.js (${(js.length / 1024 / 1024).toFixed(2)} MB, ${availableBooks.length} books, ${verseCount} verses)`);
}

main();
