"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type Guard = {
  id: number;
  name: string;
  username: string;
  createdAt: string;
};

type Props = {
  guards: Guard[];
};

export default function ManageGuards({ guards }: Props) {
  const [items, setItems] = useState<Guard[]>(guards);
  const [editing, setEditing] = useState<Guard | null>(null);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/guards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to add guard");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setItems((prev) => [data, ...prev]);
      toast.success("Guard added");
    },
    onError: (error: any) => {
      toast.error(error.message ?? "Failed to add guard");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      password?: string;
    }) => {
      const response = await fetch(`/api/guards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to update guard");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setItems((prev) => prev.map((guard) => (guard.id === data.id ? data : guard)));
      setEditing(null);
      toast.success("Guard updated");
    },
    onError: (error: any) => {
      toast.error(error.message ?? "Failed to update guard");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/guards/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to delete guard");
      }
      return { id };
    },
    onSuccess: ({ id }) => {
      setItems((prev) => prev.filter((guard) => guard.id !== id));
      toast.success("Guard removed");
    },
    onError: (error: any) => {
      toast.error(error.message ?? "Failed to delete guard");
    }
  });

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!name || !username || !password) {
      toast.error("All fields are required");
      return;
    }

    createMutation.mutate({ name, username, password });
    event.currentTarget.reset();
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const password = formData.get("password")?.toString();

    updateMutation.mutate({
      id: editing.id,
      name: name && name.length > 0 ? name : undefined,
      password: password && password.length > 0 ? password : undefined
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Manage Security Guards
        </h1>
        <p className="text-sm text-slate-500">
          Add new guards, update credentials, or remove inactive records.
        </p>
        <form
          onSubmit={handleAdd}
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-4"
        >
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              name="name"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Full name"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username
            </label>
            <input
              name="username"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="login id"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="temporary password"
              required
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {createMutation.isPending ? "Saving..." : "Add Guard"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Active Guards ({items.length})
        </h2>
        <div className="mt-4 space-y-3">
          {items.map((guard) => (
            <div
              key={guard.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {guard.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Username: {guard.username} · Added{" "}
                    {new Date(guard.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => setEditing(guard)}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(guard.id)}
                    className="font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editing?.id === guard.id && (
                <form
                  onSubmit={handleUpdate}
                  className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-4"
                >
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full name
                    </label>
                    <input
                      name="name"
                      defaultValue={guard.name}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reset password
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Leave blank to keep"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-3">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {updateMutation.isPending ? "Updating..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                      onClick={() => setEditing(null)}
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
              No guards found. Add your first guard above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
