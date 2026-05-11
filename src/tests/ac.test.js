import { describe, test, expect, it, vi } from "vitest";
import path, { relative } from "path";
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

/*describe("locatePaths", () => {
  test("returns an array of object descirbing a path from user to object", async () => {
    const path = await AccessControl.locatePaths("user:magnus", "folder:admin");
    expect(path[0].relation).toBe("owner");
  });
});*/

describe("can functions", () => {
  it("returns true when a user has permission", async () => {
    // arrange
    // mock the different functions and the database
    const fakeDb = {
      read: vi.fn(),
      data: {
        schema: {
          file: {
            relations: {
              owner: ["read", "write"],
            },
          },
        },
      },
    };

    // act
    const ac = new AccessControl(fakeDb);

    ac.expandUserRelations = vi.fn().mockResolvedValue(["owner"]);
    ac.log = vi.fn();

    const result = await ac.can("user1", "write", "file:1");

    //assert
    expect(result).toBe(true);
    expect(ac.log).toHaveBeenCalledWith("user1", "write", "file:1", true);
  });

  it("returns false when the user doesn't have permission", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        schema: {
          file: {
            relations: {
              owner: ["read", "write"],
            },
          },
        },
      },
    };
    // act
    const ac = new AccessControl(fakeDb);

    ac.expandUserRelations = vi.fn().mockResolvedValue(["viewer"]);
    ac.log = vi.fn();

    const result = await ac.can("user1", "write", "file:1", false);
    // assert
    expect(result).toBe(false);
    expect(ac.log).toHaveBeenCalledWith("user1", "write", "file:1", false);
  });

  it("returns false for unknown relations", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        schema: {
          file: {
            relations: {
              owner: ["read", "write"],
            },
          },
        },
      },
    };
    // act
    const ac = new AccessControl(fakeDb);

    ac.expandUserRelations = vi.fn().mockResolvedValue(["ghost"]);
    ac.log = vi.fn();

    const result = await ac.can("ghost", "read", "file:1", false);
    // assert
    expect(result).toBe(false);
    expect(ac.log).toHaveBeenCalledWith("ghost", "read", "file:1", false);
  });

  it("returns true if one or more roles allow it", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        schema: {
          file: {
            relations: {
              owner: ["read", "write"],
            },
          },
        },
      },
    };
    // act
    const ac = new AccessControl(fakeDb);

    ac.expandUserRelations = vi.fn().mockResolvedValue(["viewer", "owner"]);
    ac.log = vi.fn();

    const result = await ac.can("viewer", "write", "file:1", true);
    // assert
  });
});
