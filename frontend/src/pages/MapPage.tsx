import { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import regionsData from '../mocks/regions.json';
import { Maximize2, Minimize2, Map as MapIcon } from 'lucide-react';

const geoUrl = '/india-states.geojson';

function getColor(bustProb: number | undefined) {
  if (bustProb === undefined) return 'rgba(255, 255, 255, 0.05)'; // Neutral/No Data
  if (bustProb > 0.4) return 'var(--color-status-low)';
  if (bustProb > 0.2) return 'var(--color-status-mod)';
  return 'var(--color-status-high)';
}

export function MapPage() {
  const { region, setRegion, leadDay } = useAppState();
  const [position, setPosition] = useState({ coordinates: [80, 22] as [number, number], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ show: boolean, x: number, y: number, data?: any }>({ show: false, x: 0, y: 0 });
  const [metric, setMetric] = useState<'bustRisk' | 'error' | 'trust'>('bustRisk');

  return (
    <div className="h-full flex flex-col gap-6" onMouseMove={(e) => {
        if (tooltip.show) setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      }}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3"><MapIcon className="text-accent" /> India Forecast Reliability Map</h1>
        <div className="flex gap-4">
           <select 
             className="glass-card px-4 py-2 text-sm font-medium outline-none cursor-pointer"
             value={metric}
             onChange={(e) => setMetric(e.target.value as any)}
           >
             <option className="bg-background" value="bustRisk">Metric: Bust Risk</option>
             <option className="bg-background" value="error">Metric: Expected Error</option>
             <option className="bg-background" value="trust">Metric: Model Trust</option>
           </select>
        </div>
      </div>

      <div className="flex-1 glass-card flex flex-col relative overflow-hidden">
        <div className="flex-1 relative bg-black/20">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 1200, center: [80, 22] }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={(pos: any) => { if (pos.coordinates) setPosition(pos as any); }}
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
                             region: stateName, bustProb, mm: dayMock?.forecast_rainfall_mm,
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
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <button onClick={() => setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }))} className="w-8 h-8 glass-card flex items-center justify-center hover:bg-white/10"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={() => setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }))} className="w-8 h-8 glass-card flex items-center justify-center hover:bg-white/10"><Minimize2 className="w-4 h-4" /></button>
          </div>
          
          <div className="absolute bottom-6 right-6 glass-card p-4 space-y-3">
            <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-status-high" /><span className="text-sm text-text-muted">High Reliability</span></div>
            <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-status-mod" /><span className="text-sm text-text-muted">Moderate Reliability</span></div>
            <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-status-low" /><span className="text-sm text-text-muted">Low Reliability</span></div>
            <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-white/10" /><span className="text-sm text-text-muted">No Prototype Data</span></div>
          </div>
          
          {tooltip.show && tooltip.data && (
            <div className="fixed z-50 glass-card p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[120%]" style={{ left: tooltip.x, top: tooltip.y }}>
              <p className="font-semibold">{tooltip.data.region}</p>
              <div className="flex flex-col gap-1 mt-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-text-muted">Forecast:</span><span>{tooltip.data.mm !== undefined ? `${tooltip.data.mm} mm` : 'Data unavailable'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-text-muted">Bust Prob:</span><span>{tooltip.data.bustProb !== undefined ? `${(tooltip.data.bustProb * 100).toFixed(0)}%` : 'Data unavailable'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-text-muted">Reliability:</span><span className={tooltip.data.reliability === 'High' ? 'text-status-high' : tooltip.data.reliability === 'Low' ? 'text-status-low' : tooltip.data.reliability === 'Moderate' ? 'text-status-mod' : 'text-text-muted'}>{tooltip.data.reliability}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
