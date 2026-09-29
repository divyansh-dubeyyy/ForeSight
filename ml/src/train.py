import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import (roc_auc_score, average_precision_score, 
                             precision_score, recall_score, f1_score, 
                             mean_absolute_error, mean_squared_error)
from sklearn.preprocessing import LabelEncoder
import joblib
import json

def load_and_merge_data():
    df_evo = pd.read_parquet('data/processed/evolution_dataset.parquet')
    df_feat = pd.read_parquet('data/processed/features_dataset.parquet')
    
    # Select only the new features to merge
    feat_cols = ['issue_time', 'valid_time', 'region', 'lead_time_hours', 
                 'hist_mae', 'hist_rmse', 'hist_bias', 'hist_bust_freq']
    df_feat = df_feat[feat_cols]
    
    df = pd.merge(df_evo, df_feat, on=['issue_time', 'valid_time', 'region', 'lead_time_hours'], how='left')
    
    # Fill any NaNs in historical features with zeros or safe values (first few days)
    df.fillna({'hist_mae': 0, 'hist_rmse': 0, 'hist_bias': 0, 'hist_bust_freq': 0}, inplace=True)
    return df

def chronological_split(df):
    df = df.sort_values('valid_time').reset_index(drop=True)
    n = len(df)
    train_end = int(n * 0.6)
    val_end = int(n * 0.8)
    
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    return train_df, val_df, test_df

def evaluate_classification(y_true, y_pred_proba, y_pred):
    return {
        'roc_auc': roc_auc_score(y_true, y_pred_proba),
        'pr_auc': average_precision_score(y_true, y_pred_proba),
        'precision': precision_score(y_true, y_pred),
        'recall': recall_score(y_true, y_pred),
        'f1': f1_score(y_true, y_pred)
    }

def train_and_evaluate(df):
    # Encoding Region
    le = LabelEncoder()
    df['region_encoded'] = le.fit_transform(df['region'])
    
    # Target Encoding for Direction
    direction_le = LabelEncoder()
    df['direction_encoded'] = direction_le.fit_transform(df['direction'])
    
    train_df, val_df, test_df = chronological_split(df)
    
    feature_sets = {
        'Baseline (NWP+Region+Lead)': ['forecast_rainfall_mm', 'lead_time_hours', 'region_encoded'],
        'Baseline (+Evolution)': ['forecast_rainfall_mm', 'lead_time_hours', 'region_encoded', 
                                  'latest_revision', 'mean_revision', 'maximum_jump', 
                                  'volatility', 'trend', 'acceleration', 
                                  'direction_reversals', 'cumulative_revision', 'forecast_stability'],
        'Final (All Features)': ['forecast_rainfall_mm', 'lead_time_hours', 'region_encoded', 
                                  'latest_revision', 'mean_revision', 'maximum_jump', 
                                  'volatility', 'trend', 'acceleration', 
                                  'direction_reversals', 'cumulative_revision', 'forecast_stability',
                                  'hist_mae', 'hist_rmse', 'hist_bias', 'hist_bust_freq']
    }
    
    results = {}
    models_dir = 'ml/models'
    os.makedirs(models_dir, exist_ok=True)
    
    # Save encoders
    joblib.dump(le, os.path.join(models_dir, 'region_encoder.pkl'))
    joblib.dump(direction_le, os.path.join(models_dir, 'direction_encoder.pkl'))
    
    for name, features in feature_sets.items():
        print(f"\\n--- Training {name} ---")
        X_train, y_train_bust = train_df[features], train_df['is_bust']
        X_val, y_val_bust = val_df[features], val_df['is_bust']
        X_test, y_test_bust = test_df[features], test_df['is_bust']
        
        # 1. Bust Classifier
        bust_model = xgb.XGBClassifier(eval_metric='logloss', random_state=42, n_estimators=100)
        bust_model.fit(X_train, y_train_bust, eval_set=[(X_val, y_val_bust)], verbose=False)
        
        y_test_pred_proba = bust_model.predict_proba(X_test)[:, 1]
        y_test_pred = bust_model.predict(X_test)
        
        bust_metrics = evaluate_classification(y_test_bust, y_test_pred_proba, y_test_pred)
        
        # 2. Error Magnitude Model (Regression on abs_error_mm)
        y_train_err, y_val_err, y_test_err = train_df['abs_error_mm'], val_df['abs_error_mm'], test_df['abs_error_mm']
        err_model = xgb.XGBRegressor(objective='reg:squarederror', random_state=42, n_estimators=100)
        err_model.fit(X_train, y_train_err, eval_set=[(X_val, y_val_err)], verbose=False)
        
        y_test_err_pred = err_model.predict(X_test)
        err_metrics = {
            'mae': mean_absolute_error(y_test_err, y_test_err_pred),
            'rmse': np.sqrt(mean_squared_error(y_test_err, y_test_err_pred))
        }
        
        # 3. Direction Classifier
        y_train_dir, y_val_dir, y_test_dir = train_df['direction_encoded'], val_df['direction_encoded'], test_df['direction_encoded']
        dir_model = xgb.XGBClassifier(eval_metric='mlogloss', random_state=42, n_estimators=100)
        dir_model.fit(X_train, y_train_dir, eval_set=[(X_val, y_val_dir)], verbose=False)
        
        y_test_dir_pred = dir_model.predict(X_test)
        dir_metrics = {
            'macro_f1': f1_score(y_test_dir, y_test_dir_pred, average='macro')
        }
        
        results[name] = {
            'Bust Classifier': bust_metrics,
            'Error Magnitude': err_metrics,
            'Direction Classifier': dir_metrics
        }
        
        if name == 'Final (All Features)':
            joblib.dump(bust_model, os.path.join(models_dir, 'bust_classifier.pkl'))
            joblib.dump(err_model, os.path.join(models_dir, 'error_regressor.pkl'))
            joblib.dump(dir_model, os.path.join(models_dir, 'direction_classifier.pkl'))
            
            # Save test dataset with predictions for calibration later
            test_results = test_df.copy()
            test_results['pred_bust_proba'] = y_test_pred_proba
            test_results['pred_abs_error'] = y_test_err_pred
            test_results['pred_direction'] = direction_le.inverse_transform(y_test_dir_pred)
            test_results.to_parquet(os.path.join(models_dir, 'test_predictions.parquet'), index=False)
    
    with open(os.path.join(models_dir, 'evaluation_results.json'), 'w') as f:
        json.dump(results, f, indent=4)
        
    for name, res in results.items():
        print(f"\\n{name}:")
        print(f"  Bust Classifier - PR-AUC: {res['Bust Classifier']['pr_auc']:.3f}, ROC-AUC: {res['Bust Classifier']['roc_auc']:.3f}")
        print(f"  Error Magnitude - MAE: {res['Error Magnitude']['mae']:.3f}, RMSE: {res['Error Magnitude']['rmse']:.3f}")
        print(f"  Direction       - Macro F1: {res['Direction Classifier']['macro_f1']:.3f}")

if __name__ == "__main__":
    df = load_and_merge_data()
    train_and_evaluate(df)
