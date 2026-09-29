
import { Grid } from 'lucide-react';
import regionsData from '../mocks/regions.json';
import { cn } from '../lib/utils';

export function MatrixPage() {
  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3"><Grid className="text-accent" /> Reliability Matrix</h1>
        <div className="text-sm text-text-muted">Day 1 - 10 Forecast Verification</div>
      </div>

      <div className="flex-1 glass-card overflow-auto p-6">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-black/20 sticky top-0">
            <tr>
              <th className="px-6 py-4 font-semibold">Region</th>
              {days.map(day => (
                <th key={day} className="px-4 py-4 font-semibold text-center">Day {day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {regionsData.map((regionData) => (
              <tr key={regionData.region} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium whitespace-nowrap">{regionData.region}</td>
                {days.map(day => {
                  const data = regionData.days.find(d => d.day === day);
                  const bustProb = data?.bust_probability ?? 0.1;
                  const isLow = bustProb > 0.4;
                  const isMod = bustProb > 0.2;
                  
                  return (
                    <td key={day} className="px-2 py-4">
                      <div className="flex flex-col items-center gap-1 group relative cursor-help">
                        <div className={cn(
                          "w-full h-8 rounded-md flex items-center justify-center font-bold text-xs transition-colors border",
                          isLow ? "bg-status-low/20 text-status-low border-status-low/30" : 
                          isMod ? "bg-status-mod/20 text-status-mod border-status-mod/30" : 
                          "bg-status-high/20 text-status-high border-status-high/30"
                        )}>
                          {(bustProb * 100).toFixed(0)}%
                        </div>
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-10 bottom-full mb-2 bg-black/90 p-2 rounded text-[10px] w-max border border-white/10 pointer-events-none shadow-xl">
                          <p>Region: {regionData.region}</p>
                          <p>Expected Error: {data?.expected_error ? `±${data.expected_error} mm` : 'Data unavailable'}</p>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 flex items-center gap-6 justify-end text-sm">
           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-high/20 border border-status-high/30 text-status-high flex items-center justify-center text-[10px]">✓</div> High Reliability (&lt;20% Risk)</div>
           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-mod/20 border border-status-mod/30 text-status-mod flex items-center justify-center text-[10px]">-</div> Moderate Reliability (20-40% Risk)</div>
           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-low/20 border border-status-low/30 text-status-low flex items-center justify-center text-[10px]">!</div> Low Reliability (&gt;40% Risk)</div>
        </div>
      </div>
    </div>
  );
}
