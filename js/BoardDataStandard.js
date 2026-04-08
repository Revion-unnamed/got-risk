/* ===== boardData.js ===== */
// =============================================================================
// boardData.js
// Static game data for RISK — Standard World Map
//
// IMPORTANT: This file is read-only game data. Never modify it during gameplay.
// All adjacency lists are bidirectional — if A lists B, B must list A.
//
// 42 territories across 6 continents.
// Sea connections (e.g. Alaska↔Kamchatka, Brazil↔North Africa) are modelled
// as direct adjacency for simplicity.
// =============================================================================


// -----------------------------------------------------------------------------
// REGIONS (Continents)
// Each region has a list of territory IDs it contains and a reinforcement bonus
// (armies earned for controlling ALL territories in that continent).
// Bonus values match the standard Risk board.
// -----------------------------------------------------------------------------

var REGIONS = {
  "north-america": {
    name: "North America",
    bonus: 5,
    territories: [
      "alaska", "northwest-territory", "greenland", "alberta",
      "ontario", "quebec", "western-united-states", "eastern-united-states",
      "central-america"
    ]
  },
  "south-america": {
    name: "South America",
    bonus: 2,
    territories: [
      "venezuela", "peru", "brazil", "argentina"
    ]
  },
  "europe": {
    name: "Europe",
    bonus: 5,
    territories: [
      "iceland", "great-britain", "western-europe", "northern-europe",
      "scandinavia", "ukraine", "southern-europe"
    ]
  },
  "africa": {
    name: "Africa",
    bonus: 3,
    territories: [
      "north-africa", "egypt", "east-africa", "congo",
      "south-africa", "madagascar"
    ]
  },
  "asia": {
    name: "Asia",
    bonus: 7,
    territories: [
      "ural", "siberia", "yakutsk", "kamchatka",
      "afghanistan", "china", "mongolia", "japan",
      "middle-east", "india", "siam", "irkutsk"
    ]
  },
  "australia": {
    name: "Australia",
    bonus: 2,
    territories: [
      "indonesia", "new-guinea", "western-australia", "eastern-australia"
    ]
  }
};


// -----------------------------------------------------------------------------
// TERRITORIES
// Each territory has:
//   id         — kebab-case unique identifier (matches key)
//   name       — display name shown to players
//   region     — which continent it belongs to
//   hasCastle  — false for standard Risk (no castle mechanic)
//   hasPort    — true for territories with sea connections
//   cardType   — "infantry" | "cavalry" | "artillery"
//   adjacentTo — array of territory IDs (land + sea connections)
// -----------------------------------------------------------------------------

