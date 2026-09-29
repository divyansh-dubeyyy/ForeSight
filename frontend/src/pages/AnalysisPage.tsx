import { useAppState } from '../contexts/AppStateContext';
import { BarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const mockShapData = [
  { feature: 'CAPE Deviation', value: 0.15 },
  { feature: 'Wind Shear (850mb)', value: 0.12 },
  { feature: 'Soil Moisture Anomaly', value: 0.08 },
  { feature: 'Orography Interaction', value: 0.06 },
  { feature: 'Temp Advection', value: 0.04 },
];

export function AnalysisPage() {
  const { region, leadDay } = useAppState();

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3"><BarChart2 className="text-accent" /> Region Analysis</h1>
        <div className="glass-card px-4 py-2 text-sm font-medium">
          {region} — Day {leadDay}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-muted uppercase mb-4">Current Prediction</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm">Bust Probability</span>
                <span className="font-bold text-status-low text-xl">78%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm">Expected Error</span>
                <span className="font-bold text-lg">±31 mm</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm">Direction Bias</span>
                <span className="font-bold text-lg text-status-mod">Under-forecast</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm">Model Trust (OOD)</span>
                <span className="font-bold text-lg text-status-high flex items-center gap-2"><ShieldCheck size={18}/> High</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 flex-1 bg-black/20">
             <div className="flex items-start gap-3">
               <AlertTriangle className="text-status-mod shrink-0" />
               <p className="text-sm text-text-muted">
                 <strong>Insight:</strong> The forecast has shifted significantly over the last 48 hours, driven by unstable CAPE deviations. Model confidence remains high despite the high bust probability, indicating the error pattern is well-understood by the AI.
               </p>
             </div>
          </div>
        </div>

        <div className="col-span-2 glass-card p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Why? (Statistical Model Attribution)</h3>
            <p className="text-sm text-text-muted mt-1">Statistical model attribution, not causal meteorological proof.</p>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={mockShapData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis dataKey="feature" type="category" stroke="var(--color-text-primary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                <Bar dataKey="value" name="SHAP Impact" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
