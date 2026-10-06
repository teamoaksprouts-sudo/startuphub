/* Shared header, footer, helpers. Runs on every page. */
(function () {
  const S = window.SITE, D = window.DIRS;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^(https?:|mailto:|tel:|#|[\w./-]+\.html)/i.test(u || "") ? u : "");
  const initials = (n) => String(n).replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  window.U = { $, esc, safeUrl, initials };

  const ICON = {
    linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.75 9.75h3.8v1.55h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.63 4.75 6.05V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.69V21h-4z"/>',
    twitter: '<path d="M18.9 3H22l-7.2 8.2L23 21h-6.6l-5.1-6.7L5.4 21H2.3l7.7-8.8L1.9 3h6.8l4.6 6.1zm-1.2 16.1h1.7L7.3 4.8H5.5z"/>',
    instagram: '<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.3 5.7a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z"/>',
    facebook: '<path d="M13.5 22v-8h2.7l.5-3.3h-3.2V8.6c0-1 .4-1.7 1.8-1.7h1.5V4.1A19 19 0 0 0 14.1 4c-2.6 0-4.3 1.6-4.3 4.4v2.3H7v3.3h2.8v8z"/>',
    youtube: '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>',
    discord: '<path d="M19.5 5.3A16 16 0 0 0 15.6 4l-.2.4a14 14 0 0 1 3.4 1.7 14 14 0 0 0-11.6 0A14 14 0 0 1 10.6 4.4L10.4 4a16 16 0 0 0-3.9 1.3C4 9 3.3 12.6 3.6 16.2a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11.4 11.4 0 0 0 9.6 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.4-4.2-.7-7.8-2.9-10.9zM9.3 14c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8zm5.4 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8z"/>',
    blog: '<path d="M4 4h16v4H4zM4 10h10v2H4zM4 14h16v2H4zM4 18h10v2H4z"/>',
    whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7a11 11 0 0 1-4.5-4c-.8-1.1-1.4-2.3-1.4-3.4s.6-1.6.8-1.9c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/>',
    mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7 8-5H4zm0 2L4 9v8h16V9z"/>',
    phone: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1z"/>',
    pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
    search: '<path d="M10 2a8 8 0 1 0 5 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/>',
    arrow: '<path d="M5 11h11.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H5z"/>',
    ext: '<path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H6v11h11v-5h2v7H4V5z"/>'
  };
  const svg = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${ICON[n] || ""}</svg>`;
  window.U.svg = svg;

  /* ------------------------------ HEADER ------------------------------ */
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const nav = [
    { t: "Directories", mega: true },
    { t: "Solutions", href: "solutions.html" },
    { t: "Benefits", href: "benefits.html" },
    { t: "Pricing", href: "pricing.html" },
    { t: "Events", href: "events.html" },
    { t: "Blog", href: "blog.html" },
    { t: "About", href: "about.html" }
  ];

  function header() {
    const mega = Object.entries(D).map(([k, v]) =>
      `<a href="directory.html?type=${k}" style="--c:${v.color}"><i></i><span><b>${esc(v.label)}</b><small>${esc(v.blurb)}</small></span></a>`).join("");
    const links = nav.map((n) => n.mega
      ? `<div class="has-mega"><button class="nav-link" aria-expanded="false" aria-haspopup="true">${n.t}<svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button><div class="mega">${mega}</div></div>`
      : `<a class="nav-link${page === n.href ? " on" : ""}" href="${n.href}">${n.t}</a>`).join("");
    const addUrl = /^PASTE_/i.test(S.addStartupForm) ? "contact.html" : S.addStartupForm;
    return `<header class="site-header" id="top">
      <div class="wrap bar">
        <a class="brand" href="index.html" aria-label="${esc(S.name)} home"><span class="mark"><i></i><i></i><i></i><i></i></span>${esc(S.logoText)}</a>
        <nav class="nav" id="nav" aria-label="Main">${links}
          <a class="btn btn-sm btn-ghost nav-cta-m" href="${esc(addUrl)}" target="_blank" rel="noopener">Add your startup</a></nav>
        <div class="bar-right">
          <a class="btn btn-sm btn-solid hide-m" href="${esc(addUrl)}" target="_blank" rel="noopener">Add your startup</a>
          <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div></header>`;
  }

  /* ------------------------------ FOOTER ------------------------------ */
  function footer() {
    const c = S.contact, s = S.social, hide = S.hideEmptyContacts;
    const item = (icon, label, val, href) => {
      if (!val && hide) return "";
      return val
        ? `<li><a href="${esc(safeUrl(href))}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener"' : ""}>${svg(icon)}<span>${esc(val)}</span></a></li>`
        : `<li class="is-empty" title="Add this in js/config.js → contact.${label}">${svg(icon)}<span>Add your ${label} (js/config.js)</span></li>`;
    };
    const social = ["linkedin", "twitter", "instagram", "facebook", "youtube", "discord", "blog"].map((k) => {
      if (!s[k] && hide) return "";
      return s[k]
        ? `<a href="${esc(safeUrl(s[k]))}" target="_blank" rel="noopener" aria-label="${k}" class="soc">${svg(k)}</a>`
        : `<span class="soc is-empty" title="Add your ${k} link in js/config.js → social.${k}" aria-label="${k} (not set)">${svg(k)}</span>`;
    }).join("");
    const wa = c.whatsapp ? "https://wa.me/" + String(c.whatsapp).replace(/\D/g, "") : "";
    const col = (title, links) => `<div class="fcol"><h4>${title}</h4><ul>${links.map((l) => `<li><a href="${l[1]}">${l[0]}</a></li>`).join("")}</ul></div>`;
    const dirLinks = Object.entries(D).map(([k, v]) => [v.label, "directory.html?type=" + k]);

    return `<footer class="site-footer"><div class="wrap">
      <div class="ftop">
        <div class="fbrand">
          <a class="brand" href="index.html"><span class="mark"><i></i><i></i><i></i><i></i></span>${esc(S.logoText)}</a>
          <p>${esc(S.description)}</p>
          <div class="socials">${social}</div>
        </div>
        ${col("Company", [["About", "about.html"], ["Events", "events.html"], ["Team", "about.html#team-section"], ["FAQ", "faq.html"], ["Contact", "contact.html"]])}
        ${col("Directories", dirLinks)}
        ${col("Resources", [["Blog", "blog.html"], ["Benefits", "benefits.html"], ["Pricing", "pricing.html"], ["Solutions", "solutions.html"], ["Terms", "legal.html#terms"], ["Privacy", "legal.html#privacy"]])}

        <!-- ============== CONTACT DETAILS: edit in js/config.js → contact { email, phone, whatsapp, address } ============== -->
        <div class="fcol fcontact"><h4>Get in touch</h4><ul>
          ${item("mail", "email", c.email, c.email ? "mailto:" + c.email : "")}
          ${item("phone", "phone", c.phone, c.phone ? "tel:" + c.phone.replace(/\s/g, "") : "")}
          ${item("whatsapp", "whatsapp", c.whatsapp ? "Chat on WhatsApp" : "", wa)}
          ${item("pin", "address", c.address, "")}
        </ul></div>
        <!-- ============== /CONTACT DETAILS ============== -->
      </div>
      <div class="fbot"><span>© ${new Date().getFullYear()} ${esc(S.copyrightName)}. All rights reserved.</span>
        <a href="#top" class="totop">Back to top</a></div>
    </div></footer>`;
  }

  /* ------------------------------ BOOT ------------------------------ */
  document.title = (document.title && !/^\s*$/.test(document.title) ? document.title + " · " : "") + S.name;
  document.body.insertAdjacentHTML("afterbegin", header());
  document.body.insertAdjacentHTML("beforeend", footer());

  const burger = $("#burger"), navEl = $("#nav");
  burger.addEventListener("click", () => {
    const open = navEl.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    document.body.classList.toggle("lock", open);
  });
  document.querySelectorAll(".has-mega > button").forEach((b) => b.addEventListener("click", (e) => {
    const p = b.parentElement; const o = p.classList.toggle("open"); b.setAttribute("aria-expanded", o); e.stopPropagation();
  }));
  document.addEventListener("click", () => document.querySelectorAll(".has-mega.open").forEach((p) => p.classList.remove("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".has-mega.open").forEach((p) => p.classList.remove("open")); });

  const hdr = $(".site-header");
  const onScroll = () => hdr.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* Notice banner when still on sample data */
  if (!Data.isConfigured()) {
    document.body.insertAdjacentHTML("afterbegin", '<div class="sample-bar">Showing sample data. Connect your Google Sheet in <code>js/config.js</code> to show your own.</div>');
  }
})();
