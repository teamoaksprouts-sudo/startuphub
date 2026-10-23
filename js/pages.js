/* Page renderers. Each page sets <body data-page="..."> and gets the matching function below. */
(function () {
  const S = window.SITE, D = window.DIRS, { $, esc, safeUrl, initials, svg } = window.U;
  const KEYS = Object.keys(D);
  const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? { day: "", mon: "", full: d || "" } : { day: t.getDate(), mon: t.toLocaleString("en-IN", { month: "short" }), full: t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }; };
  const param = (k) => new URLSearchParams(location.search).get(k) || "";
  const hay = (r) => Object.values(r).join(" ").toLowerCase();

  /* ---------- shared bits ---------- */
  const avatar = (r, color) => r.logo_url && safeUrl(r.logo_url)
    ? `<span class="av" style="--c:${color}"><img src="${esc(safeUrl(r.logo_url))}" alt="" loading="lazy" onerror="this.parentNode.textContent='${esc(initials(r.name))}'"></span>`
    : `<span class="av" style="--c:${color}">${esc(initials(r.name))}</span>`;

  /* A clickable chip that lists every item sharing this value (e.g. all startups funded by one investor) */
  const facetChip = (type, field, value, cls = "") =>
    `<a class="chip facet ${cls}" href="${esc(Data.facetUrl(type, field, value))}" title="See all ${esc(D[type].label)} with ${esc(Data.FACETS[field] || field)}: ${esc(value)}">${esc(value)}</a>`;

  const badStatus = (r) => /closed|inactive|shut|failed|defunct|acquired|dormant|expired|discontinued|wound/i.test(r.status || "");

  const compareBox = (r, type) => (type === "startups" && window.Compare
    ? `<label class="cmp" title="Add to compare (max ${Compare.MAX})"><input type="checkbox" data-cmp="${esc(r.name)}"${Compare.has(r.name) ? " checked" : ""}> Compare</label>` : "");

  function card(r, type) {
    const c = D[type].color;
    const isNew = Data.daysAgo(r.added_on) <= 30;
    const chips = [
      ...Data.split(r.sector).slice(0, 2).map((x) => facetChip(type, "sector", x)),
      r.stage ? facetChip(type, "stage", Data.split(r.stage)[0]) : "",
      r.location ? facetChip(type, "location", Data.facetValues(r, "location")[0] || "", "plain") : ""
    ].join("");
    const facts = [r.funding, r.founded ? "Founded " + r.founded : ""].filter(Boolean).join(" · ");
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

  const SKIP = ["name", "tagline", "description", "approved", "visible", "featured", "logo_url", "added_on", "website", "linkedin", "tags", "_derived", "source_url", "last_verified", "timestamp", "sector", "stage", "location"];
  const label = (k) => k.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

  async function openModal(r, type) {
    const c = D[type].color, m = ensureModal(), isS = type === "startups";
    const web = safeUrl(r.website), li = safeUrl(r.linkedin);
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
      const rows = Object.entries(r).filter(([k, v]) => v && !SKIP.includes(k)).map(([k, v]) => `<dt>${esc(label(k))}</dt><dd>${/^https?:\/\//i.test(v) && safeUrl(v) ? `<a class="link-arrow" href="${esc(safeUrl(v))}" target="_blank" rel="noopener">Open ${svg("ext")}</a>` : esc(v)}</dd>`).join("");
      body = `${text("About", r.description)}${rows ? `<dl class="kv">${rows}</dl>` : ""}${facet("Sector", "sector")}${facet("Stage", "stage")}${facet("Location", "location")}${facet("Tags", "tags")}`;
    }
    $("#sheet").innerHTML = `<button class="x" aria-label="Close">×</button>
      <div style="display:flex;gap:14px;align-items:center">${avatar(r, c)}<span class="chip" style="--c:${c}">${esc(D[type].single)}</span>${badStatus(r) ? `<span class="chip warn">${esc(r.status)}</span>` : ""}</div>
      <h2>${esc(r.name)}</h2>${r._derived ? "" : `<p class="tag" style="color:var(--muted)">${esc(r.tagline || "")}</p>`}
      ${body}
      <div class="actions">
        ${web ? `<a class="btn btn-color" style="--c:${c}" href="${esc(web)}" target="_blank" rel="noopener">Visit website ${svg("ext")}</a>` : ""}
        ${li ? `<a class="btn btn-ghost" href="${esc(li)}" target="_blank" rel="noopener">${svg("linkedin")} LinkedIn</a>` : ""}
        ${["angels", "vcs", "incubators"].includes(type) ? `<a class="btn btn-ghost" href="${esc(Data.facetUrl("startups", "investors", r.name))}">Startups in our database backed by ${esc(r.name.length > 28 ? "them" : r.name)}</a>` : ""}
        ${isS && window.Compare ? `<button class="btn btn-ghost" data-cmp-btn="${esc(r.name)}"></button>` : ""}
      </div>`;
    m.classList.add("open");
    $(".x", m).focus();
    syncCompareBtn();

    if (isS) {                                   /* founders come from the Founders tab */
      const fx = $("#fx"), all = (await Data.load("founders")).rows;
      let list = Data.foundersOf(all, r.name);
      if (!fx || !m.classList.contains("open")) return;
      if (!list.length && r.founders) list = Data.split(r.founders).map((n) => ({ name: n }));
      if (list.length) fx.innerHTML = `<div class="blk"><h4>Founders</h4><div class="founders">${list.map((f) => {
        const l = safeUrl(f.linkedin);
        return `<div class="fcard"><span class="av" style="--c:${c}">${esc(initials(f.name))}</span><div><a class="fname" href="${esc(Data.facetUrl("startups", "founders", f.name))}" title="See all startups by ${esc(f.name)}">${esc(f.name)}</a>${f.role ? `<small>${esc(f.role)}</small>` : ""}${f.bio ? `<p>${esc(f.bio)}</p>` : ""}${l ? `<a href="${esc(l)}" target="_blank" rel="noopener" class="link-arrow">${svg("linkedin")} LinkedIn</a>` : ""}</div></div>`;
      }).join("")}</div></div>`;
    }
  }

  function syncCompareBtn() {
    if (!window.Compare) return;
    document.querySelectorAll("[data-cmp-btn]").forEach((b) => {
      const on = Compare.has(b.dataset.cmpBtn);
      b.textContent = on ? "Remove from compare" : "Add to compare";
    });
    document.querySelectorAll("input[data-cmp]").forEach((i) => { i.checked = Compare.has(i.dataset.cmp); });
  }

  function bindCards(root, getRows) {
    const go = (el) => { const [type, rows] = getRows(); const r = rows.find((x) => x.name === el.dataset.name); if (r) openModal(r, type); };
    root.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;                                   /* chips are links */
      const cb = e.target.closest("input[data-cmp]");
      if (cb) { e.stopPropagation(); Compare.toggle(cb.dataset.cmp); syncCompareBtn(); return; }
      if (e.target.closest("label.cmp")) return;
      const el = e.target.closest(".item"); if (el) go(el);
    });
    root.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("item")) { e.preventDefault(); go(e.target); } });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmp-btn]"); if (b && window.Compare) { Compare.toggle(b.dataset.cmpBtn); syncCompareBtn(); }
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
      return `<div class="stat" style="--c:${D[k].color}"><b data-n="${all[k].length}">0</b><span>${esc(D[k].label)}</span>${added ? `<small>+${added} last month</small>` : "<small>&nbsp;</small>"}</div>`;
    }).join("");
    document.querySelectorAll("#stats b").forEach((b) => count(b, +b.dataset.n));

    /* search console */
    let cur = "startups";
    const tabs = $("#tabs"), box = $("#q"), res = $("#res"), sbox = $(".sbox");
    tabs.innerHTML = KEYS.map((k) => `<button class="tab" role="tab" aria-selected="${k === cur}" data-k="${k}" style="--c:${D[k].color}"><i></i>${esc(D[k].label)}</button>`).join("");
    const paint = () => {
      const q = box.value.trim().toLowerCase();
      sbox.style.setProperty("--sc", D[cur].color);
      let rows = all[cur];
      if (q) rows = rows.filter((r) => hay(r).includes(q));
      const top = rows.slice(0, 6);
      res.innerHTML = top.length
        ? top.map((r) => `<a class="res" href="directory.html?type=${cur}&open=${encodeURIComponent(r.name)}">${avatar(r, D[cur].color)}<span><b>${esc(r.name)}</b><small>${esc([r.sector, r.location].filter(Boolean).join(" · "))}</small></span><span class="go">${svg("arrow")}</span></a>`).join("") +
          `<a class="link-arrow res" href="directory.html?type=${cur}&q=${encodeURIComponent(q)}">See all ${rows.length} in ${esc(D[cur].label)} ${svg("arrow")}</a>`
        : `<div class="empty">Nothing found for “${esc(q)}”. Try a sector or city.</div>`;
    };
    tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (!b) return; cur = b.dataset.k; tabs.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t === b)); paint(); });
    box.addEventListener("input", paint); paint();

    /* products */
    $("#products").innerHTML = KEYS.map((k) => `<a class="card prod" href="directory.html?type=${k}" style="--c:${D[k].color}">
      <div><span class="big">${esc(D[k].label)}</span><p style="margin-top:8px">${esc(D[k].blurb)}</p></div>
      <span class="link-arrow" style="color:${D[k].color}">Explore ${all[k].length} ${svg("arrow")}</span></a>`).join("");

    /* featured startups */
    const feat = all.startups.filter((r) => /^(yes|y|true|1)$/i.test(r.featured || "")), pick = (feat.length ? feat : all.startups).slice(0, 6);
    $("#featured").innerHTML = pick.map((r) => card(r, "startups")).join("");
    bindCards($("#featured"), () => ["startups", all.startups]);

    /* blog */
    const blog = (await Data.load("blog")).rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4);
    $("#blog").innerHTML = blog.map(blogCard).join("");

    /* clients */
    const cl = (await Data.load("clients")).rows;
    const pills = cl.map((r) => `<div class="logo-pill">${r.logo_url ? `<img src="${esc(safeUrl(r.logo_url))}" alt="${esc(r.name)}" loading="lazy">` : esc(r.name)}</div>`).join("");
    $("#clients").innerHTML = `<div class="track">${pills}${pills}${pills}${pills}</div>`;

    newsletter();
  }

  const blogCard = (r) => {
    const d = fmtDate(r.date), u = safeUrl(r.url) || "#";
    return `<a class="card" href="${esc(u)}" ${/^https?:/.test(u) ? 'target="_blank" rel="noopener"' : ""} style="--c:var(--violet)">
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
    const f = { q: param("q"), sector: "", location: "", stage: "", sort: "az" };

    const tabsEl = $("#tabs");
    tabsEl.innerHTML = KEYS.map((k) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${k === type}" style="--c:${D[k].color}"><i></i>${esc(D[k].label)}</button>`).join("");

    const fill = (sel, vals, label) => { const s = $(sel); s.innerHTML = `<option value="">${label}</option>` + vals.map((v) => `<option>${esc(v)}</option>`).join(""); s.value = ""; };
    const uniq = (field) => [...new Map(rows.flatMap((r) => Data.facetValues(r, field)).map((v) => [Data.key(v), v])).values()].sort((a, b) => a.localeCompare(b));

    async function switchType(t, keepFacet) {
      type = t; shown = PER; if (!keepFacet) facet = null;
      document.documentElement.style.setProperty("--dir", D[t].color);
      tabsEl.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.k === t));
      $("#dtitle").textContent = D[t].label; $("#dblurb").textContent = D[t].blurb;
      grid.innerHTML = '<p class="empty">Loading…</p>';
      rows = (await Data.load(t)).rows;
      fill("#fsector", uniq("sector"), "All sectors"); fill("#flocation", uniq("location"), "All cities"); fill("#fstage", uniq("stage"), "All stages");
      f.sector = f.location = f.stage = "";
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
        (!f.sector || Data.hasFacet(r, "sector", f.sector)) &&
        (!f.location || Data.hasFacet(r, "location", f.location)) &&
        (!f.stage || Data.hasFacet(r, "stage", f.stage)));
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
    [["#fsector", "sector"], ["#flocation", "location"], ["#fstage", "stage"], ["#fsort", "sort"]].forEach(([s, k]) => $(s).addEventListener("change", (e) => { f[k] = e.target.value; shown = PER; render(); }));
    $("#fclear").addEventListener("click", () => { f.q = ""; f.sector = f.location = f.stage = ""; facet = null; ["#fq", "#fsector", "#flocation", "#fstage"].forEach((s) => ($(s).value = "")); const u = new URL(location); u.searchParams.delete("f"); u.searchParams.delete("v"); history.replaceState(null, "", u); render(); });
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
    { id: "researchers", t: "For researchers, policy makers & students", c: "#7c4dff", p: "Fresh, structured data on startups and funding.", items: ["Up-to-date directory data", "Trend articles in the blog", "Prepare for placements and interviews", "Ask for custom datasets"], link: ["vcs", "Explore VCs"] }
  ];
  function solutions() {
    $("#sol").innerHTML = SOLUTIONS.map((s) => `<section id="${s.id}" style="padding:36px 0"><div class="card" style="--c:${s.c};border-color:color-mix(in srgb,${s.c} 40%,#fff);background:color-mix(in srgb,${s.c} 5%,#fff);padding:clamp(24px,4vw,44px)">
      <div class="grid g2" style="align-items:center"><div><h2 style="color:${s.c}">${s.t}</h2><p class="lead" style="margin:12px 0 22px">${s.p}</p>
      <a class="btn btn-color" style="--c:${s.c}" href="directory.html?type=${s.link[0]}">${s.link[1]} ${svg("arrow")}</a></div>
      <ul style="list-style:none;padding:0;display:grid;gap:12px">${s.items.map((i) => `<li style="display:flex;gap:12px;align-items:center;background:#fff;padding:14px 16px;border-radius:14px;border:1px solid var(--line)"><span style="width:10px;height:10px;border-radius:50%;background:${s.c};flex:none"></span>${i}</li>`).join("")}</ul></div></div></section>`).join("");
  }

  /* =============================== BENEFITS =============================== */
  async function benefits() {
    const rows = (await Data.load("benefits")).rows, cats = [...new Set(rows.map((r) => r.category).filter(Boolean))];
    const palette = ["#ff5c5c", "#f5a200", "#7c4dff", "#00a99d", "#2f80ed", "#22a559"];
    let cur = "";
    const draw = () => {
      $("#btabs").innerHTML = ["All", ...cats].map((c, i) => `<button class="tab" aria-selected="${(c === "All" && !cur) || c === cur}" data-c="${c === "All" ? "" : esc(c)}" style="--c:${palette[i % 6]}"><i></i>${esc(c)}</button>`).join("");
      $("#blist").innerHTML = rows.filter((r) => !cur || r.category === cur).map((r) => {
        const c = palette[Math.max(0, cats.indexOf(r.category)) % 6], u = safeUrl(r.url) || "#";
        return `<a class="card" style="--c:${c}" href="${esc(u)}" ${/^https?:/.test(u) ? 'target="_blank" rel="noopener"' : ""}>
          <span class="chip" style="align-self:flex-start">${esc(r.category || "Offer")}</span><h3>${esc(r.partner)}</h3>
          <b style="color:${c}">${esc(r.offer || "")}</b><p>${esc(r.description || "")}</p><span class="link-arrow" style="margin-top:auto;color:${c}">Claim offer ${svg("arrow")}</span></a>`;
      }).join("");
    };
    $("#btabs").addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) { cur = b.dataset.c; draw(); } });
    draw();
  }

  /* =============================== BLOG / EVENTS / FAQ / ABOUT =============================== */
  async function blog() {
    const rows = (await Data.load("blog")).rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    $("#blog").innerHTML = rows.length ? rows.map(blogCard).join("") : '<p class="empty">No articles yet.</p>';
  }
  async function events() {
    const rows = (await Data.load("events")).rows, now = Date.now() - 864e5;
    const up = rows.filter((r) => Date.parse(r.date) >= now).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const past = rows.filter((r) => !(Date.parse(r.date) >= now)).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    const row = (r, c) => { const d = fmtDate(r.date), u = safeUrl(r.url) || "#"; return `<a class="card" style="--c:${c}" href="${esc(u)}" ${/^https?:/.test(u) ? 'target="_blank" rel="noopener"' : ""}><div class="row"><div class="date-badge">${d.day}<small>${d.mon}</small></div><div><h3>${esc(r.title)}</h3><small style="color:var(--muted)">${esc(r.location || "")}</small></div></div><p>${esc(r.description || "")}</p></a>`; };
    $("#up").innerHTML = up.length ? up.map((r) => row(r, "#7c4dff")).join("") : '<p class="empty" style="grid-column:1/-1">No upcoming events right now. Check back soon.</p>';
    $("#past").innerHTML = past.map((r) => row(r, "#9aa0bd")).join("");
    if (!past.length) $("#pastwrap").remove();
  }
  async function faq() {
    const rows = (await Data.load("faq")).rows;
    $("#faq").innerHTML = rows.map((r) => `<details><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`).join("");
  }
  async function about() {
    const rows = (await Data.load("team")).rows, col = ["#ff5c5c", "#f5a200", "#7c4dff", "#00a99d", "#2f80ed", "#22a559"];
    $("#team").innerHTML = rows.map((r, i) => `<div class="card" style="--c:${col[i % 6]}">${avatar(r, col[i % 6])}<h3>${esc(r.name)}</h3><b style="color:${col[i % 6]};font-size:.9rem">${esc(r.role || "")}</b><p>${esc(r.bio || "")}</p>${safeUrl(r.linkedin) ? `<a class="link-arrow" href="${esc(safeUrl(r.linkedin))}" target="_blank" rel="noopener">${svg("linkedin")} LinkedIn</a>` : ""}</div>`).join("");
  }
  function contact() {
    const f = $("#cform");
    if (!S.contactFormAction) { f.innerHTML = '<p class="empty" style="text-align:left">The contact form is not connected yet. Add your form endpoint in <code>js/config.js → contactFormAction</code>. Until then, use the details in the footer.</p>'; return; }
    f.action = S.contactFormAction; f.method = "POST";
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { const r = await fetch(S.contactFormAction, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } }); $("#cmsg").textContent = r.ok ? "Thanks, we'll reply soon." : "Could not send. Please email us instead."; if (r.ok) f.reset(); }
      catch { $("#cmsg").textContent = "Could not send. Please email us instead."; }
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
    const fromUrl = new URLSearchParams(location.search).getAll("n").slice(0, MAX);
    const names = fromUrl.length ? fromUrl : Compare.get();
    const all = (await Data.load("startups")).rows, fall = (await Data.load("founders")).rows;
    const picked = names.map((n) => all.find((r) => Data.key(r.name) === Data.key(n))).filter(Boolean);

    if (picked.length < 2) {
      wrap.innerHTML = `<div class="empty-state"><h2>Pick at least two startups to compare</h2>
        <p>${picked.length ? "You have 1 selected." : "Nothing selected yet."} Tick “Compare” on any startup card (up to ${MAX}), then come back here.</p>
        <a class="btn btn-solid" href="directory.html?type=startups">Browse startups</a></div>`;
      return;
    }
    const chips = (r, f) => Data.facetValues(r, f).map((v) => facetChip("startups", f, v)).join("") || "–";
    const ROWS = [
      ["About", (r) => esc(r.description || "–")],
      ["Competitive edge", (r) => esc(r.competitive_edge || "–")],
      ["Business model", (r) => esc(r.business_model || "–")],
      ["Headquarters", (r) => esc(r.location || "–")],
      ["Founded", (r) => esc(r.founded || "–")],
      ["Funding", (r) => esc(r.funding || "–")],
      ["Stage", (r) => (r.stage ? facetChip("startups", "stage", r.stage) : "–")],
      ["Team size", (r) => esc(r.team_size || "–")],
      ["Users / customers", (r) => esc(r.user_base || "–")],
      ["Sector", (r) => `<div class="chips">${chips(r, "sector")}</div>`],
      ["Underlying technology", (r) => `<div class="chips">${chips(r, "tech")}</div>`],
      ["Key investors", (r) => `<div class="chips">${chips(r, "investors")}</div>`],
      ["Primary competition", (r) => `<div class="chips">${chips(r, "competitors")}</div>`],
      ["Founders", (r) => { const l = Data.foundersOf(fall, r.name); return esc(l.length ? l.map((x) => x.name + (x.role ? " (" + x.role + ")" : "")).join(", ") : r.founders || "–"); }],
      ["Status", (r) => esc(r.status || "–")],
      ["Website", (r) => (safeUrl(r.website) ? `<a class="link-arrow" href="${esc(safeUrl(r.website))}" target="_blank" rel="noopener">Visit ${svg("ext")}</a>` : "–")]
    ];
    const plain = (h) => h.replace(/<[^>]+>/g, "").trim();
    let onlyDiff = false;
    const draw = () => {
      const head = picked.map((r) => `<th scope="col"><div class="chead">${avatar(r, D.startups.color)}<b>${esc(r.name)}</b>${r._derived ? "" : `<small>${esc(r.tagline || "")}</small>`}<button class="rm" data-rm="${esc(r.name)}" aria-label="Remove ${esc(r.name)}">Remove</button></div></th>`).join("");
      const body = ROWS.map(([t, fn]) => {
        const cells = picked.map((r) => fn(r)), same = new Set(cells.map(plain)).size === 1;
        if (onlyDiff && same) return "";
        return `<tr class="${same ? "" : "diff"}"><th scope="row">${t}</th>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
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
      if (rm) { Compare.remove(rm.dataset.rm); const i = picked.findIndex((r) => r.name === rm.dataset.rm); if (i > -1) picked.splice(i, 1); if (picked.length < 2) location.href = "compare.html"; else draw(); }
    });
    $("#clearall").addEventListener("click", () => { Compare.clear(); location.href = "compare.html"; });
    $("#share").addEventListener("click", async () => {
      const u = new URL(location.href.split("?")[0]); picked.forEach((r) => u.searchParams.append("n", r.name));
      try { await navigator.clipboard.writeText(u.href); $("#shmsg").textContent = "Link copied."; } catch (e) { $("#shmsg").textContent = u.href; }
    });
  }

  const map = { home, directory, solutions, benefits, blog, events, faq, about, contact, legal, addstartup, compare };
  const fn = map[document.body.dataset.page];
  if (fn) fn();
  window.U.pageHero = pageHero;
})();
