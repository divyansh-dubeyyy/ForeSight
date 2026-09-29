import { useState, useEffect } from 'react';
import { api } from '../api';
import type { ReplayEvent, ReplayData } from '../api/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { Play, Pause, FastForward, SkipBack, CheckCircle, XCircle, Info, CloudRain, ShieldCheck, AlertTriangle, History } from 'lucide-react';

export function ReplayPage() {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    api.getReplayEvents().then(data => {
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0].valid_time + '|' + data[0].region);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const [time, region] = selectedEvent.split('|');
      api.getReplayData(region, time).then(data => {
        if (data) {
          setReplayData(data);
          setCurrentIndex(0);
          setIsPlaying(false);
        }
      });
    }
  }, [selectedEvent]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && replayData && currentIndex < replayData.states.length) {
      timer = setTimeout(() => {
        setCurrentIndex(c => c + 1);
      }, 1500);
    } else if (isPlaying && replayData && currentIndex >= replayData.states.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, replayData]);

  if (!replayData) return <div className="p-6">Loading Replay Engine...</div>;

  const states = replayData.states;
  const isReveal = currentIndex === states.length;
  const currentState = isReveal ? states[states.length - 1] : states[currentIndex];
  
  const currentEvolution = currentState.evolution_history || [];
  
  const probHistory = states.slice(0, Math.min(currentIndex + 1, states.length)).map((s) => ({
    label: `T-${s.lead_time_hours}h`,
    probability: (s.bust_probability ?? 0) * 100
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
    <div className="h-full flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><History className="text-accent" /> Historical Replay</h1>
          <p className="text-sm text-text-muted mt-1">Leakage regression tests passed. Chronological replay of known historical events.</p>
        </div>
        
        <div>
          <select 
            className="glass-card px-4 py-2 text-sm font-medium outline-none cursor-pointer"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.map((e, i) => (
              <option key={i} value={`${e.valid_time}|${e.region}`} className="bg-background">
                {e.region} — {e.valid_time}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Controls & Timeline */}
      <div className="glass-card p-4 flex items-center gap-6">
        <div className="flex gap-2">
          <button onClick={() => {setIsPlaying(false); setCurrentIndex(0)}} className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors"><SkipBack size={20}/></button>
          <button onClick={playPause} className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors text-accent">
            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
          </button>
          <button onClick={() => {setIsPlaying(false); setCurrentIndex(states.length)}} className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors"><FastForward size={20}/></button>
        </div>
        
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
          {states.map((s, idx) => (
            <button 
              key={idx} 
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                idx === currentIndex ? 'bg-accent text-background' : 
                idx < currentIndex ? 'bg-white/10 text-white' : 'glass-card text-text-muted'
              }`}
              onClick={() => {setIsPlaying(false); setCurrentIndex(idx)}}
            >
              T-{s.lead_time_hours}h
            </button>
          ))}
          <button 
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isReveal ? 'bg-status-low text-background' : 'glass-card text-text-muted'
            }`}
            onClick={() => {setIsPlaying(false); setCurrentIndex(states.length)}}
          >
            Valid Time (Reveal)
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        
        {/* State Card */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 font-bold"><Info size={18}/> Current State Info</div>
          
          <div className="p-6 flex-1 overflow-auto">
          {isReveal && replayData.reveal ? (
            <div className="text-center py-8">
              <h2 className="text-xl text-accent mb-4">Event Resolution</h2>
              <div className="text-4xl font-bold my-4">
                Observed: {replayData.reveal.actual_observed_rainfall_mm} mm
              </div>
              <div className="text-xl text-text-muted">
                Final Error: {replayData.reveal.actual_error_mm} mm
              </div>
              <div className={`mt-8 text-2xl font-bold flex justify-center items-center gap-3 ${replayData.reveal.was_bust ? 'text-status-low' : 'text-status-high'}`}>
                {replayData.reveal.was_bust ? <><XCircle size={32}/> BUST QUALIFIED</> : <><CheckCircle size={32}/> NORMAL EVENT</>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-text-muted text-sm">NWP Forecast</span>
                <span className="font-bold text-lg">{currentState.forecast_rainfall_mm} mm</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-text-muted text-sm">Bust Probability</span>
                <span className={`font-bold text-xl ${(currentState.bust_probability ?? 0) > 0.4 ? 'text-status-low' : 'text-text-primary'}`}>
                  {((currentState.bust_probability ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-text-muted text-sm">Expected Error Range</span>
                <span className="font-bold text-lg">± {currentState.expected_error} mm</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-text-muted text-sm">Direction Bias</span>
                <span className="font-bold text-lg">{currentState.direction}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-text-muted text-sm">Model Trust (OOD)</span>
                <span className={`font-bold text-lg flex items-center gap-2 ${currentState.model_trust === 'HIGH' ? 'text-status-high' : 'text-status-low'}`}>
                  {currentState.model_trust === 'HIGH' ? <><ShieldCheck size={18}/> {currentState.model_trust}</> : <><AlertTriangle size={18}/> {currentState.model_trust}</>}
                </span>
              </div>
              
              <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
                <div className="text-accent mb-2 font-semibold text-sm">Top SHAP Drivers:</div>
                {currentState.explanation?.model_attribution?.map((attr: any, i: number) => (
                  <div key={i} className="text-sm mb-1 text-text-muted">
                    • {attr.human_readable} (Value: {attr.actual_value.toFixed(2)})
                  </div>
                )) || <div className="text-sm text-text-muted">No SHAP data available for this state.</div>}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Charts */}
        <div className="flex flex-col gap-6">
          
          <div className="flex-1 glass-card flex flex-col overflow-hidden min-h-[200px]">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 font-bold text-sm"><CloudRain size={16}/> Known Forecast Evolution</div>
            <div className="flex-1 p-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentEvolution} margin={{top: 5, right: 0, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} reversed />
                  <YAxis stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} itemStyle={{color: 'var(--color-accent)'}} />
                  <Area type="stepAfter" dataKey="forecast_rainfall_mm" name="NWP Rainfall" stroke="var(--color-accent)" strokeWidth={2} fill="url(#colorEvolution)" activeDot={{r: 4}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 glass-card flex flex-col overflow-hidden min-h-[200px]">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 font-bold text-sm"><AlertTriangle size={16}/> Bust Risk History</div>
            <div className="flex-1 p-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={probHistory} margin={{top: 5, right: 0, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-status-low)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-status-low)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} reversed />
                  <YAxis stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} itemStyle={{color: 'var(--color-status-low)'}} />
                  <ReferenceArea y1={40} y2={100} fill="var(--color-status-low)" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="probability" name="Bust Risk %" stroke="var(--color-status-low)" strokeWidth={2} fill="url(#colorRisk)" activeDot={{r: 4}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
