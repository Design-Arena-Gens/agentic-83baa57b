import GuardNav from "@/components/guard/guard-nav";
import { ReactNode } from "react";

export default function GuardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <GuardNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
