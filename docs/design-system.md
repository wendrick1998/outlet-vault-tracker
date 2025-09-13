# Sistema de Design - Outlet Vault Tracker

## Visão Geral

O Sistema de Design do Outlet Vault Tracker é baseado em **Design Tokens** e permite personalização completa da interface através de um painel administrativo integrado.

## Estrutura

### 1. Design Tokens (`src/design/tokens.json`)

Arquivo central com todos os tokens de design:

```json
{
  "colors": {
    "brand": { "500": "210 100% 50%" },
    "success": { "500": "142 76% 36%" },
    "warning": { "500": "38 92% 50%" },
    "destructive": { "500": "0 84% 60%" },
    "battery": {
      "critical": "0 84% 60%",
      "low": "38 92% 50%",
      "medium": "142 76% 36%",
      "high": "142 76% 36%"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "sans-serif"],
      "mono": ["Fira Code", "monospace"]
    }
  },
  "spacing": { "4": "1rem" },
  "borderRadius": "12px"
}
```

### 2. CSS Variables (`src/index.css`)

Os tokens são aplicados como CSS Variables:

```css
:root {
  --primary: 210 100% 50%;
  --success: 142 76% 36%;
  --battery-critical: 0 84% 60%;
  --radius: 0.75rem;
}

.dark {
  --primary: 210 40% 98%;
  /* ... outras variações para dark mode */
}
```

### 3. Tailwind Integration (`tailwind.config.ts`)

Tailwind consome as CSS Variables:

```ts
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary))",
      success: "hsl(var(--success))",
    },
    borderRadius: {
      lg: "var(--radius)",
    }
  }
}
```

## Como Usar

### 1. Painel de Design (Admin)

Acesse `/admin/design` para:
- ✅ Editar cores em tempo real com sliders HSL
- ✅ Ajustar border-radius e espaçamentos
- ✅ Preview ao vivo de todos os componentes
- ✅ Salvar/Carregar preferências
- ✅ Exportar/Importar tokens JSON

### 2. UI Inventory

Acesse `/admin/ui-inventory` para:
- ✅ Ver mapa completo de telas e componentes
- ✅ Localizar arquivos rapidamente
- ✅ Entender dependências e estados
- ✅ Identificar tokens usados por componente

### 3. UI Kit

Acesse `/admin/ui-kit` para:
- ✅ Catálogo interativo de componentes
- ✅ Exemplos de código copiáveis
- ✅ Preview de variantes e estados

## Mudanças Rápidas

### Mudar Cor Primária
1. Acesse `/admin/design`
2. Aba "Cores" → "Primary"
3. Ajuste sliders HSL
4. Clique "Salvar"

### Alterar Border Radius Global
1. Acesse `/admin/design`
2. Aba "Layout" → "Border Radius"
3. Mova slider
4. Clique "Salvar"

### Cores de Bateria
1. Acesse `/admin/design`
2. Aba "Cores" → seção "Cores de Estado da Bateria"
3. Ajuste cada faixa (Crítica, Baixa, Média, Alta)

## Boas Práticas

### ✅ Fazer
- Use sempre tokens: `bg-primary` em vez de `bg-blue-500`
- Teste em light/dark mode
- Verifique contraste WCAG AA
- Use preview antes de salvar

### ❌ Evitar
- Cores hardcoded: `text-blue-500`
- CSS inline: `style={{ color: '#0066ff' }}`
- Classes customizadas que não usam tokens

## Desenvolvimento

### Adicionando Novos Tokens

1. **tokens.json**: Adicione o token
```json
{
  "colors": {
    "info": { "500": "200 100% 50%" }
  }
}
```

2. **index.css**: Mapeie para CSS Variable
```css
:root {
  --info: 200 100% 50%;
}
```

3. **tailwind.config.ts**: Configure Tailwind
```ts
colors: {
  info: "hsl(var(--info))",
}
```

### Componentes que Usam Tokens

Todos os componentes devem usar apenas classes do Tailwind baseadas em tokens:

```tsx
// ✅ Correto
<Button className="bg-primary text-primary-foreground">

// ❌ Incorreto
<Button className="bg-blue-500 text-white">
```

## Estados e Variantes

### Button
- `default`: `bg-primary text-primary-foreground`
- `destructive`: `bg-destructive text-destructive-foreground`
- `outline`: `border-input bg-background`

### Battery Indicator
- `critical`: `text-destructive` (< 20%)
- `low`: `text-warning` (20-50%)
- `medium/high`: `text-success` (> 50%)

## Persistência

- **Local**: `localStorage` (imediato)
- **Servidor**: Perfil do usuário (sincronização)
- **Exportação**: Arquivo JSON para backup

## Acessibilidade

- Contraste mínimo WCAG AA (4.5:1)
- Foco visível em todos os elementos interativos
- Dark mode automático baseado em preferência do sistema
- Testes com leitores de tela

## Troubleshooting

### Tema não aplica
1. Verifique se `ThemeProvider` está wrappando a aplicação
2. Confirme que as CSS variables estão definidas
3. Force refresh (Ctrl+F5) para invalidar cache

### Cores não mudam
1. Verifique se o componente usa tokens corretos
2. Use inspetor para confirmar CSS variables
3. Teste em modo incógnito

### Performance
- Tokens são aplicados via CSS Variables (nativo do browser)
- Mudanças são instantâneas
- Preview não impacta performance de produção