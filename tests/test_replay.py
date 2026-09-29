import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app, load_data

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_data():
    load_data()

def test_replay_events_available():
    response = client.get("/api/replay/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) > 0
    assert 'region' in events[0]
    assert 'valid_time' in events[0]

def test_replay_leakage_safety():
    """
    Verifies that for a given replay state, the evolution history 
    only contains forecast runs available at or before the current lead time.
    """
    # Pick the first available event
    events_resp = client.get("/api/replay/events")
    events = events_resp.json()
    
    if len(events) == 0:
        pytest.skip("No events available for replay test.")
        
    event = events[0]
    region = event['region']
    valid_time = event['valid_time']
    
    response = client.get(f"/api/replay?region={region}&valid_time={valid_time}")
    assert response.status_code == 200
    
    data = response.json()
    states = data['states']
    
    for state in states:
        current_lead_time = state['lead_time_hours']
        
        # Verify evolution history only contains this lead time and older (higher) lead times
        for past_run in state['evolution_history']:
            assert past_run['lead_time_hours'] >= current_lead_time, \
                f"LEAKAGE DETECTED: Found future forecast (T-{past_run['lead_time_hours']}h) in state T-{current_lead_time}h"
                
    # Verify reveal state contains the actual observations
    reveal = data['reveal']
    assert 'actual_observed_rainfall_mm' in reveal
    assert 'was_bust' in reveal
