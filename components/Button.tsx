import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'alert';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  children: React.ReactNode;
  loading?: boolean;
}

const variantStyles = {
  primary: {
    base: 'text-white bg-gradient-to-r from-green-600 to-green-500',
    hover: 'hover:shadow-md hover:shadow-green-500/25 dark:hover:shadow-green-400/20'
  },
  secondary: {
    base: 'text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-700/80'
  },
  info: {
    base: 'bg-gray-100 border border-gray-300 text-gray-700 dark:bg-black dark:border-gray-600 dark:text-gray-300',
    hover: 'hover:shadow-sm hover:shadow-gray-300/25 dark:hover:shadow-gray-500/15'
  },
  success: {
    base: 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
    hover: 'hover:shadow-sm hover:shadow-green-300/25 dark:hover:shadow-green-400/15'
  },
  warning: {
    base: 'bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
    hover: 'hover:shadow-sm hover:shadow-yellow-300/25 dark:hover:shadow-yellow-400/15'
  },
  alert: {
    base: 'bg-red-100 border border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    hover: 'hover:shadow-sm hover:shadow-red-300/25 dark:hover:shadow-red-400/15'
  }
};

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export function Button({ variant, children, className = '', disabled, loading = false, ...props }: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const baseClasses = 'text-sm font-medium tracking-wide px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer';
  const isDisabled = disabled || loading;

  const combinedClassName = [
    baseClasses,
    variantStyle.base,
    !isDisabled ? variantStyle.hover : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
