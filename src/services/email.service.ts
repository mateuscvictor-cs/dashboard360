import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@vanguardia.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vanguardia 360";
const APP_URL = process.env.AUTH_URL || "http://localhost:3000";

type InviteType = "COMPANY_ADMIN" | "MEMBER_ADMIN" | "MEMBER_CS";

function getInviteSubject(type: InviteType): string {
  switch (type) {
    case "COMPANY_ADMIN":
      return "Você foi convidado para acessar o Vanguardia 360";
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
};
