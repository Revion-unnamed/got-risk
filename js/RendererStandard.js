/* ===== renderer.js ===== */
// =============================================================================
// renderer.js
// Reads game state and paints the DOM. Never mutates state.
// All functions are safe to call repeatedly — they fully replace their
// target container's contents on each call.
//
// Standard RISK World Map — 42 territories across 6 continents.
//
// ENTRY POINT: renderGameScreen()
// Called once when the game screen is first shown, then after every
// state change by inputHandler.js.
// =============================================================================


// =============================================================================
// SECTION 1 — TERRITORY SHAPES & LABEL ANCHORS
//
// Each territory has:
//   poly  — SVG points string for its filled shape (on a 960×540 canvas)
//   lx,ly — label / army-badge anchor (visual centre of the shape)
//
// Canvas is 960 × 540.  Ocean fills the background.
// Shapes are hand-drawn polygons that approximate the classic Risk board.
// Continents are geographically separated by ocean gaps.
// =============================================================================

var MAP_VIEWBOX_W = 960;
var MAP_VIEWBOX_H = 540;

// Convenience alias so _renderArmyBadges can still use TERRITORY_COORDS.
// Each entry is {x, y} pointing at the label anchor.
var TERRITORY_COORDS = {};

var TERRITORY_SHAPES = {

  // ── NORTH AMERICA ────────────────────────────────────────────────────────
  // Occupies roughly x 20-290, y 20-290

  "alaska": {
    poly: "55,22 90,20 105,35 100,55 85,70 65,72 42,60 30,42 38,28",
    lx: 70, ly: 47
  },
  "northwest-territory": {
    poly: "105,20 175,18 188,28 185,55 170,65 145,68 120,60 105,45 100,30",
    lx: 148, ly: 42
  },
  "greenland": {
    poly: "220,14 272,10 295,22 300,45 285,68 260,78 230,72 210,55 208,35",
    lx: 256, ly: 44
  },
  "alberta": {
    poly: "105,72 145,68 170,65 185,78 180,105 162,118 135,120 110,112 100,90",
    lx: 145, ly: 96
  },
  "ontario": {
    poly: "185,55 210,52 235,58 248,75 245,105 228,120 205,122 185,118 180,105 185,78",
    lx: 215, ly: 90
  },
  "quebec": {
    poly: "235,58 260,55 280,62 292,80 288,108 270,118 248,115 245,105 248,75",
    lx: 265, ly: 88
  },
  "western-united-states": {
    poly: "100,112 135,120 162,118 180,130 175,168 155,185 125,188 98,175 88,148 92,125",
    lx: 138, ly: 155
  },
  "eastern-united-states": {
    poly: "180,118 205,122 228,120 250,128 258,155 252,182 228,195 200,195 178,182 175,168 180,130",
    lx: 218, ly: 160
  },
  "central-america": {
    poly: "125,188 155,185 175,195 178,218 165,238 145,245 122,238 110,220 112,202",
    lx: 147, ly: 218
  },

  // ── SOUTH AMERICA ────────────────────────────────────────────────────────
  // x 130-295, y 258-480

  "venezuela": {
    poly: "148,258 185,252 215,258 228,275 222,298 200,308 172,308 150,295 142,278",
    lx: 188, ly: 282
  },
  "peru": {
    poly: "142,308 172,308 178,328 172,365 155,385 132,390 118,372 118,345 128,318",
    lx: 150, ly: 352
  },
  "brazil": {
    poly: "172,308 200,308 222,298 240,305 258,320 262,348 248,378 225,392 198,398 172,388 155,368 172,328",
    lx: 215, ly: 352
  },
  "argentina": {
    poly: "132,390 155,385 172,388 198,398 202,428 190,462 168,478 145,468 128,448 125,418 128,400",
    lx: 168, ly: 435
  },

  // ── EUROPE ───────────────────────────────────────────────────────────────
  // x 348-528, y 18-210

  "iceland": {
    poly: "348,42 368,30 392,28 408,38 408,55 390,65 365,62 350,52",
    lx: 382, ly: 48
  },
  "great-britain": {
    poly: "372,82 390,72 408,76 415,95 410,118 395,128 375,122 365,105 365,90",
    lx: 392, ly: 102
  },
  "scandinavia": {
    poly: "428,22 458,18 485,28 495,52 485,78 465,88 442,85 425,68 422,45",
    lx: 460, ly: 55
  },
  "northern-europe": {
    poly: "415,95 440,88 465,88 485,98 488,122 472,138 448,142 425,132 415,118",
    lx: 452, ly: 118
  },
  "western-europe": {
    poly: "365,122 395,128 415,118 425,132 418,162 400,178 375,182 355,168 350,148 355,130",
    lx: 390, ly: 155
  },
  "ukraine": {
    poly: "488,78 512,72 535,78 548,98 545,128 528,145 505,148 485,138 485,118 485,98",
    lx: 518, ly: 112
  },
  "southern-europe": {
    poly: "425,132 448,142 472,138 488,148 490,172 475,188 452,195 428,188 415,172 418,152",
    lx: 455, ly: 168
  },

  // ── AFRICA ───────────────────────────────────────────────────────────────
  // x 348-548, y 210-490

  "north-africa": {
    poly: "350,212 418,208 452,212 488,212 508,225 510,258 492,272 458,278 418,275 380,268 348,252 345,230",
    lx: 432, ly: 248
  },
  "egypt": {
    poly: "488,212 510,208 532,215 548,232 545,258 528,270 510,268 508,252 510,232",
    lx: 522, ly: 242
  },
  "east-africa": {
    poly: "510,268 528,270 545,265 558,282 558,318 542,338 518,348 498,342 490,322 492,292 498,272",
    lx: 526, ly: 308
  },
  "congo": {
    poly: "458,278 492,272 498,292 490,322 472,338 448,342 428,330 422,308 432,285",
    lx: 462, ly: 312
  },
  "south-africa": {
    poly: "428,342 448,342 472,338 490,348 495,375 482,408 458,428 432,430 410,415 405,385 412,355",
    lx: 452, ly: 390
  },
  "madagascar": {
    poly: "542,348 558,338 572,345 575,372 565,395 548,402 535,390 535,362",
    lx: 555, ly: 372
  },

  // ── ASIA ─────────────────────────────────────────────────────────────────
  // x 548-928, y 18-310

  "ural": {
    poly: "548,72 575,65 602,68 618,85 615,118 598,135 572,138 548,128 545,102",
    lx: 585, ly: 102
  },
  "siberia": {
    poly: "602,22 638,18 672,22 688,42 685,72 665,85 638,88 612,82 602,65 598,42",
    lx: 645, ly: 55
  },
  "yakutsk": {
    poly: "688,22 722,18 748,28 752,52 740,72 715,78 692,72 685,52",
    lx: 720, ly: 48
  },
  "kamchatka": {
    poly: "748,28 778,22 808,28 825,48 822,75 805,90 782,92 758,82 748,62 748,42",
    lx: 790, ly: 58
  },
  "irkutsk": {
    poly: "685,78 715,78 740,85 748,108 738,132 715,142 690,138 672,122 672,98",
    lx: 712, ly: 112
  },
  "mongolia": {
    poly: "715,142 738,132 762,135 785,148 788,172 772,188 748,192 722,185 708,168 708,150",
    lx: 748, ly: 165
  },
  "japan": {
    poly: "820,118 835,108 848,115 852,135 845,155 830,162 815,152 812,132",
    lx: 832, ly: 138
  },
  "afghanistan": {
    poly: "548,128 572,138 598,135 618,152 615,178 598,192 572,195 552,182 545,160 545,140",
    lx: 582, ly: 162
  },
  "china": {
    poly: "690,138 715,142 748,135 772,145 788,162 788,192 770,212 742,225 712,228 688,218 668,202 665,175 672,150",
    lx: 730, ly: 190
  },
  "middle-east": {
    poly: "528,195 552,188 572,195 598,192 615,208 612,238 595,255 568,262 545,252 528,235 522,215",
    lx: 572, ly: 228
  },
  "india": {
    poly: "615,178 638,172 665,175 688,192 688,218 672,242 652,265 628,272 608,258 598,235 598,210 615,195",
    lx: 648, ly: 225
  },
  "siam": {
    poly: "712,228 742,225 762,235 768,258 755,282 732,295 708,292 692,275 692,252 698,235",
    lx: 732, ly: 262
  },

  // ── AUSTRALIA ────────────────────────────────────────────────────────────
  // x 720-928, y 318-498

  "indonesia": {
    poly: "720,322 748,315 775,322 782,342 768,358 742,362 720,352 712,338",
    lx: 748, ly: 340
  },
  "new-guinea": {
    poly: "795,308 825,302 855,308 868,325 862,345 840,355 815,352 798,338 792,322",
    lx: 832, ly: 330
  },
  "western-australia": {
    poly: "738,375 768,368 795,372 808,392 808,428 792,455 765,468 738,462 718,442 712,415 718,390",
    lx: 765, ly: 422
  },
  "eastern-australia": {
    poly: "808,368 835,362 862,368 878,388 882,422 868,455 845,472 818,468 800,448 795,415 798,388",
    lx: 848, ly: 418
  }
};

