import os
import joblib
import shap
import pandas as pd
import numpy as np

# Feature Mapping to Meteorological/Contextual Human Explanations
FEATURE_EXPLANATIONS = {
    'forecast_rainfall_mm': 'Predicted rainfall magnitude',
    'lead_time_hours': 'Forecast lead time',
    'region_encoded': 'Regional climatological baseline',
    'latest_revision': 'Magnitude of the most recent NWP revision',
    'mean_revision': 'Average magnitude of past NWP revisions',
    'maximum_jump': 'Maximum jump across all NWP runs for this event',
    'volatility': 'Forecast volatility across recent NWP runs',
    'trend': 'Directional trend in successive NWP runs',
    'acceleration': 'Acceleration of changes in the NWP forecast',
    'direction_reversals': 'Frequency of NWP forecast direction reversals',
    'cumulative_revision': 'Total cumulative revision since the earliest forecast',
    'forecast_stability': 'Overall NWP forecast stability index',
    'hist_mae': 'Historical Mean Absolute Error for this region/lead time',
    'hist_rmse': 'Historical Root Mean Squared Error for this region/lead time',
    'hist_bias': 'Historical NWP Bias for this region/lead time',
    'hist_bust_freq': 'Historical frequency of busts for this region/lead time'
}

class Explainer:
    def __init__(self):
        self.model = joblib.load('ml/models/bust_classifier.pkl')
        self.features = ['forecast_rainfall_mm', 'lead_time_hours', 'region_encoded', 'latest_revision', 
                         'mean_revision', 'maximum_jump', 'volatility', 'trend', 
                         'acceleration', 'direction_reversals', 'cumulative_revision', 
                         'forecast_stability', 'hist_mae', 'hist_rmse', 'hist_bias', 'hist_bust_freq']
        self.explainer = shap.TreeExplainer(self.model)
        
        # Load train data for historical analogs
        self.train_df, _, _ = self.get_splits()
        
    def get_splits(self):
        from ml.src.train import load_and_merge_data, chronological_split
        df = load_and_merge_data()
        df['region_encoded'] = joblib.load('ml/models/region_encoder.pkl').transform(df['region'])
        return chronological_split(df)
        
    def explain_prediction(self, event_row):
        """
        Explains a single prediction.
        Returns a structured dictionary separating model attribution from historical analogs.
        """
        # 1. SHAP Model Attribution
        # Note: SHAP represents statistical attribution, not meteorological causality.
        X_event = event_row[self.features].to_frame().T.astype(float)
        shap_values = self.explainer(X_event)
        
        # Extract values for the positive class (Bust)
        # XGBoost binary classification returns shap values directly for log-odds of positive class
        sv = shap_values.values[0]
        base_value = shap_values.base_values[0]
        
        # Sort features by positive contribution to bust
        feature_contributions = []
        for i, feat in enumerate(self.features):
            feature_contributions.append({
                'feature': feat,
                'shap_value': float(sv[i]),
                'human_readable': FEATURE_EXPLANATIONS.get(feat, feat),
                'actual_value': float(X_event.iloc[0][feat])
            })
            
        feature_contributions.sort(key=lambda x: x['shap_value'], reverse=True)
        top_positive = [f for f in feature_contributions if f['shap_value'] > 0][:3]
        
        # 2. Historical Analogs
        # Find past events in the training data for the same region and lead time where a bust occurred
        region_enc = event_row['region_encoded']
        lead_time = event_row['lead_time_hours']
        
        analogs = self.train_df[
            (self.train_df['region_encoded'] == region_enc) & 
            (self.train_df['lead_time_hours'] == lead_time) &
            (self.train_df['is_bust'] == 1)
        ].sort_values('abs_error_mm', ascending=False)
        
        analog_list = []
        for _, row in analogs.head(3).iterrows():
            analog_list.append({
                'valid_time': str(row['valid_time']),
                'forecast_rainfall_mm': row['forecast_rainfall_mm'],
                'observed_rainfall_mm': row['observed_rainfall_mm'],
                'error_mm': row['error_mm']
            })
            
        # 3. Structure the final response
        return {
            'disclaimer': "Model attributions indicate statistical correlation within the ML model, not strict meteorological causality.",
            'model_attribution': top_positive,
            'historical_analogs': analog_list,
            'meteorological_context': f"This analysis applies to region {event_row['region']} at lead time T-{lead_time}h."
        }

if __name__ == "__main__":
    import json
    
    explainer = Explainer()
    
    # Pick a test event that was a bust
    test_preds = pd.read_parquet('ml/models/test_predictions.parquet')
    bust_events = test_preds[test_preds['is_bust'] == 1]
    
    if len(bust_events) > 0:
        sample_event = bust_events.iloc[0]
        explanation = explainer.explain_prediction(sample_event)
        
        print(f"Explanation for Region: {sample_event['region']}, Valid Time: {sample_event['valid_time']}, Lead Time: {sample_event['lead_time_hours']}h")
        print(json.dumps(explanation, indent=2))
    else:
        print("No bust events found in test set to explain.")
