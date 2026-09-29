import pandas as pd
import os

def align_forecasts_and_observations(forecast_path: str, obs_path: str, output_path: str):
    """
    Aligns forecasts with their corresponding observations to create a leakage-safe dataset.
    Merging on ['valid_time', 'region'].
    """
    print(f"Loading forecasts from {forecast_path}")
    df_forecasts = pd.read_parquet(forecast_path)
    
    print(f"Loading observations from {obs_path}")
    df_obs = pd.read_parquet(obs_path)
    
    print("Aligning data...")
    # Merge forecasts with observations. 
    # Important: This is safe from leakage as long as at prediction time, 
    # the model only uses features derived from issue_time or before.
    # We merge to compute labels (observed_rainfall, error, bust) for training.
    
    df_aligned = pd.merge(
        df_forecasts, 
        df_obs, 
        on=['valid_time', 'region'], 
        how='inner'
    )
    
    # Calculate simple error (Forecast - Observed)
    # Positive = Over-forecast, Negative = Under-forecast
    df_aligned['error_mm'] = df_aligned['forecast_rainfall_mm'] - df_aligned['observed_rainfall_mm']
    
    # Sort by region, valid_time, and issue_time to represent the temporal evolution
    df_aligned = df_aligned.sort_values(by=['region', 'valid_time', 'issue_time']).reset_index(drop=True)
    
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    df_aligned.to_parquet(output_path, index=False)
    
    print(f"Aligned dataset created with {len(df_aligned)} rows.")
    print(f"Saved to {output_path}")
    
    return df_aligned

if __name__ == "__main__":
    raw_dir = 'data/raw'
    processed_dir = 'data/processed'
    
    forecast_file = os.path.join(raw_dir, 'synthetic_forecasts.parquet')
    obs_file = os.path.join(raw_dir, 'synthetic_observations.parquet')
    output_file = os.path.join(processed_dir, 'aligned_dataset.parquet')
    
    if os.path.exists(forecast_file) and os.path.exists(obs_file):
        align_forecasts_and_observations(forecast_file, obs_file, output_file)
    else:
        print("Raw data not found. Please run synthetic_data.py first.")
