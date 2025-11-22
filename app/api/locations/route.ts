import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

function serializeLocation(location: {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  checklist: string;
  createdAt: Date;
}) {
  return {
    ...location,
    checklist: JSON.parse(location.checklist) as string[]
  };
}

export async function GET() {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const locations = await prisma.location.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(locations.map(serializeLocation));
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const data = await request.json();
  const { name, latitude, longitude, checklist } = data;
  if (
    !name ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Array.isArray(checklist)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const location = await prisma.location.create({
    data: {
      name,
      latitude,
      longitude,
      checklist: JSON.stringify(checklist)
    }
  });
  return NextResponse.json(serializeLocation(location), { status: 201 });
}
