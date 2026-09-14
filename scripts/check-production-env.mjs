import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const errors = [];
const warnings = [];

function requireValue(name, minimumLength = 1) {
  const value = process.env[name]?.trim();
  if (!value || value.length < minimumLength) {
    errors.push(`${name} wajib diisi${minimumLength > 1 ? ` (minimal ${minimumLength} karakter)` : ""}.`);
  }
  return value;
}

function validateUrl(name, protocols) {
  const value = requireValue(name);
  if (!value) return;
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol)) errors.push(`${name} harus memakai ${protocols.join(" atau ")}.`);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") errors.push(`${name} tidak boleh memakai localhost di produksi.`);
  } catch {
    errors.push(`${name} harus berupa URL yang valid.`);
  }
}

validateUrl("NEXT_PUBLIC_APP_URL", ["https:"]);
validateUrl("PAYMENT_GATEWAY_SERVICE_URL", ["http:", "https:"]);
requireValue("ROOT_DOMAIN");
requireValue("EDIT_TOKEN_SECRET", 32);
requireValue("PAYMENT_CALLBACK_SECRET", 32);
requireValue("SUB_MERCHANT_ID");
if (!process.env.ROOTS_BOOTSTRAP_PASSWORD?.trim()) {
  warnings.push("ROOTS_BOOTSTRAP_PASSWORD kosong; seed Roots menggunakan password awal default dan wajib diganti saat login pertama.");
}
requireValue("MYSQL_HOST");
requireValue("MYSQL_DATABASE");
requireValue("MYSQL_USER");
requireValue("COLLAB_ALLOWED_ORIGIN");
validateUrl("NEXT_PUBLIC_COLLAB_WS_URL", ["wss:"]);

if (!process.env.GOOGLE_CLIENT_ID?.trim() || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
  warnings.push("Google OAuth belum lengkap; login Google tidak akan tersedia.");
}

if (errors.length) {
  console.error("\nKonfigurasi produksi belum siap:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Konfigurasi produksi inti sudah valid.");
warnings.forEach((warning) => console.warn(`Peringatan: ${warning}`));
