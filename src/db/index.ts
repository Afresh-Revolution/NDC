import { sqlProxy, type SqlClient } from "./engine";

export const sql = sqlProxy();
export type Sql = SqlClient;
