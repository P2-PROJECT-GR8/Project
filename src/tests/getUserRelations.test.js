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
describe("getUserRelations", () => {
  let db;
  let ac;

  beforeEach(() => {
    db = testDb();
    ac = new AccessControl(db);
  });

  it("returns objects that the user has access to", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    const result = await ac.getUserRelations("user:alice");

    // Assert
    expect(result).toEqual([{ objectId: "file:1", relations: ["owner"] }]);
  });

  it("returns empty list if the user has no relations", async () => {
    // Arrange
    await ac.addTuple("user:bob", "owner", "file:2");

    // Act
    const result = await ac.getUserRelations("user:alice");

    // Assert
    expect(result).toEqual([]);
  });

  it("returns correct relations for each object", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:alice", "viewer", "file:2");

    // Act
    const result = await ac.getUserRelations("user:alice");

    // Assert
    expect(result).toEqual([
      { objectId: "file:1", relations: ["owner"] },
      { objectId: "file:2", relations: ["viewer"] },
    ]);
  });

  it("does not return groups in the result", async () => {
    // Arrange
    await ac.addTuple("user:alice", "member", "group:editors");
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    const result = await ac.getUserRelations("user:alice");

    // Assert
    expect(result).toEqual([{ objectId: "file:1", relations: ["owner"] }]);
  });
});
