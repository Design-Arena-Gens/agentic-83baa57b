"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/guards", label: "Guards" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/reports", label: "Reports" }
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/admin" className="text-lg font-semibold text-brand-700">
          Security Patrol Tracker
        </Link>
        <nav className="flex items-center gap-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition hover:text-brand-600 ${
                  isActive ? "text-brand-600" : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
