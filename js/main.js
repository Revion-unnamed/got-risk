/* ===== main.js ===== */
// =============================================================================
// main.js
// Application entry point and screen router.
// Written without async/await for maximum mobile browser compatibility.
// =============================================================================



// -----------------------------------------------------------------------------
// SCREEN REGISTRY
// -----------------------------------------------------------------------------

var SCREENS = [
  "screen-start",
  "screen-player-setup",
  "screen-first-player",
  "screen-game",
  "screen-game-over"
];


// -----------------------------------------------------------------------------
// MODULE STATE
// -----------------------------------------------------------------------------

var _currentScreen       = null;
var _pendingGameOverScores = null;
var _passPhoneOverlay    = null;

var _pendingConfig = {
  mode: GAME_MODES.SKIRMISH,
  players: [],
  firstPlayerIndex: 0
};


// -----------------------------------------------------------------------------
// SCREEN ROUTER
// -----------------------------------------------------------------------------

function showScreen(screenId) {
  SCREENS.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  var target = document.getElementById(screenId);
  if (!target) {
    console.error("showScreen: #" + screenId + " not found in DOM.");
    return;
  }
  target.style.display = "flex";
  _currentScreen = screenId;
  _onScreenEnter(screenId);
}

function getCurrentScreen() {
  return _currentScreen;
}


// -----------------------------------------------------------------------------
// PER-SCREEN ENTRY
// -----------------------------------------------------------------------------

function _onScreenEnter(screenId) {
  if (screenId === "screen-start")        { _setupStartScreen();       return; }
  if (screenId === "screen-player-setup") { _setupPlayerSetupScreen(); return; }
  if (screenId === "screen-first-player") { _setupFirstPlayerScreen(); return; }
  if (screenId === "screen-game")         { _setupGameScreen();        return; }
  if (screenId === "screen-game-over")    { _setupGameOverScreen();    return; }
}


// -----------------------------------------------------------------------------
// SCREEN: START
// -----------------------------------------------------------------------------

function _setupStartScreen() {
  var btn = document.getElementById("btn-start");
  if (!btn) return;
  var fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener("click", function() {
    _pendingConfig = { mode: GAME_MODES.SKIRMISH, players: [], firstPlayerIndex: 0 };
    showScreen("screen-player-setup");
  });
}


// -----------------------------------------------------------------------------
// SCREEN: PLAYER SETUP
// -----------------------------------------------------------------------------

function _setupPlayerSetupScreen() {
  var container = document.getElementById("player-setup-container");
  if (!container) return;
  container.innerHTML = _buildPlayerSetupHTML(3);
  _wirePlayerSetupButtons(container);
}

function _buildPlayerSetupHTML(count) {
  var houseIds = Object.keys(HOUSES);
  var n = Math.min(Math.max(count || 3, 2), 5);

  var countOptions = [2, 3, 4, 5].map(function(num) {
    return '<option value="' + num + '"' + (num === n ? " selected" : "") + ">" + num + " Players</option>";
  }).join("");

  var playerRows = "";
  for (var i = 0; i < n; i++) {
    var defaultHouse = houseIds[i] || houseIds[0];
    var houseOptions = houseIds.map(function(id) {
      var h = HOUSES[id];
      return '<option value="' + id + '"' + (id === defaultHouse ? " selected" : "") + ">" + h.sigil + " " + h.name + "</option>";
    }).join("");

    playerRows += '<div class="player-row" data-player-index="' + i + '">'
      + '<span class="player-label">Player ' + (i + 1) + "</span>"
      + '<input type="text" class="player-name-input" id="player-name-' + i + '" placeholder="Name (optional)" maxlength="20" />'
      + '<select class="house-select" id="house-select-' + i + '">' + houseOptions + "</select>"
      + '<label class="ai-toggle-label"><input type="checkbox" class="ai-toggle" id="ai-toggle-' + i + '" /> AI</label>'
      + "</div>";
  }

  return '<div class="setup-header">'
    + "<h2>Choose Houses</h2>"
    + '<select id="player-count-select" class="player-count-select">' + countOptions + "</select>"
    + "</div>"
    + '<div class="player-rows">' + playerRows + "</div>"
    + '<div class="setup-actions">'
    + '<button id="btn-setup-back" class="btn btn-secondary">Back</button>'
    + '<button id="btn-setup-confirm" class="btn btn-primary">Confirm</button>'
    + "</div>";
}

function _wirePlayerSetupButtons(container) {
  var sel = container.querySelector("#player-count-select");
  if (sel) {
    sel.addEventListener("change", function() {
      container.innerHTML = _buildPlayerSetupHTML(parseInt(sel.value, 10));
      _wirePlayerSetupButtons(container);
    });
  }
  var backBtn = container.querySelector("#btn-setup-back");
  if (backBtn) {
    backBtn.addEventListener("click", function() { showScreen("screen-start"); });
  }
  var confirmBtn = container.querySelector("#btn-setup-confirm");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function() {
      var error = _confirmPlayerSetup(container);
      if (error) { alert(error); }
      else        { showScreen("screen-first-player"); }
    });
  }
}

