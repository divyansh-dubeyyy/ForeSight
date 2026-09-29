# 🌧️ ForeSight

### AI-Powered Forecast Reliability Intelligence for NWP Rainfall Forecasts

> **Don't just ask what the forecast says. Ask how much you should trust it.**

ForeSight is a prototype **forecast reliability intelligence layer** built over existing Numerical Weather Prediction (NWP) rainfall forecasts.

Instead of generating another weather forecast, ForeSight analyzes the **reliability of an existing forecast** and estimates:

- 🎯 Bust Probability
- 📏 Expected Error
- ↕️ Error Direction
- 📊 Uncertainty Bounds
- 🧠 Model Trust / OOD Detection
- 🔍 SHAP-based Explanations
- 📈 Forecast Evolution
- 🕐 Reliability Horizon
- ⏪ Historical Forecast Replay

---

## 🚀 Why ForeSight?

Traditional forecast dashboards primarily answer:

> **"How much rainfall is predicted?"**

ForeSight focuses on a different question:

> **"How reliable is that prediction?"**

A forecast can change significantly between successive NWP runs. ForeSight captures these revisions and combines them with historical forecast-error behavior to estimate the likelihood of a **forecast bust**.

### Core Idea

```text
        Existing NWP Forecast
                 │
                 ▼
        Forecast Evolution
                 │
                 ▼
      Historical Forecast Skill
                 │
                 ▼
       ┌─────────────────────┐
       │  Reliability Engine │
       └─────────────────────┘
          │    │    │    │
          ▼    ▼    ▼    ▼
       Bust  Error  Direction  Uncertainty
       Risk  Size             + Model Trust
          │
          ▼
     Explainable Reliability
          │
          ▼
     Dashboard + Replay
```

---

# ✨ Key Features

## 🗺️ India Reliability Map

Visualizes regional forecast reliability across India.

Each region can be classified as:

🟢 **High Reliability**<br>
🟡 **Moderate Reliability**<br>
🔴 **Low Reliability**

Regions without available prototype data are explicitly shown as unavailable rather than being assigned fabricated values.

---

## 📊 Forecast Reliability

For a selected region and lead day, ForeSight provides:

| Signal | Description |
|---|---|
| **Bust Probability** | Probability that the forecast may exceed the defined error threshold |
| **Expected Error** | Estimated magnitude of forecast error |
| **Error Direction** | Under-forecast / Neutral / Over-forecast |
| **Uncertainty** | Prediction interval around expected error |
| **Model Trust** | Whether the current feature pattern is within the model's learned distribution |

---

## 🔄 Forecast Evolution

### The key differentiator

ForeSight does not treat a forecast as a single static number.

It tracks how the forecast changes across successive NWP runs for the **same valid period**.

Example:

```text
T-216h → 42 mm
T-192h → 48 mm
T-168h → 55 mm
T-144h → 63 mm
T-120h → 71 mm
T-96h  → 79 mm
T-72h  → 88 mm
T-48h  → 94 mm
T-24h  → 101 mm
Current → 107 mm
```

From this evolution, ForeSight extracts signals such as:

- Revision magnitude
- Forecast volatility
- Trend
- Acceleration
- Direction reversals
- Cumulative revision
- Forecast stability

This helps the reliability layer understand whether a forecast is **stable or repeatedly changing**.

---

# 🧠 AI Reliability Engine

ForeSight uses a multi-output machine-learning pipeline.

```text
NWP Features
     +
Forecast Evolution
     +
Historical Forecast Skill
     +
Spatial / Temporal Context
          │
          ▼
    XGBoost Models
          │
    ┌─────┼──────────────┐
    ▼     ▼              ▼
  Bust   Error        Direction
 Risk   Magnitude      Class
    │     │              │
    └─────┼──────────────┘
          ▼
   Reliability Layer
          │
    ┌─────┴──────────┐
    ▼                ▼
Uncertainty       Model Trust
                 / OOD Detection
```

---

# 🔍 Explainability

ForeSight uses **SHAP-based feature attribution** to explain why the reliability model produced a particular result.

Example:

```text
Why is this forecast considered risky?

↑ Forecast volatility
↑ Recent forecast revision
↑ Historical bust frequency
↓ Historical forecast skill
```

The dashboard translates model features into human-readable explanations.

> **Important:** SHAP explanations represent model attribution, not causal meteorological explanations.

---

# 🕐 Reliability Horizon

ForeSight evaluates reliability across **Day 1 → Day 10**.

Instead of only asking:

> "Is today's forecast reliable?"

the system also provides:

> "How far into the forecast horizon does the reliability remain acceptable?"

Example:

```text
Day 1   🟢
Day 2   🟢
Day 3   🟢
Day 4   🟡
Day 5   🟡
Day 6   🔴
Day 7   🔴
Day 8   🔴
Day 9   🔴
Day 10  🔴
```

---

# ⏪ Historical Forecast Replay

Historical Replay reconstructs how forecast reliability evolved before the actual rainfall outcome was revealed.

```text
T-216h
   ↓
T-168h
   ↓
T-120h
   ↓
T-72h
   ↓
T-48h
   ↓
T-24h
   ↓
Current Forecast
   ↓
Actual Observation
```

The replay is designed to preserve chronological information and avoid using future forecast runs when reconstructing an earlier state.

This allows the user to see:

- Forecast revisions
- Bust probability changes
- Expected error
- Model trust
- SHAP drivers
- Final observed outcome

---

# 📈 Prototype Validation

The current prototype uses **synthetic data** to validate the complete pipeline.

### Ablation Results

