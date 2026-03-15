interface AlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  error:
    "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-l-red-500",
  success:
    "text-green-600 bg-green-50 dark:bg-green-400/10 border-green-200 dark:border-green-800 border-l-green-500",
};

export function Alert({ variant, children, className = "" }: AlertProps) {
  return (
    <div
      className={`text-center mb-4 p-3 rounded-lg border border-l-4 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
