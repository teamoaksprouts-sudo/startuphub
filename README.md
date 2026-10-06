# StartupHub: setup & hosting guide

A fast, free, static website (plain HTML/CSS/JS, no build step, no server). Your **Google Sheet is the database**: edit a row, and the site updates within ~5 minutes.

Open `index.html` through any local server to preview (or just deploy; see Step 5).

---

## Step 1: Create the Google Sheet
1. Go to sheets.google.com → new spreadsheet. Name it anything.
2. Create one **tab per directory**, named exactly: `Startups`, `Angels`, `VCs`, `Incubators`, `GovtSchemes`, `Banks`, `Blog`, `Events`, `Benefits`, `Clients`, `Team`, `FAQ`. (Skip any you don't need; that section just shows sample/empty.)
3. Put the column names from `sheet-templates/` in **row 1** of each tab (copy from the CSV files; File → Import also works).
4. Key columns: `approved` (type `yes` to show a row), `name`, `tagline`, `description`, `sector`, `location`, `stage`, `website`, `logo_url`, `tags`, `featured` (yes = shown on home page), `added_on` (YYYY-MM-DD, powers "New" badge and "+N last month").
   Comma-separated values in `sector`, `location`, `stage` become separate filter options.

## Step 2: Share the sheet
Share → General access → **Anyone with the link → Viewer**. (Only share data you are happy to be public.)
Copy the ID from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

## Step 3: "Add your startup" form (no code)
1. Google Forms → new form. **Name each question exactly like a column**: `name`, `tagline`, `description`, `sector`, `location`, `stage`, `website`, `logo_url`…
2. Responses tab → Link to Sheets → choose your sheet. Google creates a tab like `Form Responses 1`.
3. In that tab add a column called `approved` (header in the first empty column). Rename the tab to `Startups`, or put its name in `js/config.js → tabs.startups`.
4. When someone submits, review the row, type `yes` in `approved`, and it goes live.
5. Copy the form's "Send → link" and paste it into `config.js → addStartupForm`.

## Step 4: Edit `js/config.js`
* `sheetId`: paste the ID from Step 2
* `name`, `logoText`, `description`, `copyrightName`
* `addStartupForm`: your form link
* **Footer contact details**: `contact { email, phone, whatsapp, address }`
* **Footer social links**: `social { linkedin, twitter, instagram, facebook, youtube, discord, blog }`
  (Blank items show as dimmed placeholders. Before launch set `hideEmptyContacts: true`.)
* Edit text marked `EDIT THIS` in `about.html`, and replace the placeholder text in `legal.html` (get it reviewed).

The footer itself is generated in `js/layout.js` (look for the `CONTACT DETAILS` comment).

## Step 5: Host it free (pick ONE)
**Cloudflare Pages (recommended: free, unlimited bandwidth, fast in India)**
1. Make a free account at cloudflare.com → Workers & Pages → Create → Pages.
2. *Upload assets* (easiest): drag this whole folder in → Deploy. You get `yourname.pages.dev`.
3. To update later, upload the folder again (or connect a GitHub repo for auto-deploys).

**Netlify**: app.netlify.com/drop → drag the folder → live in seconds (free tier is generous).
**GitHub Pages**: push the folder to a GitHub repo → Settings → Pages → Deploy from branch `main` / root.
**Vercel**: import the GitHub repo, framework "Other", no build command.

Custom domain (optional, ~₹800/yr): buy at any registrar, then add it in the host's "Custom domains" screen and follow the DNS steps. HTTPS is automatic.

## Step 6: Day-to-day
* Add/edit/remove rows in the Sheet → site updates (browsers cache for 5 min; change `cacheMinutes` in config).
* Changing code/design requires re-uploading the folder (Step 5).

## Troubleshooting
| Problem | Fix |
|---|---|
| Orange "Showing sample data" bar | `sheetId` still says `PASTE_...` |
| Still sample data after pasting ID | Sheet not shared as "Anyone with the link"; or tab name differs from `config.js → tabs` |
| A row doesn't appear | `approved` column exists but isn't `yes`; or `name` is empty |
| Wrong column shown | Header must match the template (case/spaces don't matter: `Logo URL` = `logo_url`) |
| Logo doesn't show | `logo_url` must be a direct public image link (https) |

## Optional
* **Newsletter**: create a Google Form with one email question → open pre-filled link to find its `entry.XXXX` id → set `newsletter.action` to the form's `/formResponse` URL and `emailField` to the entry id.
* **Contact form**: create a free endpoint at formspree.io and paste it in `contactFormAction`.
* **Analytics**: add a Cloudflare Web Analytics or Google Analytics snippet before `</head>` in each page.

## Continuing in another AI
Open `HANDOFF.md`, paste its contents into any AI assistant together with the files you want changed.
