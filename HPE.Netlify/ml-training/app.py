"""Chennai apartment benchmark and reproducible model laboratory."""
import json
import joblib
import pandas as pd
import streamlit as st
from src.estimation import ROOT, load_rates, estimate, money
from src.modeling import predict_checked, FURNISHING

st.set_page_config(page_title='Chennai Home • Price Estimator',page_icon='🏠',layout='wide')
st.markdown('''<style>
.stApp {background:#f5f7fb;} h1,h2,h3 {color:#16334b;} 
[data-testid="stMetric"] {background:white;border:1px solid #dae3ed;border-radius:12px;padding:18px;}
[data-testid="stSidebar"] {background:#eaf0f5;}
</style>''',unsafe_allow_html=True)
st.caption('CHENNAI HOME  /  PROPERTY INTELLIGENCE')
st.title('Understand the price. See the evidence.')
st.write('Apartment price benchmarks across Chennai, with a transparent calculation and a separate machine-learning workspace.')
rates=load_rates()
with st.sidebar:
    st.header('Your workspace')
    page=st.radio('Explore',['Price estimator','Locality rates','Model laboratory','Project guide'])
    st.divider()
    st.caption('Coverage: 17 localities • Multistorey apartments')
    st.caption('Rate period: Q2 2026\n\nSource updated: July 2026\n\nChecked: 12 September 2026')
    st.caption('These are published market benchmarks, not live quotes or registered sale prices.')

if page=='Price estimator':
    left,right=st.columns([1,1.35],gap='large')
    with left:
        st.subheader('01 · Apartment details')
        locality=st.selectbox('Locality',rates.locality,index=rates.locality.tolist().index('Porur'))
        unit=st.radio('Area unit',['sq ft','sq m'],horizontal=True)
        area=st.number_input('Listed apartment area',min_value=1.,max_value=5000.,value=1200. if unit=='sq ft' else 111.48,step=1.,key='area_'+unit)
        st.caption('The portal does not specify carpet, built-up or super built-up basis. Confirm comparable listed area; no automatic carpet-area conversion is applied.')
        comparable=st.checkbox('I have checked that the area is comparable to the source listings.')
    with right:
        st.subheader('02 · Price benchmark')
        if not comparable:
            st.info('Confirm the area basis to see the calculation.')
        else:
            try:
                result=estimate(locality,area,unit,comparable)
                st.metric('Locality-average benchmark',money(result['benchmark_price_inr']))
                a,b=st.columns(2)
                a.metric('Published rate',f"₹{result['average_inr_sqft']:,.0f} / sq ft")
                b.metric('Area used',f"{result['area_sqft']:,.1f} sq ft")
                st.write(f"**Published-rate range:** {money(result['low_price_inr'])} – {money(result['high_price_inr'])}")
                st.caption('This is the source rate range multiplied by your area. It is not a statistical confidence interval.')
                st.code(f"{result['area_sqft']:,.2f} sq ft × ₹{result['average_inr_sqft']:,.0f}/sq ft = ₹{result['benchmark_price_inr']:,.0f}",language=None)
                st.markdown(f"[View the rate source]({result['source_url']}) · {result['period']}")
                st.caption('The benchmark does not adjust for age, floor, furnishing, legal condition or amenities. Taxes, registration, interiors and additional charges are excluded.')
                st.download_button('Download estimate (JSON)',json.dumps(result,indent=2),file_name='chennai_estimate.json',mime='application/json')
            except ValueError as e:st.error(str(e))
    st.divider()
    st.subheader('Compare the same area across localities')
    names=st.multiselect('Compare up to five',rates.locality,default=['Porur','Velachery','Anna Nagar'],max_selections=5)
    if names and comparable:
        try:
            comparison=pd.DataFrame([estimate(n,area,unit,True) for n in names])
            st.bar_chart(comparison.set_index('locality')[['low_price_inr','benchmark_price_inr','high_price_inr']],stack=False)
        except ValueError as e:st.error(str(e))

elif page=='Locality rates':
    st.subheader('A traceable rate catalogue')
    st.write('All figures are INR per square foot for multistorey apartments. Published values are retained without rounding or invented locality premiums.')
    st.dataframe(rates,hide_index=True,use_container_width=True,column_config={'source_url':st.column_config.LinkColumn('Source')})
    st.download_button('Download rate catalogue',rates.to_csv(index=False),file_name='locality_rates.csv',mime='text/csv')
    st.caption('Area basis is unspecified by the publisher. The catalogue is a dated snapshot; refresh it from the linked apartment section before use with newer market conditions.')

