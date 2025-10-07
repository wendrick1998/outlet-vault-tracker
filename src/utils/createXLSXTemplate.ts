import * as XLSX from 'xlsx';

export const createXLSXTemplate = () => {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Dados de exemplo com formatação
  const data = [
    ['MODELO DE IMPORTAÇÃO - COFRE TRACKER', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Preencha as colunas abaixo com os dados dos aparelhos:', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Título', 'IMEI 1', 'IMEI 2', 'Serial', '% Bateria', 'Observações'],
    ['iPhone 14 Pro Max 256GB Dourado Novo', '123456789012345', '', 'F2LLXXXXXXX', '100', 'Caixa lacrada'],
    ['iPhone 13 128GB Azul Seminovo', '234567890123456', '', 'F2LLXXXXXXY', '85', 'Pequeno risco na tela'],
    ['Samsung Galaxy S23 256GB Preto Usado', '345678901234567', '', 'R58XXXXXXXX', '78', 'Bateria original'],
    ['iPhone 15 Pro 512GB Preto Novo', '456789012345678', '', 'F2LLXXXXXXZ', '100', 'Nota fiscal incluída'],
    ['iPhone 12 64GB Branco Seminovo', '567890123456789', '', 'F2LLXXXXXXW', '90', 'Sem carregador'],
    ['', '', '', '', '', ''],
    ['INSTRUÇÕES:', '', '', '', '', ''],
    ['1. Título: Descrição completa do aparelho (Marca + Modelo + Armazenamento + Cor + Condição)', '', '', '', '', ''],
    ['2. IMEI 1: Número IMEI principal (15 dígitos)', '', '', '', '', ''],
    ['3. IMEI 2: Número IMEI secundário (opcional, para dual SIM)', '', '', '', '', ''],
    ['4. Serial: Número de série do aparelho', '', '', '', '', ''],
    ['5. % Bateria: Porcentagem de saúde da bateria (0-100)', '', '', '', '', ''],
    ['6. Observações: Notas adicionais sobre o aparelho', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['O sistema detecta automaticamente: Marca, Modelo, Armazenamento, Cor e Condição', '', '', '', '', ''],
  ];

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Definir larguras das colunas
  ws['!cols'] = [
    { wch: 45 }, // Título
    { wch: 18 }, // IMEI 1
    { wch: 18 }, // IMEI 2
    { wch: 15 }, // Serial
    { wch: 12 }, // % Bateria
    { wch: 30 }, // Observações
  ];

  // Definir alturas das linhas
  ws['!rows'] = [
    { hpt: 25 }, // Título principal
    { hpt: 5 },  // Espaço
    { hpt: 18 }, // Instrução
    { hpt: 5 },  // Espaço
    { hpt: 22 }, // Cabeçalhos
  ];

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Importação');

  // Gerar arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  return blob;
};

export const downloadXLSXTemplate = () => {
  const blob = createXLSXTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cofre-modelo-importacao.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};