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

// delete tuple

// folder content (maybe do this one  instead of less complicated endpoint)


//create new