function _confirmPlayerSetup(container) {
  var rows = container.querySelectorAll(".player-row");
  var players = [];
  var usedHouses = {};

  for (var r = 0; r < rows.length; r++) {
    var i = parseInt(rows[r].getAttribute("data-player-index"), 10);
    var houseEl = container.querySelector("#house-select-" + i);
    var nameEl  = container.querySelector("#player-name-" + i);
    var houseId = houseEl ? houseEl.value : "";
    var rawName = nameEl  ? nameEl.value.trim() : "";

    if (!houseId || !HOUSES[houseId]) return "Player " + (i + 1) + ": select a valid house.";
    if (usedHouses[houseId]) return HOUSES[houseId].name + " is chosen twice.";

    usedHouses[houseId] = true;
    var aiEl  = container.querySelector("#ai-toggle-" + i);
    var isAI  = aiEl ? aiEl.checked : false;
    var name  = rawName || HOUSES[houseId].name;
    if (isAI && !rawName) name = HOUSES[houseId].name + " (AI)";
    players.push({ houseId: houseId, name: name, isAI: isAI });
  }

  _pendingConfig.players = players;
  return null;
}


// -----------------------------------------------------------------------------
// SCREEN: FIRST PLAYER
// -----------------------------------------------------------------------------

function _setupFirstPlayerScreen() {
  var container = document.getElementById("first-player-container");
  if (!container) return;
  container.innerHTML = _buildFirstPlayerHTML();

  var backBtn = container.querySelector("#btn-first-player-back");
  if (backBtn) {
    backBtn.addEventListener("click", function() { showScreen("screen-player-setup"); });
  }
  var rollBtn = container.querySelector("#btn-roll-first");
  if (rollBtn) {
    rollBtn.addEventListener("click", function() { _rollForFirstPlayer(container); });
  }
}

function _buildFirstPlayerHTML() {
  var playerList = _pendingConfig.players.map(function(p, i) {
    var house = HOUSES[p.houseId];
    return '<div class="first-player-row" id="first-player-row-' + i + '">'
      + '<span class="first-player-sigil">' + house.sigil + "</span>"
      + '<span class="first-player-name">'  + p.name      + "</span>"
      + '<span class="first-player-roll" id="first-player-roll-' + i + '">--</span>'
      + "</div>";
  }).join("");

  return "<h2>Who Goes First?</h2>"
    + '<p class="first-player-instructions">Highest roll goes first. Reroll on a tie.</p>'
    + '<div class="first-player-list">' + playerList + "</div>"
    + '<div class="first-player-actions">'
    + '<button id="btn-first-player-back" class="btn btn-secondary">Back</button>'
    + '<button id="btn-roll-first" class="btn btn-primary">Roll Dice</button>'
    + "</div>"
    + '<div id="first-player-result" class="first-player-result"></div>';
}

function _rollForFirstPlayer(container) {
  var players = _pendingConfig.players;
  var rolls = players.map(function() { return Math.floor(Math.random() * 6) + 1; });

  rolls.forEach(function(roll, i) {
    var el = container.querySelector("#first-player-roll-" + i);
    if (el) el.textContent = roll;
  });

  var maxRoll = Math.max.apply(null, rolls);
  var winners = [];
  rolls.forEach(function(r, i) { if (r === maxRoll) winners.push(i); });

  var resultEl = container.querySelector("#first-player-result");

  if (winners.length > 1) {
    rolls.forEach(function(roll, i) {
      var row = container.querySelector("#first-player-row-" + i);
      if (!row) return;
      if (roll === maxRoll) {
        row.classList.add("first-player-tied");
      } else {
        row.classList.remove("first-player-tied");
      }
      row.classList.remove("first-player-winner");
    });
    if (resultEl) resultEl.textContent = "Tie! Roll again.";
    return;
  }

  var winnerIndex = winners[0];
  rolls.forEach(function(roll, i) {
    var row = container.querySelector("#first-player-row-" + i);
    if (!row) return;
    row.classList.remove("first-player-tied");
    if (i === winnerIndex) {
      row.classList.add("first-player-winner");
    } else {
      row.classList.remove("first-player-winner");
    }
  });

  if (resultEl) resultEl.textContent = players[winnerIndex].name + " goes first!";

  // Rotate players so winner is at index 0.
  _pendingConfig.firstPlayerIndex = winnerIndex;
  _pendingConfig.players = _pendingConfig.players.slice(winnerIndex)
    .concat(_pendingConfig.players.slice(0, winnerIndex));

  // Swap Roll button for Start Game.
  var rollBtn = container.querySelector("#btn-roll-first");
  if (rollBtn) {
    var startBtn = rollBtn.cloneNode(true);
    startBtn.textContent = "Start Game";
    startBtn.addEventListener("click", _launchGame);
    rollBtn.parentNode.replaceChild(startBtn, rollBtn);
  }
}

