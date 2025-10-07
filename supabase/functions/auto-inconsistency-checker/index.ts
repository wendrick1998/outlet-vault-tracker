import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InconsistencyRow {
  loan_id: string;
  loan_status: string;
  inventory_id: string;
  inventory_status: string;
  imei: string;
  issue_description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Auto Inconsistency Checker - Starting hourly check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar inconsistências ativas
    const { data: inconsistencies, error: inconsistenciesError } = await supabase
      .from('loan_inventory_inconsistencies')
      .select('*');

    if (inconsistenciesError) {
      console.error('❌ Error fetching inconsistencies:', inconsistenciesError);
      throw inconsistenciesError;
    }

    const inconsistencyCount = inconsistencies?.length || 0;
    console.log(`📊 Found ${inconsistencyCount} active inconsistencies`);

    // 2. Tentar correção automática (apenas casos simples)
    let autoFixedCount = 0;
    if (inconsistencies && inconsistencies.length > 0) {
      for (const inc of inconsistencies as InconsistencyRow[]) {
        try {
          // Apenas corrigir casos onde loan está returned mas inventory está loaned
          if (inc.loan_status === 'returned' && inc.inventory_status === 'loaned') {
            const { error: updateError } = await supabase
              .from('inventory')
              .update({ status: 'available', updated_at: new Date().toISOString() })
              .eq('id', inc.inventory_id);

            if (!updateError) {
              autoFixedCount++;
              console.log(`✅ Auto-fixed inconsistency for IMEI ${inc.imei}`);
              
              // Log correção
              await supabase.rpc('log_audit_event', {
                p_action: 'auto_inconsistency_fixed',
                p_details: {
                  loan_id: inc.loan_id,
                  inventory_id: inc.inventory_id,
                  imei: inc.imei,
                  previous_status: inc.inventory_status,
                  new_status: 'available'
                }
              });
            }
          }
        } catch (fixError) {
          console.error(`⚠️ Could not auto-fix inconsistency for ${inc.imei}:`, fixError);
        }
      }
    }

    // 3. Enviar alerta para admins se > 5 inconsistências
    if (inconsistencyCount > 5 && resendApiKey) {
      console.log('⚠️ Critical threshold exceeded, sending alert email...');

      // Buscar emails dos admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        const resend = new Resend(resendApiKey);
        const adminEmails = admins.map(a => a.email);

        const emailHtml = `
          <h2>🚨 Alerta de Inconsistências Críticas</h2>
          <p><strong>${inconsistencyCount} inconsistências ativas</strong> foram detectadas no sistema.</p>
          
          <h3>Resumo:</h3>
          <ul>
            <li>Total de inconsistências: <strong>${inconsistencyCount}</strong></li>
            <li>Correções automáticas: <strong>${autoFixedCount}</strong></li>
            <li>Pendentes de revisão: <strong>${inconsistencyCount - autoFixedCount}</strong></li>
          </ul>

          <h3>Principais Problemas:</h3>
          <ul>
            ${inconsistencies?.slice(0, 5).map(inc => `
              <li>
                <strong>IMEI:</strong> ${(inc as InconsistencyRow).imei}<br>
                <strong>Problema:</strong> ${(inc as InconsistencyRow).issue_description}
              </li>
            `).join('')}
          </ul>

          <p>
            <a href="${supabaseUrl.replace('https://', 'https://id-preview--')}.lovable.app/admin/audits" 
               style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Revisar Inconsistências
            </a>
          </p>

          <p style="color: #666; font-size: 12px;">
            Este é um alerta automático enviado pelo sistema de auditoria.
          </p>
        `;

        try {
          await resend.emails.send({
            from: 'Sistema de Auditoria <onboarding@resend.dev>',
            to: adminEmails,
            subject: `🚨 ${inconsistencyCount} Inconsistências Críticas Detectadas`,
            html: emailHtml,
          });
          console.log('✅ Alert email sent to admins');
        } catch (emailError) {
          console.error('❌ Failed to send alert email:', emailError);
        }
      }
    }

    // 4. Registrar execução no audit log
    await supabase.rpc('log_audit_event', {
      p_action: 'auto_inconsistency_check_completed',
      p_details: {
        inconsistencies_found: inconsistencyCount,
        auto_fixed: autoFixedCount,
        alert_sent: inconsistencyCount > 5,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Auto Inconsistency Checker completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        inconsistencies_found: inconsistencyCount,
        auto_fixed: autoFixedCount,
        alert_sent: inconsistencyCount > 5,
        message: `Check completed: ${inconsistencyCount} inconsistencies found, ${autoFixedCount} auto-fixed`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Auto Inconsistency Checker failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
