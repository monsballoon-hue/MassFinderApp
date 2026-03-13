// src/board-ui.js — Research Board reader module
// Renders user-curated collections of cross-source references with annotations.
// Registers with reader.js for overlay management.

var reader = require('./reader.js');
var studyDb = require('./study-db.js');
var graph = require('./graph.js');
var utils = require('./utils.js');
var studyUi = require('./study-ui.js');

// ── Reader module registration ──

reader.registerModule('board', {
  getTitle: function(params) {
    return params._title || 'Research Board';
  },
  render: function(params, bodyEl) {
    _renderBoard(params.boardId, bodyEl);
  },
  onClose: function() {}
});

// ── Board rendering ──

function _renderBoard(boardId, bodyEl) {
  bodyEl.innerHTML = '<div class="explore-loading">Loading\u2026</div>';

  Promise.all([
    studyDb.getBoard(boardId),
    studyDb.getBoardItems(boardId),
    studyDb.getAnnotationsForBoard(boardId),
    graph.ensure(['ccc', 'hierarchy'])
  ]).then(function(results) {
    var board = results[0];
    var items = results[1];
    var annotations = results[2];

    if (!board) {
      bodyEl.innerHTML = '<div class="explore-empty">Board not found</div>';
      return;
    }

    // Build annotation lookup: source:address → annotations[]
    var annoByAddr = {};
    annotations.forEach(function(a) {
      var key = a.source + ':' + a.address;
      if (!annoByAddr[key]) annoByAddr[key] = [];
      annoByAddr[key].push(a);
    });

    var html = '<div class="board-meta">'
      + '<div class="board-title">' + utils.esc(board.title) + '</div>'
      + '<div class="board-count">' + items.length + ' item' + (items.length !== 1 ? 's' : '')
      + ' \u00b7 Created ' + _formatDate(board.created) + '</div>'
      + '</div>';

    if (!items.length) {
      html += '<div class="board-empty">'
        + '<p>This board is empty.</p>'
        + '<p>Tap Highlight, Note, or Bookmark on any text, then choose "Board" to add items here.</p>'
        + '</div>';
    } else {
      html += '<div class="board-items">';
      items.forEach(function(item) {
        var key = item.source + ':' + item.address;
        var itemAnnos = annoByAddr[key] || [];
        html += _renderBoardItem(item, itemAnnos);
      });
      html += '</div>';
    }

    // Export buttons
    html += '<div class="board-export-section">'
      + '<button class="board-export-btn" onclick="_boardExportJSON(' + boardId + ')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
      + ' Export JSON</button>'
      + '<button class="board-export-btn" onclick="_boardExportMD(' + boardId + ')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      + ' Export Markdown</button>'
      + '</div>';

    bodyEl.innerHTML = html;
    studyUi.initStudyLayer(bodyEl);
  });
}

function _renderBoardItem(item, annotations) {
  var sourceLabels = {
    ccc: 'CCC', bible: 'Scripture', baltimore: 'Baltimore',
    summa: 'Summa', lectionary: 'Lectionary'
  };
  var label = sourceLabels[item.source] || item.source;
  var displayAddr = item.source === 'ccc' ? '\u00A7' + item.address : item.address;

  // Get preview text from graph
  var preview = '';
  if (item.source === 'ccc') {
    var text = graph.getCCCParagraph(item.address);
    if (text) preview = utils.getPreview(text, 160);
  }

  var html = '<div class="board-item annotatable" data-source="' + utils.esc(item.source)
    + '" data-address="' + utils.esc(item.address) + '">';

  // Header
  html += '<div class="board-item-header">'
    + '<span class="board-item-source board-item-source--' + item.source + '">' + label + '</span>'
    + '<span class="board-item-addr">' + utils.esc(displayAddr) + '</span>'
    + '<button class="board-item-open" onclick="_boardOpenItem(\'' + utils.esc(item.source) + '\',\'' + utils.esc(item.address) + '\')" aria-label="Open">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
    + '</button>'
    + '</div>';

  // Preview text
  if (preview) {
    html += '<div class="board-item-text">' + utils.esc(preview) + '</div>';
  }

  // Annotations
  var highlights = annotations.filter(function(a) { return a.type === 'highlight'; });
  var notes = annotations.filter(function(a) { return a.type === 'note'; });

  if (highlights.length) {
    html += '<div class="board-item-hl">';
    highlights.forEach(function(h) {
      html += '<span class="board-hl-dot board-hl-dot--' + (h.color || 'gold') + '"></span>';
    });
    html += '</div>';
  }

  notes.forEach(function(n) {
    var notePreview = n.text.length > 100 ? n.text.slice(0, 100) + '\u2026' : n.text;
    html += '<div class="board-item-note">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      + ' <span>' + utils.esc(notePreview) + '</span>'
      + '</div>';
  });

  html += '</div>';
  return html;
}

