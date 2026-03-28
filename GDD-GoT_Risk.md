# Game Design Document
## RISK: Game of Thrones — Mobile Edition
### Hot-Seat Local Multiplayer | HTML/JS

---

## 1. PROJECT OVERVIEW

**Concept:** A faithful digital adaptation of the official RISK: Game of Thrones board game (by USAOPOLY/The Op), playable on a single mobile phone passed between players. Built in plain HTML, CSS, and JavaScript — no frameworks, no build tools. Designed from day one to be extended with AI opponents and additional game modes.

**Players:** 2–5 (Westeros map, Skirmish/Domination), 2 (Essos map), 6–7 (World at War, both maps)
**Session length target:** 20–90 minutes depending on mode
**Platform:** Mobile browser (Chrome/Safari), portrait and landscape aware

---

## 2. GAME MODES (in order of implementation priority)

| Mode | Players | Map | Complexity | Build Priority |
|------|---------|-----|------------|----------------|
| **Skirmish** | 2–5 | Westeros | Low — classic Risk rules with GoT skin | **Phase 1** |
| **Domination** | 2–5 | Westeros | High — adds gold, cards, objectives, specials | Phase 2 |
| **World at War** | 6–7 | Both maps | Very high — dual map, port connections | Phase 3 |

We start with **Skirmish only**. The codebase will be structured so Domination and World at War slot in cleanly later.

---

## 3. FACTIONS

### Westeros Map (3–5 players)
| House | Color | Seat of Power |
|-------|-------|---------------|
| Stark | Grey | Winterfell |
| Lannister | Gold | Casterly Rock |
| Baratheon | Yellow | Storm's End |
| Tyrell | Green | Highgarden |
| Martell | Orange | Sunspear |

### Essos Map (2 players)
| House | Color | Seat of Power |
|-------|-------|---------------|
| Targaryen | Red | Dragonstone |
| Ghiscari | Purple | Astapor |

> **Note:** In Skirmish, Seat of Power is simply a starting territory with bonus armies in Domination mode. In Skirmish it is tracked for end-game scoring purposes only.

---

## 4. MAPS & TERRITORIES

### Westeros Map
The Westeros board contains **~40 territories** grouped into named regions. Controlling an entire region grants bonus reinforcement armies.

**Key regions and territories (representative — full list in data file):**
- The North: Winterfell, The Dreadfort, Karhold, Castle Black, Deepwood Motte, Bear Island, Moat Cailin, White Harbour
- The Riverlands: Riverrun, Harrenhal, The Twins, Seagard
- The Vale: The Eyrie, Gulltown, Heart's Home
- The Westerlands: Casterly Rock, Lannisport, Clegane's Keep, Oxcross
- The Reach: Highgarden, Oldtown, Brightwater Keep, Ashford
- The Stormlands: Storm's End, Dragonstone, Blackwater Bay
- Dorne: Sunspear, The Tor, Planky Town, Yronwood

**Territory connections** define which territories are adjacent (attackable). These will be stored as a static adjacency list in a JS data file.

**Ports and Castles** exist on the map and affect scoring and gold (Domination). In Skirmish they affect end-game point totals only.

### Essos Map (Phase 3)
~30 territories. Connected to Westeros via west Essos ports ↔ east Westeros ports in World at War mode.

---

## 5. CORE RULES — SKIRMISH MODE (Phase 1 Target)

### 5.1 Setup
1. Players choose a House (2–5 players, Westeros map).
2. Shuffle territory deck. Deal all cards equally between players.
3. Each player places **2 army pieces** on each of their dealt territories.
4. Remaining territories (neutral) also get 2 neutral armies.
5. Collect territory cards. Shuffle deck. Take the bottom half, shuffle in the **Valar Morghulis** (end-game) card, place top half on bottom.
6. Roll dice to determine first player.

### 5.2 Turn Structure (4 actions per turn)
Each turn has exactly **4 phases**, performed in order:

**Phase 1 — Reinforce**
- Calculate armies earned:
  - 1 army per 3 territories controlled (minimum 3)
  - Bonus armies for controlling complete regions (per territory count on board)
  - Bonus armies for sets of 3 territory cards traded in (standard Risk escalation: 4, 6, 8, 10, 12, 15, then +5 each time)
- Place all earned armies on any owned territories.

**Phase 2 — Attack**
- Optional. Player may attack any number of times.
- Must have at least 2 armies on attacking territory.
- Must attack an adjacent enemy-controlled territory.
- **Dice resolution (standard Risk):**
  - Attacker rolls up to 3 dice (limited by armies − 1)
  - Defender rolls up to 2 dice (limited by armies)
  - Compare highest dice pairs. Higher die wins; ties go to defender.
  - Each comparison kills one army from the loser.
- Attacker must move at least as many armies as dice rolled into a conquered territory.
- If a player is eliminated (loses all territories), the attacking player takes all their territory cards.
- If the attacking player's territory card count exceeds 5 after taking eliminated player's cards, they must immediately trade sets until below 6.

**Phase 3 — Manoeuvre (Fortify)**
- Optional. Move any number of armies from one owned territory to one adjacent owned territory. Once only per turn.

