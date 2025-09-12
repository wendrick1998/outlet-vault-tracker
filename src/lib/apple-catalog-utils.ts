/**
 * Apple Catalog Utilities
 * Normalização e matching para importação de estoque de modelos Apple
 */

// Storage normalization - converts text like "128G", "256GB", "1TB" to numeric GB
export function normalizeStorage(storageText: string): number | null {
  if (!storageText) return null;
  
  const text = storageText.toString().toLowerCase().trim();
  
  // Extract numeric value
  const numMatch = text.match(/(\d+)/);
  if (!numMatch) return null;
  
  const num = parseInt(numMatch[1]);
  if (isNaN(num)) return null;
  
  // Handle TB to GB conversion
  if (text.includes('tb')) {
    return num * 1024;
  }
  
  // Default to GB for any other unit (G, GB, gb)
  return num;
}

// Color normalization with comprehensive mapping for Apple products
export function normalizeAppleColor(colorText: string): string {
  if (!colorText) return colorText;
  
  const colorMap: { [key: string]: string } = {
    // iPhone 8/8 Plus/X/XS series
    'cinza espacial': 'Cinza-espacial',
    'space gray': 'Cinza-espacial',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'product red': '(PRODUCT)RED',
    'vermelho': '(PRODUCT)RED',
    'red': '(PRODUCT)RED',
    
    // iPhone XR colors
    'coral': 'Coral',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    
    // iPhone 11 series
    'verde meia noite': 'Verde-meia-noite',
    'verde meia-noite': 'Verde-meia-noite',
    'midnight green': 'Verde-meia-noite',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'verde': 'Verde',
    'green': 'Verde',
    
    // iPhone 12 series
    'azul pacifico': 'Azul-pacífico',
    'azul pacífico': 'Azul-pacífico',
    'pacific blue': 'Azul-pacífico',
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    
    // iPhone 13 series
    'meia noite': 'Meia-noite',
    'meia-noite': 'Meia-noite',
    'midnight': 'Meia-noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'azul sierra': 'Azul-sierra',
    'sierra blue': 'Azul-sierra',
    'verde alpino': 'Verde-alpino',
    'alpine green': 'Verde-alpino',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    
    // iPhone 14 series
    'preto espacial': 'Preto-espacial',
    'space black': 'Preto-espacial',
    'prata': 'Prateado', // Alias for Prateado
    'roxo profundo': 'Roxo-profundo',
    'deep purple': 'Roxo-profundo',
    
    // iPhone 15 series
    'titanio preto': 'Titânio preto',
    'black titanium': 'Titânio preto',
    'titanio branco': 'Titânio branco',
    'white titanium': 'Titânio branco',
    'titanio azul': 'Titânio azul',
    'blue titanium': 'Titânio azul',
    'titanio natural': 'Titânio natural',
    'natural titanium': 'Titânio natural',
    
    // iPhone 16 series
    'ultramarino': 'Ultramarino',
    'ultramarine': 'Ultramarino',
    'verde acinzentado': 'Verde-acinzentado',
    'teal': 'Verde-acinzentado',
    'titanio deserto': 'Titânio-deserto',
    'desert titanium': 'Titânio-deserto',
    
    // iPhone 17 series (future)
    'branco acinzentado': 'Branco-acinzentado',
    'azul claro': 'Azul-claro',
    'verde claro': 'Verde-claro',
    'dourado claro': 'Dourado-claro',
    'titanio galatico': 'Titânio-galático',
    'cinza anelar': 'Cinza-anelar',
    'laranja cosmico': 'Laranja-cósmico',
    'azul intenso': 'Azul-intenso',
    
    // Common variations
    'branco': 'Branco',
    'white': 'Branco',
    'preto': 'Preto',
    'black': 'Preto',
    'azul': 'Azul',
    'blue': 'Azul'
  };
  
  const normalized = colorText.toLowerCase().trim();
  return colorMap[normalized] || colorText;
}

