// src/study-db.js — Study tools persistence layer (IndexedDB via Dexie)
// Stores annotations (notes, highlights, bookmarks) and reading progress.
// All data is local-only. No server calls. Privacy-first.

var Dexie = require('dexie').Dexie;

var db = new Dexie('MassFinderStudy');

db.version(1).stores({
  annotations: '++id, type, source, address, created',
  progress: 'key, source, updated'
});

// Version 2: Research boards + multi-color highlights
db.version(2).stores({
  annotations: '++id, type, source, address, created, boardId, [source+address]',
  progress: 'key, source, updated',
  boards: '++id, title, created, updated',
  boardItems: '++id, boardId, source, address, position, created'
}).upgrade(function(tx) {
  return tx.table('annotations').toCollection().modify(function(ann) {
    if (ann.boardId === undefined) ann.boardId = null;
  });
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
  // Check for existing highlight — same color toggles off, different color updates
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'highlight'; })
    .first()
    .then(function(existing) {
      if (existing) {
        if (existing.color === (color || 'gold')) {
          // Same color — toggle off
          return db.annotations.delete(existing.id).then(function() { return null; });
        }
        // Different color — update
        return db.annotations.update(existing.id, { color: color }).then(function() { return color; });
      }
      return db.annotations.add({
        type: 'highlight',
        source: source,
        address: address,
        offset: null,
        text: null,
        color: color || 'gold',
        label: null,
        boardId: null,
        created: new Date().toISOString()
      }).then(function() { return color || 'gold'; });
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
    db.progress.clear(),
    db.boards.clear(),
    db.boardItems.clear()
  ]);
}

// ── Boards ──

function createBoard(title, color) {
  var now = new Date().toISOString();
  return db.boards.add({
    title: title || 'Untitled Board',
    description: '',
    color: color || 'gold',
    created: now,
    updated: now
  });
}

function updateBoard(id, updates) {
  updates.updated = new Date().toISOString();
  return db.boards.update(id, updates);
}

function deleteBoard(id) {
  return db.transaction('rw', [db.boards, db.boardItems, db.annotations], function() {
    db.boards.delete(id);
    db.boardItems.where({ boardId: id }).delete();
    db.annotations.where({ boardId: id }).modify({ boardId: null });
  });
}

function getAllBoards() {
  return db.boards.orderBy('updated').reverse().toArray();
}

function getBoard(id) {
  return db.boards.get(id);
}

// ── Board Items ──

function addBoardItem(boardId, source, address) {
  return db.boardItems.where({ boardId: boardId }).count().then(function(count) {
    return db.boardItems.add({
      boardId: boardId,
      source: source,
      address: address,
      position: count,
      label: '',
      created: new Date().toISOString()
    });
  }).then(function() {
    return db.boards.update(boardId, { updated: new Date().toISOString() });
  });
}

function removeBoardItem(id) {
  return db.boardItems.delete(id);
}

function getBoardItems(boardId) {
  return db.boardItems.where({ boardId: boardId }).sortBy('position');
}

function reorderBoardItem(id, newPosition) {
  return db.boardItems.update(id, { position: newPosition });
}

// ── Annotations for boards ──

function getAnnotationsForBoard(boardId) {
  return db.annotations.where({ boardId: boardId }).toArray();
}

function linkAnnotationToBoard(annotationId, boardId) {
  return db.annotations.update(annotationId, { boardId: boardId });
}

// ── Export / Import ──

function exportAllData() {
  return Promise.all([
    db.annotations.toArray(),
    db.progress.toArray(),
    db.boards.toArray(),
    db.boardItems.toArray()
  ]).then(function(results) {
    return {
      version: 2,
      exported: new Date().toISOString(),
      annotations: results[0],
      progress: results[1],
      boards: results[2],
      boardItems: results[3]
    };
  });
}

function importData(data) {
  if (!data || !data.version) return Promise.reject(new Error('Invalid data'));
  return db.transaction('rw', [db.annotations, db.progress, db.boards, db.boardItems], function() {
    if (data.annotations) db.annotations.bulkPut(data.annotations);
    if (data.progress) db.progress.bulkPut(data.progress);
    if (data.boards) db.boards.bulkPut(data.boards);
    if (data.boardItems) db.boardItems.bulkPut(data.boardItems);
  });
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
  createBoard: createBoard,
  updateBoard: updateBoard,
  deleteBoard: deleteBoard,
  getAllBoards: getAllBoards,
  getBoard: getBoard,
  addBoardItem: addBoardItem,
  removeBoardItem: removeBoardItem,
  getBoardItems: getBoardItems,
  reorderBoardItem: reorderBoardItem,
  getAnnotationsForBoard: getAnnotationsForBoard,
  linkAnnotationToBoard: linkAnnotationToBoard,
  exportAllData: exportAllData,
  importData: importData,
  db: db
};
