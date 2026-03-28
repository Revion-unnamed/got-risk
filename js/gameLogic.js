// =============================================================================
// gameLogic.js
// Orchestration layer — sits between inputHandler.js and gameState.js.
//
// RESPONSIBILITY:
//   - Decide WHAT game actions are currently legal (canXxx functions).
//   - Orchestrate multi-step actions (e.g. roll dice THEN call resolveAttack).
//   - Return structured results that renderer.js can display.
//   - Never touch the DOM. Never directly mutate _state.
//
// WHAT THIS FILE DOES NOT DO:
//   - It does not validate rules that gameState.js already validates.
//     (gameState mutators throw on illegal calls — let them.)
//   - It does not read or write _state directly.
//     (Always goes through gameState.js exported functions.)
//   - It does not render anything.
//
// FLOW:
//   User taps something
//     → inputHandler.js calls a gameLogic function
//       → gameLogic queries state, rolls dice, calls gameState mutators
//         → gameState updates _state
//           → inputHandler calls renderer
//             → renderer reads getState() and repaints
// =============================================================================

import {
  TERRITORIES,
  HOUSES,
  REGIONS,
  isValidCardSet,
  calcCardTradeValue,
  calcBaseReinforcements,
} from "./boardData.js";

import {
  PHASES,
  GAME_MODES,
  getState,
  getCurrentPlayer,
  getTerritoryState,
  getTerritoriesOwnedBy,
  getPlayerIndexByHouse,
  initGame,
  initSetupArmies,
  setupPlaceArmies,
  completeSetup,
  placeReinforcements,
  endReinforcePhase,
  beginAttack,
  resolveAttack,
  occupyConqueredTerritory,
  cancelAttack,
  endAttackPhase,
  manoeuvre,
  endManoeuvrePhase,
  drawCard,
  tradeCards,
  endTurn,
  calcSkirmishScores,
  getLog,
} from "./gameState.js";


// =============================================================================
// SECTION 1 — GAME SETUP
// =============================================================================

// How many starting armies each player gets based on player count.
// Source: official Risk rules.
const SETUP_ARMIES_BY_PLAYER_COUNT = {
  2: 40,
  3: 35,
  4: 30,
  5: 25,
  6: 20,
  7: 20,
};

/**
 * Starts a new game from a configuration object.
 * Handles full setup: initialises state, deals territory cards, places
 * starting armies on dealt territories, marks setup complete.
 *
 * Official Skirmish setup:
 *   1. Shuffle territory card deck, deal ALL cards equally to players.
 *   2. Each player places 2 armies on each territory they received.
 *   3. Neutral territories (remainder cards if uneven deal) get 2 neutral armies.
 *   4. Collect cards back, rebuild deck with Valar Morghulis in bottom half.
 *   5. Roll to determine first player (we accept firstPlayerIndex from outside).
 *
 * @param {object} config
 * @param {string}    config.mode            — GAME_MODES value (default: skirmish)
 * @param {Array}     config.players         — [{ houseId, name, isAI? }, ...]
 * @param {number}    config.firstPlayerIndex — 0-based index of first player (from dice roll)
 *
 * @returns {{ success: boolean, error?: string }}
 */
export function startNewGame(config) {
  try {
    const playerCount = config.players.length;
    if (playerCount < 2 || playerCount > 5) {
      return { success: false, error: "Skirmish mode requires 2–5 players." };
    }

    // Initialise state (builds deck, creates players, sets phase to SETUP).
    initGame({
      mode: config.mode ?? GAME_MODES.SKIRMISH,
      players: config.players,
    });

    // Calculate starting armies per player.
    const armiesEach = SETUP_ARMIES_BY_PLAYER_COUNT[playerCount] ?? 25;
    const armyCounts = config.players.map(() => armiesEach);
    initSetupArmies(armyCounts);

    // Deal territory cards and place 2 armies on each.
    // We work with all territory IDs and deal them like cards.
    const allTerritoryIds = Object.keys(TERRITORIES);
    const shuffled = _shuffleArray([...allTerritoryIds]);

    // Deal to players round-robin, tracking leftovers for neutral placement.
    const dealtTo = {}; // territoryId → playerIndex
    for (let i = 0; i < shuffled.length; i++) {
      const playerIndex = i % playerCount;
      dealtTo[shuffled[i]] = playerIndex;
    }

    // Place 2 armies on each territory for its owner (or neutral).
    for (const [territoryId, playerIndex] of Object.entries(dealtTo)) {
      const houseId = config.players[playerIndex].houseId;
      setupPlaceArmies(territoryId, houseId, 2);
    }

    // Mark setup complete → advances phase to REINFORCE for firstPlayer.
    // Rotate players array is handled by turn order; firstPlayerIndex
    // determines who goes first — we store it via state's currentPlayerIndex.
    // NOTE: gameState.js always starts at index 0; we honour firstPlayerIndex
    // by reordering the players array before calling initGame.
    // (config.players should already be rotated to put firstPlayer at index 0.)
    completeSetup();

    return { success: true };

  } catch (err) {
    return { success: false, error: err.message };
  }
}


