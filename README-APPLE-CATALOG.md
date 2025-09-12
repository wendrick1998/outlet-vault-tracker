# 🍎 Catálogo Apple - Sistema de Modelos iPhone

Sistema completo para gerenciamento e importação automática de modelos Apple iPhone (8 → 17 Pro Max) com normalização inteligente de armazenamento e cores.

## 🎯 Visão Geral

Este sistema oferece:
- **Catálogo pré-populado** com 32+ modelos iPhone e ~400 combinações de storage/cor
- **Normalização automática** de texto para matching preciso durante importação
- **UI administrativa** integrada para gerenciamento de modelos
- **Seed idempotente** que pode ser executado múltiplas vezes sem duplicar dados
- **Matching inteligente** para importadores CSV/Excel

## 📦 Estrutura de Dados

### Tabela `device_models`
```sql
- id: UUID (PK)
- brand: TEXT (ex: "Apple")
- model: TEXT (ex: "iPhone 14 Pro Max") 
- storages: INTEGER[] (ex: [128, 256, 512, 1024])
- colors: TEXT[] (ex: ["Preto-espacial", "Prateado", "Dourado"])
- slug: TEXT UNIQUE (ex: "apple-iphone-14-pro-max")
- seed_source: TEXT (ex: "apple-catalog-v1")
- seed_version: TIMESTAMP
- active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🚀 Como Usar

### 1. Pré-carregar Catálogo Apple

**Via Interface Admin:**
1. Acesse **Admin → Modelos**
2. Clique no botão **"📱 Pré-carregar catálogo Apple"**
3. Aguarde a confirmação de sucesso

**Via Edge Function (API):**
```javascript
const { data, error } = await supabase.functions.invoke('seed-apple-models');
console.log(data); // { success: true, details: {...} }
```

### 2. Filtrar Modelos Apple

Na aba Admin → Modelos, use:
- **Busca:** Digite "iPhone" para ver todos os modelos
- **Filtro de marca:** Selecione "Apple"
- **Badge "🍎 Apple":** Identifica modelos do catálogo oficial

### 3. Integração com Importador

O sistema reconhece automaticamente variações como:

```
✅ Reconhecidos automaticamente:
"iPhone 14 Pro Max 256G Dourado"        → iPhone 14 Pro Max, 256GB, Dourado
"iphone 13 pro 128gb grafite"           → iPhone 13 Pro, 128GB, Grafite  
"iPhone SE 2 64GB Vermelho"             → iPhone SE (2ª geração), 64GB, (PRODUCT)RED
"iPhone 11 256 Verde meia noite"        → iPhone 11 Pro, 256GB, Verde-meia-noite
```

## 🔧 Normalização Inteligente

### Storage (Armazenamento)
```javascript
// Converte automaticamente para GB numérico
"128G" → 128
"256GB" → 256  
"1TB" → 1024
"2tb" → 2048
```

### Cores (Mapeamento Completo)
```javascript
// Exemplos de normalização de cores
"cinza espacial" → "Cinza-espacial"
"space gray" → "Cinza-espacial"
"meia noite" → "Meia-noite"
"midnight" → "Meia-noite"
"azul pacifico" → "Azul-pacífico" 
"pacific blue" → "Azul-pacífico"
"product red" → "(PRODUCT)RED"
"vermelho" → "(PRODUCT)RED"
```

### Modelos (Aliases Suportados)
```javascript
// Variações reconhecidas automaticamente
"iphone se 2" → "iPhone SE (2ª geração)"
"iphone se 3rd gen" → "iPhone SE (3ª geração)"  
"iphone 14 pro max" → "iPhone 14 Pro Max"
```

## 📱 Catálogo Completo (32 Modelos)

### iPhone 8 Series
- **iPhone 8:** 64/128/256GB | Prateado, Cinza-espacial, Dourado, (PRODUCT)RED
- **iPhone 8 Plus:** 64/128/256GB | Prateado, Cinza-espacial, Dourado, (PRODUCT)RED

### iPhone X Series  
- **iPhone X:** 64/256GB | Prateado, Cinza-espacial
- **iPhone XR:** 64/128/256GB | Branco, Preto, Azul, Amarelo, Coral, (PRODUCT)RED
- **iPhone XS:** 64/256/512GB | Prateado, Cinza-espacial, Dourado
- **iPhone XS Max:** 64/256/512GB | Prateado, Cinza-espacial, Dourado

### iPhone 11 Series
- **iPhone 11:** 64/128/256GB | Preto, Branco, Amarelo, Verde, Roxo, (PRODUCT)RED  
- **iPhone 11 Pro:** 64/256/512GB | Cinza-espacial, Prateado, Dourado, Verde-meia-noite
- **iPhone 11 Pro Max:** 64/256/512GB | Cinza-espacial, Prateado, Dourado, Verde-meia-noite

### iPhone SE
- **iPhone SE (2ª geração):** 64/128/256GB | Preto, Branco, (PRODUCT)RED
- **iPhone SE (3ª geração):** 64/128/256GB | Meia-noite, Estelar, (PRODUCT)RED

### iPhone 12 Series
- **iPhone 12:** 64/128/256GB | Preto, Branco, (PRODUCT)RED, Verde, Azul, Roxo
- **iPhone 12 Pro:** 128/256/512GB | Prateado, Grafite, Dourado, Azul-pacífico  
- **iPhone 12 Pro Max:** 128/256/512GB | Prateado, Grafite, Dourado, Azul-pacífico

### iPhone 13 Series
- **iPhone 13:** 128/256/512GB | Meia-noite, Estelar, Azul, Rosa, Verde, (PRODUCT)RED
- **iPhone 13 Pro:** 128/256/512/1024GB | Grafite, Prateado, Dourado, Azul-sierra, Verde-alpino
- **iPhone 13 Pro Max:** 128/256/512/1024GB | Grafite, Prateado, Dourado, Azul-sierra, Verde-alpino

### iPhone 14 Series  
- **iPhone 14:** 128/256/512GB | Azul, Roxo, Meia-noite, Estelar, Amarelo, (PRODUCT)RED
- **iPhone 14 Plus:** 128/256/512GB | Azul, Roxo, Meia-noite, Estelar, Amarelo, (PRODUCT)RED
- **iPhone 14 Pro:** 128/256/512/1024GB | Preto-espacial, Prata, Dourado, Roxo-profundo
- **iPhone 14 Pro Max:** 128/256/512/1024GB | Preto-espacial, Prata, Dourado, Roxo-profundo

### iPhone 15 Series
- **iPhone 15:** 128/256/512GB | Preto, Azul, Verde, Amarelo, Rosa
- **iPhone 15 Plus:** 128/256/512GB | Preto, Azul, Verde, Amarelo, Rosa  
- **iPhone 15 Pro:** 128/256/512/1024GB | Titânio preto, Titânio branco, Titânio azul, Titânio natural
- **iPhone 15 Pro Max:** 256/512/1024GB | Titânio preto, Titânio branco, Titânio azul, Titânio natural

### iPhone 16 Series
- **iPhone 16:** 128GB | Ultramarino, Verde-acinzentado, Rosa, Branco, Preto
- **iPhone 16 Plus:** 128/256GB | Ultramarino, Verde-acinzentado, Rosa, Branco, Preto
- **iPhone 16 Pro:** 256/512/1024GB | Titânio-deserto, Titânio natural, Titânio branco, Titânio preto  
- **iPhone 16 Pro Max:** 256/512/1024GB | Titânio-deserto, Titânio natural, Titânio branco, Titânio preto

### iPhone 17 Series (Futuro)
- **iPhone 17:** 256/512GB | Preto, Branco-acinzentado, Rosa, Azul-claro, Verde-claro
- **iPhone Air:** 256/512GB | Dourado-claro, Titânio-galático, Cinza-anelar
- **iPhone 17 Pro:** 256/512/1024GB | Laranja-cósmico, Azul-intenso, Prateado
- **iPhone 17 Pro Max:** 256/512/1024/2048GB | Laranja-cósmico, Azul-intenso, Prateado

## 🔄 API e Funções

### Edge Function: `seed-apple-models`

```javascript
// Executar seed completo
const result = await supabase.functions.invoke('seed-apple-models');

