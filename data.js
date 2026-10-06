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

  function toObjects(csv) {
    const grid = parseCSV(csv).filter((r) => r.some((c) => c.trim() !== ""));
    if (!grid.length) return [];
    const heads = grid[0].map(norm);
    const hasApproved = heads.includes("approved");
    const out = [];
    for (let i = 1; i < grid.length; i++) {
      const o = {};
      heads.forEach((h, j) => { if (h) o[h] = (grid[i][j] || "").trim(); });
      if (!o.added_on && o.timestamp) o.added_on = o.timestamp;                       // Google Form rows
      if (hasApproved &&!YES.includes((o.approved || "").toLowerCase())) continue;   // hide unapproved rows
      if (!(o.name || o.title || o.partner || o.question)) continue;                  // skip empty rows
      out.push(o);
    }
    return out;
  }

  async function load(key) {
    const sample = () => ({ rows: (window.SAMPLE[key] || []).map((r) => ({ ...r })), live: false });
    if (!isConfigured()) return sample();

    const ck = "sh_" + S.sheetId + "_" + key;
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
      const rows = toObjects(text);
      try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), rows })); } catch (e) {}
      return { rows, live: true };
    } catch (err) {
      console.warn("[StartupHub] Could not read tab '" + S.tabs[key] + "':", err.message, "→ using sample data");
      return sample();
    }
  }

  const split = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const daysAgo = (d) => { const t = Date.parse(d); return isNaN(t) ? Infinity : (Date.now() - t) / 864e5; };

  window.Data = { load, split, daysAgo, isConfigured };
})();