// =============================================================================
// SECTION 2 — QUERY FUNCTIONS
// These return information about what is legal RIGHT NOW.
// inputHandler.js uses these to enable/disable UI elements.
// =============================================================================

/**
 * Returns the number of reinforcement armies the current player is owed
 * this turn, before any card trades.
 *
 * @returns {number}
 */
export function getReinforceCount() {
  const state = getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  const owned = getTerritoriesOwnedBy(currentPlayer.houseId);
  return calcBaseReinforcements(owned);
}

/**
 * Returns all territories the current player can legally place
 * reinforcement armies on (i.e. territories they own).
 *
 * @returns {string[]} array of territory IDs
 */
export function getValidReinforceTargets() {
  const state = getState();
  const currentHouse = state.players[state.currentPlayerIndex].houseId;
  return Object.entries(state.territories)
    .filter(([, t]) => t.owner === currentHouse)
    .map(([id]) => id);
}

/**
 * Returns all territories the current player can legally attack FROM.
 * A territory can attack if: owned by current player AND has ≥ 2 armies
 * AND has at least one adjacent enemy territory.
 *
 * @returns {string[]} array of territory IDs
 */
export function getValidAttackSources() {
  const state = getState();
  const currentHouse = state.players[state.currentPlayerIndex].houseId;

  return Object.entries(state.territories)
    .filter(([id, t]) => {
      if (t.owner !== currentHouse) return false;
      if (t.armies < 2) return false;
      // Must have at least one adjacent enemy.
      return TERRITORIES[id].adjacentTo.some(
        (adjId) => state.territories[adjId]?.owner !== currentHouse
      );
    })
    .map(([id]) => id);
}

/**
 * Returns all territories that can be attacked FROM a given source territory.
 * (Adjacent territories not owned by the current player.)
 *
 * @param {string} fromId — the attacking territory
 * @returns {string[]} array of territory IDs
 */
export function getValidAttackTargets(fromId) {
  const state = getState();
  const currentHouse = state.players[state.currentPlayerIndex].houseId;

  return TERRITORIES[fromId].adjacentTo.filter(
    (adjId) => state.territories[adjId]?.owner !== currentHouse
  );
}

/**
 * Returns the max number of attack dice the current player can roll
 * from a given territory (1–3, must leave 1 army behind).
 *
 * @param {string} fromId
 * @returns {number} 1, 2, or 3
 */
export function getMaxAttackDice(fromId) {
  const t = getTerritoryState(fromId);
  return Math.min(3, t.armies - 1);
}

/**
 * Returns the number of defence dice the defending territory will roll
 * (auto-calculated per official rules: up to 2, limited by army count).
 *
 * @param {string} toId — the defending territory
 * @returns {number} 1 or 2
 */
export function getDefenderDice(toId) {
  const t = getTerritoryState(toId);
  return Math.min(2, t.armies);
}

/**
 * Returns all territories the current player can manoeuvre FROM.
 * Conditions: owned, ≥ 2 armies, has at least one adjacent owned territory.
 *
 * @returns {string[]} array of territory IDs
 */
