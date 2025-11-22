import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

function getDateRange(dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function toCsv(rows: any[]) {
  const headers = [
    "Patrol ID",
    "Guard Name",
    "Location",
    "Timestamp",
    "Latitude",
    "Longitude",
    "Checklist Responses",
    "Has Photo"
  ];
  const csvRows = rows.map((row) => {
    return [
      row.id,
      row.guardName,
      row.locationName,
      row.timestamp.toISOString(),
      row.latitude,
      row.longitude,
      row.responses,
      row.photoBase64 ? "Yes" : "No"
    ]
      .map((value: any) => {
        const stringValue = String(value ?? "");
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });
  return [headers.join(","), ...csvRows].join("\n");
}

export async function GET(request: Request) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") ?? undefined;
  const { start, end } = getDateRange(dateParam);

  const patrols = await prisma.patrol.findMany({
    where: {
      timestamp: { gte: start, lte: end }
    },
    include: {
      guard: { select: { name: true } },
      location: { select: { name: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  const rows = patrols.map((patrol) => ({
    id: patrol.id,
    guardName: patrol.guard.name,
    locationName: patrol.location.name,
    timestamp: patrol.timestamp,
    latitude: patrol.latitude,
    longitude: patrol.longitude,
    responses: patrol.responses,
    photoBase64: patrol.photoBase64
  }));

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="daily-report-${start
        .toISOString()
        .slice(0, 10)}.csv"`
    }
  });
}
