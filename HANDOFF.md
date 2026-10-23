# HANDOFF: StartupHub v2 (paste this into any AI assistant)

## Project
Static website (HTML/CSS/vanilla JS, no build) modelled on ynos.in without the chatbot. White background, colourful accents. Hosted on Cloudflare Pages from GitHub repo `teamoaksprouts-sudo/startuphub`. The owner is non-technical (Mac, edits on GitHub's web UI), so give click-by-click steps and whole-file replacements, not diffs.

## Data
* PUBLIC Google Sheet (ID in `js/config.js`, shared "Anyone with the link: Viewer"), read client-side from `.../gviz/tq?tqx=out:csv&sheet=<Tab>`. Sample data (`js/sample-data.js`) is the fallback. 5-minute sessionStorage cache.
* PRIVATE inbox sheet with a bound Apps Script (`sheet-templates/Code.gs`): receives form submissions, approvals, and feed items.
* Headers are normalised (`Startup Name` -> `startup_name`), then mapped by ALIAS in `js/data.js`. Rows need `Visible`/`approved` = yes.
* Tabs: Startups (21 reference columns + optional Added On), Founders, Angels, VCs, Incubators, GovtSchemes, Banks, Blog, Events, Benefits, Clients, Team, FAQ. Exact columns: `SHEETS_GUIDE.md` and `prompts/RESEARCH_PROMPTS.md`.

## File map
`index.html`, `directory.html`, `add-startup.html`, `compare.html`, other pages; `js/config.js` (owner's settings, keep their values), `js/data.js`, `js/pages.js`, `js/compare.js`, `js/layout.js` (header/footer), `js/sample-data.js`, `css/style.css`, `sheet-templates/Code.gs`, `prompts/RESEARCH_PROMPTS.md`, `SHEETS_GUIDE.md`.
Script order in pages: config, sample-data, data, compare, layout, pages.

## Features built in v2
1. Pricing removed (nav, footer, page deleted).
2. In-site Add startup form (+ up to 5 founders) -> POST (`no-cors`, text/plain JSON) to the Apps Script web app (`submitUrl` in config). Honeypot, 6 s minimum, rate limit 40/hour, server validation, formula-injection guard. Approve by ticking `Approve?` in the private `Submissions` tab; the installable `onApprovalEdit` trigger copies it (and its founders) to the public sheet. `PUBLISH_ON_APPROVE` true = goes live, false = Visible=no.
3. Compare bucket (max 4, localStorage `sh_compare`), bottom bar, `compare.html` with differences-only toggle and a shareable `?n=` link.
4. Column layout matches the owner's reference sheet.
5. Clickable facets (sector, tags, tech, competitors, investors, stage, city, founders, status): `directory.html?type=startups&f=<field>&v=<value>`. Matching is exact on a normalised key, so spelling must be consistent.
6. Research prompts for the other directories (TSV output).
7. `refreshFeeds` (daily trigger): RSS/ICS sources in the `Sources` tab, keyword relevance (Settings tab), dedupe, review queue or per-source auto-publish.

## Known gotchas
* Never pre-fill checkboxes down a column: `getLastRow`/`appendRow` count them.
* A typo in `config.js` (e.g. `False`) kills the whole site: header, footer and data.
* After editing Code.gs, redeploy as a NEW VERSION (URL unchanged).
* The browser cannot read the Apps Script reply (no-cors); failures show only in the `Log` tab.
* Social links in config are still placeholder "Test1.com".

## Unverified (could not test in the build sandbox)
Real Apps Script deployment, the live Cloudflare site, the reference sheet's Founders tab columns (assumed), the Entrackr feed. Mock-tested: submission, approval, feed parsing, data layer, UI in headless Chromium.

## Not built (ask before building)
Per-directory separate pages, top-lists, reports, charts, valuation tool, per-startup pages. Login or credits need a backend.
