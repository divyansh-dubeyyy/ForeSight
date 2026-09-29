import os
import json
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.ensemble import IsolationForest
from sklearn.metrics import brier_score_loss
import joblib

def load_data():
    # We need the original datasets to do calibration and OOD training
    df_train, df_val, df_test = get_splits()
    # Also load the predictions for the test set
    test_preds = pd.read_parquet('ml/models/test_predictions.parquet')
    return df_train, df_val, test_preds

def get_splits():
    from ml.src.train import load_and_merge_data, chronological_split
    df = load_and_merge_data()
    return chronological_split(df)

class ReliabilityEngine:
    def __init__(self):
        self.calibrator = IsotonicRegression(out_of_bounds='clip')
        self.ood_detector = IsolationForest(random_state=42, contamination=0.05)
        self.conformal_q = None
        self.features = ['forecast_rainfall_mm', 'lead_time_hours', 'region_encoded', 'latest_revision', 
                         'mean_revision', 'maximum_jump', 'volatility', 'trend', 
                         'acceleration', 'direction_reversals', 'cumulative_revision', 
                         'forecast_stability', 'hist_mae', 'hist_rmse', 'hist_bias', 'hist_bust_freq']
        self.region_le = joblib.load('ml/models/region_encoder.pkl')
        
    def fit(self, val_df, bust_model, err_model):
        X_val = val_df[self.features]
        # 1. Calibrator
        raw_val_proba = bust_model.predict_proba(X_val)[:, 1]
        self.calibrator.fit(raw_val_proba, val_df['is_bust'])
        
        # 2. Conformal Uncertainty (split conformal prediction on abs_error_mm)
        val_err_preds = err_model.predict(X_val)
        residuals = np.abs(val_df['abs_error_mm'] - val_err_preds)
        # 90% prediction interval
        n = len(residuals)
        alpha = 0.1
        q_level = np.ceil((n + 1) * (1 - alpha)) / n
        q_level = min(q_level, 1.0)
        self.conformal_q = np.quantile(residuals, q_level)
        
        # 3. OOD Detector (Model Trust)
        self.ood_detector.fit(X_val)
        
    def predict(self, X_test, raw_proba, err_preds):
        # Forecast Risk
        calibrated_proba = self.calibrator.predict(raw_proba)
        
        # Forecast Uncertainty
        lower_bound = np.maximum(0, err_preds - self.conformal_q)
        upper_bound = err_preds + self.conformal_q
        
        # Model Trust (OOD)
        # Isolation Forest returns 1 for inliers, -1 for outliers
        is_inlier = self.ood_detector.predict(X_test)
        trust_status = np.where(is_inlier == 1, 'HIGH', 'LOW (OOD)')
        
        return calibrated_proba, lower_bound, upper_bound, trust_status

def evaluate_phase5(engine, test_df, test_preds):
    X_test = test_df[engine.features]
    raw_proba = test_preds['pred_bust_proba']
    err_preds = test_preds['pred_abs_error']
    
    cal_proba, lower, upper, trust = engine.predict(X_test, raw_proba, err_preds)
    
    # Evaluate Calibration
    raw_brier = brier_score_loss(test_df['is_bust'], raw_proba)
    cal_brier = brier_score_loss(test_df['is_bust'], cal_proba)
    
    # Evaluate Uncertainty
    true_err = test_df['abs_error_mm']
    coverage = np.mean((true_err >= lower) & (true_err <= upper))
    mean_width = np.mean(upper - lower)
    
    # Evaluate OOD False Alarms (How often is it OOD but not a bust?)
    # A true "false alarm" in OOD is subjective, but let's see how many normal events are flagged.
    ood_mask = trust == 'LOW (OOD)'
    normal_events = test_df['is_bust'] == 0
    ood_false_alarm_rate = np.sum(ood_mask & normal_events) / np.sum(normal_events) if np.sum(normal_events) > 0 else 0
    
    print(f"--- Phase 5 Evaluation ---")
    print(f"Brier Score (Raw): {raw_brier:.4f}")
    print(f"Brier Score (Calibrated): {cal_brier:.4f}")
    print(f"Conformal Coverage (Target ~90%): {coverage:.1%}")
    print(f"Conformal Mean Interval Width: {mean_width:.2f} mm")
    print(f"OOD Flag Rate on Normal Events (False Alarms): {ood_false_alarm_rate:.1%}")
    
    return cal_proba, lower, upper, trust

def compute_reliability_horizon(test_df, cal_proba):
    """
    Computes Reliability Horizon: the earliest lead day where the forecast becomes 'LOW' reliability (high bust risk).
    """
    df = test_df.copy()
    df['calibrated_bust_risk'] = cal_proba
    
    # Define a high risk threshold
    threshold = 0.4 
    
    # Group by valid_time and region
    horizons = []
    for (region, valid_time), group in df.groupby(['region', 'valid_time']):
        group = group.sort_values('lead_time_hours')
        # Find the smallest lead time (i.e. closest to event) where risk is high
        high_risk_runs = group[group['calibrated_bust_risk'] >= threshold]
        
        if len(high_risk_runs) > 0:
            # The horizon is the largest lead time in that continuous block of high risk, 
            # or just the max lead time of high risk for simplicity.
            horizon_hours = high_risk_runs['lead_time_hours'].max()
            horizons.append({'region': region, 'valid_time': valid_time, 'horizon_days': horizon_hours / 24})
        else:
            # Forecast is reliable all the way to T-240
            horizons.append({'region': region, 'valid_time': valid_time, 'horizon_days': 10.0})
            
    return pd.DataFrame(horizons)

if __name__ == "__main__":
    df_train, df_val, test_preds = load_data()
    
    bust_model = joblib.load('ml/models/bust_classifier.pkl')
    err_model = joblib.load('ml/models/error_regressor.pkl')
    
    engine = ReliabilityEngine()
    
    df_val['region_encoded'] = engine.region_le.transform(df_val['region'])
    
    engine.fit(df_val, bust_model, err_model)
    
    # Evaluate on test set
    cal_proba, lower, upper, trust = evaluate_phase5(engine, test_preds, test_preds)
    
    # Save the engine
    joblib.dump(engine, 'ml/models/reliability_engine.pkl')
    
    # Horizon
    horizon_df = compute_reliability_horizon(test_preds, cal_proba)
    print("\\nSample Reliability Horizons:")
    print(horizon_df.head())