// Model name normalization for consistent matching
export function normalizeAppleModel(modelText: string): string {
  if (!modelText) return modelText;
  
  const modelMap: { [key: string]: string } = {
    'iphone se 2': 'iPhone SE (2ª geração)',
    'iphone se 2nd': 'iPhone SE (2ª geração)',
    'iphone se 2nd gen': 'iPhone SE (2ª geração)',
    'iphone se 3': 'iPhone SE (3ª geração)',
    'iphone se 3rd': 'iPhone SE (3ª geração)',
    'iphone se 3rd gen': 'iPhone SE (3ª geração)',
    'iphone 11 pro max': 'iPhone 11 Pro Max',
    'iphone 12 pro max': 'iPhone 12 Pro Max',
    'iphone 13 pro max': 'iPhone 13 Pro Max',
    'iphone 14 pro max': 'iPhone 14 Pro Max',
    'iphone 15 pro max': 'iPhone 15 Pro Max',
    'iphone 16 pro max': 'iPhone 16 Pro Max',
    'iphone 17 pro max': 'iPhone 17 Pro Max',
    'iphone air': 'iPhone Air'
  };
  
  const normalized = modelText.toLowerCase().trim();
  return modelMap[normalized] || modelText;
}

// Comprehensive Apple model matching from import text
export function matchAppleModel(inputText: string): {
  brand: string;
  model: string;
  storage?: number;
  color?: string;
  confidence: number;
} | null {
  if (!inputText) return null;
  
  const input = inputText.toLowerCase().trim();
  
  // Apple models catalog for matching
  const appleModels = [
    'iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone SE (2ª geração)',
    'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone SE (3ª geração)',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
    'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
  ];
  
  let bestMatch = null;
  let highestConfidence = 0;
  
  for (const model of appleModels) {
    const modelLower = model.toLowerCase();
    
    // Direct substring match
    if (input.includes(modelLower)) {
      const confidence = 0.9;
      
      if (confidence > highestConfidence) {
        // Extract storage
        const storageMatch = input.match(/(\d+)\s*(g|gb|tb)/i);
        const storage = storageMatch ? normalizeStorage(storageMatch[0]) : undefined;
        
        // Extract color (try to find color words in the input)
        let color: string | undefined;
        const colorWords = input.split(/\s+/);
        for (const word of colorWords) {
          const normalizedColor = normalizeAppleColor(word);
          if (normalizedColor !== word) {
            color = normalizedColor;
            break;
          }
        }
        
        bestMatch = {
          brand: 'Apple',
          model: model,
          storage,
          color,
          confidence
        };
        highestConfidence = confidence;
      }
    }
  }
  
  // Try partial matching for complex names
  if (!bestMatch) {
    for (const model of appleModels) {
      const modelParts = model.toLowerCase().split(' ');
      let matchCount = 0;
      
      for (const part of modelParts) {
        if (input.includes(part)) {
          matchCount++;
        }
      }
      
      const confidence = matchCount / modelParts.length;
      
      if (confidence >= 0.6 && confidence > highestConfidence) {
        const storageMatch = input.match(/(\d+)\s*(g|gb|tb)/i);
        const storage = storageMatch ? normalizeStorage(storageMatch[0]) : undefined;
        
        bestMatch = {
          brand: 'Apple',
          model: model,
          storage,
          color: undefined,
          confidence
        };
        highestConfidence = confidence;
      }
    }
  }
  
  return bestMatch;
}

// Generate search suggestions for user input
export function generateAppleModelSuggestions(inputText: string, limit: number = 5): string[] {
  if (!inputText || inputText.length < 2) return [];
  
  const input = inputText.toLowerCase();
  const suggestions: string[] = [];
  
  const appleModels = [
    'iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone SE (2ª geração)',
    'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone SE (3ª geração)',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
    'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
  ];
  
  // First, exact substring matches
  for (const model of appleModels) {
    if (model.toLowerCase().includes(input)) {
      suggestions.push(model);
      if (suggestions.length >= limit) break;
    }
  }
  
  // Then, partial word matches
  if (suggestions.length < limit) {
    for (const model of appleModels) {
      if (!suggestions.includes(model)) {
        const words = input.split(/\s+/);
        let hasMatch = false;
        
        for (const word of words) {
          if (word.length >= 2 && model.toLowerCase().includes(word)) {
            hasMatch = true;
            break;
          }
        }
        
        if (hasMatch) {
          suggestions.push(model);
          if (suggestions.length >= limit) break;
        }
      }
    }
  }
  
  return suggestions;
}

// Validate if an Apple model configuration is valid
export function validateAppleModelConfig(model: string, storage: number, color: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Model-specific storage and color validation would go here
  // This is a simplified version - you could expand with the full catalog
  
  if (!model || !model.includes('iPhone')) {
    errors.push('Modelo deve ser um iPhone válido');
  }
  
  if (storage && storage < 16) {
    errors.push('Capacidade de armazenamento muito baixa para iPhones modernos');
  }
  
  if (storage && storage > 2048) {
    errors.push('Capacidade de armazenamento muito alta');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}