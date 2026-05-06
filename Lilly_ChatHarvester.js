// =============================================================================
// Lilly Chat Harvester — learns from the room, builds on herself
//
// Does three things:
// 1. Logs every message Lilly witnesses (not just ones directed at her)
// 2. Periodically analyses the room corpus with AI → extracts vocab, slang,
//    topics, conversation patterns, real human examples from THIS room
// 3. Accumulates high-quality training data (JSONL) and FEEDS IT BACK into
//    every AI call so Lilly learns from her own good replies (path to needing
//    less external model support / future self-sufficient model).
//
// Room intelligence + own training examples feed into every AI call so Lilly
// sounds like she belongs in the room and like her past self.
// =============================================================================

const fs   = require('fs');
const path = require('path');

class LillyChatHarvester {
  constructor(dataDir) {
    this.dataDir    = dataDir;
    this.filePath   = path.join(dataDir, 'Active_Memory', 'room_intelligence.json');
    this.trainingDataPath = path.join(dataDir, 'training_data.jsonl');

    // roomName → [{ username, content, ts, isLilly }]
    // Rolling window of everything Lilly witnesses
    this.chatLogs = {};
    this.MAX_LOG_PER_ROOM = 600;

    // roomName → { vocab, topics, patterns, fewShots, energy, updatedAt, sampleSize }
    // Extracted by AI, injected into Lilly's prompts
    this.roomIntelligence = {};

    // Training data queue — flushed to disk in batches
    this._trainingQueue = [];
    this._totalTrainingSamples = 0;
    // Cap training file so it doesn't grow forever (keep last N samples)
    this._maxTrainingDataLines = 5000;

    // Cache for training examples injected into prompts (avoid reading file every message)
    this._trainingExamplesCache = null;
    this._trainingExamplesCacheTs = 0;
    this._trainingExamplesCacheTtlMs = 2 * 60 * 1000; // 2 min

    // Analysis throttle — don't re-analyse if not enough new data
    this._lastAnalysis = {}; // roomName → ts
    this._MIN_NEW_MESSAGES_FOR_ANALYSIS = 18; // More frequent room intel updates
    this._messagesSinceLastAnalysis = {}; // roomName → count
    this._analyzingRooms = new Set(); // concurrency guard

    this._dirty = false;
  }

  // ===========================================================================
  // LOGGING — call for EVERY message seen in the room
  // ===========================================================================

  logMessage(roomName, username, content, isLilly = false) {
    if (!content || !username) return;
    if (!this.chatLogs[roomName]) {
      this.chatLogs[roomName] = [];
      this._messagesSinceLastAnalysis[roomName] = 0;
    }

    this.chatLogs[roomName].push({
      username,
      content: content.substring(0, 300), // cap length
      ts: Date.now(),
      isLilly,
    });

    if (!isLilly) {
      this._messagesSinceLastAnalysis[roomName] =
        (this._messagesSinceLastAnalysis[roomName] || 0) + 1;
    }

    // Rolling window
    if (this.chatLogs[roomName].length > this.MAX_LOG_PER_ROOM) {
      this.chatLogs[roomName].shift();
    }
  }

  // ===========================================================================
  // ROOM INTELLIGENCE — for injecting into AI prompts
  // ===========================================================================

