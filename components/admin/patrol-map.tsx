"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatTime } from "@/lib/utils";

const icon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type PatrolMapProps = {
  patrols: {
    id: number;
    guard: { name: string };
    latitude: number;
    longitude: number;
    timestamp: Date;
    location: { name: string; latitude: number; longitude: number };
  }[];
};

export default function PatrolMap({ patrols }: PatrolMapProps) {
  const hasPatrols = patrols.length > 0;
  const center = hasPatrols
    ? ([patrols[0].latitude, patrols[0].longitude] as [number, number])
    : ([37.7749, -122.4194] as [number, number]);

  useEffect(() => {
    // Fix Leaflet icon path issues in Next.js
    (L.Icon.Default.prototype as any)._getIconUrl = function (_name: string) {
      return (
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
      );
    };
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full rounded-lg"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {patrols.map((patrol) => (
        <Marker
          key={patrol.id}
          position={[patrol.latitude, patrol.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{patrol.guard.name}</p>
              <p>{patrol.location.name}</p>
              <p className="text-xs text-slate-500">
                {formatTime(patrol.timestamp)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
