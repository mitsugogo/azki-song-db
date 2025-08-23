import { Toast, ToastToggle } from "flowbite-react";
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
        <Toast style={{ zIndex: 99999 }}>
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
            <HiExclamation className="h-5 w-5" />
          </div>
          <div className="ml-3 text-sm font-normal">{message}</div>
          <ToastToggle />
        </Toast>
      </div>
    );
  }
  if (toastType === "warning") {
    return (
      <div className="absolute top-4 right-6">
        <Toast style={{ zIndex: 99999 }}>
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
            <HiExclamation className="h-5 w-5" />
          </div>
          <div className="ml-3 text-sm font-normal">{message}</div>
          <ToastToggle />
        </Toast>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-6">
      <Toast style={{ zIndex: 99999 }}>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
          <HiCheck className="h-5 w-5" />
        </div>
        <div className="ml-3 text-sm font-normal">{message}</div>
        <ToastToggle />
      </Toast>
    </div>
  );
};

export default ToastNotification;
