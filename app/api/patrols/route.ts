import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuard } from "@/lib/auth-helpers";
import { haversineDistance } from "@/lib/utils";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET() {
  const { session, error } = await requireGuard();
  if (!session) return error;

  const today = startOfToday();
  const patrols = await prisma.patrol.findMany({
    where: { guardId: Number(session.user.id), timestamp: { gte: today } },
    include: {
      location: { select: { name: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  return NextResponse.json({
    completed: patrols.length,
    patrols
  });
}

export async function POST(request: Request) {
  const { session, error } = await requireGuard();
  if (!session) return error;

  const body = await request.json();
  const { locationId, latitude, longitude, responses, photoBase64 } = body;

  if (
    typeof locationId !== "number" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Array.isArray(responses)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId }
  });
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const distance = haversineDistance(
    latitude,
    longitude,
    location.latitude,
    location.longitude
  );

  if (distance > 50) {
    return NextResponse.json(
      { error: "Guard not near checkpoint" },
      { status: 400 }
    );
  }

  const patrol = await prisma.patrol.create({
    data: {
      guardId: Number(session.user.id),
      locationId,
      latitude,
      longitude,
      responses: JSON.stringify(responses),
      photoBase64
    }
  });

  return NextResponse.json(patrol, { status: 201 });
}
