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
};
