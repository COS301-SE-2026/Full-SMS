"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { toast, ToastContainer, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ToastContextType {
  successToast: (msg: string) => void;
  errorToast: (msg: string) => void;
  infoToast: (msg: string) => void;
  warningToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const defaultOptions: ToastOptions = {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      backgroundColor: "var(--color-card)",
      color: "var(--color-foreground)",
      border: "1px solid var(--color-border)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--font-size-sm)",
    },
  };

  const successToast = useCallback(
    (msg: string) =>
      toast.success(msg, {
        ...defaultOptions,
      }),
    [],
  );

  const errorToast = useCallback(
    (msg: string) =>
      toast.error(msg, {
        ...defaultOptions,
      }),
    [],
  );

  const infoToast = useCallback(
    (msg: string) =>
      toast.info(msg, {
        ...defaultOptions,
      }),
    [],
  );

  const warningToast = useCallback(
    (msg: string) =>
      toast.warning(msg, {
        ...defaultOptions,
      }),
    [],
  );

  const contextValue = useMemo(
    () => ({
      successToast,
      errorToast,
      infoToast,
      warningToast,
    }),
    [successToast, errorToast, infoToast, warningToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toastClassName="dark-toast" />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
