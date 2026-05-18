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
describe("addTuple", () => {
  let db;
  let ac;
  // BeforeEach, resets db and ac before every test, so that the test is not affected by what a previous test did to them.
  beforeEach(() => {
    db = testDb();
    ac = new AccessControl(db);
  });

  it("adds tuple to byObject", async () => {
    //Act
    await ac.addTuple("user:alice", "owner", "file:1");

    //Assert
    expect(db.data.tupleStore.byObject["file:1"]).toEqual([
      { subjectId: "user:alice", relation: "owner" },
    ]);
  });

  it("adds tuple to bySubject", async () => {
    //Act
    await ac.addTuple("user:alice", "owner", "file:1");

    //Assert
    expect(db.data.tupleStore.bySubject["user:alice"]).toEqual([
      { relation: "owner", objectId: "file:1" },
    ]);
  });
});
