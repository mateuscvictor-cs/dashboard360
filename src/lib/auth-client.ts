import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export { useSession } from "next-auth/react";

export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return {
          error: {
            message: result.error === "CredentialsSignin" 
              ? "Invalid credentials" 
              : result.error,
          },
          data: null,
        };
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return {
        error: { message: "Failed to sign in" },
        data: null,
      };
    }
  },
};

export const signOut = async () => {
  await nextAuthSignOut({ redirect: false });
};
