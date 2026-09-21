"""Offline training: never publish a model automatically.
Input: licensed property-level CSV (data/training-template.csv).
Target: advertised INR per sqft, separately for each property type / area basis.
Refuses insufficient data. Holds out districts and disjoint property IDs; reports
future-period performance separately when at least 20 records remain.
Run: python scripts/train.py data/training.csv
"""
import argparse,datetime,hashlib,json,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]

def train(source):
 import pandas as pd
 import numpy as np
 from sklearn.compose import ColumnTransformer
 from sklearn.preprocessing import OneHotEncoder,StandardScaler
 from sklearn.pipeline import make_pipeline
 from sklearn.impute import SimpleImputer
 from sklearn.linear_model import Ridge
 from sklearn.ensemble import RandomForestRegressor
 from sklearn.dummy import DummyRegressor
 from sklearn.model_selection import GroupShuffleSplit
 from sklearn.metrics import mean_absolute_error,mean_squared_error,median_absolute_error,r2_score
 import joblib,sklearn
 raw=source.read_bytes();fingerprint=hashlib.sha256(raw).hexdigest();df=pd.read_csv(source)
 required=['propertyId','district','locality','propertyType','basis','effectiveDate','areaSqft','latitude','longitude','ageYears','rate','category','sourceUrl','reuseApproval']
 if any(c not in df for c in required):raise ValueError('Training schema incomplete; see training-template.csv')
 if df[required].isna().any().any():raise ValueError('Required provenance or feature is missing')
 if not df.category.eq('asking').all():raise ValueError('This workflow supports asking rates only; do not mix price categories')
 if not df.sourceUrl.str.startswith('https://').all() or not df.reuseApproval.astype(str).str.strip().ne('').all():raise ValueError('Missing source or reuse approval')
 df['effectiveDate']=pd.to_datetime(df.effectiveDate,utc=True,errors='raise');today=pd.Timestamp.now(tz='UTC')
 if ((df.effectiveDate>today)|((today-df.effectiveDate).dt.days>365)).any():raise ValueError('Future or stale observations')
 for col in ['areaSqft','latitude','longitude','ageYears','rate']:df[col]=pd.to_numeric(df[col],errors='raise')
 if not np.isfinite(df[['areaSqft','latitude','longitude','ageYears','rate']]).all().all():raise ValueError('Nonfinite values')
 if not ((df.areaSqft>0)&(df.areaSqft<=1e7)&df.rate.between(.01,1e6)&df.latitude.between(8,14)&df.longitude.between(76,81)&df.ageYears.between(0,150)).all():raise ValueError('Area, coordinate, age or target out of range')
 known={d['name'] for d in json.loads((ROOT/'data/locations.json').read_text())}
 if not set(df.district).issubset(known):raise ValueError('Unknown district')
 if len(df)<100:raise ValueError('At least 100 independent observations are required before evaluation')
 # Keep the latest observation per physical property globally, before any split.
 df=df.sort_values('effectiveDate').drop_duplicates('propertyId',keep='last')
 results=[];features=['district','locality','areaSqft','latitude','longitude','ageYears']
 for (ptype,basis),part in df.groupby(['propertyType','basis']):
  if len(part)<100 or part.district.nunique()<5:results.append({'propertyType':ptype,'basis':basis,'status':'insufficient_data'});continue
  cutoff=part.effectiveDate.quantile(.8);past=part[part.effectiveDate<cutoff];future=part[part.effectiveDate>=cutoff]
  if len(past)<60 or past.district.nunique()<4:results.append({'propertyType':ptype,'basis':basis,'status':'insufficient_temporal_diversity'});continue
  trainidx,testidx=next(GroupShuffleSplit(n_splits=1,test_size=.25,random_state=42).split(past,groups=past.district));a,b=past.iloc[trainidx],past.iloc[testidx]
  pre=ColumnTransformer([('categories',OneHotEncoder(handle_unknown='ignore',sparse_output=False),['district','locality']),('numbers',make_pipeline(SimpleImputer(strategy='median'),StandardScaler()),['areaSqft','latitude','longitude','ageYears'])])
  def scores(model,frame):
   pred=model.predict(frame[features]);truth=frame.rate
   if not np.isfinite(pred).all() or (pred<=0).any() or (pred>1e6).any():raise ValueError('Model output outside accepted range')
   return {'n':len(frame),'MAE':mean_absolute_error(truth,pred),'RMSE':float(np.sqrt(mean_squared_error(truth,pred))),'R2':r2_score(truth,pred) if len(frame)>1 else None,'medianAbsoluteError':median_absolute_error(truth,pred)}
  for name,model in [('median',DummyRegressor(strategy='median')),('ridge',Ridge(alpha=10)),('forest',RandomForestRegressor(n_estimators=200,min_samples_leaf=5,random_state=42,n_jobs=-1))]:
   pipeline=make_pipeline(pre,model);pipeline.fit(a[features],a.rate)
   row={'propertyType':ptype,'basis':basis,'model':name,'status':'evaluation_only','geographyHoldout':scores(pipeline,b),'futureHoldout':scores(pipeline,future) if len(future)>=20 else None,'byDistrict':{d:scores(pipeline,f) for d,f in b.groupby('district')},'trainDistricts':sorted(a.district.unique().tolist()),'heldoutDistricts':sorted(b.district.unique().tolist()),'trainCount':len(a)}
   folder=ROOT/'model-registry/artifacts'/fingerprint[:16];folder.mkdir(parents=True,exist_ok=True);joblib.dump(pipeline,folder/f'{ptype.replace(" ","-")}-{name}.joblib');results.append(row)
 report={'datasetSha256':fingerprint,'validatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'target':'INR per sqft asking rate','features':features,'seed':42,'sklearn':sklearn.__version__,'status':'evaluation_only_not_deployed','results':results}
 out=ROOT/'model-registry'/f'evaluation-{fingerprint[:16]}.json';out.write_text(json.dumps(report,indent=2,allow_nan=False));return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source',type=pathlib.Path);args=p.parse_args()
 try:print(json.dumps(train(args.source),indent=2))
 except Exception as e:print(json.dumps({'status':'blocked','reason':str(e),'productionModelChanged':False}));sys.exit(1)
