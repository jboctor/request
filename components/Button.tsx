import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'alert';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  children: React.ReactNode;
  loading?: boolean;
}

const variantStyles = {
  primary: {
    base: 'w-full h-10 px-3 text-white bg-blue-500',
    hover: 'hover:bg-blue-600'
  },
  secondary: {
    base: 'text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800'
  },
  info: {
    base: 'bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
    hover: 'hover:opacity-80'
  },
  success: {
    base: 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
    hover: 'hover:opacity-80'
  },
  warning: {
    base: 'bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
    hover: 'hover:opacity-80'
  },
  alert: {
    base: 'bg-red-100 border border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    hover: 'hover:opacity-80'
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
  const baseClasses = 'text-sm px-3 py-1 rounded-lg disabled:opacity-50 flex items-center justify-center';
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