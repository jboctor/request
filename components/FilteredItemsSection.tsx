import React from 'react';
import { SectionWrapper } from './SectionWrapper';

interface FilteredItemsSectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  children: React.ReactNode;
  actionData?: {
    error?: string;
    success?: string;
  };
  filterControls: React.ReactNode;
}

export function FilteredItemsSection({
  title,
  children,
  actionData,
  filterControls,
  ...props
}: FilteredItemsSectionProps) {
  return (
    <SectionWrapper {...props}>
      <h2 className="text-center text-lg font-semibold tracking-tight mb-4">{title}</h2>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg p-3">
        {filterControls}
      </div>

      {/* Messages */}
      {actionData?.error && (
        <div className="text-red-600 text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 border-l-4 border-l-red-500">{actionData.error}</div>
      )}
      {actionData?.success && (
        <div className="text-green-600 text-center mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 border-l-4 border-l-green-500">{actionData.success}</div>
      )}

      {children}
    </SectionWrapper>
  );
}
