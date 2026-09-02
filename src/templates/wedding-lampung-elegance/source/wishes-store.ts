import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const attendanceOptions = ["Hadir", "Belum pasti", "Berhalangan hadir"] as const;
export type Attendance = (typeof attendanceOptions)[number];

export type StoredWish = {
  id: string;
  name: string;
  message: string;
  attendance: Attendance;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "wishes.json");
let writeQueue: Promise<void> = Promise.resolve();

function isStoredWish(value: unknown): value is StoredWish {
  if (!value || typeof value !== "object") return false;
  const wish = value as Partial<StoredWish>;
  return Boolean(
    typeof wish.id === "string" &&
    typeof wish.name === "string" &&
    typeof wish.message === "string" &&
    typeof wish.createdAt === "string" &&
    attendanceOptions.includes(wish.attendance as Attendance),
  );
}

export async function readWishes(): Promise<StoredWish[]> {
  try {
    const contents = await readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed.filter(isStoredWish) : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }
}

export async function createWish(input: {
  name: string;
  message: string;
  attendance: Attendance;
}): Promise<StoredWish> {
  const wish: StoredWish = {
    id: randomUUID(),
    name: input.name,
    message: input.message,
    attendance: input.attendance,
    createdAt: new Date().toISOString(),
  };

  let releaseWrite: (() => void) | undefined;
  const previousWrite = writeQueue;
  writeQueue = new Promise<void>((resolve) => { releaseWrite = resolve; });

  await previousWrite;
  try {
    await mkdir(dataDirectory, { recursive: true });
    const wishes = await readWishes();
    wishes.unshift(wish);
    await writeFile(dataFile, `${JSON.stringify(wishes, null, 2)}\n`, "utf8");
  } finally {
    releaseWrite?.();
  }

  return wish;
}
