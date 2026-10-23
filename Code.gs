/**
 * StartupHub: form inbox, approvals, and automatic blog + event feeds
 * ===================================================================
 * WHERE THIS GOES
 *   Open your PRIVATE "Inbox" Google Sheet (the one that is NOT shared publicly)
 *   → Extensions → Apps Script → delete the sample code → paste this whole file → Save.
 *   Then choose the function "setup" in the toolbar and press Run (allow the permissions once).
 *
 * WHAT IT DOES
 *   1. The "Add your startup" form on your website sends its answers here (doPost).
 *      They are stored in this private sheet (tabs: Submissions + Founders Submissions).
 *      The submitter's email is stored here only. It never reaches the public sheet.
 *   2. You tick "Approve?" on a row → the startup (and its founders) is copied into
 *      your PUBLIC main sheet (tabs: Startups + Founders).
 *   3. Every morning refreshFeeds() reads the RSS / calendar links listed in the
 *      "Sources" tab and fills the "Blog Review" and "Events Review" tabs.
 *      Sources marked Auto-publish = yes go straight to the main sheet. For the rest,
 *      tick "Approve?" to publish.
 *
 * Nothing here deletes anything from your main sheet.
 */

/* ================== SETTINGS: the only part you may need to edit ================== */

// The ID of your PUBLIC main sheet (the one the website reads). It is the same value as
// "sheetId" in js/config.js. In the sheet's address it is the text between /d/ and /edit.
const MAIN_SHEET_ID = '1e6JfT_T0D06NS1Vl1zL84VuEexltGj7fjmT6NOlHocs';

// true  = ticking "Approve?" publishes the startup on the website straight away (Visible = yes).
// false = it is copied to the main sheet with Visible = no. You then type "yes" there to publish.
const PUBLISH_ON_APPROVE = true;

// Optional: an email address to notify when a new startup is submitted. Leave '' for none.
const NOTIFY_EMAIL = '';

/* ================== Tab and column names (must match your sheets) ================== */

const TAB = {
  SUBMISSIONS: 'Submissions',
  FOUNDERS_SUB: 'Founders Submissions',
  SOURCES: 'Sources',
  SETTINGS: 'Settings',
  BLOG_REVIEW: 'Blog Review',
  EVENTS_REVIEW: 'Events Review',
  LOG: 'Log'
};
const MAIN = { STARTUPS: 'Startups', FOUNDERS: 'Founders', BLOG: 'Blog', EVENTS: 'Events' };

// Column names of your main "Startups" tab (same as your reference sheet).
const STARTUP_HEADERS = [
  'Startup Name', 'Tagline / Description', 'Competitive Edge', 'Headquarters', 'Founded In', 'Funding Amount',
  'Business Model', 'Founders', 'Sector', 'Team Size', 'Primary Competition', 'Key Investors', 'User Base',
  'Logo URL', 'Website URL', 'Featured', 'Status', 'Tags', 'Funding stage', 'Underlying Tech', 'Visible'
];
const ADMIN_ONLY = ['Featured', 'Status', 'Visible'];   // filled by this script, not by the person submitting

const SUBMISSION_HEADERS = ['Submission ID', 'Submitted At', 'Approve?', 'Moved to main sheet', 'Possible duplicate?',
  'Contact Email (private)', 'Submitter role'].concat(STARTUP_HEADERS.filter(function (h) { return ADMIN_ONLY.indexOf(h) < 0; }));
const FOUNDER_SUB_HEADERS = ['Submission ID', 'Startup Name', 'Founder Name', 'Role', 'LinkedIn URL', 'Bio'];
const BLOG_REVIEW_HEADERS = ['Approve?', 'Moved to main sheet', 'Found on', 'Score', 'Source', 'Title', 'Date', 'URL', 'Summary', 'Tag'];
const EVENTS_REVIEW_HEADERS = ['Approve?', 'Moved to main sheet', 'Found on', 'Source', 'Title', 'Date', 'Location', 'URL', 'Description'];
const SOURCES_HEADERS = ['Active', 'Type', 'Source Name', 'URL', 'Auto-publish', 'Use keyword filter'];