// Populate TERRITORY_COORDS from shape label anchors so _renderArmyBadges works.
(function() {
  for (var id in TERRITORY_SHAPES) {
    TERRITORY_COORDS[id] = { x: TERRITORY_SHAPES[id].lx, y: TERRITORY_SHAPES[id].ly };
  }
})();


var REGION_COLOURS = {
  "north-america": "rgba( 60,120,180,0.14)",
  "south-america": "rgba(180, 80, 40,0.14)",
  "europe":        "rgba(140,100,200,0.13)",
  "africa":        "rgba(200,140, 40,0.14)",
  "asia":          "rgba( 60,160, 80,0.13)",
  "australia":     "rgba(200, 80,140,0.13)"
};

var REGION_LABEL_COLOURS = {
  "north-america": "#3c78b4",
  "south-america": "#b45028",
  "europe":        "#8c64c8",
  "africa":        "#c88c28",
  "asia":          "#3ca050",
  "australia":     "#c85090"
};

// Muted per-continent fill for unowned (neutral) territories.
var REGION_NEUTRAL_FILLS = {
  "north-america": "#2e4a6a",
  "south-america": "#6a3018",
  "europe":        "#483870",
  "africa":        "#6a5018",
  "asia":          "#1e5030",
  "australia":     "#6a2848"
};

