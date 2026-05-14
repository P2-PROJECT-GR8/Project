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

  it("Does not add duplicate to byObject", async () => {
    //act: here we call addtuple two times
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:alice", "owner", "file:1");

    //Assert
    expect(db.data.tupleStore.byObject["file:1"]).toHaveLength(1);
  });

  it("Does not add duplicate to bySubject", async () => {
    //act : here we call addtuple two times
    await ac.addTuple("user:alice", "owner", "file:1");
    await ac.addTuple("user:alice", "owner", "file:1");

    //Assert

    expect(db.data.tupleStore.bySubject["user:alice"]).toHaveLength(1);
  });
});
