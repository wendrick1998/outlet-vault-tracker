import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PendencyTimerProps {
  createdAt: string;
  className?: string;
}

export function PendencyTimer({ createdAt, className = "" }: PendencyTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const startDate = new Date(createdAt);
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      setElapsedTime(formatDuration(diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h pendente`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m pendente`;
    } else if (minutes > 0) {
      return `${minutes}m pendente`;
    } else {
      return `${seconds}s pendente`;
    }
  };

  const getTimerColor = (): string => {
    const startDate = new Date(createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= 24) return 'text-destructive';
    if (hoursElapsed >= 2) return 'text-warning';
    return 'text-primary';
  };

  return (
    <div className={`flex items-center gap-1 text-sm ${getTimerColor()} ${className}`}>
      <AlertTriangle className="h-3 w-3" />
      <span className="font-mono">{elapsedTime}</span>
    </div>
  );
}