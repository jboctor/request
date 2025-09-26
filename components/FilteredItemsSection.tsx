import React from 'react';
import { SectionWrapper } from './SectionWrapper';

interface FilteredItemsSectionProps {
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
  filterControls
}: FilteredItemsSectionProps) {
  return (
    <SectionWrapper>
      <h2 className="text-center text-lg font-medium mb-4">{title}</h2>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4">
        {filterControls}
      </div>

      {/* Messages */}
      {actionData?.error && (
        <div className="text-red-600 text-center mb-4">{actionData.error}</div>
      )}
      {actionData?.success && (
        <div className="text-green-600 text-center mb-4">{actionData.success}</div>
      )}

      {children}
    </SectionWrapper>
  );
}