/* ===== renderer.js ===== */
// =============================================================================
// renderer.js
// Reads game state and paints the DOM. Never mutates state.
// All functions are safe to call repeatedly — they fully replace their
// target container's contents on each call.
//
// ENTRY POINT: renderGameScreen()
// Called once when the game screen is first shown, then after every
// state change by inputHandler.js.
// =============================================================================


// =============================================================================
// SECTION 1 — ABSTRACT MAP COORDINATES
// Each territory gets an (x, y) position on a 300x500 virtual canvas.
// North at top, Dorne at bottom, west coast left, east coast right.
// =============================================================================

var MAP_VIEWBOX_W = 600;
var MAP_VIEWBOX_H = 1000;
var NODE_RADIUS   = 16;

var TERRITORY_COORDS = {
  // ── THE NORTH ──────────────────────────────────
  "castle-black":    { x: 340, y:  44 },
  "the-gift":        { x: 420, y:  70 },
  "skagos":          { x: 516, y:  60 },
  "karhold":         { x: 476, y: 104 },
  "the-dreadfort":   { x: 412, y: 136 },
  "wolfswood":       { x: 240, y: 116 },
  "winterfell":      { x: 316, y: 164 },
  "barrowlands":     { x: 208, y: 192 },
  "stony-shore":     { x: 116, y: 192 },
  "bear-island":     { x:  76, y: 104 },
  "widows-watch":    { x: 464, y: 176 },
  "white-harbour":   { x: 396, y: 216 },
  "moat-cailin":     { x: 276, y: 236 },

  // ── THE IRON ISLANDS ───────────────────────────
  "pyke":            { x:  56, y: 324 },
  "great-wyk":       { x:  20, y: 368 },
  "old-wyk":         { x:  68, y: 380 },
  "harlaw":          { x: 100, y: 340 },

  // ── THE RIVERLANDS ─────────────────────────────
  "cape-kraken":     { x: 124, y: 292 },
  "seagard":         { x: 160, y: 328 },
  "the-twins":       { x: 296, y: 304 },
  "the-neck":        { x: 240, y: 276 },
  "riverrun":        { x: 192, y: 392 },
  "harrenhal":       { x: 316, y: 392 },
  "maidenpool":      { x: 428, y: 344 },

  // ── THE VALE ───────────────────────────────────
  "hearts-home":     { x: 504, y: 276 },
  "the-fingers":     { x: 544, y: 320 },
  "the-eyrie":       { x: 496, y: 328 },
  "gulltown":        { x: 536, y: 372 },

  // ── THE WESTERLANDS ────────────────────────────
  "golden-tooth":    { x: 156, y: 432 },
  "oxcross":         { x: 216, y: 440 },
  "casterly-rock":   { x: 124, y: 464 },
  "lannisport":      { x:  80, y: 492 },
  "cleganes-keep":   { x: 176, y: 488 },
  "silverhill":      { x: 132, y: 528 },

  // ── THE CROWNLANDS ─────────────────────────────
  "crackclaw-point": { x: 436, y: 404 },
  "kings-landing":   { x: 352, y: 464 },
  "dragonstone":     { x: 452, y: 444 },
  "blackwater-rush": { x: 324, y: 512 },

  // ── THE REACH ──────────────────────────────────
  "stoney-sept":     { x: 236, y: 520 },
  "ashford":         { x: 268, y: 564 },
  "highgarden":      { x: 196, y: 616 },
  "oldtown":         { x: 104, y: 732 },
  "three-towers":    { x:  68, y: 636 },
  "horn-hill":       { x: 140, y: 692 },
  "brightwater-keep":{ x: 260, y: 652 },
  "the-mander":      { x: 164, y: 576 },
  "seabed-marches":  { x: 108, y: 572 },

  // ── THE STORMLANDS ─────────────────────────────
  "kingswood":       { x: 340, y: 556 },
  "bronzegate":      { x: 308, y: 592 },
  "storms-end":      { x: 384, y: 632 },
  "rainwood":        { x: 352, y: 696 },
  "lornish-marches": { x: 400, y: 740 },
  "tarth":           { x: 460, y: 644 },

  // ── DORNE ──────────────────────────────────────
  "red-mountains":   { x: 272, y: 776 },
  "yronwood":        { x: 348, y: 804 },
  "the-tor":         { x: 408, y: 812 },
  "sandstone":       { x: 258, y: 836 },
  "greenblood":      { x: 312, y: 868 },
  "planky-town":     { x: 372, y: 860 },
  "sunspear":        { x: 456, y: 884 }
};


