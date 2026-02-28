import { OptimizationPanel } from '@/components/optimization/optimization-panel';

export default function OptimizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Optimization</h1>
        <p className="text-muted-foreground">
          Get actionable recommendations to switch models and save on costs.
        </p>
      </div>
      <OptimizationPanel />
    </div>
  );
}
