/* ===== inputHandler.js ===== */
// =============================================================================
// inputHandler.js
// Wires player input to game logic and triggers re-renders.
//
// CORE PATTERN:
//   Player taps something
//     -> inputHandler calls a gameLogic action function
//       -> gameLogic updates state
//         -> inputHandler calls renderGameScreen()
//           -> renderer repaints everything
//             -> inputHandler calls _rewire() to attach fresh listeners
//
// WHY _rewire() EXISTS:
//   renderGameScreen() replaces the innerHTML of the action panel and log,
//   destroying all previously attached event listeners. _rewire() re-attaches
//   listeners to whatever buttons exist in the DOM right now.
//   It is safe to call repeatedly — it always checks for element existence first.
//
// SELECTION STATE:
//   The handler tracks a small _sel object for multi-step interactions
//   (attack source -> target, manoeuvre source -> target, occupy count).
//   This is purely UI state — it never touches gameState directly.
// =============================================================================


// -----------------------------------------------------------------------------
// MODULE STATE
// -----------------------------------------------------------------------------

var _callbacks = {};      // { onGameOver, onPassPhone } — set by initInputHandler

var _sel = {              // current UI selection state
  phase:          null,   // which sub-state we're in (mirrors game phase + sub-steps)
  attackSource:   null,   // territory id chosen as attack source
  manoeuvreSource:null,   // territory id chosen as manoeuvre source
  manoeuvreTarget:null,   // territory id chosen as manoeuvre target
  occupyCount:    0,      // armies to move into conquered territory
  occupyMin:      0,
  occupyMax:      0,
  cardSelected:   []      // indices of cards selected for trading
};

var _reinforceSession = { armiesRemaining: 0 };


// -----------------------------------------------------------------------------
// INIT
// Called once by _setupGameScreen() in main.js.
// -----------------------------------------------------------------------------

function initInputHandler(callbacks) {
  _callbacks = callbacks || {};

  // Wire static elements that exist in the HTML and never get replaced.
  _wireStaticElements();

  // Wire the card panel close button.
  var closeCards = document.getElementById("btn-close-cards");
  if (closeCards) {
    closeCards.addEventListener("click", function() {
      hideCardPanel();
    });
  }

  // Wire card panel trade button.
  var tradeBtn = document.getElementById("btn-trade-cards");
  if (tradeBtn) {
    tradeBtn.addEventListener("click", function() {
      _handleTradeCards();
    });
  }

  // Start the first turn.
  _startTurn();
}


// -----------------------------------------------------------------------------
// TURN START
// Called at init and after each endTurn().
// Calculates reinforcements, resets selection, re-renders, rewires.
// -----------------------------------------------------------------------------

function _startTurn() {
  _resetSelection();

  var state = getState();
  if (state.gameOver) {
    _handleGameOver();
    return;
  }

  // Check if the current player is AI — hand off to ai.js if so.
  var currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer && currentPlayer.isAI) {
    _reinforceSession.armiesRemaining = getReinforceCount();
    renderGameScreen();
    runAITurn(function(result) {
      if (result.gameOver) { _handleGameOver(); return; }
      // After AI turn, go straight to next turn — skip pass-phone for AI.
      _startTurn();
    });
    return;
  }

  // Human player — initialise session and wire buttons as normal.
  _reinforceSession.armiesRemaining = getReinforceCount();

  renderGameScreen();
  _rewire();
}


// -----------------------------------------------------------------------------
// RE-WIRE
// Attaches event listeners to whatever action panel buttons exist right now.
// Safe to call after every render.
// -----------------------------------------------------------------------------

function _rewire() {
  var state = getState();
  if (state.gameOver) return;

  // Always wire card-related buttons regardless of phase.
  _wireBtn("btn-view-cards", function() {
    _sel.cardSelected = [];
    showCardPanel();
    _rewireCardPanel();
  });

  _wireBtn("btn-close-cards", function() { hideCardPanel(); });

  _wireBtn("btn-trade-cards", function() { _handleTradeCards(); });

  // Phase-specific wiring.
  if (mustTradeCards()) {
    // No phase buttons — only the open-cards button matters.
    return;
  }

  switch (state.phase) {
    case "reinforce":  _rewireReinforce(); break;
    case "attack":     _rewireAttack(state); break;
    case "manoeuvre":  _rewireManoeuvre(state); break;
    case "draw":       _rewireDraw(); break;
  }
}


// -----------------------------------------------------------------------------
// REINFORCE PHASE
// -----------------------------------------------------------------------------

