import GuardDashboard from "@/components/guard/guard-dashboard";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export default async function GuardPage() {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" }
  });
  const parsedLocations = locations.map((location) => ({
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    checklist: JSON.parse(location.checklist) as string[]
  }));

  const today = startOfToday();
  const patrols = await prisma.patrol.findMany({
    where: { guardId: Number(session.user.id), timestamp: { gte: today } },
    include: {
      location: { select: { name: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  return (
    <GuardDashboard
      guardName={session.user.name ?? session.user.username}
      locations={parsedLocations}
      initialPatrols={patrols.map((patrol) => ({
        id: patrol.id,
        timestamp: patrol.timestamp.toISOString(),
        location: patrol.location
      }))}
    />
  );
}