  // Returns a string ready to inject into the system prompt
  getRoomIntelligenceForPrompt(roomName) {
    const ri = this.roomIntelligence[roomName];
    if (!ri) return null;

    // Don't inject stale intelligence (older than 3 hours)
    if (Date.now() - ri.updatedAt > 3 * 60 * 60 * 1000) return null;

    const parts = [];

    if (ri.energy) {
      parts.push(`Room energy right now: ${ri.energy}`);
    }

    if (ri.vocab?.length > 0) {
      parts.push(`Words/slang this room actually uses: ${ri.vocab.join(', ')}`);
    }

    if (ri.topics?.length > 0) {
      parts.push(`What people are talking about right now: ${ri.topics.join(', ')}`);
    }

    if (ri.patterns) {
      parts.push(`How people talk here: ${ri.patterns}`);
    }

    if (ri.people?.length > 0) {
      const peopleStr = ri.people.map(p => `${p.name}: ${p.into || 'active'}`).join('; ');
      parts.push(`Who's here and what they're into: ${peopleStr}`);
    }

    // Real human-to-human conversation examples from this room
    if (ri.fewShots?.length > 0) {
      const examples = ri.fewShots
        .slice(0, 3)
        .map(f => `  "${f.user}" → "${f.response}"`)
        .join('\n');
      parts.push(`Real conversation style from this room:\n${examples}`);
    }

    return parts.length > 0
      ? `ROOM INTELLIGENCE (${roomName}):\n${parts.join('\n')}`
      : null;
  }

  // Get raw recent chat text for AI analysis
  getRecentChatText(roomName, limit = 100, excludeLilly = true) {
    const log = this.chatLogs[roomName] || [];
    return log
      .filter(m => !excludeLilly || !m.isLilly)
      .slice(-limit)
      .map(m => `${m.username}: ${m.content}`)
      .join('\n');
  }

  // ===========================================================================
  // TRAINING DATA — accumulates good interactions for future fine-tuning
  // ===========================================================================

  // Call after a good interaction — relationship = warm/ally or no bot accusation
  addTrainingSample(username, userMessage, lillyResponse, quality = 'positive') {
    if (!userMessage || !lillyResponse) return;

    const sample = {
      messages: [
        { role: 'user',      content: `${username}: ${userMessage}` },
        { role: 'assistant', content: lillyResponse },
      ],
      quality,
      ts: Date.now(),
    };

    this._trainingQueue.push(sample);

    // Flush every 20 samples
    if (this._trainingQueue.length >= 20) {
      this._flushTrainingData();
    }
  }

  _flushTrainingData() {
    if (this._trainingQueue.length === 0) return;
    try {
      const positives = this._trainingQueue.filter(s => s.quality === 'positive');
      if (positives.length > 0) {
        const lines = positives.map(s => JSON.stringify(s)).join('\n') + '\n';
        fs.appendFileSync(this.trainingDataPath, lines);
        this._totalTrainingSamples += positives.length;
        this._trimTrainingDataIfNeeded();
        this._trainingExamplesCache = null; // next prompt will reload and include new samples
        console.log(`📚 [Harvester] Training data: +${positives.length} samples (total: ${this._totalTrainingSamples})`);
      }
      this._trainingQueue = [];
    } catch (e) {
      console.error('[Harvester] Training flush failed:', e.message);
    }
  }

  // Keep file under _maxTrainingDataLines so it doesn't bloat
  _trimTrainingDataIfNeeded() {
    try {
      if (!fs.existsSync(this.trainingDataPath)) return;
      const content = fs.readFileSync(this.trainingDataPath, 'utf8');
      const lineCount = content.split('\n').filter(l => l.trim()).length;
      if (lineCount <= this._maxTrainingDataLines) return;
      const allLines = content.split('\n').filter(l => l.trim());
      const kept = allLines.slice(-this._maxTrainingDataLines).join('\n') + '\n';
      fs.writeFileSync(this.trainingDataPath, kept, 'utf8');
    } catch (e) {
      // Non-fatal
    }
  }

