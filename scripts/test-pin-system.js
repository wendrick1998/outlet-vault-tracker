/**
 * Script para testar o sistema de PIN completo
 */

console.log('🔐 TESTE COMPLETO DO SISTEMA DE PIN');
console.log('====================================');

// Teste 1: Verificar se usuário está logado
console.log('\n1. Verificando autenticação...');
const user = window.supabase?.auth?.getUser ? await window.supabase.auth.getUser() : null;
if (!user?.data?.user) {
  console.error('❌ Usuário não está logado');
  return;
}
console.log('✅ Usuário autenticado:', user.data.user.email);

// Teste 2: Verificar profile e permissões
console.log('\n2. Verificando profile...');
const { data: profile, error: profileError } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', user.data.user.id)
  .single();

if (profileError) {
  console.error('❌ Erro ao buscar profile:', profileError);
  return;
}
console.log('✅ Profile encontrado:', {
  role: profile.role,
  can_withdraw: profile.can_withdraw,
  has_pin: !!profile.operation_pin_hash
});

// Teste 3: Testar função validate_operation_pin
console.log('\n3. Testando função validate_operation_pin...');
try {
  const { data: pinTest, error: pinError } = await window.supabase.rpc('validate_operation_pin', {
    user_id: user.data.user.id,
    pin: '1234' // PIN de teste
  });
  
  if (pinError) {
    console.error('❌ Erro na função validate_operation_pin:', pinError);
  } else {
    console.log('✅ Função validate_operation_pin funcionando:', pinTest);
  }
} catch (error) {
  console.error('❌ Erro ao chamar validate_operation_pin:', error);
}

// Teste 4: Verificar permissões
console.log('\n4. Testando permissões...');
try {
  const { data: hasPermission, error: permError } = await window.supabase.rpc('current_user_has_permission', {
    required_permission: 'movements.create'
  });
  
  if (permError) {
    console.error('❌ Erro ao verificar permissão:', permError);
  } else {
    console.log('✅ Permissão movements.create:', hasPermission);
  }
} catch (error) {
  console.error('❌ Erro ao verificar permissões:', error);
}

// Teste 5: Verificar inventory
console.log('\n5. Verificando inventory...');
try {
  const { data: inventory, error: invError } = await window.supabase
    .from('inventory')
    .select('id, imei, brand, model, status')
    .eq('is_archived', false)
    .limit(3);
  
  if (invError) {
    console.error('❌ Erro ao buscar inventory:', invError);
  } else {
    console.log('✅ Inventory acessível:', inventory.length, 'itens encontrados');
    if (inventory.length > 0) {
      console.log('Primeiro item:', inventory[0]);
    }
  }
} catch (error) {
  console.error('❌ Erro ao acessar inventory:', error);
}

console.log('\n====================================');
console.log('🏁 TESTE COMPLETO FINALIZADO');
console.log('====================================');