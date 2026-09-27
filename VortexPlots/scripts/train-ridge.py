"""Reproducible experimental asking-rate model. No synthetic prices or transaction claims."""
import csv, json, hashlib, sys
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupShuffleSplit, GroupKFold, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root/'data/screened-asking-rates.csv'
directory=json.loads((root/'data/locations.json').read_text())
districts={d['name']:d['id'] for d in directory}
districts['Nilgiris']=districts['The Nilgiris']
types={'residential_plot':'Land','agricultural_land':'Agricultural land','apartment':'Apartment','independent_house':'Independent house','villa':'Villa','commercial_land':'Commercial land','industrial_land':'Industrial land','commercial_office':'Commercial office','commercial_retail':'Commercial retail','industrial_building':'Industrial building','warehouse':'Warehouse','builder_floor':'Builder floor'}
bases={'plot_area':'Plot area','super_area':'Super built-up area','carpet_area':'Carpet area','built_area':'Built-up area'}
rows=[]; excluded=[]; seen=set()
for r in csv.DictReader(source.open(encoding='utf-8-sig')):
    try:
        area=float(r['area_sqft']); price=float(r['advertised_price_inr']); rate=float(r['rate_inr_per_sqft'])
        assert np.isfinite([area,price,rate]).all() and min(area,price,rate)>0
        assert abs(price/area-rate)/rate<.01 and r['arithmetic_check']=='consistent_within_rounding_tolerance'
        assert r['district'] in districts and r['source_url'].startswith('https://')
        key=(districts[r['district']],r['locality_as_listed'].strip().casefold(),r['property_type'],area,price)
        assert key not in seen
        seen.add(key)
        rows.append({'id':r['record_id'],'districtId':districts[r['district']],'district':r['district'],'locality':r['locality_as_listed'].strip(),'propertyType':types[r['property_type']],'basis':bases[r['area_basis_source']],'area':area,'totalPrice':price,'rate':rate,'sourceUrl':r['source_url'],'sourceName':r['source_publisher'],'observedOn':r['observed_on'],'effectiveDate':r['price_effective_date'] or None,'verificationStatus':r['verification_status'],'districtAssignment':r['district_assignment_status'],'mappingSource':r['district_mapping_source_url'],'confidence':'Low','category':'asking'})
    except (ValueError,AssertionError,KeyError) as e: excluded.append(r.get('record_id','unknown'))
assert len(rows)>100
(root/'data/screened-asking.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
X=pd.DataFrame(rows)[['districtId','propertyType','basis','area']]; X['logArea']=np.log(X.pop('area'))
y=np.log(np.array([r['rate'] for r in rows])); groups=np.array([r['districtId']+'|'+r['locality'].casefold() for r in rows])
train,test=next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(X,y,groups))
cat=['districtId','propertyType','basis']
pre=ColumnTransformer([('categorical',OneHotEncoder(handle_unknown='ignore',sparse_output=False),cat),('numeric',StandardScaler(),['logArea'])])
pipe=Pipeline([('features',pre),('ridge',Ridge())])
search=GridSearchCV(pipe,{'ridge__alpha':[.1,1.,10.,100.]},cv=GroupKFold(5),scoring='neg_mean_absolute_error')
search.fit(X.iloc[train],y[train],groups=groups[train])
pred=np.exp(search.predict(X.iloc[test])); actual=np.exp(y[test]); baseline=np.repeat(np.median(np.exp(y[train])),len(test))
def metrics(a,b):return {'mae':float(mean_absolute_error(a,b)),'rmse':float(np.sqrt(mean_squared_error(a,b))),'r2':float(r2_score(a,b))}
scores=metrics(actual,pred); base=metrics(actual,baseline)
final=search.best_estimator_;final.fit(X,y)
enc=final['features'].named_transformers_['categorical']; scaler=final['features'].named_transformers_['numeric']; ridge=final['ridge']
now=datetime.now(timezone.utc).isoformat()
artifact={'version':'ridge-asking-2026-09-27.1','algorithm':'Ridge regression on log asking rate','status':'Trained — experimental','trainedAt':now,'validatedAt':now,'datasetSize':len(rows),'excludedRecords':excluded,'trainSize':len(train),'testSize':len(test),'trainingIds':[rows[i]['id'] for i in train],'validationIds':[rows[i]['id'] for i in test],'alpha':search.best_params_['ridge__alpha'],'metrics':scores,'baselineMetrics':base,'beatsMedianBaseline':scores['mae']<base['mae'],'validationMethod':'20% grouped locality holdout (seed 42); five-fold locality-grouped cross-validation on training partition for alpha selection. Final model refit on all accepted records. No temporal or independent transaction validation.','target':'Advertised INR per sq ft, not transaction value','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'features':cat+['logArea'],'categories':[c.tolist() for c in enc.categories_],'mean':float(scaler.mean_[0]),'scale':float(scaler.scale_[0]),'intercept':float(ridge.intercept_),'coefficients':ridge.coef_.tolist(),'limits':[{'districtId':d,'propertyType':t,'basis':b,'count':len(g),'minArea':float(g['area'].min()),'maxArea':float(g['area'].max())} for (d,t,b),g in pd.DataFrame(rows).groupby(['districtId','propertyType','basis'])],'confidenceInterval':None,'limitations':['Advertisements are not independently verified sales.','Effective price dates are unavailable; observed dates are collection dates.','Some locations use portal district assignment, not verified boundaries.','Listings may be duplicates across portals despite numerical deduplication.','Only district, property type, quoted area basis and area are supported; no learned age, amenity or construction adjustment.','Validation measures agreement with a small asking-price sample, not valuation accuracy.']}
vectors=[i for i,r in enumerate(rows) if sum(x['districtId']==r['districtId'] and x['propertyType']==r['propertyType'] and x['basis']==r['basis'] for x in rows)>=3][::40]
artifact['testVectors']=[{'districtId':rows[i]['districtId'],'propertyType':rows[i]['propertyType'],'basis':rows[i]['basis'],'area':rows[i]['area'],'expectedRate':float(np.exp(final.predict(X.iloc[[i]])[0]))} for i in vectors]
(root/'data/ridge-model.json').write_text(json.dumps(artifact,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'accepted':len(rows),'excluded':excluded,'districts':len(set(r['districtId'] for r in rows)),'train':len(train),'test':len(test),'alpha':artifact['alpha'],'metrics':scores,'baseline':base,'beatsBaseline':artifact['beatsMedianBaseline']},indent=2))
