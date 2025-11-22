import AdminNav from "@/components/admin/admin-nav";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
