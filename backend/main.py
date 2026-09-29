from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import os
import sys

# Add the project root to sys.path so we can import from ml
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.src.explainability import Explainer

app = FastAPI(title="BustSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data at startup
test_preds = None
explainer = None

@app.on_event("startup")
def load_data():
    global test_preds, explainer
    try:
        # Load the test predictions which include calibrated probability, OOD, etc.
        test_preds_path = 'ml/models/test_predictions.parquet'
        if os.path.exists(test_preds_path):
            test_preds = pd.read_parquet(test_preds_path)
            
            import joblib
            import __main__
            from ml.src.phase5 import ReliabilityEngine
            __main__.ReliabilityEngine = ReliabilityEngine
            
            engine = joblib.load('ml/models/reliability_engine.pkl')
            cal_proba, lower, upper, trust = engine.predict(
                test_preds[engine.features], 
                test_preds['pred_bust_proba'], 
                test_preds['pred_abs_error']
            )
            test_preds['calibrated_bust_risk'] = cal_proba
            test_preds['lower_bound'] = lower
            test_preds['upper_bound'] = upper
            test_preds['trust_status'] = trust
            
            # Sort chronologically
            test_preds = test_preds.sort_values(['valid_time', 'lead_time_hours'])
        else:
            print("Warning: test_predictions.parquet not found!")
            
        explainer = Explainer()
    except Exception as e:
        print(f"Error loading data: {e}")

# Default event date to simulate "current time" for the dashboard
DEFAULT_DATE = '2023-12-31'

@app.get("/api/map")
def get_india_map(lead_day: int = 5):
    """Returns reliability status for all regions for a specific lead day (from 1 to 10)."""
    if test_preds is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    target_hours = lead_day * 24
    
    # Filter for the target date and lead time
    df = test_preds[(test_preds['valid_time'] == DEFAULT_DATE) & (test_preds['lead_time_hours'] == target_hours)]
    
    if df.empty:
        # Fallback to the latest available date
        latest_date = test_preds['valid_time'].max()
        df = test_preds[(test_preds['valid_time'] == latest_date) & (test_preds['lead_time_hours'] == target_hours)]
        
    result = []
    for _, row in df.iterrows():
        status = 'High'
        if row['calibrated_bust_risk'] > 0.4:
            status = 'Low'
        elif row['calibrated_bust_risk'] > 0.2:
            status = 'Moderate'
            
        result.append({
            'region': row['region'],
            'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2),
            'bust_probability': round(row['calibrated_bust_risk'], 2),
            'reliability_status': status,
            'expected_error': round(row['pred_abs_error'], 2),
            'direction': row['pred_direction']
        })
    return result

@app.get("/api/region/{region}")
def get_region_summary(region: str, lead_day: int = 5):
    """Detailed reliability for a specific region and lead day."""
    if test_preds is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    target_hours = lead_day * 24
    df = test_preds[(test_preds['region'] == region) & (test_preds['lead_time_hours'] == target_hours)]
    
    if df.empty:
        raise HTTPException(status_code=404, detail="Region data not found for lead day")
        
    # Get the most recent event for this region/lead time (if multiple exist)
    row = df.iloc[-1]
    
    status = 'High'
    if row['calibrated_bust_risk'] > 0.4:
        status = 'Low'
    elif row['calibrated_bust_risk'] > 0.2:
        status = 'Moderate'
        
    return {
        'region': row['region'],
        'valid_time': str(row['valid_time']),
        'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2),
        'bust_probability': round(row['calibrated_bust_risk'], 2),
        'expected_error': round(row['pred_abs_error'], 2),
        'lower_bound': round(row['lower_bound'], 2),
        'upper_bound': round(row['upper_bound'], 2),
        'direction': row['pred_direction'],
        'reliability_status': status,
        'model_trust': row['trust_status']
    }

@app.get("/api/matrix")
def get_reliability_matrix(region: str):
    """Day 1-10 reliability strip for a region."""
    if test_preds is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    df = test_preds[test_preds['region'] == region].sort_values('valid_time').groupby('lead_time_hours').tail(1)
    df = df.sort_values('lead_time_hours')
    
    matrix = []
    for _, row in df.iterrows():
        lead_day = int(row['lead_time_hours'] / 24)
        if lead_day == 0: continue
        
        status = 'High'
        if row['calibrated_bust_risk'] > 0.4:
            status = 'Low'
        elif row['calibrated_bust_risk'] > 0.2:
            status = 'Moderate'
            
        matrix.append({
            'day': lead_day,
            'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2),
            'reliability_status': status,
            'bust_probability': round(row['calibrated_bust_risk'], 2)
        })
    return matrix

@app.get("/api/evolution/{region}")
def get_forecast_evolution(region: str):
    """Timeline of how the forecast evolved for the target date."""
    if test_preds is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    df = test_preds[(test_preds['region'] == region) & (test_preds['valid_time'] == DEFAULT_DATE)]
    
    if df.empty:
        # Fallback
        latest_date = test_preds['valid_time'].max()
        df = test_preds[(test_preds['region'] == region) & (test_preds['valid_time'] == latest_date)]
        
    df = df.sort_values('lead_time_hours', ascending=False)
    
    evolution = []
    for _, row in df.iterrows():
        evolution.append({
            'lead_time_hours': row['lead_time_hours'],
            'label': f"T-{row['lead_time_hours']}h",
            'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2)
        })
    return evolution

@app.get("/api/explain/{region}")
def get_explanation(region: str, lead_day: int = 5):
    """SHAP explanation and historical analogs."""
    if explainer is None or test_preds is None:
        raise HTTPException(status_code=500, detail="Explainer not initialized")
        
    target_hours = lead_day * 24
    df = test_preds[(test_preds['region'] == region) & (test_preds['lead_time_hours'] == target_hours)]
    
    if df.empty:
        raise HTTPException(status_code=404, detail="Region data not found")
        
    event_row = df.iloc[-1]
    return explainer.explain_prediction(event_row)

@app.get("/api/metrics")
def get_metrics():
    try:
        with open('ml/models/evaluation_results.json', 'r') as f:
            return json.load(f)
    except:
        return {"error": "Metrics not found"}
        
@app.get("/api/info")
def get_info():
    return {
        "models": ["XGBoost Classifier", "XGBoost Regressor", "Isotonic Regression", "Isolation Forest"],
        "pipeline": "Phase 5 Validated",
        "description": "BustSense Forecast Reliability Intelligence Layer"
    }

@app.get("/api/replay/events")
def get_replay_events():
    """Returns a list of interesting historical events (busts) available for replay."""
    if test_preds is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Find events that eventually busted at any lead time (or just short lead times)
    busted = test_preds[test_preds['is_bust'] == 1]
    events = busted[['region', 'valid_time']].drop_duplicates()
    
    # Format and return a few interesting ones
    result = []
    for _, row in events.head(20).iterrows():
        result.append({
            'region': row['region'],
            'valid_time': str(row['valid_time'])
        })
    return result

@app.get("/api/replay")
def get_replay_states(region: str, valid_time: str):
    """Returns chronological replay states for a specific region and valid date."""
    if test_preds is None or explainer is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    df = test_preds[(test_preds['region'] == region) & (test_preds['valid_time'] == valid_time)]
    
    if df.empty:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Sort descending by lead_time_hours so that it plays out chronologically (e.g. 240 -> 216 -> ... -> 0)
    df = df.sort_values('lead_time_hours', ascending=False)
    
    states = []
    history = []
    
    for _, row in df.iterrows():
        status = 'High'
        if row['calibrated_bust_risk'] > 0.4:
            status = 'Low'
        elif row['calibrated_bust_risk'] > 0.2:
            status = 'Moderate'
            
        # Get explanation for this specific state
        explanation = explainer.explain_prediction(row)
        
        # Build history up to this point
        history.append({
            'lead_time_hours': row['lead_time_hours'],
            'label': f"T-{row['lead_time_hours']}h",
            'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2)
        })
        
        state = {
            'lead_time_hours': row['lead_time_hours'],
            'issue_time': str(row['issue_time']),
            'forecast_rainfall_mm': round(row['forecast_rainfall_mm'], 2),
            'bust_probability': round(row['calibrated_bust_risk'], 2),
            'expected_error': round(row['pred_abs_error'], 2),
            'direction': row['pred_direction'],
            'lower_bound': round(row['lower_bound'], 2),
            'upper_bound': round(row['upper_bound'], 2),
            'reliability_status': status,
            'model_trust': row['trust_status'],
            'explanation': explanation,
            'evolution_history': list(history) # snapshot of history
        }
        states.append(state)
        
    # Append the final reveal state
    last_row = df.iloc[-1]
    reveal = {
        'lead_time_hours': 'Reveal',
        'actual_observed_rainfall_mm': round(last_row['observed_rainfall_mm'], 2),
        'actual_error_mm': round(last_row['error_mm'], 2),
        'was_bust': bool(last_row['is_bust'] == 1)
    }
    
    return {
        'region': region,
        'valid_time': valid_time,
        'states': states,
        'reveal': reveal
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
