import { describe, test, expect, it, vi, expectTypeOf } from "vitest";
import path, { relative } from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from "lowdb/node";
import { AccessControl } from "../routes/access.js";


// can function

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


// locatePaths

describe("locatePaths", () => {
  it("returns an array of paths from user to object if paths are found", async () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {
            "user:testUser": [
              {
                relation: "owner",
                objectId: "folder:testfolder",
              },
            ],
            "folder:testfolder": [
              {
                relation: "parent",
                objectId: "file:testfile",
              },
            ],
          },
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const paths = await ac.locatePaths("user:testUser", "file:testfile");

    // assert
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toBeInstanceOf(Array);
    expect(paths[0]).toBeTypeOf("object");


  expect(paths).toEqual([
    [
      {
        from: "user:testUser",
        relation: "owner",
        to: "folder:testfolder",
      },
      {
        from: "folder:testfolder",
        relation: "parent",
        to: "file:testfile",
      },
    ],
  ]);

  });

  it("returns an array all paths from an object to users that are related to it", async () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {},
          byObject: {
            "file:testfile": [
              {
                subjectId: "folder:testfolder",
                relation: "parent"
              },
              {
                subjectId: "user:testuser",
                relation: "viewer"
              },
            ],
            "folder:testfolder": 
          [
            {
              subjectId: "user:testuser",
              relation: "owner"
            }
          ]
          },
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const paths = await ac.locatePaths("file:testfile", null);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toBeInstanceOf(Array);
    expect(paths[0]).toBeTypeOf("object");

    
    expect(paths).toEqual([
      [
        {
          from: "file:testfile",
          relation: "parent",
          to: "folder:testfolder",
        },
        {
          from: "folder:testfolder",
          relation: "owner",
          to: "user:testuser",
        },
      ],
      [
        {
          from: "file:testfile",
          relation: "viewer",
          to: "user:testuser",
        },
      ],
    ]);
  });

  it("returns an empty array if no path is able to be located", async () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {},
          byObject: {}
        },
      },
    };
  

  const ac = new AccessControl(fakeDb);

  const paths = await ac.locatePaths("user:testuser", "file:testfile");

  expect(paths.length).toEqual(0);
  expect(paths).toBeInstanceOf(Array);
  expect(paths).toEqual([]);
  });

  it("if called without proper prefix should return empty array", async () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {},
          byObject: {}
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const paths = await ac.locatePaths("testuser", "testfile" )

    expect(paths.length).toEqual(0);
    expect(paths).toBeInstanceOf(Array);
    expect(paths).toEqual([]);

  })



});




