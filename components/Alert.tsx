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

export function Alert({ variant, children, className = "", timeout }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const duration = timeout ?? DEFAULT_TIMEOUT;

  useEffect(() => {
    setVisible(true);
    if (duration <= 0) return;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [children, duration]);

  if (!visible) return null;

  return (
    <div
      className={`text-center mb-4 p-3 rounded-lg border border-l-4 transition-opacity duration-300 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
