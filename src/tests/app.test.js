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

// must be imported afer mock
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

describe("login test", () => {
  it("returns username not found when given non existing username", async () => {
    const res = await request(app)
      .post("/login")
      .send({ userName: "testuser" });

    expect(res.status).toBe(404);
  });
});
