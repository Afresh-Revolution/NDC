import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getSql } from "./engine";

async function migrate() {
  const sql = await getSql();
  const schemaPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../supabase/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await sql.unsafe(schema);
  console.log("NDC schema applied.");
  await sql.end();
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
