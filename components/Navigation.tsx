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

  const linkClass = (path: string) =>
    `px-4 rounded-b-xl text-sm font-medium ${
      location.pathname === path
        ? "pt-4 pb-2.5 -mb-2 bg-gradient-to-b from-green-500 to-green-700 text-white shadow-md shadow-green-600/30 dark:from-green-700 dark:to-green-900 dark:shadow-green-400/20 border-x border-b border-transparent"
        : "py-2 bg-gradient-to-b from-green-50 to-green-100/70 dark:from-emerald-950/40 dark:to-emerald-950/80 text-green-800 dark:text-green-200 hover:from-green-100 hover:to-green-150/90 dark:hover:from-emerald-900/50 dark:hover:to-emerald-950/90 border-x border-b border-green-200/40 dark:border-green-800/40"
    }`;

  return (
    <nav
      {...props}
      className={`flex gap-1 ${className}`}
    >
      <Link to="/dashboard" className={linkClass("/dashboard")}>
        Dashboard
      </Link>
      <Link to="/admin" className={linkClass("/admin")}>
        Fulfillment
      </Link>
      <Link to="/admin/users" className={linkClass("/admin/users")}>
        Users
      </Link>
      <Link to="/admin/features" className={linkClass("/admin/features")}>
        Features
      </Link>
    </nav>
  );
}
