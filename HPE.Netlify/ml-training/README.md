# Chennai House Price Estimation System

A complete local Python/Streamlit project with sourced **apartment rate benchmarks**, a separate **ML laboratory**, reproducible model comparison and a clean modular structure.

## Start here

Use Python **3.11 or 3.12**. Open a terminal in this folder.

```bash
python -m venv .venv
```

Activate on Windows:

```bat
.venv\Scripts\activate
```

Activate on macOS/Linux:

```bash
source .venv/bin/activate
```

Install and launch:

```bash
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Open http://localhost:8501. The synthetic model is already trained and included. The benchmark calculator does not need a model. `run_windows.bat` and `run.sh` are launch shortcuts after installation and environment activation.

## What is corrected

The uploaded version generated every property from a ₹5,200/sq ft formula plus arbitrary bonuses and selected the model using the test set. Those figures were synthetic, not verified Chennai market prices.

This version:

- Uses 17 named Chennai localities with published low, average and high apartment rates, source URLs and period metadata.
- Keeps prices in INR and area in square feet, with explicit square-metre conversion.
- Shows the formula, a published-rate range and a downloadable estimate.
- Avoids unsupported premiums for bedrooms, furnishing or age in the source-backed calculator.
- Separates synthetic ML demonstrations from sourced rate calculations.
- Compares five models using five-fold development cross-validation MAE; evaluates only the winner on an untouched test set.
- Fits preprocessing separately inside each fold, saves the complete fitted estimator and refuses unsupported model inputs.
- Includes a separate calibration set for prediction intervals, test predictions, locality errors, dataset hash and split manifest.

## Accuracy and scope

**No model can promise a perfect property price.** The source is a Q2 2026 apartment market snapshot, updated by the portal in July and checked on 12 September 2026. It is not a live quotation or a dataset of completed sales.

The included 2,400 ML records are explicitly **synthetic**. Their metrics measure learning on the generator, not real-world Chennai valuation accuracy. Real transaction-level data is still required to validate the ML model for actual pricing.

Only multistorey apartments are supported. Do not use these rates for plots, independent houses, builder floors, land-plus-construction valuations or construction-only cost. The source does not specify carpet/built-up area methodology: the calculator requires confirmation of comparable listed area. Taxes, registration, interiors and other charges are excluded.

## Project layout

| Path | Purpose |
|---|---|
| `app.py` | Estimator, rate catalogue, model laboratory and guide |
| `src/estimation.py` | Rate loading, unit validation and transparent calculations |
| `src/modeling.py` | Feature validation, independent pipelines and rate-to-price estimator |
| `generate_sample_data.py` | Reproducible, explicitly synthetic dataset |
| `train_model.py` | Validation, splits, model comparison, calibration and evaluation |
| `data/locality_rates.csv` | Published apartment rates and provenance |
| `data/demo_properties.csv` | 2,400 synthetic educational properties |
| `data/real_properties_template.csv` | Empty real-data schema |
| `data/legacy/original_synthetic.csv` | Uploaded dataset preserved for audit, unused by the new model |
| `artifacts/synthetic/` | Trained demonstration model, metrics and split records |
| `docs/DATA_GUIDE.md` | Required columns, units and real-data collection rules |
| `docs/METHODOLOGY.md` | Model design, selection, intervals and limitations |
| `docs/SOURCES.md` | Rate sources, date and interpretation |
| `docs/VALIDATION.md` | Checks run on this delivered version |
| `tests/test_project.py` | Calculation, invalid-input, model and UI workflow tests |
| `.streamlit/config.toml` | Application theme and settings |

## Rebuild the demonstration

```bash
python generate_sample_data.py
python train_model.py
python -m pytest -q
```

Training writes `artifacts/synthetic/`. It never overwrites real-data artifacts. The lowest mean CV MAE wins; candidate names do not imply a guaranteed winner.

## Train with real data

Populate `data/real_properties_template.csv` using the instructions in `docs/DATA_GUIDE.md`, save it as `data/real_properties.csv`, then run:

```bash
python train_model.py --csv data/real_properties.csv --kind real
```

The app will offer the real model in the laboratory after rerunning. Use `--output PATH` to save an experiment elsewhere; the app reads only the default `artifacts/real` and `artifacts/synthetic` folders. Source-backed benchmark results remain independent of trained models.

## Troubleshooting

- **Missing package:** activate the environment and run the installation command above.
- **Model version mismatch:** retrain in your environment. Pickle/joblib models are version-sensitive; load only artifacts you trust.
- **Unsupported input:** stay within the fitted training bounds shown in the model form.
- **New locality:** add a properly sourced catalogue record for the benchmark; real-model support requires real training records in that locality.
- **Outdated rates:** manually verify apartment rates using `docs/SOURCES.md`, update the catalogue and its period/checked date; do not silently label old data as current.

This is a local project, not a hosted service. No accounts, authentication, payments or third-party API keys are required.
