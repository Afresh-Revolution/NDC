import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSql } from "./engine";

async function migrate() {
  const sql = await getSql();
  const schemaPath = resolve(import.meta.dir, "../../supabase/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await sql.unsafe(schema);
  console.log("NDC schema applied.");
  await sql.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
