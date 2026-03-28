// =============================================================================
// main.js
// Application entry point and screen router.
//
// SCREENS (matching div IDs in index.html):
//   "screen-start"        — Title / landing screen
//   "screen-player-setup" — Choose houses and player count
//   "screen-first-player" — Roll dice to decide who goes first
//   "screen-game"         — The main game board
//   "screen-game-over"    — Final scores
// =============================================================================

import { startNewGame }       from "./gameLogic.js";
import { HOUSES, GAME_MODES } from "./boardData.js";

// renderer.js and inputHandler.js are loaded lazily inside _setupGameScreen()
// so the start screen works even before those files are written.
// Once both files exist, move them to top-level imports here.


// -----------------------------------------------------------------------------
// SCREEN REGISTRY
// -----------------------------------------------------------------------------

const SCREENS = [
  "screen-start",
  "screen-player-setup",
  "screen-first-player",
  "screen-game",
  "screen-game-over",
];


// -----------------------------------------------------------------------------
// MODULE STATE
// -----------------------------------------------------------------------------

let _currentScreen = null;

let _pendingConfig = {
  mode: GAME_MODES.SKIRMISH,
  players: [],
  firstPlayerIndex: 0,
};

let _pendingGameOverScores = null;
let _passPhoneOverlay = null;


// -----------------------------------------------------------------------------
// SCREEN ROUTER
// -----------------------------------------------------------------------------

export function showScreen(screenId) {
  if (!SCREENS.includes(screenId)) {
    throw new Error(`showScreen: unknown screen "${screenId}".`);
  }
  SCREENS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(screenId);
  if (!target) throw new Error(`showScreen: #${screenId} not found in DOM.`);
  target.style.display = "flex";
  _currentScreen = screenId;
  _onScreenEnter(screenId);
}

export function getCurrentScreen() {
  return _currentScreen;
}


// -----------------------------------------------------------------------------
// PER-SCREEN ENTRY
// -----------------------------------------------------------------------------

function _onScreenEnter(screenId) {
  switch (screenId) {
    case "screen-start":        _setupStartScreen();       break;
    case "screen-player-setup": _setupPlayerSetupScreen(); break;
    case "screen-first-player": _setupFirstPlayerScreen(); break;
    case "screen-game":         _setupGameScreen();        break;
    case "screen-game-over":    _setupGameOverScreen();    break;
  }
}


// -----------------------------------------------------------------------------
// SCREEN: START
// -----------------------------------------------------------------------------

function _setupStartScreen() {
  const btn = document.getElementById("btn-start");
  if (!btn) return;
  btn.replaceWith(btn.cloneNode(true));
  const freshBtn = document.getElementById("btn-start");
  freshBtn.addEventListener("click", () => {
    _pendingConfig = { mode: GAME_MODES.SKIRMISH, players: [], firstPlayerIndex: 0 };
    showScreen("screen-player-setup");
  });
}


// -----------------------------------------------------------------------------
// SCREEN: PLAYER SETUP
// -----------------------------------------------------------------------------

function _setupPlayerSetupScreen() {
  const container = document.getElementById("player-setup-container");
  if (!container) return;
  container.innerHTML = _buildPlayerSetupHTML();
  _wirePlayerSetupButtons(container);
}

function _buildPlayerSetupHTML(count = 3) {
  const houseIds = Object.keys(HOUSES);
  const clampedCount = Math.min(Math.max(count, 2), 5);

  const countOptions = [2, 3, 4, 5]
    .map((n) => `<option value="${n}" ${n === clampedCount ? "selected" : ""}>${n} Players</option>`)
    .join("");

  const playerRows = Array.from({ length: clampedCount }, (_, i) => {
    const defaultHouse = houseIds[i] ?? houseIds[0];
    const houseOptions = houseIds
      .map((id) => {
        const h = HOUSES[id];
        return `<option value="${id}" ${id === defaultHouse ? "selected" : ""}>${h.sigil} ${h.name}</option>`;
      })
      .join("");

    return `
      <div class="player-row" data-player-index="${i}">
        <span class="player-label">Player ${i + 1}</span>
        <input type="text" class="player-name-input" id="player-name-${i}"
               placeholder="Name (optional)" maxlength="20" />
        <select class="house-select" id="house-select-${i}">${houseOptions}</select>
      </div>`;
  }).join("");

  return `
    <div class="setup-header">
      <h2>Choose Houses</h2>
      <select id="player-count-select" class="player-count-select">${countOptions}</select>
    </div>
    <div class="player-rows">${playerRows}</div>
    <div class="setup-actions">
      <button id="btn-setup-back" class="btn btn-secondary">Back</button>
      <button id="btn-setup-confirm" class="btn btn-primary">Confirm</button>
    </div>`;
}

