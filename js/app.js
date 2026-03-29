/* app.js - RISK: Game of Thrones - single bundle - do not edit directly */

/* ===== boardData.js ===== */
// =============================================================================
// boardData.js
// Static game data for RISK: Game of Thrones — Westeros map
//
// IMPORTANT: This file is read-only game data. Never modify it during gameplay.
// All adjacency lists are bidirectional — if A lists B, B must list A.
//
// ⚠️  VERIFY FLAG: Entries marked [VERIFY] should be checked against the
//     physical board before treating as final. Adjacency is especially tricky
//     for sea/port connections and cross-region borders.
// =============================================================================


// -----------------------------------------------------------------------------
// REGIONS
// Each region has a list of territory IDs it contains and a reinforcement bonus
// (armies earned for controlling ALL territories in that region).
// Bonus values are from the official board.
// -----------------------------------------------------------------------------

const REGIONS = {
  "the-north": {
    name: "The North",
    bonus: 6,
    territories: [
      "castle-black",
      "karhold",
      "the-dreadfort",
      "winterfell",
      "deepwood-motte",
      "bear-island",
      "torrhen-square",
      "white-harbour",
      "moat-cailin",
    ],
  },

  "the-iron-islands": {
    name: "The Iron Islands",
    bonus: 2,
    territories: [
      "pyke",
      "great-wyk",
      "old-wyk",
    ],
  },

  "the-riverlands": {
    name: "The Riverlands",
    bonus: 4,
    territories: [
      "the-twins",
      "riverrun",
      "seagard",
      "harrenhal",
      "maidenpool",
    ],
  },

  "the-vale": {
    name: "The Vale",
    bonus: 3,
    territories: [
      "the-eyrie",
      "gulltown",
      "hearts-home",
    ],
  },

  "the-westerlands": {
    name: "The Westerlands",
    bonus: 4,
    territories: [
      "casterly-rock",
      "lannisport",
      "cleganes-keep",
      "oxcross",
      "golden-tooth",
    ],
  },

  "the-crownlands": {
    name: "The Crownlands",
    bonus: 3,
    territories: [
      "kings-landing",
      "dragonstone",
      "crackclaw-point",
    ],
  },

  "the-reach": {
    name: "The Reach",
    bonus: 5,
    territories: [
      "highgarden",
      "oldtown",
      "brightwater-keep",
      "ashford",
      "horn-hill",
      "three-towers",
    ],
  },

  "the-stormlands": {
    name: "The Stormlands",
    bonus: 3,
    territories: [
      "storms-end",
      "bronzegate",
      "felwood",
    ],
  },

  "dorne": {
    name: "Dorne",
    bonus: 3,
    territories: [
      "sunspear",
      "the-tor",
      "planky-town",
      "yronwood",
    ],
  },
};


// -----------------------------------------------------------------------------
// TERRITORIES
// Each territory has:
//   id         — kebab-case unique identifier (matches key)
//   name       — display name shown to players
//   region     — which region it belongs to
//   hasCastle  — worth +1 point at end of Skirmish; used in Domination
//   hasPort    — worth +1 point at end of Skirmish; sea attack in Skirmish
//   cardType   — which type of territory card this territory appears on:
//                "footsoldier" (⚔️) | "knight" (🐴) | "siege" (🏹)
//   adjacentTo — array of territory IDs this territory can attack/be attacked from
//                Includes both land borders AND port-to-port sea connections.
//
// ⚠️  VERIFY: All adjacentTo lists should be cross-checked against the physical
//     board. Port connections especially — in Skirmish any port can attack any
//     other port on the SAME coastline (west coast or east coast of Westeros).
//     We model this as direct adjacency here for simplicity.
// -----------------------------------------------------------------------------

