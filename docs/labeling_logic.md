# Phase 2: Scientific Error & Labelling Logic

## Core Metrics
1. **Signed Error (`error_mm`)**: `Observed Rainfall - Forecast Rainfall`. A positive error indicates an Under-forecast. A negative error indicates an Over-forecast.
2. **Absolute Error (`abs_error_mm`)**: `|error_mm|`. Used for bust severity and RMSE calculations.

## Direction Labels
- **UNDER**: `error_mm > neutral_threshold` (Observation was significantly higher than forecast)
- **OVER**: `error_mm < -neutral_threshold` (Forecast was significantly higher than observation)
- **NEUTRAL**: `|error_mm| <= neutral_threshold`
- Default `neutral_threshold` = 2.0 mm

## Conditional Bust Threshold
Instead of using an arbitrary rule (e.g., `error > 10 mm`), the bust threshold is conditionally derived from historical distributions.
- **Rule**: `Bust = 1` if `abs_error_mm > bust_threshold_mm`.
- **Primary Threshold**: 90th percentile of absolute error grouped by `region` and `lead_time_hours`.
- **Leakage Prevention**: We use a chronologically expanding window and `shift(1)` to ensure the threshold evaluated at the current `issue_time` only considers past validated events.

## Sparse-Data Fallback
If there are insufficient historical events (`min_periods=10`) for a specific `(region, lead_time)`, the system falls back in the following order:
1. **Fallback Region**: 90th percentile for the `region` across all lead times.
2. **Fallback Global**: 90th percentile across all regions and lead times.
3. **Default Initial**: If no data is available (the very first few forecasts), a hardcoded safe threshold (e.g., 15.0 mm) is used.

## Historical Skill Features
We generate rolling metrics representing the NWP model's past performance.
- `hist_mae`: Mean Absolute Error
- `hist_rmse`: Root Mean Squared Error
- `hist_bias`: Mean Signed Error
- `hist_bust_freq`: Proportion of recent events classified as busts.
- **Leakage Prevention**: Grouped by `region` and `lead_time`, expanding over `valid_time`, and shifted by 1. This mimics operational constraints where only past resolved events (where valid_time < current issue_time) can be used to engineer features for today's forecast.