var TERRITORIES = {

  // ── NORTH AMERICA ──────────────────────────────────────────────
  "alaska": {
    id: "alaska", name: "Alaska", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["northwest-territory", "alberta", "kamchatka"]
  },
  "northwest-territory": {
    id: "northwest-territory", name: "Northwest Territory", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["alaska", "alberta", "ontario", "greenland"]
  },
  "greenland": {
    id: "greenland", name: "Greenland", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["northwest-territory", "ontario", "quebec", "iceland"]
  },
  "alberta": {
    id: "alberta", name: "Alberta", region: "north-america",
    hasCastle: false, hasPort: false, cardType: "infantry",
    adjacentTo: ["alaska", "northwest-territory", "ontario", "western-united-states"]
  },
  "ontario": {
    id: "ontario", name: "Ontario", region: "north-america",
    hasCastle: false, hasPort: false, cardType: "cavalry",
    adjacentTo: ["northwest-territory", "alberta", "greenland", "quebec", "western-united-states", "eastern-united-states"]
  },
  "quebec": {
    id: "quebec", name: "Quebec", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["greenland", "ontario", "eastern-united-states"]
  },
  "western-united-states": {
    id: "western-united-states", name: "Western United States", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["alberta", "ontario", "eastern-united-states", "central-america"]
  },
  "eastern-united-states": {
    id: "eastern-united-states", name: "Eastern United States", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["ontario", "quebec", "western-united-states", "central-america"]
  },
  "central-america": {
    id: "central-america", name: "Central America", region: "north-america",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["western-united-states", "eastern-united-states", "venezuela"]
  },

  // ── SOUTH AMERICA ──────────────────────────────────────────────
  "venezuela": {
    id: "venezuela", name: "Venezuela", region: "south-america",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["central-america", "peru", "brazil"]
  },
  "peru": {
    id: "peru", name: "Peru", region: "south-america",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["venezuela", "brazil", "argentina"]
  },
  "brazil": {
    id: "brazil", name: "Brazil", region: "south-america",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["venezuela", "peru", "argentina", "north-africa"]
  },
  "argentina": {
    id: "argentina", name: "Argentina", region: "south-america",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["peru", "brazil"]
  },

  // ── EUROPE ─────────────────────────────────────────────────────
  "iceland": {
    id: "iceland", name: "Iceland", region: "europe",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["greenland", "great-britain", "scandinavia"]
  },
  "great-britain": {
    id: "great-britain", name: "Great Britain", region: "europe",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["iceland", "western-europe", "northern-europe", "scandinavia"]
  },
  "western-europe": {
    id: "western-europe", name: "Western Europe", region: "europe",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["great-britain", "northern-europe", "southern-europe", "north-africa"]
  },
  "northern-europe": {
    id: "northern-europe", name: "Northern Europe", region: "europe",
    hasCastle: false, hasPort: false, cardType: "cavalry",
    adjacentTo: ["great-britain", "western-europe", "scandinavia", "ukraine", "southern-europe"]
  },
  "scandinavia": {
    id: "scandinavia", name: "Scandinavia", region: "europe",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["iceland", "great-britain", "northern-europe", "ukraine"]
  },
  "ukraine": {
    id: "ukraine", name: "Ukraine", region: "europe",
    hasCastle: false, hasPort: false, cardType: "infantry",
    adjacentTo: ["scandinavia", "northern-europe", "southern-europe", "ural", "afghanistan", "middle-east"]
  },
  "southern-europe": {
    id: "southern-europe", name: "Southern Europe", region: "europe",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["western-europe", "northern-europe", "ukraine", "north-africa", "egypt", "middle-east"]
  },

  // ── AFRICA ─────────────────────────────────────────────────────
  "north-africa": {
    id: "north-africa", name: "North Africa", region: "africa",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["brazil", "western-europe", "southern-europe", "egypt", "east-africa", "congo"]
  },
  "egypt": {
    id: "egypt", name: "Egypt", region: "africa",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["north-africa", "southern-europe", "middle-east", "east-africa"]
  },
  "east-africa": {
    id: "east-africa", name: "East Africa", region: "africa",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["north-africa", "egypt", "middle-east", "congo", "south-africa", "madagascar"]
  },
  "congo": {
    id: "congo", name: "Congo", region: "africa",
    hasCastle: false, hasPort: false, cardType: "artillery",
    adjacentTo: ["north-africa", "east-africa", "south-africa"]
  },
  "south-africa": {
    id: "south-africa", name: "South Africa", region: "africa",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["congo", "east-africa", "madagascar"]
  },
  "madagascar": {
    id: "madagascar", name: "Madagascar", region: "africa",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["south-africa", "east-africa"]
  },

  // ── ASIA ───────────────────────────────────────────────────────
  "ural": {
    id: "ural", name: "Ural", region: "asia",
    hasCastle: false, hasPort: false, cardType: "artillery",
    adjacentTo: ["ukraine", "siberia", "afghanistan", "china"]
  },
  "siberia": {
    id: "siberia", name: "Siberia", region: "asia",
    hasCastle: false, hasPort: false, cardType: "infantry",
    adjacentTo: ["ural", "yakutsk", "irkutsk", "mongolia", "china"]
  },
  "yakutsk": {
    id: "yakutsk", name: "Yakutsk", region: "asia",
    hasCastle: false, hasPort: false, cardType: "cavalry",
    adjacentTo: ["siberia", "kamchatka", "irkutsk"]
  },
  "kamchatka": {
    id: "kamchatka", name: "Kamchatka", region: "asia",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["yakutsk", "irkutsk", "mongolia", "japan", "alaska"]
  },
  "irkutsk": {
    id: "irkutsk", name: "Irkutsk", region: "asia",
    hasCastle: false, hasPort: false, cardType: "infantry",
    adjacentTo: ["siberia", "yakutsk", "kamchatka", "mongolia"]
  },
  "afghanistan": {
    id: "afghanistan", name: "Afghanistan", region: "asia",
    hasCastle: false, hasPort: false, cardType: "cavalry",
    adjacentTo: ["ukraine", "ural", "china", "india", "middle-east"]
  },
  "china": {
    id: "china", name: "China", region: "asia",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["ural", "siberia", "mongolia", "siam", "india", "afghanistan"]
  },
  "mongolia": {
    id: "mongolia", name: "Mongolia", region: "asia",
    hasCastle: false, hasPort: false, cardType: "infantry",
    adjacentTo: ["siberia", "irkutsk", "kamchatka", "japan", "china"]
  },
  "japan": {
    id: "japan", name: "Japan", region: "asia",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["kamchatka", "mongolia"]
  },
  "middle-east": {
    id: "middle-east", name: "Middle East", region: "asia",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["ukraine", "southern-europe", "egypt", "east-africa", "afghanistan", "india"]
  },
  "india": {
    id: "india", name: "India", region: "asia",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["middle-east", "afghanistan", "china", "siam"]
  },
  "siam": {
    id: "siam", name: "Siam", region: "asia",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["china", "india", "indonesia"]
  },

  // ── AUSTRALIA ──────────────────────────────────────────────────
  "indonesia": {
    id: "indonesia", name: "Indonesia", region: "australia",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["siam", "new-guinea", "western-australia"]
  },
  "new-guinea": {
    id: "new-guinea", name: "New Guinea", region: "australia",
    hasCastle: false, hasPort: true, cardType: "infantry",
    adjacentTo: ["indonesia", "western-australia", "eastern-australia"]
  },
  "western-australia": {
    id: "western-australia", name: "Western Australia", region: "australia",
    hasCastle: false, hasPort: true, cardType: "cavalry",
    adjacentTo: ["indonesia", "new-guinea", "eastern-australia"]
  },
  "eastern-australia": {
    id: "eastern-australia", name: "Eastern Australia", region: "australia",
    hasCastle: false, hasPort: true, cardType: "artillery",
    adjacentTo: ["new-guinea", "western-australia"]
  }
};


