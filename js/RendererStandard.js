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
// SECTION 1 — ABSTRACT MAP COORDINATES
// Each territory gets an (x, y) position on a 900x520 virtual canvas.
// Roughly matches the proportions of the standard Risk world map.
// West on left, East on right. North at top, South at bottom.
// =============================================================================

var MAP_VIEWBOX_W = 900;
var MAP_VIEWBOX_H = 520;
var NODE_RADIUS   = 16;

var TERRITORY_COORDS = {
  // ── NORTH AMERICA ──────────────────────────────────
  "alaska":                  { x:  68, y:  80 },
  "northwest-territory":     { x: 148, y:  72 },
  "greenland":               { x: 298, y:  44 },
  "alberta":                 { x: 148, y: 132 },
  "ontario":                 { x: 216, y: 148 },
  "quebec":                  { x: 280, y: 140 },
  "western-united-states":   { x: 148, y: 200 },
  "eastern-united-states":   { x: 228, y: 204 },
  "central-america":         { x: 180, y: 268 },

  // ── SOUTH AMERICA ──────────────────────────────────
  "venezuela":               { x: 240, y: 324 },
  "peru":                    { x: 228, y: 388 },
  "brazil":                  { x: 296, y: 376 },
  "argentina":               { x: 256, y: 452 },

  // ── EUROPE ─────────────────────────────────────────
  "iceland":                 { x: 392, y:  60 },
  "great-britain":           { x: 420, y: 120 },
  "scandinavia":             { x: 476, y:  76 },
  "northern-europe":         { x: 472, y: 136 },
  "western-europe":          { x: 420, y: 188 },
  "ukraine":                 { x: 536, y: 124 },
  "southern-europe":         { x: 484, y: 188 },

  // ── AFRICA ─────────────────────────────────────────
  "north-africa":            { x: 452, y: 268 },
  "egypt":                   { x: 524, y: 248 },
  "east-africa":             { x: 556, y: 316 },
  "congo":                   { x: 492, y: 348 },
  "south-africa":            { x: 508, y: 424 },
  "madagascar":              { x: 588, y: 412 },

  // ── ASIA ───────────────────────────────────────────
  "ural":                    { x: 608, y:  88 },
  "siberia":                 { x: 668, y:  68 },
  "yakutsk":                 { x: 736, y:  64 },
  "kamchatka":               { x: 800, y:  88 },
  "irkutsk":                 { x: 716, y: 128 },
  "mongolia":                { x: 724, y: 184 },
  "japan":                   { x: 800, y: 172 },
  "afghanistan":             { x: 600, y: 160 },
  "china":                   { x: 700, y: 216 },
  "middle-east":             { x: 572, y: 236 },
  "india":                   { x: 648, y: 268 },
  "siam":                    { x: 724, y: 284 },

  // ── AUSTRALIA ──────────────────────────────────────
  "indonesia":               { x: 748, y: 352 },
  "new-guinea":              { x: 820, y: 332 },
  "western-australia":       { x: 780, y: 424 },
  "eastern-australia":       { x: 848, y: 412 }
};


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

  var regionOfTerritory = {};
  var regionIds = Object.keys(REGIONS);
  for (var ri = 0; ri < regionIds.length; ri++) {
    var rTerrs = REGIONS[regionIds[ri]].territories;
    for (var rti = 0; rti < rTerrs.length; rti++) regionOfTerritory[rTerrs[rti]] = regionIds[ri];
  }

  var ids    = Object.keys(TERRITORY_COORDS);
  var points = [];
  for (var pi = 0; pi < ids.length; pi++) {
    var c = TERRITORY_COORDS[ids[pi]];
    points.push({ x: c.x, y: c.y, id: ids[pi] });
  }

  var triangles = _delaunay(points);
  var cells     = _voronoiCells(points, triangles, MAP_VIEWBOX_W, MAP_VIEWBOX_H);

  var svgFills      = "";
  var svgRegBorders = "";
  var svgBorders    = "";
  var svgHighlights = "";
  var svgLabels     = "";
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
    var fillOpacity = tData && tData.owner !== "neutral" ? "0.72" : "1";

    var pts = "";
    for (var v = 0; v < poly.length; v++) pts += poly[v].x.toFixed(1) + "," + poly[v].y.toFixed(1) + " ";

    svgFills += '<polygon points="' + pts + '"'
      + ' fill="' + fill + '" fill-opacity="' + fillOpacity + '"'
      + ' class="voronoi-cell" data-id="' + tid + '"/>';

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

    var cx = 0, cy = 0;
    for (var lv = 0; lv < poly.length; lv++) { cx += poly[lv].x; cy += poly[lv].y; }
    cx /= poly.length; cy /= poly.length;
    cx = cx * 0.4 + pt.x * 0.6;
    cy = cy * 0.4 + pt.y * 0.6;

    var labelX = pt.x;
    var labelY = pt.y + 3;

    var label = SHORT_NAMES[tid] || (tData ? (tData.name.length > 9 ? tData.name.slice(0,8)+"." : tData.name) : tid);
    svgLabels += '<text x="' + labelX.toFixed(1) + '" y="' + labelY.toFixed(1) + '"'
      + ' class="territory-label" pointer-events="none">'
      + label + '</text>';

    if (tData && (tData.hasCastle || tData.hasPort)) {
      var badge = (tData.hasCastle ? "⚔" : "") + (tData.hasPort ? "⚓" : "");
      svgLabels += '<text x="' + labelX.toFixed(1) + '" y="' + (labelY - 9).toFixed(1) + '"'
        + ' text-anchor="middle" font-size="7" fill="rgba(232,220,200,0.6)" pointer-events="none">'
        + badge + '</text>';
    }

    svgTapTargets += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="22"'
      + ' fill="transparent" data-id="' + tid + '" class="voronoi-cell"/>';
  }

  // ── Region border edges ───────────────────────────────────────────────────
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
      var nudge = 2;
      var ex = cc2.x - cc1.x, ey = cc2.y - cc1.y;
      var len = Math.sqrt(ex*ex + ey*ey) || 1;
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
      startDist = 0;
    }
  });
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
