import { v2 as cloudinary } from "cloudinary";

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { isConfigured as isCloudinaryConfigured };

export async function uploadToCloudinary(buffer: Buffer): Promise<{ url: string; dominantColor: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "portfolio",
        colors: true,
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        let dominantColor = "#1a1a1a";
        if (result.colors && result.colors.length > 0) {
          dominantColor = result.colors[0][0];
        }
        resolve({
          url: result.secure_url,
          dominantColor,
        });
      }
    );
    uploadStream.end(buffer);
  });
}