// -----------------------------------------------------------------------------
// FACTIONS (Generic for standard Risk — rename/recolor as desired)
// -----------------------------------------------------------------------------

const HOUSES = {
  "red": {
    id: "red",
    name: "Red Army",
    sigil: "🔴",
    color: "#c0392b",
    colorDark: "#922b21",
    seatOfPower: "alaska",
    startingRegion: "north-america",
  },
  "blue": {
    id: "blue",
    name: "Blue Army",
    sigil: "🔵",
    color: "#2980b9",
    colorDark: "#1a5276",
    seatOfPower: "great-britain",
    startingRegion: "europe",
  },
  "green": {
    id: "green",
    name: "Green Army",
    sigil: "🟢",
    color: "#27ae60",
    colorDark: "#1e8449",
    seatOfPower: "china",
    startingRegion: "asia",
  },
  "yellow": {
    id: "yellow",
    name: "Yellow Army",
    sigil: "🟡",
    color: "#d4ac0d",
    colorDark: "#9a7d0a",
    seatOfPower: "brazil",
    startingRegion: "south-america",
  },
  "black": {
    id: "black",
    name: "Black Army",
    sigil: "⚫",
    color: "#566573",
    colorDark: "#2c3e50",
    seatOfPower: "north-africa",
    startingRegion: "africa",
  },
};


// -----------------------------------------------------------------------------
// TERRITORY CARDS
// One card per territory (42 total) + 2 Wild cards = 44 cards.
// Card types rotate: infantry / cavalry / artillery
// -----------------------------------------------------------------------------

const CARD_TYPES = {
  infantry:  { label: "Infantry",  emoji: "⚔️" },
  cavalry:   { label: "Cavalry",   emoji: "🐴" },
  artillery: { label: "Artillery", emoji: "🏹" },
  wild:      { label: "Wild",      emoji: "👑" },
};

var CARD_TRADE_VALUES = {
  infantry:  4,
  cavalry:   6,
  artillery: 6,
  mixed:     7
};

const WILD_CARD_COUNT = 2;
const CARD_TERRITORY_MATCH_BONUS = 2;


// -----------------------------------------------------------------------------
// REINFORCEMENT RULES
// -----------------------------------------------------------------------------

const MIN_ARMIES_PER_TURN = 3;
const TERRITORY_DIVISOR   = 3;


// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// Pure functions — no side effects, no mutation, safe to call anywhere.
// -----------------------------------------------------------------------------

function getAllTerritoryIds() {
  return Object.keys(TERRITORIES);
}

function calcRegionBonus(ownedTerritoryIds) {
  const ownedSet = new Set(ownedTerritoryIds);
  let bonus = 0;
  for (const region of Object.values(REGIONS)) {
    const ownsAll = region.territories.every((tid) => ownedSet.has(tid));
    if (ownsAll) bonus += region.bonus;
  }
  return bonus;
}

function calcBaseReinforcements(ownedTerritoryIds) {
  const fromTerritories = Math.max(
    MIN_ARMIES_PER_TURN,
    Math.floor(ownedTerritoryIds.length / TERRITORY_DIVISOR)
  );
  return fromTerritories + calcRegionBonus(ownedTerritoryIds);
}

function calcCardTradeValue(setsTraded) {
  return 4;
}

function calcCardSetValue(types) {
  var nonWild = types.filter(function(t) { return t !== "wild"; });
  var wilds   = types.length - nonWild.length;

  if (wilds >= 2) return 6;

  if (wilds === 1) {
    if (nonWild[0] === nonWild[1]) {
      return CARD_TRADE_VALUES[nonWild[0]] || 4;
    }
    return 7;
  }

  var unique = {};
  for (var i = 0; i < nonWild.length; i++) unique[nonWild[i]] = true;
  var uniqueCount = Object.keys(unique).length;

  if (uniqueCount === 1) return CARD_TRADE_VALUES[nonWild[0]] || 4;
  if (uniqueCount === 3) return 7;
  return 4;
}

function isValidCardSet(types) {
  if (types.length !== 3) return false;
  const wilds   = types.filter((t) => t === "wild").length;
  const nonWild = types.filter((t) => t !== "wild");
  if (wilds >= 1) return true;
  const unique = new Set(nonWild);
  return unique.size === 1 || unique.size === 3;
}

function buildCardDeck() {
  const deck = [];
  for (const territory of Object.values(TERRITORIES)) {
    deck.push({ territoryId: territory.id, cardType: territory.cardType });
  }
  for (let i = 0; i < WILD_CARD_COUNT; i++) {
    deck.push({ territoryId: null, cardType: "wild" });
  }
  return deck;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
