interface PageLayoutProps {
  title: string;
  srTitle?: string;
  maxWidth?: string;
  contentMaxWidth?: string;
  headingSize?: "lg" | "xl";
  children: React.ReactNode;
}

export function PageLayout({
  title,
  srTitle,
  maxWidth = "900px",
  contentMaxWidth,
  headingSize = "lg",
  children,
}: PageLayoutProps) {
  const headingClasses =
    headingSize === "xl"
      ? "text-3xl font-semibold tracking-tight"
      : "text-2xl";

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">{srTitle ?? title}</h1>
          <div className="max-w-[100vw] p-4" style={{ width: maxWidth }}>
            <h1 className={`block w-full text-center ${headingClasses}`}>
              {title}
            </h1>
          </div>
        </header>
        <div
          className="w-full space-y-6 px-4"
          style={{ maxWidth: contentMaxWidth ?? maxWidth }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
