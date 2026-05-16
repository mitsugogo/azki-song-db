import { Notification } from "@mantine/core";
import { useState, useEffect } from "react";
import { HiCheck, HiExclamation } from "react-icons/hi";

interface ToastNotificationProps {
  message: string;
  toastType?: "success" | "error" | "warning";
  duration?: number;
  onClose: () => void;
}

const ToastNotification = ({
  message,
  toastType = "success",
  duration = 3000,
  onClose,
}: ToastNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;
  if (toastType === "error") {
    return (
      <div className="absolute top-4 right-6" style={{ zIndex: 99999 }}>
        <Notification
          color="red"
          icon={<HiExclamation className="h-5 w-5" />}
          onClose={onClose}
          withCloseButton
        >
          {message}
        </Notification>
      </div>
    );
  }
  if (toastType === "warning") {
    return (
      <div className="absolute top-4 right-6">
        <Notification
          color="yellow"
          icon={<HiExclamation className="h-5 w-5" />}
          onClose={onClose}
          withCloseButton
        >
          {message}
        </Notification>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-6">
      <Notification
        color="green"
        icon={<HiCheck className="h-5 w-5" />}
        onClose={onClose}
        withCloseButton
      >
        {message}
      </Notification>
    </div>
  );
};

export default ToastNotification;
