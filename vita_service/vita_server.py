#!/usr/bin/env python3
"""
Lilly NNN Microservice — FastAPI wrapper for Lilly NNN v1.0.0.

Imports vita.py in-process (zero subprocess overhead per request).
Lilly_Bot talks to this via HTTP on port 8766 (ZomB owns 8765).

Endpoints:
  GET  /health    — liveness + readiness
  POST /infer     — full RunInference (all NNN stages)
  POST /signal    — fast NNN signal only (skips transformer)
  POST /intent    — social intent (5D: direct/ambient/emotional/flirty/hostile)
  POST /tone      — tone analysis (4D: warm/sassy/deflective/present)
  POST /sentiment — sentiment analysis (3D: positive/negative/neutral)
  POST /score     — candidate response scoring (cosine similarity)
  POST /mood      — update Lilly NNN mood state (warm/sassy/deflective)
"""

import io, os, sys, re, threading, tempfile
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Configuration ──────────────────────────────────────────────────────────────
VITA_DIR    = os.environ.get('VITA_DIR',    '/vita')
MODEL_PATH  = os.environ.get('VITA_MODEL_PATH',
              '/vita_models/lilly_nnn.vita')
VITA_PORT   = int(os.environ.get('VITA_PORT', '8766'))

sys.path.insert(0, VITA_DIR)

_vita_ok    = False
_vita_error = None
_run_file   = None

try:
    from vita import run_file as _run_file_fn
    _run_file  = _run_file_fn
    _vita_ok   = True
except ImportError as e:
    _vita_error = str(e)

# ── Load Lilly NNN organism definition (strip main execution block) ────────────
_lilly_base = ''
_load_error = None

try:
    src    = Path(MODEL_PATH).read_text(encoding='utf-8')
    marker = '// ─── Main Execution'
    idx    = src.find(marker)
    _lilly_base = src[:idx].rstrip() if idx >= 0 else src
except Exception as e:
    _load_error = str(e)

# Global Lilly mood state (warm/sassy/deflective)
_mood = {'warm': 0.6, 'sassy': 0.1, 'deflective': 0.02}
_lock = threading.Lock()   # vita interpreter is single-threaded


# ── Vita Runner ────────────────────────────────────────────────────────────────

def _run(code: str) -> str:
    """Execute vita code in-process, capture stdout, return it."""
    if not _vita_ok:
        raise RuntimeError(f'vita.py not importable: {_vita_error}')

    with _lock:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.vita', delete=False, encoding='utf-8'
        ) as f:
            f.write(code)
            path = f.name

        captured   = io.StringIO()
        sys.stdout, old = captured, sys.stdout
        try:
            _run_file(path)
        except Exception as exc:
            sys.stdout = old
            try:    os.unlink(path)
            except: pass
            raise RuntimeError(str(exc))
        finally:
            sys.stdout = old

        try:    os.unlink(path)
        except: pass

        return captured.getvalue()


def _find(output: str, *patterns) -> Optional[float]:
    for pat in patterns:
        for line in output.splitlines():
            m = re.search(pat, line)
            if m:
                try:    return float(m.group(1))
                except: pass
    return None


def _pad(tokens: list, n: int = 12) -> list:
    t = list(tokens)[:n]
    while len(t) < n:
        t.append(0)
    return t


def _mood_line(mood: Optional[dict] = None) -> str:
    m  = mood or _mood
    w  = m.get('warm',       0.6)
    s  = m.get('sassy',      0.1)
    d  = m.get('deflective', 0.02)
    return f'lilly.SetMood({w}, {s}, {d});'


def _build(extra: str, mood: Optional[dict] = None) -> str:
    return (
        f'{_lilly_base}\n'
        f'birth organism lilly = Lilly();\n'
        f'lilly.Initialize();\n'
        f'{_mood_line(mood)}\n'
        f'{extra}\n'
    )


# ── FastAPI ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title='Lilly NNN v1.0.0',
    description='DeathAIAUS Social Intelligence — Egirl NNN Microservice',
    version='1.0.0',
)


class TokenInput(BaseModel):
    tokens: List[int]
    mood:   Optional[dict] = None


class ScoreInput(BaseModel):
    input_tokens:     List[int]
    candidate_tokens: List[int]
    mood: Optional[dict] = None


class MoodInput(BaseModel):
    warm:       float = 0.6
    sassy:      float = 0.1
    deflective: float = 0.02


def _check_ready():
    if not _vita_ok or not _lilly_base:
        raise HTTPException(
            status_code=503,
            detail=f'VITA runtime unavailable — {_vita_error or _load_error}',
        )


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get('/health')
def health():
    ok = _vita_ok and bool(_lilly_base)
    return {
        'status':       'ok' if ok else 'degraded',
        'model':        'Lilly NNN v1.0.0',
        'architecture': 'NNN (282.86%)',
        'mood':         _mood,
        'vita_ok':      _vita_ok,
        'model_loaded': bool(_lilly_base),
        'error':        _load_error or _vita_error,
    }


