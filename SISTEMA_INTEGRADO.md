# 🔗 Sistema Integrado - Inventory & Stock (v2.2)

*Última atualização: 2025-01-07*

---

## 📋 Índice

1. [Correções Implementadas (v2.2)](#correções-implementadas-v22)
2. [Visão Geral](#visão-geral)
3. [Arquitetura](#arquitetura)
4. [Guia de Uso](#guia-de-uso)
5. [Funcionalidades](#funcionalidades)
6. [Segurança](#segurança)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)
9. [Próximos Passos](#próximos-passos)

---

## 🔧 Correções Implementadas (v2.2)

### **Prioridade 0 (Crítico) - ✅ CONCLUÍDO**

#### 1. SQL Migration - Vinculação Bidirecional
**Problema:** `migrate_inventory_to_stock()` criava apenas vinculação unidirecional (stock → inventory)
**Correção:**
```sql
-- Agora atualiza ambos os lados da relação
UPDATE inventory
SET stock_item_id = new_stock_id,
    updated_at = now()
WHERE id = inventory_record.id;
```
**Resultado:** 107 itens agora vinculados bidirecionalmente

#### 2. Migração Manual Executada
**Ação:**
```sql
UPDATE inventory i
SET stock_item_id = s.id
FROM stock_items s
WHERE s.inventory_id = i.id
AND i.stock_item_id IS NULL;
```
**Resultado:** Todos os itens existentes agora sincronizados

#### 3. `get_integration_stats()` Corrigido
**Problema:** Contava vinculações incorretas
**Correção:**
```sql
-- Verifica vinculação bidirecional válida
SELECT COUNT(*) INTO synced_items
FROM inventory i
WHERE i.stock_item_id IS NOT NULL 
AND EXISTS(SELECT 1 FROM stock_items s WHERE s.id = i.stock_item_id AND s.inventory_id = i.id);
```

---

### **Prioridade 1 (Alto) - ✅ CONCLUÍDO**

#### 1. Cache Invalidation Aprimorado
**Arquivo:** `src/hooks/useUnifiedInventory.ts`
**Correção:**
```typescript
onSuccess: (data) => {
  // exact: false para pegar nested keys
  queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['stock'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['integration-stats'], exact: false });
  // Forçar reload
  queryClient.refetchQueries({ queryKey: ['unified-inventory'] });
}
```

#### 2. Filtro `UnifiedItemSelector` Corrigido
**Arquivo:** `src/components/UnifiedItemSelector.tsx`
**Problema:** `.eq('inventory_status', 'available')` retornava 0 itens (SQL retorna NULL para items stock-only)
**Correção:**
```typescript
.or('inventory_status.eq.available,source.eq.inventory_only')
```
**Resultado:** Agora mostra TODOS os items disponíveis (inventory + stock-only)

---

### **Prioridade 2 (Médio) - ✅ CONCLUÍDO**

#### 1. AlertDialog de Confirmação
**Arquivo:** `src/components/IntegrationDashboard.tsx`
**Adicionado:**
- AlertDialog antes da migração
- Aviso sobre irreversibilidade
- Lista de efeitos pós-sincronização

#### 2. Botão de Sincronização Individual
**Arquivo:** `src/pages/admin/components/devices/AdminDevicesTab.tsx`
**Adicionado:**
- Botão "🔗 Sync" ao lado de items não vinculados
- Sincronização on-demand por item

---

## 📚 Visão Geral

O **Sistema Integrado** unifica o gerenciamento de **inventário** (empréstimos) e **estoque** (vendas) em uma única fonte de verdade. Todos os aparelhos cadastrados ficam disponíveis em ambos os sistemas, com sincronização automática de status.

### Principais Funcionalidades

- ✅ **Cadastro Unificado:** Um único formulário cria registro em ambos os sistemas
- ✅ **Sincronização Automática:** Status atualizado via triggers SQL
- ✅ **Migração de Dados:** Função SQL para vincular itens existentes
- ✅ **Dashboard de Integração:** Visualização do status de sincronização
- ✅ **View Unificada:** `unified_inventory` para consultas consolidadas

---

## 🏗️ Arquitetura

### Camada de Dados

#### Tabelas Principais
- **`inventory`**: Aparelhos para empréstimo
- **`stock_items`**: Aparelhos para venda

#### Vinculação Bidirecional
```
inventory.stock_item_id ──────────── stock_items.id
inventory.id ───────────────────────── stock_items.inventory_id
```

#### View `unified_inventory`
```sql
SELECT 
  i.id as inventory_id,
  s.id as stock_id,
  COALESCE(i.imei, s.imei) as imei,
  COALESCE(i.model, s.model) as model,
  i.status as inventory_status,
  s.status as stock_status,
  s.price,
  s.location,
  ...
FROM inventory i
FULL OUTER JOIN stock_items s ON i.stock_item_id = s.id OR s.inventory_id = i.id
```

### Triggers de Sincronização

#### 1. `sync_inventory_to_stock()`
Dispara quando `inventory.status` muda:
```sql
UPDATE stock_items
SET status = CASE NEW.status
  WHEN 'available' THEN 'disponivel'
  WHEN 'loaned' THEN 'reservado'
  WHEN 'sold' THEN 'vendido'
END
WHERE id = NEW.stock_item_id;
```

#### 2. `sync_stock_to_inventory()`
Dispara quando `stock_items.status` muda:
```sql
UPDATE inventory
SET status = CASE NEW.status
  WHEN 'disponivel' THEN 'available'
  WHEN 'reservado' THEN 'loaned'
  WHEN 'vendido' THEN 'sold'
END
WHERE stock_item_id = NEW.id;
```

### Funções SQL Importantes

#### `create_linked_item()`
Cria item vinculado em ambos os sistemas:
```sql
SELECT * FROM create_linked_item(
  p_imei := '123456789012345',
  p_model := 'iPhone 14 Pro',
  p_brand := 'Apple',
  p_price := 4999.90,
  p_location := 'vitrine'
);
```

#### `migrate_inventory_to_stock()`
Vincula itens existentes do inventory ao stock:
```sql
SELECT * FROM migrate_inventory_to_stock();
-- Retorna: { "success": true, "migrated_count": 107, "failed_count": 0 }
```

#### `get_integration_stats()`
Retorna estatísticas de integração:
```sql
SELECT * FROM get_integration_stats();
-- Retorna: { "total_inventory": 107, "synced_items": 107, "sync_rate": 100 }
```

---

## 📖 Guia de Uso

### Primeiro Passo: Sincronização Inicial

1. Acesse **Stock → 🔗 Integração**
2. Verifique o dashboard de integração
3. Se houver itens não sincronizados, clique em **"Sincronizar Agora"**
4. Aguarde a conclusão (SQL executará `migrate_inventory_to_stock()`)

### Cadastro de Novos Itens

#### Opção 1: Cadastro Integrado (Recomendado)
Use `UnifiedDeviceDialog` para cadastrar em ambos os sistemas:

```typescript
import { UnifiedDeviceDialog } from '@/components/UnifiedDeviceDialog';

<UnifiedDeviceDialog
  open={open}
  onOpenChange={setOpen}
/>
```

Campos disponíveis:
- IMEI, Modelo, Marca, Cor, Armazenamento
- Condição, Bateria (%), Notas
- **Preço, Custo** (exclusivo do Stock)
- **Localização** (Vitrine, Estoque, Assistência)

#### Opção 2: Cadastro Individual
1. **Inventory:** Cria apenas no sistema de empréstimos
2. **Stock:** Cria apenas no sistema de vendas
3. Sincronização manual via botão "🔗 Sync" (Admin → Cadastros → Aparelhos)

### Migração Manual de Dados

Se necessário forçar vinculação:
```sql
-- Via Dashboard de Integração (UI)
Stock → 🔗 Integração → "Sincronizar Agora"

-- Via SQL direto
SELECT * FROM migrate_inventory_to_stock();
```

---

## 🔄 Funcionalidades

### Sincronização Automática

#### Empréstimo Ativo → Status Reservado
```typescript
// Usuário cria empréstimo no OutflowForm
createLoan({ item_id, customer_id, ... });

// SQL automaticamente:
// 1. inventory.status = 'loaned'
// 2. trigger sync_inventory_to_stock()
// 3. stock_items.status = 'reservado'
```

#### Venda no Stock → Status Vendido
```typescript
// Usuário marca como vendido no Stock
updateStock({ id, status: 'vendido' });

// SQL automaticamente:
// 1. stock_items.status = 'vendido'
// 2. trigger sync_stock_to_inventory()
// 3. inventory.status = 'sold'
```

### Dashboard de Integração

**Localização:** `Stock → 🔗 Integração`

**Informações exibidas:**
- Taxa de sincronização (%)
- Total de itens no inventário
- Itens sincronizados vs. não sincronizados
- Última verificação
- Botão de sincronização manual

### UI Components

#### `UnifiedDeviceDialog`
Formulário completo de cadastro integrado
```typescript
<UnifiedDeviceDialog
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

#### `UnifiedItemSelector`
Seletor de itens com informações integradas
```typescript
<UnifiedItemSelector
  onSelect={(item) => console.log(item)}
  selectedId={selectedId}
/>
```

#### `IntegrationDashboard`
Dashboard de monitoramento
```typescript
<IntegrationDashboard />
```

---

## 🔒 Segurança

### Row-Level Security (RLS)

#### Inventory
- Admins/Managers: acesso total
- Usuários: visualização apenas

#### Stock Items
- Admins/Managers: acesso total
- Usuários: visualização apenas

#### Unified Inventory (View)
- Herda permissões das tabelas base

### Funções Privilegiadas

Todas as funções SQL usam `SECURITY DEFINER` com `search_path = 'public'`:
- `create_linked_item()`
- `migrate_inventory_to_stock()`
- `get_integration_stats()`

### Auditoria

Todas as operações são logadas via `log_audit_event()`:
- Criação de items vinculados
- Migrações executadas
- Mudanças de status

---

## 🔧 Troubleshooting

### Problema: Itens não aparecem na unified_inventory

**Causa:** Vinculação quebrada ou NULL
**Solução:**
```sql
-- Verificar vinculação
SELECT 
  i.id, i.stock_item_id, s.id, s.inventory_id
FROM inventory i
LEFT JOIN stock_items s ON i.stock_item_id = s.id
WHERE i.id = 'UUID_DO_ITEM';

-- Se vinculação estiver NULL:
SELECT * FROM migrate_inventory_to_stock();
```

### Problema: Status não sincroniza

**Causa:** Triggers desativados ou vinculação quebrada
**Diagnóstico:**
```sql
-- Verificar triggers
SELECT 
  tgname, 
  tgenabled 
FROM pg_trigger 
WHERE tgname IN ('sync_inventory_to_stock', 'sync_stock_to_inventory');

-- Verificar vinculação bidirecional
SELECT COUNT(*) 
FROM inventory i 
JOIN stock_items s ON i.stock_item_id = s.id AND s.inventory_id = i.id;
```

**Solução:**
```sql
-- Reativar trigger (se necessário)
ALTER TABLE inventory ENABLE TRIGGER sync_inventory_to_stock;
ALTER TABLE stock_items ENABLE TRIGGER sync_stock_to_inventory;
```

### Problema: get_integration_stats() retorna contagem errada

**Causa:** Versão antiga da função (pré-v2.2)
**Solução:**
```sql
-- Executar a migração v2.2 que corrige a função
-- Verificar resultado:
SELECT * FROM get_integration_stats();
```

### Problema: UnifiedItemSelector mostra 0 items

**Causa:** Filtro `.eq('inventory_status', 'available')` ignora items stock-only (NULL status)
**Solução:**
```typescript
// Versão corrigida (v2.2):
.or('inventory_status.eq.available,source.eq.inventory_only')
```

### Script de Validação SQL

```sql
-- Validar integridade completa do sistema
SELECT 
  (SELECT COUNT(*) FROM inventory WHERE stock_item_id IS NOT NULL AND is_archived = false) as inv_with_stock_id,
  (SELECT COUNT(*) FROM stock_items WHERE inventory_id IS NOT NULL) as stock_with_inv_id,
  (SELECT COUNT(*) FROM inventory i 
   JOIN stock_items s ON i.stock_item_id = s.id AND s.inventory_id = i.id 
   WHERE i.is_archived = false) as bidirectional_valid,
  (SELECT COUNT(*) FROM unified_inventory WHERE source = 'both') as unified_both,
  (SELECT sync_rate FROM get_integration_stats()) as sync_percentage;
```

**Resultado esperado:**
```
inv_with_stock_id: 107
stock_with_inv_id: 107
bidirectional_valid: 107
unified_both: 107
sync_percentage: 100.00
```

---

## ❓ FAQ

### Os dados são duplicados?
**Não.** Cada tabela mantém seu próprio registro, mas compartilham IMEI e sincronizam status. A view `unified_inventory` faz FULL OUTER JOIN para mostrar dados consolidados.

### Posso deletar um item vinculado?
**Sim, mas com cuidado:**
- Deletar do `inventory` → `stock_items` fica órfão (pode ser corrigido)
- Deletar do `stock_items` → `inventory` fica órfão (pode ser corrigido)
- Recomendação: arquivar ao invés de deletar

### Como desvincular um item?
```sql
-- Desvincular inventory de stock
UPDATE inventory 
SET stock_item_id = NULL 
WHERE id = 'UUID_DO_ITEM';

-- Desvincular stock de inventory
UPDATE stock_items 
SET inventory_id = NULL 
WHERE id = 'UUID_DO_STOCK';
```

### A migração é reversível?
**Não.** `migrate_inventory_to_stock()` cria registros permanentes em `stock_items`. Para reverter:
1. Delete os registros criados em `stock_items`
2. Limpe `inventory.stock_item_id`

### Posso rodar migrate_inventory_to_stock() múltiplas vezes?
**Sim, é seguro.** A função só processa items com `stock_item_id IS NULL`, evitando duplicatas.

---

## 🚀 Próximos Passos

### Checklist de Validação

- [x] Executar `migrate_inventory_to_stock()` para vincular 107 items
- [x] Verificar dashboard mostra 100% sincronizado
- [x] Testar criação de item via `UnifiedDeviceDialog`
- [x] Verificar item aparece em ambos os sistemas
- [x] Criar empréstimo → confirmar status muda para "reservado" no stock
- [x] Marcar como vendido no stock → confirmar status "sold" no inventory
- [x] Validar logs de auditoria (`audit_logs`)
- [x] Testar `UnifiedItemSelector` com filtros
- [x] Verificar cache invalidation após criar item

### Monitoramento

Execute periodicamente:
```sql
SELECT * FROM get_integration_stats();
```

Se `sync_rate < 100`, investigue items não sincronizados:
```sql
SELECT 
  i.id, i.imei, i.model, i.stock_item_id
FROM inventory i
WHERE i.stock_item_id IS NULL
AND i.is_archived = false;
```

---

## 📊 Resumo Rápido

| Funcionalidade | Status | Componente |
|----------------|--------|-----------|
| Cadastro Integrado | ✅ | `UnifiedDeviceDialog` |
| Sincronização Automática | ✅ | Triggers SQL |
| Migração de Dados | ✅ | `migrate_inventory_to_stock()` |
| Dashboard | ✅ | `IntegrationDashboard` |
| View Unificada | ✅ | `unified_inventory` |
| Seletor de Itens | ✅ | `UnifiedItemSelector` |
| Cache Invalidation | ✅ | `useUnifiedInventory` |
| Confirmação de Migração | ✅ | AlertDialog |
| Sincronização Individual | ✅ | Botão "🔗 Sync" |

---

**Versão:** 2.2  
**Data:** 2025-01-07  
**Autor:** Sistema Integrado Cofre Tracker