function _rewireReinforce() {
  _wireBtn("btn-end-reinforce", function() {
    var result = actionEndReinforce(_reinforceSession);
    if (!result.success) { _showError(result.error); return; }
    renderGameScreen();
    _rewire();
  });
  _updateReinforceCounter();
}

function _updateReinforceCounter() {
  var el = document.getElementById("action-army-counter");
  if (el) el.textContent = _reinforceSession.armiesRemaining + " armies left";

  // Enable Done button only when all armies placed.
  var doneBtn = document.getElementById("btn-end-reinforce");
  if (doneBtn) doneBtn.disabled = _reinforceSession.armiesRemaining > 0;
}

// Territory tap during reinforce — place 1 army at a time.
function _handleReinforceTerritory(territoryId) {
  if (_reinforceSession.armiesRemaining <= 0) {
    _showError("No armies left to place. Tap Done.");
    return;
  }

  var result = actionPlaceReinforcements(territoryId, 1, _reinforceSession);
  if (!result.success) { _showError(result.error); return; }

  // Partial re-render — just map and counter, not full repaint.
  renderMap();
  renderLog();
  _updateReinforceCounter();
  // Auto-advance to attack phase when all armies are placed.
if (_reinforceSession.armiesRemaining === 0) {
  var result = actionEndReinforce(_reinforceSession);
  if (!result.success) return;
  renderGameScreen();
  _rewire();
}
}


// -----------------------------------------------------------------------------
// ATTACK PHASE
// -----------------------------------------------------------------------------

function _rewireAttack(state) {
  // If waiting for occupation input, wire the occupy controls.
  if (state.activeAttack && state.activeAttack.resolved && state.activeAttack.conquered) {
    _rewireOccupy(state);
    return;
  }

  _wireBtn("btn-end-attack", function() {
    var result = actionEndAttack();
    if (!result.success) { _showError(result.error); return; }
    _resetSelection();
    renderGameScreen();
    _rewire();
  });
}

function _rewireOccupy(state) {
  var attack  = state.activeAttack;
  var fromT   = state.territories[attack.fromTerritoryId];
  _sel.occupyMin   = attack.attackerDice;
  _sel.occupyMax   = fromT ? fromT.armies - 1 : attack.attackerDice;
  _sel.occupyCount = _sel.occupyMin;
  _updateOccupyCounter();

  _wireBtn("btn-occupy-less", function() {
    if (_sel.occupyCount > _sel.occupyMin) {
      _sel.occupyCount--;
      _updateOccupyCounter();
    }
  });

  _wireBtn("btn-occupy-more", function() {
    if (_sel.occupyCount < _sel.occupyMax) {
      _sel.occupyCount++;
      _updateOccupyCounter();
    }
  });

  _wireBtn("btn-occupy-confirm", function() {
    var result = actionOccupy(_sel.occupyCount);
    if (!result.success) { _showError(result.error); return; }
    _resetSelection();
    renderGameScreen();
    _rewire();
  });
}

function _updateOccupyCounter() {
  var el = document.getElementById("occupy-count");
  if (el) el.textContent = _sel.occupyCount;
}

// Territory tap during attack phase.
function _handleAttackTerritory(territoryId) {
  var state = getState();

  // If waiting for occupation, ignore map taps.
  if (state.activeAttack && state.activeAttack.resolved && state.activeAttack.conquered) return;

  var currentHouse = state.players[state.currentPlayerIndex].houseId;
  var tState       = state.territories[territoryId];

  // ── Step 1: select attack source ──
  if (!_sel.attackSource) {
    if (tState.owner !== currentHouse) {
      _showError("Select one of your own territories to attack from.");
      return;
    }
    if (tState.armies < 2) {
      _showError("Need at least 2 armies to attack.");
      return;
    }
    var targets = getValidAttackTargets(territoryId);
    if (targets.length === 0) {
      _showError("No enemy territories adjacent to attack.");
      return;
    }
    _sel.attackSource = territoryId;
    setMapSelection({ source: territoryId, attackable: targets });
    renderMap();
    return;
  }

  // ── Step 2: tap the source again to deselect ──
  if (territoryId === _sel.attackSource) {
    _sel.attackSource = null;
    clearMapSelection();
    renderMap();
    return;
  }

  // ── Step 3: tap an attackable target ──
  var isAttackable = getValidAttackTargets(_sel.attackSource).indexOf(territoryId) >= 0;
  if (!isAttackable) {
    // Tapped a non-adjacent or friendly territory — reselect as source if valid.
    if (tState.owner === currentHouse && tState.armies >= 2) {
      var newTargets = getValidAttackTargets(territoryId);
      if (newTargets.length > 0) {
        _sel.attackSource = territoryId;
        setMapSelection({ source: territoryId, attackable: newTargets });
        renderMap();
        return;
      }
    }
    _showError("That territory cannot be attacked from here.");
    return;
  }

  // Valid target — open the combat modal.
  showCombatModal(_sel.attackSource, territoryId);
  _wireCombatModal(_sel.attackSource, territoryId);
}

