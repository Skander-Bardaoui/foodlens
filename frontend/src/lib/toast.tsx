import { useEffect, useRef, useState, type ReactNode } from "react";

import Toast, { type ToastTone } from "../components/Toast";

export type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastPayload & { id: number };

let pushToast: ((toast: ToastItem) => void) | null = null;
let nextId = 0;

export function showToast(payload: ToastPayload): void {
  pushToast?.({ ...payload, id: ++nextId });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    pushToast = setToast;
    return () => {
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), toast.duration ?? 4500);
    return () => window.clearTimeout(timerRef.current);
  }, [toast]);

  return (
    <>
      {children}
      <Toast
        key={toast?.id}
        open={toast !== null}
        title={toast?.title ?? ""}
        description={toast?.description}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />
    </>
  );
}