const TERRITORIES = {

  // ── THE NORTH ──────────────────────────────────────────────────────────────

  "castle-black": {
    id: "castle-black",
    name: "Castle Black",
    region: "the-north",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: ["karhold", "the-dreadfort", "winterfell"],
    // Castle Black sits at the Wall; no territory north of it on this map.
    // [VERIFY] exact southern adjacencies on physical board.
  },

  "karhold": {
    id: "karhold",
    name: "Karhold",
    region: "the-north",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: ["castle-black", "the-dreadfort", "white-harbour"],
  },

  "the-dreadfort": {
    id: "the-dreadfort",
    name: "The Dreadfort",
    region: "the-north",
    hasCastle: true,
    hasPort: false,
    cardType: "siege",
    adjacentTo: ["castle-black", "karhold", "winterfell", "white-harbour"],
  },

  "winterfell": {
    id: "winterfell",
    name: "Winterfell",
    region: "the-north",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "castle-black",
      "the-dreadfort",
      "deepwood-motte",
      "torrhen-square",
      "moat-cailin",
      "white-harbour",
    ],
    // Winterfell = Stark Seat of Power
  },

  "deepwood-motte": {
    id: "deepwood-motte",
    name: "Deepwood Motte",
    region: "the-north",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: ["winterfell", "torrhen-square", "bear-island"],
    // [VERIFY] whether Deepwood Motte connects to Iron Islands territories
  },

  "bear-island": {
    id: "bear-island",
    name: "Bear Island",
    region: "the-north",
    hasCastle: false,
    hasPort: true,
    cardType: "siege",
    adjacentTo: ["deepwood-motte", "torrhen-square", "pyke"],
    // Port: Bear Island west coast → can attack Iron Islands ports [VERIFY]
  },

  "torrhen-square": {
    id: "torrhen-square",
    name: "Torrhen's Square",
    region: "the-north",
    hasCastle: false,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "deepwood-motte",
      "bear-island",
      "winterfell",
      "moat-cailin",
    ],
  },

  "white-harbour": {
    id: "white-harbour",
    name: "White Harbour",
    region: "the-north",
    hasCastle: false,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "karhold",
      "the-dreadfort",
      "winterfell",
      "moat-cailin",
      "the-twins",  // [VERIFY] cross-region border at The Neck
      "maidenpool", // port-to-port east coast [VERIFY]
    ],
  },

  "moat-cailin": {
    id: "moat-cailin",
    name: "Moat Cailin",
    region: "the-north",
    hasCastle: false,
    hasPort: false,
    cardType: "siege",
    adjacentTo: [
      "torrhen-square",
      "winterfell",
      "white-harbour",
      "the-twins",    // gateway between North and Riverlands
      "seagard",      // [VERIFY]
    ],
  },


  // ── THE IRON ISLANDS ────────────────────────────────────────────────────────

  "pyke": {
    id: "pyke",
    name: "Pyke",
    region: "the-iron-islands",
    hasCastle: true,
    hasPort: true,
    cardType: "footsoldier",
    adjacentTo: [
      "great-wyk",
      "old-wyk",
      "bear-island",   // port-to-port west coast [VERIFY]
      "seagard",       // port-to-port [VERIFY]
      "lannisport",    // port-to-port west coast [VERIFY]
    ],
    // Pyke = Greyjoy home (neutral in base Westeros 3-5 player game)
  },

  "great-wyk": {
    id: "great-wyk",
    name: "Great Wyk",
    region: "the-iron-islands",
    hasCastle: false,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "pyke",
      "old-wyk",
      "lannisport", // port-to-port [VERIFY]
    ],
  },

  "old-wyk": {
    id: "old-wyk",
    name: "Old Wyk",
    region: "the-iron-islands",
    hasCastle: false,
    hasPort: true,
    cardType: "siege",
    adjacentTo: [
      "pyke",
      "great-wyk",
    ],
  },


  // ── THE RIVERLANDS ──────────────────────────────────────────────────────────

  "the-twins": {
    id: "the-twins",
    name: "The Twins",
    region: "the-riverlands",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "moat-cailin",
      "white-harbour",
      "seagard",
      "riverrun",
      "harrenhal",
    ],
  },

  "riverrun": {
    id: "riverrun",
    name: "Riverrun",
    region: "the-riverlands",
    hasCastle: true,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "the-twins",
      "seagard",
      "harrenhal",
      "golden-tooth",   // border with Westerlands [VERIFY]
      "oxcross",        // [VERIFY]
      "ashford",        // [VERIFY] border with The Reach
    ],
  },

  "seagard": {
    id: "seagard",
    name: "Seagard",
    region: "the-riverlands",
    hasCastle: false,
    hasPort: true,
    cardType: "siege",
    adjacentTo: [
      "the-twins",
      "riverrun",
      "moat-cailin",   // [VERIFY]
      "pyke",          // port-to-port west coast [VERIFY]
    ],
  },

  "harrenhal": {
    id: "harrenhal",
    name: "Harrenhal",
    region: "the-riverlands",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "the-twins",
      "riverrun",
      "maidenpool",
      "kings-landing",   // border with Crownlands [VERIFY]
      "crackclaw-point", // [VERIFY]
      "oxcross",         // [VERIFY]
    ],
  },

  "maidenpool": {
    id: "maidenpool",
    name: "Maidenpool",
    region: "the-riverlands",
    hasCastle: false,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "harrenhal",
      "crackclaw-point",
      "white-harbour",   // port-to-port east coast [VERIFY]
      "gulltown",        // port-to-port east coast [VERIFY]
    ],
  },


  // ── THE VALE ────────────────────────────────────────────────────────────────

  "the-eyrie": {
    id: "the-eyrie",
    name: "The Eyrie",
    region: "the-vale",
    hasCastle: true,
    hasPort: false,
    cardType: "siege",
    adjacentTo: [
      "gulltown",
      "hearts-home",
      "crackclaw-point", // [VERIFY]
    ],
    // The Eyrie = Arryn seat (neutral in 3-5 player game)
  },

  "gulltown": {
    id: "gulltown",
    name: "Gulltown",
    region: "the-vale",
    hasCastle: false,
    hasPort: true,
    cardType: "footsoldier",
    adjacentTo: [
      "the-eyrie",
      "hearts-home",
      "maidenpool",      // port-to-port east coast [VERIFY]
      "dragonstone",     // port-to-port east coast [VERIFY]
    ],
  },

  "hearts-home": {
    id: "hearts-home",
    name: "Heart's Home",
    region: "the-vale",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "the-eyrie",
      "gulltown",
      "crackclaw-point", // [VERIFY]
    ],
  },


  // ── THE WESTERLANDS ─────────────────────────────────────────────────────────

  "casterly-rock": {
    id: "casterly-rock",
    name: "Casterly Rock",
    region: "the-westerlands",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "lannisport",
      "cleganes-keep",
      "golden-tooth",
      "oxcross",
    ],
    // Casterly Rock = Lannister Seat of Power
  },

  "lannisport": {
    id: "lannisport",
    name: "Lannisport",
    region: "the-westerlands",
    hasCastle: false,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "casterly-rock",
      "cleganes-keep",
      "pyke",       // port-to-port west coast [VERIFY]
      "great-wyk",  // port-to-port [VERIFY]
      "three-towers", // port-to-port [VERIFY]
    ],
  },

  "cleganes-keep": {
    id: "cleganes-keep",
    name: "Clegane's Keep",
    region: "the-westerlands",
    hasCastle: false,
    hasPort: false,
    cardType: "siege",
    adjacentTo: [
      "casterly-rock",
      "lannisport",
      "golden-tooth",
      "ashford",     // border with The Reach [VERIFY]
    ],
  },

  "oxcross": {
    id: "oxcross",
    name: "Oxcross",
    region: "the-westerlands",
    hasCastle: false,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "casterly-rock",
      "golden-tooth",
      "riverrun",    // [VERIFY]
      "harrenhal",   // [VERIFY]
      "ashford",     // [VERIFY]
    ],
  },

  "golden-tooth": {
    id: "golden-tooth",
    name: "Golden Tooth",
    region: "the-westerlands",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "casterly-rock",
      "lannisport",
      "cleganes-keep",
      "oxcross",
      "riverrun",    // [VERIFY]
    ],
  },


  // ── THE CROWNLANDS ──────────────────────────────────────────────────────────

  "kings-landing": {
    id: "kings-landing",
    name: "King's Landing",
    region: "the-crownlands",
    hasCastle: true,
    hasPort: true,
    cardType: "siege",
    adjacentTo: [
      "crackclaw-point",
      "harrenhal",         // [VERIFY]
      "dragonstone",       // port-to-port east coast [VERIFY]
      "storms-end",        // border with Stormlands [VERIFY]
      "bronzegate",        // [VERIFY]
      "ashford",           // [VERIFY]
    ],
  },

  "dragonstone": {
    id: "dragonstone",
    name: "Dragonstone",
    region: "the-crownlands",
    hasCastle: true,
    hasPort: true,
    cardType: "footsoldier",
    adjacentTo: [
      "crackclaw-point",
      "kings-landing",     // port-to-port [VERIFY]
      "gulltown",          // port-to-port east coast [VERIFY]
      "storms-end",        // port-to-port east coast [VERIFY]
    ],
    // Dragonstone = Baratheon Seat of Power (Stannis faction)
    // Note: also thematically linked to Targaryen but on Westeros map is Baratheon
  },

  "crackclaw-point": {
    id: "crackclaw-point",
    name: "Crackclaw Point",
    region: "the-crownlands",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "kings-landing",
      "dragonstone",
      "harrenhal",    // [VERIFY]
      "maidenpool",   // [VERIFY]
      "the-eyrie",    // [VERIFY]
      "hearts-home",  // [VERIFY]
    ],
  },


  // ── THE REACH ───────────────────────────────────────────────────────────────

  "highgarden": {
    id: "highgarden",
    name: "Highgarden",
    region: "the-reach",
    hasCastle: true,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "brightwater-keep",
      "ashford",
      "three-towers",
      "oldtown",
      "horn-hill",
    ],
    // Highgarden = Tyrell Seat of Power
  },

  "oldtown": {
    id: "oldtown",
    name: "Oldtown",
    region: "the-reach",
    hasCastle: true,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "highgarden",
      "horn-hill",
      "three-towers",
      "planky-town",   // port-to-port south coast [VERIFY]
    ],
  },

  "brightwater-keep": {
    id: "brightwater-keep",
    name: "Brightwater Keep",
    region: "the-reach",
    hasCastle: false,
    hasPort: false,
    cardType: "siege",
    adjacentTo: [
      "highgarden",
      "ashford",
      "bronzegate",  // border with Stormlands [VERIFY]
    ],
  },

  "ashford": {
    id: "ashford",
    name: "Ashford",
    region: "the-reach",
    hasCastle: false,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "highgarden",
      "brightwater-keep",
      "cleganes-keep",   // [VERIFY]
      "oxcross",         // [VERIFY]
      "riverrun",        // [VERIFY]
      "kings-landing",   // [VERIFY]
      "bronzegate",      // [VERIFY]
    ],
  },

  "horn-hill": {
    id: "horn-hill",
    name: "Horn Hill",
    region: "the-reach",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "highgarden",
      "oldtown",
      "yronwood",   // border with Dorne [VERIFY]
    ],
  },

  "three-towers": {
    id: "three-towers",
    name: "Three Towers",
    region: "the-reach",
    hasCastle: false,
    hasPort: true,
    cardType: "siege",
    adjacentTo: [
      "highgarden",
      "oldtown",
      "lannisport",   // port-to-port west coast [VERIFY]
      "planky-town",  // port-to-port [VERIFY]
    ],
  },


  // ── THE STORMLANDS ──────────────────────────────────────────────────────────

  "storms-end": {
    id: "storms-end",
    name: "Storm's End",
    region: "the-stormlands",
    hasCastle: true,
    hasPort: true,
    cardType: "footsoldier",
    adjacentTo: [
      "bronzegate",
      "felwood",
      "kings-landing",   // [VERIFY]
      "dragonstone",     // port-to-port east coast [VERIFY]
      "the-tor",         // port-to-port south-east coast [VERIFY]
    ],
    // Storm's End = Baratheon Seat of Power (Renly faction)
  },

  "bronzegate": {
    id: "bronzegate",
    name: "Bronzegate",
    region: "the-stormlands",
    hasCastle: false,
    hasPort: false,
    cardType: "knight",
    adjacentTo: [
      "storms-end",
      "felwood",
      "kings-landing",      // [VERIFY]
      "brightwater-keep",   // [VERIFY]
      "ashford",            // [VERIFY]
    ],
  },

  "felwood": {
    id: "felwood",
    name: "Felwood",
    region: "the-stormlands",
    hasCastle: false,
    hasPort: false,
    cardType: "siege",
    adjacentTo: [
      "storms-end",
      "bronzegate",
      "the-tor",    // border with Dorne [VERIFY]
      "yronwood",   // [VERIFY]
    ],
  },


  // ── DORNE ───────────────────────────────────────────────────────────────────

  "sunspear": {
    id: "sunspear",
    name: "Sunspear",
    region: "dorne",
    hasCastle: true,
    hasPort: true,
    cardType: "footsoldier",
    adjacentTo: [
      "the-tor",
      "planky-town",
      "yronwood",
    ],
    // Sunspear = Martell Seat of Power
  },

  "the-tor": {
    id: "the-tor",
    name: "The Tor",
    region: "dorne",
    hasCastle: false,
    hasPort: true,
    cardType: "knight",
    adjacentTo: [
      "sunspear",
      "planky-town",
      "yronwood",
      "felwood",       // border with Stormlands [VERIFY]
      "storms-end",    // port-to-port [VERIFY]
    ],
  },

  "planky-town": {
    id: "planky-town",
    name: "Planky Town",
    region: "dorne",
    hasCastle: false,
    hasPort: true,
    cardType: "siege",
    adjacentTo: [
      "sunspear",
      "the-tor",
      "yronwood",
      "oldtown",      // port-to-port south coast [VERIFY]
      "three-towers", // port-to-port [VERIFY]
    ],
  },

  "yronwood": {
    id: "yronwood",
    name: "Yronwood",
    region: "dorne",
    hasCastle: false,
    hasPort: false,
    cardType: "footsoldier",
    adjacentTo: [
      "sunspear",
      "the-tor",
      "planky-town",
      "felwood",     // border with Stormlands [VERIFY]
      "horn-hill",   // border with The Reach [VERIFY]
    ],
  },
};


