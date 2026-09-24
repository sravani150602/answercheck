# AnswerCheck

**When an AI tells a shopper something about a product, is it true?**

AnswerCheck is a browser prototype. Paste a product listing, specs, reviews and AI shopping answers, and it checks recognizable claims against the supplied product information. It highlights possible contradictions with supporting excerpts and drafts a report for a person to review.

**Try it live → https://sravani150602.github.io/answercheck/**

![AnswerCheck overview](docs/screenshots/overview.jpg)

---

## The customer problem

A shopper asks, *"Can this pan go in the oven?"* The assistant answers, *"Yes, it's oven safe up to 500°F."* The listing says 400°F. That mismatch could lead the shopper to use the pan above its stated limit. This is an illustrative scenario, not a measured return.

This matters because shoppers now ask before they read. Amazon says more than 300 million customers used Rufus in 2025. On May 13, 2026, it became **Alexa for Shopping**, which is available to signed-in US customers. The listing can be accurate while the answer isn't. A coffee seller found the assistant listing "bitterness" as a positive attribute of their coffee, though bitterness was hardly ever mentioned in their reviews. It took a forum post and a moderator to escalate it.

Today a seller finds mistakes like that by asking the assistant questions one at a time, spotting a wrong answer by chance, and filing a thumbs-down and a Seller Support case. Seller guides say there is no dedicated dashboard yet that shows what the assistant says about a product. That is manual and reactive, and it doesn't scale to a catalog.

## What AnswerCheck does

The prototype checks claims it recognizes, such as features, categories, numbers and descriptions of reviews. It gives those claims a label:

| Label | Meaning |
|---|---|
| **Contradicted** | The listing, specs or reviews say otherwise |
| **Mixed** | Reviews are split |
| **Not on the page** | Nothing on the page backs it. Either the AI guessed, or the listing is missing something |
| **Supported** | The evidence matches |

**A wrong number, caught with its evidence:**

![Contradicted oven temperature](docs/screenshots/skillet-oven.jpg)

**One answer, three wrong facts:** it says reviews praise the bitterness when they say it isn't bitter, calls it a medium roast when it's dark, and says bright acidity when the listing says low.

![Claim checks for a coffee answer](docs/screenshots/claim-checks.jpg)

**A draft for the seller to review,** with flagged statements and evidence:

![Auto-drafted seller report](docs/screenshots/seller-report.jpg)

On the live page, you can hover over any check to highlight the listing line, spec or review it used. You can also pick **Check your own** and paste in a real product's page and the assistant's answers.

## Why it matters

- **Shoppers:** a future version could make product answers easier to verify.
- **Sellers:** paste answers they have collected to inspect possible mismatches in one view.
- **Amazon:** a real pilot could test whether correcting mismatches improves answer accuracy or reduces returns.

## How it works

The checks run in the browser, without an API key or a backend receiving pasted data. `js/engine.js` runs four kinds of checks on each sentence of an answer:

| Check | Example | How it decides |
|---|---|---|
| Yes/no features | "dishwasher safe", "works on induction", "waterproof" | Compares the answer with the listing and specs, and understands negations like "Hand wash recommended" or `Induction: No` |
| Categories | "medium roast", "bright acidity" | The value must match the value on the page |
| Numbers with units | "10 hours per charge", "500°F", "IPX7" | Compares numbers within a 5% tolerance |
| Claims about reviews | "reviewers say nothing sticks" | Counts reviews that say the product has the quality against reviews that say it doesn't |

**How it would work at Amazon's scale:**

1. Sample the questions customers actually ask about each product.
2. Split answers into claims with a language model.
3. Check each claim against retrieved evidence with an entailment model, tuned on human-labeled examples so "contradicted" really means contradicted.
4. Show sellers a per-product accuracy view with one-click reporting.
5. Feed contradictions back to the assistant, so it cites the page or says "the listing doesn't say" instead of guessing.

## What I don't know yet

- The demo uses **fictional products and simulated answers**. It does not fetch Alexa for Shopping answers or measure how often real answers are wrong.
- Amazon very likely measures answer quality internally. AnswerCheck's contribution is giving **sellers** that view, with the evidence attached.
- The prototype's rules cover selected product facts. Some statements will have no checkable claims, and every flag needs human review. A production version would need broader coverage and validation.

The next step I'd take: run this on 100 real products across 5 categories, measure the contradiction rate, and bring the numbers.

## Run it locally

```bash
git clone https://github.com/sravani150602/answercheck.git
cd answercheck
python3 -m http.server 8000     # open http://localhost:8000
npm test                        # 7 engine tests (Node 18+)
```

```
index.html          the page
css/style.css       styles (light and dark, responsive)
js/engine.js        claim extraction and checking
js/data.js          three fictional example products
js/app.js           UI: rendering, evidence highlighting, report, paste mode
tests/              engine tests (node:test)
docs/screenshots/   images in this README
```

## Sources

- [Amazon: Alexa for Shopping and Rufus usage (2026)](https://www.aboutamazon.com/news/retail/alexa-for-shopping-ai-assistant)
- [Canopy Management: Alexa for Shopping seller guide (2026)](https://canopymanagement.com/amazon-alexa-for-shopping-sellers-guide/)
- [Amazon Seller Forums: the "bitterness" case](https://sellercentral.amazon.com/seller-forums/discussions/t/7b947c81-e7ee-43dc-a024-a84e83458baa)
- [Amazon Seller Forums: reporting wrong answers with thumbs-down and Seller Support](https://sellercentral.amazon.com/seller-forums/discussions/t/38a7533e-d7d7-464c-9680-0e8e3f2a37a8)
- [Perpetua: no dedicated seller dashboard for Alexa for Shopping (2026)](https://perpetua.io/blog-alexa-for-shopping-amazon-rufus-the-complete-guide-for-brands-and-sellers/)
- [TheStreet / YouGov: consumer trust in AI shopping assistants](https://www.thestreet.com/personal-finance/amazons-rufus-other-ai-shopping-assistants-face-consumers-concerns)

*This is an independent project, **not affiliated with Amazon**. I built it with AI assistance, and I can walk through every decision in it.*

---



MIT License · © 2026 Sravani Elavarthi
