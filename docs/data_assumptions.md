# Data Assumptions and Pipeline Schema

## Data Generation and Adapters
- We use synthetic data for Phase 1 to build the foundation without dependencies on live NWP sources.
- Forecasts are generated with an `issue_time`, `valid_time`, `lead_time_hours`, and `run_id`.
- Observations have a `valid_time` which represents the 24-hour accumulation ending at that time.

## Canonical Schema Details
- `valid_time`: The time the forecast is valid for, and the time the observation was taken. (UTC)
- `issue_time`: The time the NWP model run was initialized.
- `lead_time_hours`: `valid_time` - `issue_time`. Used to track forecast evolution.
- `forecast_rainfall_mm` and `observed_rainfall_mm`: Numeric values strictly >= 0.

## Leakage Prevention
- **Alignment logic**: Forecasts are merged with observations exclusively on `valid_time` and `region`.
- At prediction time, the model only uses data from `issue_time` and before. Future observations are only used to construct the retrospective target variable (`error_mm`).
- **Vintage Grouping**: The `vintage.py` script pivots the dataset so that a single row represents one `valid_time` and `region` (the "event"), and the columns represent forecasts made at different lead times (e.g., `forecast_T_minus_24h`, `forecast_T_minus_48h`). This clearly isolates what information was known at what lead time.

## Quality Checks
- Negative rainfall values are treated as missing/erroneous and coerced to 0.0.
- Pandera is used to enforce schema types and constraints.
