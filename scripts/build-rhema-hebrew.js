#!/usr/bin/env node
// Build Rhema Hebrew OT data from Open Scriptures Hebrew Bible (OSHB/MorphHB).
//
// Source: https://github.com/openscriptures/morphhb
// OSHB lemma/morphology: Creative Commons Attribution 4.0 International.
// WLC text in OSHB: Public Domain. This script does not use copyrighted BHS data.
//
// Optional Hebrew lexicon source:
// https://github.com/openscriptures/strongs
// Strong's Hebrew dictionary text is treated as public-domain Strong's 1894 data.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '..');
const MORPHHB_DIR = process.env.MORPHHB_SOURCE_DIR || path.join(os.tmpdir(), 'rhema-morphhb-source');
const STRONGS_DIR = process.env.STRONGS_SOURCE_DIR || path.join(os.tmpdir(), 'rhema-strongs-source');

const OT_BOOKS = [
  { code: 'GEN', name: 'Genesis', source: 'Gen.xml' },
  { code: 'EXO', name: 'Exodus', source: 'Exod.xml' },
  { code: 'LEV', name: 'Leviticus', source: 'Lev.xml' },
  { code: 'NUM', name: 'Numbers', source: 'Num.xml' },
  { code: 'DEU', name: 'Deuteronomy', source: 'Deut.xml' },
  { code: 'JOS', name: 'Joshua', source: 'Josh.xml' },
  { code: 'JDG', name: 'Judges', source: 'Judg.xml' },
  { code: 'RUT', name: 'Ruth', source: 'Ruth.xml' },
  { code: '1SA', name: '1 Samuel', source: '1Sam.xml' },
  { code: '2SA', name: '2 Samuel', source: '2Sam.xml' },
  { code: '1KI', name: '1 Kings', source: '1Kgs.xml' },
  { code: '2KI', name: '2 Kings', source: '2Kgs.xml' },
  { code: '1CH', name: '1 Chronicles', source: '1Chr.xml' },
  { code: '2CH', name: '2 Chronicles', source: '2Chr.xml' },
  { code: 'EZR', name: 'Ezra', source: 'Ezra.xml' },
  { code: 'NEH', name: 'Nehemiah', source: 'Neh.xml' },
  { code: 'EST', name: 'Esther', source: 'Esth.xml' },
  { code: 'JOB', name: 'Job', source: 'Job.xml' },
  { code: 'PSA', name: 'Psalms', source: 'Ps.xml' },
  { code: 'PRO', name: 'Proverbs', source: 'Prov.xml' },
  { code: 'ECC', name: 'Ecclesiastes', source: 'Eccl.xml' },
  { code: 'SNG', name: 'Song of Solomon', source: 'Song.xml' },
  { code: 'ISA', name: 'Isaiah', source: 'Isa.xml' },
  { code: 'JER', name: 'Jeremiah', source: 'Jer.xml' },
  { code: 'LAM', name: 'Lamentations', source: 'Lam.xml' },
  { code: 'EZK', name: 'Ezekiel', source: 'Ezek.xml' },
  { code: 'DAN', name: 'Daniel', source: 'Dan.xml' },
  { code: 'HOS', name: 'Hosea', source: 'Hos.xml' },
  { code: 'JOL', name: 'Joel', source: 'Joel.xml' },
  { code: 'AMO', name: 'Amos', source: 'Amos.xml' },
  { code: 'OBA', name: 'Obadiah', source: 'Obad.xml' },
  { code: 'JON', name: 'Jonah', source: 'Jonah.xml' },
  { code: 'MIC', name: 'Micah', source: 'Mic.xml' },
  { code: 'NAM', name: 'Nahum', source: 'Nah.xml' },
  { code: 'HAB', name: 'Habakkuk', source: 'Hab.xml' },
  { code: 'ZEP', name: 'Zephaniah', source: 'Zeph.xml' },
  { code: 'HAG', name: 'Haggai', source: 'Hag.xml' },
  { code: 'ZEC', name: 'Zechariah', source: 'Zech.xml' },
  { code: 'MAL', name: 'Malachi', source: 'Mal.xml' },
];

function ensureRepo(dir, url) {
  if (fs.existsSync(dir)) return;
  execFileSync('git', ['clone', '--depth', '1', url, dir], { stdio: 'inherit' });
}

function attr(attrs, name) {
  const m = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return m ? decodeXml(m[1]) : '';
}

