import pandas as pd
import pytest
from data_adapters.alignment import align_forecasts_and_observations

def test_alignment_logic():
    # Create dummy forecasts
    forecasts = pd.DataFrame([
        {'issue_time': pd.Timestamp('2023-01-01'), 'valid_time': pd.Timestamp('2023-01-04'), 'lead_time_hours': 72, 'region': 'Mumbai', 'forecast_rainfall_mm': 50.0, 'run_id': 'run1'},
        {'issue_time': pd.Timestamp('2023-01-02'), 'valid_time': pd.Timestamp('2023-01-04'), 'lead_time_hours': 48, 'region': 'Mumbai', 'forecast_rainfall_mm': 60.0, 'run_id': 'run2'},
        {'issue_time': pd.Timestamp('2023-01-03'), 'valid_time': pd.Timestamp('2023-01-04'), 'lead_time_hours': 24, 'region': 'Delhi', 'forecast_rainfall_mm': 10.0, 'run_id': 'run3'}
    ])
    
    # Create dummy observations
    observations = pd.DataFrame([
        {'valid_time': pd.Timestamp('2023-01-04'), 'region': 'Mumbai', 'observed_rainfall_mm': 55.0},
        {'valid_time': pd.Timestamp('2023-01-04'), 'region': 'Delhi', 'observed_rainfall_mm': 0.0}
    ])
    
    forecasts.to_parquet('test_forecasts.parquet')
    observations.to_parquet('test_obs.parquet')
    
    aligned = align_forecasts_and_observations('test_forecasts.parquet', 'test_obs.parquet', 'test_aligned.parquet')
    
    assert len(aligned) == 3
    
    mumbai_aligned = aligned[aligned['region'] == 'Mumbai']
    assert len(mumbai_aligned) == 2
    assert (mumbai_aligned['observed_rainfall_mm'] == 55.0).all()
    
    # Test error calculation
    row_72h = mumbai_aligned[mumbai_aligned['lead_time_hours'] == 72].iloc[0]
    assert row_72h['error_mm'] == -5.0 # 50 - 55
    
    import os
    os.remove('test_forecasts.parquet')
    os.remove('test_obs.parquet')
    os.remove('test_aligned.parquet')
