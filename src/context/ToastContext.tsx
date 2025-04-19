import React, { createContext, useState, useContext } from "react";
import AppToast from "../components/toast/Toast";

interface IToastContext {
  toast: IToastData;
  setOpenToast: (toast: IToastData) => void;
}

interface IToastData {
  message: string;
  color: string;
  closeAfter?: number;
}

interface IToastState {
  isOpen: boolean;
  message: string;
  color: string;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

export const ToastProvider: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const CLOSE_AFTER = 3000;
  const [toast, setToastData] = useState<IToastState>({
    isOpen: false,
    message: "",
    color: "",
  });

  const setOpenToast = (toast: IToastData) => {
    setToastData({
      isOpen: true,
      message: toast.message,
      color: toast.color,
    });

    setTimeout(
      () => {
        setToastData({ ...toast, isOpen: false });
      },
      toast.closeAfter ? toast.closeAfter : CLOSE_AFTER,
    );
  };

  return (
    <ToastContext.Provider value={{ toast, setOpenToast }}>
      {children}

      <AppToast
        isOpen={toast.isOpen}
        onClick={() => setToastData({ ...toast, isOpen: false })}
        message={toast.message}
        color={toast.color}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = (): IToastContext => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
