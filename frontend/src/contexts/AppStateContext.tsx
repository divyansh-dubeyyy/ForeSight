import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppState {
  region: string;
  setRegion: (region: string) => void;
  leadDay: number;
  setLeadDay: (day: number) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState('India');
  const [leadDay, setLeadDay] = useState(5);

  return (
    <AppStateContext.Provider value={{ region, setRegion, leadDay, setLeadDay }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
