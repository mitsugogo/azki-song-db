import { useState, useEffect } from "react";

const ToastNotification = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-md shadow-lg">
      {message}
    </div>
  );
};

export default ToastNotification;
