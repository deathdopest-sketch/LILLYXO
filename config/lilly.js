// =============================================================================
// config/lilly.js — Lilly Bot configuration
// Loaded by Lilly_Bot.js. Do not require('dotenv') here — bot does it first.
// =============================================================================
'use strict';

const { BROWSER_PATH, OLLAMA, RATE, DEFAULTS } = require('./shared');

// ========================== MAIN CONFIG =====================================

const CONFIG = {
  LOGIN_EMAIL: process.env.LILLY_LOGIN_EMAIL || '',
  LOGIN_PASS:  process.env.LILLY_LOGIN_PASS  || '',
  BOT_NICK:    process.env.LILLY_BOT_NICK    || 'Lilly',

  ROOMS: process.env.LILLY_ROOMS
    ? process.env.LILLY_ROOMS.split(',').map(s => s.trim()).filter(Boolean)
    : ['zombitious', 'meatspace'],

  SHY_MODE_ROOMS: [],

  LILLY_HOME_ROOM:  process.env.LILLY_HOME_ROOM || '',
  LILLY_HOME_TOPIC: '✨ head chick hours only 💕 vibes, music & besties ✨',

  HEADLESS:     DEFAULTS.HEADLESS,
  BROWSER_PATH,
  DEBUG_PORT:   9223,  // Different from ZomB (9222) — both can run simultaneously

  RESPONSE_CHANCE:      0.20,
  QUESTION_CHANCE:      0.60,
  OWNER_ALWAYS_RESPOND: DEFAULTS.OWNER_ALWAYS_RESPOND,
  MONITOR_INTERVAL:     DEFAULTS.MONITOR_INTERVAL,
  MUSIC_ENABLED:        true,
  DEFAULT_VOLUME:       DEFAULTS.DEFAULT_VOLUME,

  WEBCAM_MODE:     'video',  // 'video' | 'real'
  WEBCAM_DIR:      process.env.WEBCAM_DIR || 'C:\\Users\\Death\\Desktop\\DethAIepik\\Lilly xo',
  WEBCAM_VIDEOS:   [],       // populated at startup from WEBCAM_DIR
  WEBCAM_CYCLE_MINUTES:     25,
  WEBCAM_PORT:              9224,
  WEBCAM_MAX_SAFE_BLOB_BYTES: 50 * 1024 * 1024,  // 50 MB

  ZOMB_HORDE_TO_JOIN: '666',

  KNOWN_HANDLES: {},
};

if (!CONFIG.LOGIN_EMAIL || !CONFIG.LOGIN_PASS) {
  console.error('[Lilly] Missing credentials — set LILLY_LOGIN_EMAIL and LILLY_LOGIN_PASS in .env');
  process.exit(1);
}

// ========================== IDENTITY REGISTRY ================================
// WHO LILLY KNOWS AND TRUSTS
//
// Customise this for your own crew. Each key is the canonical identity name
// Lilly uses internally (what shows in logs and memory files).
//
// Fields:
//   role          — 'owner' | 'admin' | 'user'
//                   owner  → always responds, can send PM commands, highest trust
//                   admin  → always responds, trusted but not owner-level
//                   user   → tracked regular, no elevated trust
//   accountName   — StumbleChat permanent account name (lowercase, no spaces).
//                   Found in profile URL: stumblechat.com/user/<accountName>
//                   Used to identify someone even if they change their display nick.
//   bootstrapNicks — Display nicks this person is known to use. Lilly maps these
//                   to the identity on startup and on every nick-change event.
//   handles       — Numeric user IDs (optional). Use new Set(['123456']) to hard-
//                   wire a handle you already know. Leave as new Set() otherwise.
//   unrestricted  — true means Lilly uses no content restrictions when they speak.
//
// HOW TO FIND ACCOUNT NAMES AND HANDLES:
//   • Open the room in Chrome → DevTools → Network → WS → look for the userlist
//     frame. Each user object has { handle: <number>, nick: "<display>" }.
//   • Their profile URL also shows the account name: /user/<accountName>
//
// TIP: add yourself (the operator) as 'owner', trusted friends as 'admin'.
// Everyone else starts as unknown and builds a memory profile automatically.

const IDENTITY_REGISTRY = {
  // ── OWNER ─────────────────────────────────────────────────────────────────
  // Replace with YOUR StumbleChat account details.
  YourName: {
    role: 'owner',
    accountName: process.env.OWNER_ACCOUNT_NAME || 'your_account_name',
    bootstrapNicks: (process.env.OWNER_NICKS || 'yournick').split(',').map(s => s.trim().toLowerCase()),
    handles: new Set(),
  },

  // ── ADMINS ────────────────────────────────────────────────────────────────
  // Add trusted people here. Duplicate this block as needed.
  // TrustedFriend: {
  //   role: 'admin',
  //   accountName: 'their_account_name',   // optional — leave '' if unknown
  //   bootstrapNicks: ['theirnick', 'altnick'],
  //   handles: new Set(),
  // },

  // ── KNOWN REGULARS ────────────────────────────────────────────────────────
  // People Lilly should recognise across nick changes but not elevate.
  // KnownRegular: {
  //   role: 'user',
  //   bootstrapNicks: ['regularnick'],
  //   handles: new Set(),
  // },
};

// ========================== PERSON ALIASES ==================================
// Real-name or shortname → canonical StumbleChat username (display nick).
//
// Add entries here when a person uses a real name or nickname in chat that
// maps to a display nick Lilly needs to recognise.
// Example: { 'kenny': 'Death', 'loki': 'Loki', 'pete': 'Loki' }

const PERSON_ALIASES = {
  // 'realname': 'DisplayNick',
};

// Words that could mean a person OR a common action/noun — needs context check.
// Add a regex here for any alias that might be ambiguous in conversation.
// Example: { vapes: /\b(he|she|they|it|you|i)\s+vapes?\b|\bvap(ing|e|ed)\b/i }
const AMBIGUOUS_ALIASES = {};

// ========================== AI CONFIG (mechanical) ===========================
// systemPrompt is defined in Lilly_Bot.js — it's personality, not settings.

const AI_CONFIG = {
  enabled:              true,
  host:                 OLLAMA.host,
  model:                OLLAMA.model,
  fastModel:            OLLAMA.fastModel,
  fallbackModel:        OLLAMA.fallbackModel,
  visionModel:          process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl:7b',
  maxTokens:            130,
  temperature:          0.92,
  aiResponseChance:     0.65,
  alwaysAIForOwner:     true,
  alwaysAIForQuestions: true,
  alwaysAIForMentions:  true,
  conversationMemory:   20,
  timeoutMs:            OLLAMA.timeoutMs,
  coldStartTimeoutMs:   OLLAMA.coldStartTimeoutMs,
  keepAlive:            OLLAMA.keepAlive,
};

// ========================== RATE ============================================

const RATE_CONFIG = { ...RATE };

module.exports = {
  CONFIG,
  IDENTITY_REGISTRY,
  PERSON_ALIASES,
  AMBIGUOUS_ALIASES,
  AI_CONFIG,
  RATE_CONFIG,
};
