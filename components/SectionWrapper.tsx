import React from 'react';

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function SectionWrapper({ children, className = "", ...props }: SectionWrapperProps) {
  return (
    <section
      {...props}
      className={`rounded-card border border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-green-900/5 dark:bg-transparent dark:border-transparent dark:shadow-none p-6 space-y-4 ${className}`}
    >
      {children}
    </section>
  );
}
