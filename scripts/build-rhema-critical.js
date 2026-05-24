const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'rhema-critical.js');

const NT_BOOKS = [
  ['MAT', '61-Mt-morphgnt.txt'], ['MAR', '62-Mk-morphgnt.txt'],
  ['LUK', '63-Lk-morphgnt.txt'], ['JOH', '64-Jn-morphgnt.txt'],
  ['ACT', '65-Ac-morphgnt.txt'], ['ROM', '66-Ro-morphgnt.txt'],
  ['1CO', '67-1Co-morphgnt.txt'], ['2CO', '68-2Co-morphgnt.txt'],
  ['GAL', '69-Ga-morphgnt.txt'], ['EPH', '70-Eph-morphgnt.txt'],
  ['PHP', '71-Php-morphgnt.txt'], ['COL', '72-Col-morphgnt.txt'],
  ['1TH', '73-1Th-morphgnt.txt'], ['2TH', '74-2Th-morphgnt.txt'],
  ['1TI', '75-1Ti-morphgnt.txt'], ['2TI', '76-2Ti-morphgnt.txt'],
  ['TIT', '77-Tit-morphgnt.txt'], ['PHM', '78-Phm-morphgnt.txt'],
  ['HEB', '79-Heb-morphgnt.txt'], ['JAM', '80-Jas-morphgnt.txt'],
  ['1PE', '81-1Pe-morphgnt.txt'], ['2PE', '82-2Pe-morphgnt.txt'],
  ['1JO', '83-1Jn-morphgnt.txt'], ['2JO', '84-2Jn-morphgnt.txt'],
  ['3JO', '85-3Jn-morphgnt.txt'], ['JUD', '86-Jud-morphgnt.txt'],
  ['REV', '87-Re-morphgnt.txt'],
];

function normalizeGreek(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()⸀⸂⸃⸆⸇.,;··]/g, '')
    .replace(/ς/g, 'σ')
    .toLowerCase();
}

function buildLemmaStrongsMap() {
  const source = fs.readFileSync(path.join(ROOT, 'rhema-lexicon.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const map = {};
  for (const [strongs, entry] of Object.entries(context.window.RhemaLexicon || {})) {
    const lemma = normalizeGreek(entry.lemma || '');
    if (lemma && !map[lemma]) map[lemma] = Number(strongs);
  }
  return map;
}

function convertMorph(pos, parse) {
  if (pos === 'C-') return 'CONJ';
  if (pos === 'P-') return 'PREP';
  if (pos === 'D-') return 'ADV';
  if (pos === 'X-') return 'PART';
  if (pos === 'I-') return 'INJ';

  const posMap = {
    'A-': 'A', 'N-': 'N', 'RA': 'T', 'RD': 'D', 'RI': 'I',
    'RP': 'P', 'RR': 'R', 'V-': 'V',
  };
  const outPos = posMap[pos] || pos.replace('-', '');
  const chars = String(parse || '').padEnd(8, '-').split('');

  if (outPos === 'V') {
    const person = /\d/.test(chars[0]) ? chars[0] : '';
    const tense = ({ X: 'R', Y: 'L' }[chars[1]] || chars[1] || '-');
    const voice = chars[2] || '-';
    const mood = ({ D: 'M' }[chars[3]] || chars[3] || '-');
    const vcase = chars[4] || '-';
    const num = chars[5] || '-';
    const gender = chars[6] || '-';
    if (mood === 'P') return `V-${tense}${voice}P-${vcase}${num}${gender}`.replace(/-+$/g, '');
    if (mood === 'N') return `V-${tense}${voice}N`;
    return `V-${tense}${voice}${mood}-${person}${num}`.replace(/-+$/g, '');
  }

  const vcase = chars[4] || '-';
  const num = chars[5] || '-';
  const gender = chars[6] || '-';
  if (vcase === '-' && num === '-' && gender === '-') return outPos;
  return `${outPos}-${vcase}${num}${gender}`;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

function parseMorphGnt(raw, code, lemmaToStrongs) {
  const book = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [bcv, pos, parse, text, cleanWord, normalizedWord, lemma] = line.trim().split(/\s+/);
    if (!/^\d{6}$/.test(bcv)) continue;
    const chapter = String(Number(bcv.slice(2, 4)));
    const verse = String(Number(bcv.slice(4, 6)));
    const strongs = lemmaToStrongs[normalizeGreek(lemma)] ||
      lemmaToStrongs[normalizeGreek(normalizedWord)] ||
      lemmaToStrongs[normalizeGreek(cleanWord)] ||
      '';
    if (!book[chapter]) book[chapter] = {};
    if (!book[chapter][verse]) book[chapter][verse] = [];
    book[chapter][verse].push([text, strongs, convertMorph(pos, parse), lemma]);
  }
  console.log(`${code}: ${Object.values(book).reduce((sum, chapter) => sum + Object.keys(chapter).length, 0)} verses`);
  return book;
}

async function main() {
  console.log('Building Rhēma Critical Text dataset from MorphGNT SBLGNT...');
  const lemmaToStrongs = buildLemmaStrongsMap();
  const text = {};
  const base = 'https://raw.githubusercontent.com/morphgnt/sblgnt/master/';
  for (const [code, file] of NT_BOOKS) {
    const raw = await fetchText(base + file);
    text[code] = parseMorphGnt(raw, code, lemmaToStrongs);
  }
  const payload = {
    source: 'SBLGNT via MorphGNT SBLGNT 6.12',
    license: 'SBLGNT text CC BY 4.0; MorphGNT parsing/lemmatization CC-BY-SA',
    text,
  };
  const js = [
    '/* Critical Text dataset for Rhēma.',
    '   Greek text: SBL Greek New Testament, CC BY 4.0.',
    '   Morphology/lemmatization: MorphGNT SBLGNT 6.12, CC-BY-SA.',
    '   Source: https://github.com/morphgnt/sblgnt */',
    `window.RhemaCriticalNT = ${JSON.stringify(payload)};`,
    '',
  ].join('\n');
  fs.writeFileSync(OUT_FILE, js);
  console.log(`Wrote ${path.basename(OUT_FILE)} ${(js.length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
