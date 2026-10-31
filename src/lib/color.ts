import sharp from "sharp";

export async function extractDominantColor(buffer: Buffer): Promise<string> {
  try {
    const { dominant } = await sharp(buffer).stats();
    if (dominant) {
      const r = dominant.r.toString(16).padStart(2, "0");
      const g = dominant.g.toString(16).padStart(2, "0");
      const b = dominant.b.toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  } catch (err) {
    console.error("Failed to extract dominant color:", err);
  }
  return "#c85a32";
}

export async function optimizeImageWebP(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .webp({ quality: 80 })
    .toBuffer();
}
