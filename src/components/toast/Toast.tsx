import { useEffect, useState } from "react";
import "./Toast.scss";
import { IonToast } from "@ionic/react";

interface ToastProps {
  isOpen: boolean;
  message: string;
  color?: string;
  duration?: number;
  onDidDismiss?: () => void;
  onClick: () => void;
}

const AppToast: React.FC<ToastProps> = ({
  isOpen,
  message,
  onClick,
  color,
  duration,
  onDidDismiss,
}) => {
  const _duration = duration || 5000;
  const _color = color || "success";
  const [_isOpen, setIsOpen] = useState(isOpen);

  useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen]);

  const _onDidDismiss = () => {
    setIsOpen(false);
    if (onDidDismiss) onDidDismiss();
  };

  return (
    <IonToast
      duration={_duration}
      className="AppToast"
      isOpen={_isOpen}
      onClick={onClick}
      message={message}
      color={_color}
      onDidDismiss={() => _onDidDismiss()}
      position="top"
    />
  );
};

export default AppToast;
