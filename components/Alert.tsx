import { useState, useEffect } from "react";

interface AlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
  className?: string;
  timeout?: number;
}

const variantClasses = {
  error:
    "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-l-red-500",
  success:
    "text-green-600 bg-green-50 dark:bg-green-400/10 border-green-200 dark:border-green-800 border-l-green-500",
};

const DEFAULT_TIMEOUT = 5000;
const ANIMATION_DURATION = 300;

export function Alert({ variant, children, className = "", timeout }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const duration = timeout ?? DEFAULT_TIMEOUT;

  useEffect(() => {
    setVisible(true);
    setDismissing(false);
    if (duration <= 0) return;
    const timer = setTimeout(() => setDismissing(true), duration);
    return () => clearTimeout(timer);
  }, [children, duration]);

  useEffect(() => {
    if (!dismissing) return;
    const timer = setTimeout(() => setVisible(false), ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [dismissing]);

  if (!visible) return null;

  return (
    <div
      className={`text-center mb-4 p-3 rounded-lg border border-l-4 transition-all overflow-hidden ${variantClasses[variant]} ${className}`}
      style={{
        transitionDuration: `${ANIMATION_DURATION}ms`,
        ...(dismissing ? { maxHeight: 0, opacity: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } : { maxHeight: '200px', opacity: 1 }),
      }}
    >
      {children}
    </div>
  );
}