elif page=='Model laboratory':
    st.subheader('Model selection you can inspect')
    kind=st.selectbox('Dataset',['synthetic']+(['real'] if (ROOT/'artifacts/real/metadata.json').exists() else []))
    folder=ROOT/'artifacts'/kind
    if not (folder/'metadata.json').exists():
        st.info('Run python generate_sample_data.py followed by python train_model.py.');st.stop()
    meta=json.loads((folder/'metadata.json').read_text())
    if kind=='synthetic':st.warning('DEMONSTRATION DATA — learned prices and accuracy scores below are synthetic. They do not establish real Chennai market accuracy.')
    else:st.info('Results use your supplied real dataset. Check source quality, price basis and observation dates before relying on them.')
    st.write(f"**Selected model:** {meta['best_model']}  ·  **Target:** total price in INR")
    st.caption(meta['selection'])
    a,b,c=st.columns(3)
    a.metric('Untouched test MAE',money(meta['metrics']['MAE_INR']))
    b.metric('Test MAPE',f"{meta['metrics']['MAPE_percent']:.2f}%")
    c.metric('Test R²',f"{meta['metrics']['R2']:.3f}")
    st.dataframe(pd.DataFrame(meta['comparison']),hide_index=True,use_container_width=True)
    with st.expander('Evaluate a model scenario'):
        loc=st.selectbox('Model locality',meta['localities'])
        row={'locality':loc}
        labels={'area_sqft':'Area (sq ft)','bedrooms':'Bedrooms','bathrooms':'Bathrooms','house_age':'Age (years)','parking_spaces':'Parking spaces'}
        defaults={'area_sqft':1200,'bedrooms':2,'bathrooms':2,'house_age':5,'parking_spaces':1}
        cols=st.columns(2)
        for i,(key,label) in enumerate(labels.items()):
            lo,hi=meta['feature_bounds'][key]
            row[key]=cols[i%2].number_input(label,min_value=float(lo),max_value=float(hi),value=float(max(lo,min(hi,defaults[key]))),step=1.)
        row['furnishing']=st.selectbox('Furnishing',FURNISHING)
        st.caption(f"Training area basis: {meta['area_basis']} • Price basis: {meta['price_basis']}")
        if st.button('Run model prediction',type='primary'):
            try:
                model=joblib.load(folder/'model.joblib')
                price=predict_checked(model,meta,row);q=meta['relative_interval_q']
                st.metric('Synthetic model estimate' if kind=='synthetic' else 'Model estimate',money(price))
                st.write(f"Calibrated 90% interval: {money(max(0,price*(1-q)))} – {money(price*(1+q))}")
                st.caption('Calibration is measured on separate records from the same data source; it is not a guarantee for a particular property or future market.')
            except (ValueError,ImportError,AttributeError) as e:st.error(f'{e} Retrain with the installed environment if model versions differ.')
    p=pd.read_csv(folder/'test_predictions.csv')
    st.subheader('Held-out predictions')
    st.scatter_chart(p,x='price_inr',y='prediction_inr')
    st.dataframe(pd.read_csv(folder/'locality_errors.csv'),hide_index=True,use_container_width=True)
    st.download_button('Download test predictions',p.to_csv(index=False),file_name=f'{kind}_test_predictions.csv',mime='text/csv')
    with st.expander('Model metadata and limitations'):st.json(meta)
else:
    st.subheader('How this project works')
    st.markdown('''1. **Benchmark:** choose a locality and multiply comparable apartment area by the published rate.
2. **Model laboratory:** compare regression candidates on development folds; evaluate the selected model on untouched test properties.
3. **Real data:** follow `docs/DATA_GUIDE.md`, supply property-level records, and run `python train_model.py --csv data/real_properties.csv --kind real`.
4. **Reproducibility:** inspect the dataset hash, split manifest, version metadata and test predictions in `artifacts/`.

The included ML dataset is synthetic. No real transaction dataset was supplied. Real-world model accuracy remains unvalidated. Apartment benchmarks cannot estimate independent houses, plots or construction costs.''')
    st.caption('Detailed setup, architecture, data schema and model decisions are included in the project README and docs folder.')
