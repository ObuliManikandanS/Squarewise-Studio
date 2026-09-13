"""Source-backed benchmark calculations; no invented adjustment factors."""
from pathlib import Path
import math
import pandas as pd
ROOT = Path(__file__).resolve().parents[1]


def load_rates():
    df = pd.read_csv(ROOT / 'data/locality_rates.csv')
    if df.locality.duplicated().any() or not ((df.low_inr_sqft > 0) & (df.low_inr_sqft <= df.average_inr_sqft) & (df.average_inr_sqft <= df.high_inr_sqft)).all():
        raise ValueError('Invalid locality rate catalogue.')
    return df.sort_values('locality').reset_index(drop=True)


def estimate(locality, area, unit='sq ft', comparable_area=False):
    if unit not in ('sq ft', 'sq m'):
        raise ValueError('Unit must be sq ft or sq m.')
    if not comparable_area:
        raise ValueError('Confirm that the area basis is comparable to the listed properties.')
    area = float(area) * (10.76391041671 if unit == 'sq m' else 1)
    if not math.isfinite(area) or not 300 <= area <= 5000:
        raise ValueError('Supported apartment area is 300–5,000 sq ft.')
    matches = load_rates().query('locality == @locality')
    if matches.empty:
        raise ValueError('No sourced benchmark for this locality.')
    rate = matches.iloc[0].to_dict()
    return {**rate, 'area_sqft': area, 'benchmark_price_inr': round(area * rate['average_inr_sqft']),
            'low_price_inr': round(area * rate['low_inr_sqft']),
            'high_price_inr': round(area * rate['high_inr_sqft']),
            'method': 'Area multiplied by published locality apartment rate',
            'limitations': 'Portal market benchmark, not a transaction valuation. Range is not a confidence interval. Area basis is unspecified by source. Taxes, registration, interiors and other charges excluded.'}


def money(value):
    return f'₹{value / 1e7:,.2f} Cr' if value >= 1e7 else f'₹{value / 1e5:,.2f} L'
