import json
import joblib
import numpy as np
import pandas as pd
import pytest
from streamlit.testing.v1 import AppTest
from src.estimation import ROOT, estimate, load_rates
from src.modeling import predict_checked


def test_published_porur_calculation():
    r=estimate('Porur',1200,comparable_area=True)
    assert r['benchmark_price_inr']==9588000
    assert r['low_price_inr']==7576800
    assert r['high_price_inr']==11599200


def test_units():
    a=estimate('Adyar',1200,comparable_area=True)
    b=estimate('Adyar',1200/10.76391041671,'sq m',True)
    assert a['benchmark_price_inr']==b['benchmark_price_inr']


@pytest.mark.parametrize('locality,area,confirm',[('Unknown',1200,True),('Porur',0,True),('Porur',float('nan'),True),('Porur',float('inf'),True),('Porur',1200,False)])
def test_reject_invalid_benchmarks(locality,area,confirm):
    with pytest.raises(ValueError):estimate(locality,area,comparable_area=confirm)


def test_catalogue():
    rates=load_rates()
    assert len(rates)==17
    assert rates.source_url.str.startswith('https://').all()
    assert rates.property_type.eq('Multistorey Apartment').all()


def test_saved_model_and_split_integrity():
    folder=ROOT/'artifacts/synthetic'
    meta=json.loads((folder/'metadata.json').read_text())
    split=pd.read_csv(folder/'split_manifest.csv')
    assert not split.property_id.duplicated().any()
    assert set(split.split)=={'fit','calibration','test'}
    assert split.split.value_counts().to_dict()==meta['split_rows']
    comp=pd.read_csv(folder/'model_comparison.csv')
    assert meta['best_model']==comp.sort_values('cv_mae_inr').iloc[0]['model']
    model=joblib.load(folder/'model.joblib')
    row=dict(locality='Porur',area_sqft=1200,bedrooms=2,bathrooms=2,house_age=5,parking_spaces=1,furnishing='Unfurnished')
    assert predict_checked(model,meta,row)>0
    with pytest.raises(ValueError):predict_checked(model,meta,{**row,'locality':'Unseen'})
    with pytest.raises(ValueError):predict_checked(model,meta,{**row,'area_sqft':5000})
    held=pd.read_csv(folder/'test_predictions.csv')
    assert np.isclose(np.abs(held.price_inr-held.prediction_inr).mean(),meta['metrics']['MAE_INR'])
    assert set(held.property_id)==set(split.loc[split.split=='test','property_id'])


def test_app_estimator_and_pages():
    app=AppTest.from_file(str(ROOT/'app.py'),default_timeout=30).run()
    assert not app.exception
    app.checkbox[0].check().run()
    assert not app.exception
    assert app.metric[0].value=='₹95.88 L'
    for page in ['Locality rates','Model laboratory','Project guide']:
        app.sidebar.radio[0].set_value(page).run()
        assert not app.exception
    app.sidebar.radio[0].set_value('Model laboratory').run()
    app.button[0].click().run()
    assert not app.exception
    assert any('Synthetic model estimate'==m.label for m in app.metric)
