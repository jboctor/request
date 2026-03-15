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
  "border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-400/10";
const inactiveClasses =
  "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5";

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          id={tab.id}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg ${
            activeTab === tab.key ? activeClasses : inactiveClasses
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