var REGION_COLOURS = {
  "the-north":        "rgba(100,130,160,0.13)",
  "the-iron-islands": "rgba( 80,100,130,0.15)",
  "the-riverlands":   "rgba(140,110, 70,0.13)",
  "the-vale":         "rgba(160,140,100,0.13)",
  "the-westerlands":  "rgba(180,150, 20,0.12)",
  "the-crownlands":   "rgba(160, 60, 60,0.13)",
  "the-reach":        "rgba( 60,120, 60,0.13)",
  "the-stormlands":   "rgba(100, 80,150,0.13)",
  "dorne":            "rgba(180,100, 20,0.13)"
};

var REGION_LABEL_COLOURS = {
  "the-north":        "#6482a0",
  "the-iron-islands": "#506082",
  "the-riverlands":   "#8c6e46",
  "the-vale":         "#a08c64",
  "the-westerlands":  "#b49614",
  "the-crownlands":   "#a03c3c",
  "the-reach":        "#3c783c",
  "the-stormlands":   "#645096",
  "dorne":            "#b46414"
};

// _buildRegionBlobs() is no longer used — Voronoi renderMap() handles
// region boundary highlighting directly. Kept as empty stub so any
// accidental calls don't throw.
function _buildRegionBlobs() { return ""; }


// =============================================================================
// VORONOI HELPERS
// A minimal Bowyer-Watson Delaunay triangulation, used to compute Voronoi
// cells from TERRITORY_COORDS. No external library needed.
// =============================================================================

/**
 * Returns the circumcircle of triangle (a, b, c).
 * Each point is {x, y}. Returns {cx, cy, r2} (r2 = radius squared).
 */
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

/**
 * Bowyer-Watson Delaunay triangulation.
 * points = [{x, y, id}, ...]
 * Returns array of triangles, each = [i, j, k] (indices into points).
 */
function _delaunay(points) {
  var n = points.length;
  // Super-triangle that contains all points.
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 0; i < n; i++) {
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].x > maxX) maxX = points[i].x;
    if (points[i].y > maxY) maxY = points[i].y;
  }
  var dx = maxX - minX, dy = maxY - minY;
  var delta = Math.max(dx, dy) * 10;
  // Super-triangle vertices appended to points array (indices n, n+1, n+2).
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
    // Find boundary polygon of bad triangles.
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
    // Remove bad triangles.
    var kept = [];
    for (var k = 0; k < triangles.length; k++) {
      var isBad = false;
      for (var bb = 0; bb < badTri.length; bb++) { if (badTri[bb]===k) { isBad=true; break; } }
      if (!isBad) kept.push(triangles[k]);
    }
    triangles = kept;
    // Add new triangles from polygon.
    for (var pg = 0; pg < polygon.length; pg++) {
      triangles.push([polygon[pg][0], polygon[pg][1], p]);
    }
  }
  // Remove triangles that use super-triangle vertices.
  var result = [];
  for (var r = 0; r < triangles.length; r++) {
    var tr = triangles[r];
    if (tr[0] < n && tr[1] < n && tr[2] < n) result.push(tr);
  }
  return result;
}

/**
 * Computes Voronoi cells from a Delaunay triangulation.
 * Returns a map: pointIndex -> [{x,y}, ...] polygon vertices (unsorted).
 * Cells are clipped to [0, W] x [0, H].
 */
