"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
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

  const successToast = (msg: string) =>
    toast.success(msg, {
      ...defaultOptions,
      progressStyle: { background: "var(--color-success)" },
    });

  const errorToast = (msg: string) =>
    toast.error(msg, {
      ...defaultOptions,
      progressStyle: { background: "var(--color-destructive)" },
    });

  const infoToast = (msg: string) =>
    toast.info(msg, {
      ...defaultOptions,
      progressStyle: { background: "var(--color-primary)" },
    });

  const warningToast = (msg: string) =>
    toast.warning(msg, {
      ...defaultOptions,
      progressStyle: { background: "var(--color-warning)" },
    });

  return (
    <ToastContext.Provider
      value={{ successToast, errorToast, infoToast, warningToast }}
    >
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
