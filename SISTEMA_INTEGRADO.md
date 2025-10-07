# 📱 Sistema Integrado: Inventário + Estoque

## 🎯 **Visão Geral**

Sistema completo de integração bidirecional entre **Inventory (Empréstimos)** e **Stock (Vendas)**, permitindo:

✅ **Cadastro Unificado** - Crie aparelhos em ambos sistemas simultaneamente  
✅ **Sincronização Automática** - Status atualizado em tempo real via triggers  
✅ **Migração de Dados** - Vincule automaticamente items existentes  
✅ **Dashboard de Integração** - Monitore taxa de sincronização e execute migrações  
✅ **Visão Unificada** - View `unified_inventory` combina dados de ambos sistemas

---

## 🏗️ **Arquitetura da Integração**

### **1. Camada de Dados**

#### **Tabelas Principais:**
- `inventory` - Sistema de empréstimos (cofre)
- `stock_items` - Sistema de vendas (estoque)
- **Vínculo:** Coluna `stock_item_id` em `inventory` referencia `stock_items.id`

#### **View Unificada:**
```sql
unified_inventory
-- Combina dados de inventory e stock_items
-- Mostra: IMEI, modelo, status de ambos sistemas, preço, localização
```

#### **Triggers de Sincronização:**
1. `sync_inventory_to_stock()` - Atualiza stock quando inventory muda
2. `sync_stock_to_inventory()` - Atualiza inventory quando stock muda

**Mapeamento de Status:**
| Inventory Status | Stock Status |
|------------------|--------------|
| `available`      | `disponivel` |
| `loaned`         | `reservado`  |
| `sold`           | `vendido`    |

---

### **2. Funções SQL (RPC)**

#### **`create_linked_item()`**
Cria item em ambos sistemas simultaneamente e os vincula.

```sql
SELECT create_linked_item(
  p_imei := '123456789012345',
  p_model := 'iPhone 14 Pro',
  p_brand := 'Apple',
  p_color := 'Space Black',
  p_storage := '256GB',
  p_condition := 'novo',
  p_battery_pct := 100,
  p_price := 5499.00,
  p_cost := 4200.00,
  p_location := 'estoque',
  p_notes := 'Item importado'
);
```

#### **`migrate_inventory_to_stock()`** ⭐ NOVO
Migra automaticamente todos items do inventory para stock_items.

```sql
SELECT migrate_inventory_to_stock();
-- Retorna: { migrated_count, failed_count, message }
```

#### **`get_integration_stats()`** ⭐ NOVO
Retorna estatísticas da integração.

```sql
SELECT get_integration_stats();
-- Retorna:
-- {
--   total_inventory: 150,
--   synced_items: 120,
--   unsynced_items: 30,
--   sync_rate: 80.00,
--   last_check: '2025-01-15T10:30:00Z'
-- }
```

---

## 📋 **Guia de Uso**

### **Opção 1: Cadastro Integrado (✅ Recomendado)**

#### **Onde encontrar:**
- **Admin > Aparelhos** → Botão "🔗 Cadastro Integrado"
- **Estoque > Dashboard** → Botão "🔗 Cadastro Integrado"

#### **Campos do Formulário:**
```
📦 Informações Básicas:
  - IMEI (obrigatório, 15 dígitos)
  - Modelo (obrigatório)
  - Marca (obrigatório, padrão: Apple)
  - Cor
  - Armazenamento
  - Condição (padrão: novo)
  - Bateria % (padrão: 100%)

💰 Informações de Estoque:
  - Preço de Venda
  - Custo de Aquisição
  - Localização (estoque, vitrine, etc)

📝 Notas:
  - Observações gerais
```

#### **O que acontece:**
1. ✅ Item criado em `stock_items`
2. ✅ Item criado em `inventory` com vínculo (`stock_item_id`)
3. ✅ Ambos sistemas sincronizados automaticamente
4. ✅ Log de auditoria criado

---

### **Opção 2: Cadastro Individual**

#### **Apenas Inventário (Empréstimos):**
Use quando o item é **apenas para empréstimo** (não será vendido).

**Admin > Aparelhos** → Botão "Adicionar Aparelho"

#### **Apenas Estoque (Vendas):**
Use quando o item é **apenas para venda** (não será emprestado).

**Estoque > Dashboard** → Botão "Adicionar Item"

