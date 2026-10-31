import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminLoginClient from "@/components/adminloginclient";
import AdminDashboardClient from "@/components/admindashboardclient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLoginClient />;
  }

  const [photos, categories, siteConfig] = await Promise.all([
    prisma.photo.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { category: true },
    }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.siteConfig.findFirst({
      where: { id: "default" },
    }),
  ]);

  return (
    <AdminDashboardClient
      initialPhotos={photos}
      categories={categories}
      siteConfig={siteConfig || {}}
    />
  );
}
