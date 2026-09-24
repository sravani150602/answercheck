(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const LABEL = { contradicted: "Contradicted", mixed: "Mixed", missing: "Not on the page", supported: "Supported" };
  let current = null, result = null;

  function stars(n) { return n ? "★".repeat(n) + "☆".repeat(5 - n) : ""; }

  function render() {
    result = audit(current);
    result.ev.facts.forEach((f, i) => (f.id = "f" + i));
    result.ev.reviews.forEach((r, i) => (r.id = "r" + i));

    // evidence panel
    $("pdpTitle").textContent = current.title;
    $("pdpCat").textContent = current.category || "";
    $("evListing").innerHTML = result.ev.facts.filter(f => f.src === "Listing").map(f => `<li data-ev="${f.id}">${esc(f.text)}</li>`).join("") || '<li class="note">No listing text</li>';
    $("evSpecs").innerHTML = result.ev.facts.filter(f => f.src === "Specs").map(f => {
      const i = f.text.indexOf(":");
      return i > 0 ? `<li data-ev="${f.id}"><span>${esc(f.text.slice(0, i))}</span><span>${esc(f.text.slice(i + 1).trim())}</span></li>` : `<li data-ev="${f.id}"><span>${esc(f.text)}</span></li>`;
    }).join("") || '<li class="note">No specs</li>';
    $("revHead").textContent = `Reviews (${result.ev.reviews.length})`;
    $("evReviews").innerHTML = result.ev.reviews.map(r => `<li data-ev="${r.id}">${r.stars ? `<span class="stars" aria-label="${r.stars} of 5 stars">${stars(r.stars)}</span>` : ""}${esc(r.text)}</li>`).join("") || '<li class="note">No reviews</li>';

    // summary
    const pctSup = result.n ? Math.round(result.supported / result.n * 100) : 0;
    $("summary").innerHTML =
      stat(result.n, "claims checked across " + result.qa.length + " answers", "") +
      stat(result.contradicted, "contradicted by the product's own page", "bad") +
      stat(result.missing + result.mixed, "not on the page, or reviews split", "miss") +
      stat(pctSup + "%", "of claims backed by evidence", "good");

    // Q&A cards
    $("qa").innerHTML = result.qa.map(item => {
      const answer = item.sentences.map(s => `<span class="s ${s.status}">${esc(s.text)}</span>`).join(" ");
      const checks = item.sentences.flatMap(s => s.checks).sort((a, b) => ({ contradicted: 0, mixed: 1, missing: 2, supported: 3 }[a.status] - { contradicted: 0, mixed: 1, missing: 2, supported: 3 }[b.status]));
      return `<article class="card">
        <div class="q">${esc(item.q)}</div>
        <div class="answer"><span class="eyebrow">AI assistant answer · simulated</span><p>${answer}</p></div>
        <ul class="checks">${checks.map(c => `
          <li class="check" tabindex="0" data-evs="${c.evidence.map(e => e.id).join(" ")}">
            <span class="pill ${c.status}">${LABEL[c.status]}</span>
            <span class="body">
            <span class="lbl">${esc(c.label)}</span>
            <span class="cmp"><span>AI said: <b>${esc(c.claimSays)}</b></span><span>Evidence: <b>${esc(c.evidenceSays)}</b></span></span>
            ${c.evidence.slice(0, 2).map(e => `<span class="quote"><span class="src">${e.src}${e.stars ? " " + e.stars + "★" : ""}</span>${esc(e.text)}</span>`).join("") ||
              (c.status === "missing" ? '<span class="quote"><span class="src">Gap</span>Nothing on the listing, specs or reviews backs this. Either the AI guessed, or the page is missing it.</span>' : "")}
            </span>
          </li>`).join("") || '<li class="note">No checkable claims found in this answer.</li>'}
        </ul></article>`;
    }).join("");

    $("caseText").textContent = buildCase();
    $("copyMsg").textContent = "";
  }

  function stat(v, l, cls) { return `<div class="stat"><span class="num ${cls}">${v}</span><span class="lbl">${l}</span></div>`; }

  function buildCase() {
    const bad = [], gaps = [];
    for (const item of result.qa) for (const s of item.sentences) {
      const wrong = s.checks.filter(c => c.status === "contradicted" || c.status === "mixed");
      if (wrong.length) bad.push({ item, s, cs: wrong });
      else if (s.checks.some(c => c.status === "missing")) gaps.push({ item, s });
    }
    const L = [];
    L.push("Subject: AI shopping assistant gives incorrect answers about my product");
    L.push("");
    L.push("Product: " + current.title);
    L.push(`Checked: ${result.n} claims in ${result.qa.length} assistant answers. ${result.contradicted} contradict the product page.`);
    if (bad.length) {
      L.push("");
      L.push("Answers that contradict the listing, specs or reviews:");
      bad.forEach(({ item, s, cs }, i) => {
        L.push(`${i + 1}. Shopper question: "${item.q}"`);
        L.push(`   Assistant said: "${s.text}"`);
        cs.forEach(c => L.push(`   ${c.label}: page says ${c.evidenceSays}` + (c.evidence[0] ? ` ("${c.evidence[0].text}", ${c.evidence[0].src.toLowerCase()})` : "")));
      });
    }
    if (gaps.length) {
      L.push("");
      L.push("Claims with no support on the page (I will add this information to the listing if true):");
      gaps.forEach(({ item, s }, i) => L.push(`${i + 1}. "${s.text}" (asked: "${item.q}")`));
    }
    L.push("");
    L.push("Request: please correct these answers, or have the assistant cite the listing when it answers these questions.");
    return L.join("\n");
  }

  // light up evidence on hover/focus
  function light(ids) {
    document.querySelectorAll(".ev-list li.lit").forEach(li => li.classList.remove("lit"));
    ids.forEach(id => { const li = document.querySelector(`[data-ev="${id}"]`); if (li) li.classList.add("lit"); });
  }
  $("qa").addEventListener("mouseover", e => { const c = e.target.closest(".check"); if (c) light(c.dataset.evs.split(" ").filter(Boolean)); });
  $("qa").addEventListener("focusin", e => { const c = e.target.closest(".check"); if (c) light(c.dataset.evs.split(" ").filter(Boolean)); });
  $("qa").addEventListener("mouseleave", () => light([]));

  $("copyCase").addEventListener("click", () => {
    const text = $("caseText").textContent;
    const done = ok => { $("copyMsg").textContent = ok ? "Copied" : "Select the text above and copy it"; };
    try {
      navigator.clipboard.writeText(text).then(() => done(true), () => { selectCase(); done(false); });
    } catch (err) { selectCase(); done(false); }
  });
  function selectCase() { const r = document.createRange(); r.selectNodeContents($("caseText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  // picker
  $("sampleBtns").innerHTML = PRODUCTS.map(p => `<button class="chip-btn" type="button" data-id="${p.id}" aria-pressed="false">${esc(p.short)}</button>`).join("");
  $("btnOwn").dataset.id = "own";
  function setPressed(id) { document.querySelectorAll(".chip-btn").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false")); }
  function load(id) { current = PRODUCTS.find(p => p.id === id); setPressed(id); $("editor").hidden = true; render(); }

  document.querySelector(".picker").addEventListener("click", e => {
    const b = e.target.closest(".chip-btn"); if (!b) return;
    if (b.dataset.id !== "own") return load(b.dataset.id);
    setPressed("own");
    $("editor").hidden = false;
    $("inListing").value = current.title + "\n" + current.listing;
    $("inSpecs").value = current.specs;
    $("inReviews").value = current.reviews.map(r => (typeof r === "string" ? r : (r.stars ? r.stars + " | " : "") + r.text)).join("\n");
    $("inQA").value = current.qa.map(x => "Q: " + x.q + "\nA: " + x.a).join("\n\n");
    $("inListing").focus();
  });

  $("editor").addEventListener("submit", e => {
    e.preventDefault();
    const lines = $("inListing").value.split("\n").map(s => s.trim()).filter(Boolean);
    const reviews = $("inReviews").value.split("\n").map(s => s.trim()).filter(Boolean).map(l => {
      const m = l.match(/^([1-5])\s*(?:★|stars?)?\s*\|\s*(.+)$/i);
      return m ? { stars: +m[1], text: m[2] } : { stars: null, text: l };
    });
    const qa = []; let cur = null;
    $("inQA").value.split("\n").forEach(raw => {
      const l = raw.trim(); if (!l) return;
      if (/^q:/i.test(l)) { cur = { q: l.slice(2).trim(), a: "" }; qa.push(cur); }
      else if (/^a:/i.test(l)) { if (!cur) { cur = { q: "(question not given)", a: "" }; qa.push(cur); } cur.a += (cur.a ? " " : "") + l.slice(2).trim(); }
      else if (cur) cur.a += (cur.a ? " " : "") + l;
    });
    const valid = qa.filter(x => x.a);
    if (!lines.length || !valid.length) {
      $("editorMsg").textContent = "Add a listing and at least one answer, starting its line with “A:”.";
      return;
    }
    $("editorMsg").textContent = "Runs in your browser. Nothing you paste is sent anywhere.";
    current = { id: "own", title: lines[0], category: "Your product", listing: lines.slice(1).join("\n"), specs: $("inSpecs").value, reviews, qa: valid };
    render();
  });

  load("coffee");
})();
