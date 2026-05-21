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

    const result = await ac.can("user1", "write", "file:1", true);

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
    expect(result).toBe(true);
    expect(ac.log).toHaveBeenCalledWith("viewer", "write", "file:1", true);
  });
});

// Tests for the expandUserRelations function
describe("expandUserRelations", () => {
  it("return _expand", async () => {
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
    const ac = new AccessControl(fakeDb);
    // act
    ac._expand = vi.fn().mockResolvedValue(["owner"]);
    const result = await ac.expandUserRelations("user1", "file:1");
    //assert
    expect(result).toEqual(["owner"]);
  });

  it("remove duplicates", async () => {
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
    const ac = new AccessControl(fakeDb);
    // act
    ac._expand = vi.fn().mockResolvedValue(["owner", "owner", "viewer"]);
    const result = await ac.expandUserRelations("user1", "file:1");
    // assert
    expect(result).toEqual(["owner", "viewer"]);
  });

  it("call _expand correctly", async () => {
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
    const ac = new AccessControl(fakeDb);
    // act
    ac._expand = vi.fn().mockResolvedValue(["owner"]);
    const result = await ac.expandUserRelations("user1", "file:1");
    // assert
    expect(ac._expand).toHaveBeenCalledWith("user1", "file:1");
  });

  it("Test for en empty set", async () => {
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
    const ac = new AccessControl(fakeDb);
    // act
    ac._expand = vi.fn().mockResolvedValue([]);
    const result = await ac.expandUserRelations("user1", "file:1");
    // assert
    expect(result).toEqual([]);
  });
});

describe("expand function", () => {
  it("Direct relation to an object", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          byObject: {
            "file:1": [{ subjectId: "user:1", relation: "owner" }],
          },
          file: {
            relations: {
              owner: ["read", "write", "viewer"],
            },
          },
        },
      },
    };
    const ac = new AccessControl(fakeDb);
    // act
    ac._getSubjectGroups = vi.fn().mockReturnValue(new Set());
    const result = await ac._expand("user:1", "file:1");
    // assert
    expect(result).toEqual(["owner"]);
  });

  it("Inherited via a parent", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          byObject: {
            "file:1": [{ subjectId: "folder:1", relation: "parent" }],
            "folder:1": [{ subjectId: "user:1", relation: "viewer" }],
          },
          file: {
            relations: {
              owner: ["read", "write", "viewer"],
            },
          },
        },
      },
    };
    const ac = new AccessControl(fakeDb);
    // act
    ac._getSubjectGroups = vi.fn().mockReturnValue(new Set());
    const result = await ac._expand("user:1", "file:1");
    // assert
    expect(result).toEqual(["viewer"]);
  });

  it("Ignore unrealted users", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          byObject: {
            "file:1": [{ subjectId: "user:2", relation: "owner" }],
          },
          file: {
            relations: {
              owner: ["read", "write", "viewer"],
            },
          },
        },
      },
    };
    const ac = new AccessControl(fakeDb);
    // act
    ac._getSubjectGroups = vi.fn().mockReturnValue(new Set());
    const result = await ac._expand(["user:1", "file:1"]);
    // assert
    expect(result).toEqual([]);
  });

  it("Prevent infinite loops", async () => {
    // arrange
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          byObject: {
            "file:1": [{ subjectId: "folder:1", relation: "parent" }],
            "folder:1": [
              { subjectId: "user:1", relation: "viewer" },
              { subjectId: "file:1", relation: "parent" },
            ],
          },
          file: {
            relations: {
              owner: ["read", "write", "viewer"],
            },
          },
        },
      },
    };
    const ac = new AccessControl(fakeDb);
    // act
    ac._getSubjectGroups = vi.fn().mockReturnValue(new Set());
    const result = await ac._expand("user:1", "file:1");
    // assert
    expect(result).toEqual(["viewer"]);
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

    const paths = await ac.locatePaths(
      "user:testUser",
      "file:testfile",
      "pathsToTarget",
    );

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
                relation: "parent",
              },
              {
                subjectId: "user:testuser",
                relation: "viewer",
              },
            ],
            "folder:testfolder": [
              {
                subjectId: "user:testuser",
                relation: "owner",
              },
            ],
          },
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const paths = await ac.locatePaths(
      "file:testfile",
      null,
      "pathsFromTarget",
    );

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
          byObject: {},
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
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const paths = await ac.locatePaths("testuser", "testfile");

    expect(paths.length).toEqual(0);
    expect(paths).toBeInstanceOf(Array);
    expect(paths).toEqual([]);
  });
});

// _getSubjectGroups

describe("_getSubjectGroups functions", () => {
  it("should return a set of groups that a user is part of", () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {
            "user:testuser": [
              {
                relation: "member",
                objectId: "group:group1",
              },
              {
                relation: "member",
                objectId: "group:group2",
              },
            ],
          },
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const groups = ac._getSubjectGroups("user:testuser");

    expect(groups.size).toBeGreaterThan(0);
    expect(groups).toBeDefined();
    expect(groups).toBeInstanceOf(Set);
    expect(groups).toEqual(new Set(["group:group1", "group:group2"]));
  });
  it("should treat a user who owns a group as part of that group", () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {
            "user:testuser": [
              {
                relation: "owner",
                objectId: "group:group1",
              },
            ],
          },
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const groups = ac._getSubjectGroups("user:testuser");

    expect(groups).toEqual(new Set(["group:group1"]));
  });
  it("should return an empty set if no groups are found", () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {},
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const groups = ac._getSubjectGroups("user:testuser");

    expect(groups).toBeDefined();
    expect(groups).toBeInstanceOf(Set);
    expect(groups.size).toEqual(0);
    expect(groups).toEqual(new Set([]));
  });
  it("should return an empty set if it recieves invaid arguments", () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {
            "user:testuser": [
              {
                relation: "member",
                objectId: "group:group1",
              },
            ],
          },
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const groups = ac._getSubjectGroups("testuser");

    expect(groups).toBeDefined();
    expect(groups.size).toEqual(0);
    expect(groups).toBeInstanceOf(Set);
    expect(groups).toEqual(new Set([]));
  });
  it("should return a list of groups that group is member of", () => {
    const fakeDb = {
      read: vi.fn(),
      data: {
        tupleStore: {
          bySubject: {
            "group:testgroup": [
              {
                relation: "member",
                objectId: "group:group2",
              },
              {
                relation: "member",
                objectId: "group:testgroup",
              },
            ],
            "group:group2": [
              {
                relation: "member",
                objectId: "group:group3",
              },
            ],
          },
          byObject: {},
        },
      },
    };

    const ac = new AccessControl(fakeDb);

    const groups = ac._getSubjectGroups("group:testgroup");

    expect(groups).toBeDefined();
    expect(groups.size).toBeGreaterThan(0);
    expect(groups).toBeInstanceOf(Set);
    expect(groups).toEqual(new Set(["group:group2", "group:group3"]));
  });
});
