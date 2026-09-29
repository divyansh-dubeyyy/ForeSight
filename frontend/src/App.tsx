import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapPin, Target, TrendingUp, CalendarDays, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

const MAP_COORDS: Record<string, { top: string, left: string }> = {
  'Delhi': { top: '25%', left: '35%' },
  'Mumbai': { top: '65%', left: '25%' },
  'Chennai': { top: '85%', left: '45%' },
  'Kolkata': { top: '50%', left: '75%' }
};

function App() {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('Chennai');
  const [regionData, setRegionData] = useState<any>(null);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [evolution, setEvolution] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE}/map?lead_day=5`).then(res => setRegions(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`${API_BASE}/region/${selectedRegion}?lead_day=5`).then(res => setRegionData(res.data)).catch(console.error);
      axios.get(`${API_BASE}/matrix?region=${selectedRegion}`).then(res => setMatrix(res.data)).catch(console.error);
      axios.get(`${API_BASE}/evolution/${selectedRegion}`).then(res => setEvolution(res.data)).catch(console.error);
    }
  }, [selectedRegion]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">BustSense</div>
          <div className="subtitle">AI-Powered Forecast Reliability Intelligence</div>
        </div>
        <div className="header-right">
          <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>System Status: <span className="status-High" style={{fontWeight: 600}}>Online</span> | Selected Lead: Day 5</div>
          <Link to="/replay" className="action-btn">
            Historical Replay
          </Link>
        </div>
      </header>

      <div className="main-grid">
        {/* Left: Map */}
        <div className="panel map-container">
          <div className="panel-header"><MapPin size={16}/> India Reliability Map</div>
          <div className="india-map-area">
            {/* SVG outline placeholder for context */}
            <svg viewBox="0 0 100 100" style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none'}}>
              <path d="M 35 15 L 45 10 L 55 15 L 60 25 L 80 45 L 85 55 L 75 60 L 50 95 L 40 85 L 20 60 L 15 50 L 25 35 Z" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {regions.map(r => {
              const coords = MAP_COORDS[r.region] || { top: '50%', left: '50%' };
              return (
                <div 
                  key={r.region} 
                  className={`map-marker ${selectedRegion === r.region ? 'active' : ''}`}
                  style={{ top: coords.top, left: coords.left }}
                  onClick={() => setSelectedRegion(r.region)}
                >
                  <div className={`marker-dot bg-${r.reliability_status}`}></div>
                  <div className="marker-label">{r.region}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Top: Forecast Evolution */}
        <div className="panel evolution-chart">
          <div className="panel-header"><TrendingUp size={16}/> Forecast Revision History</div>
          <div style={{flex: 1, width: '100%', minHeight: 0}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution} margin={{top: 10, right: 20, left: 0, bottom: 10}}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="var(--text-secondary)" 
                  tick={{fontSize: 12, fill: 'var(--text-secondary)'}} 
                  axisLine={{stroke: 'var(--border)'}}
                  tickLine={false} 
                  reversed
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tick={{fontSize: 12, fill: 'var(--text-secondary)'}} 
                  axisLine={false} 
                  tickLine={false}
                  label={{ value: 'Forecast Rainfall (mm)', angle: -90, position: 'insideLeft', fill: 'var(--text-tertiary)', style: {fontSize: 12} }}
                />
                <Tooltip 
                  contentStyle={{background: 'var(--bg-panel-alt)', border: '1px solid var(--border)', borderRadius: '6px'}}
                  itemStyle={{color: 'var(--text-primary)', fontWeight: 600}}
                  labelStyle={{color: 'var(--text-secondary)', marginBottom: '4px'}}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="forecast_rainfall_mm" 
                  name="Forecast" 
                  stroke="var(--accent)" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  activeDot={{r: 4, fill: 'var(--accent)', stroke: '#fff', strokeWidth: 1}} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Left Bottom: Region Card */}
        <div className="panel region-card">
          <div className="panel-header"><Target size={16}/> {selectedRegion} Intelligence</div>
          {regionData ? (
            <div className="metric-grid">
              <div className="metric-box">
                <div className="metric-title">Bust Probability</div>
                <div className={`metric-value status-${regionData.bust_probability > 0.4 ? 'Low' : 'High'}`}>
                  {(regionData.bust_probability * 100).toFixed(0)}%
                </div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Expected Error</div>
                <div className="metric-value">± {regionData.expected_error} mm</div>
              </div>
              {regionData.direction && (
                <div className="metric-box">
                  <div className="metric-title">Error Direction</div>
                  <div className="metric-value">{regionData.direction}</div>
                </div>
              )}
              <div className="metric-box">
                <div className="metric-title">NWP Forecast</div>
                <div className="metric-value">{regionData.forecast_rainfall_mm} mm</div>
              </div>
              <div className="metric-box" style={regionData.direction ? {} : {gridColumn: '1 / -1'}}>
                <div className="metric-title">Model Trust (OOD)</div>
                <div className={`metric-value status-${regionData.model_trust === 'HIGH' ? 'High' : 'Low'}`} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  {regionData.model_trust === 'HIGH' ? <ShieldCheck size={20}/> : <ShieldAlert size={20}/>}
                  {regionData.model_trust}
                </div>
              </div>
            </div>
          ) : (
            <div style={{color: 'var(--text-tertiary)', fontSize: '0.9rem'}}>Loading intelligence...</div>
          )}
        </div>

        {/* Right Bottom: Horizon Strip */}
        <div className="panel horizon-strip">
          <div className="panel-header"><CalendarDays size={16}/> Day 1–10 Reliability Horizon ({selectedRegion})</div>
          <div className="days-container">
            {matrix.map(d => (
              <div key={d.day} className={`day-card border-${d.day === 5 ? d.reliability_status : 'none'}`} style={d.day === 5 ? {background: 'var(--bg-panel)'} : {}}>
                <div className="day-num">Day {d.day}</div>
                <div className={`day-status status-${d.reliability_status}`}>{d.reliability_status}</div>
                
                {d.bust_probability !== undefined ? (
                  <div className="day-val">{(d.bust_probability * 100).toFixed(0)}% <span style={{fontSize: '0.75rem', fontWeight: 400}}>Bust Risk</span></div>
                ) : (
                  <div className="day-val">{d.forecast_rainfall_mm} <span style={{fontSize: '0.75rem', fontWeight: 400}}>mm</span></div>
                )}
                
                <div className="day-err" style={{marginTop: 'auto'}}>
                  {d.expected_error !== undefined ? `± ${d.expected_error} mm err` : 'NWP Forecast'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
