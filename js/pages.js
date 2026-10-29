/* Page renderers. Each page sets <body data-page="..."> and gets the matching function below. */
(function () {
  const S = window.SITE, D = window.DIRS, { $, esc, safeUrl, initials, svg } = window.U;
  const KEYS = Object.keys(D);
  const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? { day: "", mon: "", full: d || "" } : { day: t.getDate(), mon: t.toLocaleString("en-IN", { month: "short" }), full: t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }; };
  const param = (k) => new URLSearchParams(location.search).get(k) || "";
  const hay = (r) => Object.values(r).join(" ").toLowerCase();

  /* ---------- shared bits ---------- */
  /* Picture for a row: a logo/photo link from the sheet if there is one, otherwise the website's own icon (favicon), otherwise initials. */
  const imgOf = (r) => {
    const keys = ["logo_url", "photo_url", "logo", "image_url", "image", "avatar", "img"]
      .concat(Object.keys(r).filter((k) => /(^|_)(image|photo|picture|avatar|logo|pic|img)(_|$)/.test(k)));
    for (const k of keys) { const u = U.img(r[k]); if (u) return { u, person: /photo|picture|avatar|pic/.test(k) }; }
    const f = U.favicon(r.website || r.apply_url);
    return f ? { u: f, fav: true } : null;
  };
  const avatar = (r, color) => {
    const i = imgOf(r), ini = esc(initials(r.name || r.title || "?"));
    if (!i) return `<span class="av" style="--c:${color}">${ini}</span>`;
    return `<span class="av${i.person ? " ph" : ""}" style="--c:${color}"><img src="${esc(i.u)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-i="${ini}"${i.fav ? ' data-fav="1"' : ""} onerror="U.avFail(this)" onload="U.avLoad(this)"></span>`;
  };

  /* What each directory shows. Field names are the cleaned column headers from your sheet (see js/data.js). */
  const SPEC = {
    startups: {
      chips: [["sector", 2], ["stage", 1], ["location", 1]], foot: [["funding"], ["founded", "Founded "]],
      filters: [["sector", "All sectors"], ["location", "All cities"], ["stage", "All stages"]],
      compare: [["About", "description"], ["Competitive edge", "competitive_edge"], ["Business model", "business_model"], ["Headquarters", "location"], ["Founded", "founded"], ["Funding", "funding"],
        ["Stage", "stage", "chips"], ["Team size", "team_size"], ["Users / customers", "user_base"], ["Sector", "sector", "chips"], ["Underlying technology", "tech", "chips"],
        ["Key investors", "investors", "chips"], ["Primary competition", "competitors", "chips"], ["Founders", "*founders"], ["Status", "status"], ["Website", "website", "link"]]
    },
    angels: {
      chips: [["sector", 2], ["stage", 1], ["location", 1]], foot: [["cheque_size", "Cheque "]],
      filters: [["sector", "All sectors"], ["location", "All cities"], ["stage", "All stages"]],
      modal: { facts: [["Cheque size", "cheque_size"], ["Headquarters", "location"], ["Status", "status"]], text: [["About", "description"]],
        chips: [["Type", "type"], ["Sector focus", "sector"], ["Stage focus", "stage"], ["Notable investments", "portfolio"], ["Tags", "tags"]] },
      compare: [["About", "description"], ["Type", "type"], ["Headquarters", "location"], ["Cheque size", "cheque_size"], ["Sector focus", "sector", "chips"], ["Stage focus", "stage", "chips"],
        ["Notable investments", "portfolio", "chips"], ["Status", "status"], ["LinkedIn", "linkedin", "link"]]
    },
    vcs: {
      chips: [["sector", 2], ["stage", 1], ["location", 1]], foot: [["fund_size", "Fund "], ["cheque_size", "Cheque "]],
      filters: [["sector", "All sectors"], ["location", "All cities"], ["stage", "All stages"]],
      modal: { facts: [["Fund size", "fund_size"], ["Cheque size", "cheque_size"], ["Headquarters", "location"], ["Status", "status"]], text: [["About", "description"]],
        chips: [["Type", "type"], ["Sector focus", "sector"], ["Stage focus", "stage"], ["Notable portfolio", "portfolio"], ["Tags", "tags"]] },
      compare: [["About", "description"], ["Type", "type"], ["Fund size", "fund_size"], ["Cheque size", "cheque_size"], ["Headquarters", "location"], ["Sector focus", "sector", "chips"],
        ["Stage focus", "stage", "chips"], ["Notable portfolio", "portfolio", "chips"], ["Status", "status"], ["Website", "website", "link"]]
    },
    incubators: {
      chips: [["sector", 2], ["stage", 1], ["location", 1]], foot: [["programme_duration"], ["equity_taken", "Equity "]],
      filters: [["sector", "All sectors"], ["location", "All cities"], ["stage", "All stages"]],
      modal: { facts: [["Parent institution", "parent_institution"], ["Programme duration", "programme_duration"], ["Equity taken", "equity_taken"], ["Headquarters", "location"], ["Status", "status"]],
        text: [["About", "description"], ["Funding support", "funding_support"]], chips: [["Type", "type"], ["Sector focus", "sector"], ["Stage focus", "stage"], ["Tags", "tags"]] },
      compare: [["About", "description"], ["Type", "type"], ["Parent institution", "parent_institution"], ["Programme duration", "programme_duration"], ["Equity taken", "equity_taken"], ["Funding support", "funding_support"],
        ["Headquarters", "location"], ["Sector focus", "sector", "chips"], ["Stage focus", "stage", "chips"], ["Status", "status"], ["Website", "website", "link"], ["Apply", "apply_url", "link"]]
    },
    govt: {
      chips: [["level", 1], ["sector", 1], ["location", 1]], foot: [["benefit_amount"]],
      filters: [["level", "All levels"], ["sector", "All sectors"], ["location", "All states"]],
      modal: { facts: [["Ministry or department", "ministry"], ["State", "location"], ["Benefit amount", "benefit_amount"], ["Status", "status"]],
        text: [["About", "description"], ["Eligibility", "eligibility"], ["How to apply", "how_to_apply"]], chips: [["Level", "level"], ["Benefit type", "benefit_type"], ["Sector focus", "sector"], ["Stage focus", "stage"], ["Tags", "tags"]] },
      compare: [["About", "description"], ["Level", "level"], ["Ministry or department", "ministry"], ["State", "location"], ["Benefit type", "benefit_type"], ["Benefit amount", "benefit_amount"],
        ["Eligibility", "eligibility"], ["How to apply", "how_to_apply"], ["Sector focus", "sector", "chips"], ["Stage focus", "stage", "chips"], ["Status", "status"], ["Apply", "apply_url", "link"], ["Website", "website", "link"]]
    },
    banks: {
      chips: [["type", 1], ["loan_type", 1], ["location", 1]], foot: [["loan_range"], ["interest_rate_range"]],
      filters: [["type", "All types"], ["loan_type", "All loan types"], ["location", "All cities"]],
      modal: { facts: [["Product", "product_name"], ["Loan range", "loan_range"], ["Interest rate range", "interest_rate_range"], ["Collateral required", "collateral_required"], ["Headquarters", "location"], ["Status", "status"]],
        text: [["About", "description"], ["Eligibility", "eligibility"]], chips: [["Type", "type"], ["Loan type", "loan_type"], ["Tags", "tags"]] },
      compare: [["About", "description"], ["Type", "type"], ["Product", "product_name"], ["Loan type", "loan_type"], ["Loan range", "loan_range"], ["Interest rate range", "interest_rate_range"],
        ["Collateral required", "collateral_required"], ["Eligibility", "eligibility"], ["Headquarters", "location"], ["Status", "status"], ["Apply", "apply_url", "link"], ["Website", "website", "link"]]
    }
  };

  /* A clickable chip that lists every item sharing this value (e.g. all startups funded by one investor) */
  const facetChip = (type, field, value, cls = "") =>
    `<a class="chip facet ${cls}" href="${esc(Data.facetUrl(type, field, value))}" title="See all ${esc(D[type].label)} with ${esc(Data.FACETS[field] || field)}: ${esc(value)}">${esc(value)}</a>`;

  const badStatus = (r) => /closed|inactive|shut|failed|defunct|acquired|dormant|expired|discontinued|wound/i.test(r.status || "");

  const compareBox = (r, type) => (window.Compare
    ? `<label class="cmp" title="Add to compare (max ${Compare.MAX})"><input type="checkbox" data-cmp="${esc(r.name)}" data-type="${type}"${Compare.has(r.name, type) ? " checked" : ""}> Compare</label>` : "");

  function card(r, type) {
    const c = D[type].color, sp = SPEC[type];
    const isNew = Data.daysAgo(r.added_on) <= 30;
    const chips = sp.chips.map(([f, n]) => Data.facetValues(r, f).slice(0, n).map((v) => facetChip(type, f, v, f === "location" ? "plain" : "")).join("")).join("");
    const facts = sp.foot.map(([f, pre]) => (r[f] ? (pre || "") + r[f] : "")).filter(Boolean).join(" · ");
    const inactive = badStatus(r);
    return `<article class="card item click" tabindex="0" role="button" data-name="${esc(r.name)}" style="--c:${c}">
      ${isNew ? '<span class="new">New</span>' : ""}
      <div class="top">${avatar(r, c)}<div><h3>${esc(r.name)}</h3>${r.tagline ? `<div class="tag">${esc(r.tagline)}</div>` : ""}</div></div>
      ${r._derived || !r.description ? "" : `<p>${esc(r.description.slice(0, 120))}${r.description.length > 120 ? "…" : ""}</p>`}
      <div class="chips">${chips}${inactive ? `<span class="chip warn">${esc(r.status)}</span>` : ""}</div>
      <div class="foot"><span>${esc(facts)}</span>${compareBox(r, type)}</div>
    </article>`;
  }

  function ensureModal() {
    if ($("#modal")) return $("#modal");
    document.body.insertAdjacentHTML("beforeend", '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Details"><div class="sheet" id="sheet"></div></div>');
    const m = $("#modal");
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".x")) m.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") m.classList.remove("open"); });
    return m;
  }

  async function openModal(r, type) {
    const c = D[type].color, m = ensureModal(), isS = type === "startups";
    const web = U.link(r.website), li = U.link(r.linkedin), ap = U.link(r.apply_url);
    const text = (title, v) => (v ? `<div class="blk"><h4>${title}</h4><p>${esc(v)}</p></div>` : "");
    const facet = (title, field) => {
      const vals = Data.facetValues(r, field);
      return vals.length ? `<div class="blk"><h4>${title}</h4><div class="chips">${vals.map((v) => facetChip(type, field, v)).join("")}</div></div>` : "";
    };
    let body;
    if (isS) {
      const facts = [["Headquarters", r.location], ["Founded", r.founded], ["Funding", r.funding], ["Stage", r.stage], ["Team size", r.team_size], ["Users / customers", r.user_base], ["Status", r.status]]
        .filter((x) => x[1]).map((x) => `<dt>${x[0]}</dt><dd>${esc(x[1])}</dd>`).join("");
      body = `${text("About", r.description)}${text("Competitive edge", r.competitive_edge)}${text("Business model", r.business_model)}
        ${facts ? `<dl class="kv">${facts}</dl>` : ""}
        <div id="fx"></div>
        ${facet("Sector", "sector")}${facet("Underlying technology", "tech")}${facet("Key investors", "investors")}${facet("Primary competition", "competitors")}${facet("Tags", "tags")}`;
    } else {
      const M = SPEC[type].modal;
      const facts = M.facts.filter((x) => r[x[1]]).map((x) => `<dt>${x[0]}</dt><dd>${esc(r[x[1]])}</dd>`).join("");
      body = `${M.text.map((x) => text(x[0], r[x[1]])).join("")}${facts ? `<dl class="kv">${facts}</dl>` : ""}${M.chips.map((x) => facet(x[0], x[1])).join("")}`;
    }
    $("#sheet").innerHTML = `<button class="x" aria-label="Close">×</button>
      <div style="display:flex;gap:14px;align-items:center">${avatar(r, c)}<span class="chip" style="--c:${c}">${esc(D[type].single)}</span>${badStatus(r) ? `<span class="chip warn">${esc(r.status)}</span>` : ""}</div>
      <h2>${esc(r.name)}</h2>${r._derived ? "" : `<p class="tag" style="color:var(--muted)">${esc(r.tagline || "")}</p>`}
      ${body}
      <div class="actions">
        ${ap ? `<a class="btn btn-color" style="--c:${c}" href="${esc(ap)}" target="_blank" rel="noopener">Apply ${svg("ext")}</a>` : ""}
        ${web ? `<a class="btn ${ap ? "btn-ghost" : "btn-color"}" style="--c:${c}" href="${esc(web)}" target="_blank" rel="noopener">Visit website ${svg("ext")}</a>` : ""}
        ${li ? `<a class="btn btn-ghost" href="${esc(li)}" target="_blank" rel="noopener">${svg("linkedin")} LinkedIn</a>` : ""}
        ${["angels", "vcs", "incubators"].includes(type) ? `<a class="btn btn-ghost" href="${esc(Data.facetUrl("startups", "investors", r.name))}">Startups in our database backed by ${esc(r.name.length > 28 ? "them" : r.name)}</a>` : ""}
        ${window.Compare ? `<button class="btn btn-ghost" data-cmp-btn="${esc(r.name)}" data-cmp-type="${type}"></button>` : ""}
      </div>`;
    $("#sheet").style.setProperty("--c", c);
    m.classList.add("open");
    $(".x", m).focus();
    syncCompareBtn();

    if (isS) {                                   /* founders come from the Founders tab */
      const fx = $("#fx"), all = (await Data.load("founders")).rows;
      let list = Data.foundersOf(all, r.name);
      if (!fx || !m.classList.contains("open")) return;
      if (!list.length && r.founders) list = Data.split(r.founders).map((n) => ({ name: n }));
      if (list.length) fx.innerHTML = `<div class="blk"><h4>Founders</h4><div class="founders">${list.map((f) => {
        const l = U.link(f.linkedin);
        return `<div class="fcard">${avatar(f, c)}<div><a class="fname" href="${esc(Data.facetUrl("startups", "founders", f.name))}" title="See all startups by ${esc(f.name)}">${esc(f.name)}</a>${f.role ? `<small>${esc(f.role)}</small>` : ""}${f.bio ? `<p>${esc(f.bio)}</p>` : ""}${l ? `<a href="${esc(l)}" target="_blank" rel="noopener" class="link-arrow">${svg("linkedin")} LinkedIn</a>` : ""}</div></div>`;
      }).join("")}</div></div>`;
    }
  }

  function syncCompareBtn() {
    if (!window.Compare) return;
    document.querySelectorAll("[data-cmp-btn]").forEach((b) => {
      const on = Compare.has(b.dataset.cmpBtn, b.dataset.cmpType);
      b.textContent = on ? "Remove from compare" : "Add to compare";
    });
    document.querySelectorAll("input[data-cmp]").forEach((i) => { i.checked = Compare.has(i.dataset.cmp, i.dataset.type); });
  }

  function bindCards(root, getRows) {
    const go = (el) => { const [type, rows] = getRows(); const r = rows.find((x) => x.name === el.dataset.name); if (r) openModal(r, type); };
    root.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;                                   /* chips are links */
      const cb = e.target.closest("input[data-cmp]");
      if (cb) { e.stopPropagation(); Compare.toggle(cb.dataset.cmp, cb.dataset.type); syncCompareBtn(); return; }
      if (e.target.closest("label.cmp")) return;
      const el = e.target.closest(".item"); if (el) go(el);
    });
    root.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("item")) { e.preventDefault(); go(e.target); } });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmp-btn]"); if (b && window.Compare) { Compare.toggle(b.dataset.cmpBtn, b.dataset.cmpType); syncCompareBtn(); }
  });
  document.addEventListener("compare:change", syncCompareBtn);

  const count = (el, to) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || to < 20) { el.textContent = to.toLocaleString("en-IN"); return; }
    const t0 = performance.now(), dur = 1100;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString("en-IN"); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };

  const pageHero = (t, p) => `<div class="page-hero wrap"><h1 style="font-size:clamp(2.1rem,4.6vw,3.4rem)">${t}</h1>${p ? `<p class="lead">${p}</p>` : ""}</div>`;

  /* =============================== HOME =============================== */
  async function home() {
    const all = {};
    await Promise.all(KEYS.map(async (k) => (all[k] = (await Data.load(k)).rows)));

    /* stats */
    $("#stats").innerHTML = KEYS.map((k) => {
      const added = all[k].filter((r) => Data.daysAgo(r.added_on) <= 30).length;
      return `<a class="stat" href="directory.html?type=${k}" style="--c:${D[k].color};--on:${U.on(D[k].color)}"><b data-n="${all[k].length}">0</b><span>${esc(D[k].label)}</span>${added ? `<small>+${added} last month</small>` : "<small>&nbsp;</small>"}</a>`;
    }).join("");
    document.querySelectorAll("#stats b").forEach((b) => count(b, +b.dataset.n));

    /* search console */
    let cur = "startups";
    const tabs = $("#tabs"), box = $("#q"), res = $("#res"), sbox = $(".sbox");
    tabs.innerHTML = KEYS.map((k) => `<button class="tab" role="tab" aria-selected="${k === cur}" data-k="${k}" style="--c:${D[k].color};--on:${U.on(D[k].color)}"><i></i>${esc(D[k].label)}</button>`).join("");
    const paint = () => {
      const q = box.value.trim().toLowerCase();
      sbox.style.setProperty("--sc", D[cur].color);
      let rows = all[cur];
      if (q) rows = rows.filter((r) => hay(r).includes(q));
      const top = rows.slice(0, 6);
      res.innerHTML = top.length
        ? top.map((r) => `<a class="res" href="directory.html?type=${cur}&open=${encodeURIComponent(r.name)}">${avatar(r, D[cur].color)}<b>${esc(r.name)}</b><span class="sub">${esc([r.sector, r.location].filter(Boolean).join(" · "))}</span><span class="go">${svg("arrow")}</span></a>`).join("") +
          `<a class="link-arrow res" href="directory.html?type=${cur}&q=${encodeURIComponent(q)}">See all ${rows.length} in ${esc(D[cur].label)} ${svg("arrow")}</a>`
        : `<div class="empty">Nothing found for “${esc(q)}”. Try a sector or city.</div>`;
    };
    tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (!b) return; cur = b.dataset.k; tabs.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t === b)); paint(); });
    box.addEventListener("input", paint); paint();

    /* directories: one full-width flat colour band each */
    $("#products").innerHTML = KEYS.map((k) => `<a class="chapter" href="directory.html?type=${k}" style="--c:${D[k].color};--on:${U.on(D[k].color)}">
      <span class="big">${esc(D[k].label)}</span><p>${esc(D[k].blurb)}</p>
      <span class="go"><span>Explore ${all[k].length}</span>${svg("arrow")}</span></a>`).join("");

    /* featured startups */
    const feat = all.startups.filter((r) => /^(yes|y|true|1)$/i.test(r.featured || "")), pick = (feat.length ? feat : all.startups).slice(0, 6);
    $("#featured").innerHTML = pick.map((r) => card(r, "startups")).join("");
    bindCards($("#featured"), () => ["startups", all.startups]);

    /* blog */
    const blog = (await Data.load("blog")).rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4);
    $("#blog").innerHTML = blog.map(blogCard).join("");

    /* portfolio: every startup in the Startups tab (featured ones first), each tile opens that startup */
    const pf = [...all.startups].sort((a, b) => (/^(yes|y|true|1)$/i.test(b.featured || "") ? 1 : 0) - (/^(yes|y|true|1)$/i.test(a.featured || "") ? 1 : 0)).slice(0, 40);
    if (!pf.length) { $("#clients").closest("section").remove(); }
    else {
      const tile = (r, hide) => `<a class="pf-pill" href="directory.html?type=startups&open=${encodeURIComponent(r.name)}"${hide ? ' tabindex="-1" aria-hidden="true"' : ""} title="${esc(r.name)}">${avatar(r, D.startups.color)}<span>${esc(r.name)}</span></a>`;
      const reps = Math.max(2, Math.ceil(12 / pf.length) * 2);              /* enough copies to fill the loop */
      $("#clients").innerHTML = `<div class="track">${pf.map((r) => tile(r)).join("")}${Array.from({ length: reps - 1 }, () => pf.map((r) => tile(r, true)).join("")).join("")}</div>`;
    }

    newsletter();
  }

  const blogCard = (r) => {
    const d = fmtDate(r.date), u = U.link(r.url) || safeUrl(r.url) || "#", im = U.img(r.image), src = esc(r.source || r.tag || "Article");
    return `<a class="card blog" href="${esc(u)}" ${/^https?:/.test(u) ? 'target="_blank" rel="noopener"' : ""} style="--c:var(--violet)">
      <div class="bimg${im ? "" : " ph"}">${im ? `<img src="${esc(im)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-s="${src}" onerror="this.parentNode.classList.add('ph');this.parentNode.textContent=this.dataset.s">` : src}</div>
      ${r.tag ? `<span class="chip" style="align-self:flex-start">${esc(r.tag)}</span>` : ""}
      <h3>${esc(r.title)}</h3><p>${esc(r.summary || "")}</p>
      <small style="color:var(--muted);margin-top:auto">${esc([r.source, d.full].filter(Boolean).join(" · "))}</small></a>`;
  };

  function newsletter() {
    const f = $("#nl"); if (!f) return;
    if (!S.newsletter.action) { f.closest("[data-nl-wrap]")?.remove(); return; }
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#nl-msg"), body = new URLSearchParams(); body.set(S.newsletter.emailField, f.email.value);
      try { await fetch(S.newsletter.action, { method: "POST", mode: "no-cors", body }); msg.textContent = "Thanks, you're subscribed."; f.reset(); }
      catch { msg.textContent = "Could not subscribe right now. Please try again."; }
    });
  }

  /* =============================== DIRECTORY =============================== */
  async function directory() {
    let type = KEYS.includes(param("type")) ? param("type") : "startups";
    let facet = Data.FACETS[param("f")] && param("v") ? { f: param("f"), v: param("v") } : null;
    const openName = param("open");              /* read before the address bar is tidied */
    let rows = [], shown = 24;
    const PER = 24, grid = $("#grid"), meta = $("#meta");
    const f = { q: param("q"), s: ["", "", ""], sort: "az" }, SLOTS = ["#fsector", "#flocation", "#fstage"];

    const tabsEl = $("#tabs");
    tabsEl.innerHTML = KEYS.map((k) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${k === type}" style="--c:${D[k].color};--on:${U.on(D[k].color)}"><i></i>${esc(D[k].label)}</button>`).join("");

    const fill = (sel, vals, label) => { const s = $(sel); s.innerHTML = `<option value="">${label}</option>` + vals.map((v) => `<option>${esc(v)}</option>`).join(""); s.value = ""; };
    const uniq = (field) => [...new Map(rows.flatMap((r) => Data.facetValues(r, field)).map((v) => [Data.key(v), v])).values()].sort((a, b) => a.localeCompare(b));

    async function switchType(t, keepFacet) {
      type = t; shown = PER; if (!keepFacet) facet = null;
      document.documentElement.style.setProperty("--dir", D[t].color); document.documentElement.style.setProperty("--dir-on", U.on(D[t].color));
      tabsEl.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.k === t));
      $("#dtitle").textContent = D[t].label; $("#dblurb").textContent = D[t].blurb;
      grid.innerHTML = '<p class="empty">Loading…</p>';
      rows = (await Data.load(t)).rows;
      const fl = SPEC[t].filters;
      SLOTS.forEach((sel, i) => {                       /* each directory has its own three filters (e.g. banks: type, loan type, city) */
        const el = $(sel), d = fl[i], vals = d ? uniq(d[0]) : [];
        if (!d || !vals.length) { el.hidden = true; el.innerHTML = ""; } else { el.hidden = false; fill(sel, vals, d[1]); el.setAttribute("aria-label", d[1]); }
      });
      f.s = ["", "", ""];
      $("#fq").value = f.q;
      render();
      const u = new URL(location); u.searchParams.set("type", t); u.searchParams.delete("open");
      if (!facet) { u.searchParams.delete("f"); u.searchParams.delete("v"); }
      history.replaceState(null, "", u);
    }

    function render() {
      let list = rows.filter((r) =>
        (!facet || Data.hasFacet(r, facet.f, facet.v)) &&
        (!f.q || hay(r).includes(f.q.toLowerCase())) &&
        SPEC[type].filters.every((d, i) => !f.s[i] || Data.hasFacet(r, d[0], f.s[i])));
      if (f.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
      if (f.sort === "new") list.sort((a, b) => Date.parse(b.added_on || 0) - Date.parse(a.added_on || 0));
      const chip = facet ? `<span class="facet-active"><b>${esc(Data.FACETS[facet.f])}:</b> ${esc(facet.v)} <a href="directory.html?type=${type}" data-clear-facet aria-label="Remove this filter">×</a></span>` : "";
      meta.innerHTML = `<span>${list.length} ${esc(D[type].label)}${f.q ? ` matching “${esc(f.q)}”` : ""}</span>${chip}`;
      grid.innerHTML = list.length
        ? list.slice(0, shown).map((r) => card(r, type)).join("")
        : `<div class="empty" style="grid-column:1/-1">No results. Clear a filter or try another word.</div>`;
      $("#more").style.display = list.length > shown ? "flex" : "none";
      if (window.Compare) syncCompareBtn();
    }

    tabsEl.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) switchType(b.dataset.k); });
    meta.addEventListener("click", (e) => { if (e.target.closest("[data-clear-facet]")) { e.preventDefault(); facet = null; const u = new URL(location); u.searchParams.delete("f"); u.searchParams.delete("v"); history.replaceState(null, "", u); render(); } });
    $("#fq").addEventListener("input", (e) => { f.q = e.target.value.trim(); shown = PER; render(); });
    SLOTS.forEach((sel, i) => $(sel).addEventListener("change", (e) => { f.s[i] = e.target.value; shown = PER; render(); }));
    $("#fsort").addEventListener("change", (e) => { f.sort = e.target.value; shown = PER; render(); });
    $("#fclear").addEventListener("click", () => { f.q = ""; f.s = ["", "", ""]; facet = null; ["#fq", "#fsector", "#flocation", "#fstage"].forEach((s) => ($(s).value = "")); const u = new URL(location); u.searchParams.delete("f"); u.searchParams.delete("v"); history.replaceState(null, "", u); render(); });
    $("#more button").addEventListener("click", () => { shown += PER; render(); });
    bindCards(grid, () => [type, rows]);

    await switchType(type, true);
    if (openName) { const r = rows.find((x) => Data.key(x.name) === Data.key(openName)); if (r) openModal(r, type); }
  }

  /* =============================== SOLUTIONS =============================== */
  const SOLUTIONS = [
    { id: "startups", t: "For startups & founders", c: "#ff5c5c", p: "Find investors, programmes and funding that fit your stage.", items: ["Browse angels, VCs and networks", "Shortlist incubators and accelerators", "Discover government schemes and loans", "Get your startup listed and discovered"], link: ["angels", "Find angels"] },
    { id: "investors", t: "For investors", c: "#f5a200", p: "Scan startups by sector, stage and city, and keep your portfolio visible.", items: ["Filter startups by sector and stage", "Spot newly added companies every month", "Showcase your portfolio", "Reach founders directly"], link: ["startups", "Scan startups"] },
    { id: "incubators", t: "For incubators & accelerators", c: "#00a99d", p: "Reach high-potential startups and showcase your cohort.", items: ["Scan startups to invite", "Publish your programme", "Highlight your portfolio", "Track the ecosystem around you"], link: ["incubators", "See incubators"] },
    { id: "orgs", t: "For organisations", c: "#2f80ed", p: "Find partners for innovation and keep a pulse on the ecosystem.", items: ["Curated lists by sector", "Co-create custom dashboards", "Showcase corporate programmes", "Data support on request"], link: ["govt", "See schemes"] },
    { id: "researchers", t: "For researchers & students", c: "#7c4dff", p: "Fresh, structured data on startups and funding.", items: ["Up-to-date directory data", "Trend articles in the blog", "Prepare for placements and interviews", "Ask for custom datasets"], link: ["vcs", "Explore VCs"] }
  ];
  function solutions() {
    $("#sol").innerHTML = SOLUTIONS.map((s) => `<section id="${s.id}" style="padding:36px 0"><div class="card" style="--c:${s.c};background:${s.c};color:${U.on(s.c)};padding:clamp(24px,4vw,56px)">
      <div class="grid g2" style="align-items:center"><div><h2>${s.t}</h2><p class="lead" style="margin:12px 0 22px;color:inherit">${s.p}</p>
      <a class="btn btn-solid" href="directory.html?type=${s.link[0]}">${s.link[1]} ${svg("arrow")}</a></div>
      <ul style="list-style:none;padding:0;display:grid;gap:12px">${s.items.map((i) => `<li style="display:flex;gap:12px;align-items:center;background:#fff;color:var(--ink);padding:16px 18px"><span style="width:12px;height:12px;background:${s.c};flex:none"></span>${i}</li>`).join("")}</ul></div></div></section>`).join("");
  }

  /* =============================== BLOG / FAQ / ABOUT =============================== */
  async function blog() {
    const rows = (await Data.load("blog")).rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    $("#blog").innerHTML = rows.length ? rows.map(blogCard).join("") : '<p class="empty">No articles yet.</p>';
  }
  async function faq() {
    const rows = (await Data.load("faq")).rows;
    $("#faq").innerHTML = rows.map((r) => `<details><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`).join("");
  }
  async function about() {
    const rows = (await Data.load("team")).rows, col = ["#ff5c5c", "#f5a200", "#7c4dff", "#00a99d", "#2f80ed", "#22a559"];
    $("#team").innerHTML = rows.map((r, i) => `<div class="card" style="--c:${col[i % 6]}">${avatar(r, col[i % 6])}<h3>${esc(r.name)}</h3><b>${esc(r.role || "")}</b><p>${esc(r.bio || "")}</p>${U.link(r.linkedin) ? `<a class="link-arrow" href="${esc(U.link(r.linkedin))}" target="_blank" rel="noopener">${svg("linkedin")} LinkedIn</a>` : ""}</div>`).join("");
  }
  function contact() {
    const f = $("#cform"), msg = $("#cmsg"), btn = $("#cbtn"), t0 = Date.now();
    const connected = S.submitUrl && !/^PASTE_/i.test(S.submitUrl);
    if (!connected) { $("#cnotice").hidden = false; btn.disabled = true; }
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); msg.className = "smsg"; msg.textContent = "";
      if (!connected || f.elements.company_site.value) return;                      /* hidden field: only bots fill it */
      btn.disabled = true; btn.textContent = "Sending…";
      const wait = 3300 - (Date.now() - t0); if (wait > 0) await new Promise((r) => setTimeout(r, wait));   /* the server ignores anything faster than 3 s (bots) */
      try {
        await fetch(S.submitUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ kind: "contact", name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), message: f.elements.message.value.trim(), elapsed_ms: Date.now() - t0 }) });
        f.reset(); msg.className = "smsg ok"; msg.textContent = "Thanks, your message is on its way. We'll reply by email.";
      } catch (err) { msg.className = "smsg err"; msg.textContent = "Could not send. Check your internet connection or email us instead."; }
      btn.disabled = false; btn.textContent = "Send message";
    });
  }
  function legal() {
    const show = () => { const h = (location.hash || "#terms").slice(1); ["terms", "privacy"].forEach((id) => ($("#" + id).hidden = id !== h)); };
    addEventListener("hashchange", show); show();
  }

  /* =============================== ADD STARTUP (form built into the site) =============================== */
  function addstartup() {
    const f = $("#sform"), msg = $("#smsg"), btn = $("#sbtn"), t0 = Date.now();
    const connected = S.submitUrl && !/^PASTE_/i.test(S.submitUrl);
    if (!connected) {
      $("#snotice").hidden = false;
      btn.disabled = true;
    }

    /* founders: repeatable rows */
    const list = $("#founders-list"), MAXF = 5;
    const row = (i) => `<fieldset class="frow"><legend>Founder ${i}</legend>
      <label>Name${i === 1 ? " *" : ""}<input name="f_name" maxlength="80" ${i === 1 ? "required" : ""} autocomplete="off"></label>
      <label>Role<input name="f_role" maxlength="80" placeholder="e.g. Co-founder &amp; CEO"></label>
      <label>LinkedIn URL<input name="f_linkedin" type="url" maxlength="200" placeholder="https://www.linkedin.com/in/..."></label>
      <label class="wide">Short bio<input name="f_bio" maxlength="300" placeholder="One line about their background"></label></fieldset>`;
    const addRow = () => { const n = list.children.length + 1; if (n > MAXF) return; list.insertAdjacentHTML("beforeend", row(n)); $("#addf").hidden = n >= MAXF; };
    addRow();
    $("#addf").addEventListener("click", addRow);

    const val = (n) => (f.elements[n] ? f.elements[n].value.trim() : "");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "smsg"; msg.textContent = "";
      if (!connected) return;
      if (val("company_site")) return;                              /* honeypot: bots fill this hidden field */
      if (val("description").length < 40) { msg.className = "smsg err"; msg.textContent = "Please describe what the startup does in at least 40 characters."; f.elements.description.focus(); return; }
      if (!f.elements.consent.checked) { msg.className = "smsg err"; msg.textContent = "Please tick the confirmation box."; return; }

      const names = [...f.querySelectorAll('[name="f_name"]')], roles = [...f.querySelectorAll('[name="f_role"]')],
        lis = [...f.querySelectorAll('[name="f_linkedin"]')], bios = [...f.querySelectorAll('[name="f_bio"]')];
      const founders = names.map((n, i) => ({ name: n.value.trim(), role: roles[i].value.trim(), linkedin: lis[i].value.trim(), bio: bios[i].value.trim() })).filter((x) => x.name);
      const fields = ["name", "website", "description", "competitive_edge", "business_model", "location", "founded", "funding", "stage", "team_size", "user_base", "sector", "tech", "competitors", "investors", "tags", "logo_url"];
      const startup = {}; fields.forEach((k) => (startup[k] = val(k)));

      btn.disabled = true; btn.textContent = "Sending…";
      const wait = 6300 - (Date.now() - t0); if (wait > 0) await new Promise((r) => setTimeout(r, wait));   /* the server ignores anything faster than 6 s (bots) */
      try {
        /* text/plain keeps this a "simple" request, so the browser sends it without a pre-flight check */
        await fetch(S.submitUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ startup, founders, contact_email: val("contact_email"), submitter_role: val("submitter_role"), consent: true, elapsed_ms: Date.now() - t0 }) });
        f.hidden = true; $("#sdone").hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        msg.className = "smsg err"; msg.textContent = "Could not send. Check your internet connection and try again.";
        btn.disabled = false; btn.textContent = "Submit startup";
      }
    });
  }

  /* =============================== COMPARE =============================== */
  async function compare() {
    const wrap = $("#cmp"), MAX = Compare.MAX;
    const t = D[param("t")] ? param("t") : Compare.type(), sp = SPEC[t];
    $("#ctitle").textContent = "Compare " + D[t].label;
    const fromUrl = new URLSearchParams(location.search).getAll("n").slice(0, MAX);
    const names = fromUrl.length ? fromUrl : (Compare.type() === t ? Compare.get() : []);
    const all = (await Data.load(t)).rows, fall = t === "startups" ? (await Data.load("founders")).rows : [];
    const picked = names.map((n) => all.find((r) => Data.key(r.name) === Data.key(n))).filter(Boolean);
    const back = "compare.html?t=" + t;

    if (picked.length < 2) {
      wrap.innerHTML = `<div class="empty-state"><h2>Pick at least two to compare</h2>
        <p>${picked.length ? "You have 1 selected." : "Nothing selected yet."} Tick “Compare” on any card in ${esc(D[t].label)} (up to ${MAX}), then come back here.</p>
        <a class="btn btn-solid" href="directory.html?type=${t}">Browse ${esc(D[t].label)}</a></div>`;
      return;
    }
    const chips = (r, f) => Data.facetValues(r, f).map((v) => facetChip(t, f, v)).join("") || "–";
    const ROWS = sp.compare.map(([title, f, kind]) => [title, (r) => {
      if (f === "*founders") { const l = Data.foundersOf(fall, r.name); return esc(l.length ? l.map((x) => x.name + (x.role ? " (" + x.role + ")" : "")).join(", ") : r.founders || "–"); }
      if (kind === "chips") return `<div class="chips">${chips(r, f)}</div>`;
      if (kind === "link") { const u = U.link(r[f]); return u ? `<a class="link-arrow" href="${esc(u)}" target="_blank" rel="noopener">${title === "Apply" ? "Apply" : title === "LinkedIn" ? "Open" : "Visit"} ${svg("ext")}</a>` : "–"; }
      return esc(r[f] || "–");
    }]);
    const plain = (h) => h.replace(/<[^>]+>/g, "").trim();
    let onlyDiff = false;
    const draw = () => {
      const head = picked.map((r) => `<th scope="col"><div class="chead">${avatar(r, D[t].color)}<b>${esc(r.name)}</b>${r._derived ? "" : `<small>${esc(r.tagline || "")}</small>`}<button class="rm" data-rm="${esc(r.name)}" aria-label="Remove ${esc(r.name)}">Remove</button></div></th>`).join("");
      const body = ROWS.map(([title, fn]) => {
        const cells = picked.map((r) => fn(r)), same = new Set(cells.map(plain)).size === 1;
        if (onlyDiff && same) return "";
        return `<tr class="${same ? "" : "diff"}"><th scope="row">${title}</th>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      }).join("");
      $("#cmp-table").innerHTML = `<table class="ctable"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table>`;
    };
    wrap.innerHTML = `<div class="cmp-tools">
        <label class="switch"><input type="checkbox" id="onlydiff"> Show only differences</label>
        <button class="btn btn-sm btn-ghost" id="share">Copy link to this comparison</button>
        <button class="btn btn-sm btn-ghost" id="clearall">Clear selection</button><span id="shmsg" role="status"></span></div>
      <div class="cmp-scroll" id="cmp-table"></div>`;
    draw();
    $("#onlydiff").addEventListener("change", (e) => { onlyDiff = e.target.checked; draw(); });
    wrap.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-rm]");
      if (rm) { Compare.remove(rm.dataset.rm); const i = picked.findIndex((r) => r.name === rm.dataset.rm); if (i > -1) picked.splice(i, 1); if (picked.length < 2) location.href = back; else draw(); }
    });
    $("#clearall").addEventListener("click", () => { Compare.clear(); location.href = back; });
    $("#share").addEventListener("click", async () => {
      const u = new URL(location.href.split("?")[0]); u.searchParams.set("t", t); picked.forEach((r) => u.searchParams.append("n", r.name));
      try { await navigator.clipboard.writeText(u.href); $("#shmsg").textContent = "Link copied."; } catch (e) { $("#shmsg").textContent = u.href; }
    });
  }

  const map = { home, directory, solutions, blog, faq, about, contact, legal, addstartup, compare };
  const fn = map[document.body.dataset.page];
  if (fn) fn();
  window.U.pageHero = pageHero;
})();
