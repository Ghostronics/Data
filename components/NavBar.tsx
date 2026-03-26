"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Clock, BarChart2, Lock } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Hoy", icon: Activity },
  { href: "/history", label: "Historial", icon: Clock },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-bg-border bg-bg-secondary/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-gex-positive/20 border border-gex-positive/30 flex items-center justify-center">
              <BarChart2 size={14} className="text-gex-positive" />
            </div>
            <span className="font-semibold text-sm tracking-wide">
              GG <span className="text-text-secondary font-normal">Order Flow</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === href
                    ? "bg-gex-positive/10 text-gex-positive"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
            <Link
              href="/admin"
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ml-2 border",
                pathname === "/admin"
                  ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30"
                  : "text-text-muted border-bg-border hover:text-text-secondary hover:border-text-muted"
              )}
            >
              <Lock size={12} />
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
