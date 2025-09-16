/**
 * Script de debug para verificar fluxo completo do PIN
 */

console.log('🔧 DEBUG PIN FLOW - Verificação Completa');
console.log('=====================================');

async function debugPinFlow() {
  // Simular click em devolução para ver logs
  console.log('\n🎯 Aguardando logs do sistema PIN...');
  console.log('📌 Vá até uma devolução e observe os logs no console');
  console.log('📌 Os logs mostrarão:');
  console.log('   - 🔄 Verificação inicial do PIN');
  console.log('   - 🔍 Consulta ao banco de dados');
  console.log('   - 📋 Resultado da verificação');
  console.log('   - 🔐 Status do handleSubmit');
  console.log('   - ✅/❌ Se o modal de PIN abre');
  
  // Testar funções diretamente se disponível
  if (window.supabase) {
    console.log('\n🧪 Testando funções diretamente...');
    
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Testar hasPinConfigured
        const { data: profile } = await window.supabase
          .from('profiles')
          .select('operation_pin_hash, can_withdraw')
          .eq('id', user.id)
          .single();
          
        console.log('📊 Status atual do usuário:', {
          user_id: user.id,
          email: user.email,
          has_pin_hash: !!profile?.operation_pin_hash,
          can_withdraw: profile?.can_withdraw
        });
        
        if (!profile?.operation_pin_hash) {
          console.log('⚠️  PROBLEMA IDENTIFICADO: Usuário não tem PIN configurado!');
          console.log('💡 Solução: Configure um PIN no perfil do usuário');
        }
        
        if (!profile?.can_withdraw) {
          console.log('⚠️  PROBLEMA: Usuário não tem permissão can_withdraw!');
          console.log('💡 Solução: Ativar permissão can_withdraw no banco');
        }
      }
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  }
}

// Auto-executar
debugPinFlow();

// Disponibilizar globalmente
window.debugPinFlow = debugPinFlow;