import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClasses =
  "w-full px-4 rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-black/80 dark:text-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-green-500/40 focus:border-green-400";

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseClasses} h-10 ${props.className || ""}`} />;
}

export function FormSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${baseClasses} h-10 ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${baseClasses} py-2 resize-none ${props.className || ""}`}
    />
  );
}