function _wireCombatModal(fromId, toId) {
  _wireBtn("btn-cancel-attack", function() {
    hideCombatModal();
    _sel.attackSource = null;
    clearMapSelection();
    renderMap();
    _rewire();
  });

  _wireBtn("btn-roll-attack", function() {
    var rollBtn = document.getElementById("btn-roll-attack");
    var dice    = rollBtn ? parseInt(rollBtn.getAttribute("data-dice"), 10) : 1;

    var result = actionAttack(fromId, toId, dice);
    if (!result.success) { _showError(result.error); return; }

    showCombatResult(result.data);
    _wireCombatAfterRoll(fromId, toId, result.data);
  });
}

function _wireCombatAfterRoll(fromId, toId, result) {
  if (result.conquered) {
    // Territory taken — wire the "Continue" button to close modal
    // and show occupation controls in the action panel.
    _wireBtn("btn-close-combat", function() {
      hideCombatModal();
      _sel.attackSource = null;
      clearMapSelection();
      renderGameScreen();   // action panel will now show occupy controls
      _rewire();
    });
  } else {
    // Can roll again or close.
    _wireBtn("btn-close-combat", function() {
      hideCombatModal();
      _sel.attackSource = null;
      clearMapSelection();
      renderGameScreen();
      _rewire();
    });

    // Roll again button — same targets.
    _wireBtn("btn-roll-attack", function() {
      var rollBtn = document.getElementById("btn-roll-attack");
      var dice    = rollBtn ? parseInt(rollBtn.getAttribute("data-dice"), 10) : 1;
      var again   = actionAttack(fromId, toId, dice);
      if (!again.success) { _showError(again.error); return; }
      showCombatResult(again.data);
      _wireCombatAfterRoll(fromId, toId, again.data);
    });
  }
}


// -----------------------------------------------------------------------------
// MANOEUVRE PHASE
// -----------------------------------------------------------------------------
function _rewireManoeuvre(state) {
  _wireBtn("btn-skip-manoeuvre", function() {
    var r1 = actionEndManoeuvre();
    if (!r1.success) { _showError(r1.error); return; }
    var r2 = actionEndTurn();
    if (!r2.success) { _showError(r2.error); return; }
    if (r2.data && r2.data.gameOver) { _handleGameOver(); return; }
    _doPassPhone();
  });

  _wireBtn("btn-end-manoeuvre", function() {
    var r1 = actionEndManoeuvre();
    if (!r1.success) { _showError(r1.error); return; }
    var r2 = actionEndTurn();
    if (!r2.success) { _showError(r2.error); return; }
    if (r2.data && r2.data.gameOver) { _handleGameOver(); return; }
    _doPassPhone();
  });
}


function _handleManoeuvreTerritory(territoryId) {
  var state        = getState();
  var currentHouse = state.players[state.currentPlayerIndex].houseId;
  var tState       = state.territories[territoryId];

  if (state.manoeuvreUsed) return;

  // ── Step 1: select source ──
  if (!_sel.manoeuvreSource) {
    if (tState.owner !== currentHouse || tState.armies < 2) {
      _showError("Select an owned territory with at least 2 armies.");
      return;
    }
    var targets = getValidManoeuvreTargets(territoryId);
    if (targets.length === 0) {
      _showError("No adjacent owned territories to move to.");
      return;
    }
    _sel.manoeuvreSource = territoryId;
    setMapSelection({ source: territoryId, manoeuvrable: targets });
    renderMap();
    return;
  }

  // ── Deselect source ──
  if (territoryId === _sel.manoeuvreSource) {
    _sel.manoeuvreSource = null;
    clearMapSelection();
    renderMap();
    return;
  }

  // ── Step 2: select target ──
  var validTargets = getValidManoeuvreTargets(_sel.manoeuvreSource);
  if (validTargets.indexOf(territoryId) < 0) {
    if (tState.owner === currentHouse && tState.armies >= 2) {
      var newTargets = getValidManoeuvreTargets(territoryId);
      if (newTargets.length > 0) {
        _sel.manoeuvreSource = territoryId;
        setMapSelection({ source: territoryId, manoeuvrable: newTargets });
        renderMap();
        return;
      }
    }
    _showError("Cannot manoeuvre to that territory.");
    return;
  }

  // Valid target — show army count prompt.
  _sel.manoeuvreTarget = territoryId;
  _showManoeuvreCountPrompt(state);
}

