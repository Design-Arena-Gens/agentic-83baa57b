"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type GuardSummary = {
  guardId: number;
  guardName: string;
  patrols: number;
};

type PatrolRow = {
  id: number;
  guardName: string;
  locationName: string;
  timestamp: string;
  responses: { item: string; value: boolean | string }[];
  photoBase64?: string | null;
};

type ReportsData = {
  date: string;
  expected: number;
  completed: number;
  missed: number;
  byGuard: GuardSummary[];
  patrols: PatrolRow[];
};

type Props = {
  initialData: ReportsData;
};

function formatDateInput(date: string) {
  return date.slice(0, 10);
}

function formatDateDisplay(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export default function ReportsDashboard({ initialData }: Props) {
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateInput(initialData.date)
  );
  const [data, setData] = useState<ReportsData>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/reports/summary?date=${selectedDate}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to load report");
        }
        const json = await response.json();
        setData({
          ...json,
          date: json.date,
          patrols: json.patrols.map((patrol: any) => ({
            ...patrol,
            timestamp: patrol.timestamp
          }))
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          toast.error(error.message ?? "Failed to load report");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [selectedDate]);

  const completionRate = useMemo(() => {
    if (data.expected === 0) return 0;
    return Math.round((data.completed / data.expected) * 100);
  }, [data.completed, data.expected]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Daily Patrol Report
          </h1>
          <p className="text-sm text-slate-500">
            {formatDateDisplay(data.date)}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <a
            href={`/api/reports/daily?date=${selectedDate}`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Download CSV
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Expected patrols</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {data.expected}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {data.completed}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Completion rate</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">
            {completionRate}%
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Guard completion
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Guard</th>
                <th className="px-3 py-2">Patrols</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.byGuard.map((row) => {
                const status =
                  row.patrols >= 5
                    ? "Completed"
                    : row.patrols === 0
                      ? "Missed"
                      : "In progress";
                return (
                  <tr key={row.guardId} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {row.guardName}
                    </td>
                    <td className="px-3 py-2">{row.patrols}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "In progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data.byGuard.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={3}>
                    No guards found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Patrol logs</h2>
          {loading && (
            <span className="text-xs font-semibold uppercase text-slate-400">
              Refreshing...
            </span>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {data.patrols.map((patrol) => (
            <div
              key={patrol.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {patrol.guardName}
                  </p>
                  <p className="text-xs text-slate-500">{patrol.locationName}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(patrol.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                {patrol.responses.map((response) => (
                  <div
                    key={response.item}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-700">
                      {response.item}
                    </span>
                    <span
                      className={`font-semibold ${
                        response.value === true
                          ? "text-emerald-600"
                          : response.value === false
                            ? "text-rose-600"
                            : "text-slate-500"
                      }`}
                    >
                      {typeof response.value === "boolean"
                        ? response.value
                          ? "Yes"
                          : "No"
                        : response.value}
                    </span>
                  </div>
                ))}
              </div>
              {patrol.photoBase64 && (
                <img
                  src={patrol.photoBase64}
                  alt="Patrol evidence"
                  className="mt-3 h-40 w-full rounded-lg object-cover"
                />
              )}
            </div>
          ))}
          {data.patrols.length === 0 && (
            <p className="text-sm text-slate-500">
              No patrols recorded for the selected date.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