// -----------------------------------------------------------------------------
// HOUSES (factions)
// Used during player setup. seatOfPower links to a territory id.
// color is a CSS color string used to tint territories and army badges.
// -----------------------------------------------------------------------------

const HOUSES = {
  "stark": {
    id: "stark",
    name: "House Stark",
    sigil: "🐺",
    color: "#7a8fa6",         // steel blue-grey
    colorDark: "#4a5f72",
    seatOfPower: "winterfell",
    startingRegion: "the-north",
  },
  "lannister": {
    id: "lannister",
    name: "House Lannister",
    sigil: "🦁",
    color: "#d4a017",         // Lannister gold
    colorDark: "#a07800",
    seatOfPower: "casterly-rock",
    startingRegion: "the-westerlands",
  },
  "baratheon": {
    id: "baratheon",
    name: "House Baratheon",
    sigil: "🦌",
    color: "#e8c840",         // yellow
    colorDark: "#b09010",
    seatOfPower: "storms-end",
    startingRegion: "the-stormlands",
  },
  "tyrell": {
    id: "tyrell",
    name: "House Tyrell",
    sigil: "🌹",
    color: "#4a8c3f",         // green
    colorDark: "#2d5926",
    seatOfPower: "highgarden",
    startingRegion: "the-reach",
  },
  "martell": {
    id: "martell",
    name: "House Martell",
    sigil: "☀️",
    color: "#c05c10",         // orange-red
    colorDark: "#8a3a00",
    seatOfPower: "sunspear",
    startingRegion: "dorne",
  },
};


