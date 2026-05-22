#!/usr/bin/env node
/**
 * Static health checks for an Agent Skill directory.
 * Usage: node scripts/audit-skill.mjs <skill-dir>
 * Output: JSON on stdout; diagnostics on stderr.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const skillDir = resolve(process.argv[2] || '');
if (!skillDir || !existsSync(skillDir)) {
  console.error('Usage: node scripts/audit-skill.mjs <skill-directory>');
  process.exit(2);
}

const skillMdPath = join(skillDir, 'SKILL.md');
const folderName = basename(skillDir);

/** @type {{ id: string, severity: 'error'|'warn'|'info', message: string, evidence?: string }[]} */
const findings = [];

function add(id, severity, message, evidence) {
  findings.push({ id, severity, message, ...(evidence ? { evidence } : {}) });
}

function countLines(text) {
  return text.split(/\r?\n/).length;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { raw: null, fields: {}, bodyStart: 0 };
  const raw = match[1];
  /** @type {Record<string, string>} */
  const fields = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    let value = m[2].trim();
    const isBlock =
      value === '' || value === '>' || value === '|' || value === '>-' || value === '|+';
    if (isBlock) {
      const block = [];
      i++;
      while (i < lines.length) {
        const line = lines[i];
        if (/^[a-zA-Z0-9_-]+:\s*/.test(line) && !/^\s/.test(line)) break;
        if (line.trim() === '' && block.length > 0 && i + 1 < lines.length) {
          const next = lines[i + 1];
          if (/^[a-zA-Z0-9_-]+:\s*/.test(next) && !/^\s/.test(next)) break;
        }
        block.push(line.replace(/^\s{2}/, '').trim());
        i++;
      }
      value = block.filter(Boolean).join(' ');
      fields[key] = value;
      continue;
    }
    if (value.startsWith('>')) {
      const block = [];
      i++;
      while (i < lines.length) {
        const line = lines[i];
        if (/^[a-zA-Z0-9_-]+:\s*/.test(line) && !/^\s/.test(line)) break;
        block.push(line.replace(/^\s{2}/, '').trim());
        i++;
      }
      value = block.filter(Boolean).join(' ');
    }
    fields[key] = value;
    i++;
  }
  return { raw, fields, bodyStart: match[0].length };
}

