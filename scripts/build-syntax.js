#!/usr/bin/env node
'use strict';

/**
 * Build script: Macula Greek NT (Nestle1904) → rhema-syntax.js
 *
 * Source: Clear Bible, Inc. — github.com/Clear-Bible/macula-greek
 * License: CC BY 4.0
 *
 * Downloads the per-word syntactic role data from the Macula Greek TSV,
 * extracts roles for every NT word, and outputs a compact lookup file
 * (rhema-syntax.js) keyed to Rhema's book/chapter/verse/Strongs scheme.
 *
 * Role codes from the dataset:
 *   s   = subject
 *   v   = main verb (predicate)
 *   vc  = copulative / linking verb (εἰμί etc.)
 *   o   = direct object
 *   o2  = second object
 *   io  = indirect object
 *   p   = predicate nominative / complement
 *   adv = adverbial modifier
 *   aux = auxiliary verb
 */

const fs    = require('fs');
const https = require('https');
const path  = require('path');

const TSV_URL = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/Nestle1904/tsv/macula-greek-Nestle1904.tsv';
const OUT_FILE = path.join(__dirname, '..', 'rhema-syntax.js');

// Map dataset book abbreviations → Rhema book keys
const BOOK_MAP = {
  MAT:'MAT', MRK:'MAR', LUK:'LUK', JHN:'JOH', ACT:'ACT',
  ROM:'ROM', '1CO':'1CO', '2CO':'2CO', GAL:'GAL', EPH:'EPH',
  PHP:'PHP', COL:'COL', '1TH':'1TH', '2TH':'2TH', '1TI':'1TI',
  '2TI':'2TI', TIT:'TIT', PHM:'PHM', HEB:'HEB', JAS:'JAM',
  '1PE':'1PE', '2PE':'2PE', '1JN':'1JO', '2JN':'2JO', '3JN':'3JO',
  JUD:'JUD', REV:'REV',
};

function fetchTSV() {
  return new Promise((resolve, reject) => {
    process.stdout.write('Downloading Macula Greek TSV (~20 MB)...');
    const chunks = [];
    https.get(TSV_URL, res => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.on('data', c => { chunks.push(c); process.stdout.write('.'); });
      res.on('end', () => { process.stdout.write(' done\n'); resolve(Buffer.concat(chunks).toString('utf8')); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const tsv = await fetchTSV();
  const lines = tsv.split('\n');
  console.log(`Parsing ${lines.length.toLocaleString()} lines...`);

  // syntax[rhemaBook][chapter][verse] = [[wordPos1b, strongs, role], ...]
  const syntax = {};
  let included = 0, skipped = 0, noRole = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // TSV columns (0-indexed):
    // 0=xml:id  1=ref  2=role  3=class  4=type  5=english  6=mandarin
    // 7=gloss  8=text  9=after  10=lemma  11=normalized  12=strong
    // 13=morph  14=person  15=number  16=gender  17=case  ...
    const tab1 = line.indexOf('\t');
    const tab2 = line.indexOf('\t', tab1 + 1);
    const tab3 = line.indexOf('\t', tab2 + 1);

    const ref  = line.slice(tab1 + 1, tab2); // e.g. "JHN 3:16!14"
    const role = line.slice(tab2 + 1, tab3); // e.g. "p" or ""

    if (!role) { noRole++; continue; }

    // Find strong# (column 12)
    let col = 0, pos = 0;
    while (col < 12) { pos = line.indexOf('\t', pos) + 1; col++; }
    const nextTab = line.indexOf('\t', pos);
    const strongs = parseInt(line.slice(pos, nextTab < 0 ? undefined : nextTab), 10);
    if (!strongs || isNaN(strongs)) { skipped++; continue; }

    // Parse ref: "JHN 3:16!14"
    const sp = ref.indexOf(' ');
    const dsBook = ref.slice(0, sp);
    const rest   = ref.slice(sp + 1);
    const bang   = rest.indexOf('!');
    if (bang < 0) { skipped++; continue; }
    const cv      = rest.slice(0, bang);           // "3:16"
    const wordPos = parseInt(rest.slice(bang + 1), 10); // 1-based
    const colon   = cv.indexOf(':');
    const chapter = cv.slice(0, colon);
    const verse   = cv.slice(colon + 1);

    const rhemaBook = BOOK_MAP[dsBook];
    if (!rhemaBook) { skipped++; continue; }

    if (!syntax[rhemaBook])            syntax[rhemaBook] = {};
    if (!syntax[rhemaBook][chapter])   syntax[rhemaBook][chapter] = {};
    if (!syntax[rhemaBook][chapter][verse]) syntax[rhemaBook][chapter][verse] = [];

    syntax[rhemaBook][chapter][verse].push([wordPos, strongs, role]);
    included++;
  }

  // Stats
  let verseCount = 0, bookCount = 0;
  for (const book of Object.values(syntax)) {
    bookCount++;
    for (const chap of Object.values(book)) verseCount += Object.keys(chap).length;
  }

  console.log(`Role entries included : ${included.toLocaleString()}`);
  console.log(`No role (skipped)     : ${noRole.toLocaleString()}`);
  console.log(`Other skipped         : ${skipped}`);
  console.log(`Books covered         : ${bookCount}`);
  console.log(`Verses with role data : ${verseCount.toLocaleString()}`);

  // Role distribution
  const roleCounts = {};
  for (const book of Object.values(syntax))
    for (const chap of Object.values(book))
      for (const verseEntries of Object.values(chap))
        for (const [,, r] of verseEntries) roleCounts[r] = (roleCounts[r] || 0) + 1;
  console.log('Role distribution:', roleCounts);

  const json = JSON.stringify(syntax);
  const header = [
    '/* Auto-generated — do not edit by hand.',
    ' * Run: node scripts/build-syntax.js',
    ' *',
    ' * Source : Macula Greek NT (Nestle1904)',
    ' *          Clear Bible, Inc. — https://github.com/Clear-Bible/macula-greek',
    ' * License: CC BY 4.0  https://creativecommons.org/licenses/by/4.0/',
    ' *',
    ' * Role codes:',
    ' *   s   = subject',
    ' *   v   = main verb',
    ' *   vc  = copulative / linking verb',
    ' *   o   = direct object',
    ' *   o2  = second object',
    ' *   io  = indirect object',
    ' *   p   = predicate nominative',
    ' *   adv = adverbial',
    ' *   aux = auxiliary',
    ' *',
    ' * Per-verse format: [[wordPos1b, strongsNum, role], ...]',
    ' * wordPos is 1-based (Nestle1904 word order).',
    ' * Alignment to Rhema text: match by Strongs + position proximity. */',
    `window.RhemaSyntax = ${json};`,
    '',
  ].join('\n');

  fs.writeFileSync(OUT_FILE, header, 'utf8');
  const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`\nWritten: ${OUT_FILE} (${kb} KB)`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