function _wirePlayerSetupButtons(container) {
  container.querySelector("#player-count-select")?.addEventListener("change", (e) => {
    container.innerHTML = _buildPlayerSetupHTML(parseInt(e.target.value, 10));
    _wirePlayerSetupButtons(container);
  });
  container.querySelector("#btn-setup-back")?.addEventListener("click", () => {
    showScreen("screen-start");
  });
  container.querySelector("#btn-setup-confirm")?.addEventListener("click", () => {
    const error = _confirmPlayerSetup(container);
    if (error) { alert(error); }
    else        { showScreen("screen-first-player"); }
  });
}

function _confirmPlayerSetup(container) {
  const rows = container.querySelectorAll(".player-row");
  const players = [];
  const usedHouses = new Set();

  for (const row of rows) {
    const i = parseInt(row.dataset.playerIndex, 10);
    const houseId = container.querySelector(`#house-select-${i}`)?.value;
    const rawName = container.querySelector(`#player-name-${i}`)?.value.trim();

    if (!houseId || !HOUSES[houseId]) return `Player ${i + 1}: select a valid house.`;
    if (usedHouses.has(houseId)) return `${HOUSES[houseId].name} is chosen twice. Each player needs a different house.`;

    usedHouses.add(houseId);
    players.push({ houseId, name: rawName || HOUSES[houseId].name, isAI: false });
  }

  _pendingConfig.players = players;
  return null;
}


// -----------------------------------------------------------------------------
// SCREEN: FIRST PLAYER
// -----------------------------------------------------------------------------

function _setupFirstPlayerScreen() {
  const container = document.getElementById("first-player-container");
  if (!container) return;
  container.innerHTML = _buildFirstPlayerHTML();
  container.querySelector("#btn-first-player-back")?.addEventListener("click", () => {
    showScreen("screen-player-setup");
  });
  container.querySelector("#btn-roll-first")?.addEventListener("click", () => {
    _rollForFirstPlayer(container);
  });
}

function _buildFirstPlayerHTML() {
  const playerList = _pendingConfig.players.map((p, i) => {
    const house = HOUSES[p.houseId];
    return `
      <div class="first-player-row" id="first-player-row-${i}">
        <span class="first-player-sigil">${house.sigil}</span>
        <span class="first-player-name">${p.name}</span>
        <span class="first-player-roll" id="first-player-roll-${i}">--</span>
      </div>`;
  }).join("");

  return `
    <h2>Who Goes First?</h2>
    <p class="first-player-instructions">Highest roll goes first. Reroll on a tie.</p>
    <div class="first-player-list">${playerList}</div>
    <div class="first-player-actions">
      <button id="btn-first-player-back" class="btn btn-secondary">Back</button>
      <button id="btn-roll-first" class="btn btn-primary">Roll Dice</button>
    </div>
    <div id="first-player-result" class="first-player-result"></div>`;
}

function _rollForFirstPlayer(container) {
  const players = _pendingConfig.players;
  const rolls = players.map(() => Math.floor(Math.random() * 6) + 1);

  rolls.forEach((roll, i) => {
    const el = container.querySelector(`#first-player-roll-${i}`);
    if (el) el.textContent = roll;
  });

  const maxRoll = Math.max(...rolls);
  const winners = rolls.map((r, i) => ({ index: i, roll: r })).filter((r) => r.roll === maxRoll);
  const resultEl = container.querySelector("#first-player-result");

  if (winners.length > 1) {
    rolls.forEach((roll, i) => {
      const row = container.querySelector(`#first-player-row-${i}`);
      row?.classList.toggle("first-player-tied",   roll === maxRoll);
      row?.classList.remove("first-player-winner");
    });
    if (resultEl) resultEl.textContent = "Tie! Roll again.";
    return;
  }

  const winner = winners[0];
  rolls.forEach((_, i) => {
    const row = container.querySelector(`#first-player-row-${i}`);
    row?.classList.remove("first-player-tied");
    row?.classList.toggle("first-player-winner", i === winner.index);
  });

  if (resultEl) resultEl.textContent = `${players[winner.index].name} goes first!`;

  _pendingConfig.firstPlayerIndex = winner.index;
  _pendingConfig.players = [
    ..._pendingConfig.players.slice(winner.index),
    ..._pendingConfig.players.slice(0, winner.index),
  ];

  // Swap Roll button for Start Game
  const rollBtn = container.querySelector("#btn-roll-first");
  if (rollBtn) {
    const startBtn = rollBtn.cloneNode(true);
    startBtn.textContent = "Start Game";
    startBtn.addEventListener("click", _launchGame);
    rollBtn.replaceWith(startBtn);
  }
}

