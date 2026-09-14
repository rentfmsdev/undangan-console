import "server-only";
import crypto from "node:crypto";

const SCRYPT_KEYLEN = 64;

/**
 * Menghasilkan salt acak berbasis kriptografi aman.
 */
export function generatePasswordSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Melakukan hashing password menggunakan scrypt dengan salt acak.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize("NFKC"), salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Memverifikasi kecocokan password secara konstan waktu (timing-safe).
 */
export async function verifyPassword(password: string, salt: string, storedHashHex: string): Promise<boolean> {
  try {
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password.normalize("NFKC"), salt, SCRYPT_KEYLEN, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      });
    });

    const storedHashBuf = Buffer.from(storedHashHex, "hex");
    if (storedHashBuf.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedHashBuf, derivedKey);
  } catch {
    return false;
  }
}

// Dummy salt & hash untuk mencegah timing attack saat username tidak ditemukan
const DUMMY_SALT = "0123456789abcdef0123456789abcdef";
const DUMMY_HASH = "0".repeat(SCRYPT_KEYLEN * 2);

/**
 * Menjalankan kalkulasi hash dummy untuk mencegah timing attack (user enumeration).
 */
export async function dummyVerifyPassword(password: string): Promise<boolean> {
  await verifyPassword(password, DUMMY_SALT, DUMMY_HASH);
  return false;
}
