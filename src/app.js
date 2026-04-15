import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
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
const SECRET_KEY = "rtKaslL6w4B9in";

app.use(express.json());
app.use(cookieParser());

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    // If there's no token, redirect to the login page.
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    db.read();

    if (db.data.users.some((user) => user.id === decoded.userId)) {
      return next();
    }
    // If user from token is not in our db, redirect to login
    res.redirect("/");
  } catch (err) {
    // If token is invalid
    res.redirect("/");
  }
};

const redirectIfLoggedIn = (req, res, next) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    db.read();

    if (db.data.users.some((user) => user.id === decoded.userId)) {
      return res.redirect("/pages/dashboard");
    }
    next();
  } catch (error) {
    next();
  }
};

app.use("/pages", isAuthenticated);
app.get("/", redirectIfLoggedIn);

app.use(express.static(path.join(__dirname, "public")));

// Return a username to the client and logs whether the user exists in the db
app.post("/username", function (req, res) {
  console.log("recieved from index.js", req.body);
  const { userName } = req.body;

  db.read();

  if (db.data.users.some((u) => u.name === userName)) {
    console.log(`User ${userName} exists in the database`);
    console.log("New user login", userName);
    res.json({ userName: userName, status: "200" });
  } else {
    console.log(`User ${userName} does not exist in the database`);
    console.log("Valid usernames are:");
    db.data.users.forEach((element) => {
      console.log(element.name);
    });
    res.json({ status: "404" });

    // console.log(`Adding ${userName} to the database`);
    // db.update(({ users }) => {
    //   users.push({ id: `user:${userName}`, name: userName });
    // });
  }
});

// JWT sender for when a new user logs in
app.post("/login", (req, res) => {
  const { userName } = req.body;

  // Check if a user is in the users db (JSON file) and return an error if not.
  if (!db.data.users.some((user) => user.name === userName)) {
    return res.status(404).send({ message: "Username not found" });
  }

  if (!userName)
    return res.status(400).send({ message: "Username is missing" });

  const token = jwt.sign({ userId: `user:${userName}` }, SECRET_KEY, {
    expiresIn: "1h",
  });

  console.log(`Created a session for ${userName} with Id : user:${userName}`);
  res.cookie("sessionToken", token, { httpOnly: true });
  res.send({ message: `Logged in as ${userName}` });
});

app.get("/account", (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    console.log("No session found");
    return res
      .status(401)
      .send({ message: "No active session found, please log in" });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);

    const userId = decoded.userId;
    const userName = userId.split(":")[1];

    console.log(`Account request from ${userName}`);
    res.send({ message: `Logged in as ${userName}` });
  } catch (error) {
    res.status(401).send("Invalid session");
  }
});

app.post("/logout", (req, res) => {
  if (!req.cookies.sessionToken) {
    return res
      .status(401)
      .send({ message: "No active session found. Log in before loggin out" });
  } else {
    res.clearCookie("sessionToken", { httpOnly: true });
    res.send("Session deleted, user logged out");
    console.log("Session deleted");
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
