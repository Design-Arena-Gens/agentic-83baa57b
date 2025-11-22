"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function GuardNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/guard" className="text-lg font-semibold text-brand-700">
          My Patrols
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
