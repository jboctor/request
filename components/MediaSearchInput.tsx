import { useState, useRef, useEffect, useCallback } from "react";
import type { MediaSearchResult } from "~/services/mediaSearch";

const baseClasses =
  "w-full px-4 rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-black/80 dark:text-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-green-500/40 focus:border-green-400";

interface MediaSearchInputProps {
  name: string;
  id?: string;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  mediaType: string;
}

export function MediaSearchInput({
  name,
  id,
  placeholder,
  maxLength,
  required,
  mediaType,
}: MediaSearchInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController>(undefined);

  const searchable = mediaType !== "" && mediaType !== "Site Suggestion";

  const doSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (!searchable || query.length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const params = new URLSearchParams({ q: query, type: mediaType });
          const res = await fetch(`/api/media-search?${params}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen((data.results || []).length > 0);
          setSelectedIndex(-1);
        } catch {
          // Silent failure — user can continue typing manually
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      }, 300);
    },
    [mediaType, searchable]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    doSearch(value);
  }

  function handleSelect(result: MediaSearchResult) {
    const title = result.year ? `${result.title} (${result.year})` : result.title;
    setInputValue(title);
    setIsOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset when media type changes
  useEffect(() => {
    setResults([]);
    setIsOpen(false);
  }, [mediaType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        name={name}
        id={id}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`${baseClasses} h-10`}
      />
      {isLoading && searchable && inputValue.length >= 2 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          Searching...
        </div>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg">
          {results.map((result, index) => (
            <li
              key={`${result.title}-${result.year}-${index}`}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? "bg-green-50 dark:bg-green-900/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onMouseDown={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt=""
                  className="w-8 h-12 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-8 h-12 bg-gray-200 dark:bg-gray-700 rounded shrink-0 flex items-center justify-center text-gray-400 text-xs">
                  ?
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate dark:text-gray-200">{result.title}</div>
                {result.year && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">{result.year}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
