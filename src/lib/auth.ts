import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { emailService } from "@/services/email.service";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendPasswordReset(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerification(user.email, url);
    },
    sendOnSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: isProduction,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CLIENT",
        input: false,
      },
      csOwnerId: {
        type: "string",
        required: false,
        input: false,
      },
      companyId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [
    "https://dashboard.somosvanguardia.com.br",
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean) as string[],
});

export type Session = typeof auth.$Infer.Session;
