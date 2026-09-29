import { Database, AlertCircle } from 'lucide-react';

export function DataPage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><Database className="text-accent" /> Data Sources & Provenance</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        
        <div className="glass-card p-6 bg-status-mod/10 border-status-mod/30 flex items-start gap-4">
          <AlertCircle className="text-status-mod shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-status-mod mb-1">Synthetic Prototype Data</h3>
            <p className="text-sm text-text-muted">
              The current dashboard is driven by a synthetic analog generator designed for offline validation. 
              The architecture and schemas are built for a drop-in integration with operational Numerical Weather Prediction (NWP) outputs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold border-b border-white/10 pb-2">Data Architecture</h3>
            
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Dataset Mode</div>
              <div className="font-medium">Phase 5 (Synthetic Analogs + Explainability)</div>
            </div>
            
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Forecast Source Structure</div>
              <div className="font-medium">T-240h to T-0h (6-hour intervals)</div>
              <p className="text-xs text-text-muted mt-1">Simulates standard global/regional model run frequencies.</p>
            </div>
            
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Forecast Vintage Concept</div>
              <div className="font-medium">Chronological State Tracking</div>
              <p className="text-xs text-text-muted mt-1">Maintains the state of what was known at each specific issue time to prevent data leakage during historical replay.</p>
            </div>
          </div>
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold border-b border-white/10 pb-2">Target Integration</h3>
            
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Observation Source</div>
              <div className="font-medium">IMD Gridded Rainfall Data (1x1 degree)</div>
              <p className="text-xs text-text-muted mt-1">Planned integration for operational ground-truth alignment.</p>
            </div>
            
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Historical Error Features</div>
              <div className="font-medium">Spatio-temporal Error Fields</div>
              <p className="text-xs text-text-muted mt-1">The models consume past spatial error patterns to identify emerging systemic model biases.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