// Website form field → column in the Submissions tab
const FIELD_TO_HEADER = {
  name: 'Startup Name', description: 'Tagline / Description', competitive_edge: 'Competitive Edge', location: 'Headquarters',
  founded: 'Founded In', funding: 'Funding Amount', business_model: 'Business Model', sector: 'Sector', team_size: 'Team Size',
  competitors: 'Primary Competition', investors: 'Key Investors', user_base: 'User Base', logo_url: 'Logo URL',
  website: 'Website URL', tags: 'Tags', stage: 'Funding stage', tech: 'Underlying Tech'
};
const MAX_LEN = { description: 1500, competitive_edge: 800, business_model: 800, investors: 400, competitors: 400, tech: 300, tags: 300, logo_url: 300, website: 200, name: 120, location: 120, sector: 200 };

// What the daily feed reader looks for. You can also change these in the "Settings" tab.
const DEFAULT_SETTINGS = {
  include_keywords: 'startup, startups, founder, founders, funding, fundraise, seed round, series a, series b, venture capital, vc, angel investor, incubator, accelerator, unicorn, startup india, dpiit, sidbi, msme, government scheme, grant, ipo, d2c, saas, deeptech, fintech, healthtech, agritech, edtech, cleantech, climate tech',
  exclude_keywords: 'horoscope, astrology, bollywood, cricket, celebrity, recipe, giveaway, discount code, coupon, stock tips, sensex today, nifty today, gold rate, sponsored',
  min_keyword_matches: '2',
  blog_max_age_days: '21',
  max_items_per_source: '10',
  events_days_ahead: '120'
};

/* ================== 1. The website form sends data here ================== */

function doGet() {
  return out_({ ok: true, message: 'StartupHub form endpoint is live. Submissions must be sent with POST from your website.' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return out_({ ok: false, error: 'empty' });
    if (e.postData.contents.length > 60000) return out_({ ok: false, error: 'too large' });
    var d = JSON.parse(e.postData.contents);
    var problem = validate_(d);
    if (problem) { log_('Rejected submission', problem); return out_({ ok: false, error: problem }); }
    if (rateLimited_()) { log_('Rejected submission', 'too many submissions in one hour'); return out_({ ok: false, error: 'rate' }); }
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { saveSubmission_(d); } finally { lock.releaseLock(); }
    return out_({ ok: true });
  } catch (ex) {
    log_('doPost error', String(ex));
    return out_({ ok: false, error: 'server' });
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Keeps text safe for a spreadsheet: strips control characters and stops values from being read as formulas.
function clean_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (max) s = s.slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function validate_(d) {
  if (!d || typeof d !== 'object' || !d.startup || typeof d.startup !== 'object') return 'bad payload';
  if (d.consent !== true) return 'no consent';
  if (!(Number(d.elapsed_ms) >= 6000)) return 'too fast (likely a bot)';
  var s = d.startup;
  if (!clean_(s.name, 120)) return 'missing name';
  if (clean_(s.description, 1500).length < 40) return 'description too short';
  if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(String(s.website || '').trim())) return 'bad website';
  if (!clean_(s.location, 120)) return 'missing headquarters';
  if (!clean_(s.sector, 200)) return 'missing sector';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.contact_email || '').trim())) return 'bad email';
  if (!Array.isArray(d.founders) || !d.founders.length || !clean_(d.founders[0] && d.founders[0].name, 80)) return 'missing founder';
  return '';
}

// At most 40 submissions per hour. Beyond that, extra ones are ignored (spam protection).
function rateLimited_() {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 3700);
  return n > 40;
}

