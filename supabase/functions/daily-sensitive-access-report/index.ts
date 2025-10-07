import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Daily Sensitive Access Report - Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar dados dos últimos 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: sessions, error: sessionsError } = await supabase
      .from('sensitive_data_access_sessions')
      .select('*')
      .gte('created_at', yesterday.toISOString());

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    const { data: accessLogs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action', [
        'sensitive_customer_data_access',
        'customer_data_accessed',
        'limited_customer_data_access'
      ])
      .gte('created_at', yesterday.toISOString());

    if (logsError) {
      console.error('❌ Error fetching access logs:', logsError);
      throw logsError;
    }

    // 2. Calcular métricas
    const totalSessions = sessions?.length || 0;
    const activeSessions = sessions?.filter(s => 
      s.is_active && new Date(s.expires_at) > new Date()
    ).length || 0;
    const totalAccesses = accessLogs?.length || 0;

    // Campos mais acessados
    const fieldCounts: Record<string, number> = {};
    sessions?.forEach(session => {
      (session.approved_fields as string[])?.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });

    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Usuários mais ativos
    const userCounts: Record<string, number> = {};
    sessions?.forEach(session => {
      userCounts[session.user_id] = (userCounts[session.user_id] || 0) + 1;
    });

    const topUserIds = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Buscar nomes dos usuários
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', topUserIds.map(([id]) => id));

    const topUsers = topUserIds.map(([userId, count]) => {
      const user = users?.find(u => u.id === userId);
      return {
        name: user?.full_name || user?.email || 'Usuário Desconhecido',
        count
      };
    });

    // 3. Buscar emails dos admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (!admins || admins.length === 0) {
      console.log('⚠️ No admin emails found, skipping report');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to send report to' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Gerar e enviar relatório
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">📊 Relatório Diário de Acesso a Dados Sensíveis</h2>
        <p style="color: #666;">Período: Últimas 24 horas</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Resumo Executivo</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;"><strong>Total de Sessões:</strong></td>
              <td style="text-align: right;">${totalSessions}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Sessões Ativas:</strong></td>
              <td style="text-align: right;">${activeSessions}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total de Acessos:</strong></td>
              <td style="text-align: right;">${totalAccesses}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #1e40af;">🔍 Campos Mais Acessados</h3>
          <ol style="color: #666;">
            ${topFields.map(([field, count]) => `
              <li><strong>${field}</strong>: ${count} acesso(s)</li>
            `).join('')}
          </ol>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #1e40af;">👥 Usuários Mais Ativos</h3>
          <ol style="color: #666;">
            ${topUsers.map(user => `
              <li><strong>${user.name}</strong>: ${user.count} sessão(ões)</li>
            `).join('')}
          </ol>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Conformidade LGPD:</strong><br>
            Todos os acessos foram auditados e registrados conforme requisitos de privacidade.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${supabaseUrl.replace('https://', 'https://id-preview--')}.lovable.app/admin/sensitive-data-audit" 
             style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Detalhes Completos
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
          Este é um relatório automático enviado diariamente pelo sistema de auditoria.<br>
          Data: ${new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    `;

    const resend = new Resend(resendApiKey);
    const adminEmails = admins.map(a => a.email);

    await resend.emails.send({
      from: 'Sistema de Auditoria <onboarding@resend.dev>',
      to: adminEmails,
      subject: `📊 Relatório Diário - Acessos a Dados Sensíveis (${new Date().toLocaleDateString('pt-BR')})`,
      html: emailHtml,
    });

    // 5. Registrar execução no audit log
    await supabase.rpc('log_audit_event', {
      p_action: 'daily_sensitive_access_report_sent',
      p_details: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        total_accesses: totalAccesses,
        recipients: adminEmails.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Daily Sensitive Access Report sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          total_sessions: totalSessions,
          active_sessions: activeSessions,
          total_accesses: totalAccesses,
          recipients_count: adminEmails.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Daily Sensitive Access Report failed:', error);
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
