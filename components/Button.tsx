import React from 'react';

type ButtonVariant = 'info' | 'success' | 'alert';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles = {
  info: {
    base: 'bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
    hover: 'hover:opacity-80'
  },
  success: {
    base: 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
    hover: 'hover:opacity-80'
  },
  alert: {
    base: 'bg-red-100 border border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    hover: 'hover:opacity-80'
  }
};

export function Button({ variant, children, className = '', disabled, ...props }: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const baseClasses = 'text-sm px-3 py-1 rounded disabled:opacity-50';

  const combinedClassName = [
    baseClasses,
    variantStyle.base,
    variantStyle.hover,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}