// src/ccc-data.js — Shared CCC data loader (TD-04)
// Loads data/catechism.json once, shared across ccc.js, examination.js, rosary.js

var _data = null;

function load(cb) {
  if (_data) { if (cb) cb(_data); return Promise.resolve(_data); }
  return fetch('/data/catechism.json').then(function(r) { return r.json(); })
    .then(function(d) {
      _data = { paragraphs: {}, xrefs: {} };
      Object.keys(d.paragraphs).forEach(function(k) { _data.paragraphs[parseInt(k, 10)] = d.paragraphs[k]; });
      if (d.xrefs) {
        Object.keys(d.xrefs).forEach(function(k) { _data.xrefs[parseInt(k, 10)] = d.xrefs[k]; });
      }
      if (cb) cb(_data);
      return _data;
    }).catch(function(e) {
      if (cb) cb(null);
      return null;
    });
}

module.exports = { load: load };
