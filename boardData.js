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

export const REGIONS = {
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

export const TERRITORIES = {

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

export const HOUSES = {
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

export const CARD_TYPES = {
  footsoldier: { label: "Footsoldier", emoji: "⚔️" },
  knight:      { label: "Knight",      emoji: "🐴" },
  siege:       { label: "Siege",       emoji: "🏹" },
  wild:        { label: "Wild",        emoji: "👑" },
};

// Trade-in values: index 0 = first set traded, index 1 = second, etc.
// After the 6th set (index 5 = 15 armies), each subsequent set adds 5 more.
export const CARD_TRADE_VALUES = [4, 6, 8, 10, 12, 15];
export const CARD_TRADE_INCREMENT_AFTER_SIX = 5;

// Matching territory bonus: if any card in a traded set matches a territory
// the player owns, they place this many extra armies on that territory.
export const CARD_TERRITORY_MATCH_BONUS = 2;

// Wild card count in the deck.
export const WILD_CARD_COUNT = 2;


// -----------------------------------------------------------------------------
// REINFORCEMENT RULES
// Min armies per turn regardless of territory count.
// Armies earned = Math.max(MIN_ARMIES, Math.floor(territoriesOwned / TERRITORY_DIVISOR))
// + region bonuses + card trade-in bonuses.
// -----------------------------------------------------------------------------

export const MIN_ARMIES_PER_TURN = 3;
export const TERRITORY_DIVISOR = 3;


// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// Pure functions — no side effects, no mutation, safe to call anywhere.
// -----------------------------------------------------------------------------

/**
 * Returns an array of all territory IDs on the board.
 */
export function getAllTerritoryIds() {
  return Object.keys(TERRITORIES);
}

/**
 * Returns the reinforcement bonus armies a player earns from regions.
 * Pass in the array of territory IDs the player currently owns.
 *
 * @param {string[]} ownedTerritoryIds
 * @returns {number} total region bonus armies
 */
export function calcRegionBonus(ownedTerritoryIds) {
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
export function calcBaseReinforcements(ownedTerritoryIds) {
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
export function calcCardTradeValue(setsTraded) {
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
export function isValidCardSet(types) {
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
export function buildCardDeck() {
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
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