**Phase 4 — Draw Territory Card**
- If the player conquered at least one territory this turn, draw one territory card.
- If hand reaches 6 cards, must trade a set immediately.

### 5.3 Territory Cards & Trading
- Three card types (matching original Risk): Infantry, Cavalry, Artillery (or GoT equivalents: Footsoldier, Knight, Siege Engine)
- Wild cards (2 in deck)
- Valid sets: 3 of a kind, 1 of each, or any 2 + a Wild
- Bonus armies for trading:
  - 1st set: 4 armies
  - 2nd: 6, 3rd: 8, 4th: 10, 5th: 12, 6th: 15
  - Each set after 6th: +5 (so 20, 25, etc.)
- **Matching territory bonus:** If a traded card shows a territory you own, place 2 extra armies on that territory.

### 5.4 Winning — Skirmish
- **Valar Morghulis card** is drawn → game ends immediately. Count points:
  - 1 point per territory controlled
  - 1 bonus point per castle controlled
  - 1 bonus point per port controlled
  - Highest score wins.
- **Elimination victory:** A player eliminates all opponents before the card is drawn → automatic win.

---

## 6. DOMINATION MODE ADDITIONS (Phase 2 — outline only)

> Full rules to be detailed in Phase 2 GDD update. Listed here for architectural awareness.

- **Gold coins:** Earned per turn. Used to buy cards and special units.
- **Maester cards:** One-time abilities, purchased for 200 gold.
- **Objective cards:** Personal secret goals worth victory points. Start with 2; can buy replacements.
- **Character cards:** 4 per House, each usable once per turn for a gold cost. Refreshed each turn.
- **Special Units (do not die, removed only when army is wiped):**
  - **Knights:** +1 to highest attacker die. Stackable.
  - **Siege Engines:** Upgrade one unit's die from d6 → d8. Not stackable on same unit.
  - **Fortifications:** Stationary. Upgrade all defenders' dice from d6 → d8.
- **Seat of Power piece:** Placed on House's home territory. 3 bonus armies (not counted in setup armies).
- **Victory condition:** First to 10 victory points, OR eliminate all opponents.

---

## 7. TECHNICAL ARCHITECTURE

### 7.1 Philosophy
- **No frameworks.** Vanilla HTML/CSS/JS only. Easy to understand, easy to deploy, no build step.
- **Separation of concerns from day one.** Game logic never touches the DOM. Rendering never touches game state directly.
- **Mobile-first.** Designed for a 375px wide screen, touch-friendly tap targets (minimum 44px).
- **Future-proof.** AI opponents and Domination mode should be addable without rewriting core logic.

### 7.2 Folder Structure
```
got-risk/
├── index.html              # Entry point — loads everything
├── css/
│   └── style.css           # All styles
├── js/
│   ├── main.js             # Boot, screen routing
│   ├── gameState.js        # Single source of truth for all game data
│   ├── gameLogic.js        # Pure functions: reinforcement calc, combat, card trading
│   ├── boardData.js        # Static territory list, adjacency map, region bonuses
│   ├── renderer.js         # Reads gameState, updates DOM/Canvas — nothing else
│   ├── inputHandler.js     # Touch/click events → calls gameLogic → updates gameState → calls renderer
│   └── ai.js              # (Stub in Phase 1) AI turn logic — plugged in later
├── assets/
│   ├── map-westeros.svg    # SVG map (territories as named paths)
│   ├── map-essos.svg       # (Phase 3)
│   └── icons/             # House sigils, card icons
└── GDD.md                  # This document, lives in the repo
```

### 7.3 Key Data Structures

**gameState object (single source of truth):**
```js
{
  mode: "skirmish",              // "skirmish" | "domination" | "worldatwar"
  phase: "reinforce",            // "setup" | "reinforce" | "attack" | "manoeuvre" | "draw"
  currentPlayerIndex: 0,
  players: [
    {
      id: "stark",
      name: "House Stark",
      color: "#888",
      isAI: false,
      territories: [],           // populated by reference to territory ids
      cards: [],                 // territory cards in hand
      tradeSetsUsed: 0,
      // Domination only:
      gold: 0,
      victoryPoints: 0,
      characterCards: [],
      objectiveCards: [],
    }
  ],
  territories: {
    "winterfell": {
      id: "winterfell",
      name: "Winterfell",
      region: "the-north",
      owner: "stark",           // player id or "neutral"
      armies: 3,
      hasCastle: true,
      hasPort: false,
      adjacentTo: ["the-dreadfort", "karhold", "moat-cailin"],
      // Domination only:
      specialUnits: [],
    },
    // ... all territories
  },
  deck: [],                      // territory cards remaining
  discardPile: [],
  valarMorghulisDrawn: false,
  winner: null,
  log: [],                       // array of strings, last 5 shown as game log
}
```

**boardData.js (static, never changes):**
```js
export const TERRITORIES = { /* ... */ };
export const REGIONS = {
  "the-north": { territories: ["winterfell", ...], bonus: 5 },
  // ...
};
export const CARD_TRADE_VALUES = [4, 6, 8, 10, 12, 15]; // then +5
```

