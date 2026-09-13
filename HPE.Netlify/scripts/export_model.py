"""Export the project's compatible synthetic Gradient Boosting pipeline."""
import argparse
import json
import sys
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--project',type=Path,required=True)
args=parser.parse_args()
project=args.project.resolve()
sys.path.insert(0,str(project))
import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
metadata=json.loads((project/'artifacts/synthetic/metadata.json').read_text())
if metadata['data_kind']!='synthetic':raise ValueError('This exporter is for the separately labelled synthetic demo only.')
model=joblib.load(project/'artifacts/synthetic/model.joblib')
pipeline=model.estimator_.regressor_
prep=pipeline['preprocess'];reg=pipeline['regressor']
if not isinstance(reg,GradientBoostingRegressor):raise ValueError('This inference exporter supports Gradient Boosting only. Implement and verify a matching exporter for another winner.')
num=prep.named_transformers_['numeric'];cat=prep.named_transformers_['categorical']
out=Path(__file__).resolve().parents[1]/'src/lib/data'
export={'numeric':['area_sqft','bedrooms','bathrooms','house_age','parking_spaces'],'median':num['impute'].statistics_.tolist(),'mean':num['scale'].mean_.tolist(),'scale':num['scale'].scale_.tolist(),'categories':[c.tolist() for c in cat.categories_],'initial':float(reg.init_.constant_[0][0]),'learningRate':reg.learning_rate,'trees':[{'left':t.tree_.children_left.tolist(),'right':t.tree_.children_right.tolist(),'feature':t.tree_.feature.tolist(),'threshold':t.tree_.threshold.tolist(),'value':t.tree_.value[:,0,0].tolist()} for t in reg.estimators_[:,0]]}
(out/'demo-model.json').write_text(json.dumps(export,separators=(',',':')))
(out/'model-meta.json').write_text(json.dumps(metadata,indent=2))
X=pd.read_csv(project/'data/demo_properties.csv').iloc[::40][export['numeric']+['locality','furnishing']]
(out/'parity-fixtures.json').write_text(json.dumps([{'input':r,'expected':float(p)} for r,p in zip(X.to_dict('records'),model.predict(X))]))
print('Exported model and parity fixtures. Run node scripts/verify-pricing.cjs before rebuilding.')
