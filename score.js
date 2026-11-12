/**
 * Shelf Standoff — pure scoring, rival-shelf and shopper-simulation
 * logic. Works in the browser and in Node. All numbers are a stylised,
 * illustrative model of a 3-second FMCG "first look" at the shelf,
 * not a lab study or a claim about any real brand.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ShelfStandoff = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DISCLAIMER =
    "All packs, shoppers, scores and launch ideas are fictional and illustrative. This is a playful, stylised model of a 3-second shelf glance — not a lab study, and not affiliated with any real retailer or brand.";

  var BAYS = {
    kids: {
      id: "kids",
      name: "Kids snack bay",
      blurb: "Loud pouches, cartoon energy, pocket-money prices. You have to pop, then make sense in a second.",
      price: { min: 20, max: 60, habit: 35 },
      mood: "loud",
      fit: { crisps: 1, biscuit: 1, chocolate: 0.9, soda: 0.55, lassi: 0.4, noodles: 0.5 },
      sampling:
        "A Sunday tasting tray at the end of the kids bay — one handful, one line on a handwritten card.",
    },
    drinks: {
      id: "drinks",
      name: "Cold drinks door",
      blurb: "A wall of cold cans. People already know what they came for, so a new pack has to interrupt the reach.",
      price: { min: 25, max: 80, habit: 45 },
      mood: "cool",
      fit: { soda: 1, lassi: 0.95, crisps: 0.3, biscuit: 0.25, chocolate: 0.35, noodles: 0.2 },
      sampling:
        "An ice bucket by the cold-drinks door on payday Friday. Let the pack sweat. One line on a necker.",
    },
    till: {
      id: "till",
      name: "Impulse till",
      blurb: "The last three seconds of the trip. Small packs, one-word promises, prices that do not need a second thought.",
      price: { min: 10, max: 40, habit: 20 },
      mood: "fast",
      fit: { chocolate: 1, biscuit: 0.95, crisps: 0.8, soda: 0.55, lassi: 0.3, noodles: 0.35 },
      sampling:
        "A tester jar at the till. The ritual is “one for the walk home,” not a speech.",
    },
    healthy: {
      id: "healthy",
      name: "Healthy-ish aisle",
      blurb: "Muted cartons, quieter claims, shoppers who actually read. Standing out still matters, shouting does not.",
      price: { min: 80, max: 180, habit: 119 },
      mood: "calm",
      fit: { lassi: 1, biscuit: 0.7, soda: 0.65, noodles: 0.6, crisps: 0.45, chocolate: 0.5 },
      sampling:
        "A calm table, not a shout. Offer a cup, a clean napkin, and the claim in four words.",
    },
  };

  var CATEGORIES = {
    crisps: { id: "crisps", label: "Crisps", shapes: ["pouch"], bland: ["original", "classic", "salted", "regular"] },
    soda: { id: "soda", label: "Sparkling drink", shapes: ["can", "bottle"], bland: ["original", "classic", "cola", "regular"] },
    chocolate: { id: "chocolate", label: "Chocolate bar", shapes: ["bar"], bland: ["original", "classic", "milk", "regular"] },
    lassi: { id: "lassi", label: "Lassi / cultured drink", shapes: ["bottle", "carton"], bland: ["original", "classic", "plain", "regular", "sweet"] },
    biscuit: { id: "biscuit", label: "Biscuits", shapes: ["carton", "pouch"], bland: ["original", "classic", "plain", "regular"] },
    noodles: { id: "noodles", label: "Instant noodles", shapes: ["pouch"], bland: ["original", "classic", "masala", "regular"] },
  };

  var SHAPES = ["pouch", "can", "bottle", "carton", "bar"];

  var WEAK_WORDS = [
    "amazing", "best", "premium", "quality", "ultimate", "perfect", "super",
    "awesome", "finest", "legendary", "incredible", "fantastic", "world-class",
    "number-one", "numberone", "excellent", "superior",
  ];

  var CONCRETE_WORDS = [
    "crunch", "fizz", "tang", "spice", "chilli", "chili", "lime", "mango",
    "cocoa", "roast", "snap", "zing", "quench", "cool", "cold", "heat",
    "smoky", "salt", "sweet", "sour", "tart", "ginger", "yuzu", "kokum",
    "tamarind", "pepper", "butter", "toasted", "ripe", "raw", "no-sugar",
    "protein", "talks", "pops", "bites", "crackle", "foam", "mist",
  ];

  var RIVALS = {
    kids: [
      { name: "CRICKLE CRISPS", flavour: "Cheese comet", claim: "Crunch time", category: "crisps", shape: "pouch", primary: "#E23C2F", accent: "#F2C14E", text: "#FFF8EE", price: 35 },
      { name: "GULLY PUFFS", flavour: "Sweet masala", claim: "Puff and go", category: "crisps", shape: "pouch", primary: "#1D4ED8", accent: "#F97316", text: "#FFFFFF", price: 30 },
      { name: "MOON MASALA", flavour: "Midnight chilli", claim: "Night crunch", category: "chocolate", shape: "bar", primary: "#4C1D95", accent: "#E8F6C8", text: "#F6EFD9", price: 40 },
      { name: "SUNNY SEEDZ", flavour: "Honey crunch", claim: "Little lift", category: "biscuit", shape: "carton", primary: "#F97316", accent: "#1A1410", text: "#1A1410", price: 45 },
      { name: "TANGA POP", flavour: "Berry pop", claim: "One more", category: "chocolate", shape: "bar", primary: "#DB2777", accent: "#F2C14E", text: "#FFFFFF", price: 25 },
    ],
    drinks: [
      { name: "FOAM FIZZ CO", flavour: "Citrus rush", claim: "Open and fizz", category: "soda", shape: "can", primary: "#F4D35E", accent: "#0B3D2E", text: "#0B3D2E", price: 39 },
      { name: "RIVER COLA", flavour: "Deep spice", claim: "Slow fizz", category: "soda", shape: "can", primary: "#2A1A16", accent: "#E23C2F", text: "#F6EFD9", price: 35 },
      { name: "PETAL POP", flavour: "Lychee mist", claim: "Soft sparkle", category: "soda", shape: "bottle", primary: "#F9A8D4", accent: "#4C1D95", text: "#3B0764", price: 59 },
      { name: "BANYAN LASSI", flavour: "Cardamom", claim: "Cool down", category: "lassi", shape: "carton", primary: "#F6EFD9", accent: "#0B3D2E", text: "#0B3D2E", price: 49 },
      { name: "KOKUM WAVE", flavour: "Kokum soda", claim: "Tart and tall", category: "soda", shape: "bottle", primary: "#9F1239", accent: "#F6EFD9", text: "#FFF8EE", price: 55 },
    ],
    till: [
      { name: "POCKET BAR", flavour: "Roast cocoa", claim: "One square", category: "chocolate", shape: "bar", primary: "#4A2C2A", accent: "#F2C14E", text: "#F6EFD9", price: 20 },
      { name: "TIK TIK", flavour: "Butter biscuit", claim: "Tick tock treat", category: "biscuit", shape: "carton", primary: "#F2C14E", accent: "#1A1410", text: "#1A1410", price: 15 },
      { name: "CHILLI NIB", flavour: "Chilli cocoa", claim: "Tiny heat", category: "chocolate", shape: "bar", primary: "#9F1239", accent: "#F6EFD9", text: "#FFF8EE", price: 25 },
      { name: "CRACK LANE", flavour: "Salted lime", claim: "Last crunch", category: "crisps", shape: "pouch", primary: "#65A30D", accent: "#1A1410", text: "#1A1410", price: 20 },
      { name: "MINT MILE", flavour: "Mint cocoa", claim: "Cool walk home", category: "chocolate", shape: "bar", primary: "#0F766E", accent: "#ECFDF5", text: "#ECFDF5", price: 22 },
    ],
    healthy: [
      { name: "QUIET CULTURE", flavour: "Mango turmeric", claim: "Slow sip", category: "lassi", shape: "bottle", primary: "#FEF3C7", accent: "#B45309", text: "#7C2D12", price: 129 },
      { name: "LEAF & LENTIL", flavour: "Pepper millet", claim: "Honest crunch", category: "biscuit", shape: "carton", primary: "#E8F0E3", accent: "#3F6212", text: "#1A2E05", price: 99 },
      { name: "SOUTH BROTH", flavour: "Pepper garlic", claim: "Warm bowl, fast", category: "noodles", shape: "pouch", primary: "#F5E6CC", accent: "#7C2D12", text: "#431407", price: 89 },
      { name: "COCONUT CALM", flavour: "Tender coconut", claim: "No sticky sweet", category: "lassi", shape: "carton", primary: "#F0FDFA", accent: "#0F766E", text: "#134E4A", price: 139 },
      { name: "AMARANTH OAK", flavour: "Toasted amaranth", claim: "Four ingredients", category: "biscuit", shape: "carton", primary: "#E7D5C5", accent: "#44403C", text: "#1C1917", price: 149 },
    ],
  };

  var SHOPPER_TYPES = {
    rushed: {
      id: "rushed",
      label: "Rushed parent",
      attention: 0.82,
      convert: 0.72,
      priceSensitivity: 0.7,
      noteNotice: "caught their eye",
      noteLinger: "slowed the trolley",
      notePick: "dropped it in the trolley",
      noteIgnore: "walked straight past",
    },
    hunter: {
      id: "hunter",
      label: "Flavour hunter",
      attention: 1.05,
      convert: 0.88,
      priceSensitivity: 0.35,
      noteNotice: "clocked a new flavour",
      noteLinger: "read the claim",
      notePick: "took it for the flavour",
      noteIgnore: "did not see a new flavour",
    },
    checker: {
      id: "checker",
      label: "Price checker",
      attention: 0.78,
      convert: 0.64,
      priceSensitivity: 1.15,
      noteNotice: "saw the pack",
      noteLinger: "checked the sticker",
      notePick: "decided it was worth it",
      noteIgnore: "did not glance",
    },
    loyalist: {
      id: "loyalist",
      label: "Habit loyalist",
      attention: 0.62,
      convert: 0.42,
      priceSensitivity: 0.55,
      noteNotice: "noticed a stranger on the shelf",
      noteLinger: "compared it to their usual",
      notePick: "broke the habit, just once",
      noteIgnore: "reached for their usual",
    },
    curious: {
      id: "curious",
      label: "Curious teen",
      attention: 1.12,
      convert: 0.84,
      priceSensitivity: 0.45,
      noteNotice: "stopped mid-scroll, almost",
      noteLinger: "laughed at the name",
      notePick: "bought it for the look",
      noteIgnore: "never looked up",
    },
  };

  var MIXES = {
    kids: ["rushed", "rushed", "curious", "curious", "hunter", "checker", "loyalist", "rushed", "curious", "hunter"],
    drinks: ["hunter", "checker", "rushed", "loyalist", "hunter", "curious", "checker", "rushed", "hunter", "loyalist"],
    till: ["rushed", "rushed", "rushed", "checker", "curious", "loyalist", "checker", "rushed", "curious", "checker"],
    healthy: ["hunter", "loyalist", "checker", "hunter", "loyalist", "rushed", "hunter", "checker", "curious", "loyalist"],
  };

  var DEMOS = [
    {
      id: "bolt-bite",
      title: "Bolt Bite",
      name: "BOLT BITE",
      flavour: "Raw mango chilli",
      claim: "The tang that talks back",
      category: "crisps",
      shape: "pouch",
      primary: "#C8F542",
      accent: "#FF3D8A",
      text: "#121212",
      price: 49,
      bay: "kids",
    },
    {
      id: "nimbu-folk",
      title: "Nimbu Folk",
      name: "NIMBU FOLK",
      flavour: "Salted lime",
      claim: "Cold fizz, no sticky sweet",
      category: "soda",
      shape: "can",
      primary: "#0B3D2E",
      accent: "#F4F1E8",
      text: "#F4F1E8",
      price: 39,
      bay: "drinks",
    },
    {
      id: "camouflage",
      title: "A camouflage pack",
      name: "PREMIUM QUALITY SNACK CO",
      flavour: "Original",
      claim: "The amazing best premium quality taste experience for your family",
      category: "crisps",
      shape: "pouch",
      primary: "#C4472A",
      accent: "#B33B22",
      text: "#A33924",
      price: 199,
      bay: "kids",
    },
  ];

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function clamp01(n) {
    return clamp(n, 0, 1);
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function isBlank(v) {
    return v == null || String(v).trim() === "";
  }

  function words(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9+]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function slug(s) {
    return words(s).join(" ");
  }

  function parseHex(hex) {
    var h = String(hex || "").trim().replace(/^#/, "");
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      hex: "#" + h.toLowerCase(),
    };
  }

  function channelToLinear(c) {
    var s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    var rgb = parseHex(hex);
    if (!rgb) return 0;
    var r = channelToLinear(rgb.r);
    var g = channelToLinear(rgb.g);
    var b = channelToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(a, b) {
    var l1 = relativeLuminance(a);
    var l2 = relativeLuminance(b);
    var hi = Math.max(l1, l2);
    var lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function hexToHsl(hex) {
    var rgb = parseHex(hex);
    if (!rgb) return { h: 0, s: 0, l: 0 };
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var d = max - min;
    var h = 0;
    var s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }

  function hueDelta(a, b) {
    var d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
  }

  function colorDistance(a, b) {
    var A = hexToHsl(a);
    var B = hexToHsl(b);
    var h = hueDelta(A.h, B.h) / 180;
    var s = Math.abs(A.s - B.s) / 100;
    var l = Math.abs(A.l - B.l) / 100;
    return Math.sqrt(h * h * 2.56 + s * s * 0.64 + l * l * 1.21);
  }

  function hashSeed(str) {
    var h = 2166136261;
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    var seed = a >>> 0;
    return function () {
      seed = (seed + 0x6d2b79f5) >>> 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sigmoid(x) {
    if (x > 12) return 1;
    if (x < -12) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function sanitizeHex(hex, fallback) {
    var p = parseHex(hex);
    return p ? p.hex : fallback;
  }

  function normalizePack(input) {
    var raw = input || {};
    var category = CATEGORIES[raw.category] ? raw.category : "crisps";
    var shape = SHAPES.indexOf(raw.shape) >= 0 ? raw.shape : CATEGORIES[category].shapes[0];
    var bay = BAYS[raw.bay] ? raw.bay : "kids";
    var price = Number(raw.price);
    if (!isFinite(price)) price = BAYS[bay].price.habit;
    price = clamp(Math.round(price), 1, 999);
    return {
      name: String(raw.name || "UNTITLED").trim().slice(0, 40) || "UNTITLED",
      flavour: String(raw.flavour || "Original").trim().slice(0, 40) || "Original",
      claim: String(raw.claim || "").trim().slice(0, 80),
      category: category,
      shape: shape,
      primary: sanitizeHex(raw.primary, "#C8F542"),
      accent: sanitizeHex(raw.accent, "#FF3D8A"),
      text: sanitizeHex(raw.text, "#121212"),
      price: price,
      bay: bay,
    };
  }

  function nameClarity(name) {
    var n = String(name || "").trim();
    var len = n.length;
    var wc = words(n).length;
    var lengthScore;
    if (len <= 0) lengthScore = 0;
    else if (len >= 6 && len <= 14) lengthScore = 100;
    else if (len < 6) lengthScore = 70 + len * 5;
    else if (len <= 18) lengthScore = 100 - (len - 14) * 8;
    else lengthScore = Math.max(20, 68 - (len - 18) * 5);

    var wordScore = wc <= 0 ? 0 : wc <= 3 ? 100 : wc === 4 ? 70 : Math.max(20, 70 - (wc - 4) * 15);
    var caps = n === n.toUpperCase() && /[A-Z]/.test(n);
    var capsPenalty = caps && len > 14 ? 12 : caps && len > 10 ? 5 : 0;
    return clamp(lengthScore * 0.65 + wordScore * 0.35 - capsPenalty, 0, 100);
  }

  function claimClarity(claim) {
    var wc = words(claim).length;
    if (wc === 0) return 38;
    if (wc === 1) return 72;
    if (wc >= 2 && wc <= 5) return 100;
    if (wc === 6) return 78;
    if (wc === 7) return 64;
    return Math.max(18, 64 - (wc - 7) * 8);
  }

  function contrastClarity(pack) {
    var ratio = contrastRatio(pack.text, pack.primary);
    if (ratio >= 7) return 100;
    if (ratio >= 4.5) return 75 + ((ratio - 4.5) / 2.5) * 25;
    if (ratio >= 3) return 45 + ((ratio - 3) / 1.5) * 30;
    if (ratio >= 1.5) return 12 + ((ratio - 1.5) / 1.5) * 33;
    return Math.max(0, (ratio - 1) * 24);
  }

  function weakWordCount(text) {
    var set = {};
    var list = words(text);
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var w = list[i].replace(/s$/, "");
      if (WEAK_WORDS.indexOf(list[i]) >= 0 || WEAK_WORDS.indexOf(w) >= 0) {
        if (!set[list[i]]) {
          set[list[i]] = true;
          n += 1;
        }
      }
    }
    return n;
  }

  function concreteWordCount(text) {
    var list = words(text);
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      if (CONCRETE_WORDS.indexOf(list[i]) >= 0) n += 1;
    }
    return n;
  }

  function scoreClarity(pack) {
    var p = normalizePack(pack);
    var nameS = nameClarity(p.name);
    var claimS = claimClarity(p.claim);
    var contrastS = contrastClarity(p);
    var weak = weakWordCount(p.claim) + weakWordCount(p.name);
    var weakPenalty = Math.min(28, weak * 8);
    var total = nameS * 0.28 + claimS * 0.32 + contrastS * 0.4 - weakPenalty;
    return round1(clamp(total, 0, 100));
  }

  function scoreStandout(pack, rivals) {
    var p = normalizePack(pack);
    var shelf = rivals && rivals.length ? rivals : [];
    var i;
    var distances = [];
    for (i = 0; i < shelf.length; i++) {
      distances.push(colorDistance(p.primary, shelf[i].primary));
    }
    var mean = 0;
    if (distances.length) {
      for (i = 0; i < distances.length; i++) mean += distances[i];
      mean /= distances.length;
    } else {
      mean = 0.8;
    }
    // Distance ~0.15 is me-too; ~0.9+ is a clear pop.
    var colorScore = clamp((mean - 0.12) / 0.9 * 100, 0, 100);

    var closest = distances.length ? Math.min.apply(null, distances) : 1;
    var meTooPenalty = closest < 0.22 ? (0.22 - closest) / 0.22 * 22 : 0;

    var shapeCounts = {};
    for (i = 0; i < shelf.length; i++) {
      shapeCounts[shelf[i].shape] = (shapeCounts[shelf[i].shape] || 0) + 1;
    }
    var sameShape = shapeCounts[p.shape] || 0;
    var shapeScore = sameShape === 0 ? 100 : sameShape === 1 ? 64 : sameShape === 2 ? 40 : 22;

    var nameTokens = words(p.name);
    var overlap = 0;
    for (i = 0; i < shelf.length; i++) {
      var other = words(shelf[i].name);
      for (var j = 0; j < nameTokens.length; j++) {
        if (nameTokens[j].length > 2 && other.indexOf(nameTokens[j]) >= 0) overlap += 1;
      }
    }
    var nameScore = clamp(100 - overlap * 18, 30, 100);

    var accentPop = clamp(colorDistance(p.primary, p.accent) / 1.1 * 100, 0, 100);

    var total = colorScore * 0.52 + shapeScore * 0.2 + nameScore * 0.14 + accentPop * 0.14 - meTooPenalty;
    return round1(clamp(total, 0, 100));
  }

  function priceScore(price, band) {
    var min = band.min;
    var max = band.max;
    var habit = band.habit;
    if (price <= 0) return 0;
    var score;
    if (price >= min && price <= max) {
      var span = Math.max(habit - min, max - habit, 1);
      var dist = Math.abs(price - habit) / span;
      score = clamp(98 - dist * 22, 72, 100);
    } else if (price < min) {
      var under = (min - price) / min;
      score = clamp(68 - under * 80, 12, 68);
    } else {
      var over = (price - max) / max;
      score = clamp(66 - over * 110, 4, 66);
    }
    if (price % 10 === 9) score = Math.min(100, score + 4);
    return score;
  }

  function flavourScore(flavour, category) {
    var f = slug(flavour);
    if (!f) return 30;
    var bland = (CATEGORIES[category] && CATEGORIES[category].bland) || [];
    if (bland.indexOf(f) >= 0 || bland.indexOf(words(f)[0]) >= 0) return 42;
    var wc = words(f).length;
    var vivid = wc >= 2 ? 92 : 74;
    if (concreteWordCount(f) > 0) vivid = Math.min(100, vivid + 8);
    return vivid;
  }

  function scoreAppeal(pack, bayId) {
    var p = normalizePack(pack);
    var bay = BAYS[p.bay && bayId ? p.bay : p.bay] || BAYS[bayId] || BAYS[p.bay] || BAYS.kids;
    if (bayId && BAYS[bayId]) bay = BAYS[bayId];
    var priceS = priceScore(p.price, bay.price);
    var flavS = flavourScore(p.flavour, p.category);
    var concrete = concreteWordCount(p.claim);
    var weak = weakWordCount(p.claim);
    var claimS = 50;
    if (!p.claim) claimS = 28;
    else claimS = clamp(48 + concrete * 14 - weak * 10 + (words(p.claim).length >= 2 && words(p.claim).length <= 6 ? 12 : 0), 10, 100);
    var fit = (bay.fit && bay.fit[p.category]) || 0.5;
    var fitS = fit * 100;
    var total = priceS * 0.36 + flavS * 0.24 + claimS * 0.24 + fitS * 0.16;
    return round1(clamp(total, 0, 100));
  }

  function combineScores(standout, clarity, appeal) {
    return round1(clamp(standout * 0.4 + clarity * 0.3 + appeal * 0.3, 0, 100));
  }

  function gradeFor(overall) {
    if (overall >= 82) return { id: "winner", label: "Aisle winner", line: "In three seconds, this pack gets seen, understood, and wanted." };
    if (overall >= 68) return { id: "strong", label: "Strong pickup", line: "Enough pop and clarity to earn a second look — tighten one weak edge and it can win the bay." };
    if (overall >= 52) return { id: "almost", label: "Almost", line: "Shoppers may clock it, but something — colour, claim, or price — lets the hand drift back to a habit pack." };
    return { id: "lost", label: "Lost in the bay", line: "In a three-second glance this pack blends, confuses, or overreaches. Start with one distinctive move." };
  }

  function pickRivals(bayId, seed) {
    var bay = BAYS[bayId] ? bayId : "kids";
    var pool = RIVALS[bay].slice();
    var rng = mulberry32(seed == null ? 1 : seed);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, 4).map(function (r) {
      return Object.assign({}, r, { fictional: true });
    });
  }

  function packSeed(pack) {
    var p = normalizePack(pack);
    return hashSeed(
      [p.name, p.flavour, p.claim, p.category, p.shape, p.primary, p.accent, p.text, p.price, p.bay].join("|")
    );
  }

  function priceFit(price, band, sensitivity) {
    var mid = band.habit;
    var span = Math.max(band.max - band.min, 1);
    var rel = (price - mid) / span;
    // Sensitive shoppers punish being above habit; hunters are more forgiving.
    var penalty = rel > 0 ? rel * (0.6 + sensitivity) : Math.abs(rel) * 0.25 * sensitivity;
    return clamp01(1 - penalty);
  }

  function simulateShoppers(scores, pack, bay, seed) {
    var p = normalizePack(pack);
    var b = BAYS[bay] || BAYS[p.bay] || BAYS.kids;
    var mix = MIXES[b.id] || MIXES.kids;
    var rng = mulberry32(seed == null ? packSeed(p) : seed);
    var standout = scores.standout;
    var clarity = scores.clarity;
    var appeal = scores.appeal;
    var shoppers = [];
    var totals = { ignored: 0, noticed: 0, lingered: 0, picked: 0 };

    for (var i = 0; i < mix.length; i++) {
      var type = SHOPPER_TYPES[mix[i]];
      var pNotice = clamp01(sigmoid((standout - 46) / 10) * type.attention);
      var pLinger = pNotice * clamp01(sigmoid((clarity - 44) / 10));
      var fit = priceFit(p.price, b.price, type.priceSensitivity);
      var pPick = pLinger * clamp01(sigmoid((appeal - 46) / 10)) * fit * type.convert;

      var roll1 = rng();
      var roll2 = rng();
      var roll3 = rng();
      var action = "ignored";
      var note = type.noteIgnore;
      if (roll1 < pNotice) {
        action = "noticed";
        note = type.noteNotice;
        totals.noticed += 1;
        if (pNotice > 0 && roll2 < pLinger / pNotice) {
          action = "lingered";
          note = type.noteLinger;
          totals.lingered += 1;
          if (pLinger > 0 && roll3 < pPick / pLinger) {
            action = "picked";
            note = type.notePick;
            totals.picked += 1;
          }
        }
      } else {
        totals.ignored += 1;
      }

      shoppers.push({
        id: type.id + "-" + (i + 1),
        type: type.id,
        label: type.label,
        action: action,
        note: note,
        pNotice: round1(pNotice * 100),
        pLinger: round1(pLinger * 100),
        pPick: round1(pPick * 100),
      });
    }

    var grabRate = round1((totals.picked / mix.length) * 100);
    return { shoppers: shoppers, totals: totals, grabRate: grabRate };
  }

  function buildReadout(pack, bay, scores, sim, rivals) {
    var p = normalizePack(pack);
    var b = bay;
    var grade = gradeFor(scores.overall);
    var bullets = [];
    var ratio = contrastRatio(p.text, p.primary);
    var claimWords = words(p.claim).length;
    var weak = weakWordCount(p.claim) + weakWordCount(p.name);
    var meanDist = 0;
    if (rivals && rivals.length) {
      for (var i = 0; i < rivals.length; i++) meanDist += colorDistance(p.primary, rivals[i].primary);
      meanDist /= rivals.length;
    }

    if (scores.standout >= 80) {
      bullets.push("The pack colour pops against this bay — that is distinctive-asset work, not decoration.");
    } else if (meanDist < 0.28) {
      bullets.push("The body colour sits too close to a neighbour. A bolder block colour would buy you the first glance.");
    } else if (scores.standout < 55) {
      bullets.push("In a three-second walk-by, this pack does not yet own a colour or a silhouette of its own.");
    }

    if (ratio < 3) {
      bullets.push("Type contrast is " + ratio.toFixed(1) + ":1 against the pack. In a glance, the name will melt into the colour. Aim closer to 4.5:1.");
    } else if (ratio < 4.5) {
      bullets.push("Type is readable in good light, but a tighter contrast would help the name land under supermarket fluorescents.");
    }

    if (claimWords === 0) {
      bullets.push("There is no claim. In this bay, a three-to-five-word promise is the whole conversation.");
    } else if (claimWords > 7) {
      bullets.push("The claim is " + claimWords + " words. In three seconds, a shopper reads about four to six. Cut it until it snaps.");
    } else if (weak >= 2) {
      bullets.push("Words like “premium” and “best” are invisible at shelf. Swap them for a concrete taste, texture or ritual.");
    } else if (scores.clarity >= 80) {
      bullets.push("The name and claim can be read in a glance. Keep them short when you go to print.");
    }

    var band = b.price;
    if (p.price > band.max) {
      bullets.push("₹" + p.price + " sits well above this bay’s habit price of ₹" + band.habit + ". Price checkers will bounce unless the claim earns the jump.");
    } else if (p.price < band.min) {
      bullets.push("₹" + p.price + " undercuts the bay. That can feel like a bargain — or like a signal that the pack does not belong here.");
    } else if (p.price % 10 === 9) {
      bullets.push("₹" + p.price + " is inside the bay and uses charm pricing. Quiet, useful craft.");
    }

    var fit = (b.fit && b.fit[p.category]) || 0.5;
    if (fit < 0.5) {
      bullets.push(CATEGORIES[p.category].label + " is an odd guest in the " + b.name.toLowerCase() + ". The pack has to work twice as hard, or you pick a more natural bay.");
    }

    var bland = flavourScore(p.flavour, p.category) <= 45;
    if (bland) {
      bullets.push("“" + p.flavour + "” sounds like the house default. A more specific flavour name is a free distinctive asset.");
    }

    if (sim.totals.picked === 0) {
      bullets.push("In this stylised walk-by, nobody picked it up. Fix the weakest of standout, clarity or price before you reprint.");
    } else if (sim.grabRate >= 40) {
      bullets.push(sim.totals.picked + " of " + sim.shoppers.length + " stylised shoppers put it in the trolley. That is a strong first-look.");
    }

    if (bullets.length > 5) bullets = bullets.slice(0, 5);
    if (bullets.length === 0) {
      bullets.push("The three scores are in balance. The next move is a live shelf photo: does the colour still pop under real lights?");
    }

    return {
      grade: grade.id,
      gradeLabel: grade.label,
      headline: grade.line,
      bullets: bullets,
    };
  }

  function buildLaunchKit(pack, bay, scores) {
    var p = normalizePack(pack);
    var b = bay;
    var taglines = [];
    if (p.claim) taglines.push(p.name + ": " + p.claim);
    taglines.push(p.flavour + ". In three seconds.");
    if (p.claim) taglines.push("Don't walk past the " + p.flavour.toLowerCase() + ". " + p.claim + ".");
    else taglines.push(p.name + " — a new face in the " + b.name.toLowerCase() + ".");
    var tag = taglines[scores.overall >= 70 ? 0 : taglines.length - 1];

    var caption =
      "Sunday find in the " +
      b.name.toLowerCase() +
      ". " +
      p.name +
      " · " +
      p.flavour +
      (p.claim ? ". " + p.claim : "") +
      ". ₹" +
      p.price +
      ". (Fictional pack, fictional shop, real shelf thinking.)";

    var sampling = b.sampling;
    if (p.claim) sampling = sampling + " The line: “" + p.claim + ".”";

    return {
      tagline: tag,
      caption: caption,
      sampling: sampling,
    };
  }

  function run(input, opts) {
    var options = opts || {};
    var pack = normalizePack(input);
    var bay = BAYS[pack.bay];
    var seed = options.seed != null ? options.seed : packSeed(pack);
    var rivals = options.rivals || pickRivals(pack.bay, seed);
    var slot = options.slot != null ? options.slot : 2;
    var standout = scoreStandout(pack, rivals);
    var clarity = scoreClarity(pack);
    var appeal = scoreAppeal(pack, pack.bay);
    var overall = combineScores(standout, clarity, appeal);
    var scores = { standout: standout, clarity: clarity, appeal: appeal, overall: overall };
    var sim = simulateShoppers(scores, pack, bay, (seed ^ 0x9e3779b9) >>> 0);
    var readout = buildReadout(pack, bay, scores, sim, rivals);
    var launchKit = buildLaunchKit(pack, bay, scores);
    return {
      pack: pack,
      bay: bay,
      rivals: rivals,
      slot: slot,
      seed: seed,
      scores: scores,
      shoppers: sim.shoppers,
      totals: sim.totals,
      grabRate: sim.grabRate,
      readout: readout,
      launchKit: launchKit,
      disclaimer: DISCLAIMER,
      synthetic: true,
    };
  }

  return {
    DISCLAIMER: DISCLAIMER,
    BAYS: BAYS,
    CATEGORIES: CATEGORIES,
    SHAPES: SHAPES,
    RIVALS: RIVALS,
    SHOPPER_TYPES: SHOPPER_TYPES,
    DEMOS: DEMOS,
    clamp: clamp,
    words: words,
    parseHex: parseHex,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    hexToHsl: hexToHsl,
    colorDistance: colorDistance,
    hashSeed: hashSeed,
    mulberry32: mulberry32,
    sigmoid: sigmoid,
    normalizePack: normalizePack,
    nameClarity: nameClarity,
    claimClarity: claimClarity,
    scoreClarity: scoreClarity,
    scoreStandout: scoreStandout,
    scoreAppeal: scoreAppeal,
    priceScore: priceScore,
    flavourScore: flavourScore,
    combineScores: combineScores,
    gradeFor: gradeFor,
    pickRivals: pickRivals,
    packSeed: packSeed,
    simulateShoppers: simulateShoppers,
    buildReadout: buildReadout,
    buildLaunchKit: buildLaunchKit,
    run: run,
  };
});
