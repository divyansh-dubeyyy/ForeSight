import { useAppState } from '../contexts/AppStateContext';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  const { region, setRegion, leadDay, setLeadDay } = useAppState();

  return (
    <div className="h-full flex flex-col gap-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3"><Settings className="text-accent" /> Preferences</h1>
      </div>

      <div className="glass-card p-6 flex flex-col gap-6">
        
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <label className="text-sm font-semibold text-text-primary">Default Region</label>
          <p className="text-xs text-text-muted mb-2">Select the primary region to monitor on startup.</p>
          <select 
            className="glass-card px-4 py-2 text-sm font-medium outline-none cursor-pointer w-64"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option className="bg-background" value="India">India</option>
            <option className="bg-background" value="Madhya Pradesh">Madhya Pradesh</option>
            <option className="bg-background" value="Maharashtra">Maharashtra</option>
            <option className="bg-background" value="Kerala">Kerala</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <label className="text-sm font-semibold text-text-primary">Default Lead Day</label>
          <p className="text-xs text-text-muted mb-2">The default forecast horizon to display across views.</p>
          <select 
            className="glass-card px-4 py-2 text-sm font-medium outline-none cursor-pointer w-64"
            value={leadDay}
            onChange={(e) => setLeadDay(Number(e.target.value))}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(d => (
               <option key={d} className="bg-background" value={d}>Day {d}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <label className="text-sm font-semibold text-text-primary">Theme</label>
          <p className="text-xs text-text-muted mb-2">Apperance mode for the dashboard.</p>
          <select 
            className="glass-card px-4 py-2 text-sm font-medium outline-none cursor-pointer w-64 opacity-70"
            disabled
          >
            <option className="bg-background">Dark (Meteorological)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-primary">Demo Mode</label>
          <p className="text-xs text-text-muted mb-2">Use synthetic data generation vs operational API connection.</p>
          <div className="flex items-center gap-3 mt-2">
             <div className="w-10 h-6 bg-accent rounded-full relative cursor-not-allowed opacity-70">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
             </div>
             <span className="text-sm text-text-muted">Enabled (Synthetic Phase 5)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
