import { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import regionsData from '../mocks/regions.json';
import { Maximize2, Minimize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockEvolutionData } from '../mocks/fallbackData';
import { cn } from '../lib/utils';

const geoUrl = '/india-states.geojson';

function getColor(bustProb: number | undefined) {
  if (bustProb === undefined) return 'var(--color-bg-subtle)'; // Neutral/No Data
  if (bustProb > 0.4) return 'var(--color-status-low)';
  if (bustProb > 0.2) return 'var(--color-status-mod)';
  return 'var(--color-status-high)';
}

// getReliabilityText removed as unused

export function Dashboard() {
  const { region, setRegion, leadDay, setLeadDay } = useAppState();
  const [position, setPosition] = useState({ coordinates: [80, 22] as [number, number], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ show: boolean, x: number, y: number, data?: any }>({ show: false, x: 0, y: 0 });

  const selectedStateMock = regionsData.find(r => r.region === region);
  const selectedDayMock = selectedStateMock?.days.find(d => d.day === leadDay);
  const selectedBustProb = selectedDayMock?.bust_probability;

  let intelBustProbText = 'Data unavailable';
  let intelStatusText = 'No Prototype Data';
  let intelStatusClass = 'text-text-muted';
  let intelErrorText = 'Data unavailable';
  let intelDirectionText = 'Data unavailable';
  let intelNwpText = 'Data unavailable';
  let intelTrustText = 'Data unavailable';
  let intelTrustClass = 'text-text-muted';

  if (selectedBustProb !== undefined) {
    intelBustProbText = `${(selectedBustProb * 100).toFixed(0)}%`;
    if (selectedBustProb > 0.4) {
      intelStatusText = 'Low Reliability';
      intelStatusClass = 'text-status-low';
    } else if (selectedBustProb > 0.2) {
      intelStatusText = 'Moderate Reliability';
      intelStatusClass = 'text-status-mod';
    } else {
      intelStatusText = 'High Reliability';
      intelStatusClass = 'text-status-high';
    }
    
    // Read from the enriched regionsData object
    intelErrorText = `±${selectedDayMock?.expected_error ?? 'N/A'} mm`;
    intelDirectionText = selectedDayMock?.direction ?? 'N/A';
    intelNwpText = `${selectedDayMock?.forecast_rainfall_mm ?? 'N/A'} mm`;
    intelTrustText = selectedDayMock?.model_trust ?? 'N/A';
    intelTrustClass = intelTrustText === 'High' ? 'text-status-high' : intelTrustText === 'Moderate' ? 'text-status-mod' : 'text-status-low';
  }

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  return (
    <div className="min-h-full flex flex-col gap-6" onMouseMove={(e) => {
        if (tooltip.show) setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      }}>
      {/* Top Main Grid */}
      <div className="flex-1 flex gap-6 min-h-0 relative">
        
        {/* Left: Map (60%) */}
        <div className="flex-[0.6] glass-card flex flex-col relative overflow-hidden">
          <div className="p-6 border-b border-border/10">
            <h2 className="text-lg font-semibold">India Forecast Reliability Map</h2>
            <p className="text-sm text-text-muted mt-1">Day {leadDay} (Valid: 06 Aug 2026)</p>
          </div>
          
          <div className="flex-1 relative bg-black/20">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1000,
                center: [80, 22] // Center of India
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={(pos: any) => {
                   if (pos.coordinates) setPosition(pos as any);
                }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties?.NAME_1 || geo.properties?.ST_NM || geo.properties?.name || 'Unknown';
                      
                      const stateMock = regionsData.find(r => r.region === stateName);
                      const dayMock = stateMock?.days.find(d => d.day === leadDay);
                      
                      const bustProb = dayMock?.bust_probability;
                      const fillColor = getColor(bustProb);
                      const isSelected = region === stateName;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isSelected ? '#38bdf8' : fillColor}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 1.5 : 0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { fill: '#38bdf8', outline: 'none', cursor: 'pointer' },
                            pressed: { outline: 'none' },
                          } as any}
                          onClick={() => setRegion(stateName)}
                          onMouseEnter={(e) => {
                             setTooltip({ show: true, x: e.clientX, y: e.clientY, data: {
                               region: stateName,
                               bustProb,
                               mm: dayMock?.forecast_rainfall_mm,
                               reliability: bustProb === undefined ? 'No Data' : bustProb > 0.4 ? 'Low' : (bustProb > 0.2 ? 'Moderate' : 'High')
                             }});
                          }}
                          onMouseLeave={() => setTooltip(prev => ({ ...prev, show: false }))}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
            
            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <button 
                onClick={handleZoomIn}
                className="w-8 h-8 glass-card flex items-center justify-center hover:bg-white/10"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="w-8 h-8 glass-card flex items-center justify-center hover:bg-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-6 right-6 glass-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-high" />
                <span className="text-sm text-text-muted">High Reliability</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-mod" />
                <span className="text-sm text-text-muted">Moderate Reliability</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-low" />
                <span className="text-sm text-text-muted">Low Reliability</span>
              </div>
            </div>
            
            {/* Tooltip */}
            {tooltip.show && tooltip.data && (
              <div 
                className="fixed z-50 glass-card p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[120%]"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <p className="font-semibold">{tooltip.data.region}</p>
                <div className="flex flex-col gap-1 mt-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Forecast:</span>
                    <span>{tooltip.data.mm !== undefined ? `${tooltip.data.mm} mm` : 'Data unavailable'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Bust Prob:</span>
                    <span>{tooltip.data.bustProb !== undefined ? `${(tooltip.data.bustProb * 100).toFixed(0)}%` : 'Data unavailable'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Reliability:</span>
                    <span className={
                      tooltip.data.reliability === 'High' ? 'text-status-high' : 
                      tooltip.data.reliability === 'Low' ? 'text-status-low' : 
                      tooltip.data.reliability === 'Moderate' ? 'text-status-mod' : 'text-text-muted'
                    }>{tooltip.data.reliability}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Region Intelligence (40%) */}
        <div className="flex-[0.4] flex flex-col gap-6 min-h-0">
          <div className="glass-card p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">{region}</h3>
                <p className="text-sm text-text-muted">Selected Region Intelligence</p>
              </div>
              <a href="/analysis" className="text-xs text-accent font-medium bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors">
                View Analysis
              </a>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Bust Probability</span>
                <div className={cn("text-3xl font-bold", intelStatusClass)}>{intelBustProbText}</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Reliability Status</span>
                <div className={cn("text-lg font-bold mt-2", intelStatusClass)}>{intelStatusText}</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Expected Error</span>
                <div className="text-xl font-bold">{intelErrorText}</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Error Direction</span>
                <div className="text-xl font-bold">{intelDirectionText}</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">NWP Forecast</span>
                <div className="text-xl font-bold">{intelNwpText}</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Model Trust</span>
                <div className={cn("text-xl font-bold", intelTrustClass)}>{intelTrustText}</div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Confidence Level</span>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                {selectedBustProb !== undefined ? (
                  <div 
                    className={cn("h-full transition-all duration-500", intelStatusClass.replace('text-', 'bg-'))} 
                    style={{ width: `${selectedBustProb * 100}%` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-text-muted">No Data</div>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>0%</span>
                <span>100% Risk</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 glass-card p-6 flex flex-col">
             <div>
               <h3 className="font-semibold text-lg">Forecast Revision History</h3>
               <p className="text-xs text-text-muted mb-4">How the forecast changed across successive runs</p>
             </div>
             <div className="flex-1 w-full relative min-h-[200px]">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockEvolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} reversed />
                      <YAxis stroke="var(--color-text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                      <Line type="monotone" dataKey="forecast_rainfall_mm" name="Rainfall (mm)" stroke="var(--color-accent)" strokeWidth={3} dot={{r: 4, fill: '#0f172a', strokeWidth: 2}} activeDot={{r: 6}} label={{ position: 'top', fill: '#f8fafc', fontSize: 10, dy: -10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
        
      </div>
      
      {/* Bottom: Reliability Horizon */}
      <div className="glass-card p-6 flex flex-col shrink-0">
         <h3 className="font-semibold text-lg mb-4">Reliability Horizon</h3>
         <div className="flex gap-4 overflow-x-auto pb-2">
           {[1,2,3,4,5,6,7,8,9,10].map((day) => {
             const stateMock = regionsData.find(r => r.region === region);
             const dayMock = stateMock?.days.find(d => d.day === day);
             const bustProb = dayMock?.bust_probability;
             const isSelected = day === leadDay;
             
             let reliabilityText = 'No Data';
             let reliabilityClass = 'bg-white/10 text-text-muted';
             let riskText = 'N/A';
             let errorText = 'Data unavailable';

             if (bustProb !== undefined) {
               riskText = `${(bustProb * 100).toFixed(0)}%`;
               if (bustProb > 0.4) {
                 reliabilityText = 'Low';
                 reliabilityClass = 'bg-status-low/20 text-status-low';
               } else if (bustProb > 0.2) {
                 reliabilityText = 'Moderate';
                 reliabilityClass = 'bg-status-mod/20 text-status-mod';
               } else {
                 reliabilityText = 'High';
                 reliabilityClass = 'bg-status-high/20 text-status-high';
               }
               errorText = '±' + (dayMock?.expected_error ?? 'N/A') + ' mm';
             }

             return (
               <button 
                 key={day}
                 onClick={() => setLeadDay(day)}
                 className={cn(
                   "flex-1 min-w-[120px] p-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:bg-white/5 cursor-pointer outline-none",
                   isSelected ? "bg-white/10 border-accent ring-1 ring-accent/30" : "bg-black/20 border-white/5"
                 )}
               >
                 <span className="text-xs font-semibold uppercase text-text-muted">Day {day}</span>
                 <span className={cn("text-xl font-bold", bustProb === undefined ? "text-text-muted text-lg" : "")}>
                   {riskText}
                 </span>
                 <div className="flex flex-col items-center gap-1 mt-1">
                   <span className={cn("text-xs font-bold px-2 py-1 rounded", reliabilityClass)}>
                     {reliabilityText}
                   </span>
                   {bustProb !== undefined && (
                     <span className="text-[10px] text-text-muted">Err: {errorText}</span>
                   )}
                 </div>
               </button>
             );
           })}
         </div>
      </div>
    </div>
  );
}
