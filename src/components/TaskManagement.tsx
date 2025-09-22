import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Task {
  id: string;
  audit_id: string;
  task_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  item_id?: string;
  imei?: string;
  assigned_to?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

interface TaskManagementProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskManagement({ auditId, isOpen, onClose }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    task_type: '',
    description: '',
    priority: 'medium' as const,
    imei: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, auditId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_audit_tasks')
        .select('*')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []).map(task => ({
        ...task,
        priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
        status: task.status as 'open' | 'in_progress' | 'resolved' | 'closed'
      })));
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.task_type || !newTask.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_audit_tasks')
        .insert({
          audit_id: auditId,
          task_type: newTask.task_type,
          description: newTask.description,
          priority: newTask.priority,
          imei: newTask.imei || null
        });

      if (error) throw error;

      toast.success('Tarefa criada com sucesso');
      setNewTask({ task_type: '', description: '', priority: 'medium', imei: '' });
      setShowCreateTask(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = (await supabase.auth.getUser()).data.user?.id;
        if (notes) updates.resolution_notes = notes;
      }

      const { error } = await supabase
        .from('inventory_audit_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Status da tarefa atualizado');
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || 
      (filter === 'open' && ['open', 'in_progress'].includes(task.status)) ||
      (filter === 'resolved' && ['resolved', 'closed'].includes(task.status));
    
    const matchesSearch = !searchTerm || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.imei?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const taskCounts = {
    all: tasks.length,
    open: tasks.filter(t => ['open', 'in_progress'].includes(t.status)).length,
    resolved: tasks.filter(t => ['resolved', 'closed'].includes(t.status)).length
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gerenciamento de Tarefas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({taskCounts.all})</SelectItem>
                  <SelectItem value="open">Abertas ({taskCounts.open})</SelectItem>
                  <SelectItem value="resolved">Resolvidas ({taskCounts.resolved})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>

          {/* Create Task Form */}
          {showCreateTask && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nova Tarefa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={newTask.task_type} onValueChange={(value) => 
                      setNewTask(prev => ({ ...prev, task_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="missing_item">Item Faltante</SelectItem>
                        <SelectItem value="wrong_location">Local Incorreto</SelectItem>
                        <SelectItem value="status_error">Erro de Status</SelectItem>
                        <SelectItem value="system_issue">Problema do Sistema</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={newTask.priority} onValueChange={(value: any) => 
                      setNewTask(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">IMEI (opcional)</label>
                  <Input
                    value={newTask.imei}
                    onChange={(e) => setNewTask(prev => ({ ...prev, imei: e.target.value }))}
                    placeholder="IMEI relacionado à tarefa"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a tarefa..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createTask}>
                    Criar Tarefa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Carregando tarefas...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Nenhuma tarefa encontrada</div>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id}>
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
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              const notes = prompt('Notas da resolução (opcional):');
                              updateTaskStatus(task.id, 'resolved', notes || undefined);
                            }}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}