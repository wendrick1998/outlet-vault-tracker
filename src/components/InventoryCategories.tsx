import { useState } from 'react';
import { Tag, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  parent_id?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Smartphones',
    description: 'Aparelhos celulares e smartphones',
    color: 'blue',
    icon: 'smartphone'
  },
  {
    id: '2', 
    name: 'Tablets',
    description: 'Tablets e iPads',
    color: 'green',
    icon: 'tablet'
  },
  {
    id: '3',
    name: 'Smartwatches',
    description: 'Relógios inteligentes',
    color: 'purple',
    icon: 'watch'
  },
  {
    id: '4',
    name: 'Acessórios',
    description: 'Capas, carregadores, fones, etc.',
    color: 'orange',
    icon: 'cable'
  }
];

export const InventoryCategories = () => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'tag'
  });
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'O nome da categoria é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      color: newCategory.color,
      icon: newCategory.icon
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', description: '', color: 'blue', icon: 'tag' });
    setIsAddingCategory(false);

    toast({
      title: 'Categoria criada',
      description: `Categoria "${category.name}" foi criada com sucesso.`
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return;

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id
        ? { ...cat, ...newCategory }
        : cat
    );

    setCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', color: 'blue', icon: 'tag' });

    toast({
      title: 'Categoria atualizada',
      description: `Categoria foi atualizada com sucesso.`
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    toast({
      title: 'Categoria removida',
      description: 'Categoria foi removida com sucesso.',
      variant: 'destructive'
    });
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <FeatureFlagWrapper flag={FEATURE_FLAGS.INVENTORY_CATEGORIES}>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categorias de Inventário
              </h3>
              <p className="text-sm text-muted-foreground">
                Organize seus itens em categorias para melhor controle
              </p>
            </div>

            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Ex: Smartphones"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Descrição da categoria..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Cor</label>
                      <Select value={newCategory.color} onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Azul</SelectItem>
                          <SelectItem value="green">Verde</SelectItem>
                          <SelectItem value="purple">Roxo</SelectItem>
                          <SelectItem value="orange">Laranja</SelectItem>
                          <SelectItem value="red">Vermelho</SelectItem>
                          <SelectItem value="yellow">Amarelo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Ícone</label>
                      <Select value={newCategory.icon} onValueChange={(value) => setNewCategory({ ...newCategory, icon: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smartphone">📱 Smartphone</SelectItem>
                          <SelectItem value="tablet">📲 Tablet</SelectItem>
                          <SelectItem value="watch">⌚ Relógio</SelectItem>
                          <SelectItem value="cable">🔌 Cabo</SelectItem>
                          <SelectItem value="headphone">🎧 Fone</SelectItem>
                          <SelectItem value="case">📱 Capa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                      setNewCategory({ name: '', description: '', color: 'blue', icon: 'tag' });
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <Badge variant="outline" className={getColorClass(category.color)}>
                          {category.icon} {category.color}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {category.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">0 itens</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleEditCategory(category);
                          setIsAddingCategory(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </FeatureFlagWrapper>
  );
};