function saveSubmission_(d) {
  var ss = SpreadsheetApp.getActive();
  var sub = ss.getSheetByName(TAB.SUBMISSIONS), fsub = ss.getSheetByName(TAB.FOUNDERS_SUB);
  if (!sub || !fsub) throw new Error('Tabs missing. Run setup() once.');
  var id = Utilities.getUuid().slice(0, 8).toUpperCase();
  var s = d.startup, row = {};
  Object.keys(FIELD_TO_HEADER).forEach(function (k) { row[FIELD_TO_HEADER[k]] = clean_(s[k], MAX_LEN[k] || 100); });

  var founders = d.founders.slice(0, 5).map(function (f) {
    return { name: clean_(f.name, 80), role: clean_(f.role, 80), linkedin: clean_(f.linkedin, 200), bio: clean_(f.bio, 300) };
  }).filter(function (f) { return f.name; });
  row['Founders'] = founders.map(function (f) { return f.name; }).join(', ');

  var dup = '';
  var liveNames = namesIn_(openMain_().getSheetByName(MAIN.STARTUPS), 'Startup Name');
  var queued = namesIn_(sub, 'Startup Name');
  if (liveNames[nk_(row['Startup Name'])]) dup = 'Yes: already in the main sheet';
  else if (queued[nk_(row['Startup Name'])]) dup = 'Yes: already submitted';

  row['Submission ID'] = id;
  row['Submitted At'] = new Date();
  row['Approve?'] = false;
  row['Moved to main sheet'] = '';
  row['Possible duplicate?'] = dup;
  row['Contact Email (private)'] = clean_(d.contact_email, 160);
  row['Submitter role'] = clean_(d.submitter_role, 40);

  var heads = headers_(sub);
  sub.appendRow(heads.map(function (h) { return row[h] !== undefined ? row[h] : ''; }));
  var r = sub.getLastRow(), ac = heads.indexOf('Approve?') + 1;
  if (ac) sub.getRange(r, ac).insertCheckboxes().setValue(false);

  var fh = headers_(fsub);
  var fobj = founders.map(function (f) {
    var o = { 'Submission ID': id, 'Startup Name': row['Startup Name'], 'Founder Name': f.name, 'Role': f.role, 'LinkedIn URL': f.linkedin, 'Bio': f.bio };
    return fh.map(function (h) { return o[h] !== undefined ? o[h] : ''; });
  });
  if (fobj.length) fsub.getRange(fsub.getLastRow() + 1, 1, fobj.length, fh.length).setValues(fobj);

  if (NOTIFY_EMAIL) {
    try { MailApp.sendEmail(NOTIFY_EMAIL, 'New startup submitted: ' + row['Startup Name'], 'Open the Submissions tab of your Inbox sheet to review it.' + (dup ? '\nNote: ' + dup : '')); } catch (e2) { log_('Email failed', String(e2)); }
  }
}

/* ================== 2. Approvals (runs when you tick a checkbox) ================== */

function onApprovalEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet(), name = sh.getName();
  if (name !== TAB.SUBMISSIONS && name !== TAB.BLOG_REVIEW && name !== TAB.EVENTS_REVIEW) return;
  var heads = headers_(sh), ac = heads.indexOf('Approve?') + 1;
  if (!ac || e.range.getColumn() > ac || e.range.getLastColumn() < ac) return;       // the edit must include the Approve? column
  var first = Math.max(e.range.getRow(), 2), last = e.range.getLastRow();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    for (var r = first; r <= last; r++) {
      if (sh.getRange(r, ac).getValue() !== true) continue;
      try {
        if (name === TAB.SUBMISSIONS) approveStartup_(sh, r, heads);
        else approveFeed_(sh, r, heads, name === TAB.BLOG_REVIEW ? MAIN.BLOG : MAIN.EVENTS);
      } catch (ex) {
        sh.getRange(r, ac).setValue(false);
        toast_('Could not approve row ' + r + ': ' + ex.message);
        log_('Approval error (row ' + r + ')', String(ex));
      }
    }
  } finally { lock.releaseLock(); }
}

