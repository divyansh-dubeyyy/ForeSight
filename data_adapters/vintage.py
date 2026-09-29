import pandas as pd

def group_forecast_vintages(df_aligned: pd.DataFrame) -> pd.DataFrame:
    """
    Groups forecasts by 'valid_time' and 'region' to show forecast evolution.
    Each row represents a specific valid_time and region, with columns for the forecast 
    issued at different lead times.
    """
    # Pivot the dataframe so each lead time becomes a column
    df_pivot = df_aligned.pivot_table(
        index=['region', 'valid_time', 'observed_rainfall_mm'],
        columns='lead_time_hours',
        values='forecast_rainfall_mm',
        aggfunc='first'
    ).reset_index()
    
    # Rename columns to be strings like 'forecast_T_minus_24h'
    new_cols = []
    for col in df_pivot.columns:
        if isinstance(col, (int, float)):
            new_cols.append(f'forecast_T_minus_{int(col)}h')
        else:
            new_cols.append(col)
            
    df_pivot.columns = new_cols
    
    return df_pivot

if __name__ == "__main__":
    import os
    processed_dir = 'data/processed'
    aligned_file = os.path.join(processed_dir, 'aligned_dataset.parquet')
    vintage_file = os.path.join(processed_dir, 'vintage_dataset.parquet')
    
    if os.path.exists(aligned_file):
        df_aligned = pd.read_parquet(aligned_file)
        df_vintage = group_forecast_vintages(df_aligned)
        df_vintage.to_parquet(vintage_file, index=False)
        print(f"Created vintage dataset with {len(df_vintage)} rows.")
        print(f"Saved to {vintage_file}")
    else:
        print("Aligned dataset not found.")