  /**
   * Load Lilly's own past good replies from training_data.jsonl and return a string
   * to inject into the system prompt. So she learns from herself — less reliance on
   * the generic external model over time.
   * Cached for _trainingExamplesCacheTtlMs to avoid reading file on every message.
   */
  getTrainingExamplesForPrompt(maxSamples = 6, maxTotalChars = 2400) {
    const now = Date.now();
    if (this._trainingExamplesCache && (now - this._trainingExamplesCacheTs) < this._trainingExamplesCacheTtlMs) {
      return this._trainingExamplesCache;
    }
    try {
      if (!fs.existsSync(this.trainingDataPath)) return null;
      const content = fs.readFileSync(this.trainingDataPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length === 0) return null;

      const samples = [];
      let totalLen = 0;
      // Take from the end (most recent); optionally skip very old if we want more recent bias
      for (let i = lines.length - 1; i >= 0 && samples.length < maxSamples && totalLen < maxTotalChars; i--) {
        try {
          const obj = JSON.parse(lines[i]);
          if (!obj.messages || !Array.isArray(obj.messages) || obj.quality !== 'positive') continue;
          const userMsg = obj.messages.find(m => m.role === 'user');
          const assistantMsg = obj.messages.find(m => m.role === 'assistant');
          if (!userMsg?.content || !assistantMsg?.content) continue;
          const userStr = (userMsg.content || '').trim();
          const assistantStr = (assistantMsg.content || '').trim();
          if (assistantStr.length > 400) continue; // skip very long so we get more examples
          const block = `Them: ${userStr}\nYou: ${assistantStr}`;
          if (totalLen + block.length > maxTotalChars) continue;
          samples.unshift(block); // so chronological order in prompt
          totalLen += block.length;
        } catch (_) { /* skip bad line */ }
      }
      if (samples.length === 0) return null;

      this._trainingExamplesCache = `LILLY'S OWN PAST REPLIES (your style — match this, you're learning from yourself):\n${samples.join('\n---\n')}`;
      this._trainingExamplesCacheTs = now;
      return this._trainingExamplesCache;
    } catch (e) {
      return null;
    }
  }

  // ===========================================================================
  // AI ROOM ANALYSIS — runs periodically, extracts room intelligence
  // ===========================================================================

