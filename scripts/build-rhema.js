#!/usr/bin/env node
// scripts/build-rhema.js — downloads and processes Greek NT data into app-ready JS files
// Run once: node scripts/build-rhema.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..');

// ── Utilities ─────────────────────────────────────────────────────────────────

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) { reject(new Error('Too many redirects')); return; }
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'rhema-build/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Book mappings ─────────────────────────────────────────────────────────────

const NT_BOOKS = [
  { code: 'MAT', name: 'Matthew',          kjv: 'Matthew'          },
  { code: 'MAR', name: 'Mark',             kjv: 'Mark'             },
  { code: 'LUK', name: 'Luke',             kjv: 'Luke'             },
  { code: 'JOH', name: 'John',             kjv: 'John'             },
  { code: 'ACT', name: 'Acts',             kjv: 'Acts'             },
  { code: 'ROM', name: 'Romans',           kjv: 'Romans'           },
  { code: '1CO', name: '1 Corinthians',    kjv: '1Corinthians'     },
  { code: '2CO', name: '2 Corinthians',    kjv: '2Corinthians'     },
  { code: 'GAL', name: 'Galatians',        kjv: 'Galatians'        },
  { code: 'EPH', name: 'Ephesians',        kjv: 'Ephesians'        },
  { code: 'PHP', name: 'Philippians',      kjv: 'Philippians'      },
  { code: 'COL', name: 'Colossians',       kjv: 'Colossians'       },
  { code: '1TH', name: '1 Thessalonians',  kjv: '1Thessalonians'   },
  { code: '2TH', name: '2 Thessalonians',  kjv: '2Thessalonians'   },
  { code: '1TI', name: '1 Timothy',        kjv: '1Timothy'         },
  { code: '2TI', name: '2 Timothy',        kjv: '2Timothy'         },
  { code: 'TIT', name: 'Titus',            kjv: 'Titus'            },
  { code: 'PHM', name: 'Philemon',         kjv: 'Philemon'         },
  { code: 'HEB', name: 'Hebrews',          kjv: 'Hebrews'          },
  { code: 'JAM', name: 'James',            kjv: 'James'            },
  { code: '1PE', name: '1 Peter',          kjv: '1Peter'           },
  { code: '2PE', name: '2 Peter',          kjv: '2Peter'           },
  { code: '1JO', name: '1 John',           kjv: '1John'            },
  { code: '2JO', name: '2 John',           kjv: '2John'            },
  { code: '3JO', name: '3 John',           kjv: '3John'            },
  { code: 'JUD', name: 'Jude',             kjv: 'Jude'             },
  { code: 'REV', name: 'Revelation',       kjv: 'Revelation'       },
];

// ── Parse RP2018 CSV ──────────────────────────────────────────────────────────
// Format per line: chapter,verse,word1 strongs1 {MORPH1} word2 strongs2 {MORPH2} ...

function parseRpCsv(csvText) {
  const result = {};
  const lines = csvText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const firstComma = trimmed.indexOf(',');
    const secondComma = trimmed.indexOf(',', firstComma + 1);
    if (firstComma < 0 || secondComma < 0) continue;

    const chapter = trimmed.substring(0, firstComma).trim();
    const verse   = trimmed.substring(firstComma + 1, secondComma).trim();
    const text    = trimmed.substring(secondComma + 1).trim();

    if (!chapter || !verse || !text) continue;

    const tokens = text.split(' ');
    const words = [];

    for (let i = 0; i + 2 < tokens.length; i += 3) {
      const surface  = tokens[i];
      const strongs  = parseInt(tokens[i + 1], 10);
      const morph    = tokens[i + 2].replace(/[{}]/g, '');
      if (surface && !isNaN(strongs)) {
        words.push([surface, strongs, morph]);
      }
    }

    if (words.length) {
      if (!result[chapter]) result[chapter] = {};
      result[chapter][verse] = words;
    }
  }

  return result;
}

