/* ===== ai.js ===== */
// =============================================================================
// ai.js
// AI opponent using evolved parameters from ai_lab.html.
// Parameters are loaded from localStorage (same key as the lab).
// Falls back to hardcoded defaults if no evolved params exist yet.
// =============================================================================

var AI_DELAY = 500;

// -----------------------------------------------------------------------------
// EVOLVED PARAMETERS
// Loaded from localStorage written by ai_lab.html.
// To update: run ai_lab.html, let it evolve, then the game picks it up
// automatically on next load — no manual copy-paste needed.
// -----------------------------------------------------------------------------
var AI_PARAMS = (function() {
  var DEFAULTS = {
    maxAttacks:          5,
    minArmiesAtk:        4,
    manChance:           0.5,
    manFraction:         0.5,
    atkDiceFrac:         1.0,
    regionWeight:        0.7,
    attackWeakWeight:    0.7,
    finishPlayerWeight:  0.5,
    borderPressureWeight:0.6,
    threatWeight:        0.6
  };
  try {
    var raw = localStorage.getItem("risk_ai_evolution_v2");
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved && saved.bestParams) {
        // Merge — keep defaults for any missing keys
        var p = {};
        Object.keys(DEFAULTS).forEach(function(k) {
          p[k] = (saved.bestParams[k] !== undefined)
            ? saved.bestParams[k]
            : DEFAULTS[k];
        });
        return p;
      }
    }
  } catch(e) {}
  return DEFAULTS;
})();

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
  // Trade all valid sets, bonus armies go into the same session pool.
  var session = { armiesRemaining: getReinforceCount() };
  var keepGoing = true;
  while (keepGoing) {
    var player = getCurrentPlayer();
    var sets   = findAllValidCardSets(player.cards);
    if (sets.length === 0) break;
    var r = actionTradeCards(sets[0], session);
    if (!r.success) break;
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

    var state = getState();
    var house = state.players[state.currentPlayerIndex].houseId;

    // Frontline only (borders at least one enemy).
    var allTargets = getValidReinforceTargets();
    var targets = allTargets.filter(function(id) {
      return TERRITORIES[id].adjacentTo.some(function(adj) {
        return state.territories[adj] && state.territories[adj].owner !== house;
      });
    });
    if (targets.length === 0) targets = allTargets;
    if (targets.length === 0) { _aiEndTurn(onDone); return; }

    var tid = _aiChooseBestReinforce(targets, house);
    actionPlaceReinforcements(tid, 1, session);
    renderLog();
    showReinforcePip(tid);

    setTimeout(function() {
      renderMap();
      setTimeout(_placeOne, 50);
    }, 450);
  }

  _placeOne();
}
// =============================================================================
// PHASE 2 — ATTACK
// Attacks up to a random number of times (0–5), picking random source/target
// each time. After each conquest, occupies with maximum available armies.
// =============================================================================
function _aiDoAttack(onDone) {
  var attacksLeft = Math.floor(Math.random() * (AI_PARAMS.maxAttacks + 1));

  function _tryAttack() {
    if (attacksLeft <= 0) { _aiEndAttack(onDone); return; }

    var state   = getState();
    var house   = state.players[state.currentPlayerIndex].houseId;

    // Only attack from territories with enough armies.
    var sources = getValidAttackSources().filter(function(id) {
      return state.territories[id] &&
             state.territories[id].armies >= AI_PARAMS.minArmiesAtk;
    });
    if (sources.length === 0) { _aiEndAttack(onDone); return; }

    attacksLeft--;

    // Pick source with most armies.
    var fromId = sources.reduce(function(best, id) {
      return state.territories[id].armies > state.territories[best].armies
        ? id : best;
    });
    var fromArm = state.territories[fromId].armies;

    // Only attack weaker territories.
    var targets = getValidAttackTargets(fromId).filter(function(id) {
      return state.territories[id] && state.territories[id].armies < fromArm;
    });
    if (targets.length === 0) { setTimeout(_tryAttack, AI_DELAY); return; }

    var toId   = _aiChooseBestTarget(fromId, targets, house);
    var maxDice = getMaxAttackDice(fromId);
    var dice    = Math.max(1, Math.round(maxDice * AI_PARAMS.atkDiceFrac));

    var hColor = HOUSES[house] ? HOUSES[house].color : null;
    var result = actionAttack(fromId, toId, dice);
    showAttackPip(toId, hColor);
    renderGameScreen();

    if (!result.success) { setTimeout(_tryAttack, AI_DELAY); return; }

    if (result.data && result.data.conquered) {
      setTimeout(function() {
        var s2     = getState();
        var attack = s2.activeAttack;
        if (attack) {
          var fromT   = s2.territories[attack.fromTerritoryId];
          var maxMove = fromT ? fromT.armies - 1 : dice;
          actionOccupy(maxMove);
          renderGameScreen();
        }
        if (getState().gameOver) { onDone({ gameOver: true }); return; }
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
  setTimeout(function() {
    _aiDoManoeuvre(onDone); }, AI_DELAY);}
    
// =============================================================================
// PHASE 3 — MANOEUVRE
// 50% chance to move armies. Picks a random source and target, moves half
// the available armies (rounded down, minimum 1).
// =============================================================================
function _aiDoManoeuvre(onDone) {
  function _skip() {
    actionEndManoeuvre();
    renderGameScreen();
    setTimeout(function() { _aiDoDraw(onDone); }, AI_DELAY);
  }

  if (Math.random() >= AI_PARAMS.manChance) { _skip(); return; }

  var sources = getValidManoeuvreSources();
  if (sources.length === 0) { _skip(); return; }

  var fromId  = _aiPick(sources);
  var targets = getValidManoeuvreTargets(fromId);
  if (targets.length === 0) { _skip(); return; }

  // Prefer frontline targets — don't move into landlocked territories.
  var state     = getState();
  var house     = state.players[state.currentPlayerIndex].houseId;
  var frontline = targets.filter(function(id) {
    return TERRITORIES[id].adjacentTo.some(function(adj) {
      return state.territories[adj] && state.territories[adj].owner !== house;
    });
  });
  var toId  = _aiPick(frontline.length > 0 ? frontline : targets);
  var fromT = state.territories[fromId];
  var maxMove = fromT ? fromT.armies - 1 : 1;
  var count   = Math.max(1, Math.floor(maxMove * AI_PARAMS.manFraction));

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
  if (state.gameOver) { onDone({ gameOver: true }); return; }

  if (state.players[state.currentPlayerIndex].conqueredThisTurn) {
    var result = actionDrawCard();
    if (result.data && result.data.gameOver) {
      renderGameScreen();
      onDone({ gameOver: true });
      return;
    }
  }

  // Check again — drawCard may have triggered end game via elimination.
  state = getState();
  if (state.gameOver) { renderGameScreen(); onDone({ gameOver: true }); return; }

  renderGameScreen();
  setTimeout(function() { _aiEndTurn(onDone); }, AI_DELAY);
}

function _aiEndTurn(onDone) {
  var state = getState();
  if (state.gameOver) { onDone({ gameOver: true }); return; }
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
// Scored reinforce — picks the most threatened frontline territory.
function _aiChooseBestReinforce(targets, houseId) {
  var state     = getState();
  var best      = null;
  var bestScore = -Infinity;
  targets.forEach(function(tid) {
    var t     = state.territories[tid];
    var score = 0;
    // Threat: total enemy armies on borders vs our armies here
    var enemyArmies = 0;
    TERRITORIES[tid].adjacentTo.forEach(function(adj) {
      var adjT = state.territories[adj];
      if (adjT && adjT.owner !== houseId) enemyArmies += adjT.armies;
    });
    score += (enemyArmies / (t.armies + 1)) * AI_PARAMS.threatWeight;
    // Region priority bonus
    if (_aiInPriorityRegion(houseId, tid)) score += AI_PARAMS.regionWeight;
    if (score > bestScore) { bestScore = score; best = tid; }
  });
  return best || _aiPick(targets);
}

// Scored attack target — prefers weak, nearly-eliminated, high-pressure targets.
function _aiChooseBestTarget(fromId, targets, houseId) {
  var state     = getState();
  var best      = null;
  var bestScore = -Infinity;
  targets.forEach(function(tid) {
    var t     = state.territories[tid];
    var score = 0;
    // Prefer weak targets
    score += (1 / (t.armies + 1)) * AI_PARAMS.attackWeakWeight * 10;
    // Prefer finishing off nearly-eliminated players
    var owner = t.owner;
    if (owner && owner !== "neutral") {
      var remaining = Object.values(state.territories)
        .filter(function(tt) { return tt.owner === owner; }).length;
      if (remaining <= 3) score += AI_PARAMS.finishPlayerWeight * 5;
    }
    // Prefer high border-pressure territories
    var enemyBorders = TERRITORIES[tid].adjacentTo.filter(function(adj) {
      return state.territories[adj] && state.territories[adj].owner !== houseId;
    }).length;
    score += enemyBorders * AI_PARAMS.borderPressureWeight;
    // Region completion bonus
    if (_aiInPriorityRegion(houseId, tid)) score += AI_PARAMS.regionWeight * 3;
    if (score > bestScore) { bestScore = score; best = tid; }
  });
  return best || _aiPick(targets);
}

// Returns true if territory is in a region where this house owns >50%.
function _aiInPriorityRegion(houseId, territoryId) {
  var state  = getState();
  var result = false;
  Object.keys(REGIONS).forEach(function(rid) {
    var reg = REGIONS[rid];
    if (reg.territories.indexOf(territoryId) < 0) return;
    var owned = reg.territories.filter(function(t) {
      return state.territories[t] && state.territories[t].owner === houseId;
    }).length;
    if (owned / reg.territories.length > 0.5) result = true;
  });
  return result;
}

function _aiPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}