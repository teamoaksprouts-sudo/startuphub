/* Built-in SAMPLE data (all names are fictional). Shown only until you connect your Google Sheet.
   Column names here = column headers you will use in your sheet (see sheet-templates/). */
window.SAMPLE = {
  startups: [
    { name: "GreenGrid Energy", tagline: "Rooftop solar for small factories", description: "GreenGrid designs and finances rooftop solar for MSME factories, cutting power bills by up to 40%.", sector: "CleanTech", location: "Pune", stage: "Seed", founded: "2021", funding: "₹4.2 Cr", website: "https://example.com", tags: "solar, energy, MSME", featured: "yes", added_on: "2026-09-20" },
    { name: "KisanLink", tagline: "Direct farm-to-retail marketplace", description: "Connects farmers to retailers with transparent pricing and next-day logistics.", sector: "AgriTech", location: "Nashik", stage: "Pre-Series A", founded: "2020", funding: "₹11 Cr", website: "https://example.com", tags: "agri, marketplace", featured: "yes", added_on: "2026-09-12" },
    { name: "MedMitra", tagline: "AI triage for small clinics", description: "Helps clinics prioritise patients and reduce waiting time using simple symptom checks.", sector: "HealthTech", location: "Bengaluru", stage: "Seed", founded: "2022", funding: "₹2.5 Cr", website: "https://example.com", tags: "health, AI", featured: "yes", added_on: "2026-08-30" },
    { name: "PayPadi", tagline: "UPI collections for street vendors", description: "Soundbox and bookkeeping app for micro-merchants.", sector: "FinTech", location: "Mumbai", stage: "Series A", founded: "2019", funding: "₹38 Cr", website: "https://example.com", tags: "payments, UPI", featured: "yes", added_on: "2026-07-14" },
    { name: "LoomLoop", tagline: "Circular fashion from textile waste", description: "Turns pre-consumer textile waste into premium yarn and fabrics.", sector: "Textiles", location: "Tiruppur", stage: "Seed", founded: "2021", funding: "₹3 Cr", website: "https://example.com", tags: "textile, circular", featured: "yes", added_on: "2026-09-02" },
    { name: "SkillSutra", tagline: "Vernacular upskilling for Tier-3 youth", description: "Short video courses in 9 Indian languages with job placement support.", sector: "EdTech", location: "Indore", stage: "Pre-seed", founded: "2023", funding: "₹80 L", website: "https://example.com", tags: "edtech, jobs", featured: "yes", added_on: "2026-09-28" },
    { name: "BioBloom Labs", tagline: "Low-cost diagnostics kits", description: "Point-of-care test strips for common infections.", sector: "BioTech", location: "Hyderabad", stage: "Seed", founded: "2020", funding: "₹6 Cr", website: "https://example.com", tags: "biotech, diagnostics", added_on: "2026-06-10" },
    { name: "RouteRaja", tagline: "Fleet routing for last-mile delivery", description: "Cuts delivery costs with route optimisation for city fleets.", sector: "Logistics", location: "Chennai", stage: "Series A", founded: "2018", funding: "₹25 Cr", website: "https://example.com", tags: "logistics, SaaS", added_on: "2026-05-22" }
  ],
  angels: [
    { name: "Aarav Mehta (Sample)", tagline: "Ex-founder, SaaS & FinTech", description: "Backs early-stage B2B software founders. Cheque size ₹25L–₹1Cr.", sector: "SaaS, FinTech", location: "Mumbai", stage: "Pre-seed, Seed", website: "https://example.com", linkedin: "https://linkedin.com" },
    { name: "Nisha Rao (Sample)", tagline: "Healthcare operator turned investor", description: "Invests in HealthTech and BioTech with a focus on clinical validation.", sector: "HealthTech", location: "Bengaluru", stage: "Seed", website: "https://example.com" },
    { name: "Pune Angel Circle (Sample)", tagline: "Angel network of 60 members", description: "Invests collectively in Maharashtra-based startups.", sector: "Generalist", location: "Pune", stage: "Seed, Pre-Series A", website: "https://example.com" }
  ],
  vcs: [
    { name: "Orchid Ventures (Sample)", tagline: "Early-stage generalist fund", description: "₹400 Cr fund investing in 20 startups across consumer and enterprise.", sector: "Generalist", location: "Bengaluru", stage: "Seed, Series A", funding: "₹400 Cr fund", website: "https://example.com" },
    { name: "Bharat Climate Fund (Sample)", tagline: "Climate and agri focus", description: "Backs CleanTech, AgriTech and mobility startups.", sector: "CleanTech, AgriTech", location: "Delhi NCR", stage: "Series A", website: "https://example.com" }
  ],
  incubators: [
    { name: "Sahyadri Innovation Hub (Sample)", tagline: "Deep-tech incubator", description: "6-month programme with labs, mentors and seed grants of up to ₹25L.", sector: "DeepTech", location: "Pune", stage: "Idea, Prototype", website: "https://example.com" },
    { name: "Kaveri Accelerator (Sample)", tagline: "Growth accelerator", description: "12-week cohort with investor demo day.", sector: "Generalist", location: "Chennai", stage: "Seed", website: "https://example.com" }
  ],
  govt: [
    { name: "Seed Fund Scheme (Sample)", tagline: "Grants for proof of concept", description: "Sample entry. Replace with the real scheme details, eligibility and apply link.", sector: "All sectors", location: "India", stage: "Idea, Prototype", funding: "Up to ₹20 L", website: "https://example.com" },
    { name: "State Startup Policy (Sample)", tagline: "State-level incentives", description: "Sample entry. Reimbursements for patents, rent and certifications.", sector: "All sectors", location: "Maharashtra", stage: "All", website: "https://example.com" }
  ],
  banks: [
    { name: "Example Bank – Startup Loan (Sample)", tagline: "Collateral-free working capital", description: "Sample entry for a startup-friendly debt product.", sector: "All sectors", location: "India", stage: "Revenue-stage", funding: "Up to ₹2 Cr", website: "https://example.com" }
  ],
  blog: [
    { title: "How tier-2 cities are quietly building the next wave of startups", date: "2026-09-15", url: "#", summary: "A look at funding, talent and cost advantages outside the metros.", tag: "Ecosystem" },
    { title: "Deep tech in India: where the real gaps are", date: "2026-08-21", url: "#", summary: "Challenges around labs, capital and long timelines.", tag: "DeepTech" },
    { title: "Startup awards: when they help and when they don't", date: "2026-07-30", url: "#", summary: "A founder's guide to choosing which awards are worth the effort.", tag: "Founders" },
    { title: "Reading a term sheet without a lawyer (the first pass)", date: "2026-07-02", url: "#", summary: "Five clauses to understand before you sign anything.", tag: "Funding" }
  ],
  events: [
    { title: "Founders Meetup Pune", date: "2026-11-14", location: "Pune", url: "#", description: "Evening meetup for early-stage founders." },
    { title: "Demo Day – Cohort 5", date: "2026-12-05", location: "Online", url: "#", description: "Ten startups pitch to 40 investors." },
    { title: "Startup Policy Roundtable", date: "2026-08-18", location: "Mumbai", url: "#", description: "Past event. Replace with your own." }
  ],
  benefits: [
    { partner: "Cloud Credits Co. (Sample)", category: "Cloud Hosting", offer: "Up to $1,000 in credits", url: "#", description: "Sample benefit. Replace with real partner deals." },
    { partner: "CRM Cloud (Sample)", category: "CRM & Engagement", offer: "6 months free", url: "#", description: "Sample benefit." },
    { partner: "LegalEase (Sample)", category: "Legal & Compliance", offer: "20% off incorporation", url: "#", description: "Sample benefit." },
    { partner: "HireFast (Sample)", category: "Hiring", offer: "First job post free", url: "#", description: "Sample benefit." }
  ],
  clients: [
    { name: "Sample Institute A" }, { name: "Sample Incubator B" }, { name: "Sample University C" },
    { name: "Sample Bank D" }, { name: "Sample Ventures E" }, { name: "Sample Foundation F" }
  ],
  team: [
    { name: "Your Name", role: "Founder", bio: "Add team members in the Team tab of your sheet.", linkedin: "" }
  ],
  faq: [
    { question: "How do I add my startup?", answer: "Click “Add your startup”, fill the form, and it appears on the site after review." },
    { question: "Is the data free to use?", answer: "Yes, browsing every directory is free." },
    { question: "How often is the data updated?", answer: "Whenever the site owner edits the Google Sheet. Changes appear within a few minutes." }
  ]
};
