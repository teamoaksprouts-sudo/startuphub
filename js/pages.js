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

  function card(r, type) {
    const c = D[type].color;
    const isNew = Data.daysAgo(r.added_on) <= 30;
    return `<article class="card item click" tabindex="0" role="button" data-name="${esc(r.name)}" style="--c:${c}">
      ${isNew ? '<span class="new">New</span>' : ""}
      <div class="top">${avatar(r, c)}<div><h3>${esc(r.name)}</h3><div class="tag">${esc(r.tagline || "")}</div></div></div>
      <p>${esc((r.description || "").slice(0, 120))}${(r.description || "").length > 120 ? "…" : ""}</p>
      <div class="chips">${[r.sector, r.stage].filter(Boolean).map((x) => `<span class="chip">${esc(x.split(",")[0])}</span>`).join("")}${r.location ? `<span class="chip plain">${esc(r.location)}</span>` : ""}</div>
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
  function openModal(r, type) {
    const c = D[type].color, m = ensureModal();
    const skip = ["name", "tagline", "description", "approved", "featured", "logo_url", "added_on", "website", "linkedin", "tags"];
    const rows = Object.entries(r).filter(([k, v]) => v && !skip.includes(k))
      .map(([k, v]) => `<dt>${esc(k.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase()))}</dt><dd>${esc(v)}</dd>`).join("");
    const web = safeUrl(r.website), li = safeUrl(r.linkedin);
    $("#sheet").innerHTML = `<button class="x" aria-label="Close">×</button>
      <div style="display:flex;gap:14px;align-items:center">${avatar(r, c)}<span class="chip" style="--c:${c}">${esc(D[type].single)}</span></div>
      <h2>${esc(r.name)}</h2><p class="tag" style="color:var(--muted)">${esc(r.tagline || "")}</p>
      <p style="margin-top:14px">${esc(r.description || "")}</p>
      ${rows ? `<dl class="kv">${rows}</dl>` : ""}
      ${r.tags ? `<div class="chips">${Data.split(r.tags).map((t) => `<span class="chip plain">${esc(t)}</span>`).join("")}</div>` : ""}
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        ${web ? `<a class="btn btn-color" style="--c:${c}" href="${esc(web)}" target="_blank" rel="noopener">Visit website ${svg("ext")}</a>` : ""}
        ${li ? `<a class="btn btn-ghost" href="${esc(li)}" target="_blank" rel="noopener">${svg("linkedin")} LinkedIn</a>` : ""}
      </div>`;
    m.classList.add("open");
    $(".x", m).focus();
  }
  function bindCards(root, getRows) {
    const go = (el) => { const [type, rows] = getRows(); const r = rows.find((x) => x.name === el.dataset.name); if (r) openModal(r, type); };
    root.addEventListener("click", (e) => { const el = e.target.closest(".item"); if (el) go(el); });
    root.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("item")) { e.preventDefault(); go(e.target); } });
  }

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
      <small style="color:var(--muted);margin-top:auto">${esc(d.full)}</small></a>`;
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
    let rows = [], shown = 24;
    const PER = 24, grid = $("#grid"), meta = $("#meta");
    const f = { q: param("q"), sector: "", location: "", stage: "", sort: "az" };

    const tabsEl = $("#tabs");
    tabsEl.innerHTML = KEYS.map((k) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${k === type}" style="--c:${D[k].color}"><i></i>${esc(D[k].label)}</button>`).join("");

    const fill = (sel, vals, label) => { const s = $(sel); s.innerHTML = `<option value="">${label}</option>` + vals.map((v) => `<option>${esc(v)}</option>`).join(""); s.value = ""; };
    const uniq = (key) => [...new Set(rows.flatMap((r) => Data.split(r[key])))].sort((a, b) => a.localeCompare(b));

    async function switchType(t) {
      type = t; shown = PER;
      document.documentElement.style.setProperty("--dir", D[t].color);
      tabsEl.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.k === t));
      $("#dtitle").textContent = D[t].label; $("#dblurb").textContent = D[t].blurb;
      grid.innerHTML = '<p class="empty">Loading…</p>';
      rows = (await Data.load(t)).rows;
      fill("#fsector", uniq("sector"), "All sectors"); fill("#flocation", uniq("location"), "All locations"); fill("#fstage", uniq("stage"), "All stages");
      f.sector = f.location = f.stage = "";
      $("#fq").value = f.q;
      render();
      const u = new URL(location); u.searchParams.set("type", t); u.searchParams.delete("open"); history.replaceState(null, "", u);
    }

    function render() {
      let list = rows.filter((r) =>
        (!f.q || hay(r).includes(f.q.toLowerCase())) &&
        (!f.sector || Data.split(r.sector).includes(f.sector)) &&
        (!f.location || Data.split(r.location).includes(f.location)) &&
        (!f.stage || Data.split(r.stage).includes(f.stage)));
      if (f.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
      if (f.sort === "new") list.sort((a, b) => Date.parse(b.added_on || 0) - Date.parse(a.added_on || 0));
      meta.innerHTML = `<span>${list.length} ${esc(D[type].label)}${f.q ? ` matching “${esc(f.q)}”` : ""}</span>`;
      grid.innerHTML = list.length
        ? list.slice(0, shown).map((r) => card(r, type)).join("")
        : `<div class="empty" style="grid-column:1/-1">No results. Clear a filter or try another word.</div>`;
      $("#more").style.display = list.length > shown ? "flex" : "none";
      grid._list = list;
    }

    tabsEl.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) switchType(b.dataset.k); });
    $("#fq").addEventListener("input", (e) => { f.q = e.target.value.trim(); shown = PER; render(); });
    [["#fsector", "sector"], ["#flocation", "location"], ["#fstage", "stage"], ["#fsort", "sort"]].forEach(([s, k]) => $(s).addEventListener("change", (e) => { f[k] = e.target.value; shown = PER; render(); }));
    $("#fclear").addEventListener("click", () => { f.q = ""; f.sector = f.location = f.stage = ""; ["#fq", "#fsector", "#flocation", "#fstage"].forEach((s) => ($(s).value = "")); render(); });
    $("#more button").addEventListener("click", () => { shown += PER; render(); });
    bindCards(grid, () => [type, rows]);

    await switchType(type);
    const open = param("open");
    if (open) { const r = rows.find((x) => x.name === open); if (r) openModal(r, type); }
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

  /* =============================== BLOG / EVENTS / FAQ / ABOUT / PRICING =============================== */
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
  function pricing() {
    $("#plans").innerHTML = S.plans.map((p) => `<div class="card plan${p.featured ? " featured" : ""}" style="--c:${p.color}"><h3 style="color:${p.color}">${esc(p.name)}</h3><div class="price">${esc(p.price)}<small style="font:500 .95rem var(--body);color:var(--muted)"> ${esc(p.per)}</small></div>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul><a class="btn btn-color" style="--c:${p.color};margin-top:auto" href="${esc(p.link)}">${esc(p.cta)}</a></div>`).join("");
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

  const map = { home, directory, solutions, benefits, blog, events, faq, about, pricing, contact, legal };
  const fn = map[document.body.dataset.page];
  if (fn) fn();
  window.U.pageHero = pageHero;
})();
