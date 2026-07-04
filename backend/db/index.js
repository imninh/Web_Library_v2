/* Adapter Postgres (Supabase) - interface async: query/get/run/tx/init.
   Tự dịch cú pháp kiểu SQLite sang Postgres để hạn chế sửa câu SQL:
   - "?"                       -> $1,$2,...
   - datetime('now')           -> now()
   - datetime('now','-7 day')  -> (now() + interval '-7 day')
   - datetime('now', ?)        -> now() + ($n)::interval
   - INSERT ... (không RETURNING) -> tự thêm "RETURNING id" để lấy lastId
*/
"use strict";
const { Pool, types } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

// bigint (COUNT) trả về number thay vì string
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5
});

let txClient = null; // client đang trong transaction (app đơn luồng, tải thấp)

function translate(sql) {
  sql = sql.replace(/datetime\('now',\s*'([^']+)'\)/g, (m, spec) => `(now() + interval '${spec}')`);
  sql = sql.replace(/datetime\('now',\s*\?\)/g, "now() + (?)::interval");
  sql = sql.replace(/datetime\('now'\)/g, "now()");
  let i = 0;
  sql = sql.replace(/\?/g, () => "$" + (++i));
  return sql;
}

async function query(sql, params = []) {
  const runner = txClient || pool;
  const res = await runner.query(translate(sql), params);
  return res.rows;
}
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}
async function run(sql, params = []) {
  let text = translate(sql);
  const isInsert = /^\s*insert\s/i.test(text) && !/returning/i.test(text);
  if (isInsert) text += " RETURNING id";
  const runner = txClient || pool;
  const res = await runner.query(text, params);
  return { changes: res.rowCount, lastId: isInsert && res.rows[0] ? res.rows[0].id : undefined };
}
async function tx(fn) {
  const client = await pool.connect();
  txClient = client;
  try {
    await client.query("BEGIN");
    const r = await fn();
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    txClient = null;
    client.release();
  }
}
async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
}

module.exports = { init, query, get, run, tx, pool, adapter: "postgres" };
