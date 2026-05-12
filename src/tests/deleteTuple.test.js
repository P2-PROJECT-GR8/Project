import { describe, it, expect, beforeEach } from "vitest";
import { AccessControl } from "../routes/access.js";

function testDb() {
  return {
    data: {
      tupleStore: { byObject: {}, bySubject: {} },
      schema: {},
    },
    read: async () => {},
    write: async () => {},
  };
}

describe("deleteTuple", () => {
  let db;
  let ac;

  beforeEach(() => {
    db = testDb();
    ac = new AccessControl(db);
  });

  it("removes tuple from byObject", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    await ac.deleteTuple("user:alice", "owner", "file:1");

    // Assert
    expect(db.data.tupleStore.byObject["file:1"]).toBeUndefined();
  });

  it("removes tuple from bySubject", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");

    // Act
    await ac.deleteTuple("user:alice", "owner", "file:1");

    // Assert
    expect(db.data.tupleStore.bySubject["user:alice"]).toBeUndefined();
  });

  it("only removes the correct tuple from byObject", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:bob", "viewer", "file:1");

    // Act
    await ac.deleteTuple("user:alice", "owner", "file:1");

    // Assert
    expect(db.data.tupleStore.byObject["file:1"]).toEqual([
      { subjectId: "user:bob", relation: "viewer" },
    ]);
  });

  it("only removes the correct tuple from bySubject", async () => {
    // Arrange
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:bob", "viewer", "file:1");

    // Act
    await ac.deleteTuple("user:alice", "owner", "file:1");

    // Assert
    expect(db.data.tupleStore.bySubject["user:bob"]).toEqual([
      { relation: "viewer", objectId: "file:1" },
    ]);
  });
});
