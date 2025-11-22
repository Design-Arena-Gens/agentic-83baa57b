import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

function serialize(location: {
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const locationId = Number(params.id);
  const data = await request.json();
  const { name, latitude, longitude, checklist } = data;

  const payload: {
    name?: string;
    latitude?: number;
    longitude?: number;
    checklist?: string;
  } = {};

  if (name) payload.name = name;
  if (typeof latitude === "number") payload.latitude = latitude;
  if (typeof longitude === "number") payload.longitude = longitude;
  if (Array.isArray(checklist)) payload.checklist = JSON.stringify(checklist);

  const location = await prisma.location.update({
    where: { id: locationId },
    data: payload
  });
  return NextResponse.json(serialize(location));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const locationId = Number(params.id);
  await prisma.patrol.deleteMany({ where: { locationId } });
  await prisma.location.delete({ where: { id: locationId } });
  return NextResponse.json({ success: true });
}
