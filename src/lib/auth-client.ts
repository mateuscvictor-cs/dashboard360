import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

export const requestPasswordReset = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const sendVerificationEmail = authClient.sendVerificationEmail;
