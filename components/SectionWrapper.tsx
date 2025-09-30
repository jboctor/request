import React from 'react';

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function SectionWrapper({ children, className = "", ...props }: SectionWrapperProps) {
  return (
    <section
      {...props}
      className={`rounded-3xl border border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-700 p-6 space-y-4 ${className}`}
    >
      {children}
    </section>
  );
}