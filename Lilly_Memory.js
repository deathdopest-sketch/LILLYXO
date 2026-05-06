// =============================================================================
// Lilly Memory — Persistent mission intelligence & user profiling
// Lilly's brain: who she knows, what she knows about them, her mission status
// =============================================================================

const fs = require('fs');
const path = require('path');

class LillyMemory {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, 'Active_Memory', 'lilly_mission.json');

    // username.toLowerCase() → UserRecord
    this.users = {};

    // Room state tracking
    this.roomState = {};

    // Self-improvement — Lilly's own evolving behavioral lessons
    // Each lesson: { ts, lesson: "string", source: 'reflection'|'forensics' }
    this.selfLessons = [];

    // Bot accusation contexts — what preceded each detection event
    // Used by forensics AI to identify patterns
    this.botMoments = [];

    this._dirty = false;
    this._saveTimer = null;
  }

  // ===========================================================================
  // USER RECORD MANAGEMENT
  // ===========================================================================

  getOrCreate(username) {
    const key = username.toLowerCase();
    if (!this.users[key]) {
      this.users[key] = {
        username,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        lastContent: null,
        messageCount: 0,

        // How Lilly sees this person
        relationship: 'unknown',   // unknown | neutral | warm | ally | cold | hostile
        personality: null,         // AI-filled: "sarcastic but kind underneath, likes music"
        topics: [],                // things they've talked about / shown interest in
        musicTaste: [],            // music they've mentioned or reacted to positively
        notes: [],                 // specific things Lilly has noted about them

        // Mission tracking
        missionStatus: 'untouched', // untouched | engaged | warming | won_over | gave_up | hostile
        wonOverAt: null,
        engagedAt: null,
        interactions: 0,           // number of times Lilly has responded to them

        // How they've treated Lilly
        treatmentHistory: [],      // [{ ts, type: 'friendly'|'curious'|'rude'|'hostile'|'apologetic'|'flirty' }]
        botAccusations: 0,         // how many times they've called her a bot

        // Psychological/sociological profile (trained from interactions)
        psychProfile: null,        // { attachmentStyle, emotionalPattern, notes: [] }

        // Conversation memory
        lastTopics: [],            // last few topics discussed with Lilly
        lastInteractionSummary: null, // brief AI-generated summary of last convo
        lillyNickname: null,       // nickname Lilly invented for this person (generated after 10 interactions)

        // Per-room last message — so "who's here" context doesn't quote lalaland in zombitious
        lastContentByRoom: {},     // roomName -> { content, ts }
      };
    }
    return this.users[key];
  }

  // Called whenever a message is received from this user. roomName optional; when provided, stores content per-room for getRoomContextForAI.
  seen(username, content, roomName = null) {
    const p = this.getOrCreate(username);
    p.messageCount++;
    p.lastSeen = Date.now();
    p.lastContent = content;
    if (roomName && typeof roomName === 'string') {
      if (!p.lastContentByRoom) p.lastContentByRoom = {};
      p.lastContentByRoom[roomName] = { content, ts: Date.now() };
      // Keep lastContentByRoom bounded per user (e.g. last 5 rooms)
      const rooms = Object.keys(p.lastContentByRoom);
      if (rooms.length > 5) {
        const byTs = rooms.map(r => ({ r, ts: p.lastContentByRoom[r].ts })).sort((a, b) => a.ts - b.ts);
        delete p.lastContentByRoom[byTs[0].r];
      }
    }
    if (p.missionStatus === 'untouched') p.missionStatus = 'seen';
    this._dirty = true;
    return p;
  }

  // Called when Lilly actually responds to this user
  recordInteraction(username) {
    const p = this.getOrCreate(username);
    p.interactions++;
    p.engagedAt = p.engagedAt || Date.now();
    if (p.missionStatus === 'untouched' || p.missionStatus === 'seen') {
      p.missionStatus = 'engaged';
    }
    this._dirty = true;
  }

  // Update relationship status
  updateRelationship(username, status) {
    const p = this.getOrCreate(username);
    const old = p.relationship;
    if (old === status) return;

    // Cooldown: don't oscillate between adjacent tiers (warm↔ally) more than once per 10 min
    const adjacentPair = (a, b) => (a === 'warm' && b === 'ally') || (a === 'ally' && b === 'warm');
    const isDowngrade = ['cold', 'hostile', 'neutral'].includes(status);
    if (!isDowngrade && adjacentPair(old, status)) {
      const lastUpdate = p.lastRelationshipUpdate || 0;
      if (Date.now() - lastUpdate < 10 * 60 * 1000) return; // skip oscillation
    }

    p.relationship = status;
    p.lastRelationshipUpdate = Date.now();

    if (status === 'won_over' || status === 'ally') {
      p.wonOverAt = p.wonOverAt || Date.now();
      p.missionStatus = 'won_over';
    } else if (status === 'hostile') {
      p.missionStatus = 'hostile';
    } else if (status === 'warm' && p.missionStatus === 'engaged') {
      p.missionStatus = 'warming';
    }

    this._dirty = true;
    console.log(`[LillyMemory] ${username}: relationship ${old} → ${status}`);
  }

  // Add a note about this user
  addNote(username, note) {
    if (!note || typeof note !== 'string' || note.trim().length < 3) return;
    const p = this.getOrCreate(username);
    p.notes.push({ ts: Date.now(), note: note.trim() });
    if (p.notes.length > 15) p.notes.shift();
    this._dirty = true;
  }

  // Record a topic they've shown interest in
  addTopic(username, topic) {
    if (!topic) return;
    const p = this.getOrCreate(username);
    const t = topic.toLowerCase().trim();
    if (!p.topics.includes(t)) {
      p.topics.push(t);
      if (p.topics.length > 12) p.topics.shift();
      this._dirty = true;
    }
  }

  // Record music they've responded to
  addMusicTaste(username, track) {
    if (!track) return;
    // Reject command-string leaks (ZomB help output, etc.)
    const lowerTrack = track.toLowerCase();
    if (
      lowerTrack.includes('.music') ||
      lowerTrack.includes('.cam') ||
      lowerTrack.includes('.stop') ||
      lowerTrack.includes('| 📹') ||
      lowerTrack.includes('or .music') ||
      /^\s*\./.test(track)
    ) return;
    const p = this.getOrCreate(username);
    if (!p.musicTaste.includes(track)) {
      p.musicTaste.push(track);
      if (p.musicTaste.length > 8) p.musicTaste.shift();
      this._dirty = true;
    }
  }

  updateLastInteraction(username, { summary, topics } = {}) {
    const p = this.getOrCreate(username);
    if (summary && typeof summary === 'string' && summary.length > 3) {
      p.lastInteractionSummary = summary.trim().slice(0, 300);
    }
    if (Array.isArray(topics) && topics.length > 0) {
      const clean = topics.filter(t => t && typeof t === 'string' && t.length < 60).slice(0, 5);
      if (clean.length > 0) {
        p.lastTopics = clean;
        this._dirty = true;
      }
    }
    this._dirty = true;
  }

  setPersonality(username, desc) {
    if (!desc || desc.length < 3) return;
    const p = this.getOrCreate(username);
    p.personality = desc.trim();
    this._dirty = true;
  }

  // Set/update psychological profile (attachment style, emotional patterns, observations)
  updatePsychProfile(username, { attachmentStyle, emotionalPattern, psychNote } = {}) {
    const p = this.getOrCreate(username);
    if (!p.psychProfile) p.psychProfile = { attachmentStyle: null, emotionalPattern: null, notes: [] };
    if (attachmentStyle && attachmentStyle !== 'unknown') p.psychProfile.attachmentStyle = attachmentStyle;
    if (emotionalPattern && emotionalPattern !== 'null') p.psychProfile.emotionalPattern = emotionalPattern;
    if (psychNote && psychNote !== 'null' && psychNote.length > 5) {
      p.psychProfile.notes.push({ ts: Date.now(), note: psychNote.trim() });
      if (p.psychProfile.notes.length > 10) p.psychProfile.notes.shift();
    }
    this._dirty = true;
  }

  // Record how this user treated Lilly in this interaction
  noteTreatment(username, treatment) {
    // Negative treatments (push toward cold/hostile)
    const negativeTypes = ['rude', 'hostile', 'aggressive', 'passive_aggressive', 'dismissive', 'trying_to_expose'];
    // Positive treatments (push toward warm/ally)
    const positiveTypes = ['friendly', 'flirty', 'complimentary', 'sweet', 'funny', 'playful', 'romantic', 'supportive', 'impressed'];
    // Neutral / special
    const neutralTypes = ['curious', 'neutral', 'apologetic', 'testing', 'philosophical', 'oversharing',
                          'bored', 'lonely', 'sad', 'excited', 'needy', 'weird', 'chill',
                          'sexually_forward', 'suspicious', 'sarcastic'];
    const allValid = [...negativeTypes, ...positiveTypes, ...neutralTypes];
    if (!allValid.includes(treatment)) return;

    const p = this.getOrCreate(username);
    p.treatmentHistory.push({ ts: Date.now(), type: treatment });
    if (p.treatmentHistory.length > 20) p.treatmentHistory.shift();

    // Track bot accusations
    if (treatment === 'suspicious' || treatment === 'trying_to_expose') p.botAccusations++;

    // Auto-adjust relationship based on recent pattern
    const recent = p.treatmentHistory.slice(-5).map(t => t.type);
    const hostileCount = recent.filter(t => negativeTypes.includes(t)).length;
    const friendlyCount = recent.filter(t => positiveTypes.includes(t)).length;

    if (hostileCount >= 3) {
      this.updateRelationship(username, 'hostile');
    } else if (hostileCount >= 2 && p.relationship !== 'hostile') {
      this.updateRelationship(username, 'cold');
    } else if (friendlyCount >= 4 && ['warm', 'neutral'].includes(p.relationship)) {
      this.updateRelationship(username, 'ally');
    } else if (friendlyCount >= 3 && p.relationship === 'neutral') {
      this.updateRelationship(username, 'warm');
    } else if (friendlyCount >= 2 && p.relationship === 'unknown') {
      this.updateRelationship(username, 'neutral');
    }

    // Apologetic can soften a cold relationship
    if (treatment === 'apologetic' && p.relationship === 'cold') {
      this.updateRelationship(username, 'neutral');
    }

    this._dirty = true;
  }

  // ===========================================================================
  // CONTEXT RETRIEVAL — for injecting into AI prompts
  // ===========================================================================

  getProfile(username) {
    return this.users[username.toLowerCase()] || null;
  }

  // Returns a comprehensive string for AI system prompt injection
  getContextString(username) {
    const p = this.getProfile(username);
    if (!p || p.messageCount === 0) return null;

    const parts = [];
    const displayName = p.username || username;

    // Core relationship info
    if (p.relationship !== 'unknown') {
      parts.push(`Your relationship with ${displayName}: ${p.relationship}`);
    }

    // Mission status and engagement
    if (p.missionStatus !== 'untouched' && p.missionStatus !== 'seen') {
      parts.push(`Mission status: ${p.missionStatus}`);
      if (p.wonOverAt) {
        const daysAgo = Math.floor((Date.now() - p.wonOverAt) / (1000 * 60 * 60 * 24));
        parts.push(`Won over ${daysAgo === 0 ? 'today' : daysAgo + ' day(s) ago'}`);
      }
    }

    // Interaction history
    parts.push(`You've interacted ${p.interactions} time(s) with ${displayName} (${p.messageCount} total messages)`);

    // Personality - most important
    if (p.personality) {
      parts.push(`Their personality: ${p.personality}`);
    }

    // Topics they care about
    if (p.topics.length > 0) {
      const uniqueTopics = [...new Set(p.topics)].slice(-8);
      parts.push(`They like talking about: ${uniqueTopics.join(', ')}`);
    }

    // Music taste
    if (p.musicTaste.length > 0) {
      const cleanMusic = p.musicTaste.filter(m => m && !m.startsWith('.') && m.length < 100).slice(-5);
      if (cleanMusic.length > 0) {
        parts.push(`Their music taste: ${cleanMusic.join(', ')}`);
      }
    }

    // Recent treatment patterns
    const recentTreatment = p.treatmentHistory.slice(-5).map(t => t.type);
    if (recentTreatment.length > 0) {
      const treatmentCounts = {};
      recentTreatment.forEach(t => treatmentCounts[t] = (treatmentCounts[t] || 0) + 1);
      const dominant = Object.entries(treatmentCounts).sort((a, b) => b[1] - a[1])[0];
      if (dominant) {
        parts.push(`They've been ${dominant[0]} to you recently (${dominant[1]} of last ${recentTreatment.length} interactions)`);
      }
    }

    // Bot accusations - critical
    if (p.botAccusations > 0) {
      parts.push(`⚠️ WARNING: ${displayName} has called you a bot ${p.botAccusations} time(s). Be extra careful - vary your responses, don't repeat phrases, act more human.`);
    }

    // Last interaction summary
    if (p.lastInteractionSummary) {
      parts.push(`Last conversation summary: ${p.lastInteractionSummary}`);
    }

    // Recent conversation topics
    if (p.lastTopics.length > 0) {
      parts.push(`You two recently discussed: ${p.lastTopics.slice(0, 5).join(', ')}`);
    }

    // Psychological profile — attachment style, emotional patterns
    if (p.psychProfile) {
      const pp = p.psychProfile;
      const psychParts = [];
      if (pp.attachmentStyle) psychParts.push(`attachment: ${pp.attachmentStyle}`);
      if (pp.emotionalPattern) psychParts.push(`emotional pattern: ${pp.emotionalPattern}`);
      if (pp.notes && pp.notes.length > 0) {
        const recentPsych = pp.notes.slice(-3).map(n => n.note);
        psychParts.push(`psych observations: ${recentPsych.join('; ')}`);
      }
      if (psychParts.length > 0) {
        parts.push(`[SOCIAL INTELLIGENCE — use silently, don't reference directly] ${psychParts.join(' | ')}`);
      }
    }

    // Recent notes (mood, observations)
    const recentNotes = p.notes.slice(-3).map(n => n.note).filter(n => n && !n.includes('mood:'));
    if (recentNotes.length > 0) {
      parts.push(`Recent observations: ${recentNotes.join('; ')}`);
    }

    // Last message they sent
    if (p.lastContent && p.lastContent.length < 200) {
      const timeAgo = Math.floor((Date.now() - p.lastSeen) / (1000 * 60));
      if (timeAgo < 60) {
        parts.push(`They said ${timeAgo} minute(s) ago: "${p.lastContent}"`);
      }
    }

    return parts.length > 0 ? parts.join('\n') : null;
  }

  // ===========================================================================
  // MISSION INTELLIGENCE — for proactive behavior
  // ===========================================================================

  // Users Lilly hasn't engaged with yet (fresh targets)
  getUntouchedUsers() {
    return Object.values(this.users)
      .filter(p => ['untouched', 'seen'].includes(p.missionStatus))
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 5);
  }

  // Users who are warming up (momentum to maintain)
  getWarmingUsers() {
    return Object.values(this.users)
      .filter(p => {
        if (p.missionStatus === 'won_over') return false;
        return p.relationship === 'warm' || p.missionStatus === 'warming' || p.missionStatus === 'engaged';
      })
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 5);
  }

  // Users won over
  getWonOver() {
    return Object.values(this.users).filter(p => p.missionStatus === 'won_over');
  }

  // Users who are hostile / suspicious
  getHostile() {
    return Object.values(this.users).filter(p => ['hostile', 'cold'].includes(p.relationship));
  }

  // Full mission summary string (for PM to Death)
  getMissionSummary() {
    const all = Object.values(this.users).filter(p => p.messageCount > 0);
    const wonOver = this.getWonOver();
    const hostile = this.getHostile();
    const warming = this.getWarmingUsers();
    const untouched = this.getUntouchedUsers();

    let summary = `👑 MISSION REPORT (${all.length} users tracked)\n`;
    summary += `✅ Won over (${wonOver.length}): ${wonOver.map(p => p.username).join(', ') || 'none yet'}\n`;
    summary += `🔥 Warming up (${warming.length}): ${warming.map(p => `${p.username}(${p.relationship})`).join(', ') || 'none'}\n`;
    summary += `❄️ Cold/Hostile (${hostile.length}): ${hostile.map(p => `${p.username}(${p.relationship})`).join(', ') || 'none'}\n`;
    summary += `🎯 Untouched (${untouched.length}): ${untouched.map(p => p.username).join(', ') || 'none'}`;
    return summary;
  }

  // Get a brief context about recent room activity — who's here, what they said IN THIS ROOM (no cross-room quotes)
  getRoomContextForAI(roomName, handleMap) {
    const cutoff = Date.now() - 10 * 60 * 1000;
    const recentUsers = Object.values(this.users)
      .filter(p => p.lastSeen > cutoff)
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 10);

    if (recentUsers.length === 0) return null;

    return recentUsers.map(p => {
      const parts = [p.username];
      if (p.relationship !== 'unknown') parts.push(`(${p.relationship})`);
      // Use only this room's last message so we don't inject lalaland quotes into zombitious
      const roomLast = p.lastContentByRoom?.[roomName]?.content;
      if (roomLast) parts.push(`— "${roomLast.substring(0, 80)}"`);
      else if (p.lastContent) parts.push('— (recently active)');
      if (p.topics?.length > 0) {
        const sane = p.topics.filter(t => t && typeof t === 'string' && t.length < 50 && !/up to \d+ topics|or empty array|topics they care about/i.test(t));
        if (sane.length > 0) parts.push(`[into: ${sane.slice(-3).join(', ')}]`);
      }
      return parts.join(' ');
    }).join('\n');
  }

  // ===========================================================================
  // SELF-IMPROVEMENT — Lilly's own behavioral adaptation
  // ===========================================================================

  // Add an AI-generated behavioral lesson
  addSelfLesson(lesson, source = 'reflection') {
    if (!lesson || typeof lesson !== 'string' || lesson.trim().length < 5) return;
    this.selfLessons.push({ ts: Date.now(), lesson: lesson.trim(), source });
    // Keep last 10 lessons — older ones get dropped as new ones come in
    if (this.selfLessons.length > 10) this.selfLessons.shift();
    this._dirty = true;
    console.log(`🧠 [Self-lesson] (${source}): ${lesson.trim()}`);
  }

  // Record the context around a bot accusation for forensic analysis
  recordBotMoment(context) {
    if (!context) return;
    this.botMoments.push({ ts: Date.now(), context });
    if (this.botMoments.length > 8) this.botMoments.shift();
    this._dirty = true;
  }

  // Returns formatted self-lessons for injection into AI system prompt
  getSelfLessons() {
    if (this.selfLessons.length === 0) return null;
    const recent = this.selfLessons.slice(-6); // Last 6 lessons
    return recent.map(l => `- ${l.lesson}`).join('\n');
  }

  // Returns recent bot accusation contexts for forensic AI call
  getRecentBotMoments() {
    return this.botMoments.slice(-5);
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  save() {
    try {
      const data = {
        users: this.users,
        selfLessons: this.selfLessons,
        botMoments: this.botMoments,
        savedAt: Date.now(),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      this._dirty = false;
    } catch (e) {
      console.error('[LillyMemory] Save failed:', e.message);
    }
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (data.users) {
          this.users = data.users;
          const count = Object.keys(this.users).length;
          const wonOver = this.getWonOver().length;
          console.log(`📓 [LillyMemory] Loaded ${count} users (${wonOver} won over)`);
        }
        if (Array.isArray(data.selfLessons)) {
          this.selfLessons = data.selfLessons;
          console.log(`📓 [LillyMemory] Loaded ${this.selfLessons.length} self-lessons`);
        }
        if (Array.isArray(data.botMoments)) {
          this.botMoments = data.botMoments;
        }
      }
    } catch (e) {
      console.error('[LillyMemory] Load failed:', e.message);
    }
  }

  startAutoSave(intervalMs = 3 * 60 * 1000) {
    this._saveTimer = setInterval(() => {
      if (this._dirty) this.save();
    }, intervalMs);
  }

  shutdown() {
    if (this._saveTimer) clearInterval(this._saveTimer);
    if (this._dirty) this.save();
  }
}

module.exports = { LillyMemory };
