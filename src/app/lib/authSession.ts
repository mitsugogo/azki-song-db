import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

const isInvalidJwtSessionError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("JWT_SESSION_ERROR") ||
    error.message.includes("decryption operation failed")
  );
};

export const getOptionalServerSession = async (): Promise<Session | null> => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (isInvalidJwtSessionError(error)) {
      return null;
    }
    throw error;
  }
};