function _showManoeuvreCountPrompt(state) {
  var fromArmies = state.territories[_sel.manoeuvreSource].armies;
  var maxMove    = fromArmies - 1;
  var panel      = document.getElementById("game-action-panel");
  if (!panel) return;

  var moveCount = Math.max(1, Math.floor(maxMove / 2));

  panel.innerHTML = '<p class="action-instructions">How many armies to move?</p>'
    + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin:4px 0">'
    + '<button id="btn-man-less" class="btn btn-secondary" style="padding:2px 14px;min-height:36px">-</button>'
    + '<span id="man-count" style="font-size:1.4rem;font-weight:700;color:#c9a84c">' + moveCount + "</span>"
    + '<button id="btn-man-more" class="btn btn-secondary" style="padding:2px 14px;min-height:36px">+</button>'
    + "</div>"
    + '<div class="action-btn-row">'
    + '<button id="btn-man-cancel" class="btn btn-secondary">Cancel</button>'
    + '<button id="btn-man-confirm" class="btn btn-primary">Move</button>'
    + "</div>";

  var count = { val: moveCount };

  _wireBtn("btn-man-less", function() {
    if (count.val > 1) { count.val--; var el = document.getElementById("man-count"); if (el) el.textContent = count.val; }
  });
  _wireBtn("btn-man-more", function() {
    if (count.val < maxMove) { count.val++; var el = document.getElementById("man-count"); if (el) el.textContent = count.val; }
  });
  _wireBtn("btn-man-cancel", function() {
    _sel.manoeuvreSource = null;
    _sel.manoeuvreTarget = null;
    clearMapSelection();
    renderGameScreen();
    _rewire();
  });
  _wireBtn("btn-man-confirm", function() {
  var r1 = actionManoeuvre(_sel.manoeuvreSource, _sel.manoeuvreTarget, count.val);
  if (!r1.success) { _showError(r1.error); return; }
  var r2 = actionEndManoeuvre();
  if (!r2.success) { _showError(r2.error); return; }
  var r3 = actionEndTurn();
  if (!r3.success) { _showError(r3.error); return; }
  if (r3.data && r3.data.gameOver) { _handleGameOver(); return; }
  _resetSelection();
  _doPassPhone();
});
  
}


// -----------------------------------------------------------------------------
// DRAW PHASE
// -----------------------------------------------------------------------------
function _rewireDraw() {
  var state = getState();

  // Auto-draw if the player conquered at least one territory this turn.
  // No button tap needed — happens immediately when the draw phase starts.
  if (state.players[state.currentPlayerIndex].conqueredThisTurn) {
    var result = actionDrawCard();
    if (!result.success) { _showError(result.error); return; }
    if (result.data && result.data.gameOver) { _handleGameOver(); return; }
    renderGameScreen();
    // Fall through — re-wire the End Turn button after auto-draw.
  }

  _wireBtn("btn-end-turn", function() {
    if (mustTradeCards()) { _showError("Trade cards before ending your turn."); return; }
    var result = actionEndTurn();
    if (!result.success) { _showError(result.error); return; }
    if (result.data && result.data.gameOver) { _handleGameOver(); return; }
    _doPassPhone();
  });
}



// -----------------------------------------------------------------------------
// CARD TRADING
// -----------------------------------------------------------------------------
function _rewireCardPanel() {
  _wireBtn("btn-close-cards", function() {
    // Block closing if a trade is mandatory.
    if (mustTradeCards()) {
      _showError("You must trade a set before continuing.");
      return;
    }
    _sel.cardSelected = [];
    updateCardSelection([]);
    hideCardPanel();
  });

  _wireBtn("btn-trade-cards", function() {
    _handleTradeCards();
  });
}


function _handleTradeCards() {
  if (_sel.cardSelected.length !== 3) {
    _showError("Select exactly 3 cards to trade.");
    return;
  }

  var result = actionTradeCards(_sel.cardSelected, _reinforceSession);
  if (!result.success) { _showError(result.error); return; }

  _sel.cardSelected = [];
  updateCardSelection([]);

  // Refresh card panel display.
  var cardData = getCardDisplayData();
  var body     = document.getElementById("card-panel-body");
  var info     = document.getElementById("card-trade-info");
  if (info) info.textContent = "Traded! +" + result.armiesEarned + " armies earned.";

  // Re-render panel body with updated hand.
  showCardPanel();
  _rewireCardPanel();

  // Update army counter if in reinforce phase.
  _updateReinforceCounter();
  renderMap();
  renderLog();
}

