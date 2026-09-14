import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    console.log(`[db:migrate:all] Running: ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`Command '${command} ${args.join(" ")}' failed with exit code ${code}`));
      }
    });

    proc.on("error", (err) => {
      rejectPromise(err);
    });
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("🚀 [db:migrate:all] Starting Database Migrations & Seeds");
  console.log("=======================================================\n");

  const cwd = resolve(__dirname, "..");

  try {
    // 1. Ensure database exists
    console.log("[db:migrate:all] Step 1: Ensuring database exists...");
    await runCommand("node", ["scripts/ensure-db.js"], { cwd });

    // 2. Run drizzle-kit migrate (applies all SQL migrations in ./drizzle folder)
    console.log("\n[db:migrate:all] Step 2: Running Drizzle migrations...");
    try {
      await runCommand("npx", ["drizzle-kit", "migrate"], { cwd });
    } catch (drizzleErr) {
      console.warn("\n[db:migrate:all] ⚠️ Note: drizzle-kit migrate encountered an error (e.g. existing tables/indexes). Proceeding with idempotent migration scripts...");
    }

    // 3. Ensure custom table definitions & column updates (idempotent)
    console.log("\n[db:migrate:all] Step 3: Running table migration scripts (payments, roots-admin, platform-settings, phase1, phase4)...");
    await runCommand("node", ["scripts/migrate-payments.js"], { cwd });
    await runCommand("node", ["scripts/migrate-roots-admin.js"], { cwd });
    await runCommand("node", ["scripts/migrate-platform-settings.js"], { cwd });
    await runCommand("node", ["scripts/migrate-phase1.js"], { cwd });
    await runCommand("node", ["scripts/migrate-phase4.js"], { cwd });

    // 4. Run automatic seeder (Bootstrap Roots Super Admin)
    console.log("\n[db:migrate:all] Step 4: Running automated seeders (Roots Admin)...");
    await runCommand("npm", ["run", "db:seed"], { cwd });

    console.log("\n=======================================================");
    console.log("✅ [db:migrate:all] All migrations & seeders completed successfully!");
    console.log("=======================================================\n");
  } catch (error) {
    console.error("\n❌ [db:migrate:all] Migration/Seed error:", error.message);
    process.exit(1);
  }
}

main();
