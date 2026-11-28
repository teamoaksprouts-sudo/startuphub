/* StartupDuniya community (core): sign up / log in, profiles, feed, events & Google Meet posts, members. Needs sql/community-schema.sql + js/community-config.js. */
(() => {
  const app = document.getElementById("app"), C = window.COMMUNITY || {};
  const esc = (s) => U.esc(s == null ? "" : s);
  const ROLES = ["Founder", "Co-founder", "Angel investor", "VC / fund", "Mentor / advisor", "Incubator / accelerator", "Govt / policy", "Service provider", "Student / aspirant", "Other"];
  const KINDS = { idea: ["Idea", "#7c4dff"], question: ["Question", "#2f80ed"], looking_for: ["Looking for", "#f5a200"], win: ["Win", "#22a559"], event: ["Event", "#00a99d"], meeting: ["Meeting", "#ff6b1a"] };
  const NEEDS = ["Funding", "Hiring", "Mentorship", "Customers", "Partnerships", "Co-founder", "Advice"];
  const note = (t, bad) => `<p class="cm-note${bad ? " bad" : ""}" role="status">${esc(t)}</p>`;
  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) { app.innerHTML = note("The community is being set up. Please check back soon."); return; }
  const sb = supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  let user = null, me = null, view = "feed", kind = "", q = "", role = "", authMode = "signup";
  const fd = (f) => Object.fromEntries(new FormData(f));
  const https = (v) => (v && !/^https?:\/\//i.test(v) ? "https://" + v : v || "");
  const clean = (s) => String(s || "").replace(/[%,()*]/g, " ").trim();
  const when = (iso) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) + " IST";
  const ago = (iso) => { const m = (Date.now() - new Date(iso)) / 6e4; return m < 60 ? Math.max(1, m | 0) + "m ago" : m < 1440 ? ((m / 60) | 0) + "h ago" : ((m / 1440) | 0) + "d ago"; };
  const ini = (n) => (String(n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
  const tick = (v) => (v ? ' <span class="cm-tick" title="Verified by StartupDuniya">✓</span>' : "");
  const opts = (arr, sel) => arr.map((r) => `<option${r === sel ? " selected" : ""}>${esc(r)}</option>`).join("");
  const msg = (f, t, bad) => { let m = f.querySelector(".cm-note"); if (!m) { m = document.createElement("p"); f.appendChild(m); } m.className = "cm-note" + (bad ? " bad" : ""); m.textContent = t; };

  /* ---------- logged out ---------- */
  async function gate() {
    let s = {}; try { s = (await sb.rpc("community_stats")).data || {}; } catch (e) {}
    const n = (k, l) => `<div class="stat"><b>${+s[k] || 0}</b><span>${l}</span></div>`;
    app.innerHTML = `<div class="cm-gate"><div><div class="cm-stats">${n("members", "Members")}${n("posts", "Posts")}${n("upcoming", "Upcoming meetings")}</div>
      <ul class="cm-list"><li>Post ideas, questions and wins</li><li>List events and meetings, with Google Meet links</li><li>Find founders, investors and mentors</li></ul>
      <p class="cm-small">Free to join. Posts and members are visible to logged-in members only.</p></div><div class="panel cm-auth" id="auth"></div></div>`;
    auth();
  }
  function auth() {
    const box = document.getElementById("auth"); if (!box) return;
    const g = `<button class="btn btn-ghost" type="button" data-act="google">Continue with Google</button><p class="cm-or">or</p>`;
    const sw = (m, t) => `<button type="button" class="cm-link" data-act="mode" data-m="${m}">${t}</button>`;
    if (authMode === "login") box.innerHTML = `<h2>Log in</h2>${g}<form class="stack" data-f="login"><input name="email" type="email" required placeholder="Email" autocomplete="email"><input name="password" type="password" required placeholder="Password" autocomplete="current-password"><button class="btn btn-solid">Log in</button></form><p class="cm-small">${sw("reset", "Forgot password?")} · ${sw("signup", "Create an account")}</p>`;
    else if (authMode === "reset") box.innerHTML = `<h2>Reset password</h2><form class="stack" data-f="reset"><input name="email" type="email" required placeholder="Your email"><button class="btn btn-solid">Send reset link</button></form><p class="cm-small">${sw("login", "Back to log in")}</p>`;
    else if (authMode === "newpass") box.innerHTML = `<h2>Choose a new password</h2><form class="stack" data-f="newpass"><input name="password" type="password" minlength="8" required placeholder="New password (8+ characters)" autocomplete="new-password"><button class="btn btn-solid">Save password</button></form>`;
    else box.innerHTML = `<h2>Join the community</h2>${g}<form class="stack" data-f="signup"><input name="full_name" required minlength="2" maxlength="80" placeholder="Full name" autocomplete="name"><input name="email" type="email" required placeholder="Email" autocomplete="email"><input name="password" type="password" minlength="8" required placeholder="Password (8+ characters)" autocomplete="new-password">
      <select name="role" required><option value="">I am a…</option>${opts(ROLES)}</select><input name="job_title" maxlength="100" placeholder="Job title (e.g. CEO)"><input name="company" maxlength="100" placeholder="Startup or company"><input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="cm-check"><input type="checkbox" name="agree" required> I agree to the <a href="legal.html#terms" target="_blank">Terms</a> and <a href="legal.html#privacy" target="_blank">Privacy Policy</a>.</label><button class="btn btn-solid">Create account</button></form><p class="cm-small">Already a member? ${sw("login", "Log in")}</p>`;
  }

  /* ---------- profile form (also shown after Google sign-in) ---------- */
  function profileForm(first) {
    const m = me || {}, ck = (arr, v) => (arr || []).includes(v) ? " checked" : "";
    const boxes = (name, arr) => NEEDS.map((v) => `<label class="cm-check"><input type="checkbox" name="${name}" value="${v}"${ck(arr, v)}> ${v}</label>`).join("");
    app.innerHTML = `${first ? "" : tabs()}<div class="panel cm-narrow"><h2>${first ? "Finish your profile" : "My profile"}</h2><form class="stack" data-f="profile">
      <input name="full_name" required minlength="2" maxlength="80" placeholder="Full name" value="${esc(m.full_name)}">
      <select name="role" required><option value="">I am a…</option>${opts(ROLES, m.role)}</select>
      <input name="job_title" maxlength="100" placeholder="Job title" value="${esc(m.job_title)}"><input name="company" maxlength="100" placeholder="Startup or company" value="${esc(m.company)}"><input name="city" maxlength="60" placeholder="City" value="${esc(m.city)}">
      <textarea name="bio" maxlength="400" placeholder="Short bio (400 characters)">${esc(m.bio)}</textarea>
      <input name="linkedin" placeholder="LinkedIn profile link" value="${esc(m.linkedin)}"><input name="website" placeholder="Company website" value="${esc(m.website)}">
      <input name="phone" type="tel" placeholder="Phone (optional)" value="${esc(m.phone)}"><label class="cm-check"><input type="checkbox" name="show_phone"${m.phone_public ? " checked" : ""}> Show my phone number to other members (off by default)</label>
      <fieldset><legend>I'm looking for</legend>${boxes("looking_for", m.looking_for)}</fieldset><fieldset><legend>I can offer</legend>${boxes("can_offer", m.can_offer)}</fieldset>
      <button class="btn btn-solid">Save profile</button></form>
      ${first ? `<p class="cm-small"><button class="cm-link" data-act="out">Log out</button></p>` : `<p class="cm-small"><button class="cm-link" data-act="out">Log out</button> · <button class="cm-link" data-act="delacct">Delete my account</button></p>`}</div>`;
  }

  /* ---------- logged in: feed / members ---------- */
  const tabs = () => `<div class="cm-bar"><div class="tabs">${[["feed", "Feed"], ["members", "Members"], ["me", "My profile"]].map(([k, l]) => `<button class="tab${view === k ? " on" : ""}" data-act="view" data-v="${k}">${l}</button>`).join("")}</div>${view === "feed" ? `<button class="btn btn-solid btn-sm" data-act="compose">New post</button>` : ""}</div>`;
  function shell() {
    if (view === "me") return profileForm(false);
    app.innerHTML = tabs() + `<div id="compose"></div><div class="cm-filters">${view === "feed" ? `<div class="chips">${[["", "All"], ...Object.entries(KINDS).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="chip cm-f${kind === k ? " on" : ""}" data-act="kind" data-k="${k}">${l}</button>`).join("")}</div>` : `<select id="role"><option value="">All roles</option>${opts(ROLES, role)}</select>`}
      <input id="q" type="search" placeholder="${view === "feed" ? "Search posts" : "Search name or company"}" value="${esc(q)}"></div><div id="list" class="${view === "feed" ? "cm-feed" : "grid g3"}">${note("Loading…")}</div>`;
    view === "feed" ? feed() : members();
  }
  function composer() {
    const c = document.getElementById("compose"); if (c.innerHTML) { c.innerHTML = ""; return; }
    c.innerHTML = `<form class="stack panel" data-f="post"><select name="kind" required>${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("")}</select><input name="title" required minlength="3" maxlength="140" placeholder="Title"><textarea name="body" maxlength="3000" placeholder="Details"></textarea>
      <div class="cm-when" hidden><label>Date and time (India time)<input type="datetime-local" name="starts_at"></label><input name="place" maxlength="160" placeholder="Place (for in-person events)"><input name="link" placeholder="Meeting or event link (https://…)"><a class="cm-small" href="https://meet.google.com/new" target="_blank" rel="noopener">Create a Google Meet, then paste its link above</a></div><button class="btn btn-solid">Post</button></form>`;
  }
  const calUrl = (p) => { const f = (d) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, ""), s = new Date(p.starts_at); return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(p.title) + "&dates=" + f(s) + "/" + f(+s + 36e5) + "&details=" + encodeURIComponent((p.body || "").slice(0, 500) + "\n" + (p.link || "")) + "&location=" + encodeURIComponent(p.link || p.place || ""); };
  async function feed() {
    let qy = sb.from("posts").select("*, profiles(full_name,role,job_title,company,verified), likes(count), comments(count)").limit(50);
    if (kind) qy = qy.eq("kind", kind);
    qy = kind === "event" || kind === "meeting" ? qy.gte("starts_at", new Date(Date.now() - 72e5).toISOString()).order("starts_at", { ascending: true }) : qy.order("created_at", { ascending: false });
    if (clean(q)) qy = qy.or(`title.ilike.%${clean(q)}%,body.ilike.%${clean(q)}%`);
    const { data, error } = await qy, el = document.getElementById("list"); if (!el) return;
    if (error) return (el.innerHTML = note("Could not load posts: " + error.message, 1));
    if (!data.length) return (el.innerHTML = note("Nothing here yet. Be the first to post."));
    const mine = new Set(((await sb.from("likes").select("post_id").eq("user_id", user.id).in("post_id", data.map((p) => p.id))).data || []).map((x) => x.post_id));
    el.innerHTML = data.map((p) => { const k = KINDS[p.kind] || ["Post", "#14172e"], a = p.profiles || {}, ev = p.starts_at && (p.kind === "event" || p.kind === "meeting");
      return `<article class="card cm-post" style="--c:${k[1]}" data-id="${p.id}"><div class="cm-meta"><span class="cm-av">${esc(ini(a.full_name))}</span><div><b>${esc(a.full_name)}</b>${tick(a.verified)}<br><span class="cm-small">${esc([a.job_title, a.company].filter(Boolean).join(", ") || a.role)} · ${ago(p.created_at)}</span></div><span class="cm-kind">${k[0]}</span></div>
        <h3>${esc(p.title)}</h3>${p.body ? `<p class="cm-body">${esc(p.body)}</p>` : ""}
        ${ev ? `<div class="cm-event"><b>${when(p.starts_at)}</b>${p.place ? ` · ${esc(p.place)}` : ""}<div class="cm-acts">${p.link ? `<a class="btn btn-sm btn-solid" href="${esc(U.safeUrl(p.link))}" target="_blank" rel="noopener">${p.kind === "meeting" ? "Join on Google Meet" : "Open link"}</a>` : ""}<a class="btn btn-sm btn-ghost" href="${esc(calUrl(p))}" target="_blank" rel="noopener">Add to Google Calendar</a></div></div>` : ""}
        <div class="cm-acts"><button class="cm-btn${mine.has(p.id) ? " on" : ""}" data-act="like" data-id="${p.id}">♥ <i>${(p.likes[0] || {}).count || 0}</i></button><button class="cm-btn" data-act="comments" data-id="${p.id}">Comments (${(p.comments[0] || {}).count || 0})</button><button class="cm-btn" data-act="report" data-id="${p.id}">Report</button>${p.author === user.id ? `<button class="cm-btn" data-act="del" data-id="${p.id}">Delete</button>` : ""}</div><div class="cm-comments"></div></article>`; }).join("");
  }
  async function comments(card) {
    const box = card.querySelector(".cm-comments"); if (box.innerHTML) { box.innerHTML = ""; return; }
    box.innerHTML = note("Loading…");
    const { data } = await sb.from("comments").select("*, profiles(full_name)").eq("post_id", card.dataset.id).order("created_at");
    box.innerHTML = (data || []).map((c) => `<div class="cm-c"><b>${esc((c.profiles || {}).full_name)}</b> <span class="cm-small">${ago(c.created_at)}</span>${c.author === user.id ? ` <button class="cm-link" data-act="delc" data-id="${c.id}">delete</button>` : ""}<p class="cm-body">${esc(c.body)}</p></div>`).join("") + `<form class="cm-cf" data-f="comment"><input name="body" required maxlength="1000" placeholder="Write a comment"><button class="btn btn-sm btn-solid">Send</button></form>`;
  }
  async function members() {
    let qy = sb.from("profiles").select("id,full_name,role,job_title,company,city,bio,looking_for,can_offer,linkedin,website,phone_public,verified").neq("role", "").order("created_at", { ascending: false }).limit(60);
    if (role) qy = qy.eq("role", role);
    if (clean(q)) qy = qy.or(`full_name.ilike.%${clean(q)}%,company.ilike.%${clean(q)}%`);
    const { data, error } = await qy, el = document.getElementById("list"); if (!el) return;
    if (error) return (el.innerHTML = note("Could not load members: " + error.message, 1));
    el.innerHTML = data.length ? data.map((m) => `<article class="card"><div class="cm-meta"><span class="cm-av">${esc(ini(m.full_name))}</span><div><b>${esc(m.full_name)}</b>${tick(m.verified)}<br><span class="cm-small">${esc([m.job_title, m.company].filter(Boolean).join(", "))}</span></div></div>
      <p><span class="chip">${esc(m.role)}</span>${m.city ? ` <span class="chip plain">${esc(m.city)}</span>` : ""}</p>${m.bio ? `<p class="cm-body">${esc(m.bio)}</p>` : ""}
      ${(m.looking_for || []).length ? `<p class="cm-small">Looking for: ${esc(m.looking_for.join(", "))}</p>` : ""}${(m.can_offer || []).length ? `<p class="cm-small">Can offer: ${esc(m.can_offer.join(", "))}</p>` : ""}
      <p class="cm-links">${m.linkedin ? `<a href="${esc(U.safeUrl(m.linkedin))}" target="_blank" rel="noopener">LinkedIn</a>` : ""}${m.website ? `<a href="${esc(U.safeUrl(m.website))}" target="_blank" rel="noopener">Website</a>` : ""}${m.phone_public ? `<a href="tel:${esc(m.phone_public.replace(/[^\d+]/g, ""))}">${esc(m.phone_public)}</a>` : ""}</p></article>`).join("") : note("No members match.");
  }

  /* ---------- events ---------- */
  const here = () => location.origin + location.pathname;
  const handlers = {
    async signup(f) { const d = fd(f); if (d.website) return; msg(f, "Creating your account…");
      const { data, error } = await sb.auth.signUp({ email: d.email, password: d.password, options: { emailRedirectTo: here(), data: { full_name: d.full_name, role: d.role, job_title: d.job_title, company: d.company } } });
      if (error) return msg(f, error.message, 1);
      if (!data.session) f.outerHTML = `<h3>Check your email</h3><p>We sent a verification link to ${esc(d.email)}. Click it and you are in.</p>`; },
    async login(f) { const d = fd(f); msg(f, "Logging in…"); const { error } = await sb.auth.signInWithPassword({ email: d.email, password: d.password }); if (error) msg(f, error.message, 1); },
    async reset(f) { const { error } = await sb.auth.resetPasswordForEmail(fd(f).email, { redirectTo: here() }); msg(f, error ? error.message : "If that email has an account, a reset link is on its way.", !!error); },
    async newpass(f) { const { error } = await sb.auth.updateUser({ password: fd(f).password }); if (error) return msg(f, error.message, 1); authMode = "login"; boot((await sb.auth.getSession()).data.session); },
    async profile(f) { const d = fd(f), g = (n) => [...f.querySelectorAll(`[name=${n}]:checked`)].map((x) => x.value); msg(f, "Saving…");
      const row = { full_name: d.full_name.trim(), role: d.role, job_title: d.job_title.trim(), company: d.company.trim(), city: d.city.trim(), bio: d.bio.trim(), linkedin: https(d.linkedin.trim()), website: https(d.website.trim()), phone_public: d.show_phone ? d.phone.trim() : "", looking_for: g("looking_for"), can_offer: g("can_offer") };
      const a = await sb.from("profiles").update(row).eq("id", user.id), b = await sb.from("private_info").upsert({ id: user.id, phone: d.phone.trim() });
      if (a.error || b.error) return msg(f, (a.error || b.error).message, 1);
      me = { ...me, ...row, phone: d.phone.trim() }; view = "feed"; shell(); },
    async post(f) { const d = fd(f), ev = d.kind === "event" || d.kind === "meeting", link = https((d.link || "").trim());
      if (ev && !d.starts_at) return msg(f, "Please add a date and time.", 1);
      if (d.kind === "meeting" && !/^https:\/\/meet\.google\.com\//.test(link)) return msg(f, "A meeting needs a Google Meet link (meet.google.com/…).", 1);
      msg(f, "Posting…");
      const { error } = await sb.from("posts").insert({ kind: d.kind, title: d.title.trim(), body: (d.body || "").trim(), starts_at: ev ? new Date(d.starts_at + ":00+05:30").toISOString() : null, place: ev ? (d.place || "").trim() : "", link: ev ? link : "" });
      if (error) return msg(f, error.message, 1); document.getElementById("compose").innerHTML = ""; feed(); },
    async comment(f) { const card = f.closest(".cm-post"), { error } = await sb.from("comments").insert({ post_id: +card.dataset.id, body: fd(f).body.trim() }); if (error) return msg(f, error.message, 1); card.querySelector(".cm-comments").innerHTML = ""; await comments(card); }
  };
  const acts = {
    google: () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: here() } }),
    mode: (b) => { authMode = b.dataset.m; auth(); },
    out: () => sb.auth.signOut(),
    view: (b) => { view = b.dataset.v; q = ""; role = ""; shell(); },
    kind: (b) => { kind = b.dataset.k; shell(); },
    compose: composer,
    async like(b) { const id = +b.dataset.id, on = b.classList.contains("on"), n = b.querySelector("i");
      const { error } = on ? await sb.from("likes").delete().eq("post_id", id).eq("user_id", user.id) : await sb.from("likes").insert({ post_id: id });
      if (!error) { b.classList.toggle("on"); n.textContent = Math.max(0, +n.textContent + (on ? -1 : 1)); } },
    comments: (b) => comments(b.closest(".cm-post")),
    async report(b) { const r = prompt("Why are you reporting this? (optional)"); if (r === null) return; await sb.from("reports").insert({ post_id: +b.dataset.id, reason: r.slice(0, 300) }); b.textContent = "Reported"; b.disabled = true; },
    async del(b) { if (confirm("Delete this post?")) { await sb.from("posts").delete().eq("id", +b.dataset.id); feed(); } },
    async delc(b) { if (confirm("Delete this comment?")) { const card = b.closest(".cm-post"); await sb.from("comments").delete().eq("id", +b.dataset.id); card.querySelector(".cm-comments").innerHTML = ""; comments(card); } },
    async delacct() { if (confirm("Delete your account and everything you posted? This cannot be undone.")) { await sb.rpc("delete_my_account"); await sb.auth.signOut(); } }
  };
  app.addEventListener("submit", (e) => { const f = e.target.closest("form[data-f]"); if (!f) return; e.preventDefault(); const fn = handlers[f.dataset.f]; if (fn) fn(f).catch?.((x) => msg(f, x.message, 1)); });
  app.addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b && acts[b.dataset.act]) { e.preventDefault(); acts[b.dataset.act](b); } });
  app.addEventListener("change", (e) => { if (e.target.name === "kind" && e.target.form) e.target.form.querySelector(".cm-when").hidden = !/event|meeting/.test(e.target.value); if (e.target.id === "role") { role = e.target.value; shell(); } });
  let tm; app.addEventListener("input", (e) => { if (e.target.id === "q") { clearTimeout(tm); tm = setTimeout(() => { q = e.target.value; view === "feed" ? feed() : members(); }, 350); } });

  /* ---------- boot ---------- */
  async function boot(session) {
    if (!session) { user = me = null; return gate(); }
    user = session.user; app.innerHTML = note("Loading…");
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!data) return (app.innerHTML = note("We could not load your profile. Please refresh.", 1));
    me = data; me.phone = ((await sb.from("private_info").select("phone").eq("id", user.id).maybeSingle()).data || {}).phone || "";
    if (!me.role) profileForm(true); else if (me.banned) app.innerHTML = note("This account is not allowed to use the community.", 1); else shell();
  }
  sb.auth.onAuthStateChange((ev, s) => setTimeout(() => { if (s && user && s.user.id === user.id && ev !== "PASSWORD_RECOVERY") return; /* ignore silent token refreshes */ if (ev === "PASSWORD_RECOVERY") { user = null; app.innerHTML = '<div class="panel cm-auth cm-narrow" id="auth"></div>'; authMode = "newpass"; auth(); } else boot(s); }, 0));
})();