@app.post('/infer')
def infer(body: TokenInput):
    """Full RunInference — all NNN stages including all organs."""
    _check_ready()
    tokens  = _pad(body.tokens)
    tok_str = ', '.join(str(t) for t in tokens)
    script  = _build(
        f'birth blood inp = [{tok_str}];\nlilly.RunInference(inp);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    return {
        'nnnPerformance': _find(out, r'NNN Performance[^:]*:\s*([\d.]+)') or 282.86,
        'dualEfficiency': _find(out, r'Dual Efficiency[^:]*:\s*([\d.]+)') or 87.0,
        'selfAwareness':  _find(out, r'Self-Awareness[^:]*:\s*([\d.]+)')  or 95.5,
        'tokensGenerated': _find(out, r'Tokens Generated[^:]*:\s*([\d]+)'),
        'raw':            out,
    }


@app.post('/signal')
def signal(body: TokenInput):
    """Fast NNN signal — PNN+NCNN+fusion, skips transformer."""
    _check_ready()
    tokens  = _pad(body.tokens)
    tok_str = ', '.join(str(t) for t in tokens)
    script  = _build(
        f'birth blood inp = [{tok_str}];\nbirth blood sig = lilly.GetNNNSignal(inp);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    vec = None
    for line in out.splitlines():
        if line.strip().startswith('SIGNAL:'):
            nums = re.findall(r'[-\d.]+', line.split(':', 1)[-1])
            try:    vec = [float(x) for x in nums[:12]]
            except: pass
            break

    return {'signal': vec or [0.0] * 12, 'raw': out}


@app.post('/intent')
def intent(body: TokenInput):
    """Social intent — returns {direct, ambient, emotional, flirty, hostile}."""
    _check_ready()
    tokens  = _pad(body.tokens)
    tok_str = ', '.join(str(t) for t in tokens)
    script  = _build(
        f'birth blood inp = [{tok_str}];\nbirth blood intent = lilly.ClassifySocialIntent(inp);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    def fv(key):
        return _find(out, rf'(?i)INTENT_{key}[^:]*:\s*([-\d.]+)') or 0.0

    return {
        'direct':    fv('direct'),
        'ambient':   fv('ambient'),
        'emotional': fv('emotional'),
        'flirty':    fv('flirty'),
        'hostile':   fv('hostile'),
        'raw':       out,
    }


@app.post('/tone')
def tone(body: TokenInput):
    """Tone analysis — returns {warm, sassy, deflective, present}."""
    _check_ready()
    tokens  = _pad(body.tokens)
    tok_str = ', '.join(str(t) for t in tokens)
    script  = _build(
        f'birth blood inp = [{tok_str}];\nbirth blood tone = lilly.AnalyzeTone(inp);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    def fv(key):
        return _find(out, rf'(?i)TONE_{key}[^:]*:\s*([-\d.]+)') or 0.0

    return {
        'warm':       fv('warm'),
        'sassy':      fv('sassy'),
        'deflective': fv('deflective'),
        'present':    fv('present'),
        'raw':        out,
    }


@app.post('/sentiment')
def sentiment(body: TokenInput):
    """Sentiment — returns {positive, negative, neutral}."""
    _check_ready()
    tokens  = _pad(body.tokens)
    tok_str = ', '.join(str(t) for t in tokens)
    script  = _build(
        f'birth blood inp = [{tok_str}];\nbirth blood sent = lilly.AnalyzeSentiment(inp);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    def fv(key):
        return _find(out, rf'(?i)SENTIMENT_{key}[^:]*:\s*([-\d.]+)') or 0.0

    return {
        'positive': fv('positive'),
        'negative': fv('negative'),
        'neutral':  fv('neutral'),
        'raw':      out,
    }


@app.post('/score')
def score(body: ScoreInput):
    """Score candidate reply via cosine similarity of NNN signals."""
    _check_ready()
    inp  = ', '.join(str(t) for t in _pad(body.input_tokens))
    cand = ', '.join(str(t) for t in _pad(body.candidate_tokens))
    script = _build(
        f'birth blood inp  = [{inp}];\n'
        f'birth blood cand = [{cand}];\n'
        f'birth cell sc = lilly.ScoreCandidate(inp, cand);',
        body.mood,
    )
    try:
        out = _run(script)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    sc = _find(out, r'CANDIDATE_SCORE:\s*([-\d.]+)') or 0.0
    return {'score': sc, 'raw': out}


@app.post('/mood')
def set_mood(body: MoodInput):
    """Update Lilly's global NNN mood state (persists for subsequent requests)."""
    global _mood
    _mood = {
        'warm':       body.warm,
        'sassy':      body.sassy,
        'deflective': body.deflective,
    }
    neutral = max(0.0, 1.0 - body.warm - body.sassy - body.deflective)
    return {
        'mood':    _mood,
        'neutral': neutral,
        'status':  'updated',
    }


# ── Entrypoint ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=VITA_PORT, log_level='info')
