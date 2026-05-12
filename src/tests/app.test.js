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
let fakedb;

vi.mock("lowdb/node", async () => {
  return {
    JSONFilePreset: vi.fn(async () => fakeDb),
  };
});

// must be imported afer mock
import { app } from "../app.js";

function createFakeDb() {
  return {
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
  };
}

// tests

describe("login test", async () => {
  beforeEach(() => {
    fakedb = createFakeDb();
  });

  it("returns username not found when given non existing username", async () => {
    const res = await request(app).get(`/login?user:testuser`);

    expect(res.status).toBe(404);
  });
});