---

### **Opção 3: Migração Automática de Dados Existentes** ⭐ NOVO

Para vincular automaticamente items já cadastrados no inventory ao stock:

#### **Via Interface:**
1. Acesse **Estoque > Dashboard**
2. Vá para aba **"Integração"**
3. Clique em **"Sincronizar Agora"**
4. Aguarde a conclusão (mostra progresso)

#### **Via SQL (avançado):**
```sql
SELECT migrate_inventory_to_stock();
```

**Resultado:**
```json
{
  "success": true,
  "migrated_count": 95,
  "failed_count": 0,
  "message": "Migração concluída: 95 itens vinculados, 0 falharam"
}
```

---

## 🔄 **Sincronização Automática**

### **Cenário 1: Empréstimo de Item**
```
Ação: Emprestar aparelho (inventory status → loaned)
Trigger: sync_inventory_to_stock()
Resultado: stock_items.status → reservado
```

### **Cenário 2: Venda de Item no Estoque**
```
Ação: Vender item (stock status → vendido)
Trigger: sync_stock_to_inventory()
Resultado: inventory.status → sold
Bloqueio: Não pode mais ser emprestado
```

### **Cenário 3: Retorno de Empréstimo**
```
Ação: Devolver aparelho (inventory status → available)
Trigger: sync_inventory_to_stock()
Resultado: stock_items.status → disponivel
```

---

## 📊 **Dashboard de Integração** ⭐ NOVO

### **Localização:**
**Estoque > Dashboard > Aba "Integração"**

### **Funcionalidades:**

#### **1. Taxa de Sincronização**
- Barra de progresso visual
- Percentual de items vinculados
- Badge de status (100% = verde, <100% = laranja)

#### **2. Cards Estatísticos**
- **Total no Inventário:** Total de items no sistema de empréstimos
- **Sincronizados:** Items com vínculo bidirecional ativo
- **Não Sincronizados:** Items que precisam de vinculação

#### **3. Ação de Migração**
- Botão "Sincronizar Agora" aparece se há items não sincronizados
- Mostra quantos items serão processados
- Feedback em tempo real durante migração
- Atualiza estatísticas automaticamente após conclusão

#### **4. Status Visual**
- ✅ Verde: Sistema 100% integrado
- ⚠️ Laranja: Integração parcial, migração disponível
- Última verificação com timestamp

---

## 🎨 **Componentes da Interface**

### **1. UnifiedDeviceDialog**
Modal para cadastro integrado.

**Props:**
```typescript
interface UnifiedDeviceDialogProps {
  onDeviceAdded?: () => void;
}
```

### **2. UnifiedItemSelector** ⭐ NOVO
Seletor de items da view unificada.

**Props:**
```typescript
interface UnifiedItemSelectorProps {
  onSelect: (item: UnifiedItem) => void;
  selectedId?: string;
}
```

**Features:**
- 🔍 Busca por IMEI, modelo, marca
- 📊 Mostra informações completas (preço, localização, bateria)
- 🏷️ Badge "Integrado" para items vinculados
- 📱 Layout responsivo com scroll

### **3. IntegrationDashboard** ⭐ NOVO
Dashboard completo de integração.

**Uso:**
```tsx
import { IntegrationDashboard } from '@/components/IntegrationDashboard';

<IntegrationDashboard />
```

---

## 🛡️ **Segurança**

### **RLS (Row-Level Security):**
- ✅ Triggers com `SECURITY DEFINER`
- ✅ Validações de role (admin/manager apenas)
- ✅ Logs de auditoria para todas operações
- ✅ Acesso baseado em `auth.uid()`

### **Funções Privilegiadas:**
```sql
create_linked_item() -- Requer admin/manager
migrate_inventory_to_stock() -- Requer autenticação
get_integration_stats() -- Requer autenticação
```

---

## 📈 **Estatísticas no Dashboard**

### **Card "Sincronizados":**
Mostra items com vínculo ativo:
```typescript
stats.synced_with_inventory
// Aparece no Dashboard de Estoque
```

### **Coluna "Sinc." (Admin > Aparelhos):** ⭐ NOVO
Mostra status de sincronização de cada item:
- ✓ **Vinculado** (badge verde) - Item integrado
- **Não vinculado** (badge cinza) - Item apenas no inventory

---

