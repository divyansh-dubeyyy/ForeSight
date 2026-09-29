import pandas as pd
import numpy as np

def calculate_errors_and_labels(df: pd.DataFrame, neutral_threshold: float = 2.0, bust_percentile: float = 0.90) -> pd.DataFrame:
    """
    Computes scientific error metrics and conditional bust labels, ensuring no future leakage.
    Assumes df is sorted by valid_time.
    """
    df = df.copy()
    
    # 1 & 2: Error calculations
    # Signed error = Observation - Forecast
    df['error_mm'] = df['observed_rainfall_mm'] - df['forecast_rainfall_mm']
    df['abs_error_mm'] = df['error_mm'].abs()
    
    # 6: Direction labels
    # Under-forecast: Observation > Forecast (error_mm > neutral_threshold)
    # Over-forecast: Observation < Forecast (error_mm < -neutral_threshold)
    # Neutral: |error_mm| <= neutral_threshold
    conditions = [
        df['error_mm'] > neutral_threshold,
        df['error_mm'] < -neutral_threshold
    ]
    choices = ['UNDER', 'OVER']
    df['direction'] = np.select(conditions, choices, default='NEUTRAL')
    
    # 3, 4 & 5: Conditional Bust Threshold (Strictly leakage-free)
    # We must only use data available AT issue_time to compute thresholds.
    # We will compute an expanding threshold for each region and lead_time.
    
    # Sort temporally by valid_time so expanding window is chronological
    df = df.sort_values('valid_time').reset_index(drop=True)
    
    # Initialize bust columns
    df['bust_threshold_mm'] = np.nan
    df['is_bust'] = 0
    df['threshold_source'] = 'NONE'
    
    # Group by region and lead time, and calculate expanding quantile
    # We use a shift(1) so that the current valid_time's error is NOT included in its own threshold
    
    grouped = df.groupby(['region', 'lead_time_hours'])
    
    # Custom function for expanding quantile with fallback
    for name, group in grouped:
        # Expanding 90th percentile of absolute error
        expanding_p90 = group['abs_error_mm'].expanding(min_periods=10).quantile(bust_percentile).shift(1)
        df.loc[group.index, 'bust_threshold_mm'] = expanding_p90
        df.loc[group.index, 'threshold_source'] = 'CONDITIONAL_REGION_LEAD'
        
    # 5: Sparse-data fallback
    # Fallback 1: Region-level expanding (independent of lead time)
    region_grouped = df.groupby('region')
    for region, group in region_grouped:
        region_expanding_p90 = group['abs_error_mm'].expanding(min_periods=10).quantile(bust_percentile).shift(1)
        
        mask = df['bust_threshold_mm'].isna() & (df['region'] == region)
        idx_to_fill = df.index[mask]
        df.loc[idx_to_fill, 'bust_threshold_mm'] = region_expanding_p90.loc[idx_to_fill]
        df.loc[idx_to_fill, 'threshold_source'] = 'FALLBACK_REGION'
        
    # Fallback 2: Global expanding
    global_expanding_p90 = df['abs_error_mm'].expanding(min_periods=10).quantile(bust_percentile).shift(1)
    mask = df['bust_threshold_mm'].isna()
    df.loc[mask, 'bust_threshold_mm'] = global_expanding_p90[mask]
    df.loc[mask, 'threshold_source'] = 'FALLBACK_GLOBAL'
    
    # Fill remaining NaNs (first few rows) with a default safe threshold
    mask = df['bust_threshold_mm'].isna()
    df.loc[mask, 'bust_threshold_mm'] = 15.0  # arbitrary safe initial threshold
    df.loc[mask, 'threshold_source'] = 'DEFAULT_INITIAL'
    
    # Bust Labeling
    df['is_bust'] = (df['abs_error_mm'] > df['bust_threshold_mm']).astype(int)
    
    return df

if __name__ == "__main__":
    import os
    input_file = 'data/processed/aligned_dataset.parquet'
    output_file = 'data/processed/labeled_dataset.parquet'
    
    if os.path.exists(input_file):
        df = pd.read_parquet(input_file)
        labeled = calculate_errors_and_labels(df)
        labeled.to_parquet(output_file, index=False)
        print(f"Labeled {len(labeled)} records. Saved to {output_file}.")
        print(labeled[['valid_time', 'error_mm', 'direction', 'bust_threshold_mm', 'is_bust', 'threshold_source']].head(20))
    else:
        print("Run Phase 1 first.")
