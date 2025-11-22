import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";

const PatrolMap = dynamic(() => import("@/components/admin/patrol-map"), {
  ssr: false
});

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export default async function AdminDashboardPage() {
  const today = startOfToday();
  const guards = await prisma.user.findMany({
    where: { role: "GUARD" },
    select: { id: true, name: true }
  });
  const patrols = await prisma.patrol.findMany({
    where: { timestamp: { gte: today } },
    include: {
      guard: { select: { name: true } },
      location: { select: { name: true, latitude: true, longitude: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  const completed = patrols.length;
  const expected = guards.length * 5;
  const missed = Math.max(expected - completed, 0);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          Daily Overview
        </h1>
        <p className="text-sm text-slate-500">
          {formatDate(new Date())} · {guards.length} guards scheduled · 5 patrols
          per guard
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed Patrols</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">
            {completed}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Missed Patrols</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">
            {missed}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Expected Total Today</p>
          <p className="mt-2 text-3xl font-semibold text-slate-800">
            {expected}
          </p>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Patrols
          </h2>
          <div className="mt-4 space-y-4">
            {patrols.slice(0, 6).map((patrol) => (
              <div
                key={patrol.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {patrol.guard.name}
                </p>
                <p className="text-sm text-slate-500">{patrol.location.name}</p>
                <p className="text-xs text-slate-400">
                  {formatTime(patrol.timestamp)}
                </p>
              </div>
            ))}
            {patrols.length === 0 && (
              <p className="text-sm text-slate-500">
                No patrols recorded yet today.
              </p>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">GPS Map</h2>
          <div className="mt-4 h-[400px]">
            <PatrolMap patrols={patrols} />
          </div>
        </div>
      </section>
    </div>
  );
}
