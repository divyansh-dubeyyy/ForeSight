import pandas as pd
import numpy as np
from ml.src.labeling import calculate_errors_and_labels
from ml.src.features import generate_historical_features

def test_labeling_logic():
    # Create dummy aligned data in chronological order
    df = pd.DataFrame([
        {'issue_time': pd.Timestamp('2023-01-01'), 'valid_time': pd.Timestamp('2023-01-02'), 'lead_time_hours': 24, 'region': 'A', 'forecast_rainfall_mm': 10.0, 'observed_rainfall_mm': 15.0},
        {'issue_time': pd.Timestamp('2023-01-02'), 'valid_time': pd.Timestamp('2023-01-03'), 'lead_time_hours': 24, 'region': 'A', 'forecast_rainfall_mm': 20.0, 'observed_rainfall_mm': 20.0},
        {'issue_time': pd.Timestamp('2023-01-03'), 'valid_time': pd.Timestamp('2023-01-04'), 'lead_time_hours': 24, 'region': 'A', 'forecast_rainfall_mm': 5.0,  'observed_rainfall_mm': 2.0},
        {'issue_time': pd.Timestamp('2023-01-04'), 'valid_time': pd.Timestamp('2023-01-05'), 'lead_time_hours': 24, 'region': 'A', 'forecast_rainfall_mm': 50.0, 'observed_rainfall_mm': 100.0} # Bust case
    ])
    
    labeled = calculate_errors_and_labels(df, neutral_threshold=2.0)
    
    # 1. Test signed and absolute error
    assert labeled.loc[0, 'error_mm'] == 5.0  # 15 - 10
    assert labeled.loc[0, 'abs_error_mm'] == 5.0
    
    assert labeled.loc[2, 'error_mm'] == -3.0 # 2 - 5
    assert labeled.loc[2, 'abs_error_mm'] == 3.0
    
    # 2. Test direction labels
    assert labeled.loc[0, 'direction'] == 'UNDER'   # error = 5.0 > 2.0
    assert labeled.loc[1, 'direction'] == 'NEUTRAL' # error = 0.0 <= 2.0
    assert labeled.loc[2, 'direction'] == 'OVER'    # error = -3.0 < -2.0
    
    # 3. Test reproducible bust threshold (fallback should hit because min_periods=10 in our script)
    # Since min_periods=10, the threshold for 4 rows will be 'DEFAULT_INITIAL'
    assert labeled['threshold_source'].iloc[0] == 'DEFAULT_INITIAL'
    assert labeled['bust_threshold_mm'].iloc[0] == 15.0
    
    # Row 3 (index 3) absolute error is 50.0 > 15.0, so it should be a bust
    assert labeled.loc[3, 'is_bust'] == 1
    assert labeled.loc[2, 'is_bust'] == 0
    
def test_features_no_leakage():
    # Make enough data to pass min_periods=5 for features
    data = []
    for i in range(10):
        data.append({
            'issue_time': pd.Timestamp('2023-01-01') + pd.Timedelta(days=i),
            'valid_time': pd.Timestamp('2023-01-02') + pd.Timedelta(days=i),
            'lead_time_hours': 24,
            'region': 'A',
            'error_mm': 10.0,
            'abs_error_mm': 10.0,
            'is_bust': 0
        })
    df_labeled = pd.DataFrame(data)
    
    features = generate_historical_features(df_labeled)
    
    # The first 5 rows should be NaN due to min_periods=5 and shift(1)
    assert pd.isna(features.loc[4, 'hist_mae'])
    
    # Row 6 should have exactly 10.0 since mean of previous 5 rows is 10.0
    assert features.loc[5, 'hist_mae'] == 10.0
    assert features.loc[5, 'hist_rmse'] == 10.0
    assert features.loc[5, 'hist_bias'] == 10.0
    assert features.loc[5, 'hist_bust_freq'] == 0.0
