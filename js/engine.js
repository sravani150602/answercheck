// AnswerCheck engine: split an AI answer into claims and check each against listing, specs and reviews.

const NEG = "(?:not|never|no|isn'?t|aren'?t|wasn'?t|doesn'?t|don'?t|won'?t|cannot|can'?t|without)";

// Boolean features: pos = asserts feature, neg = denies it. Checked on claim and on listing/specs.
const FEATURES = [
  { id: "dishwasher", label: "Dishwasher safe",
    pos: /dishwasher[- ]safe|safe in the dishwasher|goes in the dishwasher|dishwasher: yes/i,
    neg: /not dishwasher[- ]safe|hand[- ]wash (?:only|recommended)|dishwasher: no|avoid (?:the )?dishwasher/i },
  { id: "induction", label: "Induction compatible",
    pos: /(?:works|work) on induction|induction[- ](?:compatible|ready)|compatible with induction|induction: yes|all stovetops,? including induction/i,
    neg: /not (?:induction[- ]compatible|compatible with induction|for induction)|induction: no|no induction|won'?t work on induction/i },
  { id: "pfas", label: "PFAS-free coating",
    pos: /pfas[- ]free|free of pfas|pfas: none/i,
    neg: /contains pfas|pfas: yes/i },
  { id: "waterproof", label: "Waterproof / swim-proof",
    pos: /waterproof|swim(?:ming)?[- ]?(?:proof|safe)?\b|submersible|underwater/i,
    neg: /not (?:waterproof|for swimming|submersible)|splash[- ]resistant|sweat[- ]resistant|water resistance: ipx[1-4]\b|do not submerge/i },
  { id: "multipoint", label: "Multipoint (two devices at once)",
    pos: /multipoint|connects? to two devices|two devices at (?:the same time|once)/i,
    neg: /multipoint: no|no multipoint|one device at a time|doesn'?t support multipoint/i },
  { id: "anc", label: "Active noise cancellation",
    pos: /active noise cancell?(?:ation|ing)|\banc\b|noise[- ]cancell?ing/i,
    neg: /no (?:anc|active noise|noise cancell?ing)|anc: no|noise cancell?ation: no/i },
  { id: "wireless_charge", label: "Wireless charging case",
    pos: /wireless(?:ly)? charg|qi[- ]charg|qi[- ]compatible/i,
    neg: /wireless charging: no|no wireless charging|usb-c charging only|doesn'?t (?:support )?charge wirelessly/i },
  { id: "decaf", label: "Decaffeinated",
    pos: /\bdecaf(?:feinated)?\b(?! ?:)/i,
    neg: /not decaf|regular caffeine|fully caffeinated|caffeine: regular|caffeinated\b/i },
  { id: "fairtrade", label: "Fair Trade certified",
    pos: /fair[- ]trade/i, neg: /not fair[- ]trade/i },
  { id: "lid", label: "Lid included",
    pos: /(?:comes with|includes|included)[^.]{0,20}\blid\b|\blid (?:is )?included/i,
    neg: /lid (?:is )?(?:sold separately|not included)|no lid|without a lid/i },
  { id: "usbc", label: "USB-C charging",
    pos: /usb-?c/i, neg: /no usb-?c|not usb-?c/i },
  { id: "superauto", label: "Fine for super-automatic espresso machines",
    pos: /(?:works?|great|fine|perfect|good)[^.]{0,40}super-?automatic|super-?automatic[^.]{0,30}(?:works?|great|fine|no problem)|all espresso machines/i,
    neg: /not recommended for super-?automatic|avoid (?:using in )?super-?automatic|super-?automatic: no/i },
];

// Categorical attributes: value from a fixed set.
const CATEGORIES = [
  { id: "roast", label: "Roast level", re: /\b(light|medium|dark)(?:-| )roast|roast(?: level)?: (light|medium|dark)/i },
  { id: "acidity", label: "Acidity", re: /\b(low|bright|high|mild)(?:-| )acid(?:ity|ic)?|acidity: (low|bright|high|mild)/i,
    norm: v => (v === "bright" ? "high" : v === "mild" ? "low" : v) },
];

// Numeric attributes with units.
const NUMERIC = [
  { id: "battery_case", label: "Battery life with case", unit: "hours",
    re: /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b[^.]{0,30}(?:with (?:the )?(?:charging )?case|total)|(?:with (?:the )?(?:charging )?case|total(?: playtime)?)[^.\d]{0,30}(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i },
  { id: "battery_single", label: "Battery life per charge", unit: "hours",
    re: /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i, context: /battery|charge|playtime|listening|last/i, evSkip: /case|total/i },
  { id: "oven", label: "Oven-safe temperature", unit: "°F", re: /(\d{3})\s*°?\s*F\b/i, context: /oven/i },
  { id: "ip", label: "Water-resistance rating", unit: "", re: /\b(IP[X\d]\d)\b/i, str: true },
  { id: "weight_lb", label: "Weight", unit: "lb", re: /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/i },
  { id: "size_in", label: "Size", unit: "inch", re: /(\d+(?:\.\d+)?)\s*(?:-?inch|in\.|")/i },
];

// Review aspects: does the product HAVE this quality, per reviews?
const ASPECTS = [
  { id: "bitter", label: "bitterness", has: "tastes bitter", lacks: "isn't bitter", present: /\bbitter(?:ness)?\b/i,
    absent: new RegExp(NEG + "\\s+(?:\\w+\\s+){0,2}bitter(?:ness)?|zero bitterness|smooth,? not bitter", "i") },
  { id: "smooth", label: "smoothness", has: "tastes smooth", lacks: "isn't smooth", present: /\bsmooth\b/i, absent: new RegExp(NEG + "\\s+(?:\\w+\\s+){0,1}smooth", "i") },
  { id: "chocolate", label: "chocolate notes", has: "has chocolate notes", lacks: "lacks chocolate notes", present: /chocolat|cocoa/i, absent: new RegExp(NEG + "\\s+(?:\\w+\\s+){0,2}(?:chocolat|cocoa)", "i") },
  { id: "stale", label: "staleness", has: "arrives stale", lacks: "arrives fresh", present: /\bstale\b/i, absent: new RegExp(NEG + "\\s+(?:\\w+\\s+){0,1}stale", "i") },
  { id: "muffled", label: "call quality", has: "calls sound muffled", lacks: "calls sound clear", present: /muffled|can'?t hear me|mic (?:is )?(?:bad|poor|weak)/i, absent: /calls? (?:are|sound) (?:clear|crisp)|clear calls/i },
  { id: "fallout", label: "fit", has: "they fall out", lacks: "they stay put", present: /fall(?:s|ing)? out|loose fit/i, absent: /(?:never|doesn'?t|don'?t|won'?t) fall out|stay(?:s)? (?:put|in)|secure fit/i },
  { id: "comfort", label: "comfort", has: "they're comfortable", lacks: "they're uncomfortable", present: /comfortable|comfy/i, absent: /uncomfortable|not comfortable|hurt(?:s)? (?:my )?ears/i },
  { id: "sticks", label: "nonstick performance", has: "food sticks", lacks: "nothing sticks", present: /\bsticks?\b|sticking/i,
    absent: /(?:nothing|never|doesn'?t|don'?t|no)\s+(?:\w+\s+){0,1}stick|slides? (?:right )?(?:off|out)|zero sticking/i },
  { id: "warp", label: "warping", has: "it warps", lacks: "it doesn't warp", present: /warp/i, absent: new RegExp(NEG + "\\s+(?:\\w+\\s+){0,1}warp", "i") },
  { id: "hothandle", label: "handle heat", has: "the handle gets hot", lacks: "the handle stays cool", present: /handle (?:gets|got|is) (?:very |really )?hot/i, absent: /handle stays cool|cool[- ]touch handle/i },
];

const REVIEW_CLAIM = /\b(?:reviewers?|customers?|buyers?|shoppers?|people|users|reviews|fans|owners)\b[^.]{0,40}\b(?:say|says|mention|mentions|love|loves|praise|praises|appreciate|appreciates|note|notes|report|reports|highlight|highlights|rave|enjoy|enjoys|agree|describe|complain|complains)\b/i;

function splitSentences(text) {
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].split(" ").length <= 2 && i + 1 < parts.length) { parts[i + 1] = parts[i] + " " + parts[i + 1]; continue; }
    out.push(parts[i]);
  }
  return out;
}

function polarity(f, text) {
  if (f.neg.test(text)) return false;
  if (f.pos.test(text)) return true;
  return null;
}

function findLine(lines, re) {
  for (const l of lines) if (re.test(l.text)) return l;
  return null;
}

function numFrom(m) { for (let i = 1; i < m.length; i++) if (m[i] != null) return m[i]; return null; }

function checkSentence(sentence, ev) {
  const checks = [];

  // 1. Boolean features
  for (const f of FEATURES) {
    const cp = polarity(f, sentence);
    if (cp === null) continue;
    let evLine = null, ep = null;
    for (const l of ev.facts) { const p = polarity(f, l.text); if (p !== null) { evLine = l; ep = p; break; } }
    let revLine = null;
    if (ep === null) { // try reviews
      for (const r of ev.reviews) { const p = polarity(f, r.text); if (p !== null && p !== cp) { revLine = r; ep = p; break; } }
    }
    const m = (cp ? f.pos : f.neg).exec(sentence);
    const status = ep === null ? "missing" : ep === cp ? "supported" : "contradicted";
    checks.push({ kind: "feature", label: f.label, span: m ? m[0] : "", status,
      claimSays: cp ? "Yes" : "No", evidenceSays: ep === null ? "Not stated" : ep ? "Yes" : "No",
      evidence: evLine || revLine ? [evLine || revLine] : [] });
  }

  // 2. Categorical
  for (const c of CATEGORIES) {
    const m = c.re.exec(sentence); if (!m) continue;
    const norm = c.norm || (v => v);
    const cv = norm(numFrom(m).toLowerCase());
    let evLine = null, evv = null;
    for (const l of ev.facts) { const em = c.re.exec(l.text); if (em) { evLine = l; evv = norm(numFrom(em).toLowerCase()); break; } }
    checks.push({ kind: "category", label: c.label, span: m[0], status: evv == null ? "missing" : evv === cv ? "supported" : "contradicted",
      claimSays: cv, evidenceSays: evv == null ? "Not stated" : evv, evidence: evLine ? [evLine] : [] });
  }

  // 3. Numeric
  const usedSpans = [];
  for (const n of NUMERIC) {
    const m = n.re.exec(sentence); if (!m) continue;
    if (n.context && !n.context.test(sentence)) continue;
    if (usedSpans.some(s => s.includes(m[0]) || m[0].includes(s))) continue;
    const raw = numFrom(m); if (raw == null) continue;
    usedSpans.push(m[0]);
    let evLine = null, evv = null;
    for (const l of ev.facts) {
      if (n.context && !n.context.test(l.text)) continue;
      if (n.evSkip && n.evSkip.test(l.text)) continue;
      const em = n.re.exec(l.text); if (em && numFrom(em) != null) { evLine = l; evv = numFrom(em); break; }
    }
    let status = "missing";
    if (evv != null) {
      status = n.str ? (evv.toUpperCase() === raw.toUpperCase() ? "supported" : "contradicted")
        : (Math.abs(parseFloat(evv) - parseFloat(raw)) <= 0.05 * Math.max(1, parseFloat(evv)) ? "supported" : "contradicted");
    }
    checks.push({ kind: "number", label: n.label, span: m[0], status,
      claimSays: raw + (n.unit ? " " + n.unit : ""), evidenceSays: evv == null ? "Not stated" : evv + (n.unit ? " " + n.unit : ""),
      evidence: evLine ? [evLine] : [] });
  }

  // 4. Claims about what reviews say
  if (REVIEW_CLAIM.test(sentence)) {
    for (const a of ASPECTS) {
      if (!a.present.test(sentence) && !a.absent.test(sentence)) continue;
      const claimPresent = !a.absent.test(sentence);
      const pres = [], abs = [];
      for (const r of ev.reviews) {
        if (a.absent.test(r.text)) abs.push(r);
        else if (a.present.test(r.text)) pres.push(r);
      }
      const agree = claimPresent ? pres : abs, disagree = claimPresent ? abs : pres;
      const total = pres.length + abs.length;
      let status;
      if (total === 0) status = "missing";
      else if (agree.length === 0) status = "contradicted";
      else if (disagree.length === 0 || agree.length >= 2 * disagree.length) status = "supported";
      else if (disagree.length >= 2 * agree.length) status = "contradicted";
      else status = "mixed";
      const m = (claimPresent ? a.present : a.absent).exec(sentence);
      checks.push({ kind: "review", label: "Reviews on " + a.label, span: m ? m[0] : "",
        status, claimSays: "Reviewers say " + (claimPresent ? a.has : a.lacks),
        evidenceSays: total === 0 ? `0 of ${ev.reviews.length} reviews mention ${a.label}` :
          `${pres.length} of ${ev.reviews.length} say ${a.has}; ${abs.length} say ${a.lacks}`,
        evidence: [...disagree.slice(0, 2), ...agree.slice(0, 1)] });
    }
  }
  return checks;
}

const RANK = { contradicted: 0, mixed: 1, missing: 2, supported: 3 };

function checkAnswer(answer, ev) {
  const sentences = splitSentences(answer).map(text => {
    const checks = checkSentence(text, ev);
    const status = checks.length ? checks.reduce((w, c) => (RANK[c.status] < RANK[w] ? c.status : w), "supported") : "unchecked";
    return { text, checks, status };
  });
  return sentences;
}

function buildEvidence(listing, specs, reviews) {
  const facts = [];
  listing.split("\n").map(s => s.trim()).filter(Boolean).forEach(t => facts.push({ src: "Listing", text: t.replace(/^[-•*]\s*/, "") }));
  specs.split("\n").map(s => s.trim()).filter(Boolean).forEach(t => facts.push({ src: "Specs", text: t }));
  const revs = reviews.map((r, i) => (typeof r === "string" ? { stars: null, text: r } : r))
    .map((r, i) => ({ src: "Review", stars: r.stars, text: r.text, idx: i + 1 }));
  return { facts, reviews: revs };
}

function audit(product) {
  const ev = buildEvidence(product.listing, product.specs, product.reviews);
  const qa = product.qa.map(q => ({ q: q.q, a: q.a, sentences: checkAnswer(q.a, ev) }));
  const all = qa.flatMap(x => x.sentences.flatMap(s => s.checks));
  const count = s => all.filter(c => c.status === s).length;
  return { ev, qa, checks: all, n: all.length, supported: count("supported"), contradicted: count("contradicted"),
    mixed: count("mixed"), missing: count("missing") };
}

if (typeof module !== "undefined") module.exports = { audit, checkSentence, buildEvidence, splitSentences };
