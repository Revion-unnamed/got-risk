// =============================================================================
// main.js
// Application entry point and screen router.
//
// RESPONSIBILITY:
//   - Boot the application when the page loads.
//   - Own the list of screens and which one is currently visible.
//   - Expose showScreen() so any module can trigger a screen transition.
//   - Wire up screen-level buttons (Start, Back, etc.) that don't belong
//     to any one game phase.
//   - Nothing else. No game logic. No rendering. No state mutation.
//
// SCREENS (matching div IDs in index.html):
//   "screen-start"        — Title / landing screen
//   "screen-player-setup" — Choose houses and player count
//   "screen-first-player" — Roll dice to decide who goes first
//   "screen-game"         — The main game board (owned by renderer + inputHandler)
//   "screen-game-over"    — Final scores
//
// HOW TO ADD A NEW SCREEN:
//   1. Add a <div id="screen-yourname"> in index.html.
//   2. Add "screen-yourname" to SCREENS below.
//   3. Call showScreen("screen-yourname") from wherever the transition happens.
// =============================================================================

import { startNewGame }       from "./gameLogic.js";
import { renderGameScreen }   from "./renderer.js";
import { initInputHandler }   from "./inputHandler.js";
import { HOUSES, GAME_MODES } from "./boardData.js";


// -----------------------------------------------------------------------------
// SCREEN REGISTRY
// All valid screen IDs. Keeps showScreen() safe — typos throw immediately.
// -----------------------------------------------------------------------------

const SCREENS = [
  "screen-start",
  "screen-player-setup",
  "screen-first-player",
  "screen-game",
  "screen-game-over",
];


// -----------------------------------------------------------------------------
// MODULE-LEVEL STATE
// main.js tracks just two things: which screen is showing, and the pending
// game config being built during player setup.
// -----------------------------------------------------------------------------

let _currentScreen = null;

// Built up during player setup, passed to startNewGame() when ready.
let _pendingConfig = {
  mode: GAME_MODES.SKIRMISH,
  players: [],          // [{ houseId, name, isAI: false }, ...]
  firstPlayerIndex: 0,
};


// -----------------------------------------------------------------------------
// SCREEN ROUTER
// -----------------------------------------------------------------------------

/**
 * Shows one screen and hides all others.
 * This is the only way screens should change — never toggle CSS directly
 * from other modules.
 *
 * @param {string} screenId — must be one of the SCREENS array values
 */
export function showScreen(screenId) {
  if (!SCREENS.includes(screenId)) {
    throw new Error(`showScreen: unknown screen "${screenId}". Add it to SCREENS in main.js.`);
  }

  SCREENS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const target = document.getElementById(screenId);
  if (!target) {
    throw new Error(`showScreen: element #${screenId} not found in DOM.`);
  }
  target.style.display = "flex";
  _currentScreen = screenId;

  // Run any per-screen setup logic.
  _onScreenEnter(screenId);
}

/**
 * Returns the ID of the currently visible screen.
 * @returns {string}
 */
export function getCurrentScreen() {
  return _currentScreen;
}


// -----------------------------------------------------------------------------
// PER-SCREEN ENTRY LOGIC
// Called automatically by showScreen(). Keeps setup/teardown collocated
// with the screen it belongs to.
// -----------------------------------------------------------------------------

function _onScreenEnter(screenId) {
  switch (screenId) {
    case "screen-start":
      _setupStartScreen();
      break;
    case "screen-player-setup":
      _setupPlayerSetupScreen();
      break;
    case "screen-first-player":
      _setupFirstPlayerScreen();
      break;
    case "screen-game":
      _setupGameScreen();
      break;
    case "screen-game-over":
      _setupGameOverScreen();
      break;
  }
}


// -----------------------------------------------------------------------------
// SCREEN: START
// -----------------------------------------------------------------------------

function _setupStartScreen() {
  const btn = document.getElementById("btn-start");
  if (!btn) return;

  // Remove any previous listener before adding a new one.
  // (showScreen can be called multiple times — guards against duplicate listeners.)
  btn.replaceWith(btn.cloneNode(true));
  const freshBtn = document.getElementById("btn-start");
  freshBtn.addEventListener("click", () => {
    // Reset pending config each time we start a new setup flow.
    _pendingConfig = {
      mode: GAME_MODES.SKIRMISH,
      players: [],
      firstPlayerIndex: 0,
    };
    showScreen("screen-player-setup");
  });
}