// -----------------------------------------------------------------------------
// TERRITORY CARDS
// One card per territory + 2 Wild cards = total deck size equals territory count + 2.
// cardType matches the territory's cardType field above.
// Wild cards can substitute for any type in a set.
// -----------------------------------------------------------------------------

const CARD_TYPES = {
  footsoldier: { label: "Footsoldier", emoji: "⚔️" },
  knight:      { label: "Knight",      emoji: "🐴" },
  siege:       { label: "Siege",       emoji: "🏹" },
  wild:        { label: "Wild",        emoji: "👑" },
};

// Trade-in values: index 0 = first set traded, index 1 = second, etc.
// After the 6th set (index 5 = 15 armies), each subsequent set adds 5 more.
const CARD_TRADE_VALUES = [4, 6, 8, 10, 12, 15];
const CARD_TRADE_INCREMENT_AFTER_SIX = 5;

// Matching territory bonus: if any card in a traded set matches a territory
// the player owns, they place this many extra armies on that territory.
const CARD_TERRITORY_MATCH_BONUS = 2;

// Wild card count in the deck.
const WILD_CARD_COUNT = 2;


// -----------------------------------------------------------------------------
// REINFORCEMENT RULES
// Min armies per turn regardless of territory count.
// Armies earned = Math.max(MIN_ARMIES, Math.floor(territoriesOwned / TERRITORY_DIVISOR))
// + region bonuses + card trade-in bonuses.
// -----------------------------------------------------------------------------

