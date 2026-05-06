'use strict';

/**
 * NNNProcessor — Lilly-tuned native JS implementation of the NNN architecture.
 *
 * Same Newton Neural Network engine as Thanatos (282.86% — PNN 40% + NCNN 60%
 * with ×1.25 synergy), but with Lilly-specific feature extraction and
 * classification output.  No subprocess or HTTP needed — pure JS hot path.
 *
 * Architecture (mirrors Thanatos v1.0.0):
 *   Text → Feature Extraction (12D) → PNN (CLACK-SWING-CLACK, 40%)
 *        → NCNN (Staggered Circular Rings, 60%) → NNN Fusion (×1.25 synergy)
 *        → contextType + toneInfluence + botRisk + score
 *
 * Output:
 *   contextType:    'lurk' | 'engage' | 'present'
 *   toneInfluence:  { warm, sassy, deflective }  (0–1 each)
 *   botRisk:        0–1  (how likely this triggers bot-accusation pressure)
 *   score:          0–1  overall signal strength
 *
 * Feature Dimensions (12D — Lilly-specific):
 *   0  — word count density (0..1 at 50 words)
 *   1  — char length density (0..1 at 200 chars)
 *   2  — emotional intensity (!!! / omg / wait / ugh / wtf)
 *   3  — caps ratio
 *   4  — egirl/social markers (omg/bestie/literally/fr/lol/lmao/ngl/lowkey)
 *   5  — emotional depth (feel/hurt/miss/lonely/scared/sad/crying/depressed)
 *   6  — flirtation markers (cute/hot/pretty/love/kiss/babe/crush)
 *   7  — bot-risk markers (bot/ai/fake/robot/not real/are you)
 *   8  — social warmth (thanks/sweet/nice/love you/appreciate/kind)
 *   9  — question complexity (why/how/what do you think/explain/thoughts)
 *  10  — question indicator (contains ?)
 *  11  — personal pronoun density (I/me/my — self-reference / oversharing signal)
 */
class NNNProcessor {

