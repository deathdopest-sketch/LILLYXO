#!/usr/bin/env node
// =============================================================================
// fix_encoding.js — Fix garbled emoji sequences in Lilly_Bot.js
//
// The garbled sequences (like "≡ƒÆò") happen when a UTF-8 file gets
// read or edited with the wrong encoding (usually Windows-1252).
//
// Run once:  node fix_encoding.js
// It writes the fixed version to Lilly_Bot.js (backs up original first).
// =============================================================================
'use strict';

const fs   = require('fs');
const path = require('path');

const FILE   = path.join(__dirname, 'Lilly_Bot.js');
const BACKUP = FILE + '.emoji_backup';

// Map of garbled Windows-1252 misread sequences → correct UTF-8 emoji
// To identify a garbled emoji: look at the original source, find the sequence,
// then look up what emoji it should be based on context.
const FIXES = [
  // 4-byte emoji sequences misread as Windows-1252
  // Pattern: 0xF0 0x9F 0xXX 0xYY → garbled as various Latin Extended chars
  [/≡ƒÆò/g,  '💕'],  // pink heart / love
  [/≡ƒÿ¡/g,  '😭'],  // crying face (farewells, sad contexts)
  [/≡ƒÆÇ/g,  '💀'],  // skull (dead / lmaooo contexts)
  [/≡ƒÿì/g,  '😌'],  // relieved face
  [/≡ƒÿê/g,  '😊'],  // smiling face
  [/≡ƒÿ¡/g,  '😭'],  // crying — same as above
  [/≡ƒÑ║/g,  '🎵'],  // music note
  [/≡ƒÖä/g,  '✨'],  // sparkles
  [/≡ƒ½╢/g,  '🐱'],  // cat face (Mochi)
  [/≡ƒÆ¬/g,  '💬'],  // speech bubble
  [/≡ƒÆ╕/g,  '💘'],  // heart with arrow
  [/≡ƒÑÅ/g,  '🎀'],  // ribbon / bow
  [/≡ƒÑü/g,  '🎤'],  // microphone
  [/≡ƒÖè/g,  '⭐'],  // star
  [/≡ƒæÇ/g,  '👀'],  // eyes
  [/≡ƒæï/g,  '👋'],  // wave
  [/≡ƒÿ╕/g,  '🥺'],  // pleading face
  [/≡ƒª┤/g,  '🧟'],  // zombie (ZomB game)
  [/≡ƒÅ╖∩╕Å/g, '📛'], // name badge / nick
  [/≡ƒÅå/g,  '💀'],  // skull alt
  [/≡ƒÅ┤/g,  '💀'],  // skull alt 2
  [/≡ƒÅá/g,  '📡'],  // satellite / connected
  [/≡ƒôª/g,  '📬'],  // batch/mail
  [/≡ƒöù/g,  '🔍'],  // magnifying glass (lookup)
  [/≡ƒöä/g,  '🔄'],  // refresh
  [/≡ƒöç/g,  '🔇'],  // muted
  [/≡ƒöê/g,  '🔈'],  // speaker low
  [/≡ƒöë/g,  '🔉'],  // speaker medium
  // 3-byte emoji / symbol sequences
  [/Γ£¿/g,   '✿'],   // flower
  [/Γ£à/g,   '✅'],  // check mark
  [/Γ¥î/g,   '❌'],  // cross
  [/Γ£ô/g,   '✔'],   // heavy check
  [/ΓÜö∩╕Å/g, '⚔️'], // crossed swords (duels)
  [/ΓÅ¡∩╕Å/g, '⏰'], // alarm clock (stale)
  [/ΓÅ│/g,   '⏳'],  // hourglass (cooldown)
  [/ΓÇö/g,   '—'],   // em dash (these are just display artifacts, not emoji)
  [/ΓåÆ/g,   '→'],   // right arrow
  [/Γ¼å∩╕Å/g,'🇦🇺'], // Australia flag
  [/Γ¼ç∩╕Å/g,'🇺🇸'], // US flag
];

if (!fs.existsSync(FILE)) {
  console.error('Lilly_Bot.js not found:', FILE);
  process.exit(1);
}

// Backup original
fs.copyFileSync(FILE, BACKUP);
console.log('Backup written to:', BACKUP);

let content = fs.readFileSync(FILE, 'utf8');
let totalFixed = 0;

for (const [pattern, replacement] of FIXES) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content !== before) {
    const count = (before.match(pattern) || []).length;
    totalFixed += count;
    console.log(`  Fixed ${count}x  ${String(pattern)}  →  ${replacement}`);
  }
}

fs.writeFileSync(FILE, content, 'utf8');
console.log(`\nDone. ${totalFixed} replacements made. File saved.`);
console.log('If something looks wrong: cp Lilly_Bot.js.emoji_backup Lilly_Bot.js');
