import ManageGuards from "@/components/admin/manage-guards";
import { prisma } from "@/lib/prisma";

export default async function AdminGuardsPage() {
  const guards = await prisma.user.findMany({
    where: { role: "GUARD" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true
    }
  });

  const formatted = guards.map((guard) => ({
    ...guard,
    createdAt: guard.createdAt.toISOString()
  }));

  return <ManageGuards guards={formatted} />;
}
