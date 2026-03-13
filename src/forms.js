// src/forms.js — Feedback, correction, and verification forms (Web3Forms)
var data = require('./data.js');
var state = data.state;

// ── Module-level state ──
var _fbType = '';

// ── Constants ──
var CORR_PLACEHOLDERS = {
  'Wrong time': 'Which service, and what\'s the correct time?',
  'Mass cancelled or moved': 'Which Mass, and where did it move to?',
  'Missing a service': 'What service is missing? (e.g., Saturday 4 PM Confession)',
  'Other': 'Tell us what needs updating'
};

// ── web3submit ──
function web3submit(payload) {
  return fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(Object.assign({ access_key: '3d503d58-e668-4ef8-81ff-70ad5ec3ecf6', from_name: 'MassFinder' }, payload))
  }).then(function(resp) {
    return resp.json();
  }).then(function(d) {
    if (!d.success) throw new Error(d.message || 'Web3Forms error');
    return d;
  });
}

// ── expressInterest ──
function expressInterest(eventId, ev) {
  if (ev) ev.stopPropagation();
  var btn = ev && ev.currentTarget;
  if (btn) btn.disabled = true;
  var e = state.eventsData.find(function(x) { return x.id === eventId; }) || state.ycEvents.find(function(x) { return x.id === eventId; });
  if (!e) { if (btn) btn.disabled = false; return; }
  var c = state.allChurches.find(function(x) { return x.id === e.church_id; }) || {};
  var showToast = require('./render.js').showToast;
  web3submit({
    subject: 'MassFinder Interest: ' + e.title,
    message: 'Event: ' + e.title + '\nChurch: ' + (c.name || '') + '\nCategory: ' + (e.category || '') + '\nDate: ' + (e.date || 'Recurring') + (e.day ? '\nDay: ' + e.day : '') + (e.time ? '\nTime: ' + e.time : '') + '\n\nA user expressed interest via MassFinder.'
  }).then(function() {
    showToast('Thanks for your interest!');
    if (btn) { btn.innerHTML = '&#10003;'; setTimeout(function() { btn.innerHTML = '&#9825;'; btn.disabled = false; }, 2000); }
  }).catch(function(err) {
    console.warn('Interest submit failed:', err);
    if (btn) btn.disabled = false;
  });
}