function _voronoiCells(points, triangles, W, H) {
  var n = points.length;
  // For each point, collect circumcentres of all triangles it belongs to.
  var cellCircumcentres = [];
  for (var i = 0; i < n; i++) cellCircumcentres.push([]);

  for (var t = 0; t < triangles.length; t++) {
    var tri = triangles[t];
    var cc  = _circumcircle(points[tri[0]], points[tri[1]], points[tri[2]]);
    if (!cc) continue;
    // Clamp circumcentre to viewport.
    var cx = Math.max(-50, Math.min(W+50, cc.cx));
    var cy = Math.max(-50, Math.min(H+50, cc.cy));
    cellCircumcentres[tri[0]].push({x: cx, y: cy});
    cellCircumcentres[tri[1]].push({x: cx, y: cy});
    cellCircumcentres[tri[2]].push({x: cx, y: cy});
  }

  // Sort each cell's vertices by angle around the site point, then clip.
  var cells = {};
  for (var i = 0; i < n; i++) {
    var site = points[i];
    var verts = cellCircumcentres[i];
    if (verts.length < 2) continue;
    // Sort by angle.
    verts.sort(function(a, b) {
      return Math.atan2(a.y - site.y, a.x - site.x) -
             Math.atan2(b.y - site.y, b.x - site.x);
    });
    // Clip polygon to viewbox using Sutherland-Hodgman.
    verts = _clipPolygon(verts, W, H), 40;
    if (verts.length >= 3) cells[i] = verts;
  }
  return cells;
}

/**
 * Sutherland-Hodgman polygon clipping to rectangle [0,W]x[0,H].
 */
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
    if (edge === 0)      t = (-margin       - a.x) / (dx || 1e-10);
    else if (edge === 1) t = (W + margin    - a.x) / (dx || 1e-10);
    else if (edge === 2) t = (-margin       - a.y) / (dy || 1e-10);
    else                 t = (H + margin    - a.y) / (dy || 1e-10);
    
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

var SHORT_NAMES = {
  "castle-black":    "C.Black",
  "the-gift":        "The Gift",
  "the-dreadfort":   "Dreadfort",
  "wolfswood":       "Wlfswod",
  "barrowlands":     "Barrowl.",
  "stony-shore":     "Stny.Shr",
  "bear-island":     "Bear Isl",
  "widows-watch":    "Wdw.Wtch",
  "white-harbour":   "W.Harbr",
  "moat-cailin":     "M.Cailin",
  "great-wyk":       "Gt.Wyk",
  "old-wyk":         "Old Wyk",
  "cape-kraken":     "C.Kraken",
  "the-twins":       "Twins",
  "the-neck":        "The Neck",
  "the-fingers":     "Fingers",
  "the-eyrie":       "Eyrie",
  "hearts-home":     "Hrt.Home",
  "casterly-rock":   "C.Rock",
  "cleganes-keep":   "Clegane",
  "golden-tooth":    "Gld.Tth",
  "crackclaw-point": "Crkclaw",
  "kings-landing":   "K.Lndng",
  "blackwater-rush": "Blkwtr",
  "stoney-sept":     "Stny.Sep",
  "brightwater-keep":"Brightwtr",
  "three-towers":    "3 Towers",
  "the-mander":      "Mander",
  "seabed-marches":  "Seabed",
  "storms-end":      "Strms.End",
  "lornish-marches": "Lornish",
  "red-mountains":   "Red Mts",
  "sandstone":       "Sandstne",
  "greenblood":      "Grn.Bld",
  "planky-town":     "Planky"
};


