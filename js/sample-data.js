/* Built-in SAMPLE data (all names are fictional). Shown only until you connect your Google Sheet.
   Column names here = column headers you will use in your sheet (see sheet-templates/). */
window.SAMPLE = {
  startups: [
    { name: "GreenGrid Energy", description: "GreenGrid designs and finances rooftop solar for MSME factories, cutting power bills by up to 40%.", competitive_edge: "Pay-as-you-save financing so factories need no upfront capital.", location: "Pune, Maharashtra, India", founded: "2021", funding: "₹4.2 Cr", business_model: "Solar installation contracts plus a monthly service fee.", founders: "Riya Kulkarni, Sameer Joshi", sector: "CleanTech, Energy", team_size: "24", competitors: "Fourth Partner Energy, Sunsure, Solarcraft", investors: "Orchid Ventures (Sample), Pune Angel Circle (Sample)", user_base: "60+ factories", website: "https://example.com", featured: "yes", status: "Active", tags: "solar, MSME, energy savings", stage: "Seed", tech: "IoT metering, solar design software", added_on: "2026-09-20" },
    { name: "KisanLink", description: "Connects farmers directly to retailers with transparent pricing and next-day logistics.", competitive_edge: "Own cold-chain partners in 12 districts cut spoilage by half.", location: "Nashik, Maharashtra, India", founded: "2020", funding: "₹11 Cr", business_model: "Commission on each order plus logistics fees.", founders: "Anil Pawar, Meena Deshmukh", sector: "AgriTech, Marketplace", team_size: "55", competitors: "DeHaat, Ninjacart, WayCool", investors: "Bharat Climate Fund (Sample), Orchid Ventures (Sample)", user_base: "40,000 farmers", website: "https://example.com", featured: "yes", status: "Active", tags: "agri, marketplace, supply chain", stage: "Pre-Series A", tech: "Mobile app, route optimisation", added_on: "2026-09-12" },
    { name: "MedMitra", description: "AI triage for small clinics that helps prioritise patients and reduce waiting time.", competitive_edge: "Works offline and in 8 Indian languages.", location: "Bengaluru, Karnataka, India", founded: "2022", funding: "₹2.5 Cr", business_model: "Monthly SaaS subscription per clinic.", founders: "Dr. Nisha Rao", sector: "HealthTech, AI", team_size: "14", competitors: "Practo, DocOn, Eka Care", investors: "Nisha Rao (Sample)", user_base: "900 clinics", website: "https://example.com", featured: "yes", status: "Active", tags: "health, AI, clinics", stage: "Seed", tech: "Machine learning, offline-first mobile app", added_on: "2026-08-30" },
    { name: "PayPadi", description: "UPI soundbox and bookkeeping app for street vendors and micro-merchants.", competitive_edge: "Free soundbox rental for the first year.", location: "Mumbai, Maharashtra, India", founded: "2019", funding: "₹38 Cr", business_model: "Device rental, transaction fees on lending referrals.", founders: "Aarav Mehta, Kavya Iyer", sector: "FinTech, Payments", team_size: "120", competitors: "Paytm, PhonePe, BharatPe", investors: "Orchid Ventures (Sample), Aarav Mehta (Sample)", user_base: "1.2 M merchants", website: "https://example.com", featured: "yes", status: "Active", tags: "payments, UPI, SMB", stage: "Series A", tech: "UPI, embedded finance APIs", added_on: "2026-07-14" },
    { name: "LoomLoop", description: "Circular fashion company that turns pre-consumer textile waste into premium yarn and fabrics.", competitive_edge: "Patented sorting process that keeps fibre quality high.", location: "Tiruppur, Tamil Nadu, India", founded: "2021", funding: "₹3 Cr", business_model: "B2B sale of recycled yarn to garment makers.", founders: "Lakshmi Narayanan", sector: "Textiles, CleanTech", team_size: "32", competitors: "Aditya Birla Recron, Reliance Recron", investors: "Bharat Climate Fund (Sample)", user_base: "18 garment makers", website: "https://example.com", featured: "yes", status: "Active", tags: "textile, circular economy", stage: "Seed", tech: "Fibre sorting, material science", added_on: "2026-09-02" },
    { name: "SkillSutra", description: "Short video courses in 9 Indian languages with job placement support for Tier-3 youth.", competitive_edge: "Partner employers hire directly from course cohorts.", location: "Indore, Madhya Pradesh, India", founded: "2023", funding: "₹80 L", business_model: "Learner fees and employer placement fees.", founders: "Rohit Verma, Pooja Sharma", sector: "EdTech", team_size: "11", competitors: "Skill-Lync, Apna, upGrad", investors: "Pune Angel Circle (Sample)", user_base: "25,000 learners", website: "https://example.com", featured: "yes", status: "Active", tags: "edtech, jobs, vernacular", stage: "Pre-seed", tech: "Video streaming, mobile app", added_on: "2026-09-28" },
    { name: "BioBloom Labs", description: "Low-cost point-of-care test strips for common infections.", competitive_edge: "Results in 10 minutes without a lab, at one-fifth of the usual cost.", location: "Hyderabad, Telangana, India", founded: "2020", funding: "₹6 Cr", business_model: "Sale of test kits to hospitals and distributors.", founders: "Dr. Imran Qureshi, Sneha Reddy", sector: "BioTech, HealthTech", team_size: "29", competitors: "Mylab, Molbio Diagnostics", investors: "Orchid Ventures (Sample)", user_base: "300 hospitals", website: "https://example.com", featured: "no", status: "Active", tags: "biotech, diagnostics", stage: "Seed", tech: "Lateral-flow assays", added_on: "2026-06-10" },
    { name: "RouteRaja", description: "Fleet routing software that cuts delivery costs for city fleets.", competitive_edge: "Learns each city's traffic patterns so plans stay accurate.", location: "Chennai, Tamil Nadu, India", founded: "2018", funding: "₹25 Cr", business_model: "SaaS subscription per vehicle.", founders: "Arjun Natarajan", sector: "Logistics, SaaS, AI", team_size: "70", competitors: "Locus, FarEye, Shipsy", investors: "Orchid Ventures (Sample), Bharat Climate Fund (Sample)", user_base: "150 fleets", website: "https://example.com", featured: "no", status: "Active", tags: "logistics, SaaS, route optimisation", stage: "Series A", tech: "Route optimisation, machine learning", added_on: "2026-05-22" }
  ],
  founders: [
    { startup: "GreenGrid Energy", name: "Riya Kulkarni", role: "Co-founder & CEO", linkedin: "https://linkedin.com", bio: "Former solar EPC project manager." },
    { startup: "GreenGrid Energy", name: "Sameer Joshi", role: "Co-founder & CTO", linkedin: "", bio: "Power electronics engineer." },
    { startup: "KisanLink", name: "Anil Pawar", role: "Founder & CEO", linkedin: "", bio: "Third-generation farmer turned entrepreneur." },
    { startup: "KisanLink", name: "Meena Deshmukh", role: "Co-founder, Operations", linkedin: "", bio: "Ex supply-chain lead at a retail chain." },
    { startup: "MedMitra", name: "Dr. Nisha Rao", role: "Founder", linkedin: "", bio: "Physician and health-tech operator." },
    { startup: "PayPadi", name: "Aarav Mehta", role: "Co-founder & CEO", linkedin: "", bio: "Ex-fintech product head." },
    { startup: "PayPadi", name: "Kavya Iyer", role: "Co-founder & COO", linkedin: "", bio: "" }
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
