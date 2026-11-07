#!/usr/bin/env node
// Deterministically splits an exported tab's markdown into stops along its
// own "## " headings, preserving contentMd VERBATIM (no LLM retyping).
// Short explanatory sections are merged toward a 10-20 min read; activity
// sections (worked examples, self-check, interview Q&A, applied-to-you)
// always get their own stop; resource-link sections are folded into the
// end of the preceding stop rather than becoming a stop of their own.
// quiz/artifactPrompt are left empty for a narrow, targeted fill-in pass.
//
// Usage: node chunk-tab.mjs <input.md> <output.json> <slug> <title> <order>

import { readFileSync, writeFileSync } from "fs";

const [, , inPath, outPath, slug, title, orderStr] = process.argv;
if (!inPath || !outPath || !slug || !title || orderStr === undefined) {
  console.error(
    "Usage: node chunk-tab.mjs <input.md> <output.json> <slug> <title> <order>"
  );
  process.exit(1);
}
const order = Number(orderStr);

const raw = readFileSync(inPath, "utf-8");
const lines = raw.split("\n");

const sections = [];
let current = null;

for (const line of lines) {
  const h2 = line.match(/^##\s+(.*)$/);
  if (h2) {
    if (current) sections.push(current);
    current = { heading: h2[1].trim(), body: [] };
    continue;
  }
  if (current) current.body.push(line);
}
if (current) sections.push(current);

if (sections.length === 0) {
  console.error(`No "## " headings found in ${inPath} — nothing to chunk.`);
  process.exit(1);
}

const ALWAYS_OWN_STOP = /self-check|interview question|worked example|applied to/i;
const APPEND_TO_PREVIOUS = /free video|free course|resources|further reading|reading list/i;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function estMinutes(text) {
  const minutes = Math.round(wordCount(text) / 200);
  return Math.max(5, Math.min(20, minutes || 5));
}
function sectionMd(s) {
  return `## ${s.heading}\n${s.body.join("\n")}`.trim();
}

const MERGE_TARGET_WORDS = 1800;

const stops = [];
let buffer = [];
let bufferWords = 0;

function flush() {
  if (buffer.length === 0) return;
  const contentMd = buffer.map(sectionMd).join("\n\n");
  stops.push({
    order: stops.length + 1,
    title: buffer[0].heading,
    estMinutes: estMinutes(contentMd),
    contentMd,
    quiz: [],
    artifactPrompt: "",
  });
  buffer = [];
  bufferWords = 0;
}

for (const s of sections) {
  const words = wordCount(sectionMd(s));

  if (APPEND_TO_PREVIOUS.test(s.heading)) {
    if (buffer.length > 0) {
      buffer.push(s); // folded into the stop about to be flushed
    } else if (stops.length > 0) {
      stops[stops.length - 1].contentMd += `\n\n${sectionMd(s)}`;
    } else {
      buffer.push(s);
    }
    continue;
  }

  if (ALWAYS_OWN_STOP.test(s.heading)) {
    flush();
    stops.push({
      order: stops.length + 1,
      title: s.heading,
      estMinutes: estMinutes(sectionMd(s)),
      contentMd: sectionMd(s),
      quiz: [],
      artifactPrompt: "",
    });
    continue;
  }

  buffer.push(s);
  bufferWords += words;
  if (bufferWords >= MERGE_TARGET_WORDS) flush();
}
flush();

// Re-number in final order (flush() numbers as it goes, but the
// APPEND_TO_PREVIOUS branch that hits an empty buffer+no stops edge case
// could leave gaps — cheap to just renumber at the end).
stops.forEach((s, i) => (s.order = i + 1));

const result = { slug, title, order, stops };
writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

console.log(
  `Chunked ${inPath} -> ${outPath}: ${stops.length} stops (verbatim contentMd, quiz/artifactPrompt empty for fill-in).`
);
for (const s of stops) {
  console.log(`  - [${s.order}] "${s.title}" (~${s.estMinutes} min)`);
}
