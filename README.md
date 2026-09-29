# ForeSight

ForeSight is a prototype rainfall-forecast reliability dashboard. It analyzes whether a numerical weather prediction (NWP) forecast is likely to be trustworthy, rather than presenting forecast rainfall alone.

The project includes a FastAPI backend and a React dashboard. It surfaces regional reliability, bust probability, expected error bounds, model trust, forecast evolution, model explanations, and historical replay.

> **Prototype data notice:** The included datasets, trained models, and reported evaluation metrics are based on synthetic data. They are for demonstrating the pipeline and must not be interpreted as operational forecast performance.

## Quick Start

Requirements: Python, Node.js, and npm. Run commands from the repository root unless noted.

Create and activate a Python virtual environment, then install the backend and test dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn pandas numpy pyarrow joblib shap scikit-learn xgboost pytest httpx
```

Install the frontend dependencies:

```powershell
cd frontend
npm ci
cd ..
```

Start the backend in one terminal:

```powershell
python backend/main.py
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173>. The API documentation is available at <http://localhost:8000/docs>.

On Windows, after installing the dependencies above, `run_demo.bat` starts both services and opens the dashboard.

## What It Demonstrates

- Regional reliability summaries and lead-day comparisons.
- Calibrated bust-risk estimates, expected error bounds, and out-of-distribution trust signals.
- Forecast evolution and feature-attribution explanations.
- Historical replay of forecast updates, followed by the observed outcome.

The demo runs locally with the committed synthetic datasets and model artifacts; no external weather-data service is required.

## Project Layout

- `backend/`: FastAPI application and dashboard API.
- `frontend/`: React, TypeScript, and Vite dashboard.
- `ml/src/`: Feature engineering, labeling, model training, reliability, and explainability code.
- `ml/models/`: Prototype model artifacts and evaluation results.
- `data/`: Synthetic input and processed datasets.
- `data_adapters/`: Forecast/observation alignment and data schema utilities.
- `tests/`: Alignment, labeling, and replay tests.
- `docs/`: Data assumptions, provenance, validation, model details, and demo flow.

## Tests

From the repository root, run:

```powershell
python -m pytest
```

## Further Reading

- [Demo flow](docs/demo_flow.md)
- [Data assumptions](docs/data_assumptions.md)
- [Data provenance](docs/data_provenance.md)
- [Final validation and limitations](docs/final_validation.md)
- [Model card](docs/model_card.md)