// -----------------------------------------------------------------------------
// SCREEN: PLAYER SETUP
// Players choose houses and how many players are in the game.
// This screen builds _pendingConfig.players[].
// -----------------------------------------------------------------------------

function _setupPlayerSetupScreen() {
  const container = document.getElementById("player-setup-container");
  if (!container) return;

  // Render the setup UI fresh each time.
  container.innerHTML = _buildPlayerSetupHTML();

  // Wire up the player count selector.
  const countSelect = document.getElementById("player-count-select");
  countSelect?.addEventListener("change", () => {
    container.innerHTML = _buildPlayerSetupHTML(parseInt(countSelect.value, 10));
    _wirePlayerSetupButtons(container);
  });

  _wirePlayerSetupButtons(container);
}

/**
 * Builds the player setup HTML for a given player count.
 * Returns an HTML string — no DOM manipulation here, just string building.
 *
 * @param {number} count — number of players (default 3)
 * @returns {string}
 */
function _buildPlayerSetupHTML(count = 3) {
  const houseIds = Object.keys(HOUSES);
  const clampedCount = Math.min(Math.max(count, 2), 5);

  // Build player count selector.
  const countOptions = [2, 3, 4, 5]
    .map((n) => `<option value="${n}" ${n === clampedCount ? "selected" : ""}>${n} Players</option>`)
    .join("");

  // Build a row per player.
  const playerRows = Array.from({ length: clampedCount }, (_, i) => {
    // Default house assignment — first available in order.
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
        <input
          type="text"
          class="player-name-input"
          id="player-name-${i}"
          placeholder="House name"
          maxlength="20"
        />
        <select class="house-select" id="house-select-${i}">
          ${houseOptions}
        </select>
      </div>
    `;
  }).join("");

  return `
    <div class="setup-header">
      <h2>Choose Your Houses</h2>
      <select id="player-count-select" class="player-count-select">
        ${countOptions}
      </select>
    </div>

    <div class="player-rows">
      ${playerRows}
    </div>

    <div class="setup-actions">
      <button id="btn-setup-back" class="btn btn-secondary">← Back</button>
      <button id="btn-setup-confirm" class="btn btn-primary">Confirm →</button>
    </div>
  `;
}

function _wirePlayerSetupButtons(container) {
  // Player count change — rebuild rows.
  const countSelect = container.querySelector("#player-count-select");
  countSelect?.addEventListener("change", () => {
    const newCount = parseInt(countSelect.value, 10);
    container.innerHTML = _buildPlayerSetupHTML(newCount);
    _wirePlayerSetupButtons(container);
  });

  // Back button.
  container.querySelector("#btn-setup-back")?.addEventListener("click", () => {
    showScreen("screen-start");
  });

  // Confirm button — validate and build _pendingConfig.players.
  container.querySelector("#btn-setup-confirm")?.addEventListener("click", () => {
    const error = _confirmPlayerSetup(container);
    if (error) {
      _showSetupError(error);
    } else {
      showScreen("screen-first-player");
    }
  });
}

/**
 * Reads the player setup form, validates it, and populates _pendingConfig.players.
 * Returns an error string if invalid, null if OK.
 *
 * @param {HTMLElement} container
 * @returns {string|null}
 */
function _confirmPlayerSetup(container) {
  const rows = container.querySelectorAll(".player-row");
  const players = [];
  const usedHouses = new Set();

  for (const row of rows) {
    const i = parseInt(row.dataset.playerIndex, 10);
    const nameInput = container.querySelector(`#player-name-${i}`);
    const houseSelect = container.querySelector(`#house-select-${i}`);

    const houseId = houseSelect?.value;
    const rawName = nameInput?.value.trim();

    if (!houseId || !HOUSES[houseId]) {
      return `Player ${i + 1}: please select a valid house.`;
    }
    if (usedHouses.has(houseId)) {
      return `${HOUSES[houseId].name} is chosen by two players. Each player must pick a different house.`;
    }

    usedHouses.add(houseId);
    players.push({
      houseId,
      // If player left name blank, default to the house name.
      name: rawName.length > 0 ? rawName : HOUSES[houseId].name,
      isAI: false,
    });
  }

  _pendingConfig.players = players;
  return null;
}

function _showSetupError(message) {
  // Show error in a simple alert for now.
  // Phase 1 polish: replace with an inline error div.
  alert(`⚠️ ${message}`);
}


// -----------------------------------------------------------------------------
// SCREEN: FIRST PLAYER
// Players physically roll a die (or tap a button) to determine who goes first.
// We simulate a die roll per player and highlight the winner.
// -----------------------------------------------------------------------------

function _setupFirstPlayerScreen() {
  const container = document.getElementById("first-player-container");
  if (!container) return;

  container.innerHTML = _buildFirstPlayerHTML();

  container.querySelector("#btn-roll-first")?.addEventListener("click", () => {
    _rollForFirstPlayer(container);
  });

  container.querySelector("#btn-first-player-back")?.addEventListener("click", () => {
    showScreen("screen-player-setup");
  });
}

function _buildFirstPlayerHTML() {
  const playerList = _pendingConfig.players
    .map((p, i) => {
      const house = HOUSES[p.houseId];
      return `
        <div class="first-player-row" id="first-player-row-${i}">
          <span class="first-player-sigil">${house.sigil}</span>
          <span class="first-player-name">${p.name}</span>
          <span class="first-player-roll" id="first-player-roll-${i}">—</span>
        </div>
      `;
    })
    .join("");

  return `
    <h2>Who Goes First?</h2>
    <p class="first-player-instructions">Each player rolls a die. Highest roll goes first. Reroll on a tie.</p>

    <div class="first-player-list">
      ${playerList}
    </div>

    <div class="first-player-actions">
      <button id="btn-first-player-back" class="btn btn-secondary">← Back</button>
      <button id="btn-roll-first" class="btn btn-primary">🎲 Roll Dice</button>
    </div>

    <div id="first-player-result" class="first-player-result"></div>
  `;
}

/**
 * Rolls one die per player, determines the winner, and updates the UI.
 * Handles ties by re-rolling among tied players.
 * When a clear winner is found, enables the "Start Game" button.
 */
function _rollForFirstPlayer(container) {
  const players = _pendingConfig.players;
  const rolls = players.map(() => Math.floor(Math.random() * 6) + 1);

  // Display rolls.
  rolls.forEach((roll, i) => {
    const el = container.querySelector(`#first-player-roll-${i}`);
    if (el) el.textContent = `🎲 ${roll}`;
  });

  const maxRoll = Math.max(...rolls);
  const winners = rolls
    .map((r, i) => ({ index: i, roll: r }))
    .filter((r) => r.roll === maxRoll);

  const resultEl = container.querySelector("#first-player-result");

  if (winners.length > 1) {
    // Tie — highlight tied players, prompt re-roll.
    rolls.forEach((roll, i) => {
      const row = container.querySelector(`#first-player-row-${i}`);
      row?.classList.toggle("first-player-tied", roll === maxRoll);
      row?.classList.remove("first-player-winner");
    });
    if (resultEl) resultEl.textContent = "Tie! Roll again.";
    return;
  }

  // Clear winner.
  const winner = winners[0];
  rolls.forEach((_, i) => {
    const row = container.querySelector(`#first-player-row-${i}`);
    row?.classList.remove("first-player-tied");
    row?.classList.toggle("first-player-winner", i === winner.index);
  });

  const winnerName = players[winner.index].name;
  if (resultEl) resultEl.textContent = `${winnerName} goes first!`;

  // Store winner and rotate players array so winner is at index 0.
  _pendingConfig.firstPlayerIndex = winner.index;
  _pendingConfig.players = [
    ..._pendingConfig.players.slice(winner.index),
    ..._pendingConfig.players.slice(0, winner.index),
  ];

  // Replace roll button with "Start Game".
  const rollBtn = container.querySelector("#btn-roll-first");
  if (rollBtn) {
    rollBtn.textContent = "⚔️ Start Game";
    rollBtn.replaceWith(rollBtn.cloneNode(true)); // clear old listener
    const startBtn = container.querySelector("#btn-roll-first");
    startBtn.addEventListener("click", _launchGame);
  }
}

/**
 * Calls startNewGame() with the fully built config,
 * then transitions to the game screen.
 */
function _launchGame() {
  const result = startNewGame(_pendingConfig);

  if (!result.success) {
    alert(`⚠️ Could not start game: ${result.error}`);
    return;
  }

  showScreen("screen-game");
}


// -----------------------------------------------------------------------------
// SCREEN: GAME
// The main game board. renderer.js and inputHandler.js own the content
// inside this screen — main.js just signals them that it's time to start.
// -----------------------------------------------------------------------------

function _setupGameScreen() {
  // Tell the renderer to do its first full paint.
  renderGameScreen();

  // Tell inputHandler to start listening for player input.
  initInputHandler({
    onGameOver: (scores) => {
      // inputHandler calls this when the game ends.
      // Store scores for the game-over screen, then navigate there.
      _pendingGameOverScores = scores;
      showScreen("screen-game-over");
    },
    onPassPhone: (playerName, onReady) => {
      // inputHandler calls this between turns, asking us to show
      // a pass-phone overlay before the next player's turn starts.
      _showPassPhoneOverlay(playerName, onReady);
    },
  });
}


// -----------------------------------------------------------------------------
// PASS-PHONE OVERLAY
// Shown between turns so the outgoing player can't see the next player's state.
// This is a full-screen overlay within screen-game, NOT a separate screen.
// -----------------------------------------------------------------------------

let _passPhoneOverlay = null;

/**
 * Shows a full-screen overlay saying "Pass the phone to [player]".
 * Calls onReady() when the next player taps "I'm ready".
 *
 * @param {string}   playerName — the NEXT player's name
 * @param {Function} onReady    — called when the next player confirms
 */
function _showPassPhoneOverlay(playerName, onReady) {
  // Create overlay if it doesn't exist yet.
  if (!_passPhoneOverlay) {
    _passPhoneOverlay = document.createElement("div");
    _passPhoneOverlay.id = "pass-phone-overlay";
    document.body.appendChild(_passPhoneOverlay);
  }

  _passPhoneOverlay.innerHTML = `
    <div class="pass-phone-content">
      <div class="pass-phone-icon">📱</div>
      <h2 class="pass-phone-title">Pass the Phone</h2>
      <p class="pass-phone-player">${playerName}</p>
      <p class="pass-phone-sub">it's your turn</p>
      <button id="btn-im-ready" class="btn btn-primary btn-large">
        I'm Ready ⚔️
      </button>
    </div>
  `;

  _passPhoneOverlay.style.display = "flex";

  document.getElementById("btn-im-ready")?.addEventListener("click", () => {
    _passPhoneOverlay.style.display = "none";
    onReady();
  });
}


// -----------------------------------------------------------------------------
// SCREEN: GAME OVER
// -----------------------------------------------------------------------------

let _pendingGameOverScores = null;

function _setupGameOverScreen() {
  const container = document.getElementById("game-over-container");
  if (!container) return;

  const scores = _pendingGameOverScores ?? [];
  container.innerHTML = _buildGameOverHTML(scores);

  container.querySelector("#btn-play-again")?.addEventListener("click", () => {
    _pendingGameOverScores = null;
    _pendingConfig = { mode: GAME_MODES.SKIRMISH, players: [], firstPlayerIndex: 0 };
    showScreen("screen-start");
  });
}

function _buildGameOverHTML(scores) {
  const rows = scores
    .map((s, i) => {
      const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
      return `
        <div class="score-row ${i === 0 ? "score-winner" : ""}">
          <span class="score-medal">${medal}</span>
          <span class="score-sigil">${s.sigil}</span>
          <span class="score-name">${s.name}</span>
          <span class="score-detail">${s.territories}T + ${s.castles}C + ${s.ports}P</span>
          <span class="score-total">${s.score} pts</span>
        </div>
      `;
    })
    .join("");

  const winner = scores[0];
  return `
    <div class="game-over-header">
      <div class="game-over-icon">🏆</div>
      <h2 class="game-over-title">Valar Morghulis</h2>
      <p class="game-over-winner">
        ${winner?.sigil ?? ""} ${winner?.name ?? "Unknown"} wins!
      </p>
    </div>

    <div class="score-list">
      <div class="score-legend">
        <span>T = territories</span>
        <span>C = castles</span>
        <span>P = ports</span>
      </div>
      ${rows}
    </div>

    <button id="btn-play-again" class="btn btn-primary btn-large">
      Play Again
    </button>
  `;
}


// -----------------------------------------------------------------------------
// BOOT
// Runs once when the page loads.
// -----------------------------------------------------------------------------

/**
 * Initialises the application. Called at the bottom of this file
 * so all functions are defined before it runs.
 */
function _boot() {
  // Hide all screens first (CSS may have one visible for flash-of-content prevention).
  SCREENS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Show the start screen.
  showScreen("screen-start");
}

// Kick off when the DOM is ready.
// Using DOMContentLoaded rather than window.onload — faster, doesn't wait for images.
document.addEventListener("DOMContentLoaded", _boot);
