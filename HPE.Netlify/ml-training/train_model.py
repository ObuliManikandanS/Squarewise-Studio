"""Select by development CV; evaluate winner once on untouched test groups."""
import argparse
import hashlib
import json
import math
import platform
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import GroupShuffleSplit, GroupKFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from src.estimation import ROOT
from src.modeling import FEATURES, NUMERIC, candidates, validate_features


def train(csv_path, kind='synthetic', output=None):
    csv_path=__import__('pathlib').Path(csv_path)
    df=pd.read_csv(csv_path)
    required=set(FEATURES+['price_inr','property_id','data_kind','observed_on','area_basis','property_type','price_basis','source_url'])
    if not required.issubset(df):raise ValueError(f'Missing columns: {sorted(required-set(df))}')
    if df[list(required)].empty:raise ValueError('No records.')
    for col in ['property_id','data_kind','area_basis','property_type','price_basis','source_url']:
        if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any():raise ValueError(f'{col} cannot be empty.')
    if not df.data_kind.eq(kind).all():raise ValueError('Dataset kind does not match --kind. Do not mix real and synthetic data.')
    if not df.property_type.eq('Multistorey Apartment').all():raise ValueError('Only multistorey apartments supported.')
    if df.area_basis.nunique()!=1:raise ValueError('Normalize area basis before training.')
    if df.price_basis.nunique()!=1:raise ValueError('Do not mix asking prices and completed sale prices.')
    if kind=='real' and (not df.source_url.str.startswith(('https://','http://')).all() or not df.price_basis.isin(['asking','sale']).all() or not df.area_basis.isin(['carpet','built_up','super_built_up']).all()):
        raise ValueError('Real data needs source URLs, asking/sale price basis and a normalized area basis.')
    dates=pd.to_datetime(df.observed_on, errors='raise')
    if dates.isna().any():raise ValueError('Observation date cannot be missing.')
    df=df.drop_duplicates().reset_index(drop=True)
    # One observation per property avoids repeated listings leaking across groups.
    if df.property_id.duplicated().any():raise ValueError('Duplicate property IDs: keep one consistent observation per property before training.')
    df[FEATURES]=validate_features(df,allow_missing=True)
    y=pd.to_numeric(df.price_inr,errors='raise')
    if not np.isfinite(y).all() or (y<=0).any():raise ValueError('Prices must be finite positive INR values.')
    if len(df)<150 or df.locality.value_counts().min()<15:raise ValueError('Need at least 150 properties and 15 per locality.')
    # Conservative near-duplicate check across IDs.
    df=df.drop_duplicates(subset=FEATURES+['price_inr']).reset_index(drop=True)
    if len(df)<150:raise ValueError('Fewer than 150 properties after duplicate removal.')
    fit_cal,test=next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(df,groups=df.property_id))
    fit0,cal0=next(GroupShuffleSplit(n_splits=1,test_size=.1875,random_state=43).split(df.iloc[fit_cal],groups=df.iloc[fit_cal].property_id))
    fit,cal=fit_cal[fit0],fit_cal[cal0]
    X,y=df[FEATURES],df.price_inr.astype(float)
    scores=[];models=candidates()
    for name,model in models.items():
        values=-cross_val_score(model,X.iloc[fit],y.iloc[fit],groups=df.iloc[fit].property_id,cv=GroupKFold(5),scoring='neg_mean_absolute_error',n_jobs=1,error_score='raise')
        scores.append({'model':name,'cv_mae_inr':float(values.mean()),'cv_std_inr':float(values.std())})
        print(f'{name}: CV MAE ₹{values.mean():,.0f}',flush=True)
    comparison=pd.DataFrame(scores).sort_values('cv_mae_inr').reset_index(drop=True)
    name=comparison.iloc[0]['model'];model=models[name].fit(X.iloc[fit],y.iloc[fit])
    # Calibration uses relative-to-prediction residuals. No refit afterwards.
    cp=model.predict(X.iloc[cal]);res=np.abs(y.iloc[cal].to_numpy()-cp)/cp
    rank=min(len(res),math.ceil((len(res)+1)*.9));q=float(np.sort(res)[rank-1])
    pred=model.predict(X.iloc[test]);actual=y.iloc[test].to_numpy()
    low=np.maximum(0,pred*(1-q));high=pred*(1+q)
    metrics={'MAE_INR':float(mean_absolute_error(actual,pred)),'RMSE_INR':float(mean_squared_error(actual,pred)**.5),
        'R2':float(r2_score(actual,pred)),'MAPE_percent':float(mean_absolute_percentage_error(actual,pred)*100),
        'interval_coverage_percent':float(((actual>=low)&(actual<=high)).mean()*100)}
    meta={'best_model':name,'data_kind':kind,'training_sha256':hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        'selection':'Lowest mean 5-fold development CV MAE in INR; holdout never used for selection',
        'metrics':metrics,'comparison':comparison.to_dict('records'),'relative_interval_q':q,'interval_nominal_coverage':.9,
        'localities':sorted(X.iloc[fit].locality.unique().tolist()),
        'feature_bounds':{c:[float(X.iloc[fit][c].min()),float(X.iloc[fit][c].max())] for c in NUMERIC},
        'split_rows':{'fit':len(fit),'calibration':len(cal),'test':len(test)},'seed':42,
        'area_basis':df.area_basis.iloc[0],'price_basis':df.price_basis.iloc[0],
        'date_range':[str(dates.min().date()),str(dates.max().date())],
        'versions':{'python':platform.python_version(),'scikit-learn':sklearn.__version__,'numpy':np.__version__,'pandas':pd.__version__,'joblib':joblib.__version__},
        'limitations':'Random property-group holdout; not future-time validation. Synthetic scores are not market accuracy. Interval coverage requires exchangeable future records; not guaranteed by locality.'}
    out=__import__('pathlib').Path(output) if output else ROOT/'artifacts'/kind
    out.mkdir(parents=True,exist_ok=True)
    joblib.dump(model,out/'model.joblib',compress=3)
    (out/'metadata.json').write_text(json.dumps(meta,indent=2))
    comparison.to_csv(out/'model_comparison.csv',index=False)
    predictions=df.iloc[test][['property_id','locality','area_sqft','price_inr']].copy()
    predictions['prediction_inr']=pred;predictions['low_inr']=low;predictions['high_inr']=high
    predictions.to_csv(out/'test_predictions.csv',index=False)
    split=df[['property_id']].copy();split['split']=''
    for label,idx in [('fit',fit),('calibration',cal),('test',test)]:split.loc[idx,'split']=label
    split.to_csv(out/'split_manifest.csv',index=False)
    errors=predictions.assign(absolute_error_inr=np.abs(actual-pred)).groupby('locality').agg(properties=('property_id','count'),mae_inr=('absolute_error_inr','mean'))
    errors.to_csv(out/'locality_errors.csv')
    print(json.dumps({'winner':name,'test':metrics},indent=2))
    return meta

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--csv',default=str(ROOT/'data/demo_properties.csv'));p.add_argument('--kind',choices=['synthetic','real'],default='synthetic');p.add_argument('--output')
    a=p.parse_args();train(a.csv,a.kind,a.output)
