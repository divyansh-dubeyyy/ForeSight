import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_synthetic_data(start_date: str, end_date: str, regions: list, output_dir: str):
    """
    Generates synthetic NWP forecasts and observations.
    The goal is to simulate forecast evolution (multiple runs for the same valid time).
    """
    os.makedirs(output_dir, exist_ok=True)
    
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    
    # Generate daily valid times at 00Z
    valid_times = pd.date_range(start=start_dt, end=end_dt, freq='D')
    
    forecasts = []
    observations = []
    
    np.random.seed(42)
    
    for region in regions:
        for vt in valid_times:
            # Generate the true observed rainfall (e.g., exponential distribution for rain)
            is_rainy = np.random.rand() > 0.6
            if is_rainy:
                true_rain = np.random.exponential(scale=20.0)
            else:
                true_rain = 0.0
                
            observations.append({
                'valid_time': vt,
                'region': region,
                'observed_rainfall_mm': round(true_rain, 2)
            })
            
            # Generate forecasts with different lead times (e.g., T-72h, T-48h, T-24h, T0)
            # The closer to valid_time, the more accurate the forecast usually is (but not always - bust!)
            
            # Simulate a "Bust" condition (rare event where forecast diverges wildly)
            is_bust = np.random.rand() > 0.95 
            
            for lead_days in range(10, -1, -1):
                issue_time = vt - pd.Timedelta(days=lead_days)
                
                if is_bust:
                    # In a bust, the forecast error is large
                    error_scale = 30.0 + (lead_days * 2)
                    noise = np.random.normal(scale=error_scale)
                else:
                    # Normal error decreases as lead time decreases
                    error_scale = 5.0 + (lead_days * 1.5)
                    noise = np.random.normal(scale=error_scale)
                    
                forecast_rain = max(0.0, true_rain + noise)
                
                forecasts.append({
                    'issue_time': issue_time,
                    'valid_time': vt,
                    'lead_time_hours': lead_days * 24,
                    'region': region,
                    'forecast_rainfall_mm': round(forecast_rain, 2),
                    'run_id': f"NWP_{issue_time.strftime('%Y%m%d%H')}"
                })
                
    df_forecasts = pd.DataFrame(forecasts)
    df_observations = pd.DataFrame(observations)
    
    # Save raw data
    forecast_path = os.path.join(output_dir, 'synthetic_forecasts.parquet')
    obs_path = os.path.join(output_dir, 'synthetic_observations.parquet')
    
    df_forecasts.to_parquet(forecast_path, index=False)
    df_observations.to_parquet(obs_path, index=False)
    
    print(f"Generated {len(df_forecasts)} forecasts and {len(df_observations)} observations.")
    print(f"Saved to {output_dir}")
    
    return df_forecasts, df_observations

if __name__ == "__main__":
    regions = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata']
    generate_synthetic_data(
        start_date='2020-01-01',
        end_date='2023-12-31',
        regions=regions,
        output_dir='data/raw'
    )
