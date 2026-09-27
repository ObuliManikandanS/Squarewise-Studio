# VortexPlots

Tamil Nadu property research workspace. This is a working implementation with explicit data and deployment limits, not a completed statewide valuation service.

## Available in this version

- Responsive district explorer with Leaflet / OpenStreetMap and 38 district reference polygons.
- Selected directory and uploaded advertised localities, district/locality routes, and separate land/building property types.
- Strict separation of asking, transaction, guideline and user-scenario prices.
- Area conversion (sq ft, sq m, cent, acre, ground).
- Carpet / built-up / super built-up analysis, loading factor, space efficiency and true usable cost.
- Public A4 PDF generation with selectable rupee text, formulas, dataset status, page numbers and district map snapshots for location/property reports.
- Better Auth email/password sign-up, login and PostgreSQL-backed protected records; optional email recovery.
- Account portfolio and report snapshot APIs, report filters and owner-scoped deletion.
- Data coverage and source registry views.
- Observation ingestion with raw-record preservation, normalization, duplicate removal, provenance/date validation and atomic replacement.
- Reproducible Ridge training and locality-grouped validation; exported coefficients drive opt-in website predictions.

## Current evidence

Dataset version: tn-2026-09-27.2. The user-provided CSV contains **628 screened asking advertisements across 38 districts**, plus two earlier source-checked asking observations. No verified transaction or official guideline values are shipped. Collection dates are not price-effective dates. District/locality assignment follows the supplied portal classification, with 31 source-corrected assignments; this is not cadastral verification.

An **experimental Ridge regression on log asking rate** is trained using district, property type, area basis and log area. A locality-grouped holdout uses 478 training and 150 validation records; five-fold grouped CV selects alpha using only the training partition. Holdout MAE: 1590.63 INR/sq ft, RMSE: 4926.35 INR/sq ft, R²: 0.28148. Median baseline MAE: 2064.05 INR/sq ft. This is modest predictive performance on advertisements, not validated transaction-price accuracy. No calibrated interval or accuracy percentage is claimed. The final artifact is refit on all 628 records, separately from holdout evaluation.

Reproduce with the pinned Python packages in requirements-model.txt and run python scripts/train-ridge.py. The raw CSV, normalized records, source SHA-256, validation IDs, coefficients and sklearn parity vectors are committed. Browser predictions are opt-in, asking-only, limited to district/type/basis groups with at least three records, and reject extrapolation beyond observed area bounds. User-supplied district reference ranges remain visibly unverified and are excluded from training.

38 district names are checked against https://igod.gov.in/sg/TN/E042/organizations. Boundary source, MIT license and limitations are in public/maps/. Polygons contain mixed source vintages through 2022 and are simplified for visualization. They are not certified current or cadastral boundaries. Localities are a selected directory, not an official exhaustive village, ward, municipality or taluk register. Exact locality coordinates and historical prices are not populated.

## Render deployment

The Render edition uses Next.js 16, Better Auth and PostgreSQL. Source is published
in the `VortexPlots/` folder of Squarewise-Studio; the older `HPE.Netlify/` project
is preserved. `render.yaml` at the repository root describes the web service.

Node 22 and pnpm 11.25.0 (lockfile included):

    corepack pnpm install --frozen-lockfile
    corepack pnpm build:render
    corepack pnpm start:render

Set DATABASE_URL to the Render database's **internal** URL. Set
BETTER_AUTH_SECRET to a random secret of at least 32 characters. Render's
RENDER_EXTERNAL_URL supplies the canonical origin; BETTER_AUTH_URL can override
it for a custom domain or local testing. Keep secrets only in environment settings.

Startup applies Better Auth migrations and the owner-indexed saved_records table
under a PostgreSQL advisory lock, then starts Next.js on 0.0.0.0:$PORT. The health
endpoint verifies database reachability and the saved-record schema. Private
records and generated report snapshots persist in PostgreSQL, never ephemeral
disk. Queries check both the session owner and record key. A seven-day session,
password hashing, secure production cookies, origin checks and database-backed
authentication rate limits protect the account flows.

Email/password registration and sign-in do not need an external identity service.
Email addresses remain unverified unless email delivery is configured. To enable
email verification and password recovery, configure RESEND_API_KEY and EMAIL_FROM
with a verified sender. Without these values, recovery reports that it is
unavailable; it never pretends to send email. No existing Netlify accounts or old
Sites records are imported by this migration.

The provisioned free Render PostgreSQL database expires on **21 October 2026**.
Upgrade or export and migrate before then to retain continued access. Render's
free web service can sleep while idle. No paid upgrade has been made.

## Validation and remaining limits

- Next.js production build, strict TypeScript and six valuation tests pass.
- 38 district polygons match the directory; the map and area calculator have
  been exercised in the browser.
- PDF sample includes selectable rupee text and district geometry.
- Live deployment, real database account isolation and restart persistence need
  deployment verification; build success alone does not prove these.
- Verified statewide prices, a trained production model, historical series,
  exhaustive locality coverage and Tamil fonts remain outstanding.
- No synthetic dataset or old demo model is presented as verified market evidence.
- The homepage's fourth card shows the selected district's listed locality count.

## Training

Install scripts/requirements-training.txt in a Python environment. Start with data/training-template.csv and legally reusable, reviewed observations. Run scripts/train.py with the input CSV. The workflow deliberately blocks insufficient datasets and never substitutes synthetic examples for market observations. Its artifacts are evaluation-only and require separate review before production integration.
