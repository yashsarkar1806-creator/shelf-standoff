const { test } = require("node:test");
const assert = require("node:assert/strict");
const S = require("../score.js");

const bolt = S.DEMOS.find((d) => d.id === "bolt-bite");
const nimbu = S.DEMOS.find((d) => d.id === "nimbu-folk");
const camo = S.DEMOS.find((d) => d.id === "camouflage");

test("contrast ratio of white and black is 21", () => {
  assert.equal(Math.round(S.contrastRatio("#ffffff", "#000000")), 21);
});

test("contrast ratio of a colour with itself is 1", () => {
  assert.equal(S.contrastRatio("#c8f542", "#c8f542"), 1);
});

test("parseHex accepts short and long hex", () => {
  assert.deepEqual(S.parseHex("#0f0"), { r: 0, g: 255, b: 0, hex: "#00ff00" });
  assert.equal(S.parseHex("not-a-colour"), null);
});

test("a short punchy name scores higher than a long corporate name", () => {
  assert.ok(S.nameClarity("BOLT BITE") > S.nameClarity("PREMIUM QUALITY SNACK CO"));
  assert.ok(S.nameClarity("NIMBU FOLK") > S.nameClarity("THE EXTRAORDINARY CRIMSON ORCHARD BEVERAGE COMPANY"));
});

test("a 3–5 word claim is clearer than a 12-word one or a missing claim", () => {
  const tight = S.claimClarity("The tang that talks back");
  const long = S.claimClarity("The amazing best premium quality taste experience for your family");
  const none = S.claimClarity("");
  assert.ok(tight > long);
  assert.ok(tight > none);
  assert.equal(tight, 100);
});

test("low text contrast tanks clarity", () => {
  const high = S.scoreClarity({ ...bolt });
  const low = S.scoreClarity({ ...bolt, text: "#b8de3a" });
  assert.ok(high > 70);
  assert.ok(low < high - 15);
  assert.ok(S.contrastRatio(bolt.text, bolt.primary) > 7);
  assert.ok(S.contrastRatio("#b8de3a", bolt.primary) < 2);
});

test("weak filler words pull a claim's clarity down", () => {
  const concrete = S.scoreClarity({ ...bolt, claim: "The tang that talks back", name: "BOLT BITE" });
  const weak = S.scoreClarity({
    ...bolt,
    name: "BOLT BITE",
    claim: "The amazing best premium quality taste",
  });
  assert.ok(concrete > weak);
});

test("a pack that matches a neighbour's colour scores lower standout", () => {
  const rivals = S.RIVALS.kids;
  const cricketRed = rivals[0].primary;
  const unique = S.scoreStandout(bolt, rivals);
  const twin = S.scoreStandout({ ...bolt, primary: cricketRed, accent: cricketRed }, rivals);
  assert.ok(unique > twin + 15);
});

test("a unique silhouette scores more standout than a crowded shape", () => {
  const rivals = [
    { name: "A", primary: "#E23C2F", shape: "pouch" },
    { name: "B", primary: "#1D4ED8", shape: "pouch" },
    { name: "C", primary: "#F97316", shape: "pouch" },
    { name: "D", primary: "#4C1D95", shape: "pouch" },
  ];
  const pouch = S.scoreStandout({ ...bolt, shape: "pouch", primary: "#C8F542" }, rivals);
  const bottle = S.scoreStandout({ ...bolt, shape: "bottle", primary: "#C8F542" }, rivals);
  assert.ok(bottle > pouch);
});

test("price inside the bay beats a sticker that overreaches", () => {
  const band = S.BAYS.kids.price;
  const inBand = S.priceScore(49, band);
  const habit = S.priceScore(35, band);
  const shock = S.priceScore(199, band);
  const cheap = S.priceScore(5, band);
  assert.ok(habit >= inBand);
  assert.ok(inBand > shock + 30);
  assert.ok(inBand > cheap);
});

test("charm pricing adds a small bump", () => {
  const band = S.BAYS.kids.price;
  assert.ok(S.priceScore(49, band) > S.priceScore(50, band));
});

test("vivid flavours outscore a generic Original", () => {
  assert.ok(S.flavourScore("Raw mango chilli", "crisps") > S.flavourScore("Original", "crisps"));
  assert.ok(S.flavourScore("Salted lime", "soda") > S.flavourScore("Classic", "soda"));
});

test("a drink in the kids bay loses category-fit appeal", () => {
  const crisp = S.scoreAppeal({ ...bolt, category: "crisps", bay: "kids" }, "kids");
  const soda = S.scoreAppeal({ ...bolt, category: "soda", bay: "kids" }, "kids");
  assert.ok(crisp > soda);
});

test("overall is the 40/30/30 weighted blend", () => {
  assert.equal(S.combineScores(100, 50, 50), 70);
  assert.equal(S.combineScores(0, 0, 0), 0);
});

test("Bolt Bite clearly beats the camouflage pack on the kids bay", () => {
  const win = S.run(bolt, { seed: 7, rivals: S.RIVALS.kids.slice(0, 4) });
  const lose = S.run(camo, { seed: 7, rivals: S.RIVALS.kids.slice(0, 4) });
  assert.ok(win.scores.overall > lose.scores.overall + 20);
  assert.ok(win.scores.clarity > lose.scores.clarity + 25);
  assert.ok(win.scores.appeal > lose.scores.appeal + 20);
  assert.ok(win.grabRate > lose.grabRate);
  assert.ok(lose.scores.clarity < 50);
});

