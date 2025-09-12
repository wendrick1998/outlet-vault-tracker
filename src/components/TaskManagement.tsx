import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter,
  User,
  Calendar,
  MessageSquare,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskManagementProps {
  auditId: string;
}

interface TaskFormData {
  task_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  imei?: string;
}

export function TaskManagement({ auditId }: TaskManagementProps) {
  const { tasks, createTask, resolveTask } = useInventoryAudit(auditId);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [resolutionDialog, setResolutionDialog] = useState<{open: boolean, taskId?: string}>({open: false});
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newTask, setNewTask] = useState<TaskFormData>({
    task_type: '',
    description: '',
    priority: 'medium'
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesFilter = filter === 'all' || task.status === filter;
      const matchesSearch = !searchTerm || 
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, searchTerm]);

  const handleCreateTask = async () => {
    if (!newTask.task_type || !newTask.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createTask({
        audit_id: auditId,
        ...newTask
      });
      
      setNewTask({
        task_type: '',
        description: '',
        priority: 'medium'
      });
      setNewTaskDialog(false);
      toast.success('Tarefa criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleResolveTask = async () => {
    if (!resolutionDialog.taskId || !resolutionNotes.trim()) {
      toast.error('Adicione observações sobre a resolução');
      return;
    }

    try {
      await resolveTask({
        taskId: resolutionDialog.taskId,
        notes: resolutionNotes
      });
      
      setResolutionDialog({open: false});
      setResolutionNotes('');
      toast.success('Tarefa resolvida com sucesso');
    } catch (error) {
      console.error('Erro ao resolver tarefa:', error);
      toast.error('Erro ao resolver tarefa');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary">Média</Badge>;
      case 'low':
        return <Badge variant="outline">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const taskTypeOptions = [
    { value: 'item_missing', label: 'Item Ausente' },
    { value: 'item_damaged', label: 'Item Danificado' },
    { value: 'wrong_location', label: 'Local Incorreto' },
    { value: 'status_mismatch', label: 'Status Incorreto' },
    { value: 'verification_needed', label: 'Verificação Necessária' },
    { value: 'other', label: 'Outro' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gestão de Tarefas
            </CardTitle>
            
            <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Tarefa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Tarefa</label>
                    <Select value={newTask.task_type} onValueChange={(value) => setNewTask({...newTask, task_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Descreva a tarefa..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">IMEI (opcional)</label>
                    <Input
                      value={newTask.imei || ''}
                      onChange={(e) => setNewTask({...newTask, imei: e.target.value})}
                      placeholder="IMEI relacionado à tarefa"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateTask} className="flex-1">
                      Criar Tarefa
                    </Button>
                    <Button variant="outline" onClick={() => setNewTaskDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="open">Abertas</SelectItem>
                <SelectItem value="resolved">Resolvidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {tasks.filter(t => t.status === 'open').length}
              </div>
              <div className="text-xs text-muted-foreground">Tarefas Abertas</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {tasks.filter(t => t.status === 'resolved').length}
              </div>
              <div className="text-xs text-muted-foreground">Resolvidas</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {tasks.filter(t => t.priority === 'high' && t.status === 'open').length}
              </div>
              <div className="text-xs text-muted-foreground">Alta Prioridade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'Nenhuma tarefa encontrada' : `Nenhuma tarefa ${filter === 'open' ? 'aberta' : 'resolvida'}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {taskTypeOptions.find(opt => opt.value === task.task_type)?.label || task.task_type}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    <Badge variant={task.status === 'open' ? 'secondary' : 'default'}>
                      {task.status === 'open' ? 'Aberta' : 'Resolvida'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.created_at).toLocaleString()}
                    </div>
                    {task.imei && (
                      <div className="font-mono bg-muted px-2 py-1 rounded">
                        IMEI: {task.imei}
                      </div>
                    )}
                  </div>
                  
                  {task.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setResolutionDialog({open: true, taskId: task.id})}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>

                {task.resolution_notes && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                    <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
                      <MessageSquare className="h-3 w-3" />
                      Resolução:
                    </div>
                    <p className="text-sm">{task.resolution_notes}</p>
                    {task.resolved_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolvida em {new Date(task.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => setResolutionDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Observações da Resolução</label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Descreva como a tarefa foi resolvida..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleResolveTask} className="flex-1">
                Marcar como Resolvida
              </Button>
              <Button variant="outline" onClick={() => setResolutionDialog({open: false})}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}