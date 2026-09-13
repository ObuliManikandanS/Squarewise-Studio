# Squarewise Studio — meeting walkthrough

## Before the meeting

- Extract the complete project and install Node.js 22+.
- Run `npm run meeting`, then open http://localhost:5173.
- Open `Squarewise.code-workspace` in VS Code.
- Keep the browser and code editor ready side by side.
- The ready-built website works offline, including the ML demo. Source websites require internet.

## 8-minute presentation flow

| Time      | Show                      | What to say                                                                                                                                                                                                  |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:45 | Overview                  | “Squarewise estimates Chennai apartment benchmarks and explains every number. It also includes a separately labelled machine-learning demonstration.”                                                        |
| 0:45–1:30 | Quick estimate            | Select Porur and 1,200 sq ft. “The published average is ₹7,990 per square foot, giving ₹95.88 lakh.”                                                                                                         |
| 1:30–2:15 | Area chart and budget fit | Change the area slider. “The chart is arithmetic sensitivity, not a forecast. The budget panel filters locality-average benchmarks for this area.”                                                           |
| 2:15–3:00 | Full estimator            | Change to sq m, then return to sq ft. Show the formula and source notes. “Area and rate must use comparable area definitions.”                                                                               |
| 3:00–3:40 | Quoted rate               | Choose “My property’s quoted rate” and enter ₹8,500. At 1,200 sq ft the result is ₹1.02 crore. “This uses the user’s quote, not a rate the project has independently verified.”                              |
| 3:40–4:30 | Locality comparison       | Compare Porur, Velachery and Anna Nagar. “Same area, different sourced locality rates.”                                                                                                                      |
| 4:30–5:30 | ML demo                   | Choose “ML prediction · synthetic demo”. Change age or furnishing. “This runs the actual trained Gradient Boosting trees. The training records are generated, so this is not proof of real-market accuracy.” |
| 5:30–6:30 | Model & sources           | Show the five candidates and test metrics. “Selection uses cross-validation; a separate test set evaluates the winner. R² is not a percentage accuracy score.”                                               |
| 6:30–7:20 | VS Code                   | Open `pricing.ts`, `predict-demo.ts`, `Dashboard.tsx` and `netlify.toml`. Explain calculation, model, UI and deployment separation.                                                                          |
| 7:20–8:00 | Report                    | Confirm area comparability, open the report and export JSON. Close with the real-data validation requirement.                                                                                                |

## Questions you may receive

**Why does the default estimator use a rate formula?**
Because published locality averages are the available verified inputs. Inventing property-specific premiums would imply unsupported precision.

**Why Gradient Boosting?**
It had the lowest mean development CV MAE among the five compared candidates in this experiment. It is not guaranteed to be best on other data.

**Is 0.938 R² equal to 93.8% accuracy?**
No. R² describes variation explained in the test target. Also show MAE, RMSE and percentage error, and explain that these tests use synthetic records.

**Does the model use real property sales?**
No. The source-rate catalogue is published market information, but individual ML rows are synthetic. Real sales data and future-time validation are required for operational predictions.

**Why do bedrooms not change the published-rate benchmark?**
The source does not establish a verified bedroom adjustment. Bedroom/age/furnishing inputs appear in ML mode, where their synthetic relationships are explicitly disclosed.

**What is the architecture?**
React + TypeScript renders the interface. Shared pricing functions validate and calculate the benchmark. The exported ML model is lazy-loaded for browser inference. Vite creates static assets, and Netlify hosts those assets.

**How do you know the web model matches Python?**
Sixty independent Python predictions are stored as verification fixtures. JavaScript predictions match within ₹0.01; the measured difference was much smaller.

**What would improve prediction quality next?**
Verified, deduplicated apartment records with consistent area/price definitions, observation dates and sources; then building-aware and chronological evaluation on later records.

## One-line project explanation

“Squarewise is an interactive Chennai apartment estimation dashboard that combines traceable square-foot benchmarks with a reproducible, clearly labelled ML demonstration.”
