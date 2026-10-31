const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

async function seed() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding portfolio archive...");

  const catArchitecture = await prisma.category.upsert({
    where: { slug: "architecture" },
    update: { name: "Architecture", order: 0 },
    create: {
      name: "Architecture",
      slug: "architecture",
      order: 0,
    },
  });

  const catStreet = await prisma.category.upsert({
    where: { slug: "street-dusk" },
    update: { name: "Street & Dusk", order: 1 },
    create: {
      name: "Street & Dusk",
      slug: "street-dusk",
      order: 1,
    },
  });

  const catCoast = await prisma.category.upsert({
    where: { slug: "coast-land" },
    update: { name: "Coast & Land", order: 2 },
    create: {
      name: "Coast & Land",
      slug: "coast-land",
      order: 2,
    },
  });

  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {
      title: "Maren Lindqvist",
      tagline: "Color & Architectural Photographs",
      aboutText:
        "I photograph coastal harbors and twilight transit corridors on medium-format color negative film.",
      email: "studio@marenlindqvist.se",
    },
    create: {
      id: "default",
      title: "Maren Lindqvist",
      tagline: "Color & Architectural Photographs",
      aboutText:
        "I photograph coastal harbors and twilight transit corridors on medium-format color negative film.",
      email: "studio@marenlindqvist.se",
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
    },
  });

  const samplePhotos = [
    {
      title: "Manarola cliffside, late afternoon",
      description:
        "Fishermen haul blue skiffs onto the stone ramp under coral plaster walls at five.",
      url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#d96b4f",
      order: 0,
      isFeatured: true,
      exifCamera: "Hasselblad 500C/M",
      exifLens: "Planar 80mm f/2.8",
      exifAperture: "f/5.6",
      exifShutterSpeed: "1/250s",
      exifIso: "160",
      categoryId: catCoast.id,
    },
    {
      title: "Minato crossing after rain",
      description:
        "Commuters cross Shiba Park Avenue while red steel lattice reflects in a wet car roof.",
      url: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#c84638",
      order: 1,
      isFeatured: true,
      exifCamera: "Leica M6 TTL",
      exifLens: "Summilux-M 35mm f/1.4",
      exifAperture: "f/2.0",
      exifShutterSpeed: "1/125s",
      exifIso: "400",
      categoryId: catStreet.id,
    },
    {
      title: "Chaoyang skybridge at noon",
      description:
        "I framed the upper span from the courtyard floor against clear Beijing winter sky.",
      url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#2d648e",
      order: 2,
      isFeatured: true,
      exifCamera: "Mamiya 7 II",
      exifLens: "N 65mm f/4L",
      exifAperture: "f/8.0",
      exifShutterSpeed: "1/500s",
      exifIso: "160",
      categoryId: catArchitecture.id,
    },
    {
      title: "LaSalle Street, December dusk",
      description:
        "Cabs idle on salted slush in the limestone canyon south of the Board of Trade.",
      url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#c97a42",
      order: 3,
      isFeatured: false,
      exifCamera: "Leica MP",
      exifLens: "Summicron-M 50mm f/2",
      exifAperture: "f/2.8",
      exifShutterSpeed: "1/60s",
      exifIso: "800",
      categoryId: catStreet.id,
    },
    {
      title: "Ribeira quay, Porto",
      description:
        "Two timber rabelo boats swing at anchor below ochre and terracotta riverfront facades.",
      url: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#d48c32",
      order: 4,
      isFeatured: true,
      exifCamera: "Pentax 67II",
      exifLens: "SMC 105mm f/2.4",
      exifAperture: "f/5.6",
      exifShutterSpeed: "1/1000s",
      exifIso: "100",
      categoryId: catCoast.id,
    },
    {
      title: "Black Forest firs in morning mist",
      description:
        "I waited twenty minutes off the ridge trail for low sun to clear the wet spruce canopy.",
      url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
      dominantColor: "#3d6b4c",
      order: 5,
      isFeatured: false,
      exifCamera: "Hasselblad 500C/M",
      exifLens: "Distagon 50mm f/4",
      exifAperture: "f/4.0",
      exifShutterSpeed: "1/60s",
      exifIso: "400",
      categoryId: catCoast.id,
    },
  ];

  for (const item of samplePhotos) {
    const existing = await prisma.photo.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.photo.create({ data: item });
    }
  }

  console.log("Seeding completed.");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
