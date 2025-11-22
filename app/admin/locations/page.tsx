import ManageLocations from "@/components/admin/manage-locations";
import { prisma } from "@/lib/prisma";

export default async function AdminLocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: "desc" }
  });

  const parsed = locations.map((location) => ({
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    checklist: JSON.parse(location.checklist) as string[],
    createdAt: location.createdAt.toISOString()
  }));

  return <ManageLocations locations={parsed} />;
}
