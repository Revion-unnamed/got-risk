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
var MAP_VIEWBOX_W = 800;
var MAP_VIEWBOX_H = 1190;
var NODE_RADIUS   = 13;

var TERRITORY_COORDS = {
  // ── THE NORTH ──────────────────────────────────
  "castle-black":    { x: 453, y:  53 },
  "the-gift":        { x: 482, y:  89 },
  "skagos":          { x: 633, y: 101 },
  "karhold":         { x: 586, y: 196 },
  "the-dreadfort":   { x: 553, y: 297 },
  "wolfswood":       { x: 296, y: 255 },
  "winterfell":      { x: 420, y: 327 },
  "barrowlands":     { x: 313, y: 404 },
  "stony-shore":     { x: 153, y: 345 },
  "bear-island":     { x: 250, y: 169 },
  "widows-watch":    { x: 673, y: 398 },
  "white-harbour":   { x: 500, y: 446 },
  "moat-cailin":     { x: 340, y: 517 },

  // ── THE IRON ISLANDS ───────────────────────────
  "pyke":            { x: 186, y: 630 },
  "harlaw":          { x: 253, y: 666 },

  // ── THE RIVERLANDS ─────────────────────────────
  "the-neck":        { x: 340, y: 517 },
  "the-twins":       { x: 420, y: 577 },
  "riverrun":        { x: 366, y: 684 },
  "the-trident":     { x: 433, y: 660 },
  "harrenhal":       { x: 513, y: 731 },

  // ── THE VALE ───────────────────────────────────
  "the-fingers":     { x: 593, y: 541 },
  "the-eyrie":       { x: 673, y: 612 },
  "gulltown":        { x: 740, y: 696 },

  // ── THE WESTERLANDS ────────────────────────────
  "golden-tooth":    { x: 293, y: 731 },
  "oxcross":         { x: 226, y: 767 },
  "casterly-rock":   { x: 186, y: 803 },
  "lannisport":      { x: 146, y: 850 },
  "silverhill":      { x: 273, y: 838 },
  "crakehall":       { x: 193, y: 886 },

  // ── THE CROWNLANDS ─────────────────────────────
  "crackclaw-point": { x: 646, y: 743 },
  "kings-landing":   { x: 573, y: 815 },
  "dragonstone":     { x: 726, y: 803 },
  "blackwater-rush": { x: 446, y: 838 },
  "kingswood":       { x: 586, y: 904 },

  // ── THE REACH ──────────────────────────────────
  "highgarden":      { x: 353, y: 1017 },
  "oldtown":         { x: 186, y: 1082 },
  "three-towers":    { x: 213, y: 1160 },
  "the-mander":      { x: 393, y: 946 },
  "seabed-marches":  { x: 246, y: 952 },
  "the-arbor":       { x: 146, y: 1166 },

  // ── THE STORMLANDS ─────────────────────────────
  "storms-end":      { x: 680, y: 934 },
  "rainwood":        { x: 673, y: 1023 },
  "lornish-marches": { x: 526, y: 993 },
  "tarth":           { x: 766, y: 963 },

  // ── DORNE ──────────────────────────────────────
  "red-mountains":   { x: 453, y: 1059 },
  "sandstone":       { x: 413, y: 1166 },
  "greenblood":      { x: 566, y: 1154 },
  "sunspear":        { x: 740, y: 1160 }
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

function _buildRegionBlobs() {
  var html = "";
  var regionIds = Object.keys(REGIONS);
  for (var r = 0; r < regionIds.length; r++) {
    var regionId   = regionIds[r];
    var region     = REGIONS[regionId];
    var fillColour = REGION_COLOURS[regionId] || "rgba(120,120,120,0.10)";
    var lblColour  = REGION_LABEL_COLOURS[regionId] || "#888";
    var coords = [];
    for (var t = 0; t < region.territories.length; t++) {
      var coord = TERRITORY_COORDS[region.territories[t]];
      if (coord) coords.push(coord);
    }
    if (coords.length === 0) continue;
    var minX =  999, minY =  999, maxX = -999, maxY = -999;
    for (var c = 0; c < coords.length; c++) {
      if (coords[c].x < minX) minX = coords[c].x;
      if (coords[c].y < minY) minY = coords[c].y;
      if (coords[c].x > maxX) maxX = coords[c].x;
      if (coords[c].y > maxY) maxY = coords[c].y;
    }
    var PAD = NODE_RADIUS + 8;
    html += '<rect x="'  + (minX - PAD) + '" y="' + (minY - PAD)
      + '" width="'  + (maxX - minX + PAD * 2)
      + '" height="' + (maxY - minY + PAD * 2)
      + '" rx="14" ry="14"'
      + ' fill="' + fillColour + '"'
      + ' stroke="' + lblColour + '" stroke-width="0.8" stroke-opacity="0.4"'
      + ' pointer-events="none"/>';
    html += '<text x="' + (minX + (maxX - minX) / 2) + '" y="' + (minY - PAD + 8) + '"'
      + ' text-anchor="middle" font-size="7" fill="' + lblColour + '"'
      + ' opacity="0.85" pointer-events="none" font-style="italic">'
      + region.name + "</text>";
  }
  return html;
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
}


// =============================================================================
// SECTION 5 — MAP
// =============================================================================

function renderMap() {
  var mapEl = document.getElementById("game-map");
  if (!mapEl) return;

  var territories = getTerritoryDisplayData();
  var svgLines = "";
  var svgNodes = "";
  var svgRegions = _buildRegionBlobs();

  // Draw connection lines first (so circles sit on top).
  var drawn = {};
  var i, j, t, adjId, key, fc, tc;
  for (i = 0; i < territories.length; i++) {
    t  = territories[i];
    fc = TERRITORY_COORDS[t.id];
    if (!fc) continue;
    for (j = 0; j < t.adjacentTo.length; j++) {
      adjId = t.adjacentTo[j];
      key   = t.id < adjId ? t.id + "|" + adjId : adjId + "|" + t.id;
      if (drawn[key]) continue;
      drawn[key] = true;
      tc = TERRITORY_COORDS[adjId];
      if (!tc) continue;
      svgLines += '<line x1="' + fc.x + '" y1="' + fc.y
        + '" x2="' + tc.x + '" y2="' + tc.y
        + '" class="territory-connection"/>';
    }
  }

  // Draw territory circles.
  for (i = 0; i < territories.length; i++) {
    t = territories[i];
    var coord = TERRITORY_COORDS[t.id];
    if (!coord) continue;

    var isSelected     = _mapSel.selected    === t.id;
    var isSource       = _mapSel.source      === t.id;
    var isAttackable   = _mapSel.attackable.indexOf(t.id)   >= 0;
    var isManoeuvrable = _mapSel.manoeuvrable.indexOf(t.id) >= 0;

    var fill        = t.owner === "neutral" ? "#3a3530" : t.ownerColor;
    var stroke      = "#1a1612";
    var strokeWidth = 1.5;
    if (isSelected || isSource) { stroke = "#c9a84c"; strokeWidth = 3; }

    // Highlight rings (drawn before the circle so circle sits on top of ring)
    if (isAttackable) {
      svgNodes += '<circle cx="' + coord.x + '" cy="' + coord.y
        + '" r="' + (NODE_RADIUS + 5) + '" class="territory-attackable-ring"/>';
    }
    if (isManoeuvrable) {
      svgNodes += '<circle cx="' + coord.x + '" cy="' + coord.y
        + '" r="' + (NODE_RADIUS + 5) + '" class="territory-manoeuvre-ring"/>';
    }
    if (isSelected || isSource) {
      svgNodes += '<circle cx="' + coord.x + '" cy="' + coord.y
        + '" r="' + (NODE_RADIUS + 5) + '" class="territory-selected-ring"/>';
    }

    // Territory circle
    svgNodes += '<circle'
      + ' id="node-' + t.id + '"'
      + ' cx="' + coord.x + '" cy="' + coord.y + '"'
      + ' r="'  + NODE_RADIUS + '"'
      + ' fill="' + fill + '"'
      + ' stroke="' + stroke + '" stroke-width="' + strokeWidth + '"'
      + ' class="territory-node"'
      + ' data-id="' + t.id + '"'
      + '/>';

    // Castle / port badge
    if (t.hasCastle || t.hasPort) {
      svgNodes += '<text x="' + coord.x + '" y="' + (coord.y + 4) + '"'
        + ' text-anchor="middle" font-size="6"'
        + ' fill="rgba(232,220,200,0.55)" pointer-events="none">'
        + (t.hasCastle ? "C" : "") + (t.hasPort ? "P" : "")
        + "</text>";
    }

    // Short name label below circle
    var label = SHORT_NAMES[t.id] || (t.name.length > 8 ? t.name.slice(0, 7) + "." : t.name);
    svgNodes += '<text x="' + coord.x + '" y="' + (coord.y + NODE_RADIUS + 9) + '"'
      + ' class="territory-label" pointer-events="none">'
      + label + "</text>";
  }

  var svg = '<svg viewBox="0 0 ' + MAP_VIEWBOX_W + ' ' + MAP_VIEWBOX_H + '"'
    + ' xmlns="http://www.w3.org/2000/svg"'
    + ' id="map-svg" style="width:100%;height:100%;display:block;">'
    +svgRegions + svgLines + svgNodes
    + "</svg>";

  // Wrap SVG and badges in a scalable inner div.
  mapEl.innerHTML = '<div id="map-inner">' + svg + '</div>';

  // Army badges go inside map-inner so they scale with the SVG.
  var inner = mapEl.querySelector("#map-inner");
  _renderArmyBadges(inner, territories);

  // Tap listeners on the SVG.
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

  // Pinch zoom — applied to map-inner so badges scale with the SVG.
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
  // Remove existing badges.
  var old = mapEl.querySelectorAll(".army-badge");
  for (var i = 0; i < old.length; i++) {
    if (old[i].parentNode) old[i].parentNode.removeChild(old[i]);
  }

  var svgEl = mapEl.querySelector("svg");
  if (!svgEl) return;
  var rect   = svgEl.getBoundingClientRect();
  var scaleX = rect.width  / MAP_VIEWBOX_W;
  var scaleY = rect.height / MAP_VIEWBOX_H;

  for (var j = 0; j < territories.length; j++) {
    var t     = territories[j];
    var coord = TERRITORY_COORDS[t.id];
    if (!coord) continue;

    var badge = document.createElement("div");
    badge.className   = "army-badge";
    badge.textContent = t.armies;
    badge.style.left  = (coord.x * scaleX) + "px";
    badge.style.top   = (coord.y * scaleY) + "px";

    if (t.owner !== "neutral") {
      badge.style.borderColor = t.ownerColor;
      badge.style.color       = t.ownerColor;
    }

    mapEl.appendChild(badge);
  }
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

    html += '<div class="' + classes + '" style="border-color:' + borderCol + '">'
      + '<span class="player-badge-sigil">' + p.sigil + "</span>"
      + '<span class="player-badge-name">'
      + (p.name.length > 7 ? p.name.slice(0, 6) + "..." : p.name)
      + "</span>"
      + '<span class="player-badge-count">' + p.territoriesOwned + " T</span>"
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
      html = '<p class="action-instructions">Manoeuvre done.</p>'
        + '<button id="btn-end-manoeuvre" class="btn btn-primary" style="width:100%">End Turn Phase</button>';
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

// Tap handler stubs — inputHandler.js overwrites these after init.
function handleTerritoryTap(id) {
  console.log("Territory tapped: " + id + " (inputHandler not wired yet)");
}

function handleCardTap(index) {
  console.log("Card tapped: " + index + " (inputHandler not wired yet)");
}