var SHORT_NAMES = {
  "alaska":                "Alaska",
  "northwest-territory":   "NW Terr.",
  "greenland":             "Greenland",
  "alberta":               "Alberta",
  "ontario":               "Ontario",
  "quebec":                "Quebec",
  "western-united-states": "W. USA",
  "eastern-united-states": "E. USA",
  "central-america":       "C. America",
  "venezuela":             "Venezuela",
  "peru":                  "Peru",
  "brazil":                "Brazil",
  "argentina":             "Argentina",
  "iceland":               "Iceland",
  "great-britain":         "Gt. Britain",
  "scandinavia":           "Scandinavia",
  "northern-europe":       "N. Europe",
  "western-europe":        "W. Europe",
  "ukraine":               "Ukraine",
  "southern-europe":       "S. Europe",
  "north-africa":          "N. Africa",
  "egypt":                 "Egypt",
  "east-africa":           "E. Africa",
  "congo":                 "Congo",
  "south-africa":          "S. Africa",
  "madagascar":            "Madagascar",
  "ural":                  "Ural",
  "siberia":               "Siberia",
  "yakutsk":               "Yakutsk",
  "kamchatka":             "Kamchatka",
  "irkutsk":               "Irkutsk",
  "mongolia":              "Mongolia",
  "japan":                 "Japan",
  "afghanistan":           "Afghan.",
  "china":                 "China",
  "middle-east":           "Mid. East",
  "india":                 "India",
  "siam":                  "Siam",
  "indonesia":             "Indonesia",
  "new-guinea":            "New Guinea",
  "western-australia":     "W. Austr.",
  "eastern-australia":     "E. Austr."
};

// _buildRegionBlobs() is no longer used — Voronoi renderMap() handles
// region boundary highlighting directly. Kept as empty stub.
function _buildRegionBlobs() { return ""; }


// =============================================================================
// VORONOI HELPERS
// A minimal Bowyer-Watson Delaunay triangulation, used to compute Voronoi
// cells from TERRITORY_COORDS. No external library needed.
// =============================================================================

function _circumcircle(a, b, c) {
  var ax = a.x - c.x, ay = a.y - c.y;
  var bx = b.x - c.x, by = b.y - c.y;
  var D  = 2 * (ax * by - ay * bx);
  if (Math.abs(D) < 1e-10) return null;
  var ux = (by * (ax*ax + ay*ay) - ay * (bx*bx + by*by)) / D;
  var uy = (ax * (bx*bx + by*by) - bx * (ax*ax + ay*ay)) / D;
  var cx = ux + c.x, cy = uy + c.y;
  var dx = a.x - cx, dy = a.y - cy;
  return { cx: cx, cy: cy, r2: dx*dx + dy*dy };
}

function _delaunay(points) {
  var n = points.length;
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 0; i < n; i++) {
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].x > maxX) maxX = points[i].x;
    if (points[i].y > maxY) maxY = points[i].y;
  }
  var dx = maxX - minX, dy = maxY - minY;
  var delta = Math.max(dx, dy) * 10;
  var sp = points.concat([
    { x: minX - delta,       y: minY - delta * 3, id: "__s0" },
    { x: minX + dx / 2,      y: maxY + delta * 3, id: "__s1" },
    { x: maxX + delta * 3,   y: minY - delta,     id: "__s2" }
  ]);
  var triangles = [[n, n+1, n+2]];

  for (var p = 0; p < n; p++) {
    var pt = sp[p];
    var badTri = [];
    for (var t = 0; t < triangles.length; t++) {
      var tri = triangles[t];
      var cc  = _circumcircle(sp[tri[0]], sp[tri[1]], sp[tri[2]]);
      if (!cc) continue;
      var ddx = pt.x - cc.cx, ddy = pt.y - cc.cy;
      if (ddx*ddx + ddy*ddy < cc.r2 + 1e-10) badTri.push(t);
    }
    var polygon = [];
    for (var b = 0; b < badTri.length; b++) {
      var bt = triangles[badTri[b]];
      var edges = [[bt[0],bt[1]],[bt[1],bt[2]],[bt[2],bt[0]]];
      for (var e = 0; e < 3; e++) {
        var shared = false;
        for (var b2 = 0; b2 < badTri.length; b2++) {
          if (b2 === b) continue;
          var bt2 = triangles[badTri[b2]];
          var edges2 = [[bt2[0],bt2[1]],[bt2[1],bt2[2]],[bt2[2],bt2[0]]];
          for (var e2 = 0; e2 < 3; e2++) {
            if ((edges[e][0]===edges2[e2][0] && edges[e][1]===edges2[e2][1]) ||
                (edges[e][0]===edges2[e2][1] && edges[e][1]===edges2[e2][0])) {
              shared = true; break;
            }
          }
          if (shared) break;
        }
        if (!shared) polygon.push(edges[e]);
      }
    }
    var kept = [];
    for (var k = 0; k < triangles.length; k++) {
      var isBad = false;
      for (var bb = 0; bb < badTri.length; bb++) { if (badTri[bb]===k) { isBad=true; break; } }
      if (!isBad) kept.push(triangles[k]);
    }
    triangles = kept;
    for (var pg = 0; pg < polygon.length; pg++) {
      triangles.push([polygon[pg][0], polygon[pg][1], p]);
    }
  }
  var result = [];
  for (var r = 0; r < triangles.length; r++) {
    var tr = triangles[r];
    if (tr[0] < n && tr[1] < n && tr[2] < n) result.push(tr);
  }
  return result;
}

