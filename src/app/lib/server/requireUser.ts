import "server-only";
import { getOptionalServerSession } from "@/app/lib/authSession";

export const requireUserId = async () => {
  const session = await getOptionalServerSession();
  return session?.user?.id ?? null;
};