function listFiles(dir, prefix = '') {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

// --- SKILL.md presence ---
if (!existsSync(skillMdPath)) {
  add('structure.missing-skill-md', 'error', 'SKILL.md is missing', skillMdPath);
  console.log(JSON.stringify({ skillDir, folderName, findings, metrics: {} }, null, 2));
  process.exit(1);
}

const skillContent = readFileSync(skillMdPath, 'utf8');
const { fields, bodyStart } = parseFrontmatter(skillContent);
const body = bodyStart ? skillContent.slice(bodyStart).trim() : skillContent;

// --- Frontmatter ---
if (!fields.name) {
  add('meta.missing-name', 'error', 'Frontmatter field `name` is required');
} else {
  if (fields.name !== folderName) {
    add(
      'meta.name-folder-mismatch',
      'error',
      '`name` must match the skill folder name',
      `name=${fields.name}, folder=${folderName}`
    );
  }
  if (!/^[a-z0-9-]+$/.test(fields.name)) {
    add('meta.name-format', 'error', '`name` must be lowercase letters, numbers, hyphens only');
  }
  if (fields.name.length > 64) {
    add('meta.name-length', 'error', '`name` exceeds 64 characters');
  }
}

if (!fields.description) {
  add('meta.missing-description', 'error', 'Frontmatter field `description` is required');
} else {
  const desc = fields.description.replace(/^>\s*/gm, '').replace(/\s+/g, ' ').trim();
  if (desc.length === 0) add('meta.empty-description', 'error', '`description` is empty');
  if (desc.length > 1024) {
    add(
      'meta.description-length',
      'error',
      '`description` exceeds 1024 characters',
      `length=${desc.length}`
    );
  }
  const hasWhen =
    /\buse when\b/i.test(desc) || /\bwhen\b/i.test(desc) || /使用時|適用|觸發/i.test(desc);
  if (!hasWhen) {
    add(
      'meta.description-trigger',
      'warn',
      'Description may lack explicit WHEN/trigger phrasing (Use when…)'
    );
  }
  const firstPerson = /\b(I can|You can|I'll|we can)\b/i.test(desc);
  if (firstPerson) {
    add('meta.description-person', 'warn', 'Prefer third-person description (not I/You)');
  }
}

const lineCount = countLines(skillContent);
if (lineCount > 500) {
  add(
    'body.skill-md-length',
    'warn',
    'SKILL.md exceeds 500 lines; move detail to references/',
    `lines=${lineCount}`
  );
}

const bodyLines = countLines(body);
if (bodyLines < 5) {
  add('body.too-short', 'warn', 'SKILL.md body is very short; may lack actionable instructions');
}

// --- Progressive disclosure ---
const refsDir = join(skillDir, 'references');
const assetsDir = join(skillDir, 'assets');
const scriptsDir = join(skillDir, 'scripts');
const hasRefs = existsSync(refsDir);
const hasAssets = existsSync(assetsDir);
const hasScripts = existsSync(scriptsDir);

if (lineCount > 200 && !hasRefs && !hasAssets) {
  add(
    'structure.progressive-disclosure',
    'warn',
    'Large SKILL.md without references/ or assets/ for progressive disclosure'
  );
}

const bodyLinksRefs =
  /references\/|assets\/|see \[.*\]\(references\//i.test(body) ||
  /讀取.*references|見.*references/i.test(body);
if ((hasRefs || hasAssets) && !bodyLinksRefs) {
  add(
    'structure.orphan-support-files',
    'info',
    'Support directories exist but SKILL.md may not tell the agent when to load them'
  );
}

// --- Scripts ---
if (hasScripts) {
  const scriptFiles = listFiles(scriptsDir);
  const listsScripts =
    /##\s*(Available scripts|Scripts|腳本|可用腳本)/i.test(body) ||
    scriptFiles.some(f => body.includes(f) || body.includes(`scripts/${f}`));
  if (!listsScripts) {
    add(
      'scripts.not-documented',
      'warn',
      'scripts/ exists but SKILL.md may not list or instruct how to run bundled scripts'
    );
  }
}

// --- Evals (optional quality signal) ---
const evalsPath = join(skillDir, 'evals', 'evals.json');
if (!existsSync(evalsPath)) {
  add('quality.no-evals', 'info', 'No evals/evals.json; consider eval-driven iteration');
}

// --- Checklist / workflow signals ---
const hasChecklist = /- \[[ x]\]/i.test(body) || /##\s*Checklist|工作流程|workflow/i.test(body);
if (bodyLines > 80 && !hasChecklist) {
  add(
    'body.no-checklist',
    'info',
    'Multi-step skill without explicit checklist; consider workflow section'
  );
}

const hasGotchas = /##\s*Gotchas|陷阱|注意/i.test(body);
if (bodyLines > 100 && !hasGotchas) {
  add(
    'body.no-gotchas',
    'info',
    'No Gotchas section; project-specific corrections often belong here'
  );
}

// --- Metrics ---
const allFiles = listFiles(skillDir);
const metrics = {
  skillMdLines: lineCount,
  bodyLines,
  descriptionChars: fields.description
    ? fields.description.replace(/^>\s*/gm, '').replace(/\s+/g, ' ').trim().length
    : 0,
  fileCount: allFiles.length,
  hasReferences: hasRefs,
  hasAssets: hasAssets,
  hasScripts: hasScripts,
  hasEvals: existsSync(evalsPath),
  supportFiles: allFiles.filter(
    f => f !== 'SKILL.md' && !f.startsWith('evals/') && !f.startsWith('scripts/')
  ),
};

const errors = findings.filter(f => f.severity === 'error').length;
const warns = findings.filter(f => f.severity === 'warn').length;

console.log(
  JSON.stringify(
    {
      skillDir,
      folderName,
      name: fields.name ?? null,
      metrics,
      summary: {
        errors,
        warnings: warns,
        info: findings.filter(f => f.severity === 'info').length,
      },
      findings,
    },
    null,
    2
  )
);

process.exit(errors > 0 ? 1 : 0);
