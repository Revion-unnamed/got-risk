/* ===== ai.js ===== */
// =============================================================================
// ai.js
// Random AI opponent — takes a full turn with 500ms delays between actions
// so the human player can watch what's happening.
//
// ENTRY POINT: runAITurn(onDone)
//   Called by inputHandler._startTurn() when the current player is AI.
//   onDone is called when the AI has finished its entire turn (after endTurn).
//
// DESIGN:
//   - Pure random strategy — no lookahead, no scoring.
//   - All actions go through the same gameLogic action functions that the
//     human player uses, so all rules are enforced identically.
//   - Uses setTimeout chains instead of async/await for Android WebView compat.
// =============================================================================

var AI_DELAY = 500;   // ms between each visible action


// =============================================================================
// ENTRY POINT
// =============================================================================

function runAITurn(onDone) {
  // Small initial pause so the render settles before AI starts acting.
  setTimeout(function() {
    _aiDoReinforce(onDone);
  }, AI_DELAY);
}


// =============================================================================
// PHASE 1 — REINFORCE
// Trade cards if forced, then place all armies one at a time on random
// owned territories.
// =============================================================================

function _aiDoReinforce(onDone) {
  // Force-trade cards if holding 6+.
  _aiTradeAllSets();

  var session = { armiesRemaining: getReinforceCount() };

  function _placeOne() {
    if (session.armiesRemaining <= 0) {
      // All placed — end reinforce phase.
      var result = actionEndReinforce(session);
      if (!result.success) {
        // Shouldn't happen, but bail gracefully.
        _aiEndTurn(onDone);
        return;
      }
      renderGameScreen();
      setTimeout(function() { _aiDoAttack(onDone); }, AI_DELAY);
      return;
    }

  var state   = getState();
    var currentHouse = state.players[state.currentPlayerIndex].houseId;
    var targets = getValidReinforceTargets().filter(function(id) {
      // Only reinforce territories that border at least one enemy — frontline only.
      return TERRITORIES[id].adjacentTo.some(function(adjId) {
        return state.territories[adjId] && state.territories[adjId].owner !== currentHouse;
      });
    });
    // Fall back to all owned territories if every territory is surrounded by friendlies.
    if (targets.length === 0) targets = getValidReinforceTargets();
    if (targets.length === 0) { _aiEndTurn(onDone); return; }

    var tid = _aiPick(targets);
    actionPlaceReinforcements(tid, 1, session);
    renderMap();
    renderLog();
    showReinforcePip(tid);

    setTimeout(_placeOne, AI_DELAY);
  }

  _placeOne();
}


// =============================================================================
// PHASE 2 — ATTACK
// Attacks up to a random number of times (0–5), picking random source/target
// each time. After each conquest, occupies with maximum available armies.
// =============================================================================

function _aiDoAttack(onDone) {
  // Decide upfront how many attacks to attempt this turn (0 to 5).
  var attacksLeft = Math.floor(Math.random() * 6);  // 0–5

  function _tryAttack() {
    if (attacksLeft <= 0) {
      _aiEndAttack(onDone);
      return;
    }

    var sources = getValidAttackSources();
    if (sources.length === 0) {
      _aiEndAttack(onDone);
      return;
    }

    attacksLeft--;

    // Only attack from territories with 4+ armies.
    var state    = getState();
    var goodSources = sources.filter(function(id) {
      return state.territories[id] && state.territories[id].armies >= 4;
    });
    if (goodSources.length === 0) { _aiEndAttack(onDone); return; }

    var fromId  = _aiPick(goodSources);
    var fromArmies = state.territories[fromId].armies;

    // Only attack territories with fewer armies than the attacker.
    var targets = getValidAttackTargets(fromId).filter(function(id) {
      return state.territories[id] && state.territories[id].armies < fromArmies;
    });
    if (targets.length === 0) { setTimeout(_tryAttack, AI_DELAY); return; }

    var toId    = _aiPick(targets);
    var maxDice = getMaxAttackDice(fromId);
    var dice    = maxDice;  // always roll max dice when conditions are favourable
    var state2  = getState();
    var hColor  = state2.players[state2.currentPlayerIndex]
                    ? (HOUSES[state2.players[state2.currentPlayerIndex].houseId] || {}).color : null;
    var result  = actionAttack(fromId, toId, dice);
    renderGameScreen();
    showAttackPip(toId, hColor);
    
    

    if (!result.success) {
      setTimeout(_tryAttack, AI_DELAY);
      return;
    }

    if (result.data && result.data.conquered) {
      // Occupy — move maximum armies in.
      setTimeout(function() {
        var state  = getState();
        var attack = state.activeAttack;
        if (attack) {
          var fromT  = state.territories[attack.fromTerritoryId];
          var maxMove = fromT ? fromT.armies - 1 : dice;
          actionOccupy(maxMove);
          renderGameScreen();
        }
        setTimeout(_tryAttack, AI_DELAY);
      }, AI_DELAY);
    } else {
      setTimeout(_tryAttack, AI_DELAY);
    }
  }

  _tryAttack();
}

