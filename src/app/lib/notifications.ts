import type { ReactNode } from "react";
import { notifications } from "@mantine/notifications";

type AppNotificationType = "success" | "error" | "warning";

type ShowAppNotificationOptions = {
  message: ReactNode;
  title?: string;
  type?: AppNotificationType;
  autoClose?: number | false;
  icon?: ReactNode;
  id?: string;
  onClose?: () => void;
};

const colorByType: Record<AppNotificationType, string> = {
  success: "green",
  error: "red",
  warning: "yellow",
};

export const showAppNotification = ({
  message,
  title,
  type = "success",
  autoClose,
  icon,
  id,
  onClose,
}: ShowAppNotificationOptions) => {
  notifications.show({
    id,
    title,
    message,
    color: colorByType[type],
    autoClose: autoClose ?? (type === "error" ? 5000 : 3000),
    icon,
    onClose,
    withCloseButton: true,
  });
};
