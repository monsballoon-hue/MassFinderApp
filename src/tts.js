// src/tts.js — Text-to-speech module
// Tier 1: Web Speech API with smart voice selection
// Tier 2: ElevenLabs cloud voices (future, behind feature flag)

var _synth = window.speechSynthesis || null;
var _utterance = null;
var _voice = null;
var _voicesLoaded = false;
var _isPlaying = false;
var _isPaused = false;
var _onStateChange = null; // callback: function(state) where state = 'playing'|'paused'|'stopped'

// ── Voice Selection ──

// Preferred voices ranked by quality (best first)
var _PREFERRED_VOICES = [
  // Microsoft Natural voices (Windows 11 / Edge) — genuinely good
  /Microsoft.*Natural/i,
  // Google voices (Chrome desktop) — decent
  /Google UK English Female/i,
  /Google UK English Male/i,
  /Google US English/i,
  // macOS high-quality voices
  /^Samantha$/,
  /^Daniel$/,
  /^Karen$/,
  // Android Google TTS
  /en-us-x-tpc-network/i,
  /en-us-x-sfg-network/i
];

function _loadVoices() {
  if (!_synth) return;
  var attempts = 0;

  function _tryLoad() {
    var voices = _synth.getVoices();
    if (voices.length) {
      _pickBestVoice(voices);
      _voicesLoaded = true;
      return;
    }
    attempts++;
    if (attempts < 10) setTimeout(_tryLoad, 250);
  }

  // Chrome fires voiceschanged async; Safari doesn't reliably
  _synth.addEventListener('voiceschanged', function() {
    var voices = _synth.getVoices();
    if (voices.length) _pickBestVoice(voices);
    _voicesLoaded = true;
  });

  _tryLoad();
}

function _pickBestVoice(voices) {
  // Filter to English voices
  var enVoices = voices.filter(function(v) {
    return /^en[-_]/i.test(v.lang);
  });

  if (!enVoices.length) { _voice = voices[0]; return; }

  // Walk preference list, pick first match
  for (var p = 0; p < _PREFERRED_VOICES.length; p++) {
    for (var v = 0; v < enVoices.length; v++) {
      if (_PREFERRED_VOICES[p].test(enVoices[v].name)) {
        _voice = enVoices[v];
        return;
      }
    }
  }

  // Fallback: first English voice
  _voice = enVoices[0];
}

// ── Playback ──

function speak(text, opts) {
  if (!_synth) return;
  stop(); // cancel any current speech

  opts = opts || {};
  _utterance = new SpeechSynthesisUtterance(text);

  if (_voice) _utterance.voice = _voice;
  _utterance.rate = opts.rate || 0.92;  // slightly slower for sacred text
  _utterance.pitch = opts.pitch || 1.0;
  _utterance.lang = 'en-US';

  _utterance.onstart = function() {
    _isPlaying = true;
    _isPaused = false;
    if (_onStateChange) _onStateChange('playing');
  };

  _utterance.onend = function() {
    _isPlaying = false;
    _isPaused = false;
    if (_onStateChange) _onStateChange('stopped');
  };

  _utterance.onerror = function() {
    // Safari background bug — silently stop
    _isPlaying = false;
    _isPaused = false;
    if (_onStateChange) _onStateChange('stopped');
  };

  _synth.speak(_utterance);
}

function pause() {
  if (!_synth || !_isPlaying) return;
  _synth.pause();
  _isPaused = true;
  _isPlaying = false;
  if (_onStateChange) _onStateChange('paused');
}

function resume() {
  if (!_synth || !_isPaused) return;
  _synth.resume();
  _isPaused = false;
  _isPlaying = true;
  if (_onStateChange) _onStateChange('playing');
}

function stop() {
  if (!_synth) return;
  _synth.cancel();
  _isPlaying = false;
  _isPaused = false;
  _utterance = null;
  if (_onStateChange) _onStateChange('stopped');
}

function togglePlayPause(text, opts) {
  if (_isPlaying) { pause(); return; }
  if (_isPaused) { resume(); return; }
  speak(text, opts);
}

function isSupported() {
  return !!_synth;
}

function getState() {
  if (_isPlaying) return 'playing';
  if (_isPaused) return 'paused';
  return 'stopped';
}

function onStateChange(cb) {
  _onStateChange = cb;
}

function getVoiceName() {
  return _voice ? _voice.name : 'Default';
}

// ── Init ──
_loadVoices();

module.exports = {
  speak: speak,
  pause: pause,
  resume: resume,
  stop: stop,
  togglePlayPause: togglePlayPause,
  isSupported: isSupported,
  getState: getState,
  onStateChange: onStateChange,
  getVoiceName: getVoiceName
};
