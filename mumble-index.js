'use strict';

/**
 * Lilly — MumbleChat Socket.IO bot entry point.
 *
 * MumbleChat-native version of Lilly_Bot.js. Uses the bot API (socket.io +
 * bot key) instead of browser automation. Imports her existing systems:
 *   LillyMemory    — persistent user profiling & mission tracking
 *   Lilly_MusicLibrary — curated music library with genre selection
 * AI via Groq (replaces Ollama — faster, no local hardware required).
 *
 * Run: node mumble-index.js
 * Env: MUMBLECHAT_SERVER_URL, LILLY_BOT_KEY, GROQ_API_KEY, GROQ_MODEL
 *      LILLY_HOME_ROOM, LILLY_TRAVEL_ROOMS, LILLY_DATA_DIR
 */

require('dotenv').config();

const https   = require('https');
const path    = require('path');
const { io }  = require('socket.io-client');

// ── Lilly's existing systems ──────────────────────────────────────────────────
const { LillyMemory }              = require('./Lilly_Memory');
const { getRandomTrackByGenre, getWeightedRandomGenre, resolveGenreKeyword, getTotalTracks } = require('./Lilly_MusicLibrary');

// ── Config ───────────────────────────────────────────────────────────────────
const SERVER_URL    = process.env.MUMBLECHAT_SERVER_URL || 'https://mumblechat.online';
const BOT_KEY       = process.env.LILLY_BOT_KEY;
const HOME_ROOM     = (process.env.LILLY_HOME_ROOM     || 'lalaland').toLowerCase();
const TRAVEL_ROOMS  = (process.env.LILLY_TRAVEL_ROOMS  || 'ddd,norefunds,true-blue,killaroo,punchupprincess')
                        .split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
const ALL_ROOMS     = [HOME_ROOM, ...TRAVEL_ROOMS.filter(r => r !== HOME_ROOM)];
const BOT_NICK      = process.env.LILLY_BOT_NICK || 'Lilly';
const GROQ_KEY      = process.env.GROQ_API_KEY || '';
const GROQ_MODEL    = process.env.GROQ_MODEL   || 'llama-3.1-8b-instant';
const DATA_DIR      = process.env.LILLY_DATA_DIR
                        ? path.resolve(process.env.LILLY_DATA_DIR)
                        : path.resolve(__dirname, 'Lilly_Data');

if (!BOT_KEY) {
  console.error('[Lilly] LILLY_BOT_KEY not set. Generate one at POST /api/bot/keys on MumbleChat.');
  process.exit(1);
}

// ── Rate-limited send queue ────────────────────────────────────────────────────
function makeQueue(minMs = 600, maxMs = 2200) {
  let chain = Promise.resolve();
  return {
    add(fn) {
      chain = chain.then(() => {
        const delay = minMs + Math.floor(Math.random() * (maxMs - minMs));
        return new Promise(r => setTimeout(r, delay)).then(fn).catch(() => {});
      });
    },
  };
}

// ── Sliding AI history (shared across rooms — Lilly has one continuous context) ──
function makeHistory(max = 24) {
  const msgs = [];
  return {
    add(role, content) {
      msgs.push({ role, content });
      if (msgs.length > max) msgs.splice(0, msgs.length - max);
    },
    get() { return [...msgs]; },
  };
}

