/* ===== gameState.js ===== */
// =============================================================================
// gameState.js
// The single source of truth for all live game data.
//
// ARCHITECTURE RULE:
//   - Only this file owns the _state object.
//   - All other files READ state via getState() — which returns a copy.
//   - All other files WRITE state via the exported mutator functions below.
//   - Never import _state directly from outside this file.
//   - This makes bugs trackable: if state is wrong, the cause is always
//     one of the mutator functions in this file.
//
// HOW TO ADD NEW STATE (e.g. for Domination mode later):
//   1. Add the field to _createInitialState() with a sensible default.
//   2. Add a mutator function that validates + updates just that field.
//   3. Update getState() if you need to expose derived data.
// =============================================================================



// -----------------------------------------------------------------------------
// CONSTANTS — turn phases in order
// Used to validate phase transitions and drive UI rendering.
// -----------------------------------------------------------------------------

const PHASES = {
  SETUP:      "setup",       // Initial army placement
  REINFORCE:  "reinforce",   // Player places earned armies
  ATTACK:     "attack",      // Player attacks (optional)
  MANOEUVRE:  "manoeuvre",   // Player moves armies (optional, once)
  DRAW:       "draw",        // Draw a territory card if earned
};

const GAME_MODES = {
  SKIRMISH:    "skirmish",
  DOMINATION:  "domination",   // Phase 2 — stubbed
  WORLDATWAR:  "worldatwar",   // Phase 3 — stubbed
};


// -----------------------------------------------------------------------------
// PRIVATE STATE
// Never accessed directly outside this file.
// -----------------------------------------------------------------------------

let _state = null;


// -----------------------------------------------------------------------------
// PRIVATE HELPERS
// Internal utility functions — not exported.
// -----------------------------------------------------------------------------

/**
 * Deep-clones a plain JS object safely.
 * Used to return state snapshots without exposing internal references.
 * NOTE: Only works for plain objects/arrays/primitives — fine for our state.
 */
function _deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Builds the initial territory state from boardData.
 * Each territory starts with no owner and 0 armies —
 * the setup phase will assign owners and place armies.
 *
 * We store ONLY the mutable runtime fields here.
 * Static data (name, region, adjacentTo, etc.) stays in boardData.js
 * and is looked up when needed — we never duplicate it in state.
 */
function _buildInitialTerritoryState() {
  const territories = {};
  for (const id of Object.keys(TERRITORIES)) {
    territories[id] = {
      owner: "neutral",   // house id string, or "neutral"
      armies: 0,
    };
  }
  return territories;
}

/**
 * Builds a player object for the given house id and options.
 *
 * @param {string} houseId     — must be a key in HOUSES
 * @param {string} playerName  — display name (can be same as house name)
 * @param {boolean} isAI       — true = AI-controlled (Phase 4)
 * @returns {object}
 */
function _createPlayer(houseId, playerName, isAI = false) {
  return {
    houseId,                    // links to HOUSES[houseId] for static data
    name: playerName,
    isAI,
    isEliminated: false,
    cards: [],                  // territory cards in hand: [{ territoryId, cardType }]
    cardSetsTraded: 0,          // cumulative sets traded this game (for escalating values)
    conqueredThisTurn: false,   // set true when ≥1 territory taken this turn → earns card draw

    // Domination mode fields — stubbed here so state shape never changes.
    // gameLogic.js will ignore these in Skirmish mode.
    gold: 0,
    victoryPoints: 0,
    characterCards: [],         // Phase 2
    objectiveCards: [],         // Phase 2
  };
}

/**
 * Creates and returns a fresh, blank game state.
 * Called once at the start of a new game.
 *
 * @param {object} config
 * @param {string}   config.mode        — from GAME_MODES
 * @param {Array}    config.players     — array of { houseId, name, isAI }
 */