// ── verifyOk ──
function verifyOk(ok) {
  document.getElementById('verifyPrompt').style.display = 'none';
  var thanks = document.getElementById('verifyThanks');
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026';
  var church = document.getElementById('corrChurch') ? document.getElementById('corrChurch').value : 'Unknown Parish';
  web3submit({
    subject: 'MassFinder \u2713 Times Confirmed: ' + church,
    message: 'A visitor confirmed the schedule for ' + church + ' looks correct.\n\nAction: "Yes, these times look right!"\nParish: ' + church + '\nSubmitted: ' + new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }).then(function() {
    thanks.textContent = 'Thank you for helping keep MassFinder accurate! God bless.';
  }).catch(function(e) {
    console.warn('Verify email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── showCorrectionForm ──
function showCorrectionForm() {
  document.getElementById('verifyPrompt').style.display = 'none';
  document.getElementById('correctionForm').style.display = 'block';
}

// ── selectCorrPill ──
function selectCorrPill(btn, val) {
  document.querySelectorAll('#corrPills .corr-pill').forEach(function(p) { p.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('corrCategory').value = val;
  document.getElementById('corrMessage').placeholder = CORR_PLACEHOLDERS[val] || 'Tell us what needs updating';
}

// ── submitCorrection ──
function submitCorrection() {
  var church = document.getElementById('corrChurch').value;
  var category = document.getElementById('corrCategory').value;
  var msg = document.getElementById('corrMessage').value.trim();
  var email = document.getElementById('corrEmail').value.trim();
  if (!category) { document.getElementById('corrPills').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('corrMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('verifyThanks');
  document.getElementById('correctionForm').style.display = 'none';
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Correction [' + category + ']: ' + church, church: church, category: category, message: msg, email: email || '(not provided)' })
  .then(function() {
    thanks.textContent = 'Thank you! We\u2019ll review your correction.';
  }).catch(function(e) {
    console.warn('Correction email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── showMoreCorrection ──
function showMoreCorrection() {
  var f = document.getElementById('moreCorrectionForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// ── selectMoreCorrPill ──
function selectMoreCorrPill(btn, val) {
  document.querySelectorAll('#moreCorrPills .corr-pill').forEach(function(p) { p.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('moreCorrCategory').value = val;
  document.getElementById('moreCorrMessage').placeholder = CORR_PLACEHOLDERS[val] || 'Tell us what needs updating';
}

// ── submitMoreCorrection ──
function submitMoreCorrection() {
  var church = document.getElementById('moreCorrChurch').value.trim();
  var category = document.getElementById('moreCorrCategory').value;
  var msg = document.getElementById('moreCorrMessage').value.trim();
  var email = document.getElementById('moreCorrEmail').value.trim();
  if (!category) { document.getElementById('moreCorrPills').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('moreCorrMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('moreCorrThanks');
  document.getElementById('moreCorrectionForm').querySelectorAll('input,textarea,button').forEach(function(el) { el.style.display = 'none'; });
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Correction [' + category + ']: ' + (church || 'General'), church: church || '(general)', category: category, message: msg, email: email || '(not provided)' })
  .then(function() {
    thanks.textContent = 'Thank you! We\u2019ll review your correction.';
  }).catch(function(e) {
    console.warn('More correction email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── selectFbType ──
function selectFbType(btn, val) {
  document.querySelectorAll('#fbTypeGrid .fb-type-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  _fbType = val;
  document.getElementById('fbType').value = val;
}

// ── submitFeedback ──
function submitFeedback() {
  var msg = document.getElementById('fbMessage').value.trim();
  var email = document.getElementById('fbEmail').value.trim();
  if (!_fbType) { document.getElementById('fbTypeGrid').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('fbMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('fbThanks');
  document.getElementById('feedbackFormWrap').style.display = 'none';
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Feedback [' + _fbType + ']', feedback_type: _fbType, message: msg, email: email || '(not provided)', from_name: 'MassFinder Feedback' })
  .then(function() {
    thanks.textContent = 'Thank you \u2014 your feedback means a lot. God bless!';
  }).catch(function(e) {
    console.warn('Feedback email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── submitSettingsContact ──
function submitSettingsContact() {
  var msg = document.getElementById('settingsContactMsg').value.trim();
  var email = document.getElementById('settingsContactEmail').value.trim();
  var thanks = document.getElementById('settingsContactThanks');
  if (!msg) { document.getElementById('settingsContactMsg').style.borderColor = 'var(--color-error)'; return; }
  document.getElementById('settingsContactMsg').disabled = true;
  document.getElementById('settingsContactEmail').disabled = true;
  document.querySelector('.settings-contact-btn').disabled = true;
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026';
  web3submit({ subject: 'MassFinder Update [Settings]', message: msg, email: email || '(not provided)' })
    .then(function() { thanks.textContent = 'Got it \u2014 thank you!'; })
    .catch(function() {
      thanks.style.color = 'var(--color-error)'; thanks.textContent = 'Could not send \u2014 check your connection and try again.';
      document.getElementById('settingsContactMsg').disabled = false;
      document.getElementById('settingsContactEmail').disabled = false;
      document.querySelector('.settings-contact-btn').disabled = false;
    });
}

module.exports = {
  web3submit: web3submit,
  expressInterest: expressInterest,
  verifyOk: verifyOk,
  showCorrectionForm: showCorrectionForm,
  selectCorrPill: selectCorrPill,
  submitCorrection: submitCorrection,
  showMoreCorrection: showMoreCorrection,
  selectMoreCorrPill: selectMoreCorrPill,
  submitMoreCorrection: submitMoreCorrection,
  selectFbType: selectFbType,
  submitFeedback: submitFeedback,
  submitSettingsContact: submitSettingsContact,
  CORR_PLACEHOLDERS: CORR_PLACEHOLDERS,
};
