# Data Provenance & Methodology

## 1. Current Data Source: Synthetic Prototype
**WARNING**: The data currently feeding this repository is **Synthetic**.
It was procedurally generated to simulate the statistical properties of Numerical Weather Prediction (NWP) outputs and observed rainfall across four Indian regions (Mumbai, Delhi, Chennai, Kolkata) over a 4-year period (2020-2023).

- **Why Synthetic?** This prototype was built to demonstrate the *architecture, ML pipeline, and UI* of BustSense without requiring immediate access to proprietary NCMRWF or IMD datasets.
- **Can it accept real data?** Yes. The `data_adapters` module strictly decouples the ingestion layer from the ML pipeline. By swapping the adapter, real NCMRWF datasets can be ingested without changing any downstream code.

## 2. Dataset Properties
- **Total Forecasts**: 64,284 
- **Total Observations**: 5,844
- **Date Range**: 2020-01-01 to 2023-12-31
- **Lead Times**: T-240h down to T-0h (10 days)

## 3. Training & Validation Periods
We strictly used **chronological splitting** to prevent temporal leakage. No random splits were used.

- **Training Set (60%)**: 2020-01-01 to ~2022-05-15
- **Validation Set (20%)**: ~2022-05-16 to ~2023-03-01
- **Test Set (20%)**: ~2023-03-02 to 2023-12-31

## 4. Feature Extraction Rule
No feature is ever computed using data from the future.
- **Bust Threshold**: Computed via `expanding().quantile().shift(1)`.
- **Forecast Evolution**: Sliced dynamically up to the specific `lead_time_hours` at prediction time.

## 5. Summary
All metrics (PR-AUC, MAE, Coverage) represent the model's ability to learn from this synthetic dataset. They **do not** represent the true operational capability of predicting real Indian monsoons.
