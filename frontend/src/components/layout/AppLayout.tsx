
import { NavLink, Outlet } from 'react-router-dom';
import { 
  CloudRain, 
  Home, 
  Map as MapIcon, 
  Grid, 
  BarChart2, 
  History, 
  TrendingUp, 
  Database, 
  Calendar,
  MapPin,
  Layers,
  RefreshCw,
  User
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppState } from '../../contexts/AppStateContext';
import { Dropdown } from '../ui/Dropdown';

const navItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'India Map', icon: MapIcon, path: '/map' },
  { name: 'Forecast Matrix', icon: Grid, path: '/matrix' },
  { name: 'Region Analysis', icon: BarChart2, path: '/analysis' },
  { name: 'Historical Replay', icon: History, path: '/replay' },
  { name: 'Model Performance', icon: TrendingUp, path: '/performance' },
  { name: 'Data Sources', icon: Database, path: '/data' },
];

export function AppLayout() {
  const { region, setRegion, leadDay, setLeadDay } = useAppState();

  return (
    <div className="flex h-screen overflow-hidden text-text-primary bg-background bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-background to-background">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-l-0 border-t-0 border-b-0 rounded-none flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <CloudRain className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-xl font-bold">ForeSight</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Forecast Reliability Intelligence</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-muted hover:text-text-primary hover:bg-panel"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-6 mt-auto">
          <div className="p-4 glass-card">
            <p className="text-xs text-text-muted">
              Turning Weather Forecasts into <span className="text-accent font-medium">Reliable Decisions.</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">
        {/* Top Bar */}
        <header className="h-20 p-6 flex items-center justify-between glass-card border-r-0 border-t-0 rounded-none shrink-0 relative z-50">
          <div className="flex items-center gap-4 relative">
            
            <Dropdown 
              label="Forecast Initialization"
              icon={<Calendar className="w-4 h-4" />}
              value="01 Aug 2026, 00 UTC"
              options={[{ label: "01 Aug 2026, 00 UTC", value: "01 Aug 2026, 00 UTC" }]}
              onChange={() => {}}
            />
            
            <Dropdown 
              label="Region"
              icon={<MapPin className="w-4 h-4" />}
              value={region}
              options={[
                { label: "India", value: "India" },
                { label: "Madhya Pradesh", value: "Madhya Pradesh" },
                { label: "Maharashtra", value: "Maharashtra" },
                { label: "Kerala", value: "Kerala" }
              ]}
              onChange={setRegion}
            />
            
            <Dropdown 
              label="Lead Day"
              icon={<Layers className="w-4 h-4" />}
              value={String(leadDay)}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => ({ label: `Day ${d}`, value: String(d) }))}
              onChange={(val) => setLeadDay(Number(val))}
            />
            
          </div>
          
          <div className="flex items-center gap-4">
             <div className="glass-card flex items-center gap-3 px-4 py-2 rounded-lg">
                <RefreshCw className="w-4 h-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase">Last Updated</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    01 Aug 2026, 06:30 UTC
                    <span className="w-2 h-2 rounded-full bg-status-high animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  </span>
                </div>
             </div>
             
             {/* User Avatar */}
             <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center cursor-pointer hover:bg-panel transition-colors">
               <User className="w-5 h-5 text-text-muted" />
             </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
