import React from 'react';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className = "" }: SectionWrapperProps) {
  return (
    <section className={`rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 ${className}`}>
      {children}
    </section>
  );
}