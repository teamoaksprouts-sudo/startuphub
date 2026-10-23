# Research prompts: fill the Angels, VCs, Incubators, Govt Schemes and Banks tabs

Use these with any AI that can search the web (ChatGPT, Gemini, Perplexity, Claude and so on). Always turn **web search / browsing ON**.
The Startups tab is not covered here because you already have that data.

## The workflow (two steps per directory)

1. **Discovery.** Run the Discovery prompt (Part A) to get a list of *names* that could belong in the directory. Nothing is added to your sheet yet.
2. **Pick, then fetch details.** Delete the names you do not want. Paste the ones you do want into the Details prompt (Part B). The AI returns rows in TSV, ready to paste into the sheet.

Paste into Google Sheets: click cell **A2** (just under the header row), then **Cmd + Shift + V** (Mac) or **Ctrl + Shift + V** (Windows) to paste values only. The text splits into columns by itself. Make sure the header row of your tab matches the columns listed below, in the same order.

Every row comes back with **Visible = no**. Check the row (open the Source URL), then change it to **yes** to publish.

---

## Part A: Discovery prompt (names only)

Copy everything in the box, then change the three `{{...}}` parts.

```
You are helping me build a directory website for the Indian startup ecosystem.

TASK: Find {{WHAT, e.g. "banks and NBFCs in India that offer loans or debt funding to startups"}} that belong in the directory "{{DIRECTORY, e.g. Banks & FIs}}".
Region focus: {{REGION, e.g. India}}.

RULES
- Use web search. Only list organisations that really exist and are active today. Do not guess or invent names.
- Prefer official or well-known sources (the organisation's own website, government portals, regulator lists).
- Give me up to 40 names in this batch. If there are more, tell me at the end and wait for me to say "next batch".
- Do NOT repeat any name from my existing list below, including alternative spellings.
- Output ONE code block containing a TSV (tab-separated), header row first, with exactly these columns:
  Name | One-line description | Website URL | Why it fits | Confidence (High, Medium or Low)
- No tabs or line breaks inside a value. No markdown, no footnote numbers, no extra text inside the code block.
- After the code block, add a short bullet list called "Not sure about" with any names you could not verify.

MY EXISTING NAMES (skip these):
{{PASTE THE NAME COLUMN FROM YOUR SHEET, one per line. Write "none" if empty}}
```

---

## Part B: Details prompt (turns chosen names into rows for your sheet)

Copy the **General rules** block, then the **column block for the directory you are filling**, then add your chosen names. Put them together in one message.

### General rules (always include)

```
You are helping me fill a Google Sheet that powers an Indian startup-ecosystem directory website.

For each name I give you, research it on the web and return one row.

HARD RULES
1. Use web search. Prefer the organisation's own website and official pages. Never invent facts.
2. If you cannot find a value, leave that cell EMPTY. Never write "N/A", "Unknown", "-" or guesses.
3. Output ONE code block containing a TSV: tab-separated, header row first, exactly the columns and order listed below, one organisation per row.
4. No tab characters or line breaks inside any value. Replace them with a space. No markdown, no bold, no citation numbers, no extra text inside the code block.
5. Lists inside one cell (sectors, tags and so on) are separated by commas.
6. Websites and links: full address starting with https://. Only use links you actually opened or saw in search results.
7. Money: write like "₹2 Cr", "₹50 L" or "$1.5 Mn". For ranges write "₹10 L - ₹2 Cr".
8. "Visible" must be the word no for every row. "Featured" must be No. "Status" must be Active, or Closed if it has shut down.
9. "Source URL" = the page you used for most of the facts. "Last Verified" = today's date in YYYY-MM-DD.
10. "Tagline / Description" = 1 to 3 plain sentences, written fresh in your own words (do not copy marketing text).
11. After the code block, add a bullet list called "Needs checking" naming any row where you were unsure, and why.

THE NAMES TO RESEARCH:
{{PASTE YOUR CHOSEN NAMES HERE, one per line}}
```

### Column blocks (use the one that matches your tab)

**Angels** (tab `Angels`)
```
COLUMNS, in this order (tab-separated):
Visible	Name	Tagline / Description	Type	Sector Focus	Stage Focus	Cheque Size	Headquarters	Notable Investments	Website URL	LinkedIn URL	Logo URL	Tags	Featured	Status	Source URL	Last Verified

Notes: Type is one of Individual angel, Angel network, Family office, Syndicate. Notable Investments = startup names separated by commas, spelled exactly as the startup writes its own name. Logo URL may stay empty.
```

**VCs & Networks** (tab `VCs`)
```
COLUMNS, in this order (tab-separated):
Visible	Name	Tagline / Description	Type	Fund Size	Sector Focus	Stage Focus	Cheque Size	Headquarters	Notable Portfolio	Website URL	LinkedIn URL	Logo URL	Tags	Featured	Status	Source URL	Last Verified

Notes: Type is one of Venture capital, Corporate VC, Angel network, Accelerator fund, Government fund, Family office. Notable Portfolio = startup names separated by commas, spelled the way the startup spells its own name.
```

**Incubators** (tab `Incubators`)
```
COLUMNS, in this order (tab-separated):
Visible	Name	Tagline / Description	Type	Parent Institution	Sector Focus	Stage Focus	Programme Duration	Equity Taken	Funding Support	Headquarters	Website URL	Apply URL	Logo URL	Tags	Featured	Status	Source URL	Last Verified

Notes: Type is Incubator, Accelerator or Both. Parent Institution = the college, company or government body behind it, if any. Equity Taken like "0%" or "5-8%" only if stated officially.
```

**Government schemes** (tab `GovtSchemes`)
```
COLUMNS, in this order (tab-separated):
Visible	Scheme Name	Tagline / Description	Level	Ministry or Department	State	Sector Focus	Stage Focus	Benefit Type	Benefit Amount	Eligibility	How to Apply	Apply URL	Website URL	Tags	Featured	Status	Source URL	Last Verified

Notes: Level is Central or State. State is the state name for state schemes, or India for central ones. Benefit Type is one of Grant, Loan, Subsidy, Reimbursement, Equity, Tax benefit, Mentorship. Eligibility and How to Apply: one or two short sentences each. Only list schemes that are currently open or recurring. Put Closed in Status if applications have ended.
```

**Banks & financial institutions** (tab `Banks`)
```
COLUMNS, in this order (tab-separated):
Visible	Bank Name	Tagline / Description	Type	Product Name	Loan Type	Loan Range	Interest Rate Range	Collateral Required	Eligibility	Headquarters	Website URL	Apply URL	Logo URL	Tags	Featured	Status	Source URL	Last Verified

Notes: Type is one of Public sector bank, Private bank, Small finance bank, NBFC, Development finance institution. Product Name = the specific startup or MSME loan product. Loan Type like Working capital, Term loan, Venture debt. Interest Rate Range only if published, otherwise empty. Collateral Required is Yes, No or Partial.
```

---

## Checking the answer before you paste

1. Open the **Source URL** of 3 or 4 random rows and confirm the facts.
2. Read the "Needs checking" list. Fix or delete those rows.
3. Check the **Name** spelling against your Startups tab, because the "Startups in our database backed by this investor" button matches on the exact name.
4. Paste into the sheet, then change **Visible** to `yes` row by row once you are happy.

AI tools can be confidently wrong. The Visible = no rule is your safety net: nothing reaches the website until you say yes.

## Make the AI work in batches

- 20 to 40 organisations per message gives the best accuracy. Ask for "next batch" rather than 200 at once.
- If a batch returns many blanks, run it again with a different AI and compare.