const MIN_ARMIES_PER_TURN = 3;
const TERRITORY_DIVISOR = 3;


// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// Pure functions — no side effects, no mutation, safe to call anywhere.
// -----------------------------------------------------------------------------

/**
 * Returns an array of all territory IDs on the board.
 */
function getAllTerritoryIds() {
  return Object.keys(TERRITORIES);
}

/**
 * Returns the reinforcement bonus armies a player earns from regions.
 * Pass in the array of territory IDs the player currently owns.
 *
 * @param {string[]} ownedTerritoryIds
 * @returns {number} total region bonus armies
 */
function calcRegionBonus(ownedTerritoryIds) {
  const ownedSet = new Set(ownedTerritoryIds);
  let bonus = 0;
  for (const region of Object.values(REGIONS)) {
    const ownsAll = region.territories.every((tid) => ownedSet.has(tid));
    if (ownsAll) bonus += region.bonus;
  }
  return bonus;
}

/**
 * Returns the total armies a player earns at the start of their turn
 * (territories + region bonuses only — card trade-ins are handled separately).
 *
 * @param {string[]} ownedTerritoryIds
 * @returns {number}
 */
function calcBaseReinforcements(ownedTerritoryIds) {
  const fromTerritories = Math.max(
    MIN_ARMIES_PER_TURN,
    Math.floor(ownedTerritoryIds.length / TERRITORY_DIVISOR)
  );
  return fromTerritories + calcRegionBonus(ownedTerritoryIds);
}

