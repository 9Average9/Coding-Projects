#!/usr/bin/env node
// Build Rhema's offline cross-reference dataset from public JSON source data.

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, '..', 'rhema-crossrefs.js');
const BASE = 'https://raw.githubusercontent.com/josephilipraja/bible-cross-reference-json/master/';

const OT = new Set([
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI',
  '1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER',
  'LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP',
  'HAG','ZEC','MAL'
]);
const PROPHETIC_OT = new Set([
  'PSA','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC',
  'NAM','HAB','ZEP','HAG','ZEC','MAL'
]);
const CODE_MAP = { JOE: 'JOL', NAH: 'NAM', SOS: 'SNG' };
const LIMITS = { direct: 18, themes: 8, otNt: 12, parallel: 8, prophecy: 6 };
const LABELS = [
  'Immediate context',
  'Same book',
  'Related reference',
  'NT connection',
  'OT foundation',
  'Prophecy connection',
  'Parallel idea',
  'Related theme',
  'Shared wording',
  'Same passage',
  'Creation theme',
  'Similar concept',
  'Eternal life',
  'Created by the word',
  'Ancient origin',
  'All things created',
  'Related teaching',
  'Fulfillment connection',
  'Prophecy foundation'
];
const LABEL_INDEX = Object.fromEntries(LABELS.map((label, index) => [label, index]));
const CATEGORY_OUT = { direct: 'd', themes: 't', otNt: 'o', parallel: 'p', prophecy: 'f' };

const CURATED = {
  'JOH 1:1': {
    direct: [
      ['REV 19:13', 'Shared wording'],
      ['1JO 1:1', 'Shared wording'],
      ['JOH 1:14', 'Same passage']
    ],
    themes: [
      ['COL 1:15-16', 'Creation theme'],
      ['HEB 1:3', 'Similar concept'],
      ['1JO 1:1-2', 'Eternal life']
    ],
    otNt: [
      ['GEN 1:1', 'Creation theme'],
      ['PSA 33:6', 'Created by the word'],
      ['PRO 8:22-25', 'OT foundation'],
      ['ISA 9:6', 'OT foundation'],
      ['MIC 5:2', 'Ancient origin'],
      ['HEB 1:1-3', 'NT connection'],
      ['COL 1:15-16', 'All things created']
    ],
    parallel: [
      ['PHP 2:6-11', 'Parallel idea'],
      ['HEB 1:1-3', 'Related teaching'],
      ['2CO 4:4', 'Similar concept'],
      ['COL 1:15', 'Parallel idea']
    ],
    prophecy: [
      ['MIC 5:2', 'Prophecy fulfillment'],
      ['JOH 1:14', 'Fulfillment connection'],
      ['ISA 53:1-12', 'Prophecy foundation']
    ]
  }
};

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'rhema-crossrefs-build/1.0' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return fetchText(res.headers.location, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function refFromSource(raw) {
  const parts = String(raw || '').trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const code = CODE_MAP[parts[0]] || parts[0];
  return `${code} ${parts[1]}:${parts[2]}`;
}

function bookOf(ref) {
  return String(ref).split(' ')[0];
}

function chapterOf(ref) {
  return Number(String(ref).split(' ')[1]?.split(':')[0] || 0);
}

function sameTestament(a, b) {
  return OT.has(bookOf(a)) === OT.has(bookOf(b));
}

function addUnique(list, ref, label, seen) {
  if (!ref || seen.has(ref)) return;
  seen.add(ref);
  list.push({ ref, label });
}

function classify(source, refs) {
  const result = { direct: [], themes: [], otNt: [], parallel: [], prophecy: [] };
  const seenByCategory = {
    direct: new Set(), themes: new Set(), otNt: new Set(), parallel: new Set(), prophecy: new Set()
  };
  const srcBook = bookOf(source);
  const srcChapter = chapterOf(source);

  for (const ref of refs) {
    const refBook = bookOf(ref);
    const refChapter = chapterOf(ref);
    if (refBook === srcBook && Math.abs(refChapter - srcChapter) <= 1) {
      addUnique(result.direct, ref, 'Immediate context', seenByCategory.direct);
    } else {
      addUnique(result.direct, ref, refBook === srcBook ? 'Same book' : 'Related reference', seenByCategory.direct);
    }

    if (!sameTestament(source, ref)) {
      addUnique(result.otNt, ref, OT.has(srcBook) ? 'NT connection' : 'OT foundation', seenByCategory.otNt);
    }

    if (!sameTestament(source, ref) && (PROPHETIC_OT.has(srcBook) || PROPHETIC_OT.has(refBook))) {
      addUnique(result.prophecy, ref, 'Prophecy connection', seenByCategory.prophecy);
    }

    if (sameTestament(source, ref) && refBook !== srcBook) {
      addUnique(result.parallel, ref, 'Parallel idea', seenByCategory.parallel);
    }

    if (refBook !== srcBook) {
      addUnique(result.themes, ref, 'Related theme', seenByCategory.themes);
    }
  }

  for (const [category, items] of Object.entries(CURATED[source] || {})) {
    for (const [ref, label] of items.slice().reverse()) {
      const clean = ref.replace(/^([1-3]?[A-Z]{2,3})\s+(\d+):(\d+)-(\d+)$/, '$1 $2:$3-$4');
      result[category] = result[category].filter(item => item.ref !== clean);
      result[category].unshift({ ref: clean, label });
    }
  }

  for (const [category, limit] of Object.entries(LIMITS)) {
    result[category] = result[category].slice(0, limit);
  }

  return result;
}

function compact(categories) {
  const out = {};
  for (const [category, key] of Object.entries(CATEGORY_OUT)) {
    const items = categories[category] || [];
    if (items.length) out[key] = items.map(item => `${item.ref}|${LABEL_INDEX[item.label] ?? LABEL_INDEX['Related reference']}`);
  }
  return out;
}

async function main() {
  const out = {};
  let entries = 0;
  let links = 0;

  for (let i = 1; i <= 32; i++) {
    process.stdout.write(`Downloading crossrefs ${i}.json... `);
    const data = JSON.parse(await fetchText(`${BASE}${i}.json`));
    process.stdout.write('done\n');
    for (const entry of Object.values(data)) {
      const source = refFromSource(entry.v);
      if (!source) continue;
      const refs = Object.values(entry.r || {}).map(refFromSource).filter(Boolean);
      out[source] = compact(classify(source, refs));
      entries++;
      links += refs.length;
    }
  }

  const js = `window.RhemaCrossRefLabels = ${JSON.stringify(LABELS)};\nwindow.RhemaCrossRefs = ${JSON.stringify(out)};`;
  fs.writeFileSync(OUT_FILE, js);
  console.log(`Wrote ${path.basename(OUT_FILE)} with ${entries} verses and ${links} source links (${(js.length / 1024 / 1024).toFixed(2)} MB).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
