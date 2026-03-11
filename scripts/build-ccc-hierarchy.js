#!/usr/bin/env node
// scripts/build-ccc-hierarchy.js
// Generates the CCC table of contents hierarchy with paragraph ranges.
// The CCC structure is fixed and canonical — hardcoded from the official Vatican TOC.
// Output: data/ccc-hierarchy.json
//
// Structure: { hierarchy: [...parts], lookup: { paragraphNum: { part, section, chapter, article } } }
//
// Usage: node scripts/build-ccc-hierarchy.js

var fs = require('fs');
var path = require('path');

var OUT = path.join(__dirname, '..', 'data', 'ccc-hierarchy.json');

// Canonical CCC Table of Contents
// Source: Vatican archive, Catechism of the Catholic Church (1992, editio typica 1997)
// 4 Parts, each with Sections, Chapters, and Articles
var HIERARCHY = [
  {
    title: 'The Profession of Faith',
    range: [1, 1065],
    sections: [
      {
        title: 'Prologue',
        range: [1, 25],
        chapters: []
      },
      {
        title: '"I Believe" \u2014 "We Believe"',
        range: [26, 184],
        chapters: [
          {
            title: "Man's Capacity for God",
            range: [27, 49],
            articles: []
          },
          {
            title: 'God Comes to Meet Man',
            range: [50, 141],
            articles: [
              { title: 'The Revelation of God', range: [51, 73] },
              { title: 'The Transmission of Divine Revelation', range: [74, 100] },
              { title: 'Sacred Scripture', range: [101, 141] }
            ]
          },
          {
            title: 'Man\u2019s Response to God',
            range: [142, 184],
            articles: [
              { title: 'I Believe', range: [142, 165] },
              { title: 'We Believe', range: [166, 184] }
            ]
          }
        ]
      },
      {
        title: 'The Profession of the Christian Faith',
        range: [185, 1065],
        chapters: [
          {
            title: 'I Believe in God the Father',
            range: [198, 421],
            articles: [
              { title: '"I Believe in God, the Father Almighty, Creator of Heaven and Earth"', range: [198, 278] },
              { title: 'The Creator', range: [279, 324] },
              { title: 'Heaven and Earth', range: [325, 354] },
              { title: 'Man', range: [355, 384] },
              { title: 'The Fall', range: [385, 421] }
            ]
          },
          {
            title: 'I Believe in Jesus Christ, the Only Son of God',
            range: [422, 682],
            articles: [
              { title: '"And in Jesus Christ, His Only Son, Our Lord"', range: [422, 455] },
              { title: '"Conceived by the Holy Spirit, Born of the Virgin Mary"', range: [456, 511] },
              { title: '"He Suffered Under Pontius Pilate, Was Crucified, Died, and Was Buried"', range: [512, 570] },
              { title: '"He Descended into Hell; On the Third Day He Rose Again"', range: [571, 658] },
              { title: '"He Ascended into Heaven and Is Seated at the Right Hand of the Father"', range: [659, 667] },
              { title: '"He Will Come Again to Judge the Living and the Dead"', range: [668, 682] }
            ]
          },
          {
            title: 'I Believe in the Holy Spirit',
            range: [683, 1065],
            articles: [
              { title: '"I Believe in the Holy Spirit"', range: [683, 747] },
              { title: '"I Believe in the Holy Catholic Church"', range: [748, 870] },
              { title: 'The Communion of Saints', range: [946, 962] },
              { title: 'Mary \u2014 Mother of Christ, Mother of the Church', range: [963, 975] },
              { title: '"I Believe in the Forgiveness of Sins"', range: [976, 987] },
              { title: '"I Believe in the Resurrection of the Body"', range: [988, 1019] },
              { title: '"I Believe in Life Everlasting"', range: [1020, 1060] },
              { title: 'Amen', range: [1061, 1065] }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'The Celebration of the Christian Mystery',
    range: [1066, 1690],
    sections: [
      {
        title: 'The Sacramental Economy',
        range: [1066, 1209],
        chapters: [
          {
            title: 'The Paschal Mystery in the Age of the Church',
            range: [1076, 1134],
            articles: [
              { title: 'The Liturgy \u2014 Work of the Holy Trinity', range: [1077, 1112] },
              { title: 'The Paschal Mystery in the Church\u2019s Sacraments', range: [1113, 1134] }
            ]
          },
          {
            title: 'The Sacramental Celebration of the Paschal Mystery',
            range: [1135, 1209],
            articles: [
              { title: 'Celebrating the Church\u2019s Liturgy', range: [1135, 1199] },
              { title: 'Liturgical Diversity and the Unity of the Mystery', range: [1200, 1209] }
            ]
          }
        ]
      },
      {
        title: 'The Seven Sacraments of the Church',
        range: [1210, 1690],
        chapters: [
          {
            title: 'The Sacraments of Christian Initiation',
            range: [1210, 1419],
            articles: [
              { title: 'The Sacrament of Baptism', range: [1210, 1284] },
              { title: 'The Sacrament of Confirmation', range: [1285, 1321] },
              { title: 'The Sacrament of the Eucharist', range: [1322, 1419] }
            ]
          },
          {
            title: 'The Sacraments of Healing',
            range: [1420, 1532],
            articles: [
              { title: 'The Sacrament of Penance and Reconciliation', range: [1420, 1498] },
              { title: 'The Anointing of the Sick', range: [1499, 1532] }
            ]
          },
          {
            title: 'The Sacraments at the Service of Communion',
            range: [1533, 1666],
            articles: [
              { title: 'The Sacrament of Holy Orders', range: [1533, 1600] },
              { title: 'The Sacrament of Matrimony', range: [1601, 1666] }
            ]
          },
          {
            title: 'Other Liturgical Celebrations',
            range: [1667, 1690],
            articles: [
              { title: 'Sacramentals', range: [1667, 1679] },
              { title: 'Christian Funerals', range: [1680, 1690] }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Life in Christ',
    range: [1691, 2557],
    sections: [
      {
        title: 'Man\u2019s Vocation: Life in the Spirit',
        range: [1691, 2051],
        chapters: [
          {
            title: 'The Dignity of the Human Person',
            range: [1700, 1876],
            articles: [
              { title: 'Man: The Image of God', range: [1701, 1715] },
              { title: 'Our Vocation to Beatitude', range: [1716, 1729] },
              { title: 'Man\u2019s Freedom', range: [1730, 1748] },
              { title: 'The Morality of Human Acts', range: [1749, 1761] },
              { title: 'The Morality of the Passions', range: [1762, 1775] },
              { title: 'Moral Conscience', range: [1776, 1802] },
              { title: 'The Virtues', range: [1803, 1845] },
              { title: 'Sin', range: [1846, 1876] }
            ]
          },
          {
            title: 'The Human Community',
            range: [1877, 1948],
            articles: [
              { title: 'The Person and Society', range: [1877, 1896] },
              { title: 'Participation in Social Life', range: [1897, 1927] },
              { title: 'Social Justice', range: [1928, 1948] }
            ]
          },
          {
            title: 'God\u2019s Salvation: Law and Grace',
            range: [1949, 2051],
            articles: [
              { title: 'The Moral Law', range: [1949, 1986] },
              { title: 'Grace and Justification', range: [1987, 2029] },
              { title: 'The Church, Mother and Teacher', range: [2030, 2051] }
            ]
          }
        ]
      },
      {
        title: 'The Ten Commandments',
        range: [2052, 2557],
        chapters: [
          {
            title: '"You Shall Love the Lord Your God"',
            range: [2083, 2195],
            articles: [
              { title: 'The First Commandment', range: [2083, 2141] },
              { title: 'The Second Commandment', range: [2142, 2167] },
              { title: 'The Third Commandment', range: [2168, 2195] }
            ]
          },
          {
            title: '"You Shall Love Your Neighbor as Yourself"',
            range: [2196, 2557],
            articles: [
              { title: 'The Fourth Commandment', range: [2196, 2257] },
              { title: 'The Fifth Commandment', range: [2258, 2330] },
              { title: 'The Sixth Commandment', range: [2331, 2400] },
              { title: 'The Seventh Commandment', range: [2401, 2463] },
              { title: 'The Eighth Commandment', range: [2464, 2513] },
              { title: 'The Ninth Commandment', range: [2514, 2533] },
              { title: 'The Tenth Commandment', range: [2534, 2557] }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Christian Prayer',
    range: [2558, 2865],
    sections: [
      {
        title: 'Prayer in the Christian Life',
        range: [2558, 2758],
        chapters: [
          {
            title: 'The Revelation of Prayer',
            range: [2566, 2649],
            articles: [
              { title: 'In the Old Testament', range: [2568, 2597] },
              { title: 'In the Fullness of Time', range: [2598, 2622] },
              { title: 'In the Age of the Church', range: [2623, 2649] }
            ]
          },
          {
            title: 'The Tradition of Prayer',
            range: [2650, 2696],
            articles: [
              { title: 'At the Wellsprings of Prayer', range: [2652, 2662] },
              { title: 'The Way of Prayer', range: [2663, 2682] },
              { title: 'Guides for Prayer', range: [2683, 2696] }
            ]
          },
          {
            title: 'The Life of Prayer',
            range: [2697, 2758],
            articles: [
              { title: 'Expressions of Prayer', range: [2697, 2724] },
              { title: 'The Battle of Prayer', range: [2725, 2758] }
            ]
          }
        ]
      },
      {
        title: 'The Lord\u2019s Prayer',
        range: [2759, 2865],
        chapters: [
          {
            title: '"The Summary of the Whole Gospel"',
            range: [2761, 2776],
            articles: []
          },
          {
            title: 'The Seven Petitions',
            range: [2777, 2865],
            articles: [
              { title: '"Our Father Who Art in Heaven"', range: [2777, 2802] },
              { title: '"Hallowed Be Thy Name"', range: [2803, 2815] },
              { title: '"Thy Kingdom Come"', range: [2816, 2827] },
              { title: '"Thy Will Be Done on Earth as It Is in Heaven"', range: [2828, 2837] },
              { title: '"Give Us This Day Our Daily Bread"', range: [2828, 2854] },
              { title: '"Forgive Us Our Trespasses"', range: [2838, 2845] },
              { title: '"Lead Us Not into Temptation"', range: [2846, 2854] },
              { title: '"But Deliver Us from Evil"', range: [2850, 2854] },
              { title: 'The Final Doxology', range: [2855, 2865] }
            ]
          }
        ]
      }
    ]
  }
];

// Build flat reverse lookup: paragraphNum → [partIdx, sectionIdx, chapterIdx, articleIdx]
// -1 means "not within a chapter/article". Consumer resolves titles from hierarchy.
function buildLookup(hierarchy) {
  var lookup = {};

  function assign(p, pi, si, ci, ai) {
    if (!lookup[p]) lookup[p] = [pi, si, ci, ai];
  }

  for (var pi = 0; pi < hierarchy.length; pi++) {
    var part = hierarchy[pi];
    for (var si = 0; si < part.sections.length; si++) {
      var section = part.sections[si];

      // Sections without chapters
      if (section.chapters.length === 0) {
        for (var p = section.range[0]; p <= section.range[1]; p++) {
          assign(p, pi, si, -1, -1);
        }
        continue;
      }

      // Paragraphs before first chapter
      var firstChStart = section.chapters[0].range[0];
      for (var p = section.range[0]; p < firstChStart; p++) {
        assign(p, pi, si, -1, -1);
      }

      for (var ci = 0; ci < section.chapters.length; ci++) {
        var chapter = section.chapters[ci];

        if (chapter.articles.length === 0) {
          for (var p = chapter.range[0]; p <= chapter.range[1]; p++) {
            assign(p, pi, si, ci, -1);
          }
        } else {
          // Before first article
          var firstArtStart = chapter.articles[0].range[0];
          for (var p = chapter.range[0]; p < firstArtStart; p++) {
            assign(p, pi, si, ci, -1);
          }

          for (var ai = 0; ai < chapter.articles.length; ai++) {
            var article = chapter.articles[ai];
            for (var p = article.range[0]; p <= article.range[1]; p++) {
              assign(p, pi, si, ci, ai);
            }
          }

          // Gaps between articles + after last article
          for (var p = chapter.range[0]; p <= chapter.range[1]; p++) {
            assign(p, pi, si, ci, -1);
          }
        }

        // Gap between chapters
        if (ci < section.chapters.length - 1) {
          var nextChStart = section.chapters[ci + 1].range[0];
          for (var p = chapter.range[1] + 1; p < nextChStart; p++) {
            assign(p, pi, si, -1, -1);
          }
        }
      }

      // After last chapter
      var lastCh = section.chapters[section.chapters.length - 1];
      for (var p = lastCh.range[1] + 1; p <= section.range[1]; p++) {
        assign(p, pi, si, -1, -1);
      }
    }

    // Gaps between sections
    for (var si = 0; si < part.sections.length - 1; si++) {
      var currEnd = part.sections[si].range[1];
      var nextStart = part.sections[si + 1].range[0];
      for (var p = currEnd + 1; p < nextStart; p++) {
        assign(p, pi, -1, -1, -1);
      }
    }
  }

  return lookup;
}

function run() {
  console.log('Building CCC hierarchy index...');

  var lookup = buildLookup(HIERARCHY);
  var lookupKeys = Object.keys(lookup);
  console.log('  ' + lookupKeys.length + ' paragraphs mapped in reverse lookup');

  // Verify coverage of key paragraphs
  var checks = [1, 100, 500, 1000, 1400, 1700, 2200, 2700, 2865];
  for (var i = 0; i < checks.length; i++) {
    var num = checks[i];
    var idx = lookup[num];
    if (idx) {
      var partT = HIERARCHY[idx[0]].title;
      var secT = idx[1] >= 0 ? HIERARCHY[idx[0]].sections[idx[1]].title : '-';
      var chT = idx[2] >= 0 ? HIERARCHY[idx[0]].sections[idx[1]].chapters[idx[2]].title : '-';
      console.log('  \u00A7' + num + ': ' + partT + ' > ' + secT + ' > ' + chT);
    } else {
      console.log('  \u00A7' + num + ': NOT MAPPED');
    }
  }

  var output = {
    hierarchy: HIERARCHY,
    lookup: lookup
  };

  fs.writeFileSync(OUT, JSON.stringify(output), 'utf8');
  var sizeKB = Math.round(fs.statSync(OUT).size / 1024);
  console.log('\nDone. Output: data/ccc-hierarchy.json (' + sizeKB + 'KB)');
}

run();