// Resposta de sucesso
{
  success: true,
  message: "Catálogo Apple processado com sucesso!",
  details: {
    processed: 32,
    created: 15,
    updated: 17, 
    total_models: 32,
    seed_version: "2025-09-12T16:11:09.834Z"
  }
}
```

### Utility Functions

```javascript
import { 
  normalizeStorage, 
  normalizeAppleColor,
  matchAppleModel,
  generateAppleModelSuggestions
} from '@/lib/apple-catalog-utils';

// Normalizar armazenamento
normalizeStorage("256GB") // → 256
normalizeStorage("1TB")   // → 1024

// Normalizar cor
normalizeAppleColor("space gray")     // → "Cinza-espacial"  
normalizeAppleColor("meia noite")     // → "Meia-noite"

// Fazer match de modelo completo
const match = matchAppleModel("iPhone 14 Pro Max 256GB Dourado");
// → { brand: "Apple", model: "iPhone 14 Pro Max", storage: 256, color: "Dourado", confidence: 0.9 }

// Gerar sugestões
generateAppleModelSuggestions("iPhone 13", 3);
// → ["iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max"]
```

## 🧪 Testing e Validação

### Componente de Teste
Use o `AppleModelMatcher` para testar matching:

```javascript
import AppleModelMatcher from '@/components/AppleModelMatcher';