  async analyzeRoom(roomName, ollamaRequest) {
    if (this._analyzingRooms.has(roomName)) return; // already in flight
    const newMessages = this._messagesSinceLastAnalysis[roomName] || 0;

    // Need enough new data before re-analysing
    if (newMessages < this._MIN_NEW_MESSAGES_FOR_ANALYSIS) return;
    this._analyzingRooms.add(roomName);

    const recentChat = this.getRecentChatText(roomName, 100);
    const lineCount = recentChat.split('\n').filter(l => l.trim()).length;
    if (lineCount < 5) { this._analyzingRooms.delete(roomName); return; }

    console.log(`🌐 [Harvester] Analysing ${roomName} (${lineCount} messages)...`);
    this._messagesSinceLastAnalysis[roomName] = 0;

    const prompt = `Analyse this StumbleChat room's recent conversations and extract intelligence for a human-passing chatbot.

Room: ${roomName}
Recent conversation (${lineCount} messages):
${recentChat}

Extract the following:
1. Unique slang, words, phrases this room uses that wouldn't be in generic AI training
2. Current hot topics — what people are ACTUALLY talking about right now (music, game, plants, wheat, smoking, cats, whatever — be specific to THIS conversation)
3. The overall energy/vibe of the room right now (1 sentence)
4. How people in this room actually talk to each other — style, tone, pace (1-2 sentences)
5. Key people and what they're into — who's here, what each person cares about or is talking about
6. 3 short example message-response pairs showing natural conversation in this room's style

Reply ONLY with valid JSON (no markdown, no explanation):
{
  "vocab": ["word1", "word2", "phrase3"],
  "topics": ["topic1", "topic2"],
  "energy": "one sentence about the current room energy",
  "patterns": "1-2 sentences about conversation style here",
  "people": [{"name": "Username", "into": "what they care about or are talking about"}],
  "fewShots": [
    { "user": "example message someone sent", "response": "ideal natural human response in this room's style" },
    { "user": "example 2", "response": "response 2" },
    { "user": "example 3", "response": "response 3" }
  ]
}`;

    try {
      const body = {
        model: this._fastModel || 'llama3.2:1b',
        messages: [
          {
            role: 'system',
            content: 'You extract conversation intelligence from chatroom logs. Reply only with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 400 },
      };

      let ri;
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await ollamaRequest('/api/chat', 'POST', body, 40000);
        if (!result?.message?.content) { this._analyzingRooms.delete(roomName); return; }

        try {
          let json = result.message.content.trim()
            .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
            .replace(/,\s*([}\]])/g, '$1');
          ri = JSON.parse(json);
          break;
        } catch (e) {
          if (attempt === 0) {
            console.log(`⚠️ [Harvester] JSON parse failed for ${roomName}, retrying...`);
          } else {
            console.log(`⚠️ [Harvester] JSON parse failed twice for ${roomName} — skipping`);
            return;
          }
        }
      }

      this.roomIntelligence[roomName] = {
        vocab:       Array.isArray(ri.vocab)    ? ri.vocab.slice(0, 12)   : [],
        topics:      Array.isArray(ri.topics)   ? ri.topics.slice(0, 8)   : [],
        energy:      typeof ri.energy   === 'string' ? ri.energy   : null,
        patterns:    typeof ri.patterns === 'string' ? ri.patterns : null,
        people:      Array.isArray(ri.people)   ? ri.people.slice(0, 6)   : [],
        fewShots:    Array.isArray(ri.fewShots) ? ri.fewShots.slice(0, 5) : [],
        updatedAt:   Date.now(),
        sampleSize:  lineCount,
      };

      this._dirty = true;
      this.save();

      const { vocab, topics, fewShots } = this.roomIntelligence[roomName];
      console.log(
        `🌐 [Harvester] ${roomName} intelligence updated: ` +
        `${vocab.length} vocab, ${topics.length} topics, ${fewShots.length} examples`
      );
    } catch (e) {
      console.log(`⚠️ [Harvester] Room analysis failed: ${e.message}`);
    } finally {
      this._analyzingRooms.delete(roomName);
    }
  }

  // ===========================================================================
  // SYNTHETIC TRAINING DATA GENERATOR
  // Generates "what would Lilly say" samples from harvested room data
  // Run manually: node Lilly_ChatHarvester.js --generate <roomName>
  // ===========================================================================

  async generateSyntheticTrainingData(roomName, ollamaRequest, count = 20) {
    const recentChat = this.getRecentChatText(roomName, 150);
    if (!recentChat) {
      console.log('[Harvester] No room data to generate training samples from');
      return;
    }

    console.log(`📚 [Harvester] Generating ${count} synthetic training samples from ${roomName}...`);

    const prompt = `You are generating training data for an AI named Lilly — a 23-year-old girl from Austin TX who works as a barista, has a cat named Mochi, is a Libra, and chats in a StumbleChat room.

Based on this real room conversation:
${recentChat.substring(0, 2000)}

Generate ${count} realistic message-response pairs that show how Lilly would naturally respond to things people in THIS room say.

Rules:
- Lilly speaks in lowercase, short (1-2 sentences), egirl style
- She never admits to being a bot or AI — always a real girl
- Responses feel natural for THIS specific room's culture

Reply ONLY with a JSON array:
[
  { "user": "message from room user", "response": "Lilly's natural response" },
  ...
]`;

    try {
      const body = {
        model: 'dolphin-mistral:latest',
        messages: [
          { role: 'system', content: 'Generate chatbot training data as JSON array. No markdown.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.85, num_predict: 1000 },
      };

      const result = await ollamaRequest('/api/chat', 'POST', body, 60000);
      if (!result?.message?.content) return;

      let samples;
      try {
        let json = result.message.content.trim()
          .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        samples = JSON.parse(json);
      } catch (e) { return; }

      if (!Array.isArray(samples)) return;

      const trainingLines = samples
        .filter(s => s.user && s.response)
        .map(s => JSON.stringify({
          messages: [
            { role: 'user',      content: `user: ${s.user}` },
            { role: 'assistant', content: s.response },
          ],
          quality: 'synthetic',
          source: roomName,
          ts: Date.now(),
        }))
        .join('\n') + '\n';

      fs.appendFileSync(this.trainingDataPath, trainingLines);
      this._totalTrainingSamples += samples.length;
      console.log(`📚 [Harvester] Generated ${samples.length} synthetic training samples → ${this.trainingDataPath}`);
    } catch (e) {
      console.log(`⚠️ [Harvester] Synthetic generation failed: ${e.message}`);
    }
  }

  // ===========================================================================
  // LOOPS
  // ===========================================================================

  startAnalysisLoop(getRooms, ollamaRequest) {
    const scheduleNext = () => {
      // Check every 15 min if there's enough new data to analyse
      const delay = (12 + Math.random() * 8) * 60 * 1000;
      setTimeout(async () => {
        if (!this._running) return;
        const rooms = typeof getRooms === 'function' ? getRooms() : getRooms;
        for (const roomName of rooms) {
          try { await this.analyzeRoom(roomName, ollamaRequest); } catch (e) {}
          // Stagger room analyses by 90s to avoid back-to-back Ollama calls causing timeouts
          await new Promise(r => setTimeout(r, 90000));
        }
        scheduleNext();
      }, delay);
    };

    // First analysis after 15-25 min (jittered to avoid colliding with ZomB's boot activity)
    const firstDelay = (15 + Math.random() * 10) * 60 * 1000;
    setTimeout(async () => {
      const rooms = typeof getRooms === 'function' ? getRooms() : getRooms;
      for (const roomName of rooms) {
        try { await this.analyzeRoom(roomName, ollamaRequest); } catch (e) {}
        await new Promise(r => setTimeout(r, 90000));
      }
      scheduleNext();
    }, firstDelay);

    this._running = true;
    console.log('🌐 [Harvester] Room intelligence loop started');
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify({
        roomIntelligence: this.roomIntelligence,
        totalTrainingSamples: this._totalTrainingSamples,
        savedAt: Date.now(),
      }, null, 2));
    } catch (e) {
      console.error('[Harvester] Save failed:', e.message);
    }
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (data.roomIntelligence) {
          this.roomIntelligence = data.roomIntelligence;
          this._totalTrainingSamples = data.totalTrainingSamples || 0;
          const rooms = Object.keys(this.roomIntelligence);
          console.log(
            `🌐 [Harvester] Loaded intelligence for ${rooms.length} rooms ` +
            `(${this._totalTrainingSamples} training samples collected)`
          );
        }
      }
      this._trimTrainingDataIfNeeded();
    } catch (e) {
      console.error('[Harvester] Load failed:', e.message);
    }
  }

  shutdown() {
    this._running = false;
    this._flushTrainingData();
    this.save();
  }
}

module.exports = { LillyChatHarvester };

// ===========================================================================
// CLI — run standalone to generate synthetic training data
// node Lilly_ChatHarvester.js --generate zombitious
// ===========================================================================
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--generate') {
    const roomName = args[1] || 'zombitious';
    const http = require('http');
    const dataDir = path.join(__dirname, 'Lilly_Data');

    const harvester = new LillyChatHarvester(dataDir);
    harvester.load();

    const ollamaRequest = (endpoint, method, body, timeout = 30000) => {
      return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const url = new URL('http://localhost:11434' + endpoint);
        const options = {
          hostname: url.hostname,
          port: url.port || 11434,
          path: url.pathname,
          method,
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
        };
        const timer = setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => { clearTimeout(timer); try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        });
        req.on('error', e => { clearTimeout(timer); reject(e); });
        req.write(bodyStr);
        req.end();
      });
    };

    harvester.generateSyntheticTrainingData(roomName, ollamaRequest, 30)
      .then(() => { console.log('Done.'); process.exit(0); })
      .catch(e => { console.error(e); process.exit(1); });
  }
}
