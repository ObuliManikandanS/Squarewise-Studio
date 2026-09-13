# Rate provenance

Checked 12 September 2026. Reporting period **Q2 / April–June 2026**; source pages state **Updated July 2026**. This project retains the period instead of calling the values September live prices.

Primary catalogue source: [Magicbricks Chennai apartment rate table](https://www.magicbricks.com/Property-Rates-Trends/ALL-RESIDENTIAL-rates-in-Chennai).

The apartment table supplies Thiruporur, Kodambakkam, Teynampet, Ramapuram, Egmore, Koyambedu, Kilpauk, Chromepet, Navalur, Kundrathur, Thoraipakkam, Karapakkam and Kovur. Individual apartment trend pages supply:

| Locality | Low | Average | High | Source |
|---|---:|---:|---:|---|
| Anna Nagar | 12,553 | 16,275 | 19,997 | [Apartment trends](https://www.magicbricks.com/Property-Rates-Trends/Multistorey-Apartment-rates-Anna-Nagar-in-Chennai) |
| Porur | 6,314 | 7,990 | 9,666 | [Apartment trends](https://www.magicbricks.com/Property-Rates-Trends/Multistorey-Apartment-rates-Porur-in-Chennai) |
| Velachery | 7,553 | 10,231 | 12,908 | [Apartment trends](https://www.magicbricks.com/Property-Rates-Trends/Multistorey-Apartment-rates-Velachery-in-Chennai) |
| Adyar | 14,630 | 18,798 | 22,966 | [Apartment trends](https://www.magicbricks.com/Property-Rates-Trends/Multistorey-Apartment-rates-Adyar-in-Chennai) |

All numbers are INR/sq ft. Full values and source URLs for all 17 localities are in `data/locality_rates.csv`.

## Interpretation decisions

The portal mixes property types on locality pages. Values were taken specifically from **Multistorey Apartment**, not generic overview prose. For example, Porur's ₹8,256 and Velachery's ₹8,866 figures belong to builder-floor apartments; the multistorey apartment averages are ₹7,990 and ₹10,231 respectively. Plot rates in square yards were not used.

These are published market/listing benchmarks; the retrieved pages do not establish registered transaction values, a sample size, or a consistent carpet/built-up area definition. No government guideline-value or professional appraisal claim is made. A second independent matching-quarter source was not used to validate the catalogue; figures are exact transcriptions of the cited source, not universal correct prices.

## Refresh procedure

Open each cited page, select the same apartment type, verify unit and period, then update low/average/high together with period and checked date. Do not average incompatible property types, time periods or area bases. Keep the archived version and record the change. New or unsupported localities must be added with evidence rather than assigned a guessed city-wide rate.