// Called by renderer when player taps a card.
function handleCardTap(index) {
  var alreadyIdx = _sel.cardSelected.indexOf(index);

  if (alreadyIdx >= 0) {
    // Deselect.
    _sel.cardSelected.splice(alreadyIdx, 1);
  } else {
    if (_sel.cardSelected.length >= 3) {
      _showError("Already 3 cards selected. Deselect one first.");
      return;
    }
    _sel.cardSelected.push(index);
  }

  updateCardSelection(_sel.cardSelected);
}


// -----------------------------------------------------------------------------
// TERRITORY TAP ROUTER
// Routes taps to the correct phase handler.
// Overwrites the stub in renderer.js.
// -----------------------------------------------------------------------------

function handleTerritoryTap(id) {
  var state = getState();
  if (state.gameOver) return;
  if (mustTradeCards()) { _showError("Trade cards before taking any action."); return; }

  switch (state.phase) {
    case "reinforce":  _handleReinforceTerritory(id);  break;
    case "attack":     _handleAttackTerritory(id);     break;
    case "manoeuvre":  _handleManoeuvreTerritory(id);  break;
    case "draw":       /* tapping map during draw does nothing */ break;
  }
}


// -----------------------------------------------------------------------------
// PASS-PHONE FLOW
// -----------------------------------------------------------------------------

function _doPassPhone() {
  var state      = getState();
  var nextPlayer = state.players[state.currentPlayerIndex];

  // Skip the pass-phone overlay entirely if the next player is AI.
  if (nextPlayer && nextPlayer.isAI) {
    _startTurn();
    return;
  }

  if (_callbacks.onPassPhone) {
    _callbacks.onPassPhone(nextPlayer.name, function() {
      _startTurn();
    });
  } else {
    _startTurn();
  }
}


// -----------------------------------------------------------------------------
// GAME OVER
// -----------------------------------------------------------------------------

function _handleGameOver() {
  var scores = getScoreDisplayData();
  if (_callbacks.onGameOver) {
    _callbacks.onGameOver(scores);
  }
}


// -----------------------------------------------------------------------------
// STATIC ELEMENT WIRING
// Elements that exist in the HTML permanently and never get replaced.
// -----------------------------------------------------------------------------

function _wireStaticElements() {
  // Combat modal backdrop — tapping outside closes it.
  var backdrop = document.querySelector("#combat-modal .modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", function() {
      hideCombatModal();
      _sel.attackSource = null;
      clearMapSelection();
      renderGameScreen();
      _rewire();
    });
  }
}


// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

/**
 * Wires a single button by ID, safely replacing any existing listener.
 * Uses replaceWith(cloneNode) to clear old listeners before adding new.
 */
function _wireBtn(id, handler) {
  var btn = document.getElementById(id);
  if (!btn) return;
  var fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener("click", handler);
}

/**
 * Resets all UI selection state.
 */
function _resetSelection() {
  _sel.attackSource    = null;
  _sel.manoeuvreSource = null;
  _sel.manoeuvreTarget = null;
  _sel.occupyCount     = 0;
  _sel.occupyMin       = 0;
  _sel.occupyMax       = 0;
  _sel.cardSelected    = [];
  clearMapSelection();
}

/**
 * Shows a brief error message in the action instructions area.
 * Fades out after 2.5 seconds.
 */
function _showError(message) {
  var el = document.querySelector("#game-action-panel .action-instructions");
  if (!el) {
    // No instructions element — inject a temporary one.
    var panel = document.getElementById("game-action-panel");
    if (!panel) return;
    var tmp = document.createElement("p");
    tmp.className = "action-instructions";
    tmp.style.color = "#e74c3c";
    tmp.textContent = message;
    panel.insertBefore(tmp, panel.firstChild);
    setTimeout(function() {
      if (tmp.parentNode) tmp.parentNode.removeChild(tmp);
    }, 2500);
    return;
  }
  var prev = el.textContent;
  var prevColor = el.style.color;
  el.textContent = message;
  el.style.color = "#e74c3c";
  setTimeout(function() {
    el.textContent = prev;
    el.style.color = prevColor;
  }, 2500);
}


