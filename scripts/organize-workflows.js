#!/usr/bin/env node
/**
 * organize-workflows.js
 *
 * Takes the workflows you exported from n8n, removes personal or
 * instance-specific data, and sorts them into this repository's lesson folders.
 *
 * Usage (from the repository root):
 *   node scripts/organize-workflows.js <folder-with-exported-workflows>
 *
 * Example (Windows):
 *   node scripts/organize-workflows.js C:\n8n-project\backup\workflows
 *
 * What it does to every workflow:
 *   - removes pinned test data (pinData), which can contain real names, emails or phone numbers
 *   - removes credential IDs (keeps only the credential name, so people know what to reconnect)
 *   - removes the instance ID and sharing info
 *   - replaces Google Sheets document IDs and URLs with placeholders
 *   - warns you about anything that looks like an API key typed directly into a node
 *
 * File and folder rules (based on the workflow's name):
 *   "Lesson 8 - Exercise 02"  ->  lessons/lesson-08-ai/Lesson 8 - Exercise 02.json
 *   "Lesson 10 - Workflow A"  ->  lessons/lesson-10-final-project/Lesson 10 - Workflow A.json
 *   a name without "Lesson <number>"  ->  other/<name>.json
 * Each file keeps the workflow's exact name. Characters Windows does not
 * allow in file names ( < > : " / \ | ? * ) are replaced with "_".
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const inputDir = process.argv[2];

if (!inputDir || !fs.existsSync(inputDir)) {
  console.error('Usage: node scripts/organize-workflows.js <folder-with-exported-workflows>');
  process.exit(1);
}

const lessonFolders = fs
  .readdirSync(path.join(ROOT, 'lessons'))
  .filter((name) => /^lesson-\d+/.test(name));

const SECRET_PATTERNS = [
  { name: 'Anthropic key', re: /sk-ant-[A-Za-z0-9_-]{10,}/ },
  { name: 'OpenAI-style key', re: /\bsk-[A-Za-z0-9]{20,}/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'Bearer token', re: /Bearer\s+[A-Za-z0-9._-]{12,}/ },
];

const SHEET_URL_RE = /https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+[^"']*/g;

// Keep the workflow's own name as the file name ("Lesson 8 - Exercise 02.json").
// Only characters that Windows does not allow in file names are replaced.
function safeFileName(text) {
  const name = String(text)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return name || 'workflow';
}

// If two workflows have the same name, add " (2)", " (3)" and so on.
const usedPaths = new Set();
function uniquePath(dir, base) {
  let candidate = path.join(dir, `${base}.json`);
  let i = 2;
  while (usedPaths.has(candidate.toLowerCase())) {
    candidate = path.join(dir, `${base} (${i}).json`);
    i += 1;
  }
  usedPaths.add(candidate.toLowerCase());
  return candidate;
}

function targetFolder(name) {
  const lesson = /lesson\s*0?(\d+)/i.exec(name);
  if (lesson) {
    const num = String(Number(lesson[1])).padStart(2, '0');
    const folder = lessonFolders.find((f) => f.startsWith(`lesson-${num}`));
    if (folder) return path.join('lessons', folder);
  }
  return 'other';
}

// Walk every value in the workflow and clean what we find.
function scrub(value, warnings, where) {
  if (Array.isArray(value)) return value.map((v) => scrub(v, warnings, where));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === 'cachedResultUrl') {
        out[key] = '';
        continue;
      }
      out[key] = scrub(val, warnings, where);
    }
    return out;
  }
  if (typeof value === 'string') {
    for (const p of SECRET_PATTERNS) {
      if (p.re.test(value)) warnings.push(`${where}: looks like a ${p.name} typed into a node. Remove it and use a credential.`);
    }
    return value.replace(SHEET_URL_RE, 'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID');
  }
  return value;
}

function cleanWorkflow(wf) {
  const warnings = [];
  const clean = { ...wf };

  delete clean.pinData;
  delete clean.shared;
  delete clean.homeProject;
  delete clean.sharedWithProjects;
  if (clean.meta) {
    clean.meta = { ...clean.meta };
    delete clean.meta.instanceId;
  }

  clean.nodes = (clean.nodes || []).map((node) => {
    const n = { ...node };
    if (n.credentials) {
      const creds = {};
      for (const [type, cred] of Object.entries(n.credentials)) {
        creds[type] = { name: cred && cred.name ? cred.name : type };
      }
      n.credentials = creds;
    }
    // Google Sheets / Drive document pickers: hide the real document ID.
    if (n.parameters && n.parameters.documentId && typeof n.parameters.documentId === 'object') {
      n.parameters = { ...n.parameters, documentId: { ...n.parameters.documentId, value: 'YOUR_SPREADSHEET_ID' } };
    }
    return scrub(n, warnings, `"${wf.name}" > node "${n.name}"`);
  });

  return { clean, warnings };
}

const files = fs.readdirSync(inputDir).filter((f) => f.toLowerCase().endsWith('.json'));
if (files.length === 0) {
  console.error(`No .json files found in ${inputDir}`);
  process.exit(1);
}

let count = 0;
const allWarnings = [];

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'));
  const workflows = Array.isArray(raw) ? raw : [raw];

  for (const wf of workflows) {
    if (!wf || !wf.nodes) continue;
    const { clean, warnings } = cleanWorkflow(wf);
    const folder = targetFolder(wf.name || file);
    const outDir = path.join(ROOT, folder);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = uniquePath(outDir, safeFileName(wf.name || path.parse(file).name));
    fs.writeFileSync(outFile, JSON.stringify(clean, null, 2) + '\n');
    console.log(`  ${wf.name}  ->  ${path.relative(ROOT, outFile)}`);
    allWarnings.push(...warnings);
    count += 1;
  }
}

console.log(`\nDone: ${count} workflow(s) cleaned and sorted.`);
if (allWarnings.length) {
  console.log('\nCHECK THESE BEFORE YOU PUSH TO GITHUB:');
  for (const w of [...new Set(allWarnings)]) console.log(`  - ${w}`);
} else {
  console.log('No API keys found typed into nodes.');
}
console.log('\nAlways look through the files yourself before publishing them.');