function _voronoiCells(points, triangles, W, H) {
  var n = points.length;
  var cellCircumcentres = [];
  for (var i = 0; i < n; i++) cellCircumcentres.push([]);

  for (var t = 0; t < triangles.length; t++) {
    var tri = triangles[t];
    var cc  = _circumcircle(points[tri[0]], points[tri[1]], points[tri[2]]);
    if (!cc) continue;
    var cx = Math.max(-50, Math.min(W+50, cc.cx));
    var cy = Math.max(-50, Math.min(H+50, cc.cy));
    cellCircumcentres[tri[0]].push({x: cx, y: cy});
    cellCircumcentres[tri[1]].push({x: cx, y: cy});
    cellCircumcentres[tri[2]].push({x: cx, y: cy});
  }

  var cells = {};
  for (var i = 0; i < n; i++) {
    var site = points[i];
    var verts = cellCircumcentres[i];
    if (verts.length < 2) continue;
    verts.sort(function(a, b) {
      return Math.atan2(a.y - site.y, a.x - site.x) -
             Math.atan2(b.y - site.y, b.x - site.x);
    });
    verts = _clipPolygon(verts, W, H), 40;
    if (verts.length >= 3) cells[i] = verts;
  }
  return cells;
}

function _clipPolygon(poly, W, H, margin) {
  margin = margin || 0;
  function _inside(p, edge) {
    if (edge === 0) return p.x >= -margin;
    if (edge === 1) return p.x <= W + margin;
    if (edge === 2) return p.y >= -margin;
    return p.y <= H + margin;
  }
  function _intersect(a, b, edge) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var t;
    if (edge === 0)      t = (-margin    - a.x) / (dx || 1e-10);
    else if (edge === 1) t = (W + margin - a.x) / (dx || 1e-10);
    else if (edge === 2) t = (-margin    - a.y) / (dy || 1e-10);
    else                 t = (H + margin - a.y) / (dy || 1e-10);
    return { x: a.x + t * dx, y: a.y + t * dy };
  }
  var output = poly;
  for (var edge = 0; edge < 4; edge++) {
    if (output.length === 0) return [];
    var input = output; output = [];
    for (var i = 0; i < input.length; i++) {
      var cur  = input[i];
      var prev = input[(i + input.length - 1) % input.length];
      if (_inside(cur, edge)) {
        if (!_inside(prev, edge)) output.push(_intersect(prev, cur, edge));
        output.push(cur);
      } else if (_inside(prev, edge)) {
        output.push(_intersect(prev, cur, edge));
      }
    }
  }
  return output;
}


// =============================================================================
// SECTION 2 — MAP SELECTION STATE
// =============================================================================

var _mapSel = {
  selected:     null,
  source:       null,
  attackable:   [],
  manoeuvrable: []
};

function setMapSelection(sel) {
  _mapSel.selected     = sel.selected     || null;
  _mapSel.source       = sel.source       || null;
  _mapSel.attackable   = sel.attackable   || [];
  _mapSel.manoeuvrable = sel.manoeuvrable || [];
}

function clearMapSelection() {
  _mapSel = { selected: null, source: null, attackable: [], manoeuvrable: [] };
}


// =============================================================================
// SECTION 3 — MAIN ENTRY POINT
// =============================================================================

function renderGameScreen() {
  var state = getState();
  if (state.gameOver) return;
  renderStatusBar();
  renderMap();
  renderPlayerBar();
  renderActionPanel();
  renderLog();
}


// =============================================================================
// SECTION 4 — STATUS BAR
// =============================================================================

function renderStatusBar() {
  var state  = getState();
  var player = state.players[state.currentPlayerIndex];
  var house  = HOUSES[player.houseId];

  var phaseNames = {
    "setup":     "Setup",
    "reinforce": "Reinforce",
    "attack":    "Attack",
    "manoeuvre": "Manoeuvre",
    "draw":      "Draw"
  };

  var phaseEl  = document.getElementById("game-phase-label");
  var playerEl = document.getElementById("game-player-label");
  var turnEl   = document.getElementById("game-turn-label");
  var bar      = document.getElementById("game-status-bar");

  if (phaseEl)  phaseEl.textContent  = phaseNames[state.phase] || state.phase;
  if (playerEl) playerEl.textContent = house.sigil + " " + player.name;
  if (turnEl)   turnEl.textContent   = "Turn " + state.turnNumber;
  if (bar)      bar.style.borderBottomColor = house.color;

  var deckEl = document.getElementById("game-deck-label");
  if (deckEl) {
    deckEl.textContent = state.deck.length + "/" + state.fullDeckSize;
  }
}


// =============================================================================
// SECTION 5 — MAP
// =============================================================================

