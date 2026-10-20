import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { resolve } from "node:path";
import postgres from "postgres";

const JSON_MARK = Symbol("sql.json");

type JsonValue = { [JSON_MARK]: true; value: unknown };

export type SqlClient = {
  <T = Record<string, unknown>[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  begin: <T>(fn: (tx: SqlClient) => Promise<T>) => Promise<T>;
  json: (value: unknown) => JsonValue;
  unsafe: (text: string) => Promise<unknown>;
  end: () => Promise<void>;
};

const driver = (process.env.DATABASE_DRIVER ?? "pglite").toLowerCase();
const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "./.pglite-data");

const g = globalThis as unknown as {
  ndcSql?: SqlClient;
  ndcPglite?: PGlite;
  ndcPg?: ReturnType<typeof postgres>;
  ndcInit?: Promise<SqlClient>;
};

function compile(strings: TemplateStringsArray, values: unknown[]) {
  let text = strings[0] ?? "";
  const params: unknown[] = [];
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    if (value && typeof value === "object" && JSON_MARK in (value as object)) {
      value = (value as JsonValue).value;
    }
    if (value === undefined) value = null;
    params.push(value);
    text += `$${params.length}${strings[i + 1] ?? ""}`;
  }
  return { text, params };
}

function plainRows<T>(rows: unknown): T {
  return JSON.parse(
    JSON.stringify(rows ?? [], (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  ) as T;
}

function fromPglite(pg: PGlite): SqlClient {
  const run = (async function sql<T = Record<string, unknown>[]>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) {
    const { text, params } = compile(strings, values);
    const result = await pg.query<Record<string, unknown>>(text, params);
    return plainRows<T>(result.rows);
  }) as SqlClient;

  run.begin = async (fn) =>
    pg.transaction(async (tx) => {
      const inner = (async function txSql<T = Record<string, unknown>[]>(
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) {
        const { text, params } = compile(strings, values);
        const result = await tx.query<Record<string, unknown>>(text, params);
        return plainRows<T>(result.rows);
      }) as SqlClient;
      inner.json = run.json;
      inner.unsafe = async (text) => tx.exec(text);
      inner.begin = run.begin;
      inner.end = async () => undefined;
      return fn(inner);
    });

  run.json = (value) => ({ [JSON_MARK]: true, value });
  run.unsafe = async (text) => pg.exec(text);
  run.end = async () => {
    await pg.close();
    g.ndcPglite = undefined;
    g.ndcSql = undefined;
  };
  return run;
}

function fromPostgres(client: ReturnType<typeof postgres>): SqlClient {
  const run = client as unknown as SqlClient;
  return run;
}

export async function getSql(): Promise<SqlClient> {
  if (g.ndcSql) return g.ndcSql;
  if (!g.ndcInit) g.ndcInit = initSql();
  return g.ndcInit;
}

async function initSql(): Promise<SqlClient> {
  if (driver === "postgres") {
    const url = process.env.DATABASE_URL ?? "postgres://ndc:ndc_local_dev@localhost:5432/ndc_naija";
    const client =
      g.ndcPg ??
      postgres(url, {
        max: 10,
        ssl: process.env.POSTGRES_SSL === "true" ? "require" : false,
        idle_timeout: 20,
        connect_timeout: 30,
      });
    g.ndcPg = client;
    g.ndcSql = fromPostgres(client);
    return g.ndcSql;
  }

  const pg =
    g.ndcPglite ??
    (await PGlite.create({
      dataDir,
      extensions: { citext, pgcrypto },
    }));
  g.ndcPglite = pg;
  g.ndcSql = fromPglite(pg);
  return g.ndcSql;
}

function mapJson(sql: SqlClient, values: unknown[]) {
  return values.map((value) => {
    if (value && typeof value === "object" && JSON_MARK in (value as object)) {
      return sql.json((value as JsonValue).value);
    }
    return value;
  });
}

export function sqlProxy(): SqlClient {
  const proxy = ((strings: TemplateStringsArray, ...values: unknown[]) =>
    getSql().then((s) => s(strings, ...mapJson(s, values)))) as SqlClient;
  proxy.begin = (fn) => getSql().then((s) => s.begin(fn));
  proxy.json = (value) => ({ [JSON_MARK]: true, value });
  proxy.unsafe = (text) => getSql().then((s) => s.unsafe(text));
  proxy.end = () => getSql().then((s) => s.end());
  return proxy;
}
