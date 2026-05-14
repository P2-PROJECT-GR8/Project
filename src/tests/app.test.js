import {
  describe,
  test,
  expect,
  it,
  vi,
  expectTypeOf,
  beforeEach,
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { AccessControl } from "../routes/access.js";

// mock db

// hoisted to ensure fakedb initilaziation
const fakeDb = vi.hoisted(() => ({
  data: {
    users: [],
    tupleStore: {
      byObject: {},
      bySubject: {},
    },
    schema: { file: { relations: {} } },
    logs: { byObject: {}, bySubject: {} },
  },
  read: async () => {},
  write: async () => {},
  update: async (fn) => fn(fakeDb.data),
}));

vi.mock("lowdb/node", async () => ({
  JSONFilePreset: vi.fn(async () => fakeDb),
}));

// must be imported afer mock of lowdb
import { app } from "../app.js";

beforeEach(() => {
  fakeDb.data.users = [];
  fakeDb.data.tupleStore.byObject = {};
  fakeDb.data.tupleStore.bySubject = {};
  fakeDb.data.schema.file.relations = {};
  fakeDb.data.logs.byObject = {};
  fakeDb.data.logs.bySubject = {};

  vi.resetAllMocks();
});

// tests

// login

describe("login test", () => {
  it("returns a message and session jwt token when sent a userName", async () => {
    //initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    //console.log(fakeDb.data.users);

    const res = await request(app)
      .post("/login")
      .send({ userName: "Testuser" });

    // assert

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged in as testuser");

    // cookie and token
    const cookie = res.headers["set-cookie"][0];

    expect(cookie).toBeDefined();

    const token = cookie.split("sessionToken=")[1].split(";")[0];
    //const token = res.cookie.sessionToken;
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, "rtKaslL6w4B9in");
    expect(decoded).toBeDefined();
    expect(decoded.userId).toEqual("user:testuser");
  });

  it("return status of 404 if username isnt found", async () => {
    const res = await request(app)
      .post("/login")
      .send({ userName: "TestUser" });

    //assert
    expect(res.status).toBe(404);
    expect(res.body.message).toEqual("Username not found");
  });

  it("should respond with status 400 if no username is recieved", async () => {
    const res = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ userName: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toEqual("Username is missing");
  });
  it("should return status 500 if bad request", async () => {
    const res = await request(app).post("/login").send();

    //assert

    expect(res.status).toBe(500);
  });
});

