import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  task_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  imei?: string;
  created_at: string;
  resolution_notes?: string;
}

interface MemoizedTaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, status: string, notes?: string) => void;
}

export const MemoizedTaskCard = memo(function MemoizedTaskCard({ 
  task, 
  onUpdateStatus 
}: MemoizedTaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{task.task_type.replace('_', ' ')}</span>
                <Badge variant={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge variant="outline">
                  {task.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {task.description}
              </p>
              {task.imei && (
                <p className="text-xs font-mono text-muted-foreground">
                  IMEI: {task.imei}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Criada em: {new Date(task.created_at).toLocaleString()}
              </p>
              {task.resolution_notes && (
                <p className="text-xs text-green-600 mt-1">
                  Resolução: {task.resolution_notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {task.status === 'open' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus(task.id, 'in_progress')}
              >
                Iniciar
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                size="sm"
                onClick={() => {
                  const notes = prompt('Notas da resolução (opcional):');
                  onUpdateStatus(task.id, 'resolved', notes || undefined);
                }}
              >
                Resolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});