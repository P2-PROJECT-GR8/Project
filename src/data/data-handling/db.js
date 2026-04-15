import { JSONFilePreset } from "lowdb/node";

const defaultData = {
  users: [],
  groups: [],
  resources: [],
  relations: [],
};

async function initDB() {
  const db = await JSONFilePreset("db.json", defaultData);
  return db;
}
export const dbPromise = initDB();

async function getDB() {
  // gets access to the database
  const db = await dbPromise;
  return db;
}

async function getRelations() {
  const db = await getDB();
  return db.data.relations; // returns the relations array from relations.JSON
}

async function addRelation(subject, relation, object) {
  const db = await getDB();
}