function _createInitialState(config) {
  const players = config.players.map((p) =>
    _createPlayer(p.houseId, p.name, p.isAI ?? false)
  );

  // Build and shuffle the territory card deck.
  // Then find the Valar Morghulis position:
  //   take the bottom half, shuffle in the end-game card, place top half back.
  const fullDeck = shuffle(buildCardDeck());
  const midpoint = Math.floor(fullDeck.length / 2);
  const topHalf = fullDeck.slice(0, midpoint);
  const bottomHalf = fullDeck.slice(midpoint);
  bottomHalf.push({ territoryId: null, cardType: "valar-morghulis" });
  const finalDeck = [...topHalf, ...shuffle(bottomHalf)];

  return {
    // ── Meta ────────────────────────────────────────────────────────────────
    mode: config.mode ?? GAME_MODES.SKIRMISH,
    phase: PHASES.SETUP,
    turnNumber: 1,

    // ── Players ─────────────────────────────────────────────────────────────
    players,                          // ordered array; index = turn order
    currentPlayerIndex: 0,            // whose turn it is

    // ── Setup tracking ──────────────────────────────────────────────────────
    // During setup, players take turns placing one army at a time.
    // setupArmiesRemaining tracks how many each player still has to place.
    setupArmiesRemaining: players.map(() => 0),  // filled by initSetupArmies()
    setupComplete: false,

    // ── Territories ─────────────────────────────────────────────────────────
    // Mutable runtime data only. Static data lives in boardData.TERRITORIES.
    territories: _buildInitialTerritoryState(),

    // ── Card deck ───────────────────────────────────────────────────────────
    deck: finalDeck,
    fullDeckSize: finalDeck.length, 
    discardPile: [],

    // ── Attack tracking ─────────────────────────────────────────────────────
    // Set during the attack phase to track the active combat.
    activeAttack: null,
    /*
      activeAttack shape (when combat is happening):
      {
        fromTerritoryId: string,
        toTerritoryId:   string,
        attackerDice:    number,   // how many dice attacker chose (1–3)
        defenderDice:    number,   // how many dice defender chose (1–2)
        attackerRolls:   number[], // results e.g. [6, 4, 2]
        defenderRolls:   number[], // results e.g. [5, 3]
        attackerLosses:  number,
        defenderLosses:  number,
        resolved:        boolean,
        conquered:       boolean,  // true if territory was taken this roll
      }
    */

    // ── Manoeuvre tracking ──────────────────────────────────────────────────
    manoeuvreUsed: false,       // reset each turn; only one manoeuvre allowed

    // ── End game ────────────────────────────────────────────────────────────
    valarMorghulisDrawn: false,
    gameOver: false,
    winner: null,               // houseId string or null

    // ── Game log ────────────────────────────────────────────────────────────
    // Array of plain strings; newest entries at the front (unshift).
    // Renderer shows the first N entries. Capped at LOG_MAX_ENTRIES.
    log: [],
  };
}


// -----------------------------------------------------------------------------
// PUBLIC API — Initialisation
// -----------------------------------------------------------------------------

/**
 * Starts a brand new game. Must be called before any other function.
 *
 * @param {object} config
 * @param {string}   config.mode      — GAME_MODES value
 * @param {Array}    config.players   — [{ houseId, name, isAI? }, ...]
 *                                       2–5 players for Skirmish/Domination
 */