export function getValidManoeuvreSources() {
  const state = getState();
  if (state.manoeuvreUsed) return [];
  const currentHouse = state.players[state.currentPlayerIndex].houseId;

  return Object.entries(state.territories)
    .filter(([id, t]) => {
      if (t.owner !== currentHouse) return false;
      if (t.armies < 2) return false;
      return TERRITORIES[id].adjacentTo.some(
        (adjId) => state.territories[adjId]?.owner === currentHouse
      );
    })
    .map(([id]) => id);
}

/**
 * Returns all territories that can receive armies in a manoeuvre FROM a source.
 *
 * @param {string} fromId
 * @returns {string[]} array of territory IDs
 */
export function getValidManoeuvreTargets(fromId) {
  const state = getState();
  const currentHouse = state.players[state.currentPlayerIndex].houseId;
  return TERRITORIES[fromId].adjacentTo.filter(
    (adjId) => state.territories[adjId]?.owner === currentHouse
  );
}

/**
 * Returns whether the current player MUST trade cards right now.
 * This is true when they have 6 or more cards in hand.
 *
 * @returns {boolean}
 */
export function mustTradeCards() {
  const player = getCurrentPlayer();
  return player.cards.length >= 6;
}

/**
 * Returns whether the current player CAN trade cards right now
 * (has a valid set of 3 in hand, and is in reinforce or draw phase).
 *
 * @returns {boolean}
 */
export function canTradeCards() {
  const state = getState();
  const inValidPhase =
    state.phase === PHASES.REINFORCE || state.phase === PHASES.DRAW;
  if (!inValidPhase) return false;

  const player = state.players[state.currentPlayerIndex];
  return findAllValidCardSets(player.cards).length > 0;
}

/**
 * Finds all valid trade-in sets in a player's hand.
 * Returns an array of index-triplets, e.g. [[0,1,2], [0,2,4], ...]
 * Each triplet is a set of 3 card indices that form a legal trade.
 *
 * @param {Array} cards — the player's cards array
 * @returns {number[][]}
 */
export function findAllValidCardSets(cards) {
  const validSets = [];
  const n = cards.length;

  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const types = [cards[i].cardType, cards[j].cardType, cards[k].cardType];
        if (isValidCardSet(types)) {
          validSets.push([i, j, k]);
        }
      }
    }
  }

  return validSets;
}

/**
 * Returns how many armies the current player would earn for trading
 * their next set (based on how many sets they've traded so far this game).
 * Useful for displaying the value in the UI before the player commits.
 *
 * @returns {number}
 */
export function previewTradeValue() {
  const player = getCurrentPlayer();
  return calcCardTradeValue(player.cardSetsTraded);
}

/**
 * Given a set of 3 card indices, finds the territory match bonus territory.
 * Returns the territory ID if one of the traded cards matches an owned territory,
 * otherwise returns null.
 *
 * @param {number[]} cardIndices — 3 indices into player's cards array
 * @returns {string|null} matching territory ID, or null
 */
export function findCardSetMatchTerritory(cardIndices) {
  const state = getState();
  const player = state.players[state.currentPlayerIndex];

  for (const i of cardIndices) {
    const card = player.cards[i];
    if (!card.territoryId) continue;  // wild card — no territory
    const tState = state.territories[card.territoryId];
    if (tState?.owner === player.houseId) {
      return card.territoryId;
    }
  }
  return null;
}

/**
 * Returns a human-readable summary of the current game state.
 * Used by the UI to show the player what they need to do next.
 *
 * @returns {string}
 */
export function getPhaseInstructions() {
  const state = getState();
  const player = state.players[state.currentPlayerIndex];
  const house = HOUSES[player.houseId];

  if (state.gameOver) return "The game is over.";

  if (mustTradeCards()) {
    return `${house.sigil} ${player.name} — You have ${player.cards.length} cards. Trade a set before continuing.`;
  }

  switch (state.phase) {
    case PHASES.SETUP:
      return `${house.sigil} ${player.name} — Place your starting armies.`;

    case PHASES.REINFORCE: {
      const owed = getReinforceCount();
      return `${house.sigil} ${player.name} — Place ${owed} reinforcement ${owed === 1 ? "army" : "armies"}.`;
    }

    case PHASES.ATTACK:
      return `${house.sigil} ${player.name} — Attack an enemy territory, or end your attack phase.`;

    case PHASES.MANOEUVRE:
      return state.manoeuvreUsed
        ? `${house.sigil} ${player.name} — Manoeuvre complete. End your turn.`
        : `${house.sigil} ${player.name} — Manoeuvre armies to one adjacent territory (optional).`;

    case PHASES.DRAW:
      return player.conqueredThisTurn
        ? `${house.sigil} ${player.name} — Draw your territory card, then end your turn.`
        : `${house.sigil} ${player.name} — No conquest this turn. End your turn.`;

    default:
      return "";
  }
}


