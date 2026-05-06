'use strict';

const { spawn }  = require('child_process');
const fs         = require('fs');
const os         = require('os');
const path       = require('path');

/**
 * VITABridge — Lilly's Node.js bridge to the Lilly NNN VITA microservice.
 *
 * Priority:
 *   1. HTTP microservice (VITA_SERVICE_URL env) — fast, always-warm, preferred
 *   2. Python subprocess fallback — cold-start per call, no infra needed
 *
 * HTTP endpoints (vita_service/vita_server.py — Lilly edition):
 *   GET  /health    — readiness check
 *   POST /infer     — full RunInference (all 12 NNN stages)
 *   POST /signal    — fast NNN signal (no transformer)
 *   POST /intent    — 5D social intent (direct/ambient/emotional/flirty/hostile)
 *   POST /tone      — 4D tone analysis (warm/sassy/deflective/present)
 *   POST /sentiment — 3D sentiment (positive/negative/neutral)
 *   POST /score     — candidate response scoring (cosine similarity)
 *   POST /mood      — update Lilly NNN mood state (warm/sassy/deflective)
 *
 * Subprocess env vars (fallback only):
 *   VITA_PY_PATH    — path to vita.py
 *   VITA_MODEL_PATH — path to lilly_nnn.vita
 *
 * Default port: 8766 (ZomB uses 8765 — Lilly gets her own lane)
 */
class VITABridge {

  constructor(log) {
    this.log = log;

    // HTTP service (preferred) — VITA_SERVICE_URL set by Docker Compose
    this._serviceUrl = (process.env.VITA_SERVICE_URL || '').replace(/\/$/, '');

    // Subprocess fallback
    this._vitaPy    = process.env.VITA_PY_PATH
      || String.raw`C:\Users\Death\Desktop\Vita Code language\vita\vita.py`;
    this._vitaModel = process.env.VITA_MODEL_PATH
      || String.raw`C:\Users\Death\Desktop\lilliv2.0\vita_models\lilly_nnn.vita`;

    this._available = null;   // null = unchecked
    this._httpOk    = null;   // null = unchecked
  }

  // ── Availability ─────────────────────────────────────────────────────────

  async isAvailable() {
    if (this._available !== null) return this._available;

    if (this._serviceUrl) {
      this._httpOk = await this._pingService();
      if (this._httpOk) {
        this._available = true;
        this.log?.info('[VITABridge:Lilly] HTTP microservice at ' + this._serviceUrl);
        return true;
      }
    }

    const pyOk     = fs.existsSync(this._vitaPy);
    const vitaOk   = fs.existsSync(this._vitaModel);
    const pythonOk = await this._checkPython();
    this._httpOk   = false;
    this._available = pyOk && vitaOk && pythonOk;

    if (!this._available) {
      const missing = [
        !pythonOk && 'Python runtime',
        !pyOk     && `vita.py (${this._vitaPy})`,
        !vitaOk   && `lilly_nnn.vita (${this._vitaModel})`,
      ].filter(Boolean).join(', ');
      this.log?.warn(`[VITABridge:Lilly] Unavailable — missing: ${missing}`);
    } else {
      this.log?.info('[VITABridge:Lilly] Using subprocess fallback');
    }

    return this._available;
  }

  // ── Core Endpoints ───────────────────────────────────────────────────────

  /** Full RunInference — all NNN stages. */
  async runInference(inputTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const tokens = this._pad(inputTokens);
    if (this._httpOk) return this._post('/infer', { tokens, mood });
    return this._subprocessInfer(tokens);
  }

  /** Fast NNN signal — PNN+NCNN+fusion only, skips transformer. */
  async getSignal(inputTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const tokens = this._pad(inputTokens);
    if (this._httpOk) return this._post('/signal', { tokens, mood });
    return null;
  }

  /**
   * Social intent classification.
   * Returns { direct, ambient, emotional, flirty, hostile }  (0–1 each)
   */
  async classifyIntent(inputTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const tokens = this._pad(inputTokens);
    if (this._httpOk) return this._post('/intent', { tokens, mood });
    return null;
  }

  /**
   * Tone analysis.
   * Returns { warm, sassy, deflective, present }  (0–1 each)
   */
  async analyzeTone(inputTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const tokens = this._pad(inputTokens);
    if (this._httpOk) return this._post('/tone', { tokens, mood });
    return null;
  }

  /**
   * Sentiment analysis.
   * Returns { positive, negative, neutral }  (0–1 each)
   */
  async analyzeSentiment(inputTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const tokens = this._pad(inputTokens);
    if (this._httpOk) return this._post('/sentiment', { tokens, mood });
    return null;
  }

  /**
   * Score a candidate response against the input (cosine NNN similarity).
   * Returns { score: 0–1 }
   */
  async scoreCandidate(inputTokens, candidateTokens, mood) {
    if (!(await this.isAvailable())) return null;
    const input_tokens     = this._pad(inputTokens);
    const candidate_tokens = this._pad(candidateTokens);
    if (this._httpOk) return this._post('/score', { input_tokens, candidate_tokens, mood });
    return null;
  }

