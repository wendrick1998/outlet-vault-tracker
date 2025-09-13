/**
 * Script para testar especificamente o sistema de PIN no fluxo de devolução/venda
 */

console.log('🔄 TESTE DO SISTEMA PIN - FLUXO DE DEVOLUÇÃO/VENDA');
console.log('==================================================');

async function testInflowPinFlow() {
  try {
    // Teste 1: Verificar autenticação
    console.log('\n1. Verificando autenticação...');
    if (!window.supabase) {
      console.error('❌ Supabase não está disponível');
      return;
    }

    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Usuário não está autenticado:', authError);
      return;
    }
    console.log('✅ Usuário autenticado:', user.email);

    // Teste 2: Verificar profile e PIN
    console.log('\n2. Verificando profile e PIN...');
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      return;
    }

    console.log('✅ Profile encontrado:', {
      role: profile.role,
      can_withdraw: profile.can_withdraw,
      has_pin: !!profile.operation_pin_hash,
      email: profile.email
    });

    // Teste 3: Verificar se há PIN configurado via função
    console.log('\n3. Testando função hasPinConfigured...');
    try {
      const { data: hasPinData, error: pinCheckError } = await window.supabase.rpc('validate_operation_pin', {
        user_id: user.id,
        pin: '0000' // PIN falso para testar se função existe
      });
      
      if (pinCheckError && pinCheckError.code === '42883') {
        console.error('❌ Função validate_operation_pin não existe');
      } else if (pinCheckError && pinCheckError.message.includes('PIN não configurado')) {
        console.log('⚠️ PIN não está configurado para o usuário');
      } else {
        console.log('✅ Função validate_operation_pin existe e pode ser chamada');
      }
    } catch (error) {
      console.error('❌ Erro ao testar função de PIN:', error);
    }

    // Teste 4: Verificar permissões de retirada
    console.log('\n4. Verificando permissões...');
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

    // Teste 5: Buscar itens emprestados para teste
    console.log('\n5. Buscando itens emprestados...');
    try {
      const { data: loans, error: loansError } = await window.supabase
        .from('loans')
        .select(`
          *,
          inventory(*),
          customer:customers(*),
          seller:sellers(*),
          reason:reasons(*)
        `)
        .eq('status', 'active')
        .limit(3);

      if (loansError) {
        console.error('❌ Erro ao buscar empréstimos:', loansError);
      } else {
        console.log('✅ Empréstimos ativos encontrados:', loans?.length || 0);
        if (loans && loans.length > 0) {
          console.log('Primeiro empréstimo:', {
            id: loans[0].id,
            item_imei: loans[0].inventory?.imei,
            customer: loans[0].customer?.name,
            created_at: loans[0].created_at
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar empréstimos:', error);
    }

    // Teste 6: Verificar função de validação de PIN diretamente
    console.log('\n6. Testando validação de PIN diretamente...');
    if (profile.operation_pin_hash) {
      console.log('✅ Usuário tem PIN configurado - pode testar validação');
      console.log('💡 Para testar a validação, digite no console:');
      console.log('window.supabase.rpc("validate_operation_pin", { user_id: "' + user.id + '", pin: "SEU_PIN_AQUI" })');
    } else {
      console.log('⚠️ Usuário não tem PIN configurado');
      console.log('💡 Para configurar PIN, acesse o perfil do usuário');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }

  console.log('\n==================================================');
  console.log('🏁 TESTE FINALIZADO');
  console.log('==================================================');
}

// Executar teste
if (typeof window !== 'undefined') {
  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testInflowPinFlow, 1000);
    });
  } else {
    setTimeout(testInflowPinFlow, 1000);
  }
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testInflowPinFlow };
}