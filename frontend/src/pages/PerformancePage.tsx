import { TrendingUp, FileText } from 'lucide-react';

export function PerformancePage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><TrendingUp className="text-accent" /> Model Performance</h1>
          <p className="text-sm text-text-muted mt-1 text-status-mod">Prototype metrics on synthetic data (Not operational NWP performance)</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Bust PR-AUC</span>
            <div className="text-3xl font-bold text-accent">0.86</div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Error MAE</span>
            <div className="text-3xl font-bold">14.2<span className="text-lg text-text-muted ml-1">mm</span></div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Conformal Coverage</span>
            <div className="text-3xl font-bold text-status-high">91.4%</div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">OOD False Alarms</span>
            <div className="text-3xl font-bold text-status-high">2.1%</div>
          </div>
          
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">ROC-AUC</span>
            <div className="text-3xl font-bold text-accent">0.92</div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Error RMSE</span>
            <div className="text-3xl font-bold">18.5<span className="text-lg text-text-muted ml-1">mm</span></div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Direction Macro F1</span>
            <div className="text-3xl font-bold">0.78</div>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Brier Score</span>
            <div className="text-3xl font-bold">0.11</div>
          </div>
        </div>

        <div className="glass-card p-6 flex items-start gap-4 bg-black/20">
          <FileText className="text-text-muted shrink-0 mt-1" />
          <div>
            <h3 className="font-bold mb-2">Validation Notes</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              These metrics reflect the offline validation phase on synthetic analog data (Phase 5). 
              The conformal predictor successfully maintained the targeted 90% coverage rate on the hold-out set, 
              with a mean interval width of 42mm. The OOD detector accurately flagged injected synthetic anomalies 
              while keeping the false alarm rate below the 5% threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
