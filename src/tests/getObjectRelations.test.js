import { describe, it, expect, beforeEach, vi } from "vitest";
import { AccessControl } from "../routes/access.js";

//Creating a false database
function testDb() {
  return {
    data: {
      tupleStore: { byObject: {}, bySubject: {} },
      schema: {},
    },
    read: vi.fn(),
    write: vi.fn(),
  };
}

//Creating a test Suite
describe("getObjectRelations", () => {
  let db;
  let ac;

  beforeEach(() => {
    db = testDb();
    ac = new AccessControl(db);
  });

  it("returns users that have access to the object", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    const result = await ac.getObjectRelations("file:1");

    // Assert
    expect(result).toEqual([{ subjectId: "user:alice", relations: ["owner"] }]);
  });

  it("returns empty list if no users have access", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:2");

    // Act
    const result = await ac.getObjectRelations("file:1");

    // Assert
    expect(result).toEqual([]);
  });

  it("returns correct relations for each user", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:bob", "viewer", "file:1");

    // Act
    const result = await ac.getObjectRelations("file:1");

    // Assert
    expect(result).toEqual([
      { subjectId: "user:alice", relations: ["owner"] },
      { subjectId: "user:bob", relations: ["viewer"] },
    ]);
  });

  it("does not return groups in the result", async () => {
    // Arrange
    await ac.addTuple("group:editors", "editor", "file:1");
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    const result = await ac.getObjectRelations("file:1");

    // Assert
    expect(result).toEqual([{ subjectId: "user:alice", relations: ["owner"] }]);
  });
});