function _aiEndAttack(onDone) {
  actionEndAttack();
  renderGameScreen();
  setTimeout(function() { _aiDoManoeuvre(onDone); }, AI_DELAY);
}


// =============================================================================
// PHASE 3 — MANOEUVRE
// 50% chance to move armies. Picks a random source and target, moves half
// the available armies (rounded down, minimum 1).
// =============================================================================

function _aiDoManoeuvre(onDone) {
  if (Math.random() < 0.5) {
    // Skip manoeuvre.
    actionEndManoeuvre();
    renderGameScreen();
    setTimeout(function() { _aiDoDraw(onDone); }, AI_DELAY);
    return;
  }

  var sources = getValidManoeuvreSources();
  if (sources.length === 0) {
    actionEndManoeuvre();
    renderGameScreen();
    setTimeout(function() { _aiDoDraw(onDone); }, AI_DELAY);
    return;
  }

  var fromId  = _aiPick(sources);
  var targets = getValidManoeuvreTargets(fromId);
  if (targets.length === 0) {
    actionEndManoeuvre();
    renderGameScreen();
    setTimeout(function() { _aiDoDraw(onDone); }, AI_DELAY);
    return;
  }
var currentHouse = getState().players[getState().currentPlayerIndex].houseId;
  var frontlineTargets = targets.filter(function(id) {
    // Only move into territories that border at least one enemy.
    return TERRITORIES[id].adjacentTo.some(function(adjId) {
      var s = getState();
      return s.territories[adjId] && s.territories[adjId].owner !== currentHouse;
    });
  });
  var toId = _aiPick(frontlineTargets.length > 0 ? frontlineTargets : targets);
  var state   = getState();
  var fromT   = state.territories[fromId];
  var maxMove = fromT ? fromT.armies - 1 : 1;
  var count   = Math.max(1, Math.floor(maxMove / 2));

  actionManoeuvre(fromId, toId, count);
  actionEndManoeuvre();
  renderGameScreen();
  setTimeout(function() { _aiDoDraw(onDone); }, AI_DELAY);
}


// =============================================================================
// PHASE 4 — DRAW
// Auto-draws if eligible, then ends the turn.
// =============================================================================

function _aiDoDraw(onDone) {
  var state = getState();
  if (state.players[state.currentPlayerIndex].conqueredThisTurn) {
    var result = actionDrawCard();
    if (result.data && result.data.gameOver) {
      renderGameScreen();
      onDone({ gameOver: true });
      return;
    }
  }
  renderGameScreen();
  setTimeout(function() { _aiEndTurn(onDone); }, AI_DELAY);
}

function _aiEndTurn(onDone) {
  var result = actionEndTurn();
  renderGameScreen();
  if (result.data && result.data.gameOver) {
    onDone({ gameOver: true });
    return;
  }
  onDone({ gameOver: false });
}


// =============================================================================
// HELPERS
// =============================================================================
// Trade ALL valid sets at the start of reinforce — forced or not.
// Mirrors what a sensible player would do: cash in everything available.
function _aiDoReinforce(onDone) {
  // One shared session — trade armies and territory armies go into the same pool.
  var session = { armiesRemaining: getReinforceCount() };

  // Trade all valid sets, adding bonus armies directly into the session.
  var keepGoing = true;
  while (keepGoing) {
    var player = getCurrentPlayer();
    var sets   = findAllValidCardSets(player.cards);
    if (sets.length === 0) { keepGoing = false; break; }
    var result = actionTradeCards(sets[0], session);
    if (!result.success) { keepGoing = false; break; }
    // session.armiesRemaining is mutated by actionTradeCards — bonus included.
  }
  renderLog();

  function _placeOne() {
    if (session.armiesRemaining <= 0) {
      var result = actionEndReinforce(session);
      if (!result.success) { _aiEndTurn(onDone); return; }
      renderGameScreen();
      setTimeout(function() { _aiDoAttack(onDone); }, AI_DELAY);
      return;
    }

    var targets = getValidReinforceTargets();
    if (targets.length === 0) { _aiEndTurn(onDone); return; }

    var tid = _aiPick(targets);
    actionPlaceReinforcements(tid, 1, session);
    showReinforcePip(tid);

    setTimeout(function() {
      renderMap();
      setTimeout(_placeOne, 50);
    }, 450);
   }

  _placeOne();
}


/**
 * Returns a random element from an array.
 */
function _aiPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