function _launchGame() {
  var result = startNewGame(_pendingConfig);
  if (!result.success) { alert("Could not start game: " + result.error); return; }
  showScreen("screen-game");
}


// -----------------------------------------------------------------------------
// SCREEN: GAME
// renderer.js and inputHandler.js loaded via Promise-based import().
// No async/await — plain .then()/.catch() for older WebView compatibility.
// -----------------------------------------------------------------------------

function _setupGameScreen() {
  // All modules are bundled in app.js — call globals directly.
  try {
    renderGameScreen();
    initInputHandler({
      onGameOver: function(scores) {
        _pendingGameOverScores = scores;
        showScreen("screen-game-over");
      },
      onPassPhone: function(playerName, onReady) {
        _showPassPhoneOverlay(playerName, onReady);
      }
    });
  } catch(err) {
    var map = document.getElementById("game-map");
    if (map) {
      map.innerHTML = '<div style="padding:24px;color:#9e8e78;text-align:center">'
        + '<p style="color:#c9a84c;font-weight:700">Render error</p>'
        + '<p style="font-size:0.8rem;margin-top:8px">' + err.message + '</p>'
        + '</div>';
    }
    console.error("_setupGameScreen error:", err);
  }
}


// -----------------------------------------------------------------------------
// PASS-PHONE OVERLAY
// -----------------------------------------------------------------------------

function _showPassPhoneOverlay(playerName, onReady) {
  if (!_passPhoneOverlay) {
    _passPhoneOverlay = document.createElement("div");
    _passPhoneOverlay.id = "pass-phone-overlay";
    document.body.appendChild(_passPhoneOverlay);
  }

  _passPhoneOverlay.innerHTML = '<div class="pass-phone-content">'
    + '<div class="pass-phone-icon">&#128241;</div>'
    + '<h2 class="pass-phone-title">Pass the Phone</h2>'
    + '<p class="pass-phone-player">' + playerName + "</p>"
    + "<p class=\"pass-phone-sub\">it's your turn</p>"
    + '<button id="btn-im-ready" class="btn btn-primary btn-large">I\'m Ready</button>'
    + "</div>";

  _passPhoneOverlay.style.display = "flex";

  var readyBtn = document.getElementById("btn-im-ready");
  if (readyBtn) {
    readyBtn.addEventListener("click", function() {
      _passPhoneOverlay.style.display = "none";
      onReady();
    });
  }
}


// -----------------------------------------------------------------------------
// SCREEN: GAME OVER
// -----------------------------------------------------------------------------

function _setupGameOverScreen() {
  var container = document.getElementById("game-over-container");
  if (!container) return;
  container.innerHTML = _buildGameOverHTML(_pendingGameOverScores || []);
  var playAgainBtn = container.querySelector("#btn-play-again");
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", function() {
      _pendingGameOverScores = null;
      _pendingConfig = { mode: GAME_MODES.SKIRMISH, players: [], firstPlayerIndex: 0 };
      showScreen("screen-start");
    });
  }
}

function _buildGameOverHTML(scores) {
  var medals = ["1st", "2nd", "3rd"];
  var rows = scores.map(function(s, i) {
    var medal = medals[i] || (i + 1) + "th";
    return '<div class="score-row ' + (i === 0 ? "score-winner" : "") + '">'
      + '<span class="score-medal">'  + medal        + "</span>"
      + '<span class="score-sigil">'  + s.sigil      + "</span>"
      + '<span class="score-name">'   + s.name       + "</span>"
      + '<span class="score-detail">' + s.territories + "T + " + s.castles + "C + " + s.ports + "P</span>"
      + '<span class="score-total">'  + s.score      + " pts</span>"
      + "</div>";
  }).join("");

  var winner = scores[0] || {};
  return '<div class="game-over-header">'
    + '<div class="game-over-icon">&#127942;</div>'
    + '<h2 class="game-over-title">Valar Morghulis</h2>'
    + '<p class="game-over-winner">' + (winner.sigil || "") + " " + (winner.name || "Unknown") + " wins!</p>"
    + "</div>"
    + '<div class="score-list">'
    + '<div class="score-legend"><span>T=territories</span> <span>C=castles</span> <span>P=ports</span></div>'
    + rows
    + "</div>"
    + '<button id="btn-play-again" class="btn btn-primary btn-large">Play Again</button>';
}


// -----------------------------------------------------------------------------
// BOOT
// -----------------------------------------------------------------------------

function _boot() {
  SCREENS.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  // Request a wake lock so the screen stays on during gameplay.
  // The Wake Lock API is supported on Android Chrome/WebView (2020+).
  // We silently ignore errors — the game works fine without it.
  if (navigator.wakeLock) {
    navigator.wakeLock.request("screen").catch(function() {});
  }
  showScreen("screen-start");
}

document.addEventListener("DOMContentLoaded", _boot);