function _launchGame() {
  const result = startNewGame(_pendingConfig);
  if (!result.success) { alert(`Could not start game: ${result.error}`); return; }
  showScreen("screen-game");
}


// -----------------------------------------------------------------------------
// SCREEN: GAME
// renderer.js and inputHandler.js are loaded lazily here.
// This means the start/setup screens work even before those files exist.
// -----------------------------------------------------------------------------

function _setupGameScreen() {
  _loadGameModules().catch((err) => {
    const map = document.getElementById("game-map");
    if (map) {
      map.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;height:100%;gap:16px;
                    color:#9e8e78;font-size:0.9rem;text-align:center;padding:24px;">
          <div style="font-size:2rem">+</div>
          <p><strong style="color:#c9a84c">Game board coming soon</strong></p>
          <p>renderer.js and inputHandler.js not yet written.</p>
          <p style="font-size:0.75rem;color:#5c5040">${err.message}</p>
        </div>`;
    }
  });
}

async function _loadGameModules() {
  const { renderGameScreen } = await import("./renderer.js");
  const { initInputHandler } = await import("./inputHandler.js");

  renderGameScreen();

  initInputHandler({
    onGameOver: (scores) => {
      _pendingGameOverScores = scores;
      showScreen("screen-game-over");
    },
    onPassPhone: (playerName, onReady) => {
      _showPassPhoneOverlay(playerName, onReady);
    },
  });
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

  _passPhoneOverlay.innerHTML = `
    <div class="pass-phone-content">
      <div class="pass-phone-icon">Phone</div>
      <h2 class="pass-phone-title">Pass the Phone</h2>
      <p class="pass-phone-player">${playerName}</p>
      <p class="pass-phone-sub">it's your turn</p>
      <button id="btn-im-ready" class="btn btn-primary btn-large">I'm Ready</button>
    </div>`;

  _passPhoneOverlay.style.display = "flex";

  document.getElementById("btn-im-ready")?.addEventListener("click", () => {
    _passPhoneOverlay.style.display = "none";
    onReady();
  });
}


// -----------------------------------------------------------------------------
// SCREEN: GAME OVER
// -----------------------------------------------------------------------------

function _setupGameOverScreen() {
  const container = document.getElementById("game-over-container");
  if (!container) return;
  container.innerHTML = _buildGameOverHTML(_pendingGameOverScores ?? []);
  container.querySelector("#btn-play-again")?.addEventListener("click", () => {
    _pendingGameOverScores = null;
    _pendingConfig = { mode: GAME_MODES.SKIRMISH, players: [], firstPlayerIndex: 0 };
    showScreen("screen-start");
  });
}

function _buildGameOverHTML(scores) {
  const rows = scores.map((s, i) => {
    const medal = ["1st", "2nd", "3rd"][i] ?? `${i + 1}th`;
    return `
      <div class="score-row ${i === 0 ? "score-winner" : ""}">
        <span class="score-medal">${medal}</span>
        <span class="score-sigil">${s.sigil}</span>
        <span class="score-name">${s.name}</span>
        <span class="score-detail">${s.territories}T + ${s.castles}C + ${s.ports}P</span>
        <span class="score-total">${s.score} pts</span>
      </div>`;
  }).join("");

  const winner = scores[0];
  return `
    <div class="game-over-header">
      <div class="game-over-icon">Trophy</div>
      <h2 class="game-over-title">Valar Morghulis</h2>
      <p class="game-over-winner">${winner?.sigil ?? ""} ${winner?.name ?? "Unknown"} wins!</p>
    </div>
    <div class="score-list">
      <div class="score-legend">
        <span>T = territories</span>
        <span>C = castles</span>
        <span>P = ports</span>
      </div>
      ${rows}
    </div>
    <button id="btn-play-again" class="btn btn-primary btn-large">Play Again</button>`;
}


// -----------------------------------------------------------------------------
// BOOT
// -----------------------------------------------------------------------------

function _boot() {
  SCREENS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  showScreen("screen-start");
}

document.addEventListener("DOMContentLoaded", _boot);
