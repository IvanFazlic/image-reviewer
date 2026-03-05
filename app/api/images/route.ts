import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const watermarkedDir = path.join(process.cwd(), "public", "watermarked");
  const folders = fs.readdirSync(watermarkedDir).filter((f) =>
    fs.statSync(path.join(watermarkedDir, f)).isDirectory()
  );

  const images: { folder: string; filename: string; src: string }[] = [];

  for (const folder of folders) {
    const folderPath = path.join(watermarkedDir, folder);
    const files = fs.readdirSync(folderPath).filter((f) =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
    );
    for (const file of files) {
      images.push({
        folder,
        filename: file,
        src: `/watermarked/${folder}/${file}`,
      });
    }
  }

  return NextResponse.json({ folders, images });
}