// ── Export functions ──

function _exportJSON(boardId) {
  Promise.all([
    studyDb.getBoard(boardId),
    studyDb.getBoardItems(boardId),
    studyDb.getAnnotationsForBoard(boardId)
  ]).then(function(results) {
    var board = results[0];
    var items = results[1];
    var annotations = results[2];

    var data = JSON.stringify({
      version: 2,
      exported: new Date().toISOString(),
      board: { title: board.title, color: board.color, created: board.created },
      items: items.map(function(item) {
        var itemAnnos = annotations.filter(function(a) {
          return a.source === item.source && a.address === item.address;
        });
        return {
          source: item.source,
          address: item.address,
          position: item.position,
          annotations: itemAnnos.map(function(a) {
            return { type: a.type, color: a.color, text: a.text };
          })
        };
      })
    }, null, 2);

    _downloadFile(data, _slugify(board.title) + '.json', 'application/json');
  });
}

function _exportMarkdown(boardId) {
  Promise.all([
    studyDb.getBoard(boardId),
    studyDb.getBoardItems(boardId),
    studyDb.getAnnotationsForBoard(boardId)
  ]).then(function(results) {
    var board = results[0];
    var items = results[1];
    var annotations = results[2];
    var annoByAddr = {};
    annotations.forEach(function(a) {
      var key = a.source + ':' + a.address;
      if (!annoByAddr[key]) annoByAddr[key] = [];
      annoByAddr[key].push(a);
    });

    var md = '# ' + board.title + '\n';
    md += '*Created ' + board.created.slice(0, 10) + ' \u00b7 ' + items.length + ' items*\n\n---\n\n';

    items.forEach(function(item, idx) {
      var label = item.source === 'ccc' ? 'CCC \u00A7' + item.address : item.address;
      md += '## ' + (idx + 1) + '. ' + label + '\n';

      if (item.source === 'ccc') {
        var text = graph.getCCCParagraph(item.address);
        if (text) {
          var clean = text.replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '').replace(/\n/g, ' ').trim();
          md += '> ' + (clean.length > 200 ? clean.slice(0, 200) + '\u2026' : clean) + '\n\n';
        }
      }

      var key = item.source + ':' + item.address;
      var itemAnnos = annoByAddr[key] || [];
      itemAnnos.forEach(function(a) {
        if (a.type === 'note' && a.text) {
          md += '**Note:** ' + a.text + '\n\n';
        }
      });

      md += '---\n\n';
    });

    _downloadFile(md, _slugify(board.title) + '.md', 'text/markdown');
  });
}

// ── Helpers ──

function _formatDate(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function _slugify(str) {
  return (str || 'board').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function _downloadFile(content, filename, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _openItem(source, address) {
  if (source === 'ccc') reader.readerOpen('ccc', { num: String(address) });
  else if (source === 'bible') reader.readerOpen('bible', { ref: String(address) });
}

// ── Public API for Saved tab ──

function openBoard(boardId) {
  studyDb.getBoard(boardId).then(function(board) {
    reader.readerOpen('board', { boardId: boardId, _title: board ? board.title : 'Board' });
  });
}

function createNewBoard() {
  studyDb.createBoard('Untitled Board', 'gold').then(function(boardId) {
    openBoard(boardId);
  });
}

// ── Window bindings ──
window._boardOpenItem = _openItem;
window._boardExportJSON = _exportJSON;
window._boardExportMD = _exportMarkdown;
window.openBoard = openBoard;
window.createNewBoard = createNewBoard;

module.exports = {
  openBoard: openBoard,
  createNewBoard: createNewBoard
};