function decodeXml(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripTags(text) {
  return decodeXml(String(text || '').replace(/<[^>]*>/g, ''));
}

function displayHebrew(text) {
  return stripTags(text).replace(/\//g, '');
}

function strongFromLemma(rawLemma) {
  const parts = String(rawLemma || '').split('/');
  const last = parts[parts.length - 1] || '';
  const m = last.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function addWord(text, book, chapter, verse, word) {
  text[book] ||= {};
  text[book][chapter] ||= {};
  text[book][chapter][verse] ||= [];
  text[book][chapter][verse].push(word);
}

function parseBook(book, names, text, occ, seenStrongs) {
  names[book.code] = book.name;
  const file = path.join(MORPHHB_DIR, 'wlc', book.source);
  if (!fs.existsSync(file)) throw new Error(`Missing OSHB source file: ${file}`);
  const xml = fs.readFileSync(file, 'utf8');
  const verseRe = /<verse\b[^>]*osisID="([^"]+)"[^>]*>([\s\S]*?)(?=<verse\b|<\/chapter>|<\/div>)/g;
  let verseMatch;
  while ((verseMatch = verseRe.exec(xml))) {
    const osis = verseMatch[1];
    const ref = osis.match(/\.(\d+)\.(\d+)$/);
    if (!ref) continue;
    const [, chapter, verse] = ref;
    const body = verseMatch[2];
    const tokenRe = /<w\b([^>]*)>([\s\S]*?)<\/w>|<seg\b[^>]*type="x-sof-pasuq"[^>]*>([\s\S]*?)<\/seg>/g;
    let tokenMatch;
    while ((tokenMatch = tokenRe.exec(body))) {
      if (tokenMatch[3]) {
        const punct = stripTags(tokenMatch[3]);
        const words = text[book.code]?.[chapter]?.[verse];
        if (punct && words?.length) words[words.length - 1][0] += punct;
        continue;
      }
      const attrs = tokenMatch[1] || '';
      const surface = displayHebrew(tokenMatch[2]);
      if (!surface) continue;
      const rawLemma = attr(attrs, 'lemma');
      const morph = attr(attrs, 'morph');
      const strong = strongFromLemma(rawLemma);
      const word = [surface, strong, morph, rawLemma];
      addWord(text, book.code, chapter, verse, word);
      if (strong) {
        seenStrongs.add(String(strong));
        occ[strong] ||= { total: 0, books: {} };
        occ[strong].total++;
        occ[strong].books[book.code] = (occ[strong].books[book.code] || 0) + 1;
      }
    }
  }
}

function firstTextBetween(html, start, end) {
  const s = html.indexOf(start);
  if (s < 0) return '';
  const e = html.indexOf(end, s + start.length);
  if (e < 0) return '';
  return stripTags(html.slice(s + start.length, e)).trim();
}

function parseStrongLexicon(seenStrongs) {
  const file = path.join(STRONGS_DIR, 'strongs-dictionary.xhtml');
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf8');
  const lex = {};
  const liRe = /<li\s+value="(\d+)"\s+id="ot:\1">([\s\S]*?)<\/li>/g;
  let m;
  while ((m = liRe.exec(raw))) {
    const num = m[1];
    if (!seenStrongs.has(num)) continue;
    const html = m[2];
    const lemmaHtml = (html.match(/<i\b[^>]*xml:lang="hbo"[^>]*>([\s\S]*?)<\/i>/) || [])[1] || '';
    const pronounce = (html.match(/<i\b[^>]*title="\{([^}]*)\}"/) || [])[1] || '';
    const kjv = firstTextBetween(html, '<span class="kjv_def">', '</span>');
    const text = stripTags(html).replace(/\s+/g, ' ').trim();
    const brief = text
      .replace(stripTags(lemmaHtml), '')
      .replace(kjv, '')
      .replace(/^from\s+/i, 'from ')
      .trim()
      .replace(/\s*:\s*\.?$/, '');
    lex[num] = {
      lemma: stripTags(lemmaHtml),
      translit: '',
      pronounce,
      strongs_def: brief,
      kjv_def: kjv,
      deriv: '',
      quick_def: kjv.split(',')[0]?.trim() || '',
      brief: kjv.split(',')[0]?.trim() || brief,
      extended: brief,
    };
  }
  return lex;
}

function writeJs(file, globalName, payload, license) {
  const js = `${license}\nwindow.${globalName} = ${JSON.stringify(payload)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, file), js, 'utf8');
  return js.length;
}

function main() {
  ensureRepo(MORPHHB_DIR, 'https://github.com/openscriptures/morphhb.git');
  ensureRepo(STRONGS_DIR, 'https://github.com/openscriptures/strongs.git');

  const names = {};
  const text = {};
  const occ = {};
  const seenStrongs = new Set();
  for (const book of OT_BOOKS) parseBook(book, names, text, occ, seenStrongs);

  const books = OT_BOOKS.filter(book => text[book.code]).map(book => book.code);
  const payload = { books, names, text };
  const sourceLicense = [
    '/*',
    'Generated from Open Scriptures Hebrew Bible (OSHB/MorphHB).',
    'Source: https://github.com/openscriptures/morphhb',
    'OSHB lemma/morphology license: CC BY 4.0. WLC text in OSHB: Public Domain.',
    'No copyrighted BHS data is included.',
    '*/',
  ].join('\n');
  const otBytes = writeJs('rhema-ot-hebrew.js', 'RhemaHebrewOT', payload, sourceLicense);

  const lex = parseStrongLexicon(seenStrongs);
  const lexLicense = [
    '/*',
    'Generated Hebrew Rhema lexicon/occurrences.',
    'Text/morphology source: OSHB/MorphHB, https://github.com/openscriptures/morphhb (CC BY 4.0; WLC text Public Domain).',
    "Definitions source where present: public-domain Strong's Hebrew dictionary data via https://github.com/openscriptures/strongs.",
    'Unavailable lexicon fields are left blank instead of synthesized.',
    '*/',
  ].join('\n');
  const lexJs = `${lexLicense}\nwindow.RhemaHebrewLexicon = ${JSON.stringify(lex)};\nwindow.RhemaHebrewOcc = ${JSON.stringify(occ)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'rhema-hebrew-lexicon.js'), lexJs, 'utf8');

  const verseCount = Object.values(text).reduce((sum, chs) => (
    sum + Object.values(chs).reduce((chSum, vs) => chSum + Object.keys(vs).length, 0)
  ), 0);
  console.log(`Wrote rhema-ot-hebrew.js (${(otBytes / 1024 / 1024).toFixed(2)} MB, ${books.length} books, ${verseCount} verses)`);
  console.log(`Wrote rhema-hebrew-lexicon.js (${(lexJs.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(lex).length} lexicon entries)`);
}

main();
