import { Waves } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-8 text-center">
      <div className="inline-flex items-center gap-3">
        <Waves className="h-12 w-12 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quantum Leap
          </span>
        </h1>
      </div>
      <p className="mt-2 text-lg text-muted-foreground">
        AI-Powered Crypto Insights for Quick Profits
      </p>
    </header>
  );
}
