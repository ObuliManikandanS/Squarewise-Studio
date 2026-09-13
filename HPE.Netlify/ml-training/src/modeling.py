"""Leakage-safe price prediction through a learned rate per square foot."""
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, RegressorMixin, clone
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor

NUMERIC = ['area_sqft', 'bedrooms', 'bathrooms', 'house_age', 'parking_spaces']
CATEGORICAL = ['locality', 'furnishing']
FEATURES = NUMERIC + CATEGORICAL
LIMITS = {'area_sqft': (300,5000), 'bedrooms': (1,6), 'bathrooms': (1,6), 'house_age': (0,60), 'parking_spaces': (0,3)}
FURNISHING = ['Unfurnished','Semi-Furnished','Furnished']


def validate_features(df, allow_missing=False):
    missing = set(FEATURES) - set(df.columns)
    if missing:
        raise ValueError(f'Missing feature columns: {sorted(missing)}')
    X = df[FEATURES].copy()
    for col, (lo, hi) in LIMITS.items():
        X[col] = pd.to_numeric(X[col], errors='raise')
        present = X[col].notna()
        if ((X.loc[present,col] < lo) | (X.loc[present,col] > hi)).any():
            raise ValueError(f'{col} must be between {lo} and {hi}.')
        if col != 'area_sqft' and (X.loc[present,col] % 1 != 0).any():
            raise ValueError(f'{col} must be a whole number.')
        if X[col].isna().any() and (not allow_missing or col == 'area_sqft'):
            raise ValueError(f'{col} cannot be missing.')
    for col in CATEGORICAL:
        if X[col].isna().any() or X[col].astype(str).str.strip().eq('').any():
            raise ValueError(f'{col} cannot be missing.')
        X[col] = X[col].astype(str).str.strip()
    if not X.furnishing.isin(FURNISHING).all():
        raise ValueError('Unsupported furnishing category.')
    return X


class RateRegressor(RegressorMixin, BaseEstimator):
    def __init__(self, estimator):
        self.estimator = estimator

    def fit(self, X, y):
        self.estimator_ = clone(self.estimator)
        self.estimator_.fit(X, np.asarray(y) / X.area_sqft.to_numpy())
        return self

    def predict(self, X):
        rates = self.estimator_.predict(X)
        return rates * X.area_sqft.to_numpy()


def candidates():
    def wrap(model):
        prep = ColumnTransformer([
            ('numeric', Pipeline([('impute', SimpleImputer(strategy='median', keep_empty_features=True)), ('scale', StandardScaler())]), NUMERIC),
            ('categorical', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL)])
        pipe = Pipeline([('preprocess', prep), ('regressor', model)])
        return RateRegressor(TransformedTargetRegressor(regressor=pipe, func=np.log, inverse_func=np.exp))
    return {
        'Median rate baseline': wrap(DummyRegressor(strategy='median')),
        'Log-rate Ridge': wrap(Ridge(alpha=10)),
        'Random Forest': wrap(RandomForestRegressor(n_estimators=180, min_samples_leaf=4, random_state=42, n_jobs=1)),
        'Extra Trees': wrap(ExtraTreesRegressor(n_estimators=180, min_samples_leaf=3, random_state=42, n_jobs=1)),
        'Gradient Boosting': wrap(GradientBoostingRegressor(n_estimators=220, max_depth=3, learning_rate=.05, loss='huber', random_state=42)),
    }


def predict_checked(model, meta, row):
    X = validate_features(pd.DataFrame([row]))
    if X.locality.iloc[0] not in meta['localities']:
        raise ValueError('This locality was not represented in model fitting data.')
    for col in NUMERIC:
        lo, hi = meta['feature_bounds'][col]
        if not lo <= X[col].iloc[0] <= hi:
            raise ValueError(f'{col} is outside the fitted data range ({lo:g}–{hi:g}).')
    price = float(model.predict(X)[0])
    if not np.isfinite(price) or price <= 0:
        raise ValueError('Model returned an invalid price.')
    return price
