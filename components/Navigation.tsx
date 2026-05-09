"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const navItems = [
    { href: "/", label: "Dashboard", icon: "DB" },
    { href: "/leads", label: "Leads", icon: "LD" },
    { href: "/income", label: "Income", icon: "$" },
    { href: "/follow-ups", label: "Follow-ups", icon: "FU" },
    { href: "/finance", label: "Finance", icon: "FN" },
    { href: "/settings", label: "Settings", icon: "ST" },
  ];

  return (
    <aside className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800 px-4 py-4 lg:px-6 lg:py-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            CRM
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="text-xs text-slate-400">Business Management</p>
          </div>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:block lg:flex-1 lg:space-y-2 lg:overflow-y-auto lg:py-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex shrink-0 items-center space-x-3 rounded-lg px-4 py-3 transition-all ${
              isActive(item.href)
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <span className="text-xs font-bold">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
            {isActive(item.href) && (
              <div className="ml-auto hidden h-2 w-2 rounded-full bg-white lg:block" />
            )}
          </Link>
        ))}
        <form action={logout} className="shrink-0 lg:mt-4">
          <button
            type="submit"
            className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-slate-400 transition-all hover:bg-slate-800/50 hover:text-slate-200"
          >
            <span className="text-xs font-bold">LO</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </form>
      </nav>

      <div className="hidden border-t border-slate-800 px-6 py-4 lg:block">
        <p className="text-center text-xs text-slate-500">2026 Business CRM</p>
      </div>
    </aside>
  );
}