// ── Parse Strong's JS ─────────────────────────────────────────────────────────

function parseStrongs(jsText) {
  // Use require() directly — Node can execute the CommonJS module
  const tmpFile = '/tmp/strongs-tmp.js';
  require('fs').writeFileSync(tmpFile, jsText);
  const mod = require(tmpFile);
  // The module assigns to both `var strongsGreekDictionary` and `module.exports`
  return mod;
}

// ── Parse Dodson CSV ──────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { fields.push(current); current = ''; }
    else { current += ch; }
  }
  fields.push(current);
  return fields;
}

function parseDodson(tsvText) {
  const result = {};
  const lines = tsvText.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = line.split('\t').map(f => f.replace(/^"|"$/g, '').trim());
    if (fields.length < 5) continue;
    const strongs  = parseInt(fields[0], 10);
    const brief    = fields[3];
    const extended = fields[4];
    if (!isNaN(strongs) && strongs > 0) {
      result[strongs] = { brief, extended };
    }
  }
  return result;
}

// ── Parse CCAT accented CSV ───────────────────────────────────────────────────
// Format: chapter,verse,Βίβλος γενέσεως Ἰησοῦ ... (full accented words, space-separated)

const GREEK_LETTER = /\p{Script=Greek}/u;

function parseCcatCsv(csvText) {
  const result = {};
  const lines = csvText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const firstComma = trimmed.indexOf(',');
    const secondComma = trimmed.indexOf(',', firstComma + 1);
    if (firstComma < 0 || secondComma < 0) continue;
    const chapter = trimmed.substring(0, firstComma).trim();
    const verse   = trimmed.substring(firstComma + 1, secondComma).trim();
    const text    = trimmed.substring(secondComma + 1).trim();
    if (!chapter || !verse || !text) continue;
    // Split on whitespace, strip leading/trailing non-Greek characters, keep only tokens with at least one Greek letter
    const words = text.split(/\s+/)
      .map(w => w.replace(/^[^\p{Script=Greek}]+|[^\p{Script=Greek}]+$/gu, ''))
      .filter(w => GREEK_LETTER.test(w));
    if (words.length) {
      if (!result[chapter]) result[chapter] = {};
      result[chapter][verse] = words;
    }
  }
  return result;
}


function parseKjvBook(bookJson) {
  const result = {};
  for (const ch of bookJson.chapters) {
    const chNum = String(ch.chapter);
    result[chNum] = {};
    for (const v of ch.verses) {
      result[chNum][String(v.verse)] = v.text;
    }
  }
  return result;
}

// ── Parse TBESG (Abbott-Smith via STEPBible, CC BY 4.0) ──────────────────────
// Format: tab-separated, lines starting with G[0-9] are entries
// Columns: EStrong# dStrong uStrong Greek Gloss Morph OneWordMeaning FullDefinition

function parseTbesg(text) {
  const result = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!/^G\d/.test(trimmed)) continue;
    const fields = trimmed.split('\t');
    if (fields.length < 8) continue;
    const estrong = fields[0].trim();
    const defRaw  = fields[7] || '';
    const num = parseInt(estrong.replace('G', ''), 10);
    if (isNaN(num) || num <= 0 || num > 5624) continue;
    let def = defRaw
      .replace(/<ref='[^']*'>/g, '')
      .replace(/<\/ref>/g, '')
      .replace(/<BR \/>/gi, '<br>')
      .replace(/†\s*\([A-Z]+\)\s*$/g, '')
      .trim();
    if (def) result[num] = def;
  }
  return result;
}

// ── Compute occurrences ───────────────────────────────────────────────────────

