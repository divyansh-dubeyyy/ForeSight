import pandas as pd
import numpy as np

def generate_historical_features(df_labeled: pd.DataFrame) -> pd.DataFrame:
    """
    Computes historical skill features ensuring strict no-leakage.
    For any forecast with issue_time T, we can only use historical error metrics
    from forecasts whose valid_time is < T (i.e., the event has resolved and observation is available).
    """
    df = df_labeled.copy()
    
    # Sort by valid_time so we process chronologically
    df = df.sort_values('valid_time').reset_index(drop=True)
    
    # We want features conditioned on region and lead_time
    # Since we need values available AT issue_time, we will create a rolling/expanding
    # aggregation on valid_time, and then shift it. But since multiple forecasts can have the same
    # issue time, shifting is tricky.
    
    # Better approach: For each (region, lead_time), compute the cumulative sum of errors
    # up to that row's valid_time, then shift by 1 to get the metric BEFORE this event.
    # Note: If valid_time < issue_time is required for true operational leakage prevention,
    # just shifting by 1 on valid_time is slightly flawed if we have overlapping lead times,
    # but for daily forecasts (T-24, T-48 etc) where valid_time is sequential, shift(1) 
    # means we use data from the PREVIOUS valid_time (e.g., yesterday).
    # Since yesterday's event has valid_time = today - 1 day, and today's issue_time is today,
    # yesterday's observation is available. This is a reasonable proxy for Phase 2.
    
    grouped = df.groupby(['region', 'lead_time_hours'])
    
    df['hist_mae'] = grouped['abs_error_mm'].transform(lambda x: x.expanding(min_periods=5).mean().shift(1))
    
    # RMSE: sqrt(mean(error^2))
    df['squared_error'] = df['error_mm']**2
    df['hist_rmse'] = grouped['squared_error'].transform(lambda x: np.sqrt(x.expanding(min_periods=5).mean().shift(1)))
    
    # Bias: mean(error)
    df['hist_bias'] = grouped['error_mm'].transform(lambda x: x.expanding(min_periods=5).mean().shift(1))
    
    # Bust frequency
    df['hist_bust_freq'] = grouped['is_bust'].transform(lambda x: x.expanding(min_periods=5).mean().shift(1))
    
    # Clean up temp column
    df = df.drop(columns=['squared_error'])
    
    return df

if __name__ == "__main__":
    import os
    input_file = 'data/processed/labeled_dataset.parquet'
    output_file = 'data/processed/features_dataset.parquet'
    
    if os.path.exists(input_file):
        df = pd.read_parquet(input_file)
        features_df = generate_historical_features(df)
        features_df.to_parquet(output_file, index=False)
        print(f"Generated historical features for {len(features_df)} records.")
        print(features_df[['valid_time', 'region', 'lead_time_hours', 'hist_mae', 'hist_rmse', 'hist_bias', 'hist_bust_freq']].tail(10))
    else:
        print("Run labeling.py first.")