function approveStartup_(sh, row, heads) {
  var o = rowObject_(sh, row, heads);
  var movedCol = heads.indexOf('Moved to main sheet') + 1;
  if (String(o['Moved to main sheet']).trim()) { toast_('Row ' + row + ' was already moved to the main sheet.'); return; }
  if (!String(o['Startup Name']).trim()) throw new Error('Startup Name is empty');

  var main = openMain_();
  var ms = main.getSheetByName(MAIN.STARTUPS);
  if (!ms) throw new Error('The main sheet has no tab called "' + MAIN.STARTUPS + '"');
  var mh = headers_(ms);
  var byKey = {};
  Object.keys(o).forEach(function (h) { byKey[nk_(h)] = o[h]; });
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var outRow = mh.map(function (h) {
    var k = nk_(h);
    if (k === 'visible') return PUBLISH_ON_APPROVE ? 'yes' : 'no';
    if (k === 'featured') return 'No';
    if (k === 'status') return 'Active';
    if (k === 'added_on') return today;
    return byKey[k] !== undefined ? byKey[k] : '';
  });
  ms.appendRow(outRow);

  var mf = main.getSheetByName(MAIN.FOUNDERS), fsub = SpreadsheetApp.getActive().getSheetByName(TAB.FOUNDERS_SUB);
  var moved = 0;
  if (mf && fsub) {
    var fh = headers_(fsub), mfh = headers_(mf), data = fsub.getDataRange().getValues(), idIdx = fh.indexOf('Submission ID'), rows = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) !== String(o['Submission ID'])) continue;
      var f = {}; fh.forEach(function (h, j) { f[nk_(h)] = data[i][j]; });
      rows.push(mfh.map(function (h) { var k = nk_(h); return k === 'startup_name' ? o['Startup Name'] : (f[k] !== undefined ? f[k] : ''); }));
    }
    if (rows.length) { mf.getRange(mf.getLastRow() + 1, 1, rows.length, mfh.length).setValues(rows); moved = rows.length; }
  }
  sh.getRange(row, movedCol).setValue('Moved ' + today + (PUBLISH_ON_APPROVE ? ' (live)' : ' (Visible = no)'));
  toast_('Copied "' + o['Startup Name'] + '" and ' + moved + ' founder(s) to the main sheet' + (PUBLISH_ON_APPROVE ? ' (live).' : '. Set Visible = yes there to publish.'));
}

function approveFeed_(sh, row, heads, mainTab) {
  var o = rowObject_(sh, row, heads);
  var movedCol = heads.indexOf('Moved to main sheet') + 1;
  if (String(o['Moved to main sheet']).trim()) { toast_('Row ' + row + ' was already moved.'); return; }
  publishFeedRow_(o, mainTab);
  sh.getRange(row, movedCol).setValue('Moved ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  toast_('Published to the "' + mainTab + '" tab.');
}

function publishFeedRow_(o, mainTab) {
  var ms = openMain_().getSheetByName(mainTab);
  if (!ms) throw new Error('The main sheet has no tab called "' + mainTab + '"');
  var mh = headers_(ms), byKey = {};
  Object.keys(o).forEach(function (h) { byKey[nk_(h)] = o[h]; });
  ms.appendRow(mh.map(function (h) {
    var k = nk_(h);
    if (k === 'approved' || k === 'visible') return 'yes';
    return byKey[k] !== undefined ? byKey[k] : '';
  }));
}

/* ================== 3. Automatic blog + events (runs every morning) ================== */

function refreshFeeds() {
  var ss = SpreadsheetApp.getActive();
  var src = ss.getSheetByName(TAB.SOURCES);
  if (!src) { log_('refreshFeeds', 'No Sources tab. Run setup() first.'); return; }
  var cfg = settings_(ss), main = openMain_();
  var blogRev = ss.getSheetByName(TAB.BLOG_REVIEW), evRev = ss.getSheetByName(TAB.EVENTS_REVIEW);
  var seenBlog = urlSet_(blogRev, 'URL', urlSet_(main.getSheetByName(MAIN.BLOG), 'url', {}));
  var seenEv = eventKeySet_(evRev, eventKeySet_(main.getSheetByName(MAIN.EVENTS), {}));
  var rows = src.getDataRange().getValues(), h = rows[0].map(nk_);
  var col = function (n) { return h.indexOf(n); };
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var summary = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var active = yes_(r[col('active')]), type = String(r[col('type')]).trim().toUpperCase(), name = String(r[col('source_name')]).trim(), url = String(r[col('url')]).trim();
    if (!active || !url || /^PASTE/i.test(url) || (type !== 'RSS' && type !== 'ICS')) continue;
    var auto = yes_(r[col('auto_publish')]), useKw = yes_(r[col('use_keyword_filter')]);
    try {
      var text = fetch_(url), added = 0;
      if (type === 'RSS') {
        var parsed = parseRss_(text);
        if (!parsed.length) throw new Error('No articles found. Is this link an RSS feed?');
        added = handleBlogItems_(parsed, { name: name, auto: auto, useKw: useKw, cfg: cfg, rev: blogRev, seen: seenBlog, today: today });
      } else {
        if (text.indexOf('BEGIN:VCALENDAR') < 0) throw new Error('This link is not a calendar (.ics) feed.');
        added = handleEvents_(parseIcs_(text), { name: name, auto: auto, useKw: useKw, cfg: cfg, rev: evRev, seen: seenEv, today: today });
      }
      summary.push(name + ': ' + added + ' new');
    } catch (ex) {
      log_('Feed error: ' + name, String(ex));
      summary.push(name + ': ERROR');
    }
  }
  trim_(blogRev, 500, 200); trim_(evRev, 500, 200);
  log_('refreshFeeds finished', summary.join(' | ') || 'no active sources');
}

