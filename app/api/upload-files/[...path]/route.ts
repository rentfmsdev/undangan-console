import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif|mp3|m4a|ogg|webm)$/i;
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

function notFound() {
  return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
}

function parseRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return undefined;

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return undefined;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return undefined;
  }
  return { start, end: Math.min(end, size - 1) };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  const fileName = segments.at(-1) ?? "";
  const directorySegments = segments.slice(0, -1);
  if (
    (directorySegments.length !== 1 && directorySegments.length !== 2) ||
    directorySegments.some((segment) => !UUID_PATTERN.test(segment)) ||
    !FILE_PATTERN.test(fileName)
  ) {
    return notFound();
  }

  const uploadRoot = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadRoot, ...segments);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return notFound();

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return notFound();
    const extension = path.extname(filePath).slice(1).toLowerCase();
    const headers = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
    };
    const range = parseRange(request.headers.get("range"), fileStat.size);

    if (range === undefined) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${fileStat.size}` },
      });
    }
    if (range) {
      const length = range.end - range.start + 1;
      const buffer = Buffer.allocUnsafe(length);
      const handle = await open(filePath, "r");
      try {
        await handle.read(buffer, 0, length, range.start);
      } finally {
        await handle.close();
      }
      return new NextResponse(buffer, {
        status: 206,
        headers: {
          ...headers,
          "Content-Length": String(length),
          "Content-Range": `bytes ${range.start}-${range.end}/${fileStat.size}`,
        },
      });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { ...headers, "Content-Length": String(fileStat.size) },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return notFound();
    throw error;
  }
}