function initGame(config) {
  if (!config.players || config.players.length < 2 || config.players.length > 7) {
    throw new Error("initGame: need between 2 and 7 players.");
  }

  // Validate house IDs
  for (const p of config.players) {
    if (!HOUSES[p.houseId]) {
      throw new Error(`initGame: unknown houseId "${p.houseId}".`);
    }
  }

  _state = _createInitialState(config);
  _log(`A new game begins. ${_state.players.length} houses vie for the Iron Throne.`);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Reading state
// -----------------------------------------------------------------------------

/**
 * Returns a DEEP CLONE of the entire state.
 * Safe to read, safe to mutate the copy — it won't affect the real state.
 *
 * For performance-sensitive reads (e.g. inside tight loops in AI),
 * use the specific getter functions below instead.
 */
function getState() {
  if (!_state) throw new Error("getState: game not initialised. Call initGame() first.");
  return _deepClone(_state);
}

/**
 * Returns the player object for the current turn (deep clone).
 */
function getCurrentPlayer() {
  return _deepClone(_state.players[_state.currentPlayerIndex]);
}

/**
 * Returns the mutable territory state for a given id (deep clone).
 * Combine with TERRITORIES[id] from boardData for full territory info.
 *
 * @param {string} territoryId
 */
function getTerritoryState(territoryId) {
  if (!_state.territories[territoryId]) {
    throw new Error(`getTerritoryState: unknown territory "${territoryId}".`);
  }
  return _deepClone(_state.territories[territoryId]);
}

/**
 * Returns all territory IDs owned by a given house.
 *
 * @param {string} houseId
 * @returns {string[]}
 */
function getTerritoriesOwnedBy(houseId) {
  return Object.entries(_state.territories)
    .filter(([, t]) => t.owner === houseId)
    .map(([id]) => id);
}

/**
 * Returns the index of a player by houseId, or -1 if not found.
 *
 * @param {string} houseId
 * @returns {number}
 */
function getPlayerIndexByHouse(houseId) {
  return _state.players.findIndex((p) => p.houseId === houseId);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Setup phase mutators
// -----------------------------------------------------------------------------

/**
 * Sets how many armies each player starts with in the setup phase.
 * Call this after initGame(), before any army placement.
 * Standard Risk counts: 40 armies for 2p, 35 for 3p, 30 for 4p, 25 for 5p.
 *
 * @param {number[]} armyCounts — one count per player, matching players array order
 */
function initSetupArmies(armyCounts) {
  _assertPhase(PHASES.SETUP);
  if (armyCounts.length !== _state.players.length) {
    throw new Error("initSetupArmies: armyCounts length must match player count.");
  }
  _state.setupArmiesRemaining = [...armyCounts];
  _log("Setup: players begin placing their starting armies.");
}

/**
 * Places armies on a territory during the setup phase.
 * Called once per player per territory during initial card-dealt setup.
 *
 * Official setup: territory card dealt → player owns territory → places 2 armies.
 * This function handles the placement step.
 *
 * @param {string} territoryId
 * @param {string} houseId      — the player placing armies
 * @param {number} count        — number of armies to place (usually 2)
 */
function setupPlaceArmies(territoryId, houseId, count) {
  _assertPhase(PHASES.SETUP);
  _assertTerritoryExists(territoryId);

  const territory = _state.territories[territoryId];
  const playerIndex = getPlayerIndexByHouse(houseId);
  if (playerIndex === -1) throw new Error(`setupPlaceArmies: unknown house "${houseId}".`);

  territory.owner = houseId;
  territory.armies += count;

  if (_state.setupArmiesRemaining[playerIndex] >= count) {
    _state.setupArmiesRemaining[playerIndex] -= count;
  }

  _log(`Setup: ${_playerName(playerIndex)} places ${count} ${_armyWord(count)} in ${_territoryName(territoryId)}.`);
}

// Places armies on a territory for the neutral faction.
// Neutral territories have no player owner — they just block and must be conquered.
function setupPlaceArmiesNeutral(territoryId, count) {
  _assertPhase(PHASES.SETUP);
  _assertTerritoryExists(territoryId);
  var territory   = _state.territories[territoryId];
  territory.owner  = "neutral";
  territory.armies = count;
  _log("Setup: neutral territory " + (TERRITORIES[territoryId]
    ? TERRITORIES[territoryId].name : territoryId) + " gets " + count + " armies.");
}
/**
 * Marks the setup phase as complete and advances to the first player's
 * reinforce phase. Call this once all territories have been assigned.
 */
function completeSetup() {
  _assertPhase(PHASES.SETUP);
  _state.setupComplete = true;
  _state.phase = PHASES.REINFORCE;
  _log(`Setup complete. ${_playerName(_state.currentPlayerIndex)}'s turn begins — Reinforce phase.`);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Reinforce phase mutators
// -----------------------------------------------------------------------------

/**
 * Places reinforcement armies on an owned territory.
 * gameLogic.js is responsible for CALCULATING how many armies the player
 * is owed — this function just places the armies and tracks the spend.
 *
 * @param {string} territoryId
 * @param {number} count
 */
function placeReinforcements(territoryId, count) {
  _assertPhase(PHASES.REINFORCE);
  _assertTerritoryExists(territoryId);

  const territory = _state.territories[territoryId];
  const currentPlayer = _state.players[_state.currentPlayerIndex];

  if (territory.owner !== currentPlayer.houseId) {
    throw new Error(`placeReinforcements: ${territoryId} is not owned by the current player.`);
  }
  if (count < 1) {
    throw new Error("placeReinforcements: must place at least 1 army.");
  }

  territory.armies += count;
  _log(`${_playerName(_state.currentPlayerIndex)} reinforces ${_territoryName(territoryId)} with ${count} ${_armyWord(count)}.`);
}

/**
 * Ends the reinforce phase and moves to the attack phase.
 */
function endReinforcePhase() {
  _assertPhase(PHASES.REINFORCE);
  _state.phase = PHASES.ATTACK;
  _log(`${_playerName(_state.currentPlayerIndex)} begins the Attack phase.`);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Attack phase mutators
// -----------------------------------------------------------------------------

/**
 * Initiates an attack between two territories.
 * Validates legality. Does NOT roll dice — that is gameLogic's job.
 * After calling this, call resolveAttack() with the dice results.
 *
 * @param {string} fromId       — attacking territory id
 * @param {string} toId         — defending territory id
 * @param {number} attackerDice — 1, 2, or 3
 */
function beginAttack(fromId, toId, attackerDice) {
  _assertPhase(PHASES.ATTACK);
  _assertTerritoryExists(fromId);
  _assertTerritoryExists(toId);

  const from = _state.territories[fromId];
  const to   = _state.territories[toId];
  const currentHouse = _state.players[_state.currentPlayerIndex].houseId;

  if (from.owner !== currentHouse) {
    throw new Error(`beginAttack: ${fromId} is not owned by the current player.`);
  }
  if (to.owner === currentHouse) {
    throw new Error(`beginAttack: cannot attack your own territory (${toId}).`);
  }
  if (to.owner === "neutral" && to.armies === 0) {
    // Unoccupied neutral — should not exist after setup but guard anyway.
    throw new Error(`beginAttack: ${toId} has no armies to fight.`);
  }
  if (!TERRITORIES[fromId].adjacentTo.includes(toId)) {
    throw new Error(`beginAttack: ${fromId} is not adjacent to ${toId}.`);
  }
  if (from.armies < 2) {
    throw new Error(`beginAttack: need at least 2 armies to attack (${fromId} has ${from.armies}).`);
  }
  if (attackerDice < 1 || attackerDice > 3) {
    throw new Error("beginAttack: attackerDice must be 1, 2, or 3.");
  }
  if (attackerDice >= from.armies) {
    throw new Error(`beginAttack: cannot roll ${attackerDice} dice with only ${from.armies} armies (must keep 1 back).`);
  }

  // Defender always uses max allowed dice (auto-resolved per official rules).
  const defenderDice = Math.min(2, to.armies);

  _state.activeAttack = {
    fromTerritoryId: fromId,
    toTerritoryId:   toId,
    attackerDice,
    defenderDice,
    attackerRolls:  [],
    defenderRolls:  [],
    attackerLosses: 0,
    defenderLosses: 0,
    resolved:       false,
    conquered:      false,
  };

  _log(`${_playerName(_state.currentPlayerIndex)} attacks ${_territoryName(toId)} from ${_territoryName(fromId)} with ${attackerDice} ${_diceWord(attackerDice)}.`);
}

/**
 * Records the dice results of an active attack and applies army losses.
 * gameLogic.js rolls the dice and calls this function with the results.
 *
 * @param {number[]} attackerRolls — e.g. [6, 4, 2]
 * @param {number[]} defenderRolls — e.g. [5, 3]
 */
function resolveAttack(attackerRolls, defenderRolls) {
  if (!_state.activeAttack || _state.activeAttack.resolved) {
    throw new Error("resolveAttack: no active unresolved attack.");
  }

  const attack = _state.activeAttack;
  attack.attackerRolls = [...attackerRolls];
  attack.defenderRolls = [...defenderRolls];

  // Sort both descending. Compare pairs. Ties go to defender.
  const aSorted = [...attackerRolls].sort((a, b) => b - a);
  const dSorted = [...defenderRolls].sort((a, b) => b - a);
  const comparisons = Math.min(aSorted.length, dSorted.length);

  let attackerLosses = 0;
  let defenderLosses = 0;

  for (let i = 0; i < comparisons; i++) {
    if (aSorted[i] > dSorted[i]) {
      defenderLosses++;
    } else {
      // Tie goes to defender → attacker loses.
      attackerLosses++;
    }
  }

  attack.attackerLosses = attackerLosses;
  attack.defenderLosses = defenderLosses;

  const fromTerritory = _state.territories[attack.fromTerritoryId];
  const toTerritory   = _state.territories[attack.toTerritoryId];

  fromTerritory.armies -= attackerLosses;
  toTerritory.armies   -= defenderLosses;

  _log(
    `Battle: [${aSorted.join(",")}] vs [${dSorted.join(",")}] — ` +
    `Attacker loses ${attackerLosses}, Defender loses ${defenderLosses}.`
  );

  // Check if territory is conquered (defender has no armies left).
  if (toTerritory.armies <= 0) {
    attack.conquered = true;
    _log(`${_territoryName(attack.toTerritoryId)} has fallen!`);
  }

  attack.resolved = true;
}

/**
 * Moves armies into a just-conquered territory.
 * Must be called immediately after a resolveAttack() that resulted in conquest.
 * The attacker MUST move at least as many armies as dice rolled.
 *
 * @param {number} count — armies to move in (min: attackerDice rolled; max: fromArmies - 1)
 */
function occupyConqueredTerritory(count) {
  const attack = _state.activeAttack;
  if (!attack || !attack.resolved || !attack.conquered) {
    throw new Error("occupyConqueredTerritory: no conquered territory awaiting occupation.");
  }

  const currentHouse = _state.players[_state.currentPlayerIndex].houseId;
  const from = _state.territories[attack.fromTerritoryId];
  const to   = _state.territories[attack.toTerritoryId];
  const minMove = attack.attackerDice;
  const maxMove = from.armies - 1;

  if (count < minMove) {
    throw new Error(`occupyConqueredTerritory: must move at least ${minMove} ${_armyWord(minMove)}.`);
  }
  if (count > maxMove) {
    throw new Error(`occupyConqueredTerritory: can only move up to ${maxMove} ${_armyWord(maxMove)} (must leave 1 behind).`);
  }

  to.owner    = currentHouse;
  to.armies   = count;
  from.armies -= count;

  // Mark that the current player conquered at least one territory this turn.
  _state.players[_state.currentPlayerIndex].conqueredThisTurn = true;

  _log(`${_playerName(_state.currentPlayerIndex)} moves ${count} ${_armyWord(count)} into ${_territoryName(attack.toTerritoryId)}.`);

  // Check if the defending player has been eliminated.
  _checkElimination(attack.toTerritoryId);

  // Clear active attack so a new one can begin.
  _state.activeAttack = null;
}

/**
 * Cancels (retreats from) the current attack without resolving it.
 * Only valid before resolveAttack() has been called.
 */
function cancelAttack() {
  if (!_state.activeAttack || _state.activeAttack.resolved) {
    throw new Error("cancelAttack: no active unresolved attack to cancel.");
  }
  _log(`${_playerName(_state.currentPlayerIndex)} calls off the attack on ${_territoryName(_state.activeAttack.toTerritoryId)}.`);
  _state.activeAttack = null;
}

/**
 * Ends the attack phase and moves to the manoeuvre phase.
 */
function endAttackPhase() {
  _assertPhase(PHASES.ATTACK);
  if (_state.activeAttack && !_state.activeAttack.resolved) {
    throw new Error("endAttackPhase: resolve or cancel the active attack first.");
  }
  _state.activeAttack = null;
  _state.phase = PHASES.MANOEUVRE;
  _log(`${_playerName(_state.currentPlayerIndex)} begins the Manoeuvre phase.`);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Manoeuvre phase mutators
// -----------------------------------------------------------------------------

/**
 * Moves armies from one owned territory to one adjacent owned territory.
 * Can only be done once per turn.
 *
 * @param {string} fromId
 * @param {string} toId
 * @param {number} count — armies to move (must leave at least 1 behind)
 */
function manoeuvre(fromId, toId, count) {
  _assertPhase(PHASES.MANOEUVRE);
  _assertTerritoryExists(fromId);
  _assertTerritoryExists(toId);

  if (_state.manoeuvreUsed) {
    throw new Error("manoeuvre: already manoeuvred this turn.");
  }

  const currentHouse = _state.players[_state.currentPlayerIndex].houseId;
  const from = _state.territories[fromId];
  const to   = _state.territories[toId];

  if (from.owner !== currentHouse) {
    throw new Error(`manoeuvre: ${fromId} is not owned by the current player.`);
  }
  if (to.owner !== currentHouse) {
    throw new Error(`manoeuvre: ${toId} is not owned by the current player.`);
  }
  // Connectivity check: toId must be reachable through owned territories.
  // We use getValidManoeuvreTargets which does a BFS through owned lands.
  var reachable = getValidManoeuvreTargets(fromId);
  if (reachable.indexOf(toId) < 0) {
    throw new Error("manoeuvre: " + toId + " is not reachable through owned territories from " + fromId + ".");
  }
  if (count < 1 || count >= from.armies) {
    throw new Error(`manoeuvre: must move between 1 and ${from.armies - 1} armies.`);
  }

  from.armies -= count;
  to.armies   += count;
  _state.manoeuvreUsed = true;

  _log(`${_playerName(_state.currentPlayerIndex)} moves ${count} ${_armyWord(count)} from ${_territoryName(fromId)} to ${_territoryName(toId)}.`);
}

/**
 * Ends the manoeuvre phase and moves to the draw phase.
 */
function endManoeuvrePhase() {
  _assertPhase(PHASES.MANOEUVRE);
  _state.phase = PHASES.DRAW;
  _log(`${_playerName(_state.currentPlayerIndex)} begins the Draw phase.`);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Draw phase mutators
// -----------------------------------------------------------------------------

/**
 * Draws the top card of the deck if the player conquered at least one
 * territory this turn. Handles the Valar Morghulis card trigger.
 * If the player has 6+ cards after drawing, they MUST trade before proceeding.
 */
function drawCard() {
  _assertPhase(PHASES.DRAW);

  const player = _state.players[_state.currentPlayerIndex];

  if (!player.conqueredThisTurn) {
    _log(`${_playerName(_state.currentPlayerIndex)} did not conquer a territory — no card drawn.`);
    return;
  }
  if (_state.deck.length === 0) {
    // Reshuffle discard pile into deck (edge case for very long games).
    _state.deck = shuffle([..._state.discardPile]);
    _state.discardPile = [];
    _log("The territory card deck was reshuffled from the discard pile.");
  }

  const card = _state.deck.shift();

  if (card.cardType === "valar-morghulis") {
    _state.valarMorghulisDrawn = true;
    _log("⚔️ VALAR MORGHULIS — The game ends! Scores are counted...");
    _triggerEndGame();
    return;
  }

  player.cards.push(card);
  _log(
    `${_playerName(_state.currentPlayerIndex)} draws a card: ` +
    `${_territoryName(card.territoryId)} (${card.cardType}).`
  );

  if (player.cards.length >= 6) {
    _log(`${_playerName(_state.currentPlayerIndex)} has 6 cards — must trade a set before next turn.`);
  }
}

/**
 * Trades in a set of 3 cards for armies. Returns the number of armies earned.
 * Can be called during REINFORCE (voluntary) or DRAW (forced if 6+ cards).
 * gameLogic.js should validate card legality before calling this.
 *
 * @param {number[]} cardIndices    — indices into player.cards array (3 of them)
 * @param {string|null} matchTerritoryId — if one card matches an owned territory,
 *                                         pass its id to receive the 2-army bonus.
 *                                         Pass null if no match (or match not owned).
 * @returns {number} armies earned (including territory match bonus if applicable)
 */
function tradeCards(cardIndices, matchTerritoryId) {
  if (
    _state.phase !== PHASES.REINFORCE &&
    _state.phase !== PHASES.DRAW &&
    _state.phase !== PHASES.ATTACK
  ) {
    throw new Error("tradeCards: can only trade during Reinforce, Attack, or Draw phase.");
  }
  if (cardIndices.length !== 3) {
    throw new Error("tradeCards: must trade exactly 3 cards.");
  }

  const player = _state.players[_state.currentPlayerIndex];

  // Validate indices.
  for (const i of cardIndices) {
    if (i < 0 || i >= player.cards.length) {
      throw new Error(`tradeCards: card index ${i} is out of range.`);
    }
  }

 // Calculate armies earned using fixed values by set type.
  var tradedCards = cardIndices.map(function(i) { return player.cards[i]; });
  var tradedTypes = tradedCards.map(function(c) { return c.cardType; });
  var armiesEarned = calcCardSetValue(tradedTypes);

  // Territory match bonus.
  let matchBonus = 0;
  if (
    matchTerritoryId &&
    _state.territories[matchTerritoryId]?.owner === player.houseId
  ) {
    matchBonus = 2; // CARD_TERRITORY_MATCH_BONUS
    armiesEarned += matchBonus;
    _state.territories[matchTerritoryId].armies += matchBonus;
    _log(`Territory match bonus: 2 armies added to ${_territoryName(matchTerritoryId)}.`);
  }

  // Remove the traded cards (remove in reverse index order to avoid shifting).
  const sorted = [...cardIndices].sort((a, b) => b - a);
  const traded = sorted.map((i) => player.cards.splice(i, 1)[0]);
  _state.discardPile.push(...traded);


  _log(
    `${_playerName(_state.currentPlayerIndex)} trades a card set for ${armiesEarned} ${_armyWord(armiesEarned)}.`
  );

  return armiesEarned;
}

/**
 * Ends the draw phase and advances to the next player's turn.
 */
function endTurn() {
  _assertPhase(PHASES.DRAW);

  if (_state.gameOver) return;

  const player = _state.players[_state.currentPlayerIndex];

  // Enforce: if player has 6+ cards, they cannot end turn without trading.
  if (player.cards.length >= 6) {
    throw new Error("endTurn: player must trade cards before ending turn (6+ cards in hand).");
  }

  // Reset per-turn flags.
  player.conqueredThisTurn = false;
  _state.manoeuvreUsed = false;

  // Advance to next living player.
  _advanceToNextPlayer();

  if (!_state.gameOver) {
    _state.phase = PHASES.REINFORCE;
    _state.turnNumber++;
    _log(`--- Turn ${_state.turnNumber}: ${_playerName(_state.currentPlayerIndex)}'s turn begins.`);
  }
}


// -----------------------------------------------------------------------------
// PUBLIC API — Scoring (Skirmish end game)
// -----------------------------------------------------------------------------

/**
 * Calculates and returns the final Skirmish scores for all players.
 * Scores: 1 point per territory + 1 per castle + 1 per port.
 *
 * @returns {Array} [{ houseId, name, score, territories, castles, ports }, ...]
 *                  sorted by score descending.
 */
function calcSkirmishScores() {
  const scores = _state.players.map((player) => {
    let territories = 0, castles = 0, ports = 0;

    for (const [id, t] of Object.entries(_state.territories)) {
      if (t.owner === player.houseId) {
        territories++;
        if (TERRITORIES[id].hasCastle) castles++;
        if (TERRITORIES[id].hasPort)   ports++;
      }
    }

    return {
      houseId:     player.houseId,
      name:        player.name,
      score:       territories + castles + ports,
      territories,
      castles,
      ports,
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}


// -----------------------------------------------------------------------------
// PUBLIC API — Log
// -----------------------------------------------------------------------------

const LOG_MAX_ENTRIES = 50;

/**
 * Returns the game log as an array of strings, newest first.
 * The renderer shows the first N entries.
 */
function getLog() {
  return [..._state.log];
}


// -----------------------------------------------------------------------------
// PRIVATE HELPERS — Game logic internals
// -----------------------------------------------------------------------------

/**
 * Adds a message to the front of the game log, trimming to LOG_MAX_ENTRIES.
 * @param {string} message
 */
function _log(message) {
  if (!_state) return;
  _state.log.unshift(message);
  if (_state.log.length > LOG_MAX_ENTRIES) {
    _state.log.length = LOG_MAX_ENTRIES;
  }
}

/**
 * Checks if the player who previously owned `justConqueredTerritoryId`
 * has been eliminated (no territories left).
 * If so, the attacker inherits all their territory cards.
 */
function _checkElimination(justConqueredTerritoryId) {
  // We know the territory was just conquered, so its new owner is the current player.
  // Find who owned it before (we look at who has zero territories now).
  const currentHouse = _state.players[_state.currentPlayerIndex].houseId;

  for (let i = 0; i < _state.players.length; i++) {
    const p = _state.players[i];
    if (p.isEliminated || p.houseId === currentHouse) continue;

    const remaining = Object.values(_state.territories).filter(
      (t) => t.owner === p.houseId
    ).length;

    if (remaining === 0) {
      p.isEliminated = true;
      _log(`💀 ${p.name} has been eliminated!`);

      // Transfer their cards to the current player.
      const currentPlayer = _state.players[_state.currentPlayerIndex];
      currentPlayer.cards.push(...p.cards);
      p.cards = [];

      _log(
        `${_playerName(_state.currentPlayerIndex)} inherits ${currentPlayer.cards.length} card(s).`
      );

      // If the current player now has 5+ cards, they must immediately trade.
      // (This is flagged; gameLogic / inputHandler will prompt the UI.)
      if (currentPlayer.cards.length >= 6) {
        _log(`${_playerName(_state.currentPlayerIndex)} must trade cards immediately (6+ cards).`);
      }

      // Check if only one player remains → elimination victory.
      const survivors = _state.players.filter((pl) => !pl.isEliminated);
      if (survivors.length === 1) {
        _state.winner = survivors[0].houseId;
        _state.gameOver = true;
        _log(`🏆 ${survivors[0].name} wins by eliminating all other houses!`);
      }
    }
  }
}

/**
 * Triggers the Valar Morghulis end game (scores counted).
 */
function _triggerEndGame() {
  _state.gameOver = true;
  const scores = calcSkirmishScores();
  _state.winner = scores[0].houseId;
  _log(`🏆 ${scores[0].name} wins with ${scores[0].score} points!`);
}

/**
 * Advances currentPlayerIndex to the next living (non-eliminated) player.
 */
function _advanceToNextPlayer() {
  const total = _state.players.length;
  let next = (_state.currentPlayerIndex + 1) % total;
  let attempts = 0;

  while (_state.players[next].isEliminated) {
    next = (next + 1) % total;
    attempts++;
    if (attempts > total) {
      // Only one or zero players left — game should already be over.
      return;
    }
  }

  _state.currentPlayerIndex = next;
}

/**
 * Asserts the current phase matches expected. Throws if not.
 */
function _assertPhase(expected) {
  if (_state.phase !== expected) {
    throw new Error(`Expected phase "${expected}" but current phase is "${_state.phase}".`);
  }
}

/**
 * Asserts a territory ID exists in state. Throws if not.
 */
function _assertTerritoryExists(id) {
  if (!_state.territories[id]) {
    throw new Error(`Unknown territory id: "${id}".`);
  }
}

/**
 * Returns a player's display name from their index.
 */
function _playerName(index) {
  return _state.players[index]?.name ?? `Player ${index + 1}`;
}

/**
 * Returns a territory's display name from boardData.
 */
function _territoryName(id) {
  return id ? (TERRITORIES[id]?.name ?? id) : "(unknown territory)";
}

/**
 * Returns "army" or "armies" based on count.
 */
function _armyWord(count) {
  return count === 1 ? "army" : "armies";
}

/**
 * Returns "die" or "dice" based on count.
 */
function _diceWord(count) {
  return count === 1 ? "die" : "dice";
}