/**
 * Returns the armies earned for trading in a set of cards.
 * setsTraded = how many sets have been traded THIS GAME (before this one).
 *
 * @param {number} setsTraded — zero-indexed count of sets traded so far this game
 * @returns {number} armies earned for this trade
 */
function calcCardTradeValue(setsTraded) {
  if (setsTraded < CARD_TRADE_VALUES.length) {
    return CARD_TRADE_VALUES[setsTraded];
  }
  // After 6th set: 15 + (n - 5) * 5 where n = setsTraded (0-indexed)
  const extraSets = setsTraded - (CARD_TRADE_VALUES.length - 1);
  return 15 + extraSets * CARD_TRADE_INCREMENT_AFTER_SIX;
}

/**
 * Checks if three card types form a valid trade-in set.
 * Valid sets: 3 of a kind, 1 of each type, or any 2 + a wild.
 *
 * @param {string[]} types — array of 3 cardType strings
 * @returns {boolean}
 */
function isValidCardSet(types) {
  if (types.length !== 3) return false;

  const wilds = types.filter((t) => t === "wild").length;
  const nonWild = types.filter((t) => t !== "wild");

  // If 2 wilds: any single non-wild completes a set of 3-of-a-kind.
  if (wilds === 2) return true;

  // If 1 wild: the two non-wilds just need to not be three different types
  // (a wild can match either, making 3-of-a-kind or 1-of-each impossible to fail).
  if (wilds === 1) return true;

  // No wilds: must be 3-of-a-kind or 1 of each.
  const unique = new Set(nonWild);
  return unique.size === 1 || unique.size === 3;
}

/**
 * Builds and returns the full territory card deck as an array of objects,
 * including 2 wild cards. Does NOT shuffle — call shuffle() separately.
 *
 * @returns {{ territoryId: string|null, cardType: string }[]}
 */
function buildCardDeck() {
  const deck = [];

  for (const territory of Object.values(TERRITORIES)) {
    deck.push({
      territoryId: territory.id,
      cardType: territory.cardType,
    });
  }

  for (let i = 0; i < WILD_CARD_COUNT; i++) {
    deck.push({ territoryId: null, cardType: "wild" });
  }

  return deck;
}

