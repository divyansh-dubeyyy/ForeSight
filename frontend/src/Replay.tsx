import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { Play, Pause, FastForward, SkipBack, CheckCircle, XCircle, Info, CloudRain, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function Replay() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [replayData, setReplayData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/replay/events`).then(res => {
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEvent(res.data[0].valid_time + '|' + res.data[0].region);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const [time, region] = selectedEvent.split('|');
      axios.get(`${API_BASE}/replay?region=${region}&valid_time=${time}`).then(res => {
        setReplayData(res.data);
        setCurrentIndex(0);
        setIsPlaying(false);
      });
    }
  }, [selectedEvent]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && replayData && currentIndex < replayData.states.length) {
      timer = setTimeout(() => {
        setCurrentIndex(c => c + 1);
      }, 1500); // 1.5 seconds per state
    } else if (isPlaying && currentIndex >= replayData.states.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, replayData]);

  if (!replayData) return <div style={{padding: '2rem'}}>Loading Replay Engine...</div>;

  const states = replayData.states;
  const isReveal = currentIndex === states.length;
  
  // The state to display
  const currentState = isReveal ? states[states.length - 1] : states[currentIndex];
  
  // Historical data for charts up to the current state
  const currentEvolution = currentState.evolution_history;
  
  // History of bust probabilities up to current index
  const probHistory = states.slice(0, Math.min(currentIndex + 1, states.length)).map((s: any) => ({
    label: `T-${s.lead_time_hours}h`,
    probability: s.bust_probability * 100
  }));

  const playPause = () => {
    if (isReveal) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr', maxWidth: '1200px' }}>
      <header className="header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <div className="logo">Historical Replay</div>
          <Link to="/" style={{color: 'var(--accent-cyan)', textDecoration: 'none'}}>← Back to Dashboard</Link>
        </div>
        
        <div>
          <select 
            className="glass-panel" 
            style={{padding: '0.5rem', color: 'white', background: 'rgba(255,255,255,0.1)'}}
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.map((e, i) => (
              <option key={i} value={`${e.valid_time}|${e.region}`} style={{color: 'black'}}>
                {e.region} — {e.valid_time}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Controls & Timeline */}
      <div className="glass-panel" style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button onClick={() => {setIsPlaying(false); setCurrentIndex(0)}} style={btnStyle}><SkipBack size={20}/></button>
          <button onClick={playPause} style={btnStyle}>
            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
          </button>
          <button onClick={() => {setIsPlaying(false); setCurrentIndex(states.length)}} style={btnStyle}><FastForward size={20}/></button>
        </div>
        
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto'}}>
          {states.map((s: any, idx: number) => (
            <div key={idx} style={{
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              background: idx === currentIndex ? 'var(--accent-cyan)' : idx < currentIndex ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: idx === currentIndex ? '#000' : 'white',
              fontWeight: idx === currentIndex ? 700 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }} onClick={() => {setIsPlaying(false); setCurrentIndex(idx)}}>
              T-{s.lead_time_hours}h
            </div>
          ))}
          <div style={{
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              background: isReveal ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: isReveal ? '#fff' : 'white',
              cursor: 'pointer',
              fontWeight: isReveal ? 700 : 400
          }} onClick={() => {setIsPlaying(false); setCurrentIndex(states.length)}}>
            Valid Time (Reveal)
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
        
        {/* State Card */}
        <div className="glass-panel">
          <div className="title"><Info className="title-icon"/> Current State Info</div>
          {isReveal ? (
            <div style={{textAlign: 'center', padding: '2rem 0'}}>
              <h2 style={{color: 'var(--accent-cyan)', marginBottom: '1rem'}}>Event Resolution</h2>
              <div style={{fontSize: '2rem', fontWeight: 700, margin: '1rem 0'}}>
                Observed: {replayData.reveal.actual_observed_rainfall_mm} mm
              </div>
              <div style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>
                Final Error: {replayData.reveal.actual_error_mm} mm
              </div>
              <div style={{marginTop: '2rem', fontSize: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: replayData.reveal.was_bust ? 'var(--status-low)' : 'var(--status-high)'}}>
                {replayData.reveal.was_bust ? <><XCircle/> BUST QUALIFIED</> : <><CheckCircle/> NORMAL EVENT</>}
              </div>
            </div>
          ) : (
            <>
              <div className="stat-row">
                <span className="stat-label">NWP Forecast</span>
                <span className="stat-value">{currentState.forecast_rainfall_mm} mm</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Bust Probability</span>
                <span className="stat-value" style={{color: currentState.bust_probability > 0.4 ? 'var(--status-low)' : 'var(--text-main)'}}>
                  {(currentState.bust_probability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Expected Error Range</span>
                <span className="stat-value">± {currentState.expected_error} mm</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Direction Bias</span>
                <span className="stat-value">{currentState.direction}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Model Trust (OOD)</span>
                <span className={`stat-value status-${currentState.model_trust === 'HIGH' ? 'High' : 'Low'}`}>
                  {currentState.model_trust === 'HIGH' ? <><ShieldCheck size={16}/> {currentState.model_trust}</> : <><AlertTriangle size={16}/> {currentState.model_trust}</>}
                </span>
              </div>
              
              <div style={{marginTop: '1.5rem'}}>
                <div style={{color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontWeight: 600}}>Top SHAP Drivers:</div>
                {currentState.explanation.model_attribution.map((attr: any, i: number) => (
                  <div key={i} style={{fontSize: '0.9rem', marginBottom: '0.25rem'}}>
                    • {attr.human_readable} (Value: {attr.actual_value.toFixed(2)})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Charts */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          
          <div className="glass-panel" style={{height: '250px', display: 'flex', flexDirection: 'column'}}>
            <div className="title" style={{fontSize: '1.1rem'}}><CloudRain className="title-icon"/> Known Forecast Evolution</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentEvolution} margin={{top: 5, right: 20, left: -20, bottom: 5}}>
                <defs>
                  <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} reversed />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background: 'rgba(13, 17, 28, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} itemStyle={{color: 'var(--accent-cyan)'}} />
                <Area type="stepAfter" dataKey="forecast_rainfall_mm" name="NWP Rainfall" stroke="var(--accent-cyan)" strokeWidth={3} fill="url(#colorEvolution)" activeDot={{r: 4, fill: '#fff', stroke: 'var(--accent-cyan)', strokeWidth: 2}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel" style={{height: '250px', display: 'flex', flexDirection: 'column'}}>
            <div className="title" style={{fontSize: '1.1rem'}}><AlertTriangle className="title-icon"/> Bust Risk History</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={probHistory} margin={{top: 5, right: 20, left: -20, bottom: 5}}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-low)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--status-low)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} reversed />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{background: 'rgba(13, 17, 28, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} itemStyle={{color: 'var(--status-low)'}} />
                <ReferenceArea y1={40} y2={100} fill="var(--status-low)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="probability" name="Bust Risk %" stroke="var(--status-low)" strokeWidth={3} fill="url(#colorRisk)" activeDot={{r: 4, fill: '#fff', stroke: 'var(--status-low)', strokeWidth: 2}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
        </div>

      </div>
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'white',
  padding: '0.75rem',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default Replay;
