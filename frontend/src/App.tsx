import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { AppStateProvider } from './contexts/AppStateContext';
import { Dashboard } from './pages/Dashboard';
import { 
  MapPage, 
  MatrixPage, 
  AnalysisPage, 
  ReplayPage, 
  PerformancePage, 
  DataPage, 
  SettingsPage 
} from './pages/Placeholders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="map" element={<MapPage />} />
              <Route path="matrix" element={<MatrixPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="replay" element={<ReplayPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export default App;
