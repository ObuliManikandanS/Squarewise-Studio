# Data guide

## Two separate data sources

`locality_rates.csv` is a dated source-backed benchmark catalogue. `demo_properties.csv` is synthetic and must never be renamed or relabelled as real market data. The original dataset is archived under `data/legacy/` and unused.

## Real property schema

Use one row per uniquely resolved physical apartment. Use the same ID for repostings across portals and deduplicate them before training. At least 150 unique records and 15 per locality are required as a basic operational gate, not as proof of statistical sufficiency. Much larger, representative datasets are preferable.

| Column | Required value / rule |
|---|---|
| property_id | Nonempty stable apartment identifier; unique after deduplication |
| locality | Consistently spelled Chennai locality; nonempty |
| area_sqft | Numeric, 300–5,000, square feet; required |
| bedrooms | Integer 1–6; blank permitted for training only |
| bathrooms | Integer 1–6; blank permitted for training only |
| house_age | Integer 0–60 years; blank permitted for training only |
| parking_spaces | Integer 0–3; blank permitted for training only |
| furnishing | Unfurnished, Semi-Furnished or Furnished |
| price_inr | Positive finite total property price in rupees, not lakh/crore units |
| data_kind | real |
| observed_on | ISO observation date YYYY-MM-DD |
| area_basis | carpet, built_up or super_built_up; one basis per dataset |
| property_type | Multistorey Apartment |
| price_basis | asking or sale; one basis per dataset |
| source_url | HTTP(S) provenance URL for that record |

For example, a quoted ₹95 lakh must be entered as 9500000. Convert square metres by multiplying by 10.76391041671. Do not convert carpet to super-built-up with an assumed universal multiplier.

Keep genuine unusual properties unless a documented data error explains them; automatically trimming high prices can discard legitimate premium apartments. Record exclusions during collection. The training script rejects impossible values rather than silently repairing them. Numeric missing values are imputed from fitting folds only. Area and categorical inputs cannot be missing.

The script validates labels and shape, not the truth of supplied records. Collect lawful, attributable data, resolve duplicate physical properties and ensure the scope really is Chennai. Avoid including seller contact details or other unnecessary personal data.

## Before operational use

Gather geographically representative observations of the same price and area basis. Validate later observations using chronological splits; also consider held-out building/project groups. Audit errors by locality, area, age, price segment and source. The bundled random property split does not establish future-market performance and can be optimistic for apartments in the same building.

The empty template has headers only, so it cannot accidentally be mistaken for real observations.
