# SIH Demo Flow

This document outlines the deterministic, offline-capable storyline for presenting BustSense during the SIH demo.

## Core Message
**"NWP tells us WHAT might happen. BustSense tells us HOW MUCH TO TRUST it."**

## Preparation
1. Ensure both the FastAPI backend and React frontend are running locally.
2. The demo uses the pre-generated synthetic datasets, making it 100% offline-capable and deterministic.
3. *Crucial*: Verbally clarify to the judges that the metrics shown are prototype capabilities on synthetic data, but the mathematical architecture is production-ready for real NCMRWF data.

## Step-by-Step Storyline

### Step 1: The Big Picture (India Map)
- **Action**: Open the Dashboard Home. Point to the India Reliability Map.
- **Script**: "We start with a bird's-eye view. Instead of just showing rainfall amounts, BustSense color-codes regions by *Reliability*. Green means the NWP is trustworthy. Red means a high risk of a forecast bust."

### Step 2 & 3: Deep Dive & The Horizon
- **Action**: Click on a specific Region (e.g., Chennai). Look at the Day 1–10 Reliability Strip.
- **Script**: "For Chennai, we can see exactly when the model breaks down. This is the Reliability Horizon. Here, we see the forecast is reliable up to Day 5, but by Day 6, the risk becomes unacceptable."

### Step 4 & 5: Examining the Risk
- **Action**: Look at the Selected Region Card.
- **Script**: "Instead of a black box 0-100 score, we separate the intelligence into three actionable metrics:
  1. **Bust Probability**: 65% chance this forecast fails.
  2. **Expected Error Bound**: ± 12 mm of uncertainty (Conformal Prediction).
  3. **Model Trust (OOD)**: High. This means the model has seen this pattern before, so the 65% bust risk is highly confident."

### Step 6: Forecast Evolution (The 'Why' - Part 1)
- **Action**: Point to the Forecast Evolution Chart.
- **Script**: "Why is it busting? Our core thesis is that you shouldn't just look at the latest forecast snapshot; you must look at its *evolution*. Notice how the NWP prediction for this exact day has been wildly jumping up and down over the last 5 days. BustSense captures this volatility."

### Step 7: SHAP (The 'Why' - Part 2)
- **Action**: Point to the Top SHAP Drivers list.
- **Script**: "The ML model explains exactly what triggered the alarm. In this case, 'Magnitude of recent NWP revision' and 'Forecast Volatility' are driving the bust probability."

### Step 8, 9, & 10: Historical Replay (The Proof)
- **Action**: Click "Launch Historical Replay". Select the event. Click "Play".
- **Script**: "To prove this works without future leakage, let's step back in time. Watch the timeline. At T-120h, the model was confident. At T-72h, the NWP made a massive jump, and BustSense instantly spiked the Bust Risk to 80%."
- **Action**: Let it hit the "Valid Time (Reveal)" stage.
- **Script**: "Finally, the reveal. The NWP predicted 40mm, but the actual rainfall was 0mm. BustSense correctly warned the meteorologist 3 days in advance not to trust that 40mm spike."

### Step 11: Scientific Validation
- **Action**: (Optional) Open the Data Provenance or Validation documentation.
- **Script**: "We rigorously validated this pipeline using strict chronological splitting. Adding our forecast evolution features boosted the PR-AUC of bust detection by 75% compared to using the NWP snapshot alone."