| Feature Set | Bust PR-AUC | ROC-AUC | Error MAE | Direction F1 |
|---|---:|---:|---:|---:|
| NWP Only | 0.399 | 0.881 | 4.025 mm | 0.581 |
| + Forecast Evolution | 0.697 | 0.947 | 3.121 mm | 0.721 |
| + Historical Skill | 0.711 | 0.950 | 3.111 mm | 0.719 |

The prototype demonstrates that adding **forecast evolution features** substantially changes the reliability-model performance on the synthetic validation dataset.

### Calibration & Uncertainty

```text
Calibration Brier Score
0.0479

90% Conformal Interval
Actual Coverage: 90.2%

Average Interval Width
12.58 mm

OOD False Alarm Rate
2.8%
```

> These numbers are prototype validation results on synthetic data. They do **not** represent operational performance on real Indian weather forecasts.

---

# 🖥️ Dashboard

The ForeSight dashboard provides:

### Main Dashboard
- India Reliability Map
- Selected Region Intelligence
- Bust Probability
- Expected Error
- Model Trust
- Forecast Evolution
- Reliability Horizon

### Forecast Matrix
Day 1–10 reliability comparison.

### Region Analysis
Detailed regional forecast reliability.

### Historical Replay
Chronological reconstruction of forecast evolution.

### Model Performance
Prototype validation metrics.

### Data Sources
Dataset and provenance information.

---

# 🏗️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Simple Maps
- Lucide Icons

### Backend

- Python
- FastAPI
- Uvicorn

### Machine Learning

- XGBoost
- Scikit-learn
- SHAP
- Pandas
- NumPy

### Data

- Parquet
- Synthetic NWP-style forecast data
- Synthetic observations
- Historical forecast evolution

---

# 📁 Project Structure

```text
ForeSight/
│
├── backend/
│   └── FastAPI application
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   └── api/
│
├── ml/
│   ├── src/
│   └── models/
│
├── data/
│   └── synthetic datasets
│
├── data_adapters/
│   └── forecast / observation alignment
│
├── tests/
│   └── pipeline and replay tests
│
├── docs/
│   ├── demo_flow.md
│   ├── data_assumptions.md
│   ├── data_provenance.md
│   ├── final_validation.md
│   └── model_card.md
│
└── run_demo.bat
```

---

# ⚡ Quick Start

### 1. Clone

```bash
git clone https://github.com/divyansh-dubeyyy/ForeSight.git
cd ForeSight
```

### 2. Backend

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1

python -m pip install fastapi uvicorn pandas numpy pyarrow joblib shap scikit-learn xgboost pytest httpx
```

### 3. Frontend

```bash
cd frontend
npm ci
cd ..
```

### 4. Start Backend

```bash
python backend/main.py
```

### 5. Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

API documentation:

```text
http://localhost:8000/docs
```

### Windows Demo

After dependencies are installed:

```text
run_demo.bat
```

starts the backend and frontend for the local demo.

---

# 🧪 Run Tests

From the repository root:

```bash
python -m pytest
```

Frontend build:

```bash
cd frontend
npm run build
```

---

# ⚠️ Prototype Limitations

ForeSight is currently a **research/demo prototype**.

### Synthetic Data

The included datasets and trained models use synthetic data.

Therefore:

> The reported metrics demonstrate pipeline behavior, not real-world operational weather-forecast performance.

### Current Prototype Limitations

- Real operational NWP data is not connected.
- Real Indian monsoon performance has not been established.
- Bust thresholds require further seasonal/regime-specific calibration.
- Direction classification currently uses a prototype tolerance.
- Production deployment would require validation on real historical NWP + observation archives.

---

# 🔬 Scientific Design Principles

ForeSight follows several important principles:

### 1. Reliability ≠ Forecast Generation

ForeSight does not replace the NWP model.

It evaluates the reliability of its output.

### 2. Forecast Evolution Matters

Successive forecast revisions contain information that a single forecast snapshot cannot capture.

### 3. Chronological Validation

Training, validation and testing follow chronological splits to reduce temporal leakage.

### 4. No Future Leakage in Replay

Historical replay only uses information that would have been available at that point in time.

### 5. Uncertainty Is Explicit

The system exposes prediction intervals rather than presenting a single deterministic error value.

### 6. Explainability

Model predictions are accompanied by feature-attribution information.

---

# 📚 Documentation

- [Demo Flow](https://github.com/divyansh-dubeyyy/ForeSight/blob/main/docs/demo_flow.md)
- [Data Assumptions](https://github.com/divyansh-dubeyyy/ForeSight/blob/main/docs/data_assumptions.md)
- [Data Provenance](https://github.com/divyansh-dubeyyy/ForeSight/blob/main/docs/data_provenance.md)
- [Final Validation & Limitations](https://github.com/divyansh-dubeyyy/ForeSight/blob/main/docs/final_validation.md)
- [Model Card](https://github.com/divyansh-dubeyyy/ForeSight/blob/main/docs/model_card.md)

---

# 👥 Team

Built as a prototype for **Smart India Hackathon 2026**.

**Problem Statement:** SIH 26079<br>
**Project:** ForeSight<br>
**Domain:** AI / Weather Forecast Reliability

---

## ⭐ Project Vision

> **ForeSight turns forecast numbers into forecast confidence.**

Instead of simply showing:

```text
Rainfall Forecast: 107 mm
```

ForeSight aims to provide:

```text
Rainfall Forecast: 107 mm

Bust Probability: High
Expected Error: ±31 mm
Direction: Under-forecast
Model Trust: Moderate

Why?
→ Forecast has undergone significant revisions
→ Historical forecast errors are elevated
→ Current feature pattern shows increased uncertainty
```

---

> **ForeSight is a prototype reliability layer over existing NWP forecasts — not a replacement weather forecasting model.**