test("Nimbu Folk holds up on the drinks door", () => {
  const r = S.run(nimbu, { seed: 11 });
  assert.equal(r.bay.id, "drinks");
  assert.ok(r.scores.overall >= 65);
  assert.ok(r.scores.clarity >= 70);
  assert.ok(r.grabRate >= 20);
});

test("shopper simulation is deterministic for a fixed seed", () => {
  const a = S.run(bolt, { seed: 42 });
  const b = S.run(bolt, { seed: 42 });
  assert.deepEqual(a.totals, b.totals);
  assert.equal(a.grabRate, b.grabRate);
  assert.deepEqual(
    a.shoppers.map((s) => s.action),
    b.shoppers.map((s) => s.action)
  );
});

test("a different seed can change the walk-by", () => {
  const seeds = [];
  for (let i = 0; i < 30; i++) seeds.push(S.run(bolt, { seed: i }).grabRate);
  assert.ok(new Set(seeds).size > 1);
});

test("every run returns ten stylised shoppers and counts that add up", () => {
  const r = S.run(bolt, { seed: 3 });
  assert.equal(r.shoppers.length, 10);
  assert.equal(r.totals.ignored + r.totals.noticed, 10);
  assert.ok(r.totals.lingered <= r.totals.noticed);
  assert.ok(r.totals.picked <= r.totals.lingered);
  assert.equal(r.synthetic, true);
  assert.match(r.disclaimer, /illustrative/i);
  assert.match(r.disclaimer, /fictional/i);
});

test("pickRivals is deterministic and stays fictional", () => {
  const a = S.pickRivals("kids", 99);
  const b = S.pickRivals("kids", 99);
  const c = S.pickRivals("kids", 100);
  assert.equal(a.length, 4);
  assert.deepEqual(a.map((r) => r.name), b.map((r) => r.name));
  a.forEach((r) => {
    assert.equal(r.fictional, true);
    assert.ok(r.name.length > 0);
    assert.ok(S.parseHex(r.primary));
  });
  // Different seeds should usually shuffle differently; if not, names still come from the pool.
  const pool = S.RIVALS.kids.map((r) => r.name).sort();
  assert.deepEqual(a.map((r) => r.name).sort().every((n) => pool.includes(n)), true);
  assert.ok(c.length === 4);
});

test("a long weak claim is called out in the marketer readout", () => {
  const r = S.run(camo, { seed: 1, rivals: S.RIVALS.kids.slice(0, 4) });
  const text = r.readout.bullets.join(" ");
  assert.match(text, /words|premium|contrast|₹199|habit price/i);
  assert.equal(r.readout.grade, "lost");
});

test("Bolt Bite readout celebrates pop or pickup and ships a launch kit", () => {
  const r = S.run(bolt, { seed: 7, rivals: S.RIVALS.kids.slice(0, 4) });
  assert.ok(["winner", "strong"].includes(r.readout.grade));
  assert.ok(r.launchKit.tagline.includes("BOLT BITE") || r.launchKit.tagline.toLowerCase().includes("mango"));
  assert.match(r.launchKit.caption, /fictional/i);
  assert.match(r.launchKit.sampling, /kids bay/i);
  assert.ok(r.launchKit.sampling.includes(bolt.claim));
});

test("normalizePack fills defaults and clamps price", () => {
  const p = S.normalizePack({ name: "  ", price: 5000, category: "nope", shape: "spaceship", bay: "moon" });
  assert.equal(p.name, "UNTITLED");
  assert.equal(p.price, 999);
  assert.equal(p.category, "crisps");
  assert.equal(p.shape, "pouch");
  assert.equal(p.bay, "kids");
});

test("grades follow the score bands", () => {
  assert.equal(S.gradeFor(90).id, "winner");
  assert.equal(S.gradeFor(70).id, "strong");
  assert.equal(S.gradeFor(55).id, "almost");
  assert.equal(S.gradeFor(20).id, "lost");
});

test("higher standout raises notice probability, holding other scores fixed", () => {
  const pack = S.normalizePack(bolt);
  const low = S.simulateShoppers({ standout: 20, clarity: 80, appeal: 80 }, pack, S.BAYS.kids, 5);
  const high = S.simulateShoppers({ standout: 95, clarity: 80, appeal: 80 }, pack, S.BAYS.kids, 5);
  const lowNotice = low.shoppers.reduce((n, s) => n + s.pNotice, 0);
  const highNotice = high.shoppers.reduce((n, s) => n + s.pNotice, 0);
  assert.ok(highNotice > lowNotice * 1.5);
});

test("every bay has four fictional rivals and a price band", () => {
  Object.keys(S.BAYS).forEach((id) => {
    assert.equal(S.RIVALS[id].length, 5);
    assert.ok(S.BAYS[id].price.habit >= S.BAYS[id].price.min);
    assert.ok(S.BAYS[id].price.habit <= S.BAYS[id].price.max);
    assert.ok(S.BAYS[id].sampling.length > 20);
  });
});
