"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { haversineDistance } from "@/lib/utils";

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  checklist: string[];
};

type Patrol = {
  id: number;
  timestamp: string;
  location: { name: string };
};

type Props = {
  guardName: string;
  locations: Location[];
  initialPatrols: {
    id: number;
    timestamp: string;
    location: { name: string };
  }[];
};

type ChecklistState = Record<string, boolean>;

export default function GuardDashboard({
  guardName,
  locations,
  initialPatrols
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [patrols, setPatrols] = useState<Patrol[]>(
    initialPatrols.map((patrol) => ({
      id: patrol.id,
      timestamp: patrol.timestamp,
      location: patrol.location
    }))
  );
  const [notes, setNotes] = useState("");

  const completed = patrols.length;
  const remaining = Math.max(5 - completed, 0);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to submit patrol");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPatrols((prev) => [
        {
          id: data.id,
          timestamp: data.timestamp,
          location: selectedLocation ? { name: selectedLocation.name } : { name: "Unknown" }
        },
        ...prev
      ]);
      setSelectedLocation(null);
      setChecklist({});
      setCoords(null);
      setPhotoPreview(null);
      setNotes("");
      toast.success("Patrol completed");
    },
    onError: (error: any) => {
      toast.error(error.message ?? "Failed to submit patrol");
    }
  });

  const readyForChecklist = useMemo(() => {
    if (!selectedLocation || !coords) return false;
    return true;
  }, [selectedLocation, coords]);

  const handleStartPatrol = (location: Location) => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = haversineDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );
        if (distance > 50) {
          toast.error("You must be within 50 meters of the checkpoint");
          return;
        }
        setSelectedLocation(location);
        setCoords({ latitude, longitude });
        const initialChecklist: ChecklistState = {};
        location.checklist.forEach((item) => {
          initialChecklist[item] = false;
        });
        setChecklist(initialChecklist);
        toast.success("Checkpoint verified. Complete the checklist.");
      },
      () => {
        toast.error("Unable to access GPS location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleChecklist = (item: string) => {
    setChecklist((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? null;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedLocation || !coords) return;
    const responses = Object.entries(checklist).map(([item, value]) => ({
      item,
      value
    }));
    const payload = {
      locationId: selectedLocation.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      responses: [...responses, ...(notes ? [{ item: "notes", value: notes }] : [])],
      photoBase64: photoPreview
    };
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {guardName}
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase text-slate-500">Completed Today</p>
            <p className="mt-2 text-3xl font-semibold text-brand-600">
              {completed}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase text-slate-500">Remaining</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {remaining}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase text-slate-500">Target</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">5</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Patrol Locations
        </h2>
        <p className="text-sm text-slate-500">
          Travel to a checkpoint, verify your GPS, and complete the checklist.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="font-semibold text-slate-800">{location.name}</p>
              <p className="text-xs text-slate-500">
                Lat {location.latitude.toFixed(4)}, Lng{" "}
                {location.longitude.toFixed(4)}
              </p>
              <button
                onClick={() => handleStartPatrol(location)}
                className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Start Patrol
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedLocation && readyForChecklist && (
        <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedLocation.name}
              </h3>
              <p className="text-sm text-slate-500">
                GPS Verified · Checklist required
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null);
                setCoords(null);
                setChecklist({});
                setPhotoPreview(null);
                setNotes("");
              }}
              className="text-sm font-semibold text-rose-600"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {selectedLocation.checklist.map((item) => (
              <label
                key={item}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <span className="text-sm font-medium text-slate-800">{item}</span>
                <input
                  type="checkbox"
                  checked={checklist[item] ?? false}
                  onChange={() => handleToggleChecklist(item)}
                  className="h-4 w-4 accent-brand-600"
                />
              </label>
            ))}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Photo Upload (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-1 w-full text-sm"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Patrol evidence"
                  className="mt-3 h-48 w-full rounded-lg object-cover"
                />
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending || Object.values(checklist).some((value) => !value)}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {mutation.isPending ? "Submitting..." : "Submit Patrol"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Today&apos;s Patrols
        </h2>
        <div className="mt-4 space-y-3">
          {patrols.map((patrol) => (
            <div
              key={patrol.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {patrol.location.name}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(patrol.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Completed
              </span>
            </div>
          ))}
          {patrols.length === 0 && (
            <p className="text-sm text-slate-500">
              You haven&apos;t completed any patrols today yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
