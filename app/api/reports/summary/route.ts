import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

function range(dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: Request) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date") ?? undefined;
  const { start, end } = range(dateStr);

  const guards = await prisma.user.findMany({
    where: { role: "GUARD" },
    select: { id: true, name: true, username: true }
  });

  const patrols = await prisma.patrol.findMany({
    where: { timestamp: { gte: start, lte: end } },
    include: {
      guard: { select: { id: true, name: true } },
      location: { select: { name: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  const expected = guards.length * 5;
  const completed = patrols.length;
  const missed = Math.max(expected - completed, 0);

  const byGuard = guards.map((guard) => {
    const guardPatrols = patrols.filter((patrol) => patrol.guard.id === guard.id);
    return {
      guardId: guard.id,
      guardName: guard.name,
      patrols: guardPatrols.length
    };
  });

  return NextResponse.json({
    date: start.toISOString(),
    expected,
    completed,
    missed,
    byGuard,
    patrols: patrols.map((patrol) => ({
      id: patrol.id,
      guardName: patrol.guard.name,
      locationName: patrol.location.name,
      timestamp: patrol.timestamp,
      latitude: patrol.latitude,
      longitude: patrol.longitude,
      responses: JSON.parse(patrol.responses) as any[],
      photoBase64: patrol.photoBase64
    }))
  });
}