// =============================================================================
// SECTION 2 — MAP SELECTION STATE
// inputHandler writes here; renderMap reads it to draw highlights.
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

  // ── Build a lookup: id -> territory display data ──────────────────────────
  var tById = {};
  for (var ti = 0; ti < territories.length; ti++) tById[territories[ti].id] = territories[ti];

  // ── Build territory->region lookup ────────────────────────────────────────
  var regionOfTerritory = {};
  var regionIds = Object.keys(REGIONS);
  for (var ri = 0; ri < regionIds.length; ri++) {
    var rTerrs = REGIONS[regionIds[ri]].territories;
    for (var rti = 0; rti < rTerrs.length; rti++) regionOfTerritory[rTerrs[rti]] = regionIds[ri];
  }

  // ── Gather points in a stable order ───────────────────────────────────────
  var ids    = Object.keys(TERRITORY_COORDS);
  var points = [];
  for (var pi = 0; pi < ids.length; pi++) {
    var c = TERRITORY_COORDS[ids[pi]];
    points.push({ x: c.x, y: c.y, id: ids[pi] });
  }

  // ── Delaunay → Voronoi ────────────────────────────────────────────────────
  var triangles = _delaunay(points);
  var cells     = _voronoiCells(points, triangles, MAP_VIEWBOX_W, MAP_VIEWBOX_H);

  // ── Build SVG layers ──────────────────────────────────────────────────────
  var svgFills      = "";   // layer 1: filled cells
  var svgRegBorders = "";   // layer 2: thick region-boundary edges
  var svgBorders    = "";   // layer 3: thin inter-territory borders
  var svgHighlights = "";   // layer 4: selection / attack / manoeuvre overlays
  var svgLabels     = "";   // layer 5: name + castle/port labels

  // ── Invisible tap targets (one per territory, centred on coord) ───────────
  var svgTapTargets = "";

  for (var i = 0; i < points.length; i++) {
    var pt      = points[i];
    var tid     = pt.id;
    var tData   = tById[tid];
    var poly    = cells[i];
    if (!poly || poly.length < 3) continue;

    var fill        = !tData || tData.owner === "neutral" ? "#2a2520" : tData.ownerColor;
    var isSelected  = _mapSel.source      === tid;
    var isAttack    = _mapSel.attackable.indexOf(tid)   >= 0;
    var isMan       = _mapSel.manoeuvrable.indexOf(tid) >= 0;

    // Slightly darken neutral, lighten owned for contrast.
    var fillOpacity = tData && tData.owner !== "neutral" ? "0.72" : "1";

    // Build polygon points string.
    var pts = "";
    for (var v = 0; v < poly.length; v++) pts += poly[v].x.toFixed(1) + "," + poly[v].y.toFixed(1) + " ";

    // Cell fill.
    svgFills += '<polygon points="' + pts + '"'
      + ' fill="' + fill + '" fill-opacity="' + fillOpacity + '"'
      + ' class="voronoi-cell" data-id="' + tid + '"/>';

    // Highlight overlays.
    if (isSelected) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(201,168,76,0.22)" stroke="#c9a84c" stroke-width="3"'
        + ' stroke-dasharray="6 3" fill-rule="nonzero"'
        + ' class="territory-selected-ring" pointer-events="none"/>';
    }
    if (isAttack) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(231,76,60,0.18)" stroke="#e74c3c" stroke-width="2.5"'
        + ' stroke-dasharray="4 4"'
        + ' class="territory-attackable-ring" pointer-events="none"/>';
    }
    if (isMan) {
      svgHighlights += '<polygon points="' + pts + '"'
        + ' fill="rgba(39,174,96,0.15)" stroke="#27ae60" stroke-width="2.5"'
        + ' stroke-dasharray="4 4"'
        + ' pointer-events="none"/>';
    }

    // Short name label at centroid.
    var cx = 0, cy = 0;
    for (var lv = 0; lv < poly.length; lv++) { cx += poly[lv].x; cy += poly[lv].y; }
    cx /= poly.length; cy /= poly.length;
    // Nudge label toward actual coord so it stays visually inside the cell.
    cx = cx * 0.4 + pt.x * 0.6;
    cy = cy * 0.4 + pt.y * 0.6;

    // Label anchored directly on the territory's seed coordinate.
    var labelX = pt.x;
    var labelY = pt.y + 3;  // slight downward nudge so text sits on the point

    var label = SHORT_NAMES[tid] || (tData ? (tData.name.length > 8 ? tData.name.slice(0,7)+"." : tData.name) : tid);
    svgLabels += '<text x="' + labelX.toFixed(1) + '" y="' + labelY.toFixed(1) + '"'
      + ' class="territory-label" pointer-events="none">'
      + label + '</text>';

    // Castle / port tiny indicator — sits just above the name.
    if (tData && (tData.hasCastle || tData.hasPort)) {
      var badge = (tData.hasCastle ? "⚔" : "") + (tData.hasPort ? "⚓" : "");
      svgLabels += '<text x="' + labelX.toFixed(1) + '" y="' + (labelY - 9).toFixed(1) + '"'
        + ' text-anchor="middle" font-size="7" fill="rgba(232,220,200,0.6)" pointer-events="none">'
        + badge + '</text>';
    }

    // Large invisible tap target centred on the territory coordinate.
    svgTapTargets += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="22"'
      + ' fill="transparent" data-id="' + tid + '" class="voronoi-cell"/>';
  }

  // ── Region border edges ───────────────────────────────────────────────────
  // Walk every Delaunay edge. If the two endpoints belong to different regions,
  // draw the Voronoi dual edge (the shared cell boundary) in the region colour.
  // We identify shared Voronoi edges as the line between the circumcentres of
  // the two triangles that share that Delaunay edge.

  // Build triangle circumcentres.
  var triCC = [];
  for (var tt = 0; tt < triangles.length; tt++) {
    var tr = triangles[tt];
    var cc = _circumcircle(points[tr[0]], points[tr[1]], points[tr[2]]);
    if (cc) {
      triCC.push({
        x: Math.max(-50, Math.min(MAP_VIEWBOX_W+50, cc.cx)),
        y: Math.max(-50, Math.min(MAP_VIEWBOX_H+50, cc.cy))
      });
    } else {
      triCC.push(null);
    }
  }

  // For each Delaunay edge, find the two triangles that share it.
  // edgeKey -> [triIndex, triIndex]
  var edgeToTri = {};
  for (var tt2 = 0; tt2 < triangles.length; tt2++) {
    var tr2 = triangles[tt2];
    var edges = [[tr2[0],tr2[1]],[tr2[1],tr2[2]],[tr2[2],tr2[0]]];
    for (var ee = 0; ee < 3; ee++) {
      var a = edges[ee][0], b = edges[ee][1];
      var ek = a < b ? a+"|"+b : b+"|"+a;
      if (!edgeToTri[ek]) edgeToTri[ek] = [];
      edgeToTri[ek].push(tt2);
    }
  }

  var drawnEdges = {};
  for (var ek in edgeToTri) {
    if (drawnEdges[ek]) continue;
    drawnEdges[ek] = true;
    var parts   = ek.split("|");
    var idxA    = parseInt(parts[0], 10);
    var idxB    = parseInt(parts[1], 10);
    var idA     = points[idxA] ? points[idxA].id : null;
    var idB     = points[idxB] ? points[idxB].id : null;
    if (!idA || !idB) continue;
    var regA    = regionOfTerritory[idA];
    var regB    = regionOfTerritory[idB];
    var tris    = edgeToTri[ek];
    if (tris.length < 2) continue;
    var cc1     = triCC[tris[0]];
    var cc2     = triCC[tris[1]];
    if (!cc1 || !cc2) continue;


    if (regA !== regB) {
  // Draw two lines, one per side, each nudged 2 units toward its seed.
  var nudge = 2;
  var ex = cc2.x - cc1.x, ey = cc2.y - cc1.y;
  var len = Math.sqrt(ex*ex + ey*ey) || 1;
  // Perpendicular pointing from edge toward point A's seed.
  var sA = points[idxA], sB = points[idxB];
  var mx = (cc1.x + cc2.x) / 2, my = (cc1.y + cc2.y) / 2;
  var toA = { x: sA.x - mx, y: sA.y - my };
  var toAlen = Math.sqrt(toA.x*toA.x + toA.y*toA.y) || 1;
  var nA = { x: toA.x/toAlen * nudge, y: toA.y/toAlen * nudge };
  var nB = { x: -nA.x, y: -nA.y };
  var regColourA = REGION_LABEL_COLOURS[regA] || "#888";
  var regColourB = REGION_LABEL_COLOURS[regB] || "#888";
  svgRegBorders += '<line x1="'+(cc1.x+nA.x).toFixed(1)+'" y1="'+(cc1.y+nA.y).toFixed(1)
    +'" x2="'+(cc2.x+nA.x).toFixed(1)+'" y2="'+(cc2.y+nA.y).toFixed(1)+'"'
    +' stroke="'+regColourA+'" stroke-width="2.5" stroke-opacity="0.9" pointer-events="none"/>';
  svgRegBorders += '<line x1="'+(cc1.x+nB.x).toFixed(1)+'" y1="'+(cc1.y+nB.y).toFixed(1)
    +'" x2="'+(cc2.x+nB.x).toFixed(1)+'" y2="'+(cc2.y+nB.y).toFixed(1)+'"'
    +' stroke="'+regColourB+'" stroke-width="3.5" stroke-opacity="0.9" pointer-events="none"/>';
} else {
  svgBorders += '<line x1="' + cc1.x.toFixed(1) + '" y1="' + cc1.y.toFixed(1)
    + '" x2="' + cc2.x.toFixed(1) + '" y2="' + cc2.y.toFixed(1) + '"'
    + ' stroke="rgba(0,0,0,0.7)" stroke-width="1.5"'
    + ' pointer-events="none"/>';
}
    
    
  }

  // ── Assemble SVG ──────────────────────────────────────────────────────────
  var svg = '<svg viewBox="0 0 ' + MAP_VIEWBOX_W + ' ' + MAP_VIEWBOX_H + '"'
    + ' xmlns="http://www.w3.org/2000/svg"'
    + ' id="map-svg" style="width:100%;height:100%;display:block;">'
    + '<rect width="' + MAP_VIEWBOX_W + '" height="' + MAP_VIEWBOX_H + '" fill="#0f1a24"/>'
    + svgFills
    + svgBorders
    + svgRegBorders
    + svgHighlights
    + svgLabels
    + svgTapTargets
    + '</svg>';

  mapEl.innerHTML = '<div id="map-inner">' + svg + '</div>';

  var inner = mapEl.querySelector("#map-inner");
  _renderArmyBadges(inner, territories);

  // Tap listeners — voronoi-cell class on both polygons and tap-target circles.
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

  // Wire dice selector.
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

  // Wire card taps — inputHandler handles selection logic.
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
// Brief visual indicators shown during AI turns.
// =============================================================================

