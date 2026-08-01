import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminGoogleAccountId } from "./adminConfig";

export { isAdminGoogleAccountId } from "./adminConfig";

export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return isAdminGoogleAccountId(session?.user?.id) ? session : null;
}
