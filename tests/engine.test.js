// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const { audit, checkSentence, buildEvidence } = require("../js/engine.js");
const { PRODUCTS } = require("../js/data.js");

const ev = buildEvidence(
  "Oven safe up to 400°F\nHand wash recommended to protect the coating",
  "Induction: No\nWeight: 2.1 lb",
  [{ stars: 5, text: "Eggs slide right off. Nothing sticks." }, { stars: 2, text: "The handle gets really hot." }]
);
const statusOf = s => checkSentence(s, ev).map(c => c.status);

test("flags a wrong number", () => assert.deepStrictEqual(statusOf("It's oven safe up to 500°F."), ["contradicted"]));
test("confirms a matching number", () => assert.deepStrictEqual(statusOf("It's oven safe up to 400°F."), ["supported"]));
test("catches a yes/no feature the listing denies", () => assert.deepStrictEqual(statusOf("It is dishwasher safe."), ["contradicted"]));
test("reads specs written as 'Name: No'", () => assert.deepStrictEqual(statusOf("It works on induction."), ["contradicted"]));
test("checks claims about what reviews say", () => {
  assert.deepStrictEqual(statusOf("Reviewers say nothing sticks."), ["supported"]);
  assert.deepStrictEqual(statusOf("Customers mention the handle stays cool."), ["contradicted"]);
});
test("marks claims with no evidence as not on the page", () => assert.deepStrictEqual(statusOf("It comes with a glass lid."), ["missing"]));

test("sample products produce the expected counts", () => {
  const expected = { coffee: [9, 4], earbuds: [11, 6], skillet: [8, 4] };
  for (const p of PRODUCTS) {
    const r = audit(p);
    assert.strictEqual(r.n, expected[p.id][0], p.id + " claims");
    assert.strictEqual(r.contradicted, expected[p.id][1], p.id + " contradicted");
  }
});