function renderMap() {
  var mapEl = document.getElementById("game-map");
  if (!mapEl) return;

  var territories = getTerritoryDisplayData();
  var tById = {};
  for (var ti = 0; ti < territories.length; ti++) tById[territories[ti].id] = territories[ti];

  // Build region-of-territory lookup for border colouring.
  var regionOfTerritory = {};
  var regionIds = Object.keys(REGIONS);
  for (var ri = 0; ri < regionIds.length; ri++) {
    var rTerrs = REGIONS[regionIds[ri]].territories;
    for (var rti = 0; rti < rTerrs.length; rti++) regionOfTerritory[rTerrs[rti]] = regionIds[ri];
  }

  var svgFills      = "";
  var svgBorders    = "";
  var svgHighlights = "";
  var svgLabels     = "";
  var svgTapTargets = "";

  var ids = Object.keys(TERRITORY_SHAPES);
  for (var i = 0; i < ids.length; i++) {
    var tid    = ids[i];
    var shape  = TERRITORY_SHAPES[tid];
    var tData  = tById[tid];
    var pts    = shape.poly;
    var lx     = shape.lx;
    var ly     = shape.ly;

    // Determine region tint for neutral, owner colour for owned.
    var region = regionOfTerritory[tid] || "";
    var neutralFill = REGION_NEUTRAL_FILLS[region] || "#3a3830";
    var fill = (!tData || tData.owner === "neutral") ? neutralFill : tData.ownerColor;
    var fillOpacity = (tData && tData.owner !== "neutral") ? "0.82" : "1";

    var isSelected = _mapSel.source === tid;
    var isAttack   = _mapSel.attackable.indexOf(tid)   >= 0;
    var isMan      = _mapSel.manoeuvrable.indexOf(tid) >= 0;

    // Base fill.
    svgFills += '<polygon points="' + pts + '"'
      + ' fill="' + fill + '" fill-opacity="' + fillOpacity + '"'
      + ' stroke="' + (REGION_LABEL_COLOURS[region] || "#555") + '"'
      + ' stroke-width="1.2" stroke-opacity="0.7"'
      + ' class="territory-shape" data-id="' + tid + '"/>';

    // Selection / attack / manoeuvre overlays.
    if (isSelected) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(201,168,76,0.25)" stroke="#c9a84c" stroke-width="3"'
        + ' stroke-dasharray="6 3" pointer-events="none"/>';
    }
    if (isAttack) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(231,76,60,0.20)" stroke="#e74c3c" stroke-width="2.5"'
        + ' stroke-dasharray="4 4" pointer-events="none"/>';
    }
    if (isMan) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(39,174,96,0.18)" stroke="#27ae60" stroke-width="2.5"'
        + ' stroke-dasharray="4 4" pointer-events="none"/>';
    }

    // Territory name label.
    var label = SHORT_NAMES[tid] || tid;
    svgLabels += '<text x="' + lx + '" y="' + (ly - 2) + '"'
      + ' class="territory-label" pointer-events="none">' + label + '</text>';

    // Invisible tap target centred on label anchor.
    svgTapTargets += '<circle cx="' + lx + '" cy="' + ly + '" r="20"'
      + ' fill="transparent" data-id="' + tid + '" class="territory-shape"/>';
  }

  // Assemble SVG — ocean background first, then shapes.
  var svg = '<svg viewBox="0 0 ' + MAP_VIEWBOX_W + ' ' + MAP_VIEWBOX_H + '"'
    + ' xmlns="http://www.w3.org/2000/svg"'
    + ' id="map-svg" style="width:100%;height:100%;display:block;">'
    // Ocean
    + '<rect width="' + MAP_VIEWBOX_W + '" height="' + MAP_VIEWBOX_H + '" fill="#1a3a5c"/>'
    // Subtle ocean texture lines
    + '<line x1="0" y1="135" x2="960" y2="135" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>'
    + '<line x1="0" y1="270" x2="960" y2="270" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>'
    + '<line x1="0" y1="405" x2="960" y2="405" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>'
    + svgFills
    + svgHighlights
    + svgLabels
    + svgTapTargets
    + '</svg>';

  mapEl.innerHTML = '<div id="map-inner">' + svg + '</div>';

  var inner = mapEl.querySelector("#map-inner");
  _renderArmyBadges(inner, territories);

  // Tap listeners.
  var svgEl = mapEl.querySelector("svg");
  if (svgEl) {
    svgEl.addEventListener("click", function(e) {
      var el = e.target;
      while (el && el !== svgEl) {
        var tid = el.getAttribute("data-id");
        if (tid) { handleTerritoryTap(tid); return; }
        el = el.parentNode;
      }
    });
  }

  _initPinchZoom(mapEl, inner);
}

function _initPinchZoom(viewport, inner) {
  var scale     = 1;
  var originX   = 0;
  var originY   = 0;
  var startDist = 0;
  var startScale= 1;
  var MIN_SCALE = 1;
  var MAX_SCALE = 4;

  function _applyTransform() {
    inner.style.transform = "scale(" + scale + ") translate(" + originX + "px," + originY + "px)";
  }

  function _dist(t) {
    var dx = t[0].clientX - t[1].clientX;
    var dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }

  viewport.addEventListener("touchstart", function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      startDist  = _dist(e.touches);
      startScale = scale;
    }
  }, { passive: false });

  viewport.addEventListener("touchmove", function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var newDist   = _dist(e.touches);
      var newScale  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * (newDist / startDist)));
      scale = newScale;
      _applyTransform();
    }
  }, { passive: false });

  viewport.addEventListener("touchend", function(e) {
    if (e.touches.length < 2) {
      // Snap back if zoomed out below 1.
      if (scale < MIN_SCALE) { scale = MIN_SCALE; originX = 0; originY = 0; _applyTransform(); }
    }
  });
}

function _renderArmyBadges(mapEl, territories) {
  // Draw army counts as SVG elements inside the map SVG.
  // Using SVG avoids all HTML-div pixel-offset bugs — coordinates stay
  // in viewBox space, so placement is always exact regardless of CSS layout.
  var svgEl = mapEl.querySelector("svg");
  if (!svgEl) return;

  // Remove any previous badge group.
  var oldGroup = svgEl.querySelector("#army-badge-group");
  if (oldGroup) oldGroup.parentNode.removeChild(oldGroup);

  var ns    = "http://www.w3.org/2000/svg";
  var group = document.createElementNS(ns, "g");
  group.setAttribute("id", "army-badge-group");

  for (var j = 0; j < territories.length; j++) {
    var t     = territories[j];
    var coord = TERRITORY_COORDS[t.id];
    if (!coord) continue;

    // Sit the badge directly on the territory coordinate, just below the label.
    var bx     = coord.x;
    var by     = coord.y + 14;
    var colour = t.owner === "neutral" ? "#555050" : (t.ownerColor || "#aaa");

    // Small filled circle as background.
    var circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", bx);
    circle.setAttribute("cy", by);
    circle.setAttribute("r",  "8");
    circle.setAttribute("fill", colour);
    circle.setAttribute("fill-opacity", "0.9");
    circle.setAttribute("stroke", "rgba(0,0,0,0.55)");
    circle.setAttribute("stroke-width", "1.2");
    circle.setAttribute("pointer-events", "none");
    group.appendChild(circle);

    // Army count centred in the circle.
    var text = document.createElementNS(ns, "text");
    text.setAttribute("x", bx);
    text.setAttribute("y", by + 3.5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "20");
    text.setAttribute("font-weight", "700");
    text.setAttribute("fill", "#fff");
    text.setAttribute("pointer-events", "none");
    text.textContent = t.armies;
    group.appendChild(text);
  }

  svgEl.appendChild(group);
}


