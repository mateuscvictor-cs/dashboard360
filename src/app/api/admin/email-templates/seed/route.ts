import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

const defaultTemplates = [
  {
    type: "NOTIFICATION" as const,
    name: "Notificação Geral",
    subject: "{{title}}",
    variables: ["title", "message", "link", "recipientName", "appUrl"],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Dashboard 360</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Olá{{recipientName}},</p>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">{{title}}</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">{{message}}</p>
              {{#if link}}
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                    <a href="{{appUrl}}{{link}}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Ver Detalhes</a>
                  </td>
                </tr>
              </table>
              {{/if}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 12px;">
                <a href="{{appUrl}}/cliente/configuracoes" style="color: #6366f1; text-decoration: none;">Gerenciar preferências</a>
                <span style="margin: 0 8px;">•</span>
                <a href="{{appUrl}}/cliente/notificacoes" style="color: #6366f1; text-decoration: none;">Ver todas notificações</a>
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">© 2024 Vanguardia. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    type: "INVITE" as const,
    name: "Convite de Acesso",
    subject: "Você foi convidado para o Dashboard 360",
    variables: ["recipientName", "inviterName", "companyName", "inviteLink", "appUrl"],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Bem-vindo ao Dashboard 360</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Olá{{recipientName}},</p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                {{inviterName}} convidou você para acessar o painel da <strong>{{companyName}}</strong>.
              </p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para criar sua conta e começar a acompanhar suas entregas.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                    <a href="{{inviteLink}}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Aceitar Convite</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #71717a; font-size: 12px;">Este convite expira em 7 dias.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">© 2024 Vanguardia. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    type: "WELCOME" as const,
    name: "Boas-vindas",
    subject: "Bem-vindo ao Dashboard 360!",
    variables: ["recipientName", "companyName", "appUrl"],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎉 Bem-vindo!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Olá {{recipientName}},</p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Sua conta foi criada com sucesso! Você agora faz parte da <strong>{{companyName}}</strong> no Dashboard 360.
              </p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Acesse seu painel para acompanhar entregas, reuniões e muito mais.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px;">
                    <a href="{{appUrl}}/cliente/dashboard" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Acessar Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">© 2024 Vanguardia. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    type: "DELIVERY_COMPLETED" as const,
    name: "Entrega Concluída",
    subject: "Entrega concluída: {{deliveryTitle}}",
    variables: ["recipientName", "deliveryTitle", "deliveryDescription", "appUrl", "deliveryId"],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ Entrega Concluída</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Olá {{recipientName}},</p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                A entrega <strong>{{deliveryTitle}}</strong> foi concluída com sucesso!
              </p>
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #3f3f46; font-size: 14px;">{{deliveryDescription}}</p>
              </div>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Acesse o painel para ver os detalhes e fornecer seu feedback.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px;">
                    <a href="{{appUrl}}/cliente/entregas/{{deliveryId}}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Ver Entrega</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">© 2024 Vanguardia. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    type: "DEPENDENCY_REMINDER" as const,
    name: "Lembrete de Pendência",
    subject: "Ação necessária: {{dependencyTitle}}",
    variables: ["recipientName", "dependencyTitle", "deliveryTitle", "dueDate", "appUrl", "deliveryId"],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">⚠️ Pendência Aguardando</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Olá {{recipientName}},</p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Há uma pendência aguardando sua ação para a entrega <strong>{{deliveryTitle}}</strong>.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #92400e; font-weight: 600;">{{dependencyTitle}}</p>
                <p style="margin: 0; color: #a16207; font-size: 14px;">Prazo: {{dueDate}}</p>
              </div>
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px;">
                    <a href="{{appUrl}}/cliente/entregas/{{deliveryId}}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Resolver Pendência</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">© 2024 Vanguardia. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
];

export async function POST() {
  const session = await requireRole(["ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const results = [];

    for (const template of defaultTemplates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { type: template.type },
      });

      if (!existing) {
        const created = await prisma.emailTemplate.create({
          data: template,
        });
        results.push({ type: template.type, action: "created", id: created.id });
      } else {
        results.push({ type: template.type, action: "skipped", id: existing.id });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erro ao criar templates padrão:", error);
    return NextResponse.json({ error: "Erro ao criar templates" }, { status: 500 });
  }
}
