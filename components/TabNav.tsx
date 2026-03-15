interface Tab {
  key: string;
  label: string;
  id?: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const activeClasses =
  "pt-2.5 -mb-2 pb-4 bg-gradient-to-t from-green-500/40 to-transparent text-green-800 dark:from-green-800 dark:to-transparent dark:text-white shadow-sm shadow-green-600/15 dark:shadow-md dark:shadow-green-400/20";
const inactiveClasses =
  "py-2 bg-gradient-to-t from-green-500/15 to-transparent text-green-700 dark:from-green-800/30 dark:to-transparent dark:text-green-200 hover:from-green-500/25 dark:hover:from-green-800/50";

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-1 justify-center">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          id={tab.id}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 rounded-b-xl text-sm font-medium ${
            activeTab === tab.key ? activeClasses : inactiveClasses
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
