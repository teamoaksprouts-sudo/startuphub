/* =====================================================================
   SITE CONFIG  —  the ONLY file you need to edit for day-to-day setup
   ===================================================================== */
window.SITE = {

  /* ---------- 1. BRAND ---------- */
  name: "StartupHub",                       // <-- your site name
  tagline: "Startup informed. Startup smart.",
  description: "Discover startups, angel investors, VCs, incubators, government schemes and banks in one place.",
  logoText: "StartupHub",                   // text logo (replace with an <img> later if you like)

  /* ---------- 2. GOOGLE SHEET (your database) ----------
     Paste ONLY the ID from your sheet URL:
     https://docs.google.com/spreadsheets/d/  <THIS_PART>  /edit
     The sheet must be shared as: "Anyone with the link → Viewer".
     While this still says PASTE_..., the site shows built-in SAMPLE data. */
  sheetId: "1e6JfT_T0D06NS1Vl1zL84VuEexltGj7fjmT6NOlHocs",

  /* Tab names inside that sheet (must match exactly, case-sensitive) */
  tabs: {
    startups:    "Startups",
    angels:      "Angels",
    vcs:         "VCs",
    incubators:  "Incubators",
    govt:        "GovtSchemes",
    banks:       "Banks",
    blog:        "Blog",
    events:      "Events",
    benefits:    "Benefits",
    clients:     "Clients",
    team:        "Team",
    faq:         "FAQ"
  },

  /* How long (minutes) a visitor's browser keeps data before re-reading the sheet */
  cacheMinutes: 5,

  /* ---------- 3. LINKS YOU MUST ADD ---------- */
  addStartupForm: "https://forms.gle/LvMYvoicmQQVG3Q29",   // "Add your startup" form (see README step 3)

  /* Newsletter (optional). Leave action empty to hide the form. See README "Newsletter". */
  newsletter: { action: "", emailField: "entry.0000000000" },

  /* Contact page form (optional). Free option: https://formspree.io  -> paste endpoint */
  contactFormAction: "",

  /* ---------- 4. FOOTER: CONTACT DETAILS  (ADD YOURS HERE) ----------
     Leave a value as "" and it shows as a dimmed placeholder in the footer.
     When you are ready to launch, set hideEmptyContacts to true to hide blanks. */
  hideEmptyContacts: true,

  contact: {
    email:    "team.oaksprouts@gmail.com",     // e.g. "hello@yourdomain.com"
    phone:    "+91 77889 90390",     // e.g. "+91 98765 43210"
    whatsapp: "917788990390",     // digits only with country code, e.g. "919876543210"
    address:  "101, Aairah Terrazo,17, Shankar Sheth Road,Pune 411002"      // e.g. "Pune, Maharashtra, India"
  },

  /* ---------- 5. FOOTER: SOCIAL LINKS (ADD YOURS HERE) ----------
     Paste the full profile URL, e.g. "https://www.linkedin.com/company/yourpage" */
  social: {
    linkedin:  "https://www.linkedin.com/in/oak-sprouts/",
    twitter:   "Test1.com",
    instagram: "Test1.com",
    facebook:  "Test1.com",
    youtube:   "Test1.com",
    discord:   "Test1.com",
    blog:      "Test1.com"
  },

  copyrightName: "Oak Sprouts",       // shows as © 2026 Your Company Name

  /* ---------- 6. PRICING PAGE (edit or delete plans) ---------- */
  plans: [
    { name: "Free",    price: "₹0",      per: "forever",  color: "#22A559",
      features: ["Browse all directories", "Basic search & filters", "Add your startup"], cta: "Get started", link: "directory.html" },
    { name: "Pro",     price: "₹999",    per: "per month", color: "#7C4DFF", featured: true,
      features: ["Everything in Free", "Export lists to Excel", "Advanced filters", "Email support"], cta: "Contact us", link: "contact.html" },
    { name: "Teams",   price: "Custom",  per: "",          color: "#FF5C5C",
      features: ["Everything in Pro", "Data API access", "Custom dashboards", "Dedicated manager"], cta: "Talk to us", link: "contact.html" }
  ]
};

/* Directory definitions: colors + labels used all over the site. Safe to leave as is. */
window.DIRS = {
  startups:   { label: "Startups",     single: "Startup",    color: "#FF5C5C", blurb: "Scan the landscape and discover startups by sector, stage and city." },
  angels:     { label: "Angels",       single: "Angel",      color: "#F5A200", blurb: "Find the right angel investors for your idea and stage." },
  vcs:        { label: "VCs & Networks", single: "VC",       color: "#7C4DFF", blurb: "Shortlist funds and angel networks that fit your startup." },
  incubators: { label: "Incubators",   single: "Incubator",  color: "#00A99D", blurb: "Compare incubators and accelerators and apply to the right one." },
  govt:       { label: "Govt. Schemes", single: "Scheme",    color: "#2F80ED", blurb: "Central and state funding schemes, all in one place." },
  banks:      { label: "Banks & FIs",  single: "Bank",       color: "#22A559", blurb: "Loan and debt-funding options available to startups." }
};