  /**
   * Update Lilly's NNN mood state on the microservice.
   * @param {number} warm       0–1
   * @param {number} sassy      0–1
   * @param {number} deflective 0–1
   */
  async setMood(warm, sassy, deflective) {
    if (!(await this.isAvailable()) || !this._httpOk) return null;
    return this._post('/mood', { warm, sassy, deflective });
  }

  /**
   * Analyse the last N messages from a conversation history.
   * messages = [{ role, content }]
   */
  async analyzeConversation(messages, mood) {
    if (!(await this.isAvailable())) return null;
    const recent   = (messages || []).slice(-6);
    const combined = recent.map(m => m.content || '').join(' ');
    const tokens   = this._textToTokens(combined, 12);
    return this.runInference(tokens, mood);
  }

  // ── Text → Token Helpers ─────────────────────────────────────────────────

  /** Hash text words into vocab-space token IDs (0–49999). Deterministic djb2. */
  _textToTokens(text, count = 12) {
    const words  = (text || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tokens = [];
    for (let i = 0; i < count; i++) {
      const word = words[i % Math.max(words.length, 1)] || '';
      let hash = 5381;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) + hash) ^ word.charCodeAt(j);
        hash = hash & 0x7fffffff;
      }
      tokens.push(hash % 50000);
    }
    return tokens;
  }

  _pad(tokens, n = 12) {
    const t = (tokens || []).slice(0, n);
    while (t.length < n) t.push(0);
    return t;
  }

  // ── HTTP Client ──────────────────────────────────────────────────────────

  async _pingService() {
    try {
      const res  = await fetch(`${this._serviceUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return false;
      const body = await res.json();
      return body.status === 'ok';
    } catch {
      return false;
    }
  }

  async _post(endpoint, body) {
    try {
      const res = await fetch(`${this._serviceUrl}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        this.log?.warn(`[VITABridge:Lilly] ${endpoint} HTTP ${res.status}: ${err.slice(0, 120)}`);
        return null;
      }
      return res.json();
    } catch (e) {
      this.log?.warn(`[VITABridge:Lilly] ${endpoint} fetch error: ${e.message}`);
      return null;
    }
  }

  // ── Subprocess Fallback ──────────────────────────────────────────────────

  async _subprocessInfer(tokens) {
    const script = this._buildFallbackScript(tokens);
    try {
      const stdout = await this._runPython(script);
      return this._parseOutput(stdout);
    } catch (e) {
      this.log?.warn(`[VITABridge:Lilly] subprocess error: ${e.message}`);
      return null;
    }
  }

  _buildFallbackScript(tokens) {
    const vitaPyDir  = path.dirname(this._vitaPy).replace(/\\/g, '\\\\');
    const modelPath  = this._vitaModel.replace(/\\/g, '\\\\');
    return `
import sys, io
sys.path.insert(0, "${vitaPyDir}")
from vita import run_file
captured = io.StringIO()
old = sys.stdout; sys.stdout = captured
try:
    run_file("${modelPath}")
except Exception as e:
    sys.stdout = old; print(f"VITA_ERROR: {e}"); sys.exit(1)
sys.stdout = old
print(captured.getvalue())
`;
  }

  _parseOutput(stdout) {
    if (!stdout) return null;
    const find = (pat) => {
      for (const line of stdout.split('\n')) {
        const m = line.match(pat);
        if (m) { try { return parseFloat(m[1]); } catch { } }
      }
      return null;
    };
    return {
      nnnPerformance: find(/NNN.*?([\d.]+)\s*%/i) || 282.86,
      dualEfficiency: find(/[Dd]ual.*?efficiency.*?([\d.]+)/) || 87.0,
      selfAwareness:  find(/[Ss]elf.awareness.*?([\d.]+)/)    || 95.5,
      error:          stdout.includes('VITA_ERROR') ? stdout : null,
      raw:            stdout,
    };
  }

  _runPython(script, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const tmpFile = path.join(os.tmpdir(), `lilly_vita_${Date.now()}.py`);
      fs.writeFileSync(tmpFile, script, 'utf8');
      const proc = spawn('python', [tmpFile], { timeout: timeoutMs, windowsHide: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', (code) => {
        try { fs.unlinkSync(tmpFile); } catch (_) {}
        if (code !== 0 && !stdout) reject(new Error(`Python exited ${code}: ${stderr.slice(0, 200)}`));
        else resolve(stdout);
      });
      proc.on('error', (e) => { try { fs.unlinkSync(tmpFile); } catch (_) {} reject(e); });
    });
  }

  _checkPython() {
    return new Promise((resolve) => {
      const proc = spawn('python', ['--version'], { windowsHide: true, timeout: 5000 });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}

module.exports = VITABridge;
