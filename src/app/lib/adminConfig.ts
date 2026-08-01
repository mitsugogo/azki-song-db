export const ADMIN_MODE_STORAGE_KEY = "azki-admin-mode";

export const isAdminGoogleAccountId = (
  accountId: string | null | undefined,
) => {
  const configuredId = process.env.ADMIN_GOOGLE_ACCOUNT_ID?.trim();
  const normalizedId = accountId?.trim();

  return Boolean(configuredId && normalizedId && configuredId === normalizedId);
};