// =============================================================================
// SECTION 3 — ACTION FUNCTIONS
// Called by inputHandler.js in response to player input.
// Each returns a result object: { success, error?, data? }
// The data field carries anything the renderer needs to show
// (dice rolls, losses, card drawn, etc.)
// =============================================================================

/**
 * Places reinforcement armies on a territory.
 * Validates that the player has enough armies left to place.
 *
 * @param {string} territoryId
 * @param {number} count
 * @param {object} session   — mutable session object tracking armies left this turn
 *                             Shape: { armiesRemaining: number }
 *                             inputHandler creates this at the start of reinforce phase.
 * @returns {{ success, error?, armiesRemaining }}
 */
export function actionPlaceReinforcements(territoryId, count, session) {
  if (count < 1) {
    return { success: false, error: "Must place at least 1 army." };
  }
  if (count > session.armiesRemaining) {
    return {
      success: false,
      error: `Only ${session.armiesRemaining} ${session.armiesRemaining === 1 ? "army" : "armies"} left to place.`,
    };
  }

  try {
    placeReinforcements(territoryId, count);
    session.armiesRemaining -= count;
    return { success: true, armiesRemaining: session.armiesRemaining };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Ends the reinforce phase. Only allowed when all armies have been placed.
 *
 * @param {object} session — { armiesRemaining: number }
 * @returns {{ success, error? }}
 */
export function actionEndReinforce(session) {
  if (session.armiesRemaining > 0) {
    return {
      success: false,
      error: `You still have ${session.armiesRemaining} ${session.armiesRemaining === 1 ? "army" : "armies"} to place.`,
    };
  }
  try {
    endReinforcePhase();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Executes a full attack roll between two territories.
 * Rolls dice, resolves combat, applies losses, checks for conquest.
 *
 * @param {string} fromId
 * @param {string} toId
 * @param {number} attackerDice — 1, 2, or 3
 * @returns {{
 *   success: boolean,
 *   error?: string,
 *   data?: {
 *     attackerRolls: number[],
 *     defenderRolls: number[],
 *     attackerLosses: number,
 *     defenderLosses: number,
 *     conquered: boolean,
 *     fromArmies: number,   // armies remaining in attacking territory
 *     toArmies: number,     // armies remaining in defending territory (0 if conquered)
 *   }
 * }}
 */
export function actionAttack(fromId, toId, attackerDice) {
  try {
    // Set up the attack in state (validates legality).
    beginAttack(fromId, toId, attackerDice);

    // Roll the dice.
    const defenderDice = getDefenderDice(toId);
    const attackerRolls = _rollDice(attackerDice);
    const defenderRolls = _rollDice(defenderDice);

    // Apply results to state.
    resolveAttack(attackerRolls, defenderRolls);

    // Read back the resolved state for the result object.
    const state = getState();
    const attack = state.activeAttack;

    return {
      success: true,
      data: {
        attackerRolls: attack.attackerRolls,
        defenderRolls: attack.defenderRolls,
        attackerLosses: attack.attackerLosses,
        defenderLosses: attack.defenderLosses,
        conquered: attack.conquered,
        fromArmies: state.territories[fromId].armies,
        toArmies: state.territories[toId].armies,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Moves armies into a just-conquered territory.
 * Called after actionAttack returns conquered: true.
 *
 * @param {number} count — armies to move in
 * @returns {{ success, error? }}
 */
export function actionOccupy(count) {
  try {
    occupyConqueredTerritory(count);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Ends the attack phase.
 * @returns {{ success, error? }}
 */
export function actionEndAttack() {
  try {
    endAttackPhase();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Moves armies from one territory to an adjacent owned territory.
 *
 * @param {string} fromId
 * @param {string} toId
 * @param {number} count
 * @returns {{ success, error? }}
 */
export function actionManoeuvre(fromId, toId, count) {
  try {
    manoeuvre(fromId, toId, count);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Ends the manoeuvre phase.
 * @returns {{ success, error? }}
 */
export function actionEndManoeuvre() {
  try {
    endManoeuvrePhase();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Draws a territory card (if the player earned one).
 * Handles the Valar Morghulis trigger — if the game ends,
 * the result will include gameOver: true.
 *
 * @returns {{ success, error?, data?: { gameOver, scores? } }}
 */
export function actionDrawCard() {
  try {
    drawCard();
    const state = getState();
    if (state.gameOver) {
      return {
        success: true,
        data: {
          gameOver: true,
          valarMorghulisTriggered: state.valarMorghulisDrawn,
          scores: calcSkirmishScores(),
        },
      };
    }
    return { success: true, data: { gameOver: false } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Trades a set of 3 cards for armies, then adds those armies to the
 * reinforcement session.
 *
 * @param {number[]} cardIndices   — 3 indices into player.cards
 * @param {object}   session       — { armiesRemaining: number } (mutated in place)
 * @returns {{ success, error?, armiesEarned?, matchTerritory? }}
 */
export function actionTradeCards(cardIndices, session) {
  // Validate it's a legal set before committing.
  const player = getCurrentPlayer();
  const types = cardIndices.map((i) => player.cards[i]?.cardType);

  if (types.some((t) => t === undefined)) {
    return { success: false, error: "Invalid card index in selection." };
  }
  if (!isValidCardSet(types)) {
    return { success: false, error: "Those 3 cards do not form a valid set." };
  }

  const matchTerritory = findCardSetMatchTerritory(cardIndices);

  try {
    const armiesEarned = tradeCards(cardIndices, matchTerritory);
    session.armiesRemaining += armiesEarned;
    return { success: true, armiesEarned, matchTerritory };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Ends the current player's turn and advances to the next.
 * Returns game-over data if the game just ended.
 *
 * @returns {{ success, error?, data?: { gameOver, scores? } }}
 */
export function actionEndTurn() {
  if (mustTradeCards()) {
    return {
      success: false,
      error: "You must trade a card set before ending your turn.",
    };
  }
  try {
    endTurn();
    const state = getState();
    if (state.gameOver) {
      return {
        success: true,
        data: { gameOver: true, scores: calcSkirmishScores() },
      };
    }
    return { success: true, data: { gameOver: false } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// =============================================================================
// SECTION 4 — DERIVED VIEW DATA
// Functions that compile rich display objects for the renderer.
// Keeps renderer.js free of game logic.
// =============================================================================

/**
 * Returns a display-ready summary of all territories.
 * Merges static boardData with live state — renderer uses this, not raw state.
 *
 * @returns {Array} [{
 *   id, name, region, regionName, hasCastle, hasPort,
 *   owner, armies, ownerColor, ownerColorDark, ownerSigil,
 *   isCurrentPlayerOwned, adjacentTo
 * }]
 */
export function getTerritoryDisplayData() {
  const state = getState();
  const currentHouse = state.players[state.currentPlayerIndex]?.houseId;

  return Object.values(TERRITORIES).map((staticData) => {
    const liveData = state.territories[staticData.id];
    const owner = liveData.owner;
    const house = owner !== "neutral" ? HOUSES[owner] : null;

    return {
      id:                  staticData.id,
      name:                staticData.name,
      region:              staticData.region,
      regionName:          REGIONS[staticData.region]?.name ?? staticData.region,
      hasCastle:           staticData.hasCastle,
      hasPort:             staticData.hasPort,
      adjacentTo:          staticData.adjacentTo,
      owner,
      armies:              liveData.armies,
      ownerColor:          house?.color    ?? "#666666",
      ownerColorDark:      house?.colorDark ?? "#333333",
      ownerSigil:          house?.sigil    ?? "⚫",
      isCurrentPlayerOwned: owner === currentHouse,
    };
  });
}

/**
 * Returns a display-ready summary of all players.
 * Used by renderer to draw the player info panel and scoreboard.
 *
 * @returns {Array} [{
 *   houseId, name, sigil, color, isCurrentPlayer, isEliminated,
 *   territoriesOwned, castlesOwned, portsOwned,
 *   cardCount, cardSetsTraded, isAI
 * }]
 */
export function getPlayerDisplayData() {
  const state = getState();
  const currentIndex = state.currentPlayerIndex;

  return state.players.map((player, i) => {
    const house = HOUSES[player.houseId];
    const owned = Object.entries(state.territories).filter(
      ([, t]) => t.owner === player.houseId
    );
    const castles = owned.filter(([id]) => TERRITORIES[id].hasCastle).length;
    const ports   = owned.filter(([id]) => TERRITORIES[id].hasPort).length;

    return {
      houseId:          player.houseId,
      name:             player.name,
      sigil:            house.sigil,
      color:            house.color,
      colorDark:        house.colorDark,
      isCurrentPlayer:  i === currentIndex,
      isEliminated:     player.isEliminated,
      territoriesOwned: owned.length,
      castlesOwned:     castles,
      portsOwned:       ports,
      cardCount:        player.cards.length,
      cardSetsTraded:   player.cardSetsTraded,
      isAI:             player.isAI,
    };
  });
}

/**
 * Returns a display-ready summary of the current player's cards.
 * Includes which sets are valid so the UI can highlight them.
 *
 * @returns {{
 *   cards: Array,
 *   validSets: number[][],
 *   nextTradeValue: number,
 *   mustTrade: boolean,
 * }}
 */
export function getCardDisplayData() {
  const player = getCurrentPlayer();
  const { CARD_TYPES } = await import("./boardData.js").catch(() => ({}));

  // Inline card type display data to avoid async in this context.
  const CARD_DISPLAY = {
    footsoldier: { label: "Footsoldier", emoji: "⚔️" },
    knight:      { label: "Knight",      emoji: "🐴" },
    siege:       { label: "Siege",       emoji: "🏹" },
    wild:        { label: "Wild",        emoji: "👑" },
    "valar-morghulis": { label: "Valar Morghulis", emoji: "💀" },
  };

  const cards = player.cards.map((card, i) => {
    const display = CARD_DISPLAY[card.cardType] ?? { label: card.cardType, emoji: "?" };
    return {
      index:       i,
      cardType:    card.cardType,
      territoryId: card.territoryId,
      territoryName: card.territoryId ? TERRITORIES[card.territoryId]?.name ?? card.territoryId : null,
      emoji:       display.emoji,
      label:       display.label,
    };
  });

  return {
    cards,
    validSets:      findAllValidCardSets(player.cards),
    nextTradeValue: previewTradeValue(),
    mustTrade:      mustTradeCards(),
  };
}

/**
 * Returns the final scores in display format.
 * Call this when gameOver is true.
 *
 * @returns {Array} [{ rank, houseId, name, sigil, color, score, territories, castles, ports }, ...]
 */
export function getScoreDisplayData() {
  const scores = calcSkirmishScores();
  return scores.map((s, i) => ({
    rank:        i + 1,
    houseId:     s.houseId,
    name:        s.name,
    sigil:       HOUSES[s.houseId]?.sigil ?? "?",
    color:       HOUSES[s.houseId]?.color ?? "#666",
    score:       s.score,
    territories: s.territories,
    castles:     s.castles,
    ports:       s.ports,
  }));
}


// =============================================================================
// SECTION 5 — PRIVATE UTILITIES
// =============================================================================

/**
 * Rolls n six-sided dice and returns the results as an array.
 * Results are NOT sorted — sorting happens in gameState.resolveAttack().
 *
 * @param {number} n — number of dice to roll (1–3)
 * @returns {number[]} e.g. [6, 2, 4]
 */
function _rollDice(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1);
}

/**
 * Fisher-Yates shuffle (local copy — boardData also exports one,
 * but we keep this private here to avoid an unnecessary import).
 *
 * @param {any[]} array
 * @returns {any[]} new shuffled array
 */
function _shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