/**
 * Fisher-Yates shuffle. Returns a NEW shuffled array (does not mutate input).
 *
 * @param {any[]} array
 * @returns {any[]}
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


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
  if (!TERRITORIES[fromId].adjacentTo.includes(toId)) {
    throw new Error(`manoeuvre: ${fromId} is not adjacent to ${toId}.`);
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
    _state.phase !== PHASES.DRAW
  ) {
    throw new Error("tradeCards: can only trade during Reinforce or Draw phase.");
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

  // Calculate armies earned.
  // Trade values are inlined here to avoid a circular import with boardData.js.
  // gameLogic.js can use calcCardTradeValue() from boardData for display purposes.
  const TRADE_VALUES = [4, 6, 8, 10, 12, 15];
  const INCREMENT    = 5;
  const setsTraded   = player.cardSetsTraded;
  let armiesEarned   = setsTraded < TRADE_VALUES.length
    ? TRADE_VALUES[setsTraded]
    : 15 + (setsTraded - (TRADE_VALUES.length - 1)) * INCREMENT;

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

  player.cardSetsTraded++;

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


/* ===== gameLogic.js ===== */
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
function startNewGame(config) {
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
function getReinforceCount() {
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
function getValidReinforceTargets() {
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
function getValidAttackSources() {
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
function getValidAttackTargets(fromId) {
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
function getMaxAttackDice(fromId) {
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
function getDefenderDice(toId) {
  const t = getTerritoryState(toId);
  return Math.min(2, t.armies);
}

/**
 * Returns all territories the current player can manoeuvre FROM.
 * Conditions: owned, ≥ 2 armies, has at least one adjacent owned territory.
 *
 * @returns {string[]} array of territory IDs
 */
function getValidManoeuvreSources() {
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
function getValidManoeuvreTargets(fromId) {
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
function mustTradeCards() {
  const player = getCurrentPlayer();
  return player.cards.length >= 6;
}

/**
 * Returns whether the current player CAN trade cards right now
 * (has a valid set of 3 in hand, and is in reinforce or draw phase).
 *
 * @returns {boolean}
 */
function canTradeCards() {
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
function findAllValidCardSets(cards) {
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
function previewTradeValue() {
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
function findCardSetMatchTerritory(cardIndices) {
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
function getPhaseInstructions() {
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
function actionPlaceReinforcements(territoryId, count, session) {
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
function actionEndReinforce(session) {
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
function actionAttack(fromId, toId, attackerDice) {
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
function actionOccupy(count) {
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
function actionEndAttack() {
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
function actionManoeuvre(fromId, toId, count) {
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
function actionEndManoeuvre() {
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
function actionDrawCard() {
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
function actionTradeCards(cardIndices, session) {
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
function actionEndTurn() {
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
function getTerritoryDisplayData() {
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
function getPlayerDisplayData() {
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
function getCardDisplayData() {
  const player = getCurrentPlayer();

  // Card display data inlined — matching boardData.CARD_TYPES exactly.
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
function getScoreDisplayData() {
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

var MAP_VIEWBOX_W = 300;
var MAP_VIEWBOX_H = 500;
var NODE_RADIUS   = 13;

var TERRITORY_COORDS = {
  "castle-black":    { x: 170, y:  28 },
  "karhold":         { x: 228, y:  48 },
  "the-dreadfort":   { x: 200, y:  78 },
  "winterfell":      { x: 148, y:  88 },
  "deepwood-motte":  { x:  72, y:  78 },
  "bear-island":     { x:  42, y:  52 },
  "torrhen-square":  { x:  96, y: 108 },
  "white-harbour":   { x: 196, y: 118 },
  "moat-cailin":     { x: 130, y: 130 },
  "pyke":            { x:  30, y: 162 },
  "great-wyk":       { x:  12, y: 186 },
  "old-wyk":         { x:  36, y: 192 },
  "the-twins":       { x: 152, y: 158 },
  "seagard":         { x:  88, y: 168 },
  "riverrun":        { x:  98, y: 198 },
  "harrenhal":       { x: 160, y: 198 },
  "maidenpool":      { x: 218, y: 178 },
  "the-eyrie":       { x: 246, y: 168 },
  "gulltown":        { x: 268, y: 192 },
  "hearts-home":     { x: 256, y: 148 },
  "casterly-rock":   { x:  68, y: 228 },
  "lannisport":      { x:  42, y: 248 },
  "cleganes-keep":   { x:  90, y: 248 },
  "golden-tooth":    { x:  80, y: 218 },
  "oxcross":         { x: 112, y: 228 },
  "kings-landing":   { x: 178, y: 238 },
  "dragonstone":     { x: 224, y: 228 },
  "crackclaw-point": { x: 216, y: 208 },
  "highgarden":      { x:  96, y: 308 },
  "oldtown":         { x:  50, y: 368 },
  "brightwater-keep":{ x: 128, y: 328 },
  "ashford":         { x: 130, y: 288 },
  "horn-hill":       { x:  68, y: 348 },
  "three-towers":    { x:  34, y: 316 },
  "storms-end":      { x: 196, y: 308 },
  "bronzegate":      { x: 168, y: 288 },
  "felwood":         { x: 196, y: 348 },
  "sunspear":        { x: 224, y: 448 },
  "the-tor":         { x: 196, y: 408 },
  "planky-town":     { x: 150, y: 438 },
  "yronwood":        { x: 158, y: 398 }
};

var SHORT_NAMES = {
  "castle-black":    "C.Black",
  "the-dreadfort":   "Dreadfort",
  "deepwood-motte":  "Deepwood",
  "bear-island":     "Bear Isl",
  "torrhen-square":  "Torrhen",
  "white-harbour":   "W.Harbour",
  "moat-cailin":     "M.Cailin",
  "great-wyk":       "Gt.Wyk",
  "old-wyk":         "Old Wyk",
  "the-twins":       "Twins",
  "the-eyrie":       "Eyrie",
  "hearts-home":     "Hrt.Home",
  "casterly-rock":   "C.Rock",
  "cleganes-keep":   "Clegane",
  "golden-tooth":    "Gld.Tooth",
  "kings-landing":   "K.Landing",
  "crackclaw-point": "Crkclaw",
  "brightwater-keep":"Brightwtr",
  "three-towers":    "3 Towers",
  "storms-end":      "Storm's E",
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
    + svgLines + svgNodes
    + "</svg>";

  mapEl.innerHTML = svg;

  // Army badges — HTML divs absolutely positioned over the SVG.
  _renderArmyBadges(mapEl, territories);

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
      + (canDraw ? "Draw a card, then end your turn." : "No conquest — end your turn.")
      + "</p>"
      + '<div class="action-btn-row">'
      + '<button id="btn-draw-card" class="btn btn-secondary"' + (canDraw ? "" : " disabled") + ">Draw Card</button>"
      + '<button id="btn-end-turn" class="btn btn-primary">End Turn</button>'
      + "</div>";

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
      html += '<div class="card-item" data-card-index="' + card.index + '">'
        + '<span class="card-item-emoji">'     + card.emoji + "</span>"
        + '<span class="card-item-type">'      + card.label + "</span>"
        + '<span class="card-item-territory">' + (card.territoryName || "Wild") + "</span>"
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


/* ===== inputHandler.js ===== */
// =============================================================================
// inputHandler.js — STUB
// Full implementation is the next development step.
// =============================================================================

function initInputHandler(callbacks) {
  console.log("inputHandler: stub — wiring basic close buttons only");

  // Wire card panel close button so UI isn't completely dead.
  var closeCards = document.getElementById("btn-close-cards");
  if (closeCards) {
    closeCards.addEventListener("click", function() { hideCardPanel(); });
  }
}


/* ===== ai.js ===== */
// =============================================================================
// ai.js — STUB — Phase 4 implementation
// =============================================================================

function getAIMove(state) { return null; }


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
    players.push({ houseId: houseId, name: rawName || HOUSES[houseId].name, isAI: false });
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
  Promise.all([
    import("./renderer.js"),
    import("./inputHandler.js")
  ]).then(function(modules) {
    var renderer     = modules[0];
    var inputHandler = modules[1];

    renderer.renderGameScreen();

    inputHandler.initInputHandler({
      onGameOver: function(scores) {
        _pendingGameOverScores = scores;
        showScreen("screen-game-over");
      },
      onPassPhone: function(playerName, onReady) {
        _showPassPhoneOverlay(playerName, onReady);
      }
    });

  }).catch(function(err) {
    var map = document.getElementById("game-map");
    if (map) {
      map.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;'
        + 'justify-content:center;height:100%;gap:16px;'
        + 'color:#9e8e78;font-size:0.9rem;text-align:center;padding:24px;">'
        + '<p><strong style="color:#c9a84c">Game board coming soon</strong></p>'
        + "<p>renderer.js and inputHandler.js not yet fully implemented.</p>"
        + '<p style="font-size:0.75rem;color:#5c5040">' + err.message + "</p>"
        + "</div>";
    }
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
  showScreen("screen-start");
}

document.addEventListener("DOMContentLoaded", _boot);


