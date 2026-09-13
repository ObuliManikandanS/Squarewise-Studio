# Methodology and model card

## Benchmark estimator

Total benchmark = comparable listed area in square feet × published average apartment rate. Range endpoints use the published low/high rates. This is an arithmetic source-backed benchmark, not a learned prediction or a statistical uncertainty interval. Features unavailable in the source are not assigned invented real-world adjustments.

## ML target and pipelines

Each estimator learns **log(price / area)** and transforms its rate prediction back to INR/sq ft, then multiplies by the input area. This makes the dimensional relationship explicit and ensures positive predictions. The area is also a feature to allow size-dependent rates. Target-derived rates are used only as the training target, never as an input feature.

Numeric columns: area, bedrooms, bathrooms, age and parking. Categories: locality and furnishing. Median imputation, standardization and one-hot encoding are fitted within each training fold. Each candidate receives its own cloned pipeline. Metadata columns and source rates are excluded from model inputs.

## Compared candidates

1. Median-rate baseline: tests whether learned features add value.
2. Log-rate Ridge: regularized linear relationships in log rate.
3. Random Forest: averaged nonlinear decision trees.
4. Extra Trees: randomized tree ensemble.
5. Gradient Boosting: sequential nonlinear residual correction with Huber loss.

These are five fixed configurations, not an exhaustive hyperparameter search. The chosen model is best only among these candidates under this experiment's CV metric and dataset.

## Evaluation design

Unique property IDs are required. Exact rows and exact feature/price duplicates are removed. Fixed-seed group splits reserve approximately 65% for development, 15% for calibration and 20% for testing. Development uses five-fold GroupKFold. The winner minimizes mean **total-price MAE in INR** across development folds, then is fitted only on the development set. Selection never examines test or calibration errors.

Calibration residuals are absolute errors divided by predictions. The finite-sample 90% quantile is selected at rank ceil((n+1)×0.90), capped at n. The interval is prediction × (1 ± quantile), with the lower endpoint bounded at zero. The model is not refitted after calibration. On exchangeable data this split-conformal procedure targets marginal coverage; no guarantee applies to each locality or shifted future markets.

Only the winner is evaluated on the test set: MAE, RMSE, R², MAPE and interval coverage are stored alongside predictions. R² is not an accuracy percentage. The test split is an experiment holdout, not a permanently reusable model-tuning dataset.

## Included demonstration

2,400 generated rows use sourced locality averages plus explicitly invented age/furnishing/parking effects and lognormal noise. These effects exist solely to demonstrate the pipeline. They are not evidence that those adjustments hold in real Chennai properties. A high synthetic R² cannot substantiate market accuracy.

Training serializes the fitted estimator, metadata, CV comparison, split IDs, held-out predictions and locality errors. Metadata includes dependency versions, dataset SHA-256, price/area basis and date range.

## Known limits

- No real property-level sales dataset was supplied; operational ML accuracy is unvalidated.
- Random splits do not estimate future-time generalization or remove shared-building effects.
- IDs only protect against resolved duplicates; unrecognized repostings remain a data-quality problem.
- Input checks restrict individual feature ranges, not every possible joint feature combination.
- Locality-average benchmarks conceal street, condition, floor and project differences.
- Catalogue updates do not retrain the synthetic model automatically; regenerate and retrain deliberately.