### 7.4 Rendering Strategy
We will use an **SVG map** with overlaid HTML elements for army counts. This is the sweet spot for mobile:
- SVG scales perfectly to any screen size
- Each territory is a named `<path>` in the SVG — tappable
- Army count badges are absolutely-positioned `<div>` elements layered on top
- No Canvas needed for Phase 1 (Canvas considered but adds complexity for click detection)

### 7.5 Screen Flow
```
Start Screen
  └── Mode Select (Skirmish | Domination | World at War)
        └── Player Setup (choose houses, player count, names)
              └── Game Board
                    ├── Map view (main gameplay)
                    ├── Phase indicator (top bar)
                    ├── Current player banner (bottom bar + pass-phone prompt)
                    ├── Action Panel (context-sensitive buttons)
                    └── End Game Screen (scores, winner)
```

---

## 8. PHASED ROADMAP

### Phase 0 — Foundation (Now)
- [ ] Set up GitHub repo with folder structure
- [ ] Create `index.html` with basic screen routing
- [ ] Write `boardData.js` with territories and adjacency list
- [ ] Stub all JS files with empty exports
- [ ] Confirm the data model works by console-logging a starting game state

**Goal:** No visuals yet. A working data foundation you can inspect in the browser console.

### Phase 1 — Skirmish Prototype
- [ ] SVG map rendered on screen, territories coloured by owner
- [ ] Army count badges on each territory
- [ ] Setup phase: card dealing, army placement
- [ ] Turn flow: Reinforce → Attack → Manoeuvre → Draw card
- [ ] Combat dice roller with result display
- [ ] Territory card hand display + trading UI
- [ ] Valar Morghulis end-game trigger + score screen
- [ ] Pass-phone hot-seat UI (clear "PASS TO [PLAYER]" overlay between turns)
- [ ] Game log (last 5 events shown)

**Goal:** A fully playable Skirmish game for 2–5 human players.

### Phase 2 — Domination Mode
- [ ] Gold coin system
- [ ] Character card UI (4 per house)
- [ ] Maester card deck + purchasing
- [ ] Objective card system + victory point tracker
- [ ] Special units (Knights, Siege, Fortifications) with modified dice
- [ ] Seat of Power placement and tracking

### Phase 3 — World at War
- [ ] Essos SVG map
- [ ] Dual-board layout / toggling
- [ ] Port connections between maps
- [ ] 6–7 player support

### Phase 4 — AI Opponents
- [ ] AI stub already in `ai.js` from Phase 0
- [ ] Simple greedy AI: attacks weakest neighbours, reinforces borders
- [ ] Difficulty levels

---

## 9. DESIGN DECISIONS & RATIONALE

**Why vanilla JS and no framework?**
Frameworks (React, Vue) add real power but also real complexity — build tools, npm, debugging. For a novice working solo, the overhead slows you down before you see results. Vanilla JS is learnable, deployable by just opening a file, and plenty powerful for this game.

**Why SVG map over Canvas?**
Canvas is faster but harder to work with for click detection and doesn't scale automatically. SVG paths are naturally tappable and scale to any screen. We can always layer Canvas on top later for animations.

**Why Skirmish first?**
Domination adds gold, 4 card types, special units, and dice modifications — that's a lot of new systems. Getting combat, the turn loop, and the map rendering working first gives you something playable quickly and a solid base to build on.

**Why a single `gameState.js` object?**
Having one source of truth makes saving, loading, and AI decision-making dramatically easier. The renderer always reads from it; logic always writes to it. This pattern also makes debugging straightforward: you can `console.log(gameState)` at any point and see everything.

**Hot-seat design consideration:**
Between turns, the game must show a full-screen "PASS TO [PLAYER X]" overlay that hides the game state (so the previous player can't see the next player's hand). This is a small but important UX feature.

---

## 10. RESOLVED DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Map — prototype** | Abstract placeholder SVG (circles + lines) | Build all logic first; swap real map in later without touching JS |
| **Map — final** | Proper Westeros SVG (Phase 1 polish / Phase 2) | Deferred until gameplay is proven |
| **Card artwork** | Text + emoji only (no images ever in prototype) | Fast to build, readable on small screens, no asset pipeline needed |
| **Sound effects** | None — permanently out of scope | Keeps the project clean; no audio API complexity |
| **Save / load game** | Out of scope until late development | `gameState` is already serialisation-friendly (plain object); `localStorage` can be added in one function when needed |
| **Build tools** | None — open `index.html` directly in browser | Zero setup friction for a novice; works on any machine |

---

## 11. EMOJI CARD REFERENCE (Territory Card types)

| Card Type | Emoji | GoT Flavour |
|-----------|-------|-------------|
| Infantry / Footsoldier | ⚔️ | Common soldier |
| Cavalry / Knight | 🐴 | Mounted knight |
| Artillery / Siege Engine | 🏹 | Scorpion / trebuchet |
| Wild card | 👑 | The Iron Throne |

Sets use the same matching rules as standard Risk.

---

*Document version 0.2 — decisions locked, ready for Phase 0 coding*
*Last updated: after scope confirmation*
