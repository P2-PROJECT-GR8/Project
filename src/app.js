import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from "lowdb/node";
import { AccessControl } from "./routes/access.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const db = await JSONFilePreset(path.join(__dirname, "..", "data", "db.json"), {
  users: [{ id: "", name: "" }],
  tupleStore: {
    byObject: {},
    bySubject: {},
  },
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

/**
 * Function for getting the requesting users id and name from the db
 * Wrap this in a trycatch to handle any errors.
 * @param {Object} req - An http request containing a JWT token
 * @returns - an object with a users name and id
 */
const getUser = (req) => {
  const token = req.cookies.sessionToken;
  if (!token) throw new Error("Token is null or undefined");
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    db.read();

    const user = db.data.users.find((user) => user.id === decoded.userId);
    if (user) return user; // .find returns the object or undefined
    throw new Error("No user with the provided ID");
  } catch (error) {
    throw error;
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
    if (decoded.userId === "user:admin") {
      return res.redirect("/pages/admin/admin.html");
    } else if (db.data.users.some((user) => user.id === decoded.userId)) {
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
  const userName = req.body.userName.toLowerCase();

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

app.get("/api/me", (req, res) => {
  let user;
  try {
    user = getUser(req);
  } catch (error) {
    res.status(401).send("No user found");
    return console.error(error);
  }
  res.json(user);
});

app.post("/register", async (req, res) => {
  const { userName, login } = req.body;
  const normalizedUserName = userName?.toLowerCase().trim();

  if (!normalizedUserName) {
    return res.status(400).json({ message: "Username is required." });
  }

  if (normalizedUserName.length < 2 || normalizedUserName.length > 10) {
    return res.status(400).json({
      message:
        "Invalid username. Usernames must be between 2 and 10 characters long.",
    });
  }

  await db.read();

  if (db.data.users.some((u) => u.name === normalizedUserName)) {
    return res
      .status(409)
      .json({ message: "Username already exists, please choose another one" });
  }

  await db.update(({ users }) => {
    users.push({ id: `user:${normalizedUserName}`, name: normalizedUserName });
  });

  if (login) {
    const token = jwt.sign(
      { userId: `user:${normalizedUserName}` },
      SECRET_KEY,
      {
        expiresIn: "1h",
      },
    );
    res.cookie("sessionToken", token, { httpOnly: true });
    return res.json({
      message: `Registered and logged in as ${normalizedUserName}`,
    });
  }

  return res.status(201).json({ message: "User registered successfully!" });
});

app.post("/relatedUsers", async (req, res) => {
  let user;
  try {
    user = getUser(req);
  } catch (error) {
    console.error(error);
    return res.status(401).send("User not authenticated");
  }
  const { objectId } = req.body;
  if (!objectId) {
    return res.status(400).send("Object ID is missing");
  }

  const relatedUsers = await accessControl.getObjectRelations(objectId);
  res.send({
    relatedUsers: relatedUsers,
  });
});

// JWT sender for when a new user logs in
app.post("/login", (req, res) => {
  const userName = req.body.userName.toLowerCase();

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

app.get("/files", async (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    const userRelations = await accessControl.getUserRelations(userId);
    // console.log(userRelations);

    res.json({ files: userRelations });
  } catch (error) {
    res.status(401).send({ message: "Invalid session" });
  }
});

app.post("/api/newTuple", async (req, res) => {
  let currentUser;
  try {
    currentUser = getUser(req);
  } catch (err) {
    console.error(err);
    return res.status(401).send({ message: "User not authenticated" });
  }
  const { objectId, relation, subjectId } = req.body;
  const canShare = await accessControl.can(currentUser.name, "share", objectId);
  if (!canShare) {
    return res
      .status(403)
      .send({ message: "User is not authorized to perform this action" });
  }
  await db.read();
  // check if the target user and object exist in the database
  const subjectType = subjectId.split(":")[0];
  if (subjectType === "user") {
    const userExists = db.data.users.some((user) => user.id === subjectId);
    if (!userExists) {
      return res.status(404).send({ message: "Invited user does not exist." });
    }
  } else if (subjectType === "folder" || subjectType === "file") {
    // Check if the folder/file exists as a subject or object in any tuple
    const folderExists =
      Object.prototype.hasOwnProperty.call(
        db.data.tupleStore.bySubject,
        subjectId,
      ) ||
      Object.prototype.hasOwnProperty.call(
        db.data.tupleStore.byObject,
        subjectId,
      );

    if (!folderExists) {
      return res.status(404).send({ message: `${subjectType} does not exist` });
    }
  } else {
    return res.status(404).send({ message: "invalid subjectID prefix" });
  }

  try {
    accessControl.addTuple(subjectId, relation, objectId);
  } catch (error) {
    await db.read(); // Ensure we have the latest state
    const tupleExistsAfterAttempt = db.data.tupleStore.byObject[objectId]?.some(
      (t) => t.subjectId === subjectId && t.relation === relation,
    );
    if (tupleExistsAfterAttempt) {
      return res.status(409).send({ message: "Relation already exists." });
    }
    return res
      .status(500)
      .send({ message: "Failed to add relation due to an unexpected error." });
  }

  res.status(201).send({ message: "Member added successfully" });
});
app.post("/api/deleteTuple", async (req, res) => {
  const { objectId, relations, subjectId } = req.body;
  let currentUser;
  try {
    currentUser = getUser(req);
  } catch (err) {
    console.error(err);
    return res.status(401).send({ message: "User not authenticated" });
  }
  // Check if current user is athorized to delete relations
  const canDelete = await accessControl.can(
    currentUser.name,
    "delete",
    objectId,
  );
  if (!canDelete) {
    return res
      .status(403)
      .send({ message: "User is not authorized to perform this action" });
  }

  for (const rel of relations) {
    accessControl.deleteTuple(subjectId, rel, objectId);
  }

  return res.json({ success: true });
});

app.get("/api/userNames", (req, res) => {
  db.read();
  const userNames = db.data.users.map((user) => {
    return user.name.charAt(0).toUpperCase() + user.name.slice(1);
  });
  res.send({ userNames: userNames });
});

// return the list of paths from given user to given object
app.get("/api/adminRelations", async (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // only allow admin to to utilize this endpoint.
    if (getUser(req).id !== "user:admin") {
      return res.status(403).send({ messeage: "request denied" });
    }

    // changes to be made

    const userId = req.query.userId;
    const objectId = req.query.objectId;

    const paths = accessControl.locatePaths(userId, objectId);
    // console.log(userRelations);

    res.json({ paths: paths });
  } catch (error) {
    return res.status(401).send({ message: "Invalid session" });
  }
});

// return the list of files for the provided userId if user is admin
app.get("/api/adminFiles", async (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // only allow admin to to utilize this endpoint.
    if (getUser(req).id !== "user:admin") {
      return res.status(403).send({ messeage: "request denied" });
    }
    const targetUser = req.query.userId;

    const userRelations = await accessControl.getUserRelations(targetUser);
    console.log(userRelations);

    res.json({ files: userRelations });
  } catch (error) {
    return res.status(401).send({ message: "Invalid session" });
  }
});

app.get("/api/isAdmin", async (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  if (getUser(req).id !== "user:admin") {
    return res.status(403).send({ messeage: "not admin" });
  }
  res.json({ status: true });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

// accessControl.addTuple("user:jeff", "owner", "file:1");
// accessControl.addTuple("user:alice", "editor", "file:1");
// accessControl.addTuple("user:jeff", "veiwer", "file:1");

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

// console.log("Attempting tuple deletion");
// accessControl.deleteTuple("user:alice", "editor", "file:1");

// console.log(
//   "Can Alice edit file:1 now?",
//   await accessControl.can("alice", "edit", "file:1"),
// );
