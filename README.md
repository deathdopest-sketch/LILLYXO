# Lilly Bot v2.0

A human-infiltrator chat bot for [StumbleChat](https://stumblechat.com). Lilly appears as a real 23-year-old woman — bubbly, sharp underneath, and completely undetectable as a bot. She has persistent memory of every person she talks to, reads room dynamics like an expert sociologist, and generates AI responses via a local Ollama model.

---

## Table of Contents

1. [What Lilly Does](#what-lilly-does)
2. [Architecture Overview](#architecture-overview)
3. [Requirements](#requirements)
4. [Installation](#installation)
5. [Configuration](#configuration)
   - [Credentials (required)](#credentials-required)
   - [Identity Registry (who Lilly trusts)](#identity-registry-who-lilly-trusts)
   - [Rooms](#rooms)
   - [AI / Ollama](#ai--ollama)
   - [Webcam Mode](#webcam-mode)
6. [Running Lilly](#running-lilly)
7. [Debugging](#debugging)
   - [WebSocket Issues](#websocket-issues)
   - [AI / Response Issues](#ai--response-issues)
   - [Memory & Identity Issues](#memory--identity-issues)
   - [Common Errors](#common-errors)
8. [How to Add Features](#how-to-add-features)
9. [File Structure](#file-structure)
10. [Architecture Deep-Dive](#architecture-deep-dive)

---

## What Lilly Does

- Joins one or more StumbleChat rooms using a real browser (Puppeteer + Stealth)
- Intercepts the room's WebSocket via Chrome DevTools Protocol (CDP) — receives and sends all messages at the protocol level
- Maintains persistent user profiles: relationship status, interests, message history, parasocial details
- Generates responses via a local Ollama LLM with full room context injected into every prompt
- Reads group dynamics and emotional subtext using a custom neural network (NNN/VITA) and expert sociologist-level social intelligence baked into the system prompt
- Plays and reacts to music, participates in the ZomB zombie game, defends her crew, and never breaks character

---

## Architecture Overview

```
Lilly_Bot.js          — Main bot (8 000+ lines). Browser, WS, message loop, AI calls.
Lilly_Memory.js       — Persistent user profiles (JSON on disk).
Lilly_ChatHarvester.js — Room intelligence: vocab, topics, energy, training samples.
Lilly_MusicLibrary.js — Genre/track catalogue for music requests.
src/ai/NNNProcessor.js — Newton Neural Network: zero-dependency JS social signal analyser.
src/ai/VITABridge.js   — Bridge to VITA microservice (HTTP + Python subprocess fallback).
config/lilly.js        — Bot config: rooms, identity registry, AI settings.
config/shared.js       — Shared settings: Ollama host, rate limits, browser path.
```

**Message flow:**

```
StumbleChat WS frame
  → CDP (Network.webSocketFrameReceived)
  → _startWsListener() routes by stumble type
  → handleMessage() → _processMessage()
  → NNN scores the message (contextType, botRisk, tone)
  → _processBatch() picks primary message to reply to
  → generateAIResponse() builds prompt with memory + room intel + NNN context
  → Ollama returns text
  → queueMessage() rate-limits and sends back via WS
```

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| Google Chrome | Any recent stable |
| [Ollama](https://ollama.com) | Latest |
| A StumbleChat account | (for Lilly) |

Ollama models (install with `ollama pull <name>`):

| Model | Purpose |
|---|---|
| `dolphin3:8b` | Main chat model (uncensored, default) |
| `llama3.2:1b` | Fast/short replies |
| `llama3.1:8b` | Fallback if main is busy |
| `qwen2.5vl:7b` | Vision (image reactions, optional) |

You can swap any of these for any model you prefer — see [AI / Ollama](#ai--ollama).

---

## Installation

```bash
git clone <this-repo> lilly-bot
cd lilly-bot
npm install
cp .env.example .env
# Edit .env with your credentials — see Configuration below
```

---

## Configuration

### Credentials (required)

Edit `.env` (never commit this file):

```env
LILLY_LOGIN_EMAIL=your_stumblechat_username_or_email
LILLY_LOGIN_PASS=your_stumblechat_password
LILLY_HOME_ROOM=your_home_room_name
```

`LILLY_HOME_ROOM` is the room where Lilly has owner status (typically the same as her account name). In this room she can set topics, OP/mod users, and run home-room management logic.

If you also run ZomB alongside Lilly:

```env
ZOMB_LOGIN_EMAIL=zomb_stumblechat_username
ZOMB_LOGIN_PASS=zomb_stumblechat_password
```

### Identity Registry (who Lilly trusts)

Edit `config/lilly.js` — the `IDENTITY_REGISTRY` object:

```js
const IDENTITY_REGISTRY = {
  YourName: {
    role: 'owner',           // 'owner' | 'admin' | 'user'
    accountName: 'your_account_name',  // permanent StumbleChat account name
    bootstrapNicks: ['yournick', 'altnick'],  // all nicks this person uses
    handles: new Set(),      // optional: pre-seed with numeric handle IDs
  },
  TrustedFriend: {
    role: 'admin',
    accountName: 'their_account_name',
    bootstrapNicks: ['theirnick'],
    handles: new Set(),
  },
};
```

**How to find account names and handles:**
- Open the room in Chrome → DevTools (F12) → Network tab → filter by `WS` → click the WebSocket connection → look at the `userlist` frame. Each user object has `{ handle: 12345, nick: "DisplayNick" }`.
- Their profile URL shows the account name: `stumblechat.com/user/<accountName>`

**Role effects:**
- `owner` — Lilly always responds, follows private message commands, highest trust
- `admin` — Lilly always responds, trusted but not owner-level commands
- `user` — tracked as a known regular, no elevated behaviour

**Adding person aliases** (real names → display nicks, so "hey kenny" maps to "Death"):

```js
const PERSON_ALIASES = {
  'kenny': 'Death',
  'loki': 'Loki',
};
```

**Adding ambiguous aliases** (words that might be a name OR a common word):

```js
const AMBIGUOUS_ALIASES = {
  vapes: /\b(he|she|they|it|you|i)\s+vapes?\b|\bvap(ing|e|ed)\b/i,
};
```

### Rooms

Default rooms are `zombitious` and `meatspace`. Override in `.env`:

```env
LILLY_ROOMS=yourroom,anotherroom
```

Or edit the fallback in `config/lilly.js`:

```js
ROOMS: process.env.LILLY_ROOMS
  ? process.env.LILLY_ROOMS.split(',').map(s => s.trim())
  : ['yourroom'],
```

**Shy mode rooms** — rooms where Lilly acts new and quiet rather than confident regular:

```js
SHY_MODE_ROOMS: ['someroom'],
```

### AI / Ollama

All AI settings live in `config/lilly.js` under `AI_CONFIG`, with env var overrides:

```env
OLLAMA_HOST=http://localhost:11434   # default
OLLAMA_MODEL=dolphin3:8b             # main model
OLLAMA_FAST_MODEL=llama3.2:1b        # short replies
OLLAMA_FALLBACK_MODEL=llama3.1:8b    # backup
OLLAMA_VISION_MODEL=qwen2.5vl:7b     # image reactions
```

**Tuning response behaviour** (in `config/lilly.js`):

```js
RESPONSE_CHANCE:      0.20,   // baseline probability of responding to any message
QUESTION_CHANCE:      0.60,   // probability for messages containing a question
aiResponseChance:     0.65,   // probability of using AI vs canned response when responding
maxTokens:            130,    // max tokens per AI reply (keep short for naturalness)
temperature:          0.92,   // higher = more varied/creative
conversationMemory:   20,     // messages of history injected into each prompt
```

**Lilly's personality** lives in `Lilly_Bot.js` in the `AI_CONFIG.systemPrompt` string (around line 71). Edit this directly to change who she is, her backstory, communication rules, or social intelligence depth.

### Webcam Mode

Lilly can broadcast a fake webcam feed (looped video files):

```env
WEBCAM_DIR=C:\path\to\your\webcam\videos
```

Set `WEBCAM_MODE` in `config/lilly.js`:
- `'video'` — loops video files from `WEBCAM_DIR`
- `'real'` — passes through a real webcam

---

## Running Lilly

```bash
node Lilly_Bot.js
# or
npm start
```

On first run: a Chrome window will open, Lilly will log in, join the configured rooms, and start chatting.

**Running alongside ZomB:** Both bots use different debug ports (ZomB: 9222, Lilly: 9223) so they can run simultaneously in the same Chrome install.

---

## Debugging

### WebSocket Issues

**Symptom:** Lilly joins the room but never responds to chat.

Lilly uses Chrome DevTools Protocol (CDP) to intercept WebSocket frames at the browser level. The log line to look for on startup:

```
[WS:roomname] StumbleChat WS detected: wss://...
```

If you see `WebSocket reference: not found (will use scan)` instead, the proxy injector didn't capture the WS reference in the page. This is cosmetic — the CDP listener still works. If the CDP listener also fails, you'll see:

```
[WS:roomname] Failed to start WS listener: ...
```

**How the WS listener works:**

1. `evaluateOnNewDocument` injects a `WebSocket` proxy into the page before load, capturing `window._stumblechatWs` for outgoing message sends.
2. `_startWsListener()` attaches a CDP session and listens for:
   - `Network.webSocketCreated` — locks in the StumbleChat WS request ID
   - `Network.webSocketFrameReceived` — routes incoming stumble frames to handlers
   - `Network.webSocketClosed` — triggers auto-reconnect (TCP-level close, no stumble frame needed)
3. A 120-second heartbeat watchdog fires if no frames arrive — triggers `_rejoinRoom()`.
4. Unknown stumble frame types are logged: `[unknown stumble type: X]` — useful for catching protocol changes.

**Fixes to try:**

- Check Chrome is not in headless mode if the site requires interaction: `HEADLESS=false` is the default.
- If the room URL doesn't include 'stumblechat' in the WS URL (rare), add your pattern to `_isStumbleChatWsUrl()` in `Lilly_Bot.js`.
- If Lilly gets kicked by anti-bot detection: the `_dismissAttentionModal()` function handles this. Check the console for `Anti-bot modal detected`.
- For persistent WS silence: look at `lilly_ws_<roomname>.jsonl` in the project root — every frame is logged there.

### AI / Response Issues

**Symptom:** Lilly is using canned responses instead of AI.

- Check Ollama is running: `ollama list` — verify your configured model exists.
- Check `[AI]` log lines on startup for `AI available` vs `AI unavailable`.
- If the model is cold (first request takes minutes): `coldStartTimeoutMs` is set to 5 minutes in `config/shared.js`.
- Response quality validation may be rejecting AI output — look for `[AI] Response failed validation, retrying...` or `[AI] Falling back to canned response`.

**Symptom:** Lilly says robotic things / breaks character.

- Check the system prompt in `Lilly_Bot.js` around line 71. The `ABSOLUTE BANS` section lists phrases that indicate failure.
- The `_validateResponseQuality()` function filters clearly bad outputs. If it's too aggressive, soften it.
- Try a different model. `dolphin3:8b` is uncensored and works well. Heavily safety-tuned models (like some llama variants) resist staying in persona.

**Symptom:** Lilly repeats herself.

- `_checkResponseSimilarity()` uses Levenshtein distance to catch near-duplicate responses. If it's triggering too aggressively, raise the similarity threshold.
- `_trackBotResponse()` and `_processedMessageHashes` prevent exact duplicates.

### Memory & Identity Issues

**Symptom:** Lilly doesn't recognise the owner.

- Check `config/lilly.js` — the owner's `bootstrapNicks` array must include the exact display nick they're using (case-insensitive).
- Add their StumbleChat account name to `accountName` — Lilly does a DOM lookup on join to cross-reference profile URLs.
- If their handle is known, add it: `handles: new Set(['123456'])`.
- Watch the log for `[Identity]` lines — they show nick → identity resolution in real time.

**Symptom:** Lilly treats the same person as two different users when they change nicks.

- This is resolved via handles (numeric user IDs), account name lookups, and `bootstrapNicks`. Make sure you have at least one of these set for that person.
- The `_handleMap` is the canonical nick-by-handle map. Check it via the owner PM command `.debug handles` if implemented.

**Memory files** live in `Lilly_Data/Active_Memory/`:
- `lilly_users.json` — user profiles (relationship, message count, topics, notes)
- `lilly_handles.json` — handle-to-nick map (persisted across restarts)
- `room_intelligence.json` — per-room vocab and vibe data

You can edit these JSON files directly to correct bad data. Back them up first.

### Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Missing credentials` at startup | `.env` not set up | Copy `.env.example` to `.env`, fill in credentials |
| `Protocol error (Page.navigate)` | Page crashed or tab closed | Lilly will attempt a rejoin automatically |
| `Target closed` | Chrome tab was closed externally | Restart the bot |
| `Failed to click #interact` | Room page structure changed | Room join still proceeds; not critical |
| `No frames for Xs — triggering reconnect` | WS went silent (network blip) | Normal, watchdog handles it automatically |
| Ollama `ECONNREFUSED` | Ollama not running | Run `ollama serve` first |

---

## How to Add Features

### Adding a new WS message type

In `_startWsListener()` in `Lilly_Bot.js`, add a handler inside the `webSocketFrameReceived` callback. The frame's `msg.stumble` tells you the type:

```js
if (type === 'yourNewType' && msg.someField) {
  // handle it
  console.log(`[WS:${roomName}] [yourNewType]`, msg.someField);
}
```

Add `'yourNewType'` to the `_knownTypes` set at the bottom of the handler so it stops appearing as unknown.

### Adding a new owner PM command

In `handleOwnerPM()`, add a new branch:

```js
if (content.startsWith('.yourcommand')) {
  const arg = content.slice('.yourcommand'.length).trim();
  // do something
  await this.queueMessage(roomName, `done: ${arg}`, { force: true });
  return;
}
```

### Adding a new personality response pool

In the `PERSONALITY` object near the top of `Lilly_Bot.js`:

```js
const PERSONALITY = {
  // ...
  yourNewPool: [
    'response one',
    'response two',
  ],
};
```

Use it with `this._pick(PERSONALITY.yourNewPool)` or `this._pickAvoidingRecent(PERSONALITY.yourNewPool, username, roomName)` (the latter avoids repeating the same line to the same person).

### Changing Lilly's persona

Edit the `systemPrompt` string in `AI_CONFIG` (around line 71 of `Lilly_Bot.js`). The prompt is structured in clear sections:

- `YOUR LIFE` — backstory and facts
- `YOUR VIBE` — personality description
- `COMMUNICATION` — style rules
- `SOCIAL INTELLIGENCE` — hidden sociologist layer
- `ABSOLUTE BANS` — hard-blocked phrases and patterns

Keep responses under 2 sentences — the model will naturally extend if you relax `maxTokens`.

### Adding a new room to monitor

Add the room name to `LILLY_ROOMS` in `.env` or to the fallback array in `config/lilly.js`. If you want it in shy mode (Lilly acts like a newcomer), add it to `SHY_MODE_ROOMS`.

### Adding a known regular to the identity registry

Add an entry to `IDENTITY_REGISTRY` in `config/lilly.js`:

```js
PersonName: {
  role: 'user',
  accountName: 'their_stumblechat_accountname',  // optional
  bootstrapNicks: ['theirnick', 'altnick'],
  handles: new Set(),
},
```

---

## File Structure

```
lilly-bot/
├── Lilly_Bot.js           — Main bot entry point
├── Lilly_Memory.js        — User profile persistence
├── Lilly_ChatHarvester.js — Room intelligence and training data
├── Lilly_MusicLibrary.js  — Music catalogue
├── config/
│   ├── lilly.js           — Bot configuration (identity, rooms, AI)
│   └── shared.js          — Shared settings (Ollama, rate limits, browser)
├── src/
│   └── ai/
│       ├── NNNProcessor.js — Native JS neural network (zero deps)
│       └── VITABridge.js   — VITA microservice bridge
├── .env.example           — Environment variable template
├── .gitignore
├── package.json
└── README.md

# NOT committed (gitignored):
# .env                    — Your real credentials
# Lilly_Data/             — Runtime user memory and logs
# node_modules/
```

---

## Architecture Deep-Dive

### WebSocket Interception

Lilly uses two parallel strategies:

**Strategy 1 — In-page proxy** (`evaluateOnNewDocument`): Wraps `window.WebSocket` in a Proxy before page load. Every WS created by the page is captured in `window._allWebSockets`. The StumbleChat socket is stored as `window._stumblechatWs`. This gives Lilly a reference for *sending* messages.

**Strategy 2 — CDP frame interception** (`_startWsListener`): Attaches a Chrome DevTools Protocol session. Listens to raw WS frames at the network layer. Does NOT depend on page JS — works even if the page code changes or obfuscates the WS. Also catches TCP-level WS closes (`Network.webSocketClosed`) and auto-reconnects.

If the CDP session misses the `webSocketCreated` event (race condition on slow rooms), the frame handler auto-identifies the WS from the first valid stumble JSON frame.

### NNN Social Intelligence

`NNNProcessor.js` runs a 12-dimensional feature extraction on every incoming message:
- Emotional intensity, egirl markers, flirtation, bot-risk, warmth, question complexity, personal pronoun density, and more
- Outputs: `contextType` (lurk/engage/present), `toneInfluence` (warm/sassy/deflective), `botRisk` (0–1), `score`

This routes messages before they reach Ollama:
- `skip` → ignore entirely (pure noise)
- `react` → short reply (40 token budget)
- `engage` → normal reply (130 tokens)
- `present` → emotional depth needed (120 tokens, tone hint injected)

### Memory System

Every user gets a profile in `Lilly_Data/Active_Memory/lilly_users.json`:
```json
{
  "username": "...",
  "relationship": "unknown|neutral|warm|ally|cold|hostile",
  "messageCount": 0,
  "topics": [],
  "notes": [],
  "missionStatus": "untouched|engaged|warming|won_over|gave_up|hostile",
  "botAccusations": 0,
  "lillyNickname": null
}
```

This context is injected into every AI prompt so Lilly "remembers" people across sessions.

### Batch Processing

Rather than replying to every message individually, Lilly collects a 1.8-second burst of chat, then picks ONE primary message to respond to. Priority: bot accusation → directed at Lilly → owner message → nobody (maybe FreeVoice). This mimics how a real person reads several messages and picks the one to reply to.
