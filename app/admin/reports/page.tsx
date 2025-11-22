import ReportsDashboard from "@/components/admin/reports-dashboard";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export default async function AdminReportsPage() {
  const today = startOfToday();

  const guards = await prisma.user.findMany({
    where: { role: "GUARD" },
    select: { id: true, name: true }
  });

  const patrols = await prisma.patrol.findMany({
    where: { timestamp: { gte: today } },
    include: {
      guard: { select: { name: true } },
      location: { select: { name: true } }
    },
    orderBy: { timestamp: "desc" }
  });

  const expected = guards.length * 5;
  const completed = patrols.length;

  const byGuard = guards.map((guard) => {
    const guardPatrols = patrols.filter((patrol) => patrol.guard.name === guard.name);
    return {
      guardId: guard.id,
      guardName: guard.name,
      patrols: guardPatrols.length
    };
  });

  const initialData = {
    date: today.toISOString(),
    expected,
    completed,
    missed: Math.max(expected - completed, 0),
    byGuard,
    patrols: patrols.map((patrol) => ({
      id: patrol.id,
      guardName: patrol.guard.name,
      locationName: patrol.location.name,
      timestamp: patrol.timestamp.toISOString(),
      responses: JSON.parse(patrol.responses) as any[],
      photoBase64: patrol.photoBase64
    }))
  };

  return <ReportsDashboard initialData={initialData} />;
}
