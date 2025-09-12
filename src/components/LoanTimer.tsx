import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LoanTimerProps {
  issuedAt: string;
  status: string;
  returnedAt?: string | null;
  className?: string;
}

export function LoanTimer({ issuedAt, status, returnedAt, className = "" }: LoanTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>('');

  useEffect(() => {
    // Se o empréstimo foi devolvido ou vendido, calcular tempo final
    if (status !== 'active') {
      const startDate = new Date(issuedAt);
      const endDate = returnedAt ? new Date(returnedAt) : new Date();
      const diff = endDate.getTime() - startDate.getTime();
      setElapsedTime(formatDuration(diff));
      return;
    }

    // Para empréstimos ativos, atualizar timer a cada segundo
    const updateTimer = () => {
      const startDate = new Date(issuedAt);
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      setElapsedTime(formatDuration(diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [issuedAt, status, returnedAt]);

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTimerColor = (): string => {
    if (status !== 'active') return 'text-muted-foreground';
    
    const startDate = new Date(issuedAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= 48) return 'text-destructive';
    if (hoursElapsed >= 24) return 'text-warning';
    return 'text-primary';
  };

  return (
    <div className={`flex items-center gap-1 text-sm ${getTimerColor()} ${className}`}>
      <Clock className="h-3 w-3" />
      <span className="font-mono">
        {elapsedTime}
        {status === 'active' && ' fora'}
      </span>
    </div>
  );
}