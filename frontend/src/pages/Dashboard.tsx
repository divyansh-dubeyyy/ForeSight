import { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import regionsData from '../mocks/regions.json';
import { Maximize2, Minimize2 } from 'lucide-react';

const geoUrl = '/india-states.geojson';

function getColor(bustProb: number) {
  if (bustProb > 0.4) return 'var(--color-status-low)';
  if (bustProb > 0.2) return 'var(--color-status-mod)';
  return 'var(--color-status-high)';
}

// getReliabilityText removed as unused

export function Dashboard() {
  const { region, setRegion, leadDay } = useAppState();
  const [position, setPosition] = useState({ coordinates: [80, 22] as [number, number], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ show: boolean, x: number, y: number, data?: any }>({ show: false, x: 0, y: 0 });

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  return (
    <div className="h-full flex flex-col gap-6" onMouseMove={(e) => {
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
                      const stateName = geo.properties?.ST_NM || geo.properties?.name || 'Unknown';
                      
                      const stateMock = regionsData.find(r => r.region === stateName);
                      const dayMock = stateMock?.days.find(d => d.day === leadDay);
                      
                      const bustProb = dayMock?.bust_probability ?? 0.1;
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
                               mm: Math.floor(Math.random() * 100 + 20), // Mock mm for tooltip
                               reliability: bustProb > 0.4 ? 'Low' : (bustProb > 0.2 ? 'Moderate' : 'High')
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
                    <span>{tooltip.data.mm} mm</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Bust Prob:</span>
                    <span>{(tooltip.data.bustProb * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Reliability:</span>
                    <span className={
                      tooltip.data.reliability === 'High' ? 'text-status-high' : 
                      tooltip.data.reliability === 'Low' ? 'text-status-low' : 'text-status-mod'
                    }>{tooltip.data.reliability}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Region Card & Chart Skeletons (40%) */}
        <div className="flex-[0.4] flex flex-col gap-6">
          <div className="h-64 glass-card p-6 flex flex-col relative overflow-hidden">
             <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-6"></div>
             <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white/5 rounded-lg animate-pulse"></div>
                <div className="bg-white/5 rounded-lg animate-pulse"></div>
                <div className="bg-white/5 rounded-lg animate-pulse"></div>
                <div className="bg-white/5 rounded-lg animate-pulse"></div>
             </div>
          </div>
          
          <div className="flex-1 glass-card p-6 flex flex-col">
             <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-6"></div>
             <div className="flex-1 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
      </div>
      
      {/* Bottom: Horizon Strip Skeleton */}
      <div className="h-40 glass-card p-6 flex flex-col">
         <div className="h-6 w-64 bg-white/5 rounded animate-pulse mb-4"></div>
         <div className="flex-1 flex gap-4">
           {Array.from({length: 10}).map((_, i) => (
             <div key={i} className="flex-1 bg-white/5 rounded-lg animate-pulse"></div>
           ))}
         </div>
      </div>
    </div>
  );
}