// =============================================================================
// SECTION 6 — PLAYER BAR
// =============================================================================

function renderPlayerBar() {
  var bar = document.getElementById("game-player-bar");
  if (!bar) return;

  var players = getPlayerDisplayData();
  var html = "";

  for (var i = 0; i < players.length; i++) {
    var p       = players[i];
    var classes = "player-badge";
    if (p.isCurrentPlayer) classes += " player-badge-active";
    if (p.isEliminated)    classes += " player-badge-eliminated";
    var borderCol = p.isCurrentPlayer ? p.color : "transparent";
    var regionHtml = "";
    if (p.heldRegions && p.heldRegions.length > 0) {
      regionHtml = '<span class="player-badge-regions">' + p.heldRegions.join(" ") + "</span>";
    }
    html += '<div class="' + classes + '" style="border-color:' + borderCol + '">'
      + '<span class="player-badge-sigil">' + p.sigil + "</span>"
      + '<span class="player-badge-name">'
      + (p.name.length > 7 ? p.name.slice(0, 6) + "..." : p.name)
      + "</span>"
      + '<span class="player-badge-count">' + p.territoriesOwned + "T 🃏" + p.cardCount + "</span>"
      + regionHtml
      + "</div>";
  }

  bar.innerHTML = html;
}


// =============================================================================
// SECTION 7 — ACTION PANEL
// =============================================================================

function renderActionPanel() {
  var panel = document.getElementById("game-action-panel");
  if (!panel) return;

  var state  = getState();
  var player = state.players[state.currentPlayerIndex];

  if (mustTradeCards()) {
    var cd = getCardDisplayData();
    panel.innerHTML = '<p class="action-instructions" style="color:#e74c3c">'
      + "You have " + player.cards.length + " cards. Trade a set now.</p>"
      + '<button id="btn-view-cards" class="btn btn-primary" style="width:100%">'
      + "Open Cards (" + cd.nextTradeValue + " armies)</button>";
    return;
  }

  var html = "";

  if (state.phase === "reinforce") {
    var owed = getReinforceCount();
    html = '<p class="action-instructions">Place your armies on owned territories</p>'
      + '<div class="action-army-counter" id="action-army-counter">' + owed + " armies left</div>"
      + '<div class="action-btn-row">'
      + '<button id="btn-view-cards" class="btn btn-secondary">Cards</button>'
      + '<button id="btn-end-reinforce" class="btn btn-primary" disabled>Done</button>'
      + "</div>";

  } else if (state.phase === "attack") {
    if (state.activeAttack && state.activeAttack.resolved && state.activeAttack.conquered) {
      var from   = state.territories[state.activeAttack.fromTerritoryId];
      var minMov = state.activeAttack.attackerDice;
      var maxMov = from ? from.armies - 1 : minMov;
      html = '<p class="action-instructions">Territory captured! Move armies in.</p>'
        + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin:4px 0">'
        + '<button id="btn-occupy-less" class="btn btn-secondary" style="padding:2px 14px;min-height:36px">-</button>'
        + '<span id="occupy-count" style="font-size:1.4rem;font-weight:700;color:#c9a84c">' + minMov + "</span>"
        + '<button id="btn-occupy-more" class="btn btn-secondary" style="padding:2px 14px;min-height:36px">+</button>'
        + "</div>"
        + '<button id="btn-occupy-confirm" class="btn btn-primary" style="width:100%"'
        + ' data-min="' + minMov + '" data-max="' + maxMov + '">Move In</button>';
    } else {
      html = '<p class="action-instructions">Tap your territory to attack from, then tap target</p>'
        + '<div class="action-btn-row">'
        + '<button id="btn-view-cards" class="btn btn-secondary">Cards</button>'
        + '<button id="btn-end-attack" class="btn btn-primary">End Attack</button>'
        + "</div>";
    }

  } else if (state.phase === "manoeuvre") {
    if (state.manoeuvreUsed) {
      html = '<p class="action-instructions">Manoeuvre complete — ending turn...</p>';
    } else {
      html = '<p class="action-instructions">Move armies to one adjacent territory (optional)</p>'
        + '<div class="action-btn-row">'
        + '<button id="btn-skip-manoeuvre" class="btn btn-secondary">Skip</button>'
        + '<button id="btn-end-manoeuvre" class="btn btn-primary" disabled>Done</button>'
        + "</div>";
    }

  } else if (state.phase === "draw") {
    var canDraw = player.conqueredThisTurn;
    html = '<p class="action-instructions">'
      + (canDraw ? "Card drawn. End your turn." : "No conquest this turn.")
      + "</p>"
      + '<button id="btn-end-turn" class="btn btn-primary" style="width:100%">End Turn</button>';

  } else {
    html = '<p class="action-instructions">Loading...</p>';
  }

  panel.innerHTML = html;
}


