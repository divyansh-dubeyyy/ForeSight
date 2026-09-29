# Model Card: BustSense (Prototype)

## Model Details
- **Architecture**: XGBoost (Classifier & Regressor), Isotonic Regression, Isolation Forest.
- **Version**: 1.0.0 (Prototype)
- **Frameworks**: `xgboost`, `scikit-learn`, `shap`

## Intended Use
BustSense is intended to be a **Reliability Intelligence Layer** sitting on top of existing Numerical Weather Prediction (NWP) outputs. It is designed for meteorologists to assess whether a specific forecast run is trustworthy, rather than replacing the forecast itself.

## Limitations & Disclaimers
1. **Synthetic Data**: The current models are trained on synthetically generated data. **We make no claims of real-world operational performance.**
2. **Not a Forecaster**: This model predicts the *error* of the NWP, it does not predict the weather.
3. **Threshold Sensitivity**: The current implementation defines a "Bust" as the 90th percentile of absolute error. This threshold may need domain-expert tuning for specific Indian regions or monsoon seasons.

## Model Outputs
The pipeline outputs three distinct, decoupled concepts:
1. **Forecast Risk (Bust Probability)**: The calibrated probability that the NWP error will exceed the 90th percentile threshold.
2. **Forecast Uncertainty**: A 90% conformal prediction interval around the expected error magnitude.
3. **Model Trust (OOD)**: An assessment of whether the current atmospheric/evolution pattern is something the model has seen before (In-Distribution vs. Out-Of-Distribution).

## Validation Methodology
- **Temporal Splitting**: Models were evaluated using a strict chronological holdout test set (last 20% of the timeline).
- **Leakage Prevention**: All features (historical skill, forecast evolution, thresholds) were mathematically constrained to prevent future data from leaking into the training rows.
- **Explainability**: SHAP is used for feature attribution. Explanations explicitly clarify that they represent statistical correlation, not meteorological causality.
