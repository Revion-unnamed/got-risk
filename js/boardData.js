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

var REGIONS = {
  "the-north": {
    name: "The North",
    bonus: 5,
    territories: [
      "castle-black", "the-gift", "skagos", "karhold",
      "the-dreadfort", "wolfswood", "winterfell", "barrowlands",
      "stony-shore", "bear-island", "widows-watch",
      "white-harbour", "moat-cailin"
    ]
  },
  "the-iron-islands": {
    name: "The Iron Islands",
    bonus: 1,
    territories: [ "pyke", "great-wyk", "old-wyk", "harlaw" ]
  },
  "the-riverlands": {
    name: "The Riverlands",
    bonus: 2,
    territories: [
      "cape-kraken", "seagard", "the-twins", "the-neck",
      "riverrun", "harrenhal", "maidenpool"
    ]
  },
  "the-vale": {
    name: "The Vale of Arryn",
    bonus: 1,
    territories: [ "hearts-home", "the-fingers", "the-eyrie", "gulltown" ]
  },
  "the-westerlands": {
    name: "The Westerlands",
    bonus: 2,
    territories: [
      "golden-tooth", "oxcross", "casterly-rock",
      "lannisport", "cleganes-keep", "silverhill"
    ]
  },
  "the-crownlands": {
    name: "The Crownlands",
    bonus: 2,
    territories: [
      "crackclaw-point", "kings-landing",
      "dragonstone", "blackwater-rush"
    ]
  },
  "the-reach": {
    name: "The Reach",
    bonus: 4,
    territories: [
      "stoney-sept", "ashford", "highgarden", "oldtown",
      "three-towers", "horn-hill", "brightwater-keep",
      "the-mander", "seabed-marches"
    ]
  },
  "the-stormlands": {
    name: "The Stormlands",
    bonus: 1,
    territories: [
      "kingswood", "bronzegate", "storms-end",
      "rainwood", "lornish-marches", "tarth"
    ]
  },
  "dorne": {
    name: "Dorne",
    bonus: 1,
    territories: [
      "red-mountains", "yronwood", "the-tor",
      "sandstone", "greenblood", "planky-town", "sunspear"
    ]
  }
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

var TERRITORIES = {

  // ── THE NORTH ─────────────────────────────────────────────────
  "castle-black":  { id:"castle-black",  name:"Castle Black",   region:"the-north",        hasCastle:true,  hasPort:false, cardType:"footsoldier",
    adjacentTo:["the-gift","karhold","wolfswood"] },
  "the-gift":      { id:"the-gift",      name:"The Gift",       region:"the-north",        hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["castle-black","skagos","karhold","the-dreadfort","winterfell","wolfswood"] },
  "skagos":        { id:"skagos",        name:"Skagos",         region:"the-north",        hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["the-gift","karhold"] },
  "karhold":       { id:"karhold",       name:"Karhold",        region:"the-north",        hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["castle-black","the-gift","skagos","the-dreadfort","widows-watch"] },
  "the-dreadfort": { id:"the-dreadfort", name:"The Dreadfort",  region:"the-north",        hasCastle:true,  hasPort:false, cardType:"siege",
    adjacentTo:["the-gift","karhold","widows-watch","white-harbour","winterfell"] },
  "wolfswood":     { id:"wolfswood",     name:"Wolfswood",      region:"the-north",        hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["castle-black","the-gift","winterfell","barrowlands","stony-shore","bear-island"] },
  "winterfell":    { id:"winterfell",    name:"Winterfell",     region:"the-north",        hasCastle:true,  hasPort:false, cardType:"footsoldier",
    adjacentTo:["the-gift","the-dreadfort","white-harbour","wolfswood","barrowlands","moat-cailin"] },
  "barrowlands":   { id:"barrowlands",   name:"Barrowlands",    region:"the-north",        hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["wolfswood","winterfell","stony-shore","moat-cailin"] },
  "stony-shore":   { id:"stony-shore",   name:"Stony Shore",    region:"the-north",        hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["wolfswood","barrowlands","bear-island","moat-cailin","cape-kraken"] },
  "bear-island":   { id:"bear-island",   name:"Bear Island",    region:"the-north",        hasCastle:false, hasPort:true,  cardType:"footsoldier",
    adjacentTo:["wolfswood","stony-shore","pyke"] },
  "widows-watch":  { id:"widows-watch",  name:"Widow's Watch",  region:"the-north",        hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["karhold","the-dreadfort","white-harbour","maidenpool"] },
  "white-harbour": { id:"white-harbour", name:"White Harbour",  region:"the-north",        hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["the-dreadfort","widows-watch","winterfell","moat-cailin","the-neck"] },
  "moat-cailin":   { id:"moat-cailin",   name:"Moat Cailin",    region:"the-north",        hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["barrowlands","winterfell","stony-shore","white-harbour","the-neck","seagard"] },

  // ── THE IRON ISLANDS ──────────────────────────────────────────
  "pyke":          { id:"pyke",          name:"Pyke",           region:"the-iron-islands", hasCastle:true,  hasPort:true,  cardType:"footsoldier",
    adjacentTo:["great-wyk","old-wyk","harlaw","bear-island","cape-kraken","lannisport"] },
  "great-wyk":     { id:"great-wyk",     name:"Great Wyk",      region:"the-iron-islands", hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["pyke","old-wyk"] },
  "old-wyk":       { id:"old-wyk",       name:"Old Wyk",        region:"the-iron-islands", hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["pyke","great-wyk"] },
  "harlaw":        { id:"harlaw",        name:"Harlaw",         region:"the-iron-islands", hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["pyke","seagard"] },

  // ── THE RIVERLANDS ────────────────────────────────────────────
  "cape-kraken":   { id:"cape-kraken",   name:"Cape Kraken",    region:"the-riverlands",   hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["stony-shore","pyke","seagard","the-neck"] },
  "seagard":       { id:"seagard",       name:"Seagard",        region:"the-riverlands",   hasCastle:false, hasPort:true,  cardType:"footsoldier",
    adjacentTo:["cape-kraken","the-neck","moat-cailin","the-twins","harlaw","riverrun"] },
  "the-twins":     { id:"the-twins",     name:"The Twins",      region:"the-riverlands",   hasCastle:true,  hasPort:false, cardType:"knight",
    adjacentTo:["seagard","the-neck","harrenhal","riverrun","maidenpool"] },
  "the-neck":      { id:"the-neck",      name:"The Neck",       region:"the-riverlands",   hasCastle:false, hasPort:false, cardType:"siege",
    adjacentTo:["moat-cailin","white-harbour","seagard","cape-kraken","the-twins"] },
  "riverrun":      { id:"riverrun",      name:"Riverrun",       region:"the-riverlands",   hasCastle:true,  hasPort:false, cardType:"footsoldier",
    adjacentTo:["seagard","the-twins","harrenhal","golden-tooth","oxcross","stoney-sept"] },
  "harrenhal":     { id:"harrenhal",     name:"Harrenhal",      region:"the-riverlands",   hasCastle:true,  hasPort:false, cardType:"knight",
    adjacentTo:["the-twins","riverrun","maidenpool","crackclaw-point","kings-landing","blackwater-rush","stoney-sept"] },
  "maidenpool":    { id:"maidenpool",    name:"Maidenpool",     region:"the-riverlands",   hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["widows-watch","the-twins","harrenhal","crackclaw-point","gulltown"] },

  // ── THE VALE ──────────────────────────────────────────────────
  "hearts-home":   { id:"hearts-home",  name:"Heart's Home",   region:"the-vale",         hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["the-fingers","the-eyrie","crackclaw-point"] },
  "the-fingers":   { id:"the-fingers",  name:"The Fingers",    region:"the-vale",         hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["hearts-home","the-eyrie","gulltown"] },
  "the-eyrie":     { id:"the-eyrie",    name:"The Eyrie",      region:"the-vale",         hasCastle:true,  hasPort:false, cardType:"siege",
    adjacentTo:["hearts-home","the-fingers","gulltown"] },
  "gulltown":      { id:"gulltown",     name:"Gulltown",       region:"the-vale",         hasCastle:false, hasPort:true,  cardType:"footsoldier",
    adjacentTo:["the-fingers","the-eyrie","maidenpool","dragonstone"] },

  // ── THE WESTERLANDS ───────────────────────────────────────────
  "golden-tooth":  { id:"golden-tooth", name:"Golden Tooth",   region:"the-westerlands",  hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["oxcross","casterly-rock","riverrun","stoney-sept"] },
  "oxcross":       { id:"oxcross",      name:"Oxcross",        region:"the-westerlands",  hasCastle:false, hasPort:false, cardType:"siege",
    adjacentTo:["golden-tooth","casterly-rock","cleganes-keep","riverrun","stoney-sept"] },
  "casterly-rock": { id:"casterly-rock",name:"Casterly Rock",  region:"the-westerlands",  hasCastle:true,  hasPort:false, cardType:"footsoldier",
    adjacentTo:["golden-tooth","oxcross","lannisport","cleganes-keep","silverhill"] },
  "lannisport":    { id:"lannisport",   name:"Lannisport",     region:"the-westerlands",  hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["casterly-rock","cleganes-keep","pyke","silverhill"] },
  "cleganes-keep": { id:"cleganes-keep",name:"Clegane's Keep", region:"the-westerlands",  hasCastle:false, hasPort:false, cardType:"siege",
    adjacentTo:["oxcross","casterly-rock","lannisport","silverhill","stoney-sept","seabed-marches"] },
  "silverhill":    { id:"silverhill",   name:"Silverhill",     region:"the-westerlands",  hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["casterly-rock","lannisport","cleganes-keep","seabed-marches"] },

  // ── THE CROWNLANDS ────────────────────────────────────────────
  "crackclaw-point":{ id:"crackclaw-point",name:"Crackclaw Point",region:"the-crownlands", hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["maidenpool","harrenhal","hearts-home","kings-landing","dragonstone"] },
  "kings-landing": { id:"kings-landing",name:"King's Landing",  region:"the-crownlands",  hasCastle:true,  hasPort:true,  cardType:"siege",
    adjacentTo:["harrenhal","crackclaw-point","dragonstone","blackwater-rush","kingswood"] },
  "dragonstone":   { id:"dragonstone",  name:"Dragonstone",    region:"the-crownlands",  hasCastle:true,  hasPort:true,  cardType:"footsoldier",
    adjacentTo:["crackclaw-point","kings-landing","gulltown","storms-end"] },
  "blackwater-rush":{ id:"blackwater-rush",name:"Blackwater Rush",region:"the-crownlands", hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["harrenhal","kings-landing","stoney-sept","kingswood","bronzegate","ashford"] },

  // ── THE REACH ─────────────────────────────────────────────────
  "stoney-sept":   { id:"stoney-sept",  name:"Stoney Sept",    region:"the-reach",        hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["riverrun","harrenhal","golden-tooth","oxcross","cleganes-keep","ashford","blackwater-rush","the-mander"] },
  "ashford":       { id:"ashford",      name:"Ashford",        region:"the-reach",        hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["stoney-sept","blackwater-rush","highgarden","brightwater-keep","bronzegate","kingswood"] },
  "highgarden":    { id:"highgarden",   name:"Highgarden",     region:"the-reach",        hasCastle:true,  hasPort:false, cardType:"siege",
    adjacentTo:["ashford","brightwater-keep","the-mander","horn-hill","three-towers","oldtown","seabed-marches"] },
  "oldtown":       { id:"oldtown",      name:"Oldtown",        region:"the-reach",        hasCastle:true,  hasPort:true,  cardType:"footsoldier",
    adjacentTo:["highgarden","horn-hill","three-towers","red-mountains"] },
  "three-towers":  { id:"three-towers", name:"Three Towers",   region:"the-reach",        hasCastle:false, hasPort:true,  cardType:"knight",
    adjacentTo:["highgarden","oldtown","seabed-marches","lannisport"] },
  "horn-hill":     { id:"horn-hill",    name:"Horn Hill",      region:"the-reach",        hasCastle:false, hasPort:false, cardType:"siege",
    adjacentTo:["highgarden","oldtown","red-mountains","yronwood"] },
  "brightwater-keep":{ id:"brightwater-keep",name:"Brightwater Keep",region:"the-reach",  hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["ashford","highgarden","bronzegate"] },
  "the-mander":    { id:"the-mander",   name:"The Mander",     region:"the-reach",        hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["stoney-sept","highgarden","seabed-marches"] },
  "seabed-marches":{ id:"seabed-marches",name:"Seabed Marches", region:"the-reach",       hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["cleganes-keep","silverhill","highgarden","three-towers","the-mander"] },

  // ── THE STORMLANDS ────────────────────────────────────────────
  "kingswood":     { id:"kingswood",    name:"Kingswood",      region:"the-stormlands",   hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["kings-landing","blackwater-rush","ashford","bronzegate","storms-end","rainwood"] },
  "bronzegate":    { id:"bronzegate",   name:"Bronzegate",     region:"the-stormlands",   hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["blackwater-rush","ashford","brightwater-keep","kingswood","storms-end"] },
  "storms-end":    { id:"storms-end",   name:"Storm's End",    region:"the-stormlands",   hasCastle:true,  hasPort:true,  cardType:"siege",
    adjacentTo:["kingswood","bronzegate","dragonstone","rainwood","tarth","lornish-marches"] },
  "rainwood":      { id:"rainwood",     name:"Rainwood",       region:"the-stormlands",   hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["kingswood","storms-end","lornish-marches"] },
  "lornish-marches":{ id:"lornish-marches",name:"Lornish Marches",region:"the-stormlands",hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["storms-end","rainwood","tarth","the-tor"] },
  "tarth":         { id:"tarth",        name:"Tarth",          region:"the-stormlands",   hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["storms-end","lornish-marches"] },

  // ── DORNE ─────────────────────────────────────────────────────
  "red-mountains": { id:"red-mountains",name:"Red Mountains",  region:"dorne",            hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["oldtown","horn-hill","yronwood","sandstone"] },
  "yronwood":      { id:"yronwood",     name:"Yronwood",       region:"dorne",            hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["horn-hill","red-mountains","the-tor","sandstone","greenblood"] },
  "the-tor":       { id:"the-tor",      name:"The Tor",        region:"dorne",            hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["yronwood","lornish-marches","greenblood","planky-town","sunspear"] },
  "sandstone":     { id:"sandstone",    name:"Sandstone",      region:"dorne",            hasCastle:false, hasPort:false, cardType:"footsoldier",
    adjacentTo:["red-mountains","yronwood","greenblood"] },
  "greenblood":    { id:"greenblood",   name:"Greenblood",     region:"dorne",            hasCastle:false, hasPort:false, cardType:"knight",
    adjacentTo:["yronwood","sandstone","the-tor","planky-town"] },
  "planky-town":   { id:"planky-town",  name:"Planky Town",    region:"dorne",            hasCastle:false, hasPort:true,  cardType:"siege",
    adjacentTo:["greenblood","the-tor","sunspear","oldtown"] },
  "sunspear":      { id:"sunspear",     name:"Sunspear",       region:"dorne",            hasCastle:true,  hasPort:true,  cardType:"footsoldier",
    adjacentTo:["the-tor","planky-town"] }
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
    color: "#8b5a2b",         // brown
    colorDark: "#5d3a1a",
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
// Fixed trade values by set type — no escalation.
// 3 of a kind: footsoldier=4, knight=6, siege=6. 1 of each=7.
// Wilds substitute for any type.
var CARD_TRADE_VALUES = {
  footsoldier: 4,
  knight:      6,
  siege:       6,
  mixed:       7
};

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
 // Returns armies earned for a set of 3 cards.
// Pass the 3 cardType strings (after wild substitution).
// Call calcCardSetValue(types) instead for the new fixed system.
function calcCardTradeValue(setsTraded) {
  // Legacy signature kept so nothing breaks — returns minimum value.
  return 4;
}

// NEW: returns the correct fixed value for a specific set of 3 card types.
// types = array of 3 strings e.g. ["footsoldier","footsoldier","footsoldier"]
// Wilds are treated as wildcards — they take on whatever type gives most value.
function calcCardSetValue(types) {
  var nonWild = types.filter(function(t) { return t !== "wild"; });
  var wilds   = types.length - nonWild.length;

  // With 2 or 3 wilds we can make any 3-of-a-kind — best is siege/knight = 6.
  if (wilds >= 2) return 6;

  // With 1 wild and 2 non-wilds:
  // If both non-wilds are the same type, wild matches = 3 of a kind.
  // If both are different types, wild can complete either a 3-of-a-kind or mixed.
  // Best outcome: if we can form 3-of-a-kind of siege or knight, do it (=6).
  // Otherwise mixed = 7.
  if (wilds === 1) {
    if (nonWild[0] === nonWild[1]) {
      return CARD_TRADE_VALUES[nonWild[0]] || 4;
    }
    // Two different non-wilds + 1 wild = 1 of each = 7.
    return 7;
  }

  // No wilds.
  var unique = {};
  for (var i = 0; i < nonWild.length; i++) unique[nonWild[i]] = true;
  var uniqueCount = Object.keys(unique).length;

  if (uniqueCount === 1) {
    // 3 of a kind.
    return CARD_TRADE_VALUES[nonWild[0]] || 4;
  }
  if (uniqueCount === 3) {
    // 1 of each.
    return 7;
  }
  // Should not reach here for a valid set — return minimum.
  return 4;
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


