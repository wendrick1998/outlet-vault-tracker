import { useState } from 'react';
import { Search, Filter, X, Package, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import { useInventory } from '@/hooks/useInventory';
import type { Database } from '@/integrations/supabase/types';

interface SearchFilters {
  query: string;
  status: string;
  brand: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface AdvancedSearchProps {
  onResults: (results: any[]) => void;
}

export const AdvancedSearch = ({ onResults }: AdvancedSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    brand: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const { searchInventory, isSearching } = useInventory();

  const handleSearch = async () => {
    try {
      const results = await searchInventory({
        query: filters.query,
        options: {
          status: filters.status !== 'all' ? filters.status as Database['public']['Enums']['inventory_status'] : undefined,
          brand: filters.brand !== 'all' ? filters.brand : undefined,
          category: filters.category !== 'all' ? filters.category : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }
      });
      onResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
      brand: 'all', 
      category: 'all',
      dateFrom: '',
      dateTo: ''
    });
    onResults([]);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => index > 0 && value !== 'all' && value !== ''
  ).length;

  return (
    <FeatureFlagWrapper flag={FEATURE_FLAGS.ADVANCED_INVENTORY_SEARCH}>
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IMEI, modelo, marca..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="absolute top-full right-0 z-50 mt-2">
                <Card className="w-80 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros Avançados</h4>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="loaned">Emprestado</SelectItem>
                          <SelectItem value="sold">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Marca</label>
                      <Select value={filters.brand} onValueChange={(value) => setFilters({ ...filters, brand: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="Apple">Apple</SelectItem>
                          <SelectItem value="Samsung">Samsung</SelectItem>
                          <SelectItem value="Xiaomi">Xiaomi</SelectItem>
                          <SelectItem value="Motorola">Motorola</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <FeatureFlagWrapper flag={FEATURE_FLAGS.INVENTORY_CATEGORIES}>
                      <div>
                        <label className="text-sm font-medium">Categoria</label>
                        <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="smartphone">Smartphone</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="smartwatch">Smartwatch</SelectItem>
                            <SelectItem value="accessories">Acessórios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FeatureFlagWrapper>

                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Período
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                          placeholder="De"
                        />
                        <Input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                          placeholder="Até"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar
                    </Button>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </Card>
    </FeatureFlagWrapper>
  );
};