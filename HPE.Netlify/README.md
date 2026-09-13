# Squarewise Studio — complete Netlify & VS Code project

An interactive Chennai apartment estimation website with a custom indigo, violet and teal dashboard. This folder contains the complete editable website, the Python ML training project and a ready-built meeting version.

## Present immediately

1. Install **Node.js 22 or newer** on your laptop.
2. Extract this entire ZIP. Do not open the website from inside the ZIP.
3. On Windows, double-click **START_MEETING.bat**.
4. Or open a terminal here and run:

```bash
npm run meeting
```

Open **http://localhost:5173**. Keep the terminal open. The included `dist/` contains the built site: dependencies and Netlify login are **not needed** for this meeting command. The estimator, dashboard, comparison and ML demo all work offline after extraction. Source links require internet.

## Open and edit in VS Code

Open `Squarewise.code-workspace`, or use **File → Open Folder** and select this folder.

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Changes in `src/` update the browser automatically.

Before sharing updated code:

```bash
npm test
npm run build
npm run meeting
```

Rebuild after source changes so the meeting version matches them. `npm run format` formats editable source for readability.

## User flow

1. **Overview:** quick area/locality estimate, local-rate metrics, area sensitivity chart and budget-fit comparison.
2. **Estimate home:** searchable locality, area input/slider, square-metre conversion, chosen calculation method and live price breakdown.
3. **Explore localities:** search, rate sorting, side-by-side comparison and direct navigation into an estimate.
4. **Model & sources:** five-model results, data limitations and downloads.
5. **Report:** confirm comparable area basis, inspect the estimate, download its JSON record.

## Pricing — what is correct and what is not guaranteed

The default formula is **comparable apartment area in sq ft × published locality rate in INR/sq ft**. For Porur at 1,200 sq ft and ₹7,990/sq ft, the result is **₹95,88,000**. Quoted-rate mode lets you enter a current property-specific quote; it does not imply independent verification.

The catalogue covers **17 Chennai multistorey-apartment localities**. It is a Q2 2026 published snapshot, updated by the publisher in July and checked on 12 September. Source links and reporting dates remain visible. This is not a live feed. The publisher does not establish one consistent carpet/built-up methodology, so the user must confirm comparable area before exporting.

An exact selling price cannot be guaranteed from locality averages. Property condition, street, building, title and transaction terms matter. Taxes, registration, interiors and other charges are excluded. Do not use apartment rates for plots, independent houses or construction costs.

## Working ML demonstration

The site runs the exported **220-tree Gradient Boosting model**, selected from five candidates by development CV MAE. It is lazy-loaded in the browser, so no API key or prediction server is needed. It reproduces the Python model rather than using a fake response.

**Training data is synthetic. Real-world accuracy remains unvalidated.** Held-out R² is 0.938, test MAPE about 11.98%, and test MAE about ₹19.90 lakh on generated data. These are not real Chennai market-accuracy measurements.

The model predicts log(price / area), then returns rate × area. Exported numeric scaling, one-hot categories, tree thresholds and float32 comparisons reproduce scikit-learn inference. Inputs outside fitted bounds are rejected.

## Neat project structure

| Path                           | What to explain in a meeting                                 |
| ------------------------------ | ------------------------------------------------------------ |
| `src/App.tsx`                  | Shared state, navigation, estimator, comparisons and report  |
| `src/components/Dashboard.tsx` | Dashboard, budget matching and area sensitivity              |
| `src/styles.css`               | Responsive layout, colours, motion and visual hierarchy      |
| `src/lib/pricing.ts`           | Unit conversion, rate lookup, validation and INR calculation |
| `src/lib/predict-demo.ts`      | Actual exported model inference                              |
| `src/lib/data/rates.json`      | 17 sourced locality rates                                    |
| `src/lib/data/demo-model.json` | Fitted model trees and preprocessing                         |
| `src/lib/data/model-meta.json` | CV ranking, holdout results and input bounds                 |
| `src/components/ui/`           | Accessible reusable controls                                 |
| `ml-training/`                 | Complete Python training, original data, tests and guides    |
| `scripts/verify-pricing.cjs`   | Arithmetic checks and Python/JavaScript parity               |
| `scripts/export_model.py`      | Re-export a compatible trained model                         |
| `scripts/serve-built.mjs`      | Simple local meeting server                                  |
| `docs/MEETING_GUIDE.md`        | 8-minute walkthrough and sample answers                      |
| `netlify.toml`                 | Netlify build/output configuration                           |
| `.vscode/`                     | Suggested extensions and build/run tasks                     |
| `dist/`                        | Ready-built website for local presentation or Netlify Drop   |

## Publish on Netlify

No environment variables or secrets are required.

### Option A: deploy the included build

Log into your Netlify account and upload the **contents of `dist/`** using Netlify Drop. Never upload `src/` as the published site.

### Option B: deploy with the CLI

```bash
npx netlify login
npx netlify init
npm run build
npx netlify deploy --prod --dir=dist
```

When prompted: build command **npm run build**, publish directory **dist**. For a Git-based deployment, commit this project and connect its repository in Netlify; `netlify.toml` supplies the settings. Exclude `node_modules`, `.netlify`, `.env` and local secrets.

### If the CLI says “Not logged in”

A Netlify app/connector connection does not automatically authenticate the local upload CLI. Complete its own login flow. The local meeting website continues to work without that login.

## Update data or models

Edit rates only after verifying the exact locality, apartment type, area unit and reporting period. Keep `public/downloads/locality-rates.csv` aligned with `src/lib/data/rates.json`.

The complete training project is under `ml-training/`. Follow its README to train with real records. The hosted model UI remains synthetic until a genuinely validated real-data model and matching metadata are deliberately integrated.

For a compatible retrained synthetic Gradient Boosting pipeline:

```bash
python scripts/export_model.py --project /absolute/path/to/ml-training
npm test
npm run build
```

Other winning architectures need a matching verified inference exporter.

## Attribution

Rates originate from linked Magicbricks apartment-price pages. `public/apartment.png` is an AI-generated illustrative architectural image, not an actual property listing. The dashboard calls out the image accordingly.
