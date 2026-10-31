import { prisma } from "@/lib/db";
import MainPortfolioClient from "@/components/mainportfolioclient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [photos, categories, siteConfig] = await Promise.all([
    prisma.photo.findMany({
      where: { isHidden: false },
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
    <MainPortfolioClient
      initialPhotos={photos}
      categories={categories}
      siteConfig={siteConfig || undefined}
    />
  );
}
