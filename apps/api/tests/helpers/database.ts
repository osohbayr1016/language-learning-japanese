import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
export function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON");
  const directory = new URL("../../migrations/", import.meta.url);
  for (const file of readdirSync(directory).sort())
    if (file.endsWith(".sql"))
      sqlite.exec(readFileSync(new URL(file, directory), "utf8"));
  sqlite.exec(
    "INSERT INTO users(id,email,password_hash,display_name) VALUES(1,'learner@example.test','test','Learner'),(2,'other@example.test','test','Other')",
  );
  function prepare(sql: string, values: unknown[] = []): any {
    return {
      bind: (...args: unknown[]) => prepare(sql, args),
      first: async () => sqlite.prepare(sql).get(...(values as any[])) ?? null,
      all: async () => ({
        results: sqlite.prepare(sql).all(...(values as any[])),
      }),
      run: async () => {
        const info = sqlite.prepare(sql).run(...(values as any[]));
        return {
          meta: {
            last_row_id: Number(info.lastInsertRowid),
            changes: Number(info.changes),
          },
        };
      },
    };
  }
  return {
    sqlite,
    db: {
      prepare,
      batch: async (statements: any[]) => {
        sqlite.exec("BEGIN");
        try {
          const results = [];
          for (const s of statements) results.push(await s.run());
          sqlite.exec("COMMIT");
          return results;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      },
    },
  };
}
