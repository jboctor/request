import { Link, useLocation } from "react-router";
import { useEffect } from "react";

interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
}

export function Navigation({ className = "", ...props }: NavigationProps) {
  const location = useLocation();

  // Save current admin page to localStorage when navigating
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || location.pathname === "/dashboard") {
      localStorage.setItem("last-admin-page", location.pathname);
    }
  }, [location.pathname]);

  return (
    <nav
      {...props}
      className={`flex gap-4 ${className}`}
    >
      <Link
        to="/dashboard"
        className={`px-3 py-1 rounded text-sm ${
          location.pathname === "/dashboard"
            ? "bg-green-600 text-white"
            : "text-green-800 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100"
        }`}
      >
        Dashboard
      </Link>
      <Link
        to="/admin"
        className={`px-3 py-1 rounded text-sm ${
          location.pathname === "/admin"
            ? "bg-green-600 text-white"
            : "text-green-800 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100"
        }`}
      >
        Fulfillment
      </Link>
      <Link
        to="/admin/users"
        className={`px-3 py-1 rounded text-sm ${
          location.pathname === "/admin/users"
            ? "bg-green-600 text-white"
            : "text-green-800 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100"
        }`}
      >
        Users
      </Link>
      <Link
        to="/admin/features"
        className={`px-3 py-1 rounded text-sm ${
          location.pathname === "/admin/features"
            ? "bg-green-600 text-white"
            : "text-green-800 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100"
        }`}
      >
        Features
      </Link>
    </nav>
  );
}