## 🔍 **View Unificada (`unified_inventory`)**

### **Colunas Disponíveis:**
```sql
SELECT
  inventory_id,      -- UUID do inventory
  stock_id,          -- UUID do stock_items (pode ser NULL)
  imei,
  model,
  brand,
  color,
  storage,
  condition,
  battery_pct,
  inventory_status,  -- available, loaned, sold
  stock_status,      -- disponivel, reservado, vendido (NULL se não vinculado)
  price,             -- do stock_items
  cost,              -- do stock_items
  location,          -- do stock_items
  notes,
  inventory_created_at,
  stock_created_at,
  inventory_updated_at,
  stock_updated_at,
  source            -- 'inventory', 'stock', ou 'integrated'
FROM unified_inventory;
```

### **Exemplo de Query:**
```sql
-- Items disponíveis com preço
SELECT * FROM unified_inventory
WHERE inventory_status = 'available'
  AND stock_status = 'disponivel'
  AND price IS NOT NULL
ORDER BY price DESC;

-- Items não sincronizados
SELECT * FROM unified_inventory
WHERE stock_id IS NULL;

-- Items integrados em empréstimo
SELECT * FROM unified_inventory
WHERE inventory_status = 'loaned'
  AND stock_status = 'reservado';
```

---

## ❓ **FAQ**

### **P: O que acontece se eu deletar um item do stock?**
R: A coluna `stock_item_id` no inventory será setada para NULL automaticamente (ON DELETE SET NULL).

### **P: Posso desvincular items manualmente?**
R: Sim, via SQL:
```sql
UPDATE inventory
SET stock_item_id = NULL
WHERE id = '<uuid>';
```

### **P: Como identificar items vinculados?**
R: 
1. Via Interface: Coluna "Sinc." em Admin > Aparelhos
2. Via SQL: `stock_item_id IS NOT NULL` em inventory
3. Via View: `stock_id IS NOT NULL` em unified_inventory

### **P: A migração automática sobrescreve dados?**
R: Não! A função `migrate_inventory_to_stock()` apenas processa items com `stock_item_id = NULL`, preservando vínculos existentes.

### **P: Posso reverter uma migração?**
R: Sim, deletando os items criados no stock ou setando `stock_item_id = NULL` no inventory.

### **P: Como funciona a importação CSV?**
R: Importações via CSV criam items apenas no inventory. Use "Sincronizar Agora" após importar para vincular ao stock.

---

## 🚀 **Próximos Passos**

1. ✅ **Teste o Cadastro Integrado:**
   - Vá em Admin > Aparelhos
   - Clique em "🔗 Cadastro Integrado"
   - Cadastre um iPhone de teste

2. ✅ **Execute a Migração:**
   - Vá em Estoque > Dashboard > Integração
   - Clique em "Sincronizar Agora"
   - Aguarde a conclusão

3. ✅ **Teste a Sincronização:**
   - Faça um empréstimo de um item sincronizado
   - Verifique o status no Estoque
   - Retorne o item e veja a atualização

4. ✅ **Monitore a Integração:**
   - Acesse regularmente o Dashboard de Integração
   - Mantenha 100% de sincronização
   - Analise estatísticas para tomar decisões

---

## 🎉 **Resumo Rápido**

| Sistema | Propósito | Status Principal | Sincronização |
|---------|-----------|-----------------|---------------|
| **Inventory** | Empréstimos (Cofre) | available, loaned, sold | Automática ✅ |
| **Stock** | Vendas (Estoque) | disponivel, reservado, vendido | Automática ✅ |
| **Integrado** | Ambos | Bidirecional | Tempo Real ✅ |

---

## 📝 **Checklist de Implementação**

- [x] Migração SQL com triggers e view
- [x] Função `create_linked_item()`
- [x] Função `migrate_inventory_to_stock()`
- [x] Função `get_integration_stats()`
- [x] Hook `useUnifiedInventory`
- [x] Componente `UnifiedDeviceDialog`
- [x] Componente `UnifiedItemSelector`
- [x] Componente `IntegrationDashboard`
- [x] Aba "Integração" no StockDashboard
- [x] Coluna "Sinc." no AdminDevicesTab
- [x] Cache unificado nos hooks
- [x] Correção StockService.ts
- [x] Documentação completa

---

**Sistema 100% Integrado e Operacional! 🎉**