// newtuple
describe("newtuple", () => {
  it("when recieveing objectid, relation, subjectid it should create a new tuple in the db", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
      .post("/api/newTuple")
      .set("Content-Type", "application/json")
      .set("Cookie", `sessionToken=${token}`)
      .send({
        objectId: "file:testfile",
        relation: "owner",
        subjectId: "user:testuser",
      });

    // assert
    expect(res.status).toBe(201);
    expect(res.body.message).toEqual("Member added successfully");
    expect(fakeDb.data.tupleStore.bySubject).toEqual(
      {'user:testuser': 
      [ 
        { relation: 'owner',
           objectId: 'file:testfile' 
        } 
      ]
    });
    expect(fakeDb.data.tupleStore.byObject).toEqual(
      {"file:testfile":
       [
        {
          relation: "owner",
          subjectId: "user:testuser"
        }
      ]
    });

  });
  it("should return an error if one or more arguments are missing", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
      .post("/api/newTuple")
      .set("Content-Type", "application/json")
      .set("Cookie", `sessionToken=${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toEqual("Missing required arguments");
    
    

  });
  it("should deny the request if user is not authroized to share", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype, "can").mockResolvedValue(false);

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
      .post("/api/newTuple")
      .set("Content-Type", "application/json")
      .set("Cookie", `sessionToken=${token}`)
      .send({
        objectId: "file:testfile",
        relation: "owner",
        subjectId: "user:testuser",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toEqual("User is not authorized to perform this action");      
  });
  it("should deny access if user is not authenticated", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype, "can").mockResolvedValue(false);


    const res = await request(app)
      .post("/api/newTuple")
      .set("Content-Type", "application/json")
      .send({
        objectId: "file:testfile",
        relation: "owner",
        subjectId: "user:testuser",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toEqual("User not authenticated");
  });
  it("should be able to handle improperly formatted arguemnts", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
      .post("/api/newTuple")
      .set("Content-Type", "application/json")
      .set("Cookie", `sessionToken=${token}`)
      .send({
        objectId: " ",
        relation: " ",
        subjectId: " ",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toEqual("invalid subjectID prefix");

  });

});

// save all cahnges
describe("saveAllChanges", async () => {
  it("adds relations if given proper arguments", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });


    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);
    const spy = vi.spyOn(AccessControl.prototype, "addTuple");

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/saveAllChanges")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send({
      objectId: "file:testfile", 
      addRel: 
      [
        {
        subjectId: "user:testuser",
        relations: ["owner"],
        }
      ]
    });

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(fakeDb.data.tupleStore.bySubject).toEqual(
      {'user:testuser': 
      [ 
        { relation: 'owner',
           objectId: 'file:testfile' 
        } 
      ]
    });
    expect(fakeDb.data.tupleStore.byObject).toEqual(
      {"file:testfile":
       [
        {
          relation: "owner",
          subjectId: "user:testuser"
        }
      ]
    });
  });
  it("deletes a relation if given correct arguemtns", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});


    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);
    const spy = vi.spyOn(AccessControl.prototype, "deleteTuple");

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/saveAllChanges")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send({
      objectId: "file:testfile", 
      deleteRel: 
      [
        {
        subjectId: "user:testuser",
        relations: ["owner"],
        }
      ]
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(fakeDb.data.tupleStore.bySubject).toEqual({});
    expect(fakeDb.data.tupleStore.byObject).toEqual({});
  });
  it("updates a relation if given proper arguemtns", async () => {
     // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.users.push({ id: "user:testuser2", name: "testuser2"});
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser2"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "file:testfile"});
    fakeDb.data.tupleStore.bySubject["user:testuser2"].push({relation: "viewer", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "viewer", subjectId: "user:testuser2"});


    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");
    const delspy = vi.spyOn(AccessControl.prototype, "deleteTuple");

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/saveAllChanges")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send({
      objectId: "file:testfile", 
      updateRel: 
      [
        {
        subjectId: "user:testuser2",
        oldRel: ["viewer"],
        newRel: "owner",
        }
      ]
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(addspy).toHaveBeenCalled();
    expect(delspy).toHaveBeenCalled();
    expect(fakeDb.data.tupleStore.bySubject["user:testuser2"]).toEqual([{
      relation: "owner",
      objectId: "file:testfile",
    }]);
    
    expect(fakeDb.data.tupleStore.byObject["file:testfile"]).toEqual([
      {
      relation: "owner",
      subjectId: "user:testuser",
      },
      {
      relation: "owner",
      subjectId: "user:testuser2",
      }
    ]);
  });

  it("returns tsatus 403 if unauthoprized", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });


    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(false);
    const spy = vi.spyOn(AccessControl.prototype, "addTuple");

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/saveAllChanges")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send({
      objectId: "file:testfile", 
      addRel: 
      [
        {
        subjectId: "user:testuser",
        relations: ["owner"],
        }
      ]
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toEqual("Not authorized to share!");

  });
  it("returns status 500 if given arguments are malformed", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // mock .can
    vi.spyOn(AccessControl.prototype ,"can").mockResolvedValue(true);

    // to get past getUser send along valid jwt token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/saveAllChanges")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send({
      objectId: "file:testfile", 
      updateRel: 
      [
        {
        subjectId: "user:testuser",
        }
      ]
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toEqual("Update failed");

  });
});



// foldercontent
describe("foldercontent", async () => {
  it("returns a list of all files / folders and actions a user has a direct relation to if no folder id was provided", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});



    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/folderContent").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.files).toEqual([expect.objectContaining({objectId: "file:testfile", relations: ["owner"]})]);
  });

  it("retuns a lsit of all files / folders and actions within a folder if given folderid", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.byObject["folder:testfolder"] = [];
    fakeDb.data.tupleStore.bySubject["folder:testfolder"] = [];

    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "folder:testfolder"});
    fakeDb.data.tupleStore.byObject["folder:testfolder"].push({relation: "owner", subjectId: "user:testuser"});

    fakeDb.data.tupleStore.bySubject["folder:testfolder"].push({relation: "parent", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "parent", subjectId: "folder:testfolder"});

    // mock expand user relations to control has access
    vi.spyOn(AccessControl.prototype, "expandUserRelations").mockResolvedValue(["owner"]);

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/folderContent?folderId=folder:testfolder").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.files).toEqual([expect.objectContaining({objectId: "file:testfile", relations: ["owner"]})]);

  });

  it("return a status 403 with messeage No access to this folder if folder cant be found", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.byObject["folder:testfolder"] = [];
    fakeDb.data.tupleStore.bySubject["folder:testfolder"] = [];

    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "folder:testfolder"});
    fakeDb.data.tupleStore.byObject["folder:testfolder"].push({relation: "owner", subjectId: "user:testuser"});

    fakeDb.data.tupleStore.bySubject["folder:testfolder"].push({relation: "parent", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "parent", subjectId: "folder:testfolder"});

    // expanduser relations to control  has acces
    vi.spyOn(AccessControl.prototype, "expandUserRelations").mockResolvedValue([]);

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/folderContent?folderId=folder:doesntexist").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toEqual("No access to this folder");

      
  });
  it("if user doesnt exist token validation fails and return should get staus 401 and msg Invalid session", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

     // token
    const token = jwt.sign({ userId: "user:doesntexist" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/folderContent").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toEqual("Invalid session");
    



  });
  it("does not include duplictae relations for the same object", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [
      { relation: "owner", objectId: "file:testfile" },
      { relation: "owner", objectId: "file:testfile" }, // duplicate
      { relation: "editor", objectId: "file:testfile" } // different relation
    ];

    // schema mock 
    fakeDb.data.schema = {
      file: {
        relations: {
          owner: ["read", "write"],
          editor: ["read"]
        }
      }
    };

    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/folderContent").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(200);
    
    expect(res.body.files[0].relations).toEqual(expect.arrayContaining(["owner", "editor"]));
    expect(res.body.files[0].relations).toHaveLength(2);

  });


});

//create new

describe("creatnew", async () => {
  it("creates a file with the currenjt user as owner if not folder is prvided", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    // spy
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/createNew")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send ({
      objectId: "file:testfile",
      parentFolder: "",
    });


    expect(res.status).toBe(201);
    expect(res.body.message).toEqual("Object created successfully!");
    expect(addspy).toHaveBeenCalled();
    expect(fakeDb.data.tupleStore.bySubject).toEqual({"user:testuser": [{relation: "owner", objectId: "file:testfile"}]})
    expect(fakeDb.data.tupleStore.byObject).toEqual({"file:testfile": [{relation: "owner", subjectId: "user:testuser"}]});

  });
  it("creates a file under a folder if a folder id is provided", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["folder:testfolder"] = [];

    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "folder:testfolder"});
    fakeDb.data.tupleStore.byObject["folder:testfolder"].push({relation: "owner", subjectId: "user:testuser"});

    // spy and mock
    vi.spyOn(AccessControl.prototype, "can").mockResolvedValue(true);
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/createNew")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send ({
      objectId: "file:testfile",
      parentFolder: "folder:testfolder",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toEqual("Object created successfully!");
    expect(addspy).toHaveBeenCalled();
    expect(fakeDb.data.tupleStore.bySubject["folder:testfolder"]).toContainEqual({relation: "parent",objectId: "file:testfile",});
    expect(fakeDb.data.tupleStore.byObject["file:testfile"]).toContainEqual({relation: "parent",subjectId: "folder:testfolder",});
  });
  it("should not allow for creation of duplicates", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];

    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "folder:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});

    // spy
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/createNew")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send ({
      objectId: "file:testfile",
      parentFolder: "",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toEqual("An object with this ID already exists.");
    expect(addspy).not.toHaveBeenCalled();
  });
  it("should return a status of 403 if user doesnt have permission to create file in folder", async () => {
        // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    
    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["folder:testfolder"] = [];

    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "folder:testfolder"});
    fakeDb.data.tupleStore.byObject["folder:testfolder"].push({relation: "owner", subjectId: "user:testuser"});

    // spy and mock
    vi.spyOn(AccessControl.prototype, "can").mockResolvedValue(false);
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/createNew")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send ({
      objectId: "file:testfile",
      parentFolder: "folder:testfolder",
    });

    expect(res.status).toBe(403)
    expect(res.body.message).toEqual("User does not have permission to create objects within this folder");
    expect(addspy).not.toHaveBeenCalled();
    

  });
  it("shoudl return status 400 if invalid object type gets sent", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });

    
    // spy and mock
    vi.spyOn(AccessControl.prototype, "can").mockResolvedValue(true);
    const addspy = vi.spyOn(AccessControl.prototype, "addTuple");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app)
    .post("/api/createNew")
    .set("Content-Type", "application/json")
    .set("Cookie", `sessionToken=${token}`)
    .send ({
      objectId: "invalid:testfile",
      parentFolder: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toEqual("Not a valid object type");
    expect(addspy).not.toHaveBeenCalled();

  });
});

// adminfiles
describe("adminFiles", async () => {
  it("should return a list of all files for provided userid", async () => {
     // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.users.push({id: "user:admin", name: "admin"});

    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});

    // spy
    const spy = vi.spyOn(AccessControl.prototype, "getUserRelations");

    // token
    const token = jwt.sign({ userId: "user:admin" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/adminFiles?userId=user:testuser").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.files).toEqual([{ objectId: "file:testfile", relations: ["owner"] }]);
    expect(spy).toHaveBeenCalled();
  });
  it("should return 403 if no user id is recieved", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.users.push({id: "user:admin", name: "admin"});
    
    // token
    const token = jwt.sign({ userId: "user:admin" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/adminFiles").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Bad request");
  });
  it("should disallow any use rthat isnt admin ffrom makign a request", async () => {
    // initial db state
    fakeDb.data.users.push({ id: "user:testuser", name: "testuser" });
    fakeDb.data.users.push({id: "user:admin", name: "admin"});

    fakeDb.data.tupleStore.bySubject["user:testuser"] = [];
    fakeDb.data.tupleStore.byObject["file:testfile"] = [];
    fakeDb.data.tupleStore.bySubject["user:testuser"].push({relation: "owner", objectId: "file:testfile"});
    fakeDb.data.tupleStore.byObject["file:testfile"].push({relation: "owner", subjectId: "user:testuser"});

    // spy
    const spy = vi.spyOn(AccessControl.prototype, "getUserRelations");

    // token
    const token = jwt.sign({ userId: "user:testuser" }, "rtKaslL6w4B9in");

    const res = await request(app).get("/api/adminFiles?userId=user:testuser").set("Cookie", `sessionToken=${token}`);

    expect(res.status).toBe(403);
    expect(res.body.messeage).toEqual("request denied");
    expect(spy).not.toHaveBeenCalled();
  });
  



});

