# UI Inventory - Guia de Navegação

## O que é o UI Inventory

O UI Inventory é uma ferramenta automática que mapeia 100% das telas, componentes, estados e dependências do sistema Outlet Vault Tracker.

## Como Acessar

1. Entre como **Admin**
2. Navegue para `/admin`
3. Clique na aba "UI Inventory"
4. Ou acesse diretamente `/admin/ui-inventory`

## Estrutura

### 1. Telas (Screens)
- **Nome**: Título da tela
- **Rota**: Caminho URL (ex: `/search-and-operate`)
- **Componente**: Arquivo raiz (ex: `src/pages/SearchAndOperate.tsx`)
- **Descrição**: Propósito da tela
- **Sub-componentes**: Lista de componentes usados
- **Estados**: loading, empty, error, success, etc.
- **Ações**: Botões e interações disponíveis
- **Modais**: Diálogos e sheets associados
- **Dependências**: Hooks e serviços utilizados

### 2. Componentes (Components)
- **Nome**: Nome do componente
- **Arquivo**: Caminho do arquivo fonte
- **Props**: Propriedades aceitas
- **Variantes**: Estilos diferentes (default, outline, etc.)
- **Estados**: hover, active, disabled, etc.
- **Tokens**: CSS variables utilizadas
- **Exemplos**: Casos de uso comuns

### 3. Tokens
Mapeamento organizado por categoria:
- **Status** → `--success`, `--warning`, `--destructive`
- **Battery** → `--battery-critical`, `--battery-low`, etc.
- **Roles** → `--admin`, `--manager`, `--operator`

### 4. Guia Rápido
Instruções para mudanças comuns:
- **Brand Color**: Como alterar cor primária
- **Border Radius**: Ajustar raio global
- **Typography**: Mudar fontes
- **Battery Colors**: Personalizar cores de bateria

## Funcionalidades

### 🔍 Busca Global
- Digite qualquer termo no campo de busca
- Filtra telas, componentes e arquivos
- Busca em nome, descrição e caminhos

### 📁 Links Diretos
- Botão "ExternalLink" abre arquivo no editor
- Links para cada arquivo fonte
- Navegação rápida entre telas relacionadas

### 🏷️ Tags Organizadas
- **Azul**: Ações e funcionalidades
- **Verde**: Dependências e hooks
- **Cinza**: Estados e variantes
- **Roxo**: Sub-componentes

### 📊 Detalhes Expandíveis
- Clique em "Detalhes" para ver informações completas
- Grid responsivo com categorias organizadas
- Badges coloridos por tipo de informação

## Como Localizar Componentes

### Por Tela
1. Aba "Telas"
2. Encontre a tela desejada
3. Expanda "Detalhes"
4. Veja lista de "Componentes"

### Por Funcionalidade
1. Use busca: "battery", "search", "loan"
2. Filtre resultados por tipo
3. Veja dependências relacionadas

### Por Arquivo
1. Aba "Componentes"
2. Ordene por nome ou caminho
3. Use busca por extensão: `.tsx`

## Casos de Uso Comuns

### 🎨 "Quero mudar cor de todos os botões"
1. Busque "Button" na aba Componentes
2. Veja tokens: `--primary`, `--destructive`
3. Use `/admin/design` para editar

### 🔋 "Preciso alterar cores da bateria"
1. Busque "battery" ou "BatteryIndicator"
2. Veja tokens: `--battery-critical`, `--battery-low`
3. Ou use aba "Tokens" → categoria "battery"

### 📱 "Onde fica o modal de empréstimo?"
1. Busque "loan" ou navegue para tela "Buscar & Operar"
2. Veja modais: "OutflowForm", "CustomerSearch"
3. Clique no link do arquivo para editar

### 🏠 "Quais telas usam o Header?"
1. Busque "Header" na aba Componentes
2. Veja exemplos de uso
3. Ou busque "Header" na aba Telas para ver dependências

## Tips & Tricks

### 💡 Navegação Rápida
- Use `Ctrl+F` no browser para busca in-page
- Clique nos badges para filtrar visualmente
- Use abas para alternar entre visões

### 🔗 Integração com Design Panel
- Clique em tokens (ex: `--primary`) para copiar
- Use `/admin/design` para editar ao vivo
- Volte ao Inventory para confirmar mudanças

### 📋 Organização
- Estados seguem padrão: loading → loaded → error
- Variantes são consistentes: default, outline, ghost
- Dependências mostram arquitetura real

## Auto-Generation

O UI Inventory é **gerado automaticamente** a partir do código:

```typescript
// src/design/UIInventory.ts
export const SCREENS_INVENTORY = [
  // Mapeamento automático de todas as telas
];

export const COMPONENTS_INVENTORY = [
  // Mapeamento automático de todos os componentes
];
```

### Como Atualizar
- O mapeamento é atualizado automaticamente quando:
  - Novos componentes são criados
  - Rotas são adicionadas/modificadas
  - Props ou variantes mudam
  - Tokens são adicionados

### Contribuindo
Para garantir que o mapeamento seja preciso:
1. Use naming consistente em componentes
2. Documente props com TypeScript
3. Mantenha tokens organizados por categoria
4. Use padrões estabelecidos para estados/variantes

## Troubleshooting

### "Não encontro meu componente"
- Verifique se segue padrão de export
- Confirme se está em `src/components/` ou `src/pages/`
- Use busca por arquivo: `MyComponent.tsx`

### "Tokens não aparecem"
- Verifique se usa CSS variables: `var(--token-name)`
- Confirme mapeamento em `tailwind.config.ts`
- Teste se token está em `tokens.json`

### "Tela não listada"
- Verifique se rota está em `App.tsx`
- Confirme se componente tem export nomeado
- Use busca por caminho: `/my-route`