// =============================================================================
// SECTION 8 — COMBAT MODAL
// =============================================================================

function showCombatModal(fromId, toId) {
  var modal = document.getElementById("combat-modal");
  if (!modal) return;

  var state   = getState();
  var fromT   = state.territories[fromId];
  var toT     = state.territories[toId];
  var fromSt  = TERRITORIES[fromId];
  var toSt    = TERRITORIES[toId];
  var fromH   = fromT && fromT.owner !== "neutral" ? (HOUSES[fromT.owner] || {}) : {};
  var toH     = toT   && toT.owner   !== "neutral" ? (HOUSES[toT.owner]   || {}) : {};

  var maxDice = fromT ? Math.min(3, fromT.armies - 1) : 1;
  var diceHtml = "";
  for (var d = 1; d <= maxDice; d++) {
    diceHtml += '<button class="dice-btn' + (d === maxDice ? " dice-btn-selected" : "") + '"'
      + ' data-dice="' + d + '">' + d + "</button>";
  }

  var content = modal.querySelector(".modal-content");
  if (!content) return;

  content.innerHTML = "<h3>Battle</h3>"
    + '<div class="combat-territories">'
    + '<div class="combat-attacker">'
    + '<span style="font-size:1.4rem">' + (fromH.sigil || "") + "</span>"
    + '<span class="territory-name" style="color:' + (fromH.color || "#aaa") + '">'
    + (fromSt ? fromSt.name : fromId) + "</span>"
    + '<span class="army-count">' + (fromT ? fromT.armies : "?") + " armies</span>"
    + "</div>"
    + '<span class="combat-vs">vs</span>'
    + '<div class="combat-defender">'
    + '<span style="font-size:1.4rem">' + (toH.sigil || "") + "</span>"
    + '<span class="territory-name" style="color:' + (toH.color || "#aaa") + '">'
    + (toSt ? toSt.name : toId) + "</span>"
    + '<span class="army-count">' + (toT ? toT.armies : "?") + " armies</span>"
    + "</div>"
    + "</div>"
    + '<div class="dice-selector">'
    + '<span class="text-sm text-muted">Attack with:</span>'
    + diceHtml
    + "</div>"
    + '<div id="combat-result-area"></div>'
    + '<div class="combat-actions">'
    + '<button id="btn-cancel-attack" class="btn btn-secondary">Cancel</button>'
    + '<button id="btn-roll-attack" class="btn btn-primary"'
    + ' data-from="' + fromId + '" data-to="' + toId + '" data-dice="' + maxDice + '">Roll Dice</button>'
    + "</div>";

  modal.style.display = "flex";

  var diceBtns = content.querySelectorAll(".dice-btn");
  var rollBtn  = content.querySelector("#btn-roll-attack");
  for (var i = 0; i < diceBtns.length; i++) {
    (function(btn) {
      btn.addEventListener("click", function() {
        for (var k = 0; k < diceBtns.length; k++) diceBtns[k].classList.remove("dice-btn-selected");
        btn.classList.add("dice-btn-selected");
        if (rollBtn) rollBtn.setAttribute("data-dice", btn.getAttribute("data-dice"));
      });
    })(diceBtns[i]);
  }
}

function showCombatResult(result) {
  var area = document.getElementById("combat-result-area");
  if (!area) return;

  var aSorted = result.attackerRolls.slice().sort(function(a,b){ return b-a; });
  var dSorted = result.defenderRolls.slice().sort(function(a,b){ return b-a; });

  var html = '<div class="dice-results">';

  html += '<div class="dice-result-row"><span class="text-sm text-muted" style="min-width:60px">Attack</span>';
  for (var i = 0; i < aSorted.length; i++) {
    var aWon = i < dSorted.length ? aSorted[i] > dSorted[i] : true;
    html += '<span class="dice-pip ' + (aWon ? "dice-result-win" : "dice-result-lose") + '">' + aSorted[i] + "</span>";
  }
  html += "</div>";

  html += '<div class="dice-result-row"><span class="text-sm text-muted" style="min-width:60px">Defend</span>';
  for (var j = 0; j < dSorted.length; j++) {
    var dLost = j < aSorted.length ? dSorted[j] < aSorted[j] : false;
    html += '<span class="dice-pip ' + (dLost ? "dice-result-lose" : "dice-result-win") + '">' + dSorted[j] + "</span>";
  }
  html += "</div>";

  html += '<p class="text-sm text-muted" style="text-align:center;margin-top:8px">'
    + "Attacker loses " + result.attackerLosses
    + " | Defender loses " + result.defenderLosses + "</p>";

  if (result.conquered) {
    html += '<p class="text-gold" style="text-align:center;font-weight:700;margin-top:4px">Territory captured!</p>';
  }

  html += "</div>";
  area.innerHTML = html;

  var rollBtn   = document.getElementById("btn-roll-attack");
  var cancelBtn = document.getElementById("btn-cancel-attack");

  if (result.conquered) {
    if (rollBtn)   rollBtn.style.display = "none";
    if (cancelBtn) { cancelBtn.textContent = "Continue"; cancelBtn.id = "btn-close-combat"; }
  } else {
    var state      = getState();
    var fromArmies = state.activeAttack && state.territories[state.activeAttack.fromTerritoryId]
      ? state.territories[state.activeAttack.fromTerritoryId].armies : 0;
    var toArmies   = state.activeAttack && state.territories[state.activeAttack.toTerritoryId]
      ? state.territories[state.activeAttack.toTerritoryId].armies : 0;

    if (fromArmies >= 2 && toArmies > 0) {
      if (rollBtn) { rollBtn.style.display = ""; rollBtn.textContent = "Roll Again"; }
    } else {
      if (rollBtn)   rollBtn.style.display = "none";
      if (cancelBtn) { cancelBtn.textContent = "Close"; cancelBtn.id = "btn-close-combat"; }
    }
  }
}