function fetch_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupHubFeedReader/1.0)' } });
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
  return res.getContentText();
}

function handleBlogItems_(items, p) {
  var maxAge = Number(p.cfg.blog_max_age_days) || 21, cap = Number(p.cfg.max_items_per_source) || 10, added = 0;
  for (var i = 0; i < items.length && added < cap; i++) {
    var it = items[i];
    if (!it.title || !it.url) continue;
    if (it.date && (Date.now() - it.date.getTime()) / 864e5 > maxAge) continue;
    var u = normUrl_(it.url);
    if (p.seen[u]) continue;
    var rel = relevance_(it.title + ' ' + it.summary, p.cfg);
    if (p.useKw && !rel.ok) continue;
    p.seen[u] = true;
    var obj = {
      'Approve?': false, 'Moved to main sheet': '', 'Found on': p.today, 'Score': rel.matches.length, 'Source': p.name, 'Title': it.title,
      'Date': it.date ? Utilities.formatDate(it.date, Session.getScriptTimeZone(), 'yyyy-MM-dd') : p.today, 'URL': it.url,
      'Summary': shorten_(it.summary, 220), 'Tag': tagFor_(it.title + ' ' + it.summary)
    };
    if (p.auto) { publishFeedRow_(obj, MAIN.BLOG); obj['Moved to main sheet'] = 'Auto-published ' + p.today; }
    addReviewRow_(p.rev, obj);
    added++;
  }
  return added;
}

function handleEvents_(events, p) {
  var ahead = Number(p.cfg.events_days_ahead) || 120, cap = Number(p.cfg.max_items_per_source) || 10, added = 0;
  var now = Date.now(), limit = now + ahead * 864e5;
  events.sort(function (a, b) { return a.ts - b.ts; });
  for (var i = 0; i < events.length && added < cap; i++) {
    var ev = events[i];
    if (!ev.title || !ev.ts || ev.ts < now - 864e5 || ev.ts > limit) continue;
    var key = nk_(ev.title) + '|' + ev.ymd;
    if (p.seen[key]) continue;
    if (p.useKw && !relevance_(ev.title + ' ' + ev.description, p.cfg, 1).ok) continue;
    p.seen[key] = true;
    var obj = { 'Approve?': false, 'Moved to main sheet': '', 'Found on': p.today, 'Source': p.name, 'Title': ev.title, 'Date': ev.ymd, 'Location': ev.location, 'URL': ev.url, 'Description': shorten_(ev.description, 220) };
    if (p.auto) { publishFeedRow_(obj, MAIN.EVENTS); obj['Moved to main sheet'] = 'Auto-published ' + p.today; }
    addReviewRow_(p.rev, obj);
    added++;
  }
  return added;
}

function addReviewRow_(sheet, obj) {
  var heads = headers_(sheet);
  sheet.appendRow(heads.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; }));
  var ac = heads.indexOf('Approve?') + 1;
  if (ac) sheet.getRange(sheet.getLastRow(), ac).insertCheckboxes().setValue(false);
}

// How relevant is a piece of text? Counts distinct include-keywords, rejects anything with an exclude-keyword.
function relevance_(text, cfg, minOverride) {
  var inc = list_(cfg.include_keywords), exc = list_(cfg.exclude_keywords), min = minOverride || Number(cfg.min_keyword_matches) || 2;
  var t = ' ' + String(text).toLowerCase() + ' ';
  var hit = function (k) { return new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])', 'i').test(t); };
  for (var i = 0; i < exc.length; i++) if (hit(exc[i])) return { ok: false, matches: [] };
  var matches = inc.filter(hit);
  return { ok: matches.length >= min, matches: matches };
}

