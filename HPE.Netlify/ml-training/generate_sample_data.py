"""Generate explicitly synthetic educational records, NEVER real transactions."""
import numpy as np
import pandas as pd
from src.estimation import ROOT, load_rates


def main(rows=2400):
    rng=np.random.default_rng(42)
    rates=load_rates().set_index('locality')
    locality=rng.choice(rates.index,rows)
    bedrooms=rng.integers(1,6,rows)
    area=np.clip(bedrooms * rng.uniform(350,600,rows),350,3500).round()
    age=rng.integers(0,36,rows)
    parking=rng.integers(0,3,rows)
    furnishing=rng.choice(['Unfurnished','Semi-Furnished','Furnished'],rows)
    # Assumptions below are invented ONLY for model training demonstrations.
    effect=pd.Series(furnishing).map({'Unfurnished':0,'Semi-Furnished':.025,'Furnished':.06}).to_numpy()
    rate=rates.loc[locality,'average_inr_sqft'].to_numpy()*np.exp(-.007*age+.018*parking+effect+rng.normal(0,.13,rows))
    df=pd.DataFrame({'property_id':[f'demo-{i:05d}' for i in range(rows)],'locality':locality,'area_sqft':area,'bedrooms':bedrooms,
        'bathrooms':np.clip(bedrooms+rng.integers(-1,2,rows),1,6),'house_age':age,'parking_spaces':parking,
        'furnishing':furnishing,'price_inr':(area*rate).round(),'data_kind':'synthetic',
        'observed_on':'2026-06-30','area_basis':'synthetic_listed_area','property_type':'Multistorey Apartment','price_basis':'synthetic','source_url':'synthetic://generator-v2'})
    out=ROOT/'data/demo_properties.csv';df.to_csv(out,index=False)
    print(f'Created {len(df)} SYNTHETIC records: {out}')

if __name__=='__main__':main()