  constructor() {
    // ── NNN Core Parameters (identical to Thanatos v1.0.0) ──────────────────
    this.pnn_base_weight      = 0.9;
    this.pnn_right_weight     = 0.85;
    this.pnn_swing_efficiency = 0.95;
    this.pnn_adaptation_rate  = 0.1;

    this.ncnn_transfer_rate    = 0.85;
    this.ncnn_momentum_buildup = 1.015;
    this.ncnn_max_momentum     = 1.6;
    this.ncnn_energy_loss      = 0.96;

    this.pnn_weight    = 0.4;
    this.ncnn_weight   = 0.6;
    this.synergy_bonus = 1.25;

    // ── Adaptive PNN weight banks (12 banks) — computed once ────────────────
    this._pnn_left  = new Array(12);
    this._pnn_right = new Array(12);
    for (let i = 0; i < 12; i++) {
      const adapt = 1.0 + this.pnn_adaptation_rate * i;
      this._pnn_left[i]  = this.pnn_base_weight  * adapt;
      this._pnn_right[i] = this.pnn_right_weight * adapt * 0.95;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Run full NNN pipeline on a message string.
   * Returns { contextType, toneInfluence, botRisk, score, fused }.
   */
  score(text) {
    if (!text || typeof text !== 'string') {
      return {
        contextType: 'engage',
        toneInfluence: { warm: 0, sassy: 0, deflective: 0 },
        botRisk: 0,
        score: 0,
      };
    }
    const features = this._extractFeatures(text);
    const pnn_out  = this._processPNN(features);
    const ncnn_out = this._processNCNN(features);
    const fused    = this._fuseNNN(pnn_out, ncnn_out);
    return this._interpret(fused, features);
  }

  /**
   * How should Lilly engage with this message?
   *   'skip'    — don't respond (very short noise, game commands, ZomB output)
   *   'react'   — minimal reaction (one word / emoji)
   *   'engage'  — normal response
   *   'present' — slow down, be attentive (emotional/vulnerable content)
   */
  detectRespondLevel(text) {
    const { contextType, botRisk, score } = this.score(text);
    if (!text || text.length < 3)           return 'skip';
    if (text.startsWith('.'))               return 'skip';   // game command
    if (contextType === 'lurk')             return 'react';
    if (contextType === 'present')          return 'present';
    if (score < 0.05 && !text.includes('?')) return 'react';
    return 'engage';
  }

  /**
   * How likely is this message to create bot-accusation pressure?
   * Returns 0–1.
   */
  detectBotRisk(text) {
    return this.score(text).botRisk;
  }

  /**
   * What tone should Lilly take?
   * Returns { warm, sassy, deflective } (0–1 each).
   */
  detectTone(text) {
    return this.score(text).toneInfluence;
  }

  /**
   * Drop-in replacement for _detectContextType() — maps Lilly's contextType
   * to a token-budget hint: 'banter' (short) | 'normal' | 'deep' (long).
   */
  detectContextType(text) {
    const { contextType } = this.score(text);
    if (contextType === 'lurk')    return 'banter';
    if (contextType === 'present') return 'deep';
    return 'normal';
  }

  // ── Feature Extraction (Lilly-tuned 12D) ──────────────────────────────────

  _extractFeatures(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wc    = Math.max(words.length, 1);
    const lc    = Math.max(text.length, 1);

    return [
      /* 0  word count density    */ Math.min(wc / 50, 1),
      /* 1  char length density   */ Math.min(lc / 200, 1),
      /* 2  emotional intensity   */ Math.min(
          (text.match(/[!?]{2,}|\?{2,}/g) || []).length / 3 +
          (text.match(/\b(omg|wait|ugh|wtf|damn|omfg|noooo)\b/gi) || []).length / 3,
        1),
      /* 3  caps ratio            */ Math.min((text.match(/[A-Z]/g) || []).length / lc, 1),
      /* 4  egirl/social markers  */ Math.min(
          (text.match(/\b(omg|bestie|literally|fr|lol|lmao|lmfao|ngl|lowkey|highkey|slay|vibe|period|periodt|obsessed)\b/gi) || []).length / 4,
        1),
      /* 5  emotional depth       */ Math.min(
          (text.match(/\b(feel|felt|hurt|miss|lonely|scared|sad|crying|cry|depressed|broken|empty|tired|numb|hopeless|anxious|alone)\b/gi) || []).length / 4,
        1),
      /* 6  flirtation markers    */ Math.min(
          (text.match(/\b(cute|hot|pretty|gorgeous|beautiful|love|kiss|babe|baby|crush|flirt|date|marry)\b/gi) || []).length / 3,
        1),
      /* 7  bot-risk markers      */ Math.min(
          (text.match(/\b(bot|ai|robot|fake|artificial|not real|chatgpt|claude|gpt|llm|algorithm)\b/gi) || []).length / 2 +
          (text.match(/\b(are you (real|human|a bot)|you('?re| are) (a )?bot|not a (real |human )?person)\b/gi) || []).length,
        1),
      /* 8  social warmth         */ Math.min(
          (text.match(/\b(thanks|thank you|appreciate|sweet|nice|kind|love you|ily|you('?re|re) (so )?(great|amazing|awesome|cool|fun|funny))\b/gi) || []).length / 3,
        1),
      /* 9  question complexity   */ Math.min(
          (text.match(/\b(why|how|what do you|explain|thoughts|opinion|think about|consider|tell me)\b/gi) || []).length / 4,
        1),
      /* 10 question indicator    */ text.includes('?') ? 1 : 0,
      /* 11 personal pronoun      */ Math.min(
          (text.match(/\b(i |i'|me |my |myself|i'm|i've|i'd|i'll)\b/gi) || []).length / wc,
        1),
    ];
  }

  // ── PNN: Enhanced Adaptive Pendulum Neural Network ─────────────────────────

  _processPNN(features) {
    const out = new Array(12).fill(0);
    const inputAvg = features.reduce((s, f) => s + f, 0) / 12;
    for (let bank = 0; bank < 12; bank++) {
      const swung   = inputAvg * this.pnn_swing_efficiency;
      out[bank] = (swung * this._pnn_left[bank] + swung * this._pnn_right[bank]) * 0.5;
    }
    return out;
  }

  // ── NCNN: Enhanced Staggered Circular Rings ────────────────────────────────

  _processNCNN(features) {
    const out  = new Array(12).fill(0);
    const seed = features.reduce((s, f) => s + f, 0) / 12;
    let ring1 = seed, ring2 = 0, ring3 = 0;

    for (let i = 0; i < 12; i++) {
      if (ring1 > 0) {
        out[i] += ring1 * 0.1;
        ring1  *= this.ncnn_energy_loss;
        if (i === 4) ring2 = Math.min(ring2 + ring1 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
        if (i === 8) ring3 = Math.min(ring3 + ring1 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
      }
      if (ring2 > 0) {
        out[i] += ring2 * 0.1;
        ring2  *= this.ncnn_energy_loss;
        if (i === 4) ring3 = Math.min(ring3 + ring2 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
        if (i === 8) ring1 = Math.min(ring1 + ring2 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
      }
      if (ring3 > 0) {
        out[i] += ring3 * 0.1;
        ring3  *= this.ncnn_energy_loss;
        if (i === 4) ring1 = Math.min(ring1 + ring3 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
        if (i === 8) ring2 = Math.min(ring2 + ring3 * this.ncnn_transfer_rate * this.ncnn_momentum_buildup, this.ncnn_max_momentum);
      }
    }
    return out;
  }

  // ── NNN Fusion: PNN(40%) + NCNN(60%) × 1.25 synergy ──────────────────────

  _fuseNNN(pnn, ncnn) {
    return pnn.map((p, i) => (p * this.pnn_weight + ncnn[i] * this.ncnn_weight) * this.synergy_bonus);
  }

  // ── Interpretation ─────────────────────────────────────────────────────────

  _interpret(fused, features) {
    const score = fused.reduce((s, v) => s + v, 0) / fused.length;
    const amp   = 1 + score;

    // ── Context classification using RAW features (not fused) ─────────────
    // PNN collapses dims to one scalar — always use raw features for routing.

    // Lurk signal: very short + low engagement + no question
    const lurkSignal = (1 - features[0]) * 0.4 + (1 - features[4]) * 0.3 + (1 - features[10]) * 0.3;

    // Present signal: emotional depth + personal pronouns + long message
    const presentSignal = features[5] * 0.45 + features[11] * 0.25 + features[0] * 0.15 + features[9] * 0.15;

    let contextType;
    if (presentSignal > 0.20) {
      contextType = 'present';
    } else if (lurkSignal > 0.70 && features[0] < 0.08) {
      contextType = 'lurk';   // very short message, nothing pulling her in
    } else {
      contextType = 'engage';
    }

    // Bot risk: dim 7 (explicit markers) amplified by NNN
    const botRisk = Math.min(features[7] * amp * 1.5, 1);

    // Tone influence (raw features × NNN amplification)
    const toneInfluence = {
      warm:       Math.min((features[8] * 0.5 + features[6] * 0.3 + features[4] * 0.2) * amp, 1),
      sassy:      Math.min((features[2] * 0.5 + features[3] * 0.3 + (1 - features[0]) * 0.2) * amp, 1),
      deflective: Math.min(botRisk, 1),
    };

    return { contextType, toneInfluence, botRisk, score, fused };
  }
}

module.exports = NNNProcessor;