function tagFor_(text) {
  var t = String(text).toLowerCase();
  var rules = [
    [/funding|raises?|raised|seed|series [a-d]|venture|angel|\bvc\b|ipo|valuation/, 'Funding'],
    [/scheme|dpiit|startup india|grant|sidbi|msme|policy|government|ministry/, 'Policy'],
    [/incubator|accelerator|cohort|demo day/, 'Programmes'],
    [/fintech|healthtech|agritech|edtech|cleantech|deeptech|saas|d2c|climate/, 'Sectors'],
    [/founder|co-founder/, 'Founders']
  ];
  for (var i = 0; i < rules.length; i++) if (rules[i][0].test(t)) return rules[i][1];
  return 'Ecosystem';
}

/* ----- feed readers (plain-text parsing, so one badly formed feed does not break the run) ----- */

function parseRss_(xml) {
  var items = [], re = /<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi, m;
  while ((m = re.exec(xml))) {
    var b = m[0], link = text_(tagContent_(b, 'link'));
    if (!link) { var lm = b.match(/<link[^>]*?\shref=["']([^"']+)["']/i); link = lm ? lm[1] : ''; }
    var date = tagContent_(b, 'pubDate') || tagContent_(b, 'published') || tagContent_(b, 'updated') || tagContent_(b, 'dc:date');
    var d = date ? new Date(text_(date)) : null;
    items.push({
      title: text_(tagContent_(b, 'title')), url: link.trim(), date: d && !isNaN(d.getTime()) ? d : null,
      summary: text_(tagContent_(b, 'description') || tagContent_(b, 'summary') || tagContent_(b, 'content')).replace(/\s*The post .{0,200}? appeared first on .*$/i, '')
    });
  }
  return items;
}

function tagContent_(block, name) {
  var m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? m[1] : '';
}

function text_(s) {
  var t = String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  t = decode_(t).replace(/<[^>]*>/g, ' ');
  return decode_(t).replace(/\s+/g, ' ').trim();
}

function decode_(s) {
  var named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&([a-z]+);/gi, function (all, n) { return named[n.toLowerCase()] !== undefined ? named[n.toLowerCase()] : all; });
}

