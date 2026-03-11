// src/haptics.js — Shared haptic feedback (extracted from rosary.js + examination.js)
// iOS Safari 17.4+: uses <input switch> trick for native haptics
// Android: falls back to navigator.vibrate()
// Desktop/unsupported: silent no-op

function haptic() {
  try {
    if (navigator.vibrate) { navigator.vibrate(10); return; }
    var label = document.createElement('label');
    label.ariaHidden = 'true';
    label.style.display = 'none';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch (e) {}
}
haptic.confirm = function() {
  if (navigator.vibrate) { navigator.vibrate([10, 70, 10]); return; }
  haptic(); setTimeout(haptic, 120);
};
haptic.error = function() {
  if (navigator.vibrate) { navigator.vibrate([10, 70, 10, 70, 10]); return; }
  haptic(); setTimeout(haptic, 120); setTimeout(haptic, 240);
};

module.exports = haptic;
