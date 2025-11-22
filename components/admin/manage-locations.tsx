"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  checklist: string[];
  createdAt: string;
};

type Props = {
  locations: Location[];
};

const parseChecklist = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ManageLocations({ locations }: Props) {
  const [items, setItems] = useState<Location[]>(locations);
  const [editing, setEditing] = useState<Location | null>(null);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to add location");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setItems((prev) => [data, ...prev]);
      toast.success("Location added");
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to update location");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setItems((prev) => prev.map((loc) => (loc.id === data.id ? data : loc)));
      setEditing(null);
      toast.success("Location updated");
    },
    onError: (error: any) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to delete location");
      }
      return { id };
    },
    onSuccess: ({ id }) => {
      setItems((prev) => prev.filter((loc) => loc.id !== id));
      toast.success("Location removed");
    },
    onError: (error: any) => toast.error(error.message)
  });

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const checklist = parseChecklist(formData.get("checklist")?.toString() ?? "");

    if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("All fields are required");
      return;
    }
    if (checklist.length === 0) {
      toast.error("Provide at least one checklist item");
      return;
    }

    createMutation.mutate({ name, latitude, longitude, checklist });
    event.currentTarget.reset();
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const checklist = parseChecklist(formData.get("checklist")?.toString() ?? "");

    updateMutation.mutate({
      id: editing.id,
      name,
      latitude,
      longitude,
      checklist
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Patrol Locations
        </h1>
        <p className="text-sm text-slate-500">
          Maintain checkpoints with GPS coordinates and tailored checklists.
        </p>
        <form
          onSubmit={handleAdd}
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location name
            </label>
            <input
              name="name"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Loading dock"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latitude
            </label>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="40.7128"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Longitude
            </label>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="-74.006"
              required
            />
          </div>
          <div className="sm:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Checklist items (one per line)
            </label>
            <textarea
              name="checklist"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              rows={3}
              placeholder={"Door locked\nLights off\nNo safety hazards"}
              required
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {createMutation.isPending ? "Saving..." : "Add Location"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Active Checkpoints ({items.length})
        </h2>
        <div className="mt-4 space-y-4">
          {items.map((location) => (
            <div
              key={location.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {location.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Lat {location.latitude.toFixed(5)} · Lng{" "}
                    {location.longitude.toFixed(5)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {location.checklist.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => setEditing(location)}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(location.id)}
                    className="font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editing?.id === location.id && (
                <form
                  onSubmit={handleUpdate}
                  className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </label>
                    <input
                      name="name"
                      defaultValue={location.name}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Latitude
                    </label>
                    <input
                      name="latitude"
                      type="number"
                      step="0.000001"
                      defaultValue={location.latitude}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Longitude
                    </label>
                    <input
                      name="longitude"
                      type="number"
                      step="0.000001"
                      defaultValue={location.longitude}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Checklist items (one per line)
                    </label>
                    <textarea
                      name="checklist"
                      defaultValue={location.checklist.join("\n")}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      rows={3}
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-3">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {updateMutation.isPending ? "Updating..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              No locations defined yet. Add your first checkpoint above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