// Optional Moulton-Milligan source.
// Expected format: tab-separated rows with a Strong's number in the first column
// (G1510 or 1510) and the formatted lexicon entry in the remaining columns.
function parseMoultonMilligan(text) {
  const result = {};
  const lines = text.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const fields = line.split('\t').map(field => field.trim()).filter(Boolean);
    if (fields.length < 2) continue;
    const match = fields[0].match(/^G?0*(\d{1,4})$/i);
    if (!match) continue;
    const num = parseInt(match[1], 10);
    if (isNaN(num) || num <= 0 || num > 5624) continue;
    const def = fields.slice(1).join(' ')
      .replace(/<BR \/>/gi, '<br>')
      .replace(/\s+/g, ' ')
      .trim();
    if (def) result[num] = def;
  }
  return result;
}

function loadMoultonMilligan() {
  const sourcePath = process.env.MM_LEXICON_FILE;
  if (!sourcePath) {
    console.log('\nSkipping Moulton-Milligan lexicon (set MM_LEXICON_FILE to a Strong\'s-keyed TSV source).');
    return {};
  }
  const resolved = path.resolve(sourcePath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const parsed = parseMoultonMilligan(raw);
  console.log(`\nLoaded Moulton-Milligan lexicon from ${resolved}`);
  console.log(`  ${Object.keys(parsed).length} entries`);
  return parsed;
}

function computeOccurrences(ntText) {
  const occ = {};
  for (const [bookCode, chapters] of Object.entries(ntText)) {
    for (const verses of Object.values(chapters)) {
      for (const words of Object.values(verses)) {
        for (const [, strongs] of words) {
          if (!occ[strongs]) occ[strongs] = { total: 0, books: {} };
          occ[strongs].total++;
          occ[strongs].books[bookCode] = (occ[strongs].books[bookCode] || 0) + 1;
        }
      }
    }
  }
  return occ;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building Rhēma data files...\n');

  // 1. RP2018 NT text
  console.log('Downloading Robinson-Pierpont 2018 (27 books)...');
  const ntText = {};
  const RP_BASE = 'https://raw.githubusercontent.com/byztxt/byzantine-majority-text/master/csv-unicode/strongs/with-parsing/';

  for (const book of NT_BOOKS) {
    process.stdout.write(`  ${book.code}... `);
    try {
      const csv = await fetchText(`${RP_BASE}${book.code}.csv`);
      ntText[book.code] = parseRpCsv(csv);
      const verses = Object.values(ntText[book.code]).reduce((s, ch) => s + Object.keys(ch).length, 0);
      process.stdout.write(`✓ (${verses} verses)\n`);
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`);
    }
  }

  // 2. Apply accents from CCAT files (same repo, same word order, full Unicode)
  console.log('\nDownloading accented text (CCAT/RP2018)...');
  const CCAT_BASE = 'https://raw.githubusercontent.com/byztxt/byzantine-majority-text/master/csv-unicode/ccat/no-variants/';
  let accentMismatches = 0;

  for (const book of NT_BOOKS) {
    process.stdout.write(`  ${book.code}... `);
    try {
      const csv = await fetchText(`${CCAT_BASE}${book.code}.csv`);
      const accented = parseCcatCsv(csv);
      let swapped = 0, mismatched = 0;
      for (const [ch, verses] of Object.entries(ntText[book.code] || {})) {
        for (const [v, words] of Object.entries(verses)) {
          const acc = (accented[ch] || {})[v] || [];
          if (acc.length === words.length) {
            words.forEach((w, i) => { w[0] = acc[i]; });
            swapped += words.length;
          } else if (acc.length > 0) {
            // Counts differ — apply what aligns, leave rest unaccented
            const min = Math.min(words.length, acc.length);
            for (let i = 0; i < min; i++) words[i][0] = acc[i];
            mismatched++;
            accentMismatches++;
          }
        }
      }
      process.stdout.write(`✓ (${swapped} words accented${mismatched ? ', ' + mismatched + ' verse mismatches' : ''})\n`);
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`);
    }
  }
  if (accentMismatches) console.log(`  Total verse mismatches: ${accentMismatches}`);

  // 3. Strong's lexicon
  console.log('\nDownloading Strong\'s Greek lexicon...');
  const strongsRaw = await fetchText('https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js');
  const strongs = parseStrongs(strongsRaw);
  console.log(`  ${Object.keys(strongs).length} entries`);

  // 4. Dodson lexicon
  console.log('\nDownloading Dodson lexicon...');
  const dodsonRaw = await fetchText('https://raw.githubusercontent.com/biblicalhumanities/Dodson-Greek-Lexicon/master/dodson.csv');
  const dodson = parseDodson(dodsonRaw);
  console.log(`  ${Object.keys(dodson).length} entries`);

  // 4b. TBESG (Abbott-Smith, STEPBible CC BY 4.0)
  console.log('\nDownloading TBESG (Abbott-Smith) lexicon...');
  const tbesgRaw = await fetchText('https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt');
  const tbesg = parseTbesg(tbesgRaw);
  console.log(`  ${Object.keys(tbesg).length} entries`);

  // 4c. Moulton-Milligan (optional public-domain source)
  const moultonMilligan = loadMoultonMilligan();

  // 5. KJV NT
  console.log('\nDownloading KJV New Testament...');
  const kjvText = {};
  const KJV_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/';

  for (const book of NT_BOOKS) {
    process.stdout.write(`  ${book.kjv}... `);
    try {
      const raw = await fetchText(`${KJV_BASE}${book.kjv}.json`);
      const bookData = JSON.parse(raw);
      kjvText[book.code] = parseKjvBook(bookData);
      process.stdout.write('✓\n');
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`);
    }
  }

  // 5. Occurrences
  console.log('\nComputing occurrences...');
  const occ = computeOccurrences(ntText);
  console.log(`  ${Object.keys(occ).length} unique Strong\'s numbers`);

  // 6. Build combined lexicon
  console.log('\nBuilding combined lexicon...');
  const lexicon = {};
  for (const [key, entry] of Object.entries(strongs)) {
    const num = parseInt(key.replace('G', ''), 10);
    if (isNaN(num)) continue;
    const dod = dodson[num] || {};
    lexicon[num] = {
      lemma:        entry.lemma         || '',
      translit:     entry.translit      || '',
      pronounce:    entry.pronunciation || '',
      strongs_def:  entry.strongs_def   || '',
      kjv_def:      entry.kjv_def       || '',
      deriv:        entry.derivation    || '',
      quick_def:    dod.brief || dod.extended || entry.strongs_def || entry.kjv_def || '',
      brief:        dod.brief           || '',
      extended:     dod.extended        || '',
      abbott_smith: tbesg[num]          || '',
      moulton_milligan: moultonMilligan[num] || '',
    };
  }

  // 7. Book metadata
  const bookNames = {};
  const bookOrder = NT_BOOKS.map(b => { bookNames[b.code] = b.name; return b.code; });

  // 8. Write files
  console.log('\nWriting output files...');

  const ntJs  = `window.RhemaNT = ${JSON.stringify({ books: bookOrder, names: bookNames, text: ntText })};`;
  const lexJs = `window.RhemaLexicon = ${JSON.stringify(lexicon)};\nwindow.RhemaOcc = ${JSON.stringify(occ)};`;
  const kjvJs = `window.RhemaKJV = ${JSON.stringify(kjvText)};`;

  fs.writeFileSync(path.join(OUT_DIR, 'rhema-nt.js'),      ntJs);
  fs.writeFileSync(path.join(OUT_DIR, 'rhema-lexicon.js'), lexJs);
  fs.writeFileSync(path.join(OUT_DIR, 'rhema-kjv.js'),     kjvJs);

  console.log(`  rhema-nt.js      ${(ntJs.length  / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  rhema-lexicon.js ${(lexJs.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  rhema-kjv.js     ${(kjvJs.length / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nDone!');
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