function parseIcs_(text) {
  var lines = String(text).replace(/\r?\n[ \t]/g, '').split(/\r?\n/), events = [], cur = null;
  var unesc = function (v) { return String(v || '').replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').replace(/\s+/g, ' ').trim(); };
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (ln === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (ln === 'END:VEVENT') {
      if (cur) {
        var when = parseIcsDate_(cur.DTSTART || '');
        var desc = unesc(cur.DESCRIPTION), url = unesc(cur.URL);
        if (!url) { var um = desc.match(/https?:\/\/[^\s)>"]+/); url = um ? um[0] : ''; }
        if (when) events.push({ title: unesc(cur.SUMMARY), ts: when.ts, ymd: when.ymd, location: unesc(cur.LOCATION), url: url, description: desc });
      }
      cur = null; continue;
    }
    if (!cur) continue;
    var idx = ln.indexOf(':'); if (idx < 0) continue;
    cur[ln.slice(0, idx).split(';')[0].toUpperCase()] = ln.slice(idx + 1);
  }
  return events;
}

function parseIcsDate_(v) {
  var m = String(v).trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  if (m[7]) {                                       // UTC time: show the date in the script's time zone
    var dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
    return { ts: dt.getTime(), ymd: Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd') };
  }
  return { ts: Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0), 0), ymd: m[1] + '-' + m[2] + '-' + m[3] };
}

/* ================== One-time setup ================== */

function setup() {
  var ss = SpreadsheetApp.getActive();
  ensureTab_(ss, TAB.SUBMISSIONS, SUBMISSION_HEADERS);
  ensureTab_(ss, TAB.FOUNDERS_SUB, FOUNDER_SUB_HEADERS);
  var src = ensureTab_(ss, TAB.SOURCES, SOURCES_HEADERS);
  ensureTab_(ss, TAB.BLOG_REVIEW, BLOG_REVIEW_HEADERS);
  ensureTab_(ss, TAB.EVENTS_REVIEW, EVENTS_REVIEW_HEADERS);
  ensureTab_(ss, TAB.LOG, ['Time', 'What', 'Details']);
  var set = ensureTab_(ss, TAB.SETTINGS, ['Setting', 'Value']);

  if (set.getLastRow() < 2) {
    var kv = Object.keys(DEFAULT_SETTINGS).map(function (k) { return [k, DEFAULT_SETTINGS[k]]; });
    set.getRange(2, 1, kv.length, 2).setValues(kv);
  }
  if (src.getLastRow() < 2) {
    src.getRange(2, 1, 3, 6).setValues([
      ['yes', 'RSS', 'Inc42', 'https://inc42.com/feed/', 'no', 'yes'],
      ['yes', 'RSS', 'YourStory', 'https://yourstory.com/feed', 'no', 'yes'],
      ['no', 'ICS', 'Example event calendar (replace the link, then set Active to yes)', 'PASTE_CALENDAR_LINK_HERE', 'no', 'no']
    ]);
  }
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onApprovalEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('refreshFeeds').timeBased().everyDays(1).atHour(6).create();

  try { openMain_().getName(); } catch (e) { throw new Error('Setup finished, but the main sheet could not be opened. Check MAIN_SHEET_ID at the top of the script. ' + e.message); }
  toast_('Setup complete. Now deploy as a Web app (see the guide), then press Run on refreshFeeds to test the feeds.');
}

/* ================== Helpers ================== */

function openMain_() {
  if (!MAIN_SHEET_ID || /^PASTE/i.test(MAIN_SHEET_ID)) throw new Error('Set MAIN_SHEET_ID at the top of the script.');
  return SpreadsheetApp.openById(MAIN_SHEET_ID);
}
function ensureTab_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function headers_(sh) { return sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return String(h).trim(); }); }
function rowObject_(sh, row, heads) {
  var v = sh.getRange(row, 1, 1, heads.length).getValues()[0], o = {};
  heads.forEach(function (h, i) { o[h] = v[i]; });
  return o;
}
function nk_(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
function yes_(v) { return /^(yes|y|true|1)$/i.test(String(v).trim()); }
function list_(s) { return String(s || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean); }
function shorten_(s, n) { s = String(s || ''); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; }
function normUrl_(u) { return String(u).trim().toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, ''); }
function toast_(msg) { try { SpreadsheetApp.getActive().toast(msg, 'StartupHub', 8); } catch (e) {} }

function namesIn_(sh, header) {
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var i = headers_(sh).map(nk_).indexOf(nk_(header)); if (i < 0) return out;
  sh.getRange(2, i + 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) out[nk_(r[0])] = true; });
  return out;
}
function urlSet_(sh, header, into) {
  if (!sh || sh.getLastRow() < 2) return into;
  var i = headers_(sh).map(nk_).indexOf(nk_(header)); if (i < 0) return into;
  sh.getRange(2, i + 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) into[normUrl_(r[0])] = true; });
  return into;
}
function eventKeySet_(sh, into) {
  if (!sh || sh.getLastRow() < 2) return into;
  var h = headers_(sh).map(nk_), ti = h.indexOf('title'), di = h.indexOf('date'); if (ti < 0 || di < 0) return into;
  sh.getRange(2, 1, sh.getLastRow() - 1, h.length).getValues().forEach(function (r) {
    var d = r[di] instanceof Date ? Utilities.formatDate(r[di], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[di]);
    if (r[ti]) into[nk_(r[ti]) + '|' + d] = true;
  });
  return into;
}
function settings_(ss) {
  var cfg = {}, k;
  for (k in DEFAULT_SETTINGS) cfg[k] = DEFAULT_SETTINGS[k];
  var sh = ss.getSheetByName(TAB.SETTINGS);
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0] && String(r[1]).trim() !== '') cfg[nk_(r[0])] = String(r[1]); });
  return cfg;
}
function trim_(sh, maxRows, removeRows) { if (sh && sh.getLastRow() > maxRows) sh.deleteRows(2, removeRows); }
function log_(what, detail) {
  try {
    var sh = SpreadsheetApp.getActive().getSheetByName(TAB.LOG); if (!sh) return;
    sh.appendRow([new Date(), what, String(detail).slice(0, 500)]);
    if (sh.getLastRow() > 400) sh.deleteRows(2, 150);
  } catch (e) {}
}