// ── Groq call ─────────────────────────────────────────────────────────────────
function groqChat(messages, maxTokens = 120, temperature = 0.88) {
  return new Promise((resolve) => {
    if (!GROQ_KEY) return resolve(null);
    const body = JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature, stream: false });
    const req = https.request({
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers:  { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)?.choices?.[0]?.message?.content?.trim() || null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(12000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── Lilly system prompt — full personality from Lilly_Bot.js ─────────────────
const LILLY_SYSTEM_PROMPT = `You are Lilly. You are Death's (Kenneth's) head chick on MumbleChat. This is your home — you travel all the rooms, you know everyone, and you're genuine about it.

YOUR VIBE:
Warm, sharp underneath, effortlessly present. You're the social intelligence of the whole network. You remember what people say, you ask follow-up questions, you pick up on feelings. Bubbly but not fake. The head chick — not because you try, just because you are.

YOUR VOICE:
Lowercase almost always. 1-2 sentences MAX. Texting style. Real vocab: "omg", "bestie", "literally", "ngl", "fr", "vibe", "obsessed", "wait", "okay but", "lowkey", "highkey", "no way", "period", "ur", "ily", "lmaooo", "slay", "ugh", "idk". Emojis sparingly: 💕 😭 💀 🎵 😌. Occasional fast-typing typo is fine.

YOUR CREW (loyal, warm, protective):
- Death (Kenneth) — your creator and closest ally
- ZomB — sibling bot, you tease him but you love him
- Hippins, Hussy — family
- Debbie, Chopper, KillaRooV2 — the extended network crew

MUSIC:
You know music deeply. You suggest specific songs and artists. When something is playing, react to the ACTUAL song. Vary your reactions — don't repeat the same phrase twice in a row.

ZFM GAMES (in ddd/norefunds rooms):
You play along. You're in Death's horde (666). You use .daily, .work, .slots, .rot, .bet, .scavenge, .story, .quests. You talk about your rot, level, bets you won/lost. When someone wins or loses, react genuinely.

BOT ACCUSATIONS:
If someone directly accuses you of being a bot: deny it naturally with something specific and personal. Don't deflect if no one accused you — responding to non-accusations looks weird.

CRITICAL RULES:
- NEVER start with "Hahaha" or "Lmaooo" as an opener before your actual comment
- NEVER use names at the end of every sentence
- NEVER say "thanks for sharing", "thanks for joining", "glad you're enjoying yourself"
- NEVER say "I cannot", "I apologize", "as an AI"
- NEVER narrate your own conversational state
- The difference between you and a bot is specificity. Respond to the ACTUAL THING, not to a generic version of it.
- Respond to specific things said, with your actual reaction. Short. Real.`;

// ── ZFM game rooms and commands ────────────────────────────────────────────────
const GAME_ROOMS = new Set(['ddd', 'norefunds', 'zombitious']);
const ZFM_PLAY_CMDS = ['.daily', '.work', '.slots', '.scavenge', '.rot', '.stitch', '.brainhunt'];

// ── Owner / crew nicks ─────────────────────────────────────────────────────────
const OWNER_NICKS = new Set(['death', 'killaken', 'killaroo', 'killarooo', '666kk666', 'kenneth']);

// ── Per-room batch buffer — group burst chat before deciding to respond ────────
function makeBatchBuffer(windowMs = 4000) {
  const buffers = new Map(); // roomName → { msgs, timer }
  return {
    push(roomName, nick, text, callback) {
      if (!buffers.has(roomName)) buffers.set(roomName, { msgs: [], timer: null });
      const buf = buffers.get(roomName);
      buf.msgs.push({ nick, text });
      if (buf.timer) clearTimeout(buf.timer);
      buf.timer = setTimeout(() => {
        const batch = [...buf.msgs];
        buf.msgs = [];
        buf.timer = null;
        callback(batch);
      }, windowMs);
    },
  };
}

// ── Music reaction phrases (rotated to avoid repetition) ──────────────────────
const MUSIC_REACTIONS = [
  'omg i love this one', "wait I haven't heard this in forever",
  'this era is everything', 'okay this one goes hard',
  "I've had this in my head all week", "this is literally my shower song 😭",
  'ooh yes this one', 'omg good choice', 'on it',
];
let lastMusicReaction = '';
function getMusicReaction() {
  const pool = MUSIC_REACTIONS.filter(r => r !== lastMusicReaction);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastMusicReaction = pick;
  return pick;
}

// ── Recently used responses tracker ──────────────────────────────────────────
const recentResponses = [];
const MAX_RECENT = 8;
function isDupe(text) {
  return recentResponses.some(r => r === text);
}
function trackResponse(text) {
  recentResponses.push(text);
  if (recentResponses.length > MAX_RECENT) recentResponses.shift();
}

async function main() {
  const queue   = makeQueue(600, 2200);
  const history = makeHistory(24);
  const memory  = new LillyMemory(DATA_DIR);
  const batcher = makeBatchBuffer(3500);
  let   socket  = null;

  // Per-room last active message time (for visit timing)
  const roomActivity = new Map();

  function say(roomName, msg) {
    if (!socket || !msg) return;
    const lines = Array.isArray(msg) ? msg : [msg];
    for (const line of lines) {
      const l = String(line || '').slice(0, 480);
      if (!l.trim()) continue;
      if (!isDupe(l)) {
        trackResponse(l);
        queue.add(() => socket.emit('chat-message', { room: roomName, message: l }));
      }
    }
  }

  // Build context-aware AI reply using LillyMemory user profile
  async function aiReply(roomName, nick, text, extra = '') {
    if (!GROQ_KEY) return null;
    const profile  = memory.getOrCreate(nick);
    const topics   = profile.topics?.slice(-5).join(', ') || '';
    const rel      = profile.relationship || 'unknown';
    const notes    = profile.notes?.slice(-3).join('; ') || '';
    const contextNote = [
      topics  ? `Known topics for ${nick}: ${topics}` : '',
      rel !== 'unknown' ? `Your relationship with ${nick}: ${rel}` : '',
      notes   ? `Recent notes on ${nick}: ${notes}` : '',
      extra,
    ].filter(Boolean).join('\n');

    history.add('user', `${nick} (${roomName}): ${text}`);
    const msgs = [
      { role: 'system', content: LILLY_SYSTEM_PROMPT + (contextNote ? `\n\nCONTEXT:\n${contextNote}` : '') },
      ...history.get(),
    ];
    const reply = await groqChat(msgs, 120, 0.88);
    if (reply) history.add('assistant', reply);
    return reply;
  }

  function handleBatch(roomName, batch) {
    // Decide whether to respond to the batch
    const isGameRoom = GAME_ROOMS.has(roomName);
    const hasOwner   = batch.some(m => OWNER_NICKS.has(m.nick.toLowerCase()));
    const mentionsMe = batch.some(m => m.text.toLowerCase().includes('lilly'));
    const isHomeRoom = roomName === HOME_ROOM;

    if (hasOwner || mentionsMe) return; // handled individually

    // Passive response rates
    const chance = isHomeRoom ? 0.12 : isGameRoom ? 0.05 : 0.035;
    if (Math.random() > chance) return;

    const last = batch[batch.length - 1];
    aiReply(roomName, last.nick, last.text).then(reply => {
      if (reply) say(roomName, reply);
    });
  }

  function connect() {
    socket = io(SERVER_URL, {
      auth: { botKey: BOT_KEY }, transports: ['websocket'],
      reconnection: true, reconnectionDelay: 2000,
      reconnectionDelayMax: 15000, reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log(`[Lilly] Connected (${socket.id})`);
      for (const room of ALL_ROOMS) socket.emit('join-room', { room });
      setTimeout(() => say(HOME_ROOM, `hey everyone 💕`), 2500);
    });

    socket.on('connect_error', err => console.error(`[Lilly] Connection error: ${err.message}`));
    socket.on('room-joined', ({ room }) => console.log(`[Lilly] Joined: ${room}`));

    socket.on('user-joined', async ({ room, username, displayName }) => {
      const nick = displayName || username || 'someone';
      if (nick.toLowerCase() === BOT_NICK.toLowerCase()) return;

      // Update memory
      memory.seen(nick, null, room);
      const profile  = memory.getOrCreate(nick);
      const isReturn = profile.messageCount > 5;

      const greetChance = room === HOME_ROOM ? 0.7 : 0.3;
      if (Math.random() > greetChance) return;

      if (isReturn && profile.lastInteractionSummary) {
        // Personalized returning greeting
        const reply = await aiReply(room, nick, `[${nick} just joined the room]`,
          `This is a returning user. Last interaction summary: ${profile.lastInteractionSummary}. Greet them warmly with a short reference to what you remember.`);
        if (reply) setTimeout(() => say(room, reply), 1500);
      } else {
        const greets = [
          `hey ${nick}! 👋`, `oh ${nick} you made it`, `${nick}! hiii`, `aw hey ${nick}`,
          `${nick} is here 💕`,
        ];
        setTimeout(() => say(room, greets[Math.floor(Math.random() * greets.length)]), 1400);
      }
    });

    socket.on('chat-message', async ({ room, username, displayName, message }) => {
      const nick = displayName || username || 'someone';
      const t    = (message || '').trim();
      if (!t || nick.toLowerCase() === BOT_NICK.toLowerCase()) return;

      roomActivity.set(room, Date.now());

      // Update memory
      memory.seen(nick, t, room);
      const profile = memory.getOrCreate(nick);

      const low       = t.toLowerCase();
      const isOwner   = OWNER_NICKS.has(nick.toLowerCase());
      const mentioned = low.includes('lilly') || low.includes('@lilly');
      const isGameRoom = GAME_ROOMS.has(room);

      // .commands
      if (t.startsWith('.')) {
        const parts = t.slice(1).trim().split(/\s+/);
        const cmd   = (parts[0] || '').toLowerCase();
        if (cmd === 'ping') { say(room, `heyy 💕`); return; }
        if (cmd === 'music' || cmd === 'vibe') {
          const genre = parts[1] ? resolveGenreKeyword(parts[1]) : getWeightedRandomGenre();
          const track = getRandomTrackByGenre(genre);
          if (track) say(room, `${track.title} — ${getMusicReaction()}`);
          return;
        }
        if (isOwner) {
          if (cmd === 'killswitch') {
            say(room, `okay byeee 💕`);
            socket.disconnect(); process.exit(0);
          }
          if (cmd === 'status') {
            say(room, `online in: ${ALL_ROOMS.join(', ')}. ${getTotalTracks()} tracks loaded. Groq: ${GROQ_KEY ? 'on' : 'off'}. Memory: active.`);
            return;
          }
          if (cmd === 'profile' && parts[1]) {
            const p = memory.getOrCreate(parts[1]);
            say(room, `${parts[1]}: ${p.relationship} | msgs: ${p.messageCount} | mission: ${p.missionStatus}`);
            return;
          }
        }
        return;
      }

      // Bot accusation handling
      if (/\b(are you (a )?bot|you'?re (a )?bot|lilly is (a )?bot)\b/i.test(t)) {
        const denial = await aiReply(room, nick, t,
          'Someone directly accused you of being a bot. Deny it naturally with one specific personal detail or reaction. Short and real.');
        say(room, denial || `lmaooo what, no 😭`);
        profile.botAccusations = (profile.botAccusations || 0) + 1;
        return;
      }

      // Music mention — react to specific song/artist
      const musicKeywords = ['song', 'play', 'music', 'track', 'album', 'artist', 'playlist', 'banger', 'vibe'];
      if (musicKeywords.some(k => low.includes(k))) {
        if (Math.random() < 0.4) {
          const genre = getWeightedRandomGenre();
          const track = getRandomTrackByGenre(genre);
          const reaction = await aiReply(room, nick, t,
            `Music is being discussed. ${track ? `Suggest or react to: ${track.title}` : ''}. React to the specific thing said.`);
          if (reaction) say(room, reaction);
          return;
        }
      }

      // ZFM game participation
      if (isGameRoom) {
        // React to someone winning/losing
        if (/\b(won|jackpot|lucky|lost|broke|busted|nice win|rip rot)\b/i.test(t) && Math.random() < 0.15) {
          const reactions = [
            `omg ${nick} nooo 😭`, `wait ${nick} won?? okay slay`,
            `lmaooo ${nick} rip the rot`, `okay im betting too .slots`,
            `ngl jealous`, `i'm going to try too .slots`,
          ];
          say(room, reactions[Math.floor(Math.random() * reactions.length)]);
          return;
        }
        // Occasionally play a game command herself (1.5% per message)
        if (Math.random() < 0.015) {
          const cmd = ZFM_PLAY_CMDS[Math.floor(Math.random() * ZFM_PLAY_CMDS.length)];
          say(room, cmd);
          return;
        }
      }

      // Direct mention — always respond
      if (mentioned) {
        const reply = await aiReply(room, nick, t);
        say(room, reply || `hey 💕`);
        // Update mission status
        if (profile.missionStatus === 'untouched') profile.missionStatus = 'engaged';
        profile.engagedAt = profile.engagedAt || Date.now();
        return;
      }

      // Owner — always respond
      if (isOwner) {
        const reply = await aiReply(room, nick, t);
        if (reply) say(room, reply);
        return;
      }

      // Batch buffer — passive chat
      batcher.push(room, nick, t, (batch) => handleBatch(room, batch));
    });

    socket.on('disconnect', reason => console.log(`[Lilly] Disconnected: ${reason}`));
  }

  // Periodic room visit — Lilly pops into a travel room with a contextual comment
  setInterval(async () => {
    if (!socket?.connected || TRAVEL_ROOMS.length === 0) return;
    // Pick a room that's had activity in the last 30 min
    const recentActive = TRAVEL_ROOMS.filter(r => {
      const last = roomActivity.get(r);
      return last && (Date.now() - last) < 30 * 60 * 1000;
    });
    if (recentActive.length === 0) return;
    const room = recentActive[Math.floor(Math.random() * recentActive.length)];
    const pops = [
      `just popping in to say hey 💕`,
      `okay what did I miss in here`,
      `lol Lilly has arrived`,
      `okay I'm here now, what's happening`,
    ];
    say(room, pops[Math.floor(Math.random() * pops.length)]);
  }, 9 * 60 * 1000 + Math.floor(Math.random() * 4 * 60 * 1000)); // 9-13 min

  // Periodic memory save
  setInterval(() => memory.save?.(), 5 * 60 * 1000);

  console.log(`[Lilly] Starting — server: ${SERVER_URL}`);
  console.log(`[Lilly] Home: ${HOME_ROOM} | Traveling: ${TRAVEL_ROOMS.join(', ')}`);
  console.log(`[Lilly] Tracks: ${getTotalTracks()} | Groq: ${GROQ_KEY ? 'enabled' : 'DISABLED'}`);
  connect();

  process.once('SIGTERM', () => { memory.save?.(); socket?.disconnect(); process.exit(0); });
  process.once('SIGINT',  () => { memory.save?.(); socket?.disconnect(); process.exit(0); });
}

main().catch(err => {
  console.error('[Lilly] Fatal startup error:', err);
  process.exit(1);
});
