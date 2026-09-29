import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

def generate_evolution_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes forecast evolution features for the same valid_time.
    Ensures strict no-leakage by ordering by lead_time_hours (descending),
    which corresponds to chronological issue_times for a fixed valid_time.
    """
    df = df.copy()
    
    # Sort by region, valid_time, and then lead_time_hours DESCENDING.
    # Larger lead_time_hours means it was issued EARLIER.
    # So for a fixed event, the sequence goes e.g. T-240, T-216, ..., T-24, T-0.
    df = df.sort_values(by=['region', 'valid_time', 'lead_time_hours'], ascending=[True, True, False]).reset_index(drop=True)
    
    grouped = df.groupby(['region', 'valid_time'])['forecast_rainfall_mm']
    
    # Base forecast differences
    df['diff_prev'] = grouped.diff()
    df['diff_prev_abs'] = df['diff_prev'].abs()
    
    # 1. Latest revision
    df['latest_revision'] = df['diff_prev'].fillna(0.0)
    
    # 2. Mean revision (Expanding mean of absolute revisions)
    df['mean_revision'] = df.groupby(['region', 'valid_time'])['diff_prev_abs'].expanding().mean().reset_index(level=[0,1], drop=True).fillna(0.0)
    
    # 3. Maximum jump
    df['maximum_jump'] = df.groupby(['region', 'valid_time'])['diff_prev_abs'].expanding().max().reset_index(level=[0,1], drop=True).fillna(0.0)
    
    # 4. Volatility (Expanding std deviation of forecasts)
    df['volatility'] = grouped.expanding().std().reset_index(level=[0,1], drop=True).fillna(0.0)
    
    # 5. Trend (Cumulative sum of signs of revisions)
    df['trend'] = df.groupby(['region', 'valid_time'])['diff_prev'].transform(lambda x: np.sign(x).expanding().sum()).fillna(0.0)
    
    # 6. Acceleration (Diff of diffs)
    df['acceleration'] = df.groupby(['region', 'valid_time'])['diff_prev'].diff().fillna(0.0)
    
    # 7. Direction Reversals (Count how many times diff changed sign)
    # A reversal happens if diff_i * diff_{i-1} < 0
    df['sign_flip'] = (df['diff_prev'] * df.groupby(['region', 'valid_time'])['diff_prev'].shift(1)) < 0
    df['direction_reversals'] = df.groupby(['region', 'valid_time'])['sign_flip'].expanding().sum().reset_index(level=[0,1], drop=True).fillna(0.0)
    
    # 8. Cumulative revision (Current forecast - Oldest forecast)
    oldest_forecast = grouped.transform('first')
    df['cumulative_revision'] = df['forecast_rainfall_mm'] - oldest_forecast
    
    # 9. Forecast Stability (Inverse of volatility + mean_revision)
    # Adding 1.0 to prevent division by zero
    df['forecast_stability'] = 1.0 / (df['volatility'] + df['mean_revision'] + 1.0)
    
    # Drop temp columns
    df = df.drop(columns=['diff_prev', 'diff_prev_abs', 'sign_flip'])
    
    return df

def plot_historical_examples(df: pd.DataFrame, output_dir: str):
    """
    Plots a few interesting forecast evolution cases (e.g. high volatility/busts).
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Find a highly volatile event
    bust_events = df[df['is_bust'] == 1]
    if len(bust_events) == 0:
        bust_events = df[df['volatility'] > df['volatility'].quantile(0.9)]
        
    if len(bust_events) > 0:
        sample_event = bust_events.iloc[0]
        region, valid_time = sample_event['region'], sample_event['valid_time']
        
        event_data = df[(df['region'] == region) & (df['valid_time'] == valid_time)].sort_values('lead_time_hours', ascending=False)
        
        plt.figure(figsize=(10, 6))
        
        # X-axis will be lead time (reversed so it goes from 240 down to 0)
        plt.plot(event_data['lead_time_hours'], event_data['forecast_rainfall_mm'], marker='o', label='NWP Forecast')
        plt.axhline(y=event_data['observed_rainfall_mm'].iloc[0], color='r', linestyle='--', label='Actual Observation')
        
        plt.gca().invert_xaxis() # T-240 on left, T-0 on right
        plt.xlabel('Lead Time (Hours before Valid Time)')
        plt.ylabel('Rainfall (mm)')
        plt.title(f"Forecast Evolution: {region} | Valid: {valid_time.strftime('%Y-%m-%d')}")
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Annotate features on the plot for the T-24h forecast
        t_24_row = event_data[event_data['lead_time_hours'] == 24]
        if len(t_24_row) > 0:
            row = t_24_row.iloc[0]
            textstr = '\\n'.join((
                f"T-24h Metrics:",
                f"Volatility: {row['volatility']:.2f}",
                f"Max Jump: {row['maximum_jump']:.2f}",
                f"Reversals: {row['direction_reversals']}",
                f"Cum. Rev: {row['cumulative_revision']:.2f}"
            ))
            plt.text(0.05, 0.95, textstr, transform=plt.gca().transAxes, fontsize=10,
                     verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            
        plt.savefig(os.path.join(output_dir, 'evolution_example.png'))
        plt.close()
        print(f"Saved evolution plot to {output_dir}/evolution_example.png")

if __name__ == "__main__":
    input_file = 'data/processed/labeled_dataset.parquet'
    output_file = 'data/processed/evolution_dataset.parquet'
    plots_dir = 'docs/assets'
    
    if os.path.exists(input_file):
        df = pd.read_parquet(input_file)
        
        # Add evolution features
        df_evo = generate_evolution_features(df)
        df_evo.to_parquet(output_file, index=False)
        
        print(f"Evolution features generated for {len(df_evo)} rows.")
        print("Sample features for one event:")
        sample = df_evo[(df_evo['region'] == 'Mumbai') & (df_evo['lead_time_hours'].isin([72, 48, 24]))].head(3)
        print(sample[['lead_time_hours', 'forecast_rainfall_mm', 'latest_revision', 'volatility', 'cumulative_revision']])
        
        # Plot
        plot_historical_examples(df_evo, plots_dir)
        
    else:
        print("Run Phase 2 first.")
