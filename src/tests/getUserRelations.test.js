import { describe, it, expect, beforeEach } from "vitest";
import { AccessControl } from "../routes/access.js";

//Creating a false database
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

//Creating a test Suite
describe("getUserRelations", () => {
  let db;
  let ac;
  // BeforeEach, resets db and ac before every test, so that the test is not affected by what a previous test did to them.
  beforeEach(() => {
    db = testDb();
    ac = new AccessControl(db);
  });

  it("returns objects that the user has access to", async () => {
    //Arrange
    await ac.addTuple("user:alice", "owner", "file:1");

    //Act
    const result = await ac.getUserRelations("user:alice");

    //Assert
    expect(result).toEqual([{ objectId: "file:1", relations: ["owner"] }]);
  });

  it("returns empty list if the user has no relations", async () => {
    //Arrange
    await ac.addTuple("user:bob", "owner", "file:2");

    // Act
    const result = await ac.getUserRelations("user:alice");

    //Assert
    expect(result).toEqual([]);
  });
});