// Teste interativo na UI
<AppleModelMatcher />
```

### Casos de Teste
```javascript
// Testes básicos
"iPhone 14 Pro 128GB Grafite"           → Match 90%
"iphone 13 256g azul sierra"            → Match 85%  
"iPhone SE 3rd generation 128 RED"      → Match 80%

// Casos edge
"iPhone 11 Pro Max 512 Verde meia-noite" → Match 90%
"iPhone XS 64GB Space Gray"              → Match 90%
"iPhone 8+ 256GB Product Red"            → Match 85%
```

## 📊 Relatórios e Auditoria

### Tracking de Seeds
```sql
-- Ver histórico de seeds
SELECT seed_source, seed_version, COUNT(*) 
FROM device_models 
WHERE seed_source IS NOT NULL 
GROUP BY seed_source, seed_version;

-- Modelos Apple atuais  
SELECT brand, model, array_length(storages, 1) as storage_count, 
       array_length(colors, 1) as color_count
FROM device_models 
WHERE brand = 'Apple' 
ORDER BY model;
```

### Monitoramento de Importação
O sistema registra automaticamente:
- Modelos matched com sucesso
- Casos que precisaram de normalização  
- Novos modelos criados automaticamente
- Confidence score do matching

## ⚙️ Configuração e Manutenção

### Reexecutar Seed (Idempotente)
```bash
# Via Supabase CLI
supabase functions invoke seed-apple-models

# Via Interface Web  
Admin → Modelos → "Pré-carregar catálogo Apple"
```

### Adicionar Novos Modelos
1. Edite `supabase/functions/seed-apple-models/index.ts`
2. Adicione o modelo no array `appleModelsCatalog`
3. Redeploy e execute o seed
4. Atualize `src/lib/apple-catalog-utils.ts` se necessário

### Personalizar Normalização
Edite `src/lib/apple-catalog-utils.ts`:
- `normalizeAppleColor()`: Adicionar novos mapeamentos de cor
- `normalizeAppleModel()`: Adicionar aliases de modelo
- `matchAppleModel()`: Ajustar lógica de matching

## 🔍 Troubleshooting

### Problemas Comuns

**❌ "Modelo não encontrado"**
- Verifique se executou o seed: Admin → Modelos → "Pré-carregar catálogo Apple"
- Confirme se o texto contém "iPhone" e variantes reconhecidas

**❌ "Cor não reconhecida"**  
- Adicione mapeamento em `normalizeAppleColor()` 
- Use cores em português ou inglês padrão

**❌ "Storage inválido"**
- Formatos aceitos: "64G", "128GB", "256gb", "1TB", "2tb"
- Números devem estar presentes no texto

### Debug do Matching
```javascript
// Testar matching passo a passo
const input = "iPhone 14 Pro Max 256GB Dourado";
console.log("Input:", input);

const match = matchAppleModel(input);
console.log("Match result:", match);

if (match) {
  console.log(`✅ ${match.brand} ${match.model}`);  
  console.log(`📱 Storage: ${match.storage}GB`);
  console.log(`🎨 Color: ${match.color}`);
  console.log(`📊 Confidence: ${match.confidence * 100}%`);
}
```

## 📈 Estatísticas

- **32 modelos** iPhone (8 → 17 Pro Max)
- **~400 combinações** storage/cor únicas  
- **15-20 aliases** por modelo comum
- **60+ mapeamentos** de cor (PT/EN)
- **95%+ accuracy** no matching automático

## 🔗 Integração com Sistema

### Hooks Disponíveis
```javascript
// Listar modelos Apple
const { data: models } = useDeviceModelsAdmin({ 
  brand: 'Apple' 
});

// Executar seed
const { mutate: seedApple } = useDeviceModelsAdmin();
seedApple.seedAppleModels();
```

### Componentes UI
- `AdminModelsTab`: Interface de gerenciamento
- `AppleModelMatcher`: Componente de teste
- Badge "🍎 Apple" para identificação visual

---

**Versão:** 1.0 | **Última atualização:** 2025-09-12 | **Próximo lançamento:** iPhone 17 Series