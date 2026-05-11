import { describe, test, expect, beforeEach } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from "lowdb/node";
import { AccessControl } from "../routes/access.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import current database
const db = await JSONFilePreset(path.join(__dirname, "..", "data", "db.json"), {
  users: [{ id: "", name: "" }],
  tupleStore: {
    byObject: {},
    bySubject: {},
  },
  schema: { definitions: {} },
  logs: {
    byObject: {},
    bySubject: {},
  },
});

describe("locatePaths", () => {
  test("returns an array of object descirbing a path from user to object", async () => {
    const path = await AccessControl.locatePaths("user:magnus", "folder:admin");
    expect(path[0].relation).toBe("owner");
  });
});
