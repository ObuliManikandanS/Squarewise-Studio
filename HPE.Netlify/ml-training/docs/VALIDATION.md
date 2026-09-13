# Delivery validation

Executed on 12 September 2026 using the dependency versions recorded in `artifacts/synthetic/metadata.json`.

## Results

- Generated 2,400 explicitly synthetic records.
- Trained and compared all five candidates successfully.
- Selected **Gradient Boosting** by development cross-validation MAE.
- Development CV MAE: **₹17,44,699**.
- Untouched test MAE: **₹19,89,938**.
- Untouched test RMSE: **₹33,87,603**.
- Untouched test R²: **0.9381**.
- Untouched test MAPE: **11.98%**.
- Empirical test coverage for nominal 90% interval: **89.79%**.

All results above are synthetic demonstration results. They do not measure real market accuracy. The relatively high rupee errors remain material even when R² looks high.

## Automated verification

`python -m pytest -q` completed with **10 passed**.

Coverage includes an independently specified Porur price calculation, square-metre equivalence, rejection of unknown localities/nonfinite and invalid areas/unconfirmed area basis, catalogue provenance fields, saved model loading, fitted input bounds, CV winner selection, held-out MAE recomputation, split integrity, and Streamlit AppTest navigation through all four app sections including model prediction.

AppTest verifies execution and widget workflows, not pixel-level browser rendering. No live hosted deployment or real-property valuation study was performed.

## Worked example

For a comparable listed apartment area of 1,200 sq ft in Porur:

- Source average rate: ₹7,990/sq ft.
- Benchmark: 1,200 × 7,990 = **₹95,88,000 (₹95.88 lakh)**.
- Published-rate range: **₹75,76,800–₹1,15,99,200**.

These are apartment market benchmarks for the cited Q2 2026 period; they exclude additional purchase charges and do not reflect a property-specific appraisal.
