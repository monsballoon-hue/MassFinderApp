// src/study-db.js — Study tools persistence layer (IndexedDB via Dexie)
// Stores annotations (notes, highlights, bookmarks) and reading progress.
// All data is local-only. No server calls. Privacy-first.

var Dexie = require('dexie').Dexie;

var db = new Dexie('MassFinderStudy');

db.version(1).stores({
  annotations: '++id, type, source, address, created',
  progress: 'key, source, updated'
});

// ── Notes ──

function addNote(source, address, text) {
  return db.annotations.add({
    type: 'note',
    source: source,
    address: address,
    offset: null,
    text: text,
    color: null,
    label: null,
    created: new Date().toISOString()
  });
}

function updateNote(id, text) {
  return db.annotations.update(id, { text: text });
}

function getNotesForAddress(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'note'; })
    .toArray();
}

function getAllNotes(source) {
  if (source) {
    return db.annotations
      .where({ source: source, type: 'note' })
      .reverse()
      .sortBy('created');
  }
  return db.annotations
    .where({ type: 'note' })
    .reverse()
    .sortBy('created');
}

// ── Highlights ──

function addHighlight(source, address, color) {
  // Check for existing highlight on same address — toggle off if exists
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'highlight'; })
    .first()
    .then(function(existing) {
      if (existing) {
        // Toggle: remove existing highlight
        return db.annotations.delete(existing.id).then(function() { return null; });
      }
      return db.annotations.add({
        type: 'highlight',
        source: source,
        address: address,
        offset: null,
        text: null,
        color: color || 'gold',
        label: null,
        created: new Date().toISOString()
      });
    });
}

function getHighlightsForAddresses(source, addresses) {
  // Get highlights for a set of addresses (e.g., all verses in a chapter)
  return db.annotations
    .where('address')
    .anyOf(addresses)
    .and(function(a) { return a.source === source && a.type === 'highlight'; })
    .toArray();
}

function getAllHighlights(source) {
  if (source) {
    return db.annotations
      .where({ source: source, type: 'highlight' })
      .toArray();
  }
  return db.annotations
    .where({ type: 'highlight' })
    .toArray();
}

// ── Bookmarks ──

function addBookmark(source, address, label) {
  return db.annotations.add({
    type: 'bookmark',
    source: source,
    address: address,
    offset: null,
    text: null,
    color: null,
    label: label || '',
    created: new Date().toISOString()
  });
}

function removeBookmark(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'bookmark'; })
    .delete();
}

function isBookmarked(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'bookmark'; })
    .count()
    .then(function(c) { return c > 0; });
}

function getAllBookmarks() {
  return db.annotations
    .where({ type: 'bookmark' })
    .reverse()
    .sortBy('created');
}

// ── Reading Progress ──

function saveProgress(source, bookId, address, scrollPos) {
  var key = source + ':' + (bookId || '_');
  return db.progress.put({
    key: key,
    source: source,
    bookId: bookId || null,
    address: address,
    scrollPos: scrollPos || 0,
    updated: new Date().toISOString()
  });
}

function getProgress(source, bookId) {
  var key = source + ':' + (bookId || '_');
  return db.progress.get(key);
}

function getAllProgress() {
  return db.progress.orderBy('updated').reverse().toArray();
}

// ── Annotation counts (for indicators) ──

function getAnnotationCounts(source, addresses) {
  // Returns { address: { notes: N, highlights: N, bookmarks: N } }
  return db.annotations
    .where('address')
    .anyOf(addresses)
    .and(function(a) { return a.source === source; })
    .toArray()
    .then(function(items) {
      var counts = {};
      items.forEach(function(a) {
        if (!counts[a.address]) counts[a.address] = { notes: 0, highlights: 0, bookmarks: 0 };
        if (a.type === 'note') counts[a.address].notes++;
        else if (a.type === 'highlight') counts[a.address].highlights++;
        else if (a.type === 'bookmark') counts[a.address].bookmarks++;
      });
      return counts;
    });
}

// ── Delete ──

function deleteAnnotation(id) {
  return db.annotations.delete(id);
}

function clearAllData() {
  return Promise.all([
    db.annotations.clear(),
    db.progress.clear()
  ]);
}

module.exports = {
  addNote: addNote,
  updateNote: updateNote,
  getNotesForAddress: getNotesForAddress,
  getAllNotes: getAllNotes,
  addHighlight: addHighlight,
  getHighlightsForAddresses: getHighlightsForAddresses,
  getAllHighlights: getAllHighlights,
  addBookmark: addBookmark,
  removeBookmark: removeBookmark,
  isBookmarked: isBookmarked,
  getAllBookmarks: getAllBookmarks,
  saveProgress: saveProgress,
  getProgress: getProgress,
  getAllProgress: getAllProgress,
  getAnnotationCounts: getAnnotationCounts,
  deleteAnnotation: deleteAnnotation,
  clearAllData: clearAllData,
  db: db
};