function hideCombatModal() {
  var modal = document.getElementById("combat-modal");
  if (modal) modal.style.display = "none";
}


// =============================================================================
// SECTION 9 — CARD PANEL
// =============================================================================

function showCardPanel() {
  var panel = document.getElementById("card-panel");
  if (!panel) return;
  _refreshCardPanel();
  panel.style.display = "flex";
}

function hideCardPanel() {
  var panel = document.getElementById("card-panel");
  if (panel) panel.style.display = "none";
}

function _refreshCardPanel() {
  var cardData  = getCardDisplayData();
  var body      = document.getElementById("card-panel-body");
  var tradeInfo = document.getElementById("card-trade-info");
  var tradeBtn  = document.getElementById("btn-trade-cards");
  if (!body) return;

  if (cardData.cards.length === 0) {
    body.innerHTML = '<p class="text-muted text-sm" style="text-align:center;padding:16px">No cards yet.</p>';
  } else {
    var html = "";
    for (var i = 0; i < cardData.cards.length; i++) {
      var card = cardData.cards[i];
      var bonusBadge = card.ownsTerritory
        ? '<span style="font-size:9px;color:#c9a84c;font-weight:700;line-height:1">+2 &#9733;</span>'
        : "";
      html += '<div class="card-item" data-card-index="' + card.index + '">'
        + '<span class="card-item-emoji">'     + card.emoji + "</span>"
        + '<span class="card-item-type">'      + card.label + "</span>"
        + '<span class="card-item-territory">' + (card.territoryName || "Wild") + "</span>"
        + bonusBadge
        + "</div>";
    }
    body.innerHTML = html;
  }

  if (tradeInfo) {
    tradeInfo.textContent = cardData.mustTrade
      ? "Must trade a set now!"
      : "Next trade: " + cardData.nextTradeValue + " armies";
  }
  if (tradeBtn) tradeBtn.disabled = true;

  var items = body.querySelectorAll(".card-item");
  for (var j = 0; j < items.length; j++) {
    (function(item) {
      item.addEventListener("click", function() {
        handleCardTap(parseInt(item.getAttribute("data-card-index"), 10));
      });
    })(items[j]);
  }
}

function updateCardSelection(selectedIndices) {
  var items = document.querySelectorAll("#card-panel-body .card-item");
  for (var i = 0; i < items.length; i++) {
    var idx = parseInt(items[i].getAttribute("data-card-index"), 10);
    var isSelected = false;
    for (var j = 0; j < selectedIndices.length; j++) {
      if (selectedIndices[j] === idx) { isSelected = true; break; }
    }
    if (isSelected) items[i].classList.add("card-selected");
    else            items[i].classList.remove("card-selected");
  }
  var tradeBtn = document.getElementById("btn-trade-cards");
  if (tradeBtn) tradeBtn.disabled = (selectedIndices.length !== 3);
}


// =============================================================================
// SECTION 10 — GAME LOG
// =============================================================================

function renderLog() {
  var logEl = document.getElementById("game-log");
  if (!logEl) return;
  var entries = getLog();
  var html = "";
  var limit = Math.min(entries.length, 6);
  for (var i = 0; i < limit; i++) {
    html += '<p class="log-entry">' + _escHtml(entries[i]) + "</p>";
  }
  logEl.innerHTML = html;
}


// =============================================================================
// SECTION 11 — UTILITIES
// =============================================================================

function _escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


// =============================================================================
// SECTION 12 — AI ACTION OVERLAYS
// =============================================================================

function showTerritoryOverlay(territoryId, emoji, color, duration) {
  var svgEl = document.querySelector("#game-map #map-inner svg");
  if (!svgEl) return;

  var coord = TERRITORY_COORDS[territoryId];
  if (!coord) return;

  var ns = "http://www.w3.org/2000/svg";

  var circle = null;
  if (color) {
    circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", coord.x);
    circle.setAttribute("cy", coord.y + 14);
    circle.setAttribute("r", "10");
    circle.setAttribute("fill", color);
    circle.setAttribute("fill-opacity", "0.85");
    circle.setAttribute("pointer-events", "none");
    svgEl.appendChild(circle);
  }

  var text = document.createElementNS(ns, "text");
  text.setAttribute("x", coord.x);
  text.setAttribute("y", coord.y - 2);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "14");
  text.setAttribute("pointer-events", "none");
  text.textContent = emoji;
  svgEl.appendChild(text);

  setTimeout(function() {
    if (text.parentNode) text.parentNode.removeChild(text);
    if (circle && circle.parentNode) circle.parentNode.removeChild(circle);
  }, duration || 500);
}

function showReinforcePip(territoryId) {
  showTerritoryOverlay(territoryId, "➕", null, 450);
}

function showAttackPip(territoryId, houseColor) {
  showTerritoryOverlay(territoryId, "⚔️", houseColor, 550);
}

// Tap handler stubs — inputHandler.js overwrites these after init.
function handleTerritoryTap(id) {
  console.log("Territory tapped: " + id + " (inputHandler not wired yet)");
}

function handleCardTap(index) {
  console.log("Card tapped: " + index + " (inputHandler not wired yet)");
}