/**
 * Flashes a small emoji over a territory for `duration` ms then removes it.
 * emoji  — e.g. "➕" or "⚔️"
 * color  — background colour (house color for attacks, transparent for reinforce)
 */
function showTerritoryOverlay(territoryId, emoji, color, duration) {
  var mapEl = document.getElementById("game-map");
  if (!mapEl) return;

  var coord = TERRITORY_COORDS[territoryId];
  if (!coord) return;

var inner  = mapEl.querySelector("#map-inner") || mapEl;
  var svgEl  = inner.querySelector("svg");
  if (!svgEl) return;

  // Use the inner container's actual size for scaling.
  // Falls back to viewBox ratio if layout hasn't painted yet.
  var containerW = inner.offsetWidth  || mapEl.offsetWidth  || MAP_VIEWBOX_W;
  var containerH = inner.offsetHeight || mapEl.offsetHeight || MAP_VIEWBOX_H;
  var scaleX = containerW / MAP_VIEWBOX_W;
  var scaleY = containerH / MAP_VIEWBOX_H;

  var el = document.createElement("div");
  el.className = "ai-overlay-pip";
  el.textContent = emoji;
  el.style.left = (coord.x * scaleX) + "px";
  el.style.top  = (coord.y * scaleY) + "px";
  
  if (color) {
    el.style.background = color;
  }

  setTimeout(function() {
    if (el.parentNode) el.parentNode.removeChild(el);
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


