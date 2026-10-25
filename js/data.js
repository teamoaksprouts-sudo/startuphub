/* Data layer: reads tabs from your Google Sheet (as CSV), caches briefly, falls back to SAMPLE data. */
(function () {
  const S = window.SITE;
  const isConfigured = () => S.sheetId && !/^PASTE_/i.test(S.sheetId);

  /* Small, safe CSV parser (handles quotes, commas, newlines inside cells) */
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  const norm = (h) => String(h || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const YES = ["yes", "y", "true", "1", "approved", "published", "live"];

  /* Your sheet headers → the names the website uses internally.
     (Headers are first cleaned: "Startup Name" becomes startup_name, "Funding stage" becomes funding_stage.) */
  const ALIAS = {
    startup_name: "name", scheme_name: "name", bank_name: "name", institution_name: "name", investor_name: "name",
    fund_name: "name", incubator_name: "name", organisation_name: "name", organization_name: "name", angel_name: "name",
    tagline_description: "description", about: "description", overview: "description",
    headquarters: "location", hq: "location", city: "location", state: "location",
    founded_in: "founded", funding_amount: "funding",
    primary_competition: "competitors", competition: "competitors",
    key_investors: "investors",
    website_url: "website", site_url: "website", linkedin_url: "linkedin", logo: "logo_url",
    funding_stage: "stage", stage_focus: "stage",
    sector_focus: "sector", sectors: "sector", sectors_focus: "sector",
    underlying_tech: "tech", technology: "tech",
    ministry_or_department: "ministry", notable_investments: "portfolio", notable_portfolio: "portfolio",
    photo: "photo_url", picture: "photo_url", profile_image: "photo_url", profile_picture: "photo_url", avatar: "photo_url"
  };
  /* Founders tab uses its own mapping so "Startup Name" stays the link back to the startup. */
  const ALIAS_FOUNDERS = { startup_name: "startup", startup: "startup", founder_name: "name", linkedin_url: "linkedin", photo_url: "photo_url", photo: "photo_url", picture: "photo_url" };

  const firstSentence = (d) => {
    const t = String(d || "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    const m = t.match(/^(.{20,}?[.!?])(\s|$)/);
    let s = m ? m[1] : t;
    if (s.length > 110) s = s.slice(0, 107).replace(/\s+\S*$/, "") + "…";
    return s;
  };

  function toObjects(csv, key) {
    const grid = parseCSV(csv).filter((r) => r.some((c) => c.trim() !== ""));
    if (!grid.length) return [];
    const map = key === "founders" ? ALIAS_FOUNDERS : ALIAS;
    const heads = grid[0].map((h) => { const n = norm(h); return map[n] || n; });
    const gates = ["visible", "approved"].filter((g) => heads.includes(g));
    const out = [];
    for (let i = 1; i < grid.length; i++) {
      const o = {};
      heads.forEach((h, j) => { if (h && (o[h] === undefined || o[h] === "")) o[h] = (grid[i][j] || "").trim(); });
      if (gates.length && !gates.every((g) => YES.includes((o[g] || "").toLowerCase()))) continue;   // hide rows not marked yes
      if (key === "founders") { if (!(o.startup && o.name)) continue; }
      else if (!(o.name || o.title || o.partner || o.question)) continue;                           // skip empty rows
      if (!o.tagline && o.description) { o.tagline = firstSentence(o.description); o._derived = "1"; }
      if (!o.added_on && o.timestamp) o.added_on = o.timestamp;
      out.push(o);
    }
    return out;
  }

  async function load(key) {
    const sample = () => ({
      rows: (window.SAMPLE[key] || []).map((r) => {
        const o = { ...r };
        if (!o.tagline && o.description) { o.tagline = firstSentence(o.description); o._derived = "1"; }
        return o;
      }), live: false
    });
    if (!isConfigured()) return sample();

    const ck = "sh2_" + S.sheetId + "_" + key;
    try {
      const hit = JSON.parse(sessionStorage.getItem(ck) || "null");
      if (hit && Date.now() - hit.t < S.cacheMinutes * 60000) return { rows: hit.rows, live: true };
    } catch (e) {}

    try {
      const url = "https://docs.google.com/spreadsheets/d/" + S.sheetId +
        "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(S.tabs[key]);
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("Sheet not shared publicly");
      const rows = toObjects(text, key);
      try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), rows })); } catch (e) {}
      return { rows, live: true };
    } catch (err) {
      console.warn("[StartupHub] Could not read tab '" + S.tabs[key] + "':", err.message, "→ using sample data");
      /* An optional tab (like Founders) that is missing should be empty, not sample data, once the sheet is connected. */
      return key === "founders" ? { rows: [], live: true } : sample();
    }
  }

  const split = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const daysAgo = (d) => { const t = Date.parse(d); return isNaN(t) ? Infinity : (Date.now() - t) / 864e5; };
  const key = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  /* Fields people can click to see every startup with the same value */
  const FACETS = {
    sector: "Sector", tags: "Tag", tech: "Technology", competitors: "Competitor",
    investors: "Investor", stage: "Stage", location: "City", founders: "Founder", status: "Status",
    type: "Type", level: "Level", ministry: "Ministry", benefit_type: "Benefit type", loan_type: "Loan type",
    parent_institution: "Parent institution", portfolio: "Portfolio company"
  };
  const facetValues = (r, f) => (f === "location" ? [String(r.location || "").split(",")[0].trim()].filter(Boolean) : split(r[f]));
  const hasFacet = (r, f, v) => { const k = key(v); return facetValues(r, f).some((x) => key(x) === k); };
  const facetUrl = (type, f, v) => "directory.html?type=" + type + "&f=" + encodeURIComponent(f) + "&v=" + encodeURIComponent(v);

  /* Founder rows for one startup (from the Founders tab) */
  const foundersOf = (all, startupName) => all.filter((f) => key(f.startup) === key(startupName));

  window.Data = { load, split, daysAgo, isConfigured, key, FACETS, facetValues, hasFacet, facetUrl, foundersOf };
})();
