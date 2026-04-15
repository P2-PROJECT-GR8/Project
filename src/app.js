import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { validUserName } from "./routes/users.js";
import { JSONFilePreset } from "lowdb/node";
import { AccessControl } from "./routes/access.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const db = await JSONFilePreset(path.join(__dirname, "data", "db.json"), {
  users: [{ id: "", name: "" }],
  tupleStore: [
    {
      subject: "",
      relation: "",
      object: "",
    },
  ],
  schema: { definitions: {} },
});

// @ts-ignore
const accessControl = new AccessControl(db);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Return a username to the client and logs whether the user exists in the db
app.post("/username", function (req, res) {
  console.log("recieved from index.js", req.body);
  let userName = req.body.username;

  db.read();

  if (db.data.users.some((u) => u.name === userName)) {
    console.log(`User ${userName} exists in the database`);
    console.log("New user login", userName);
    res.json({ username: userName, status: "200" });
  } else {
    console.log(`User ${userName} does not exist in the database`);
    console.log("Valid usernames are:");
    db.data.users.forEach((element) => {
      console.log(element.name);
    });

    // console.log(`Adding ${userName} to the database`);
    // db.update(({ users }) => {
    //   users.push({ id: `user:${userName}`, name: userName });
    // });

    res.json({ status: "404" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

// console.log(
//   "Jeff's relations to file:1:",
//   await accessControl.expandUserRelations("user:jeff", "file:1"),
// );
// console.log(
//   "Can Alice edit file:1?",
//   await accessControl.can("alice", "edit", "file:1"),
// );
// console.log(
//   "Can Bob delete file:1?",
//   await accessControl.can("bob", "delete", "file:1"),
// );
