import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@vanguardia.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vanguardia 360";
const APP_URL = process.env.AUTH_URL || "http://localhost:3000";

type InviteType = "COMPANY_ADMIN" | "COMPANY_MEMBER" | "MEMBER_ADMIN" | "MEMBER_CS";

function getInviteSubject(type: InviteType): string {
  switch (type) {
    case "COMPANY_ADMIN":
      return "Você foi convidado para acessar o Vanguardia 360";
    case "COMPANY_MEMBER":
      return "Você foi convidado para participar da sua empresa no Vanguardia 360";
    case "MEMBER_ADMIN":
      return "Convite para Admin - Vanguardia 360";
    case "MEMBER_CS":
      return "Convite para CS Owner - Vanguardia 360";
  }
}

function getInviteContent(
  type: InviteType,
  inviteUrl: string,
  companyName?: string
): string {
  const baseContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1f2937; margin-bottom: 16px;">Você foi convidado!</h2>
        ${type === "COMPANY_ADMIN" && companyName ? `<p style="color: #4b5563;">Você foi convidado para acessar o painel da empresa <strong>${companyName}</strong>.</p>` : ""}
        ${type === "COMPANY_MEMBER" && companyName ? `<p style="color: #4b5563;">Você foi convidado para participar da empresa <strong>${companyName}</strong> no Vanguardia 360. Acesso apenas à área de membro.</p>` : ""}
        ${type === "MEMBER_ADMIN" ? `<p style="color: #4b5563;">Você foi convidado para fazer parte da equipe administrativa do Vanguardia 360.</p>` : ""}
        ${type === "MEMBER_CS" ? `<p style="color: #4b5563;">Você foi convidado para fazer parte da equipe de Customer Success do Vanguardia 360.</p>` : ""}
        <p style="color: #4b5563;">Clique no botão abaixo para criar sua conta e começar a usar a plataforma.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Aceitar Convite
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">Este convite expira em 7 dias.</p>
        <p style="color: #9ca3af; font-size: 12px;">Se você não esperava este email, pode ignorá-lo.</p>
      </div>
    </div>
  `;
  return baseContent;
}

export const emailService = {
  async sendInvite(
    to: string,
    token: string,
    type: InviteType,
    companyName?: string
  ): Promise<boolean> {
    const inviteUrl = `${APP_URL}/convite?token=${token}`;

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Invite email for ${to}: ${inviteUrl}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = getInviteSubject(type);
      sendSmtpEmail.htmlContent = getInviteContent(type, inviteUrl, companyName);

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send invite email:", error);
      return false;
    }
  },

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Password reset email for ${to}: ${resetUrl}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = "Redefinir sua senha - Vanguardia 360";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Redefinir senha</h2>
            <p style="color: #4b5563;">Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #9ca3af; font-size: 12px;">Se você não solicitou esta redefinição, ignore este email.</p>
          </div>
        </div>
      `;

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  },

  async sendVerification(to: string, verifyUrl: string): Promise<boolean> {
    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Verification email for ${to}: ${verifyUrl}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = "Verifique seu email - Vanguardia 360";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Verifique seu email</h2>
            <p style="color: #4b5563;">Para completar seu cadastro, clique no botão abaixo para verificar seu endereço de email.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Verificar Email
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Se você não criou esta conta, pode ignorar este email.</p>
          </div>
        </div>
      `;

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return false;
    }
  },

  async sendMeetingInvite(data: {
    to: string;
    attendeeName: string;
    meetingTitle: string;
    meetingDate: Date;
    csOwnerName: string;
    confirmationLink: string;
  }): Promise<boolean> {
    const date = data.meetingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const time = data.meetingDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Meeting invite for ${data.to}: ${data.confirmationLink}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Confirme sua reunião: ${data.meetingTitle}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Você foi convidado para uma reunião!</h2>
            <p style="color: #4b5563;">Olá ${data.attendeeName},</p>
            <p style="color: #4b5563;">Você foi convidado para participar de uma reunião. Por favor, confirme sua presença clicando no botão abaixo.</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 8px 0;">${data.meetingTitle}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">📅 ${date}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">🕐 ${time}</p>
              <p style="color: #6b7280; margin: 0;">👤 ${data.csOwnerName}</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.confirmationLink}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Confirmar Reunião
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Ao clicar, você será redirecionado para confirmar os detalhes e finalizar o agendamento.</p>
          </div>
        </div>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send meeting invite:", error);
      return false;
    }
  },

  async sendMeetingConfirmation(data: {
    to: string;
    attendeeName: string;
    meetingTitle: string;
    meetingDate: Date;
    meetingUrl?: string;
    csOwnerName: string;
  }): Promise<boolean> {
    const date = data.meetingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const time = data.meetingDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Meeting confirmation for ${data.to}: ${data.meetingTitle}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Reunião confirmada: ${data.meetingTitle}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Reunião Confirmada!</h2>
            <p style="color: #4b5563;">Olá ${data.attendeeName},</p>
            <p style="color: #4b5563;">Sua reunião foi agendada com sucesso.</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 8px 0;">${data.meetingTitle}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">📅 ${date}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">🕐 ${time}</p>
              <p style="color: #6b7280; margin: 0;">👤 ${data.csOwnerName}</p>
            </div>
            ${data.meetingUrl ? `<div style="text-align: center; margin: 24px 0;"><a href="${data.meetingUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Acessar Reunião</a></div>` : ""}
          </div>
        </div>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send meeting confirmation:", error);
      return false;
    }
  },

  async sendMeetingNotificationToCS(data: {
    to: string;
    csName: string;
    attendeeName: string;
    attendeeEmail: string;
    meetingTitle: string;
    meetingDate: Date;
  }): Promise<boolean> {
    const date = data.meetingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const time = data.meetingDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Meeting notification to CS ${data.to}: ${data.meetingTitle}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Nova reunião agendada: ${data.meetingTitle}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Nova Reunião Agendada</h2>
            <p style="color: #4b5563;">Olá ${data.csName},</p>
            <p style="color: #4b5563;">Uma nova reunião foi agendada com você.</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 8px 0;">${data.meetingTitle}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">📅 ${date}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">🕐 ${time}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0;">👤 ${data.attendeeName}</p>
              <p style="color: #6b7280; margin: 0;">✉️ ${data.attendeeEmail}</p>
            </div>
            <div style="text-align: center;"><a href="${APP_URL}/cs/agenda" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Ver Agenda</a></div>
          </div>
        </div>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send meeting notification to CS:", error);
      return false;
    }
  },

  async sendMeetingCancellation(data: {
    to: string;
    attendeeName: string;
    meetingTitle: string;
    meetingDate: Date;
  }): Promise<boolean> {
    const date = data.meetingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Meeting cancellation for ${data.to}: ${data.meetingTitle}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Reunião cancelada: ${data.meetingTitle}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Reunião Cancelada</h2>
            <p style="color: #4b5563;">Olá ${data.attendeeName},</p>
            <p style="color: #4b5563;">A seguinte reunião foi cancelada:</p>
            <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 8px 0;">${data.meetingTitle}</p>
              <p style="color: #6b7280; margin: 0;">📅 ${date}</p>
            </div>
            <p style="color: #4b5563;">Se necessário, você pode agendar uma nova reunião através do portal.</p>
          </div>
        </div>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send meeting cancellation:", error);
      return false;
    }
  },

  async sendMeetingRescheduled(data: {
    to: string;
    attendeeName: string;
    meetingTitle: string;
    oldDate: Date;
    newDate: Date;
    meetingUrl?: string;
  }): Promise<boolean> {
    const oldDateStr = data.oldDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const newDateStr = data.newDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const newTime = data.newDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Meeting rescheduled for ${data.to}: ${data.meetingTitle}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Reunião reagendada: ${data.meetingTitle}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">Vanguardia 360</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Reunião Reagendada</h2>
            <p style="color: #4b5563;">Olá ${data.attendeeName},</p>
            <p style="color: #4b5563;">Sua reunião foi reagendada para uma nova data.</p>
            <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 12px 0;">${data.meetingTitle}</p>
              <p style="color: #6b7280; margin: 0 0 4px 0; text-decoration: line-through;">❌ ${oldDateStr}</p>
              <p style="color: #059669; margin: 0 0 4px 0; font-weight: 600;">✅ ${newDateStr}</p>
              <p style="color: #059669; margin: 0;">🕐 ${newTime}</p>
            </div>
            ${data.meetingUrl ? `<div style="text-align: center;"><a href="${data.meetingUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Acessar Reunião</a></div>` : ""}
          </div>
        </div>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send meeting rescheduled:", error);
      return false;
    }
  },

  async sendDiagnosticInvite(data: {
    to: string;
    recipientName?: string;
    companyName: string;
    diagnosticUrl: string;
    expiresAt?: Date;
  }): Promise<boolean> {
    const expiresText = data.expiresAt
      ? data.expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : null;

    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Diagnostic invite for ${data.to}: ${data.diagnosticUrl}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: data.to }];
      sendSmtpEmail.subject = `Diagnóstico de Automação - ${data.companyName}`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Diagnóstico de Automação</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${data.companyName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      ${data.recipientName ? `<p style="color: #4b5563; margin: 0 0 16px 0; font-size: 15px;">Olá, ${data.recipientName}!</p>` : ""}
                      <p style="color: #4b5563; margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
                        Você foi convidado para participar de um <strong>diagnóstico de automação</strong> da sua empresa.
                      </p>
                      <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
                        Este diagnóstico ajudará a identificar oportunidades de melhoria e automação nos processos do seu dia a dia. Leva aproximadamente <strong>10-15 minutos</strong> para ser preenchido.
                      </p>
                      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">
                          📋 Suas respostas são confidenciais e serão usadas apenas para análise interna.
                        </p>
                      </div>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${data.diagnosticUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          Responder Diagnóstico
                        </a>
                      </div>
                      ${expiresText ? `<p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Este link expira em ${expiresText}</p>` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                        Este email foi enviado pela Vanguardia 360 a pedido de ${data.companyName}.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send diagnostic invite:", error);
      return false;
    }
  },

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    link?: string,
    recipientName?: string
  ): Promise<boolean> {
    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV] Notification email for ${to}: ${title} - ${message}`);
      return true;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = `${title} - Vanguardia 360`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                      <img src="${APP_URL}/logo-vanguardia-white.png" alt="Vanguardia 360" height="32" style="height: 32px; width: auto;" onerror="this.style.display='none'">
                      <h1 style="color: white; margin: 12px 0 0 0; font-size: 20px; font-weight: 600;">Vanguardia 360</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      ${recipientName ? `<p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Olá, ${recipientName}!</p>` : ""}
                      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; line-height: 1.3;">${title}</h2>
                      <p style="color: #4b5563; margin: 0; font-size: 15px; line-height: 1.7;">${message}</p>
                      
                      ${link ? `
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${APP_URL}${link}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                            Ver Detalhes
                          </a>
                        </div>
                      ` : ""}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px 0; text-align: center;">
                        Você está recebendo este email porque optou por receber notificações da Vanguardia 360.
                      </p>
                      <p style="text-align: center; margin: 0;">
                        <a href="${APP_URL}/cliente/configuracoes" style="color: #6366f1; font-size: 12px; text-decoration: none;">
                          Gerenciar preferências de notificação
                        </a>
                        <span style="color: #d1d5db; margin: 0 8px;">|</span>
                        <a href="${APP_URL}/cliente/notificacoes" style="color: #6366f1; font-size: 12px; text-decoration: none;">
                          Ver todas as notificações
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- Legal -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
                  <tr>
                    <td style="padding: 24px 40px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.5;">
                        © ${new Date().getFullYear()} Vanguardia 360. Todos os direitos reservados.<br>
                        Este email foi enviado automaticamente, por favor não responda.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Failed to send notification email:", error);
      return false;
    }
  },
};
