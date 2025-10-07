# 🔗 Sistema Integrado: Inventário + Estoque

## ✅ Integração Concluída

Os sistemas de **Inventário** (empréstimos) e **Estoque** (vendas) agora estão integrados e sincronizados automaticamente!

---

## 📋 O Que Foi Implementado

### 1. **Banco de Dados**
- ✅ Coluna `stock_item_id` adicionada à tabela `inventory`
- ✅ Triggers de sincronização automática de status
- ✅ View unificada `unified_inventory` para consultas
- ✅ Função `create_linked_item()` para criação simultânea

### 2. **Sincronização Automática**
Quando você atualiza o status em qualquer sistema, o outro é atualizado automaticamente:

| **Ação no Inventário** | **Resultado no Estoque** |
|------------------------|--------------------------|
| `available` | `disponivel` |
| `loaned` | `reservado` |
| `sold` | `vendido` |

### 3. **Novo Botão: "Cadastro Integrado"**
Aparece em 3 lugares:
- ⚙️ **Admin → Aparelhos (Inventário)**: Botão azul "Cadastro Integrado"
- 📦 **Menu Stock**: Botão azul "Cadastro Integrado"
- 📱 **Configurações → Gerenciar Cadastros**: Botão azul "Cadastro Integrado"

---

## 🚀 Como Usar

### **Opção 1: Cadastro Integrado (RECOMENDADO)**

Use o botão **"Cadastro Integrado"** para criar um aparelho em **ambos os sistemas simultaneamente**:

1. Clique no botão "Cadastro Integrado" 🔗
2. Preencha os dados:
   - **Informações Básicas**: IMEI, Marca, Modelo, Cor, Armazenamento
   - **Informações de Estoque**: Localização, Custo, Preço de Venda
3. Clique em "Cadastrar em Ambos os Sistemas"

**Resultado:**
- ✅ Aparelho criado no **Estoque** (Stock)
- ✅ Aparelho vinculado criado no **Inventário** (Empréstimos)
- ✅ Status sincronizado automaticamente

---

### **Opção 2: Cadastro Individual**

Se você preferir cadastrar apenas em um sistema:

#### **A) Apenas Inventário (Empréstimos)**
Use o botão "Adicionar Aparelho" (ícone +)
- Para aparelhos que **não** serão vendidos
- Para aparelhos de teste/demonstração
- **Não** aparece no sistema de vendas

#### **B) Apenas Estoque (Vendas)**
Use o botão "Adicionar Item" no Stock
- Para aparelhos que **não** serão emprestados
- Controle completo de preços e localização
- **Não** aparece no sistema de empréstimos

---

## 🔄 Sincronização Automática

### Como Funciona?

1. **Empréstimo → Estoque**
   - Quando você empresta um aparelho vinculado
   - Status do inventário muda para `loaned`
   - Status do estoque muda automaticamente para `reservado`

2. **Venda → Inventário**
   - Quando você vende no estoque
   - Status do estoque muda para `vendido`
   - Status do inventário muda automaticamente para `sold`

3. **Devolução → Estoque**
   - Quando um empréstimo é devolvido
   - Status do inventário volta para `available`
   - Status do estoque volta para `disponivel`

---

## 📊 Estatísticas

### Card "Sincronizados"
No dashboard do Stock, você verá:
- **Sincronizados**: Quantidade de itens vinculados entre os sistemas
- Clique para ver apenas os itens integrados

---

## ⚙️ Onde Encontrar

### **1. Admin → Aparelhos**
Caminho: Configurações ⚙️ → "Gerenciar Cadastros" → Aba "Inventário"

**Botões disponíveis:**
- 📤 Importar CSV/XLSX
- 🔗 **Cadastro Integrado** (NOVO!)
- ➕ Adicionar Aparelho

### **2. Menu Stock**
Caminho: Menu Lateral → "Stock"

**Botões disponíveis:**
- 🔍 Scanner
- 🔗 **Cadastro Integrado** (NOVO!)
- ➕ Adicionar Item

---

## 🎯 Casos de Uso

### **Cenário 1: Novo iPhone para Venda e Empréstimo**
✅ Use **"Cadastro Integrado"**
- Cadastre com preço de custo/venda
- Defina localização (vitrine/estoque)
- Aparelho fica disponível para empréstimo E venda
- Status sempre sincronizado

### **Cenário 2: iPhone Apenas para Empréstimos**
✅ Use **"Adicionar Aparelho"** no Inventário
- Cadastro simples e rápido
- Não precisa preencher dados de venda
- Não aparece no sistema de estoque

### **Cenário 3: iPhone Apenas para Venda**
✅ Use **"Adicionar Item"** no Stock
- Controle financeiro completo
- Gestão de localização física
- Não aparece no sistema de empréstimos

### **Cenário 4: Importação em Massa**
✅ Use **"Importar CSV/XLSX"**
- Importa direto para o inventário
- Depois vincule manualmente se necessário
- Ou use a função SQL `create_linked_item()`

---

## 🛡️ Segurança

- ✅ RLS (Row Level Security) ativado em ambas as tabelas
- ✅ Triggers com `SECURITY DEFINER` para garantir integridade
- ✅ Auditoria automática de todas as operações
- ✅ Apenas admins e managers podem criar itens vinculados

---

## 🔧 Funções Avançadas (SQL)

### Criar Item Vinculado via SQL
```sql
SELECT create_linked_item(
  p_imei := '123456789012345',
  p_model := 'iPhone 15 Pro Max',
  p_brand := 'Apple',
  p_color := 'Azul Titânio',
  p_storage := '256GB',
  p_condition := 'novo',
  p_battery_pct := 100,
  p_price := 8999.00,
  p_cost := 7500.00,
  p_location := 'vitrine',
  p_notes := 'Aparelho novo na caixa'
);
```

### Consultar Inventário Unificado
```sql
SELECT * FROM unified_inventory
WHERE source = 'stock'
ORDER BY inventory_created_at DESC;
```

---

## 📝 Resumo Rápido

| **Sistema** | **Tabela** | **Para Que Serve** |
|------------|-----------|-------------------|
| Inventário | `inventory` | Controle de empréstimos |
| Estoque | `stock_items` | Controle de vendas |
| Integrado | Ambos | Aparelhos que podem ser emprestados E vendidos |

**Dica:** Use o **Cadastro Integrado** para 90% dos casos. É mais completo e mantém tudo sincronizado!

---

## ❓ FAQ

**P: Posso desvincular um item?**
R: Sim, defina `stock_item_id = NULL` no inventário.

**P: O que acontece se eu deletar no estoque?**
R: O vínculo é removido (`ON DELETE SET NULL`), mas o item permanece no inventário.

**P: Posso importar CSV direto como vinculado?**
R: Não ainda. Importe primeiro no inventário e depois crie no estoque manualmente.

**P: Como sei se um item está vinculado?**
R: No inventário, o campo `stock_item_id` estará preenchido. No dashboard do Stock, veja o card "Sincronizados".

---

## 🎉 Pronto!

Agora você pode cadastrar aparelhos de forma integrada e ter controle total sobre empréstimos e vendas com sincronização automática!

**Próximos passos sugeridos:**
1. Teste cadastrar um aparelho usando o "Cadastro Integrado"
2. Faça um empréstimo e veja o status mudar no estoque
3. Devolva o empréstimo e veja o status voltar
4. Verifique o card "Sincronizados" no dashboard do Stock

Para suporte ou dúvidas, consulte este guia ou acesse a documentação técnica do